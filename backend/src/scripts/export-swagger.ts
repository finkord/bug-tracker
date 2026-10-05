import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { AppModule } from '../app.module.js';

async function exportSwagger() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
  app.setGlobalPrefix('api/v1');

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
  const outputPath = path.resolve(process.cwd(), '../swagger.json');
  await fs.writeFile(outputPath, JSON.stringify(document, null, 2), 'utf-8');
  console.log(`[SWAGGER] Exported OpenAPI specification to: ${outputPath}`);
  await app.close();
  process.exit(0);
}

exportSwagger().catch((err) => {
  console.error('[SWAGGER ERROR]', err);
  process.exit(1);
});
