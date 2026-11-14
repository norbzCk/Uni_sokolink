const assert = require('node:assert/strict');
const { readdir, readFile } = require('node:fs/promises');
const path = require('node:path');
const { config } = require('dotenv');

config({ path: path.resolve(__dirname, '../../../.env') });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.DATABASE_URL ||
        `postgresql://identity_owner:${encodeURIComponent(process.env.IDENTITY_DB_PASSWORD)}@127.0.0.1:${process.env.POSTGRES_PORT || '5432'}/identity_db?schema=public`,
    },
  },
});

const baseUrl = process.env.E2E_BASE_URL || 'http://127.0.0.1:3000';
const mailOutbox = process.env.MAIL_OUTBOX_DIR || '/tmp/sokolink-mail';
const smsOutbox = process.env.SMS_OUTBOX_DIR || '/tmp/sokolink-sms';
const email = `phaseone-${Date.now()}@example.com`;
const phone = `+2557${Date.now().toString().slice(-8)}`;
const initialPassword = 'M3l0n!River_89012';
const resetPassword = 'C4ribbean!Stone_0981';
const changedPassword = 'Zanzibar!Palm_2047';

function check(condition, message) {
  assert.ok(condition, message);
}

function hasSensitiveKey(value) {
  if (Array.isArray(value)) return value.some(hasSensitiveKey);
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value).some(
    ([key, nested]) => /password|token|secret|hash/i.test(key) || hasSensitiveKey(nested),
  );
}

async function request(route, { method = 'GET', body, token, cookie } = {}) {
  const headers = new Headers({ accept: 'application/json' });
  if (body !== undefined) headers.set('content-type', 'application/json');
  if (token) headers.set('authorization', `Bearer ${token}`);
  if (cookie) headers.set('cookie', cookie);
  const response = await fetch(`${baseUrl}/api/v1${route}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  const setCookie = response.headers.get('set-cookie');
  const refreshCookie = setCookie?.split(';', 1)[0] ?? cookie;
  return { status: response.status, payload, cookie: refreshCookie };
}

async function findOutboxMessage(directory, recipient, contentMarker) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const names = await readdir(directory).catch(() => []);
    for (const name of names.sort().reverse()) {
      const content = await readFile(path.join(directory, name), 'utf8').catch(() => '');
      if (content.includes(`To: ${recipient}`) && content.includes(contentMarker)) return content;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for ${contentMarker} delivery to ${recipient}`);
}

function tokenFromMessage(message, route) {
  const match = message.match(new RegExp(`${route}\\?token=([^&\\s"<>]+)`));
  check(match, `Verification link for ${route} was not found`);
  return decodeURIComponent(match[1]);
}

async function requireStatus(route, options, status, label) {
  const result = await request(route, options);
  assert.equal(result.status, status, `${label}: expected HTTP ${status}, got ${result.status}`);
  return result;
}

async function main() {
  let userId;
  const registration = {
    fullName: 'Amina User',
    email,
    phone,
    password: initialPassword,
    passwordConfirmation: initialPassword,
  };

  try {
    const malicious = await request('/auth/register', {
      method: 'POST',
      body: { ...registration, role: 'SUPER_ADMIN' },
    });
    assert.equal(malicious.status, 400, 'registration must reject caller-supplied role fields');

    const registered = await requireStatus('/auth/register', {
      method: 'POST',
      body: registration,
    }, 201, 'registration');
    userId = registered.payload.userId;
    assert.equal(registered.payload.status, 'PENDING_VERIFICATION');
    assert.equal(registered.payload.role, undefined, 'registration must not return or grant a privileged role');
    const storedAccount = await prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true },
    });
    assert.deepEqual(storedAccount.roles.map((assignment) => assignment.role), ['CUSTOMER']);

    const duplicate = await requireStatus('/auth/register', {
      method: 'POST',
      body: registration,
    }, 409, 'duplicate registration');
    assert.equal(duplicate.payload.code, 'ACCOUNT_EXISTS');

    const emailMessage = await findOutboxMessage(mailOutbox, email, 'verify-email?token=');
    const emailToken = tokenFromMessage(emailMessage, 'verify-email');
    await requireStatus('/auth/verify-email', {
      method: 'POST',
      body: { token: emailToken },
    }, 200, 'email verification');
    await requireStatus('/auth/verify-email', {
      method: 'POST',
      body: { token: emailToken },
    }, 400, 'single-use email verification');

    const phoneUnverifiedLogin = await request('/auth/login', {
      method: 'POST',
      body: { identifier: phone, password: initialPassword },
    });
    assert.equal(phoneUnverifiedLogin.status, 403, 'phone login must require phone verification');

    const smsMessage = await findOutboxMessage(smsOutbox, phone, 'verification code:');
    const code = smsMessage.match(/verification code: (\d{6})/i)?.[1];
    check(code, 'development SMS outbox did not contain a six digit code');

    const emailLogin = await requireStatus('/auth/login', {
      method: 'POST',
      body: { identifier: email, password: initialPassword },
    }, 200, 'email login');
    const emailAccessToken = emailLogin.payload.accessToken;
    const emailCookie = emailLogin.cookie;
    check(emailCookie?.startsWith('sokolink_refresh='), 'login did not set the refresh cookie');
    await requireStatus('/auth/phone/verify', {
      method: 'POST',
      token: emailAccessToken,
      body: { code },
    }, 200, 'phone verification');

    const phoneLogin = await requireStatus('/auth/login', {
      method: 'POST',
      body: { identifier: phone, password: initialPassword },
    }, 200, 'phone login');
    const phoneCookie1 = phoneLogin.cookie;
    const phoneToken = phoneLogin.payload.accessToken;

    const profile = await requireStatus('/users/me', { token: phoneToken }, 200, 'profile read');
    assert.equal(profile.payload.user.id, userId);
    const profileUpdate = await requireStatus('/users/me', {
      method: 'PATCH',
      token: phoneToken,
      body: { fullName: 'Amina Verified' },
    }, 200, 'profile update');
    assert.equal(profileUpdate.payload.user.fullName, 'Amina Verified');
    check(!JSON.stringify(profileUpdate.payload).includes('passwordHash'), 'profile leaked credential data');

    const sessions = await requireStatus('/auth/sessions', {
      token: phoneToken,
      cookie: phoneCookie1,
    }, 200, 'session list');
    check(sessions.payload.sessions.some((session) => session.current), 'current session was not identified');
    check(!JSON.stringify(sessions.payload).includes('tokenHash'), 'session list leaked refresh-token hashes');

    const rotated = await requireStatus('/auth/refresh', {
      method: 'POST',
      cookie: phoneCookie1,
    }, 200, 'refresh rotation');
    check(rotated.cookie && rotated.cookie !== phoneCookie1, 'refresh cookie was not rotated');
    const replay = await request('/auth/refresh', { method: 'POST', cookie: phoneCookie1 });
    assert.equal(replay.status, 401, 'replayed refresh token must be rejected');
    assert.equal(replay.payload.code, 'SESSION_REUSE_DETECTED');
    await requireStatus('/users/me', { token: rotated.payload.accessToken }, 401,
      'access token revoked after refresh replay');
    await requireStatus('/auth/refresh', {
      method: 'POST',
      cookie: rotated.cookie,
    }, 401, 'family revocation after replay');

    const resetRequest = await requireStatus('/auth/forgot-password', {
      method: 'POST',
      body: { email },
    }, 202, 'password-reset request');
    check(resetRequest.payload.message, 'password-reset request did not return a generic response');
    const unknownResetRequest = await requireStatus('/auth/forgot-password', {
      method: 'POST',
      body: { email: `missing-${Date.now()}@example.com` },
    }, 202, 'unknown-account password-reset request');
    assert.equal(unknownResetRequest.payload.message, resetRequest.payload.message);
    const resetMessage = await findOutboxMessage(mailOutbox, email, 'reset-password?token=');
    const resetToken = tokenFromMessage(resetMessage, 'reset-password');
    await requireStatus('/auth/reset-password', {
      method: 'POST',
      body: { token: resetToken, password: resetPassword, passwordConfirmation: resetPassword },
    }, 200, 'password reset');
    await requireStatus('/auth/reset-password', {
      method: 'POST',
      body: { token: resetToken, password: resetPassword, passwordConfirmation: resetPassword },
    }, 400, 'single-use password reset token');
    const oldPasswordLogin = await request('/auth/login', {
      method: 'POST',
      body: { identifier: email, password: initialPassword },
    });
    assert.equal(oldPasswordLogin.status, 401, 'password reset did not replace the old password');

    const resetLogin = await requireStatus('/auth/login', {
      method: 'POST',
      body: { identifier: email, password: resetPassword },
    }, 200, 'login after password reset');
    await requireStatus('/auth/change-password', {
      method: 'POST',
      token: resetLogin.payload.accessToken,
      cookie: resetLogin.cookie,
      body: {
        currentPassword: resetPassword,
        password: changedPassword,
        passwordConfirmation: changedPassword,
      },
    }, 204, 'authenticated password change');
    await requireStatus('/users/me', { token: resetLogin.payload.accessToken }, 401,
      'access token revoked after password change');
    await requireStatus('/auth/refresh', {
      method: 'POST',
      cookie: resetLogin.cookie,
    }, 401, 'session revocation after password change');

    const changedLogin = await requireStatus('/auth/login', {
      method: 'POST',
      body: { identifier: email, password: changedPassword },
    }, 200, 'login after authenticated password change');
    const logoutAllSecond = await requireStatus('/auth/login', {
      method: 'POST',
      body: { identifier: email, password: changedPassword },
    }, 200, 'second session login');
    await requireStatus('/auth/logout-all', {
      method: 'POST',
      token: changedLogin.payload.accessToken,
      cookie: changedLogin.cookie,
    }, 204, 'logout all');
    await requireStatus('/users/me', { token: changedLogin.payload.accessToken }, 401,
      'access token revoked by logout-all');
    await requireStatus('/auth/refresh', {
      method: 'POST',
      cookie: changedLogin.cookie,
    }, 401, 'current session revoked by logout-all');
    await requireStatus('/auth/refresh', {
      method: 'POST',
      cookie: logoutAllSecond.cookie,
    }, 401, 'other session revoked by logout-all');

    const logoutLogin = await requireStatus('/auth/login', {
      method: 'POST',
      body: { identifier: email, password: changedPassword },
    }, 200, 'login before logout');
    await requireStatus('/auth/logout', {
      method: 'POST',
      cookie: logoutLogin.cookie,
    }, 204, 'logout');
    await requireStatus('/users/me', { token: logoutLogin.payload.accessToken }, 401,
      'access token revoked by logout');
    await requireStatus('/auth/refresh', {
      method: 'POST',
      cookie: logoutLogin.cookie,
    }, 401, 'refresh after logout');

    const requiredEventTypes = [
      'user.registered',
      'user.email_verified',
      'user.account_status_changed',
      'user.phone_verified',
      'user.password_changed',
    ];
    const eventDeadline = Date.now() + 10_000;
    let userEvents = [];
    while (Date.now() < eventDeadline) {
      const events = await prisma.outboxEvent.findMany({
        where: { type: { in: requiredEventTypes } },
        orderBy: { occurredAt: 'asc' },
        take: 200,
      });
      userEvents = events.filter((event) => event.payload?.userId === userId);
      const publishedTypes = new Set(userEvents.filter((event) => event.publishedAt).map((event) => event.type));
      if (requiredEventTypes.every((type) => publishedTypes.has(type))) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    const publishedTypes = new Set(userEvents.filter((event) => event.publishedAt).map((event) => event.type));
    for (const type of requiredEventTypes) {
      check(publishedTypes.has(type), `outbox event ${type} was not confirmed by RabbitMQ`);
    }
    check(
      !userEvents.some((event) => hasSensitiveKey(event.payload)),
      'identity event payload contains credential or verification secret material',
    );

    console.log('Identity E2E passed: registration, duplicate rejection, email/phone verification, email/phone login, profile read/update, session listing, rotation/replay revocation, password reset/change, logout-all/logout and RabbitMQ outbox publication.');
  } finally {
    if (userId) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => undefined);
    }
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Identity E2E failed');
  process.exitCode = 1;
});
