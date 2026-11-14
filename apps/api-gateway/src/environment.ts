import { config } from 'dotenv';
import { resolve } from 'node:path';
import { z } from 'zod';

config({ path: [resolve(process.cwd(), '../../.env'), resolve(process.cwd(), '.env')] });

const EnvironmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce
    .number()
    .int()
    .min(1)
    .max(65535)
    .default(Number(process.env.SERVICE_PORT ?? 3000)),
  DATABASE_URL: z.string().min(1).optional(),
  AMQP_URL: z.string().min(1),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173')
    .transform((value) => value.split(',').map((origin) => origin.trim()).filter(Boolean)),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  IDENTITY_SERVICE_URL: z.string().url().default('http://localhost:3101'),
  SELLER_SERVICE_URL: z.string().url().default('http://localhost:3102'),
  CATALOGUE_SERVICE_URL: z.string().url().default('http://localhost:3103'),
  INVENTORY_SERVICE_URL: z.string().url().default('http://localhost:3104'),
  COMMERCE_SERVICE_URL: z.string().url().default('http://localhost:3105'),
  PAYMENT_SERVICE_URL: z.string().url().default('http://localhost:3106'),
  FULFILMENT_SERVICE_URL: z.string().url().default('http://localhost:3107'),
});

export function loadEnvironment() {
  const result = EnvironmentSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => issue.path.join('.') + ' ' + issue.message)
      .join('; ');
    throw new Error('Invalid service environment: ' + issues);
  }
  return result.data;
}
