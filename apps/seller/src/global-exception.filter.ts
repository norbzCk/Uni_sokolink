import { Catch, HttpException, HttpStatus, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import type { Request, Response } from 'express';
import type { Logger } from 'pino';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger, private readonly service: string) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const correlationId = response.locals.correlationId ?? request.header('x-correlation-id') ?? 'unknown';
    const details = exception instanceof HttpException ? exception.getResponse() : undefined;
    const detailsObject = typeof details === 'object' && details !== null ? details : undefined;
    const checks = detailsObject && 'checks' in detailsObject ? detailsObject.checks : undefined;
    if (status >= 500) {
      this.logger.error({ err: exception, service: this.service, correlationId, path: request.path }, 'request failed');
    }
    response.status(status).json({
      statusCode: status,
      error: status >= 500 ? 'Internal Server Error' : 'Request Failed',
      message: status >= 500 ? 'An unexpected error occurred' : exception instanceof HttpException ? exception.message : 'Request failed',
      correlationId,
      ...(status === 503 && checks ? { checks } : {}),
    });
  }
}
