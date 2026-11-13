import { config } from 'dotenv';
import { resolve } from 'node:path';
import { z } from 'zod';

config({ path: [resolve(process.cwd(), '../../.env'), resolve(process.cwd(), '.env')] });

const serviceName = 'identity';
const cookieSecureBoolean = z
  .enum(['true', 'false'])
  .default(process.env.NODE_ENV === 'production' ? 'true' : 'false')
  .transform((value) => value === 'true');
const smtpSecureBoolean = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');

const EnvironmentSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce
      .number()
      .int()
      .min(1)
      .max(65535)
      .default(Number(process.env.IDENTITY_PORT ?? process.env.SERVICE_PORT ?? 3101)),
    DATABASE_URL: z.string().min(1).optional(),
    AMQP_URL: z.string().min(1),
    CORS_ORIGINS: z
      .string()
      .default('http://localhost:5173')
      .transform((value) => value.split(',').map((origin) => origin.trim()).filter(Boolean)),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    ACCESS_TOKEN_ISSUER: z.string().min(1).default('http://localhost:3000'),
    ACCESS_TOKEN_AUDIENCE: z.string().min(1).default('sokolink-web'),
    ACCESS_TOKEN_SIGNING_KEY: z.string().min(32, 'must contain at least 32 characters'),
    ACCESS_TOKEN_SIGNING_KEY_PREVIOUS: z.string().min(32).optional(),
    ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().min(60).max(3600).default(900),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(30),
    COOKIE_SECURE: cookieSecureBoolean,
    WEB_APP_URL: z.string().url().default('http://localhost:5173'),
    AUTH_MAX_FAILED_LOGINS: z.coerce.number().int().min(3).max(20).default(5),
    AUTH_LOCK_MINUTES: z.coerce.number().int().min(1).max(1440).default(15),
    REGISTRATION_RATE_LIMIT: z.coerce.number().int().min(1).max(100).default(10),
    REGISTRATION_RATE_WINDOW_MINUTES: z.coerce.number().int().min(1).max(1440).default(60),
    VERIFICATION_RESEND_SECONDS: z.coerce.number().int().min(30).max(3600).default(60),
    VERIFICATION_MAX_PER_HOUR: z.coerce.number().int().min(1).max(20).default(5),
    EMAIL_VERIFICATION_TTL_MINUTES: z.coerce.number().int().min(5).max(10080).default(1440),
    PHONE_VERIFICATION_TTL_MINUTES: z.coerce.number().int().min(2).max(60).default(10),
    PASSWORD_RESET_TTL_MINUTES: z.coerce.number().int().min(5).max(1440).default(60),
    SMTP_HOST: z.string().min(1).optional(),
    SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
    SMTP_SECURE: smtpSecureBoolean,
    SMTP_USER: z.string().min(1).optional(),
    SMTP_PASSWORD: z.string().min(1).optional(),
    SMTP_FROM: z.string().min(3).default('SokoLink <no-reply@sokolink.local>'),
    MAIL_OUTBOX_DIR: z.string().min(1).default('/tmp/sokolink-mail'),
    SMS_PROVIDER: z.enum(['development-file']).optional(),
    SMS_OUTBOX_DIR: z.string().min(1).default('/tmp/sokolink-sms'),
  })
  .superRefine((environment, context) => {
    if (environment.NODE_ENV === 'production') {
      if (!environment.SMTP_HOST) {
        context.addIssue({
          code: 'custom',
          path: ['SMTP_HOST'],
          message: 'is required in production so verification and reset email can be delivered',
        });
      }
      if (!environment.SMS_PROVIDER) {
        context.addIssue({
          code: 'custom',
          path: ['SMS_PROVIDER'],
          message: 'is required in production so phone verification can be delivered',
        });
      }
    }
  });

export type IdentityEnvironment = z.infer<typeof EnvironmentSchema>;

export function loadEnvironment(): IdentityEnvironment {
  if (!process.env.DATABASE_URL) {
    const password = process.env[serviceName.toUpperCase() + '_DB_PASSWORD'];
    if (password) {
      process.env.DATABASE_URL =
        'postgresql://' +
        serviceName +
        '_owner:' +
        encodeURIComponent(password) +
        '@localhost:' +
        (process.env.POSTGRES_PORT ?? '5432') +
        '/' +
        serviceName +
        '_db?schema=public';
    }
  }
  const result = EnvironmentSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => issue.path.join('.') + ' ' + issue.message)
      .join('; ');
    throw new Error('Invalid service environment: ' + issues);
  }
  return result.data;
}
