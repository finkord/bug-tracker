import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { RedisIoAdapter } from './modules/events/adapters/redis-io.adapter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Initialize and attach distributed Redis WebSocket adapter for multi-instance clusters
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  // Enable cookie parsing for secure httpOnly authentication cookies
  app.use(cookieParser());

  // Enable Cross-Origin Resource Sharing — restricted to the configured frontend origin only
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  // Global prefix for all REST endpoints
  app.setGlobalPrefix('api/v1');

  // Global exception filter for unified, secure error handling
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global validation pipe for strict DTO sanitization
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // OpenAPI / Swagger interactive documentation setup
  if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
    const config = new DocumentBuilder()
      .setTitle('Bug / Issue Tracking System API')
      .setDescription(
        'Core REST API service for Bug / Issue Tracking and Secure User Account Management',
      )
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          description: 'Enter your JWT access token',
          in: 'header',
        },
        'JWT-auth',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`[SERVER] Application is running on: http://localhost:${port}/api/v1`);
  if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
    console.log(`[DOCS] Swagger documentation: http://localhost:${port}/api/docs`);
  }
}

await bootstrap();
