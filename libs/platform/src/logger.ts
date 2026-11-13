import pino from 'pino';

export function createLogger(service: string) {
  return pino({
    name: service,
    level: process.env.LOG_LEVEL ?? 'info',
    redact: { paths: ['req.headers.authorization', 'password', '*.password', '*.token', '*.secret'], censor: '[REDACTED]' },
    timestamp: pino.stdTimeFunctions.isoTime,
  });
}
