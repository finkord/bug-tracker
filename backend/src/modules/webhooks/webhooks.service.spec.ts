import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { WebhooksService } from './webhooks.service.js';
import { ProjectWebhook } from './entities/project-webhook.entity.js';
import { Project } from '../projects/entities/project.entity.js';

describe('WebhooksService', () => {
  let service: WebhooksService;
  let mockWebhookRepo: any;
  let mockProjectRepo: any;
  let mockRedisService: any;

  const mockProject: Project = {
    id: 1,
    name: 'Backend Core',
    key: 'CORE',
  } as Project;

  const mockWebhook: ProjectWebhook = {
    id: 10,
    projectId: 1,
    name: 'Slack Alerts',
    url: 'https://example.com/webhook',
    secret: 'whsec_testsecret1234567890',
    events: ['issue.created', 'issue.updated', 'status.changed'],
    isActive: true,
    lastTriggeredAt: null,
    failureCount: 0,
    lastFailureReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as ProjectWebhook;

  beforeEach(() => {
    mockWebhookRepo = {
      create: vi.fn((data) => ({ id: 10, ...data, createdAt: new Date(), updatedAt: new Date() })),
      save: vi.fn((entity) => Promise.resolve(entity)),
      find: vi.fn(),
      findOne: vi.fn(),
      update: vi.fn().mockResolvedValue({ affected: 1 }),
      remove: vi.fn().mockResolvedValue(undefined),
      increment: vi.fn().mockResolvedValue({ affected: 1 }),
    };

    mockProjectRepo = {
      findOne: vi.fn(),
    };

    mockRedisService = {
      zadd: vi.fn().mockResolvedValue(1),
      zrangebyscore: vi.fn().mockResolvedValue([]),
      zrem: vi.fn().mockResolvedValue(1),
    };

    service = new WebhooksService(
      mockWebhookRepo,
      mockProjectRepo,
      mockRedisService,
    );
  });

  afterEach(() => {
    service.onModuleDestroy();
    vi.restoreAllMocks();
  });

  describe('create', () => {
    it('should create webhook with generated secret if none provided', async () => {
      mockProjectRepo.findOne.mockResolvedValue(mockProject);

      const result = await service.create(1, {
        name: 'CI/CD Pipeline',
        url: 'https://ci.example.com/events',
      });

      expect(mockProjectRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockWebhookRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'CI/CD Pipeline',
          url: 'https://ci.example.com/events',
          events: ['*'],
          isActive: true,
        }),
      );
      expect(result.secret).toMatch(/^whsec_/);
    });

    it('should throw BadRequestException if project does not exist', async () => {
      mockProjectRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create(999, {
          name: 'Test',
          url: 'https://test.com',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return webhooks for project ordered by createdAt DESC', async () => {
      mockWebhookRepo.find.mockResolvedValue([mockWebhook]);

      const list = await service.findAll(1);

      expect(mockWebhookRepo.find).toHaveBeenCalledWith({
        where: { projectId: 1 },
        order: { createdAt: 'DESC' },
      });
      expect(list).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return single webhook by id', async () => {
      mockWebhookRepo.findOne.mockResolvedValue(mockWebhook);

      const result = await service.findOne(1, 10);

      expect(mockWebhookRepo.findOne).toHaveBeenCalledWith({
        where: { id: 10, projectId: 1 },
      });
      expect(result.id).toBe(10);
    });

    it('should throw NotFoundException if webhook does not exist', async () => {
      mockWebhookRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(1, 999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update webhook properties', async () => {
      mockWebhookRepo.findOne.mockResolvedValue({ ...mockWebhook });

      const updated = await service.update(1, 10, {
        name: 'Updated Name',
        isActive: false,
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.isActive).toBe(false);
      expect(mockWebhookRepo.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove existing webhook', async () => {
      mockWebhookRepo.findOne.mockResolvedValue(mockWebhook);

      const result = await service.remove(1, 10);

      expect(mockWebhookRepo.remove).toHaveBeenCalledWith(mockWebhook);
      expect(result).toEqual({ success: true });
    });
  });

  describe('testWebhook', () => {
    it('should return success when remote server responds with 200 OK', async () => {
      mockWebhookRepo.findOne.mockResolvedValue(mockWebhook);
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      } as Response);

      const res = await service.testWebhook(1, 10);

      expect(res.success).toBe(true);
      expect(res.statusCode).toBe(200);
      expect(mockWebhookRepo.update).toHaveBeenCalledWith(10, {
        lastTriggeredAt: expect.any(Date),
        failureCount: 0,
        lastFailureReason: null,
      });

      global.fetch = originalFetch;
    });

    it('should return failure when remote server responds with 500', async () => {
      mockWebhookRepo.findOne.mockResolvedValue(mockWebhook);
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      const res = await service.testWebhook(1, 10);

      expect(res.success).toBe(false);
      expect(res.statusCode).toBe(500);

      global.fetch = originalFetch;
    });
  });

  describe('dispatch', () => {
    it('should filter active webhooks matching the event topic and sign payload', async () => {
      const originalFetch = global.fetch;
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      } as Response);
      global.fetch = fetchMock;

      mockWebhookRepo.find.mockResolvedValue([mockWebhook]);

      await service.dispatch(1, 'issue.created', {
        issueId: 10,
        title: 'New bug found',
      });

      expect(fetchMock).toHaveBeenCalledWith(
        mockWebhook.url,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-BugTracker-Event': 'issue.created',
          }),
        }),
      );

      global.fetch = originalFetch;
    });

    it('should format payload with Discord embeds when webhook format is discord', async () => {
      const originalFetch = global.fetch;
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      } as Response);
      global.fetch = fetchMock;

      const discordWebhook: ProjectWebhook = {
        ...mockWebhook,
        id: 11,
        url: 'https://discord.com/api/webhooks/1234/abcd',
        format: 'discord',
      } as ProjectWebhook;

      mockWebhookRepo.find.mockResolvedValue([discordWebhook]);

      await service.dispatch(1, 'issue.created', {
        key: 'MOBT-10',
        title: 'Crash on login',
        status: 'OPEN',
        priority: 'HIGH',
      });

      expect(fetchMock).toHaveBeenCalledWith(
        discordWebhook.url,
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"embeds":'),
        }),
      );

      const parsedBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(parsedBody.embeds).toBeDefined();
      expect(parsedBody.embeds[0].title).toContain('Issue Created: [MOBT-10]');

      global.fetch = originalFetch;
    });

    it('should format payload with Slack attachments when webhook format is slack', async () => {
      const originalFetch = global.fetch;
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      } as Response);
      global.fetch = fetchMock;

      const slackWebhook: ProjectWebhook = {
        ...mockWebhook,
        id: 12,
        url: 'https://hooks.slack.com/services/T00/B00/XXXX',
        format: 'slack',
      } as ProjectWebhook;

      mockWebhookRepo.find.mockResolvedValue([slackWebhook]);

      await service.dispatch(1, 'status.changed', {
        key: 'MOBT-10',
        status: 'IN_PROGRESS',
      });

      expect(fetchMock).toHaveBeenCalledWith(
        slackWebhook.url,
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"attachments":'),
        }),
      );

      const parsedBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(parsedBody.attachments).toBeDefined();
      expect(parsedBody.attachments[0].title).toContain('Status Transitioned');

      global.fetch = originalFetch;
    });

    it('should enqueue retry in Redis if initial delivery fails', async () => {
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));

      mockWebhookRepo.find.mockResolvedValue([mockWebhook]);

      await service.dispatch(1, 'status.changed', {
        issueId: 10,
        newStatus: 'RESOLVED',
      });

      // Allow background microtask to trigger deliver catch
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockRedisService.zadd).toHaveBeenCalledWith(
        'webhooks:retry_queue',
        expect.any(Number),
        expect.stringContaining('"attempt":2'),
      );

      global.fetch = originalFetch;
    });
  });

  describe('processRetryQueue', () => {
    it('should dequeue due items and retry delivery', async () => {
      const itemPayload = JSON.stringify({
        webhookId: 10,
        envelope: {
          id: 'test-deliv-1',
          event: 'issue.created',
          timestamp: new Date().toISOString(),
          projectId: 1,
          data: { test: true },
        },
        attempt: 2,
      });

      mockRedisService.zrangebyscore.mockResolvedValue([itemPayload]);
      mockRedisService.zrem.mockResolvedValue(1);
      mockWebhookRepo.findOne.mockResolvedValue(mockWebhook);

      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      } as Response);

      await service.processRetryQueue();

      expect(mockRedisService.zrem).toHaveBeenCalledWith('webhooks:retry_queue', itemPayload);
      expect(global.fetch).toHaveBeenCalled();

      global.fetch = originalFetch;
    });
  });
});
