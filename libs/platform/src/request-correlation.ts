import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

const SAFE_CORRELATION_ID = /^[A-Za-z0-9._:-]{1,128}$/;

export function correlationMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header('x-correlation-id');
  const correlationId = incoming && SAFE_CORRELATION_ID.test(incoming) ? incoming : randomUUID();
  res.setHeader('x-correlation-id', correlationId);
  res.locals.correlationId = correlationId;
  next();
}
