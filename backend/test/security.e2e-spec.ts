import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter.js';

describe('Security Controls & Endpoints (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Administrative Seed Endpoint Protection', () => {
    it('POST /api/v1/admin/seed should reject anonymous requests with 401 Unauthorized', async () => {
      // Act
      const actualResponse = await request(app.getHttpServer())
        .post('/api/v1/admin/seed')
        .send({});

      // Assert
      expect(actualResponse.status).toBe(401);
    });
  });

  describe('Attachment Download Authorization Protection', () => {
    it('GET /api/v1/issues/attachments/:id/file should reject unauthenticated file access with 401', async () => {
      // Act
      const actualResponse = await request(app.getHttpServer())
        .get('/api/v1/issues/attachments/9999/file');

      // Assert
      expect(actualResponse.status).toBe(401);
    });
  });

  describe('Password Security and Strict Validation', () => {
    it('POST /api/v1/auth/reset-password should reject weak passwords with 400 Bad Request', async () => {
      // Arrange
      const inputWeakPayload = {
        token: 'valid-format-test-token-12345',
        newPassword: 'weak',
      };

      // Act
      const actualResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/reset-password')
        .send(inputWeakPayload);

      // Assert
      expect(actualResponse.status).toBe(400);
      expect(JSON.stringify(actualResponse.body)).toContain('Password must be at least 8 characters long');
    });

    it('POST /api/v1/auth/set-password should reject unauthenticated requests with 401 Unauthorized', async () => {
      // Arrange
      const inputPayload = {
        currentPassword: 'CurrentPassword123!',
        newPassword: 'NewValidPassword123!',
      };

      // Act
      const actualResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/set-password')
        .send(inputPayload);

      // Assert
      expect(actualResponse.status).toBe(401);
    });
  });

  describe('Project and Issue Access Controls', () => {
    it('GET /api/v1/projects/:id should require authentication and return 401 when anonymous', async () => {
      // Act
      const actualResponse = await request(app.getHttpServer())
        .get('/api/v1/projects/1');

      // Assert
      expect(actualResponse.status).toBe(401);
    });

    it('GET /api/v1/issues/:id should require authentication and return 401 when anonymous', async () => {
      // Act
      const actualResponse = await request(app.getHttpServer())
        .get('/api/v1/issues/1');

      // Assert
      expect(actualResponse.status).toBe(401);
    });
  });
});
