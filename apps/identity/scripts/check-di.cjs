'use strict';

const path = require('node:path');
const fs = require('node:fs');

const distEntry = path.join(__dirname, '..', 'dist', 'app.module.js');

if (!fs.existsSync(distEntry)) {
  console.log('[check-di] dist/app.module.js not found; run "npm run build --workspace=@sokolink/identity" first. Skipping.');
  process.exit(0);
}

const { Test } = require('@nestjs/testing');
const { AppModule } = require('../dist/app.module');
const { AuthService } = require('../dist/auth/auth.service');
const { SessionService } = require('../dist/auth/services/session.service');
const { VerificationService } = require('../dist/auth/services/verification.service');
const { PrismaService } = require('../dist/prisma/prisma.service');
const { IDENTITY_ENVIRONMENT } = require('../dist/environment.provider');

const environment = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  AMQP_URL: 'amqp://guest:guest@localhost:5672',
  CORS_ORIGINS: ['http://localhost:5173'],
  ACCESS_TOKEN_ISSUER: 'http://localhost:3000',
  ACCESS_TOKEN_AUDIENCE: 'sokolink-web',
  ACCESS_TOKEN_SIGNING_KEY: 'a'.repeat(48),
  ACCESS_TOKEN_TTL_SECONDS: 900,
  REFRESH_TOKEN_TTL_DAYS: 30,
  COOKIE_SECURE: false,
  WEB_APP_URL: 'http://localhost:5173',
  AUTH_MAX_FAILED_LOGINS: 5,
  AUTH_LOCK_MINUTES: 15,
  REGISTRATION_RATE_LIMIT: 10,
  REGISTRATION_RATE_WINDOW_MINUTES: 60,
  VERIFICATION_RESEND_SECONDS: 60,
  VERIFICATION_MAX_PER_HOUR: 5,
  EMAIL_VERIFICATION_TTL_MINUTES: 1440,
  PHONE_VERIFICATION_TTL_MINUTES: 10,
  PASSWORD_RESET_TTL_MINUTES: 60,
  SMTP_PORT: 587,
  SMTP_SECURE: false,
  SMTP_FROM: 'SokoLink <no-reply@sokolink.local>',
  MAIL_OUTBOX_DIR: '/tmp/sokolink-mail',
  SMS_OUTBOX_DIR: '/tmp/sokolink-sms',
};

function assertMethod(instance, method, label) {
  if (typeof instance[method] !== 'function') {
    throw new Error(`${label}.${method} is not a function; dependency injection likely failed.`);
  }
}

async function main() {
  const params = Reflect.getMetadata('design:paramtypes', SessionService) || [];
  if (params.length === 0) {
    throw new Error('Decorator metadata is missing; build with tsc so Nest can resolve dependencies.');
  }

  const prisma = { $connect: async () => {}, $disconnect: async () => {} };
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService)
    .useValue(prisma)
    .overrideProvider(IDENTITY_ENVIRONMENT)
    .useValue(environment)
    .compile();

  assertMethod(moduleRef.get(AuthService), 'register', 'AuthService');
  assertMethod(moduleRef.get(SessionService), 'rotate', 'SessionService');
  assertMethod(moduleRef.get(VerificationService), 'issuePhoneVerification', 'VerificationService');

  await moduleRef.close();
  console.log('[check-di] identity application context resolved successfully.');
}

main().catch((error) => {
  console.error('[check-di] failed:', error);
  process.exit(1);
});
