import 'reflect-metadata';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { json } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { createLogger, correlationMiddleware } from '@sokolink/platform';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './global-exception.filter';
import { loadEnvironment } from './environment';
import { PinoNestLogger } from './pino-nest-logger';

async function bootstrap(): Promise<void> {
  const env = loadEnvironment();
  const logger = createLogger('api-gateway');
  const app = await NestFactory.create(AppModule, { bufferLogs: true, bodyParser: false });

  app.useLogger(new PinoNestLogger(logger));
  app.use(correlationMiddleware);

  app.use(
    '/api/v1/auth',
    createProxyMiddleware({
      target: env.IDENTITY_SERVICE_URL,
      changeOrigin: true,
      xfwd: true,
      pathRewrite: (path) => '/api/v1/auth' + path,
      on: {
        error: (error, _request, response) => {
          logger.error({ err: error, target: env.IDENTITY_SERVICE_URL }, 'identity proxy failed');
          const httpResponse = response as {
            statusCode?: number;
            setHeader?: (name: string, value: string) => void;
            end?: (body: string) => void;
          };
          if (typeof httpResponse.statusCode === 'number' && typeof httpResponse.end === 'function') {
            httpResponse.statusCode = 502;
            httpResponse.setHeader?.('content-type', 'application/json');
            httpResponse.end?.(
              JSON.stringify({
                statusCode: 502,
                error: 'Bad Gateway',
                message: 'The identity service is unavailable. Try again shortly.',
              }),
            );
          }
        },
      },
    }),
  );

  app.use(json({ limit: '1mb' }));
  app.use(cookieParser());
  app.enableCors({ origin: env.CORS_ORIGINS, credentials: true });
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalFilters(new GlobalExceptionFilter(logger, 'api-gateway'));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.enableShutdownHooks();

  const openApi = new DocumentBuilder()
    .setTitle('SokoLink api-gateway')
    .setDescription('Public API ingress. Identity routes are proxied to the identity service.')
    .setVersion('1.0.0')
    .addServer('/api/v1')
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, openApi));

  await app.listen(env.PORT, '0.0.0.0');
  logger.info({ port: env.PORT }, 'gateway started');
}

void bootstrap();
