import 'reflect-metadata';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json } from 'express';
import { createLogger, correlationMiddleware } from '@sokolink/platform';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './global-exception.filter';
import { loadEnvironment } from './environment';
import { PinoNestLogger } from './pino-nest-logger';

async function bootstrap(): Promise<void> {
  const env = loadEnvironment();
  const logger = createLogger('catalogue');
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(new PinoNestLogger(logger));
  app.use(json({ limit: '20mb' }));
  app.use(correlationMiddleware);
  app.enableCors({ origin: env.CORS_ORIGINS, credentials: true });
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI });
  app.useGlobalFilters(new GlobalExceptionFilter(logger, 'catalogue'));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.enableShutdownHooks();

  const openApi = new DocumentBuilder()
    .setTitle('SokoLink catalogue')
    .setDescription('Service API contract')
    .setVersion('1.0.0')
    .addServer('/api/v1')
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, openApi));

  await app.listen(env.PORT, '0.0.0.0');
  logger.info({ port: env.PORT }, 'service started');
}

void bootstrap();
