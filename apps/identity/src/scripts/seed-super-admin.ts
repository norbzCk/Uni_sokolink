import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { createHmac } from 'node:crypto';
import { loadEnvironment } from '../environment';
import { isValidEmail, isValidPhone, normalizeEmail, normalizePhone, validatePasswordPolicy } from '../auth/validation';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const environment = loadEnvironment();
  if (!environment.DATABASE_URL) {
    throw new Error('DATABASE_URL or IDENTITY_DB_PASSWORD is required.');
  }
  if (environment.NODE_ENV === 'production' && process.env.ALLOW_SUPER_ADMIN_SEED !== 'true') {
    throw new Error(
      'Refusing to seed a SUPER_ADMIN in production without ALLOW_SUPER_ADMIN_SEED=true.',
    );
  }

  const fullName = process.env.SUPER_ADMIN_FULL_NAME?.trim() ?? '';
  const email = process.env.SUPER_ADMIN_EMAIL?.trim() ?? '';
  const phone = process.env.SUPER_ADMIN_PHONE?.trim() ?? '';
  const password = process.env.SUPER_ADMIN_PASSWORD ?? '';

  if (!fullName || !email || !phone || !password) {
    throw new Error(
      'Set SUPER_ADMIN_FULL_NAME, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PHONE and SUPER_ADMIN_PASSWORD.',
    );
  }
  if (!isValidEmail(email)) {
    throw new Error('SUPER_ADMIN_EMAIL is not a valid email address.');
  }
  if (!isValidPhone(phone)) {
    throw new Error('SUPER_ADMIN_PHONE is not a valid phone number.');
  }
  const issues = validatePasswordPolicy(password, { email, fullName });
  if (issues.length > 0) {
    throw new Error('SUPER_ADMIN_PASSWORD is not strong enough: ' + issues.join(' '));
  }

  const emailNormalized = normalizeEmail(email);
  const phoneNormalized = normalizePhone(phone);
  const existing = await prisma.user.findFirst({
    where: { OR: [{ emailNormalized }, { phoneNormalized }] },
    select: { id: true },
  });
  if (existing) {
    throw new Error('An account already uses this email address or phone number.');
  }

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
    hashLength: 32,
  });
  const now = new Date();

  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      emailNormalized,
      phone,
      phoneNormalized,
      passwordHash,
      status: 'ACTIVE',
      emailVerifiedAt: now,
      phoneVerifiedAt: now,
      roles: { create: { role: 'SUPER_ADMIN' } },
    },
    select: { id: true, email: true },
  });

  await prisma.auditLog.create({
    data: {
      actorId: null,
      action: 'identity.super_admin.seeded',
      targetType: 'user',
      targetId: user.id,
      metadata: {
        emailHash: createHmac('sha256', environment.ACCESS_TOKEN_SIGNING_KEY)
          .update(emailNormalized)
          .digest('hex'),
      },
    },
  });

  console.log('Created SUPER_ADMIN account ' + user.email + ' (' + user.id + ').');
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Seeding failed.');
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
