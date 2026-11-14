import 'reflect-metadata';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { json } from 'express';
import { createProxyMiddleware, type Options } from 'http-proxy-middleware';
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

  const registerProxy = (mount: string, target: string, serviceName: string): void => {
    const options: Options = {
      target,
      changeOrigin: true,
      xfwd: true,
      pathRewrite: (path) => mount + path,
      on: {
        error: (error, _request, response) => {
          logger.error({ err: error, target, service: serviceName }, 'service proxy failed');
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
                message: 'The ' + serviceName + ' service is unavailable. Try again shortly.',
              }),
            );
          }
        },
      },
    };
    app.use(mount, createProxyMiddleware(options));
  };

  registerProxy('/api/v1/auth', env.IDENTITY_SERVICE_URL, 'identity');
  registerProxy('/api/v1/users', env.IDENTITY_SERVICE_URL, 'identity');
  registerProxy('/api/v1/seller', env.SELLER_SERVICE_URL, 'seller');
  registerProxy('/api/v1/catalogue', env.CATALOGUE_SERVICE_URL, 'catalogue');
  registerProxy('/api/v1/inventory', env.INVENTORY_SERVICE_URL, 'inventory');
  registerProxy('/api/v1/orders', env.COMMERCE_SERVICE_URL, 'commerce');
  registerProxy('/api/v1/payment', env.PAYMENT_SERVICE_URL, 'payment');
  registerProxy('/api/v1/fulfilment', env.FULFILMENT_SERVICE_URL, 'fulfilment');

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
    .setDescription('Public API ingress. Domain routes are proxied to their owning services.')
    .setVersion('1.0.0')
    .addServer('/api/v1')
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, openApi));

  await app.listen(env.PORT, '0.0.0.0');
  logger.info({ port: env.PORT }, 'gateway started');
}

void bootstrap();
