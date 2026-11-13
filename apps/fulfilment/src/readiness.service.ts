import { Injectable } from '@nestjs/common';
import amqp from 'amqplib';
import { Client } from 'pg';
import { loadEnvironment } from './environment';

@Injectable()
export class ReadinessService {
  async check(): Promise<Record<string, 'ok' | 'failed'>> {
    const env = loadEnvironment();
    const checks: Record<string, 'ok' | 'failed'> = {};

    if (env.DATABASE_URL) {
      const database = new Client({ connectionString: env.DATABASE_URL, connectionTimeoutMillis: 1500 });
      try {
        await database.connect();
        await database.query('SELECT 1');
        checks.postgres = 'ok';
      } catch {
        checks.postgres = 'failed';
      } finally {
        await database.end().catch(() => undefined);
      }
    }

    try {
      const connection = await amqp.connect(env.AMQP_URL, { timeout: 1500 });
      await connection.close();
      checks.rabbitmq = 'ok';
    } catch {
      checks.rabbitmq = 'failed';
    }
    return checks;
  }
}
