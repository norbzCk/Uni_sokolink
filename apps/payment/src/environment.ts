import { config } from 'dotenv';
import { resolve } from 'node:path';
import { z } from 'zod';

config({ path: resolve(process.cwd(), '../../.env') });
const serviceName = 'payment';
const EnvironmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(Number(process.env.PAYMENT_PORT ?? process.env.SERVICE_PORT ?? 3106)),
  DATABASE_URL: z.string().min(1).optional(),
  AMQP_URL: z.string().min(1),
  CORS_ORIGINS: z.string().default('http://localhost:5173').transform((value) => value.split(',').map((origin) => origin.trim())),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

export function loadEnvironment() {
  if (!process.env.DATABASE_URL) {
    const password = process.env[serviceName.toUpperCase() + '_DB_PASSWORD'];
    if (password) {
      process.env.DATABASE_URL = 'postgresql://' + serviceName + '_owner:' + encodeURIComponent(password) + '@localhost:' + (process.env.POSTGRES_PORT ?? '5432') + '/' + serviceName + '_db?schema=public';
    }
  }
  const result = EnvironmentSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => issue.path.join('.') + ' ' + issue.message).join('; ');
    throw new Error('Invalid service environment: ' + issues);
  }
  return result.data;
}
