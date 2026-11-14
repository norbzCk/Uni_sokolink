import {
  Catch,
  HttpException,
  HttpStatus,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { Logger } from 'pino';

interface ErrorDetails {
  message?: unknown;
  code?: unknown;
  fieldErrors?: unknown;
  retryAfter?: unknown;
  checks?: unknown;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly logger: Logger,
    private readonly service: string,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const correlationId =
      response.locals.correlationId ?? request.header('x-correlation-id') ?? 'unknown';
    const details = exception instanceof HttpException ? exception.getResponse() : undefined;

    if (status >= 500) {
      this.logger.error(
        { err: exception, service: this.service, correlationId, path: request.path },
        'request failed',
      );
    }

    let message = 'Request failed';
    let code: string | undefined;
    let fieldErrors: unknown;
    let retryAfter: unknown;
    let checks: unknown;

    if (typeof details === 'string') {
      message = details;
    } else if (details && typeof details === 'object') {
      const record = details as ErrorDetails;
      if (Array.isArray(record.message)) {
        message = 'Validation failed';
        fieldErrors = record.message;
      } else if (typeof record.message === 'string') {
        message = record.message;
      }
      if (typeof record.code === 'string') {
        code = record.code;
      }
      fieldErrors = record.fieldErrors ?? fieldErrors;
      retryAfter = record.retryAfter;
      checks = record.checks;
    }

    if (status >= 500) {
      message = 'An unexpected error occurred';
      code = 'INTERNAL_ERROR';
      fieldErrors = undefined;
    }

    response.status(status).json({
      statusCode: status,
      error: status >= 500 ? 'Internal Server Error' : 'Request Failed',
      message,
      correlationId,
      ...(code ? { code } : {}),
      ...(fieldErrors ? { fieldErrors } : {}),
      ...(retryAfter !== undefined ? { retryAfter } : {}),
      ...(status === 503 && checks ? { checks } : {}),
    });
  }
}
