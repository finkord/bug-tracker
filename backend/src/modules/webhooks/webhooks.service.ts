import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { ProjectWebhook } from './entities/project-webhook.entity.js';
import { Project } from '../projects/entities/project.entity.js';
import { RedisService } from '../redis/redis.service.js';
import { CreateWebhookDto } from './dto/create-webhook.dto.js';
import { UpdateWebhookDto } from './dto/update-webhook.dto.js';
import type { WebhookTestResultDto } from './dto/webhook-response.dto.js';

interface WebhookEnvelope {
  id: string;
  event: string;
  timestamp: string;
  projectId: number;
  data: Record<string, any>;
}

interface RetryQueueItem {
  webhookId: number;
  envelope: WebhookEnvelope;
  attempt: number;
}

@Injectable()
export class WebhooksService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WebhooksService.name);
  private retryIntervalRef: NodeJS.Timeout | null = null;
  private readonly REDIS_RETRY_KEY = 'webhooks:retry_queue';

  constructor(
    @InjectRepository(ProjectWebhook)
    private readonly webhookRepository: Repository<ProjectWebhook>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly redisService: RedisService,
  ) {}

  onModuleInit(): void {
    // Background polling for scheduled Redis retry queue (every 5 seconds)
    this.retryIntervalRef = setInterval(() => {
      this.processRetryQueue().catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Error processing webhook retry queue: ${msg}`);
      });
    }, 5000);

    if (this.retryIntervalRef.unref) {
      this.retryIntervalRef.unref();
    }
  }

  onModuleDestroy(): void {
    if (this.retryIntervalRef) {
      clearInterval(this.retryIntervalRef);
      this.retryIntervalRef = null;
    }
  }

  /**
   * Generates a cryptographically strong HMAC secret.
   */
  generateSecret(): string {
    return `whsec_${crypto.randomBytes(24).toString('hex')}`;
  }

  /**
   * Computes HMAC-SHA256 signature for outgoing payload.
   */
  signPayload(secret: string, payload: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  /**
   * Registers a new outbound webhook for a project.
   */
  async create(projectId: number, dto: CreateWebhookDto): Promise<ProjectWebhook> {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new BadRequestException(`Project #${projectId} does not exist`);
    }

    const secret = dto.secret?.trim() || this.generateSecret();
    const events = dto.events && dto.events.length > 0 ? dto.events : ['*'];

    const webhook = this.webhookRepository.create({
      projectId,
      name: dto.name.trim(),
      url: dto.url.trim(),
      secret,
      events,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    });

    return this.webhookRepository.save(webhook);
  }

  /**
   * Lists all webhooks registered under a project.
   */
  async findAll(projectId: number): Promise<ProjectWebhook[]> {
    return this.webhookRepository.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Retrieves single webhook by ID within project.
   */
  async findOne(projectId: number, id: number): Promise<ProjectWebhook> {
    const webhook = await this.webhookRepository.findOne({
      where: { id, projectId },
    });
    if (!webhook) {
      throw new NotFoundException(`Webhook #${id} not found in project #${projectId}`);
    }
    return webhook;
  }

  /**
   * Updates an existing webhook configuration.
   */
  async update(projectId: number, id: number, dto: UpdateWebhookDto): Promise<ProjectWebhook> {
    const webhook = await this.findOne(projectId, id);

    if (dto.name !== undefined) webhook.name = dto.name.trim();
    if (dto.url !== undefined) webhook.url = dto.url.trim();
    if (dto.secret !== undefined && dto.secret.trim()) webhook.secret = dto.secret.trim();
    if (dto.events !== undefined) webhook.events = dto.events;
    if (dto.isActive !== undefined) webhook.isActive = dto.isActive;

    return this.webhookRepository.save(webhook);
  }

  /**
   * Deletes a webhook by ID.
   */
  async remove(projectId: number, id: number): Promise<{ success: boolean }> {
    const webhook = await this.findOne(projectId, id);
    await this.webhookRepository.remove(webhook);
    return { success: true };
  }

  /**
   * Sends a synchronous test ping to verify endpoint connectivity.
   */
  async testWebhook(projectId: number, id: number): Promise<WebhookTestResultDto> {
    const webhook = await this.findOne(projectId, id);
    const envelope: WebhookEnvelope = {
      id: crypto.randomUUID(),
      event: 'ping',
      timestamp: new Date().toISOString(),
      projectId,
      data: {
        message: 'Ping connection test from BugTracker outbound webhook engine',
      },
    };

    const body = JSON.stringify(envelope);
    const signature = this.signPayload(webhook.secret, body);
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'BugTracker-Webhook/1.0',
          'X-BugTracker-Signature': `sha256=${signature}`,
          'X-BugTracker-Event': 'ping',
          'X-BugTracker-Delivery': envelope.id,
        },
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const responseTimeMs = Date.now() - startTime;

      if (response.ok) {
        await this.webhookRepository.update(webhook.id, {
          lastTriggeredAt: new Date(),
          failureCount: 0,
          lastFailureReason: null,
        });
        return {
          success: true,
          statusCode: response.status,
          responseTimeMs,
          message: `Endpoint responded successfully with HTTP ${response.status}`,
        };
      }

      const statusText = response.statusText || 'Error';
      const failReason = `HTTP ${response.status} ${statusText}`;
      await this.webhookRepository.update(webhook.id, {
        lastFailureReason: failReason,
      });

      return {
        success: false,
        statusCode: response.status,
        responseTimeMs,
        message: `Endpoint returned failure code: HTTP ${response.status}`,
      };
    } catch (err: unknown) {
      const responseTimeMs = Date.now() - startTime;
      const errorMsg = err instanceof Error ? err.message : String(err);
      await this.webhookRepository.update(webhook.id, {
        lastFailureReason: `Connection error: ${errorMsg}`,
      });

      return {
        success: false,
        responseTimeMs,
        message: `Delivery failed: ${errorMsg}`,
      };
    }
  }

  /**
   * Dispatches an event payload to all matching active project webhooks.
   */
  async dispatch(projectId: number, event: string, payload: Record<string, any>): Promise<void> {
    try {
      const webhooks = await this.webhookRepository.find({
        where: { projectId, isActive: true },
      });

      if (webhooks.length === 0) return;

      const matchingWebhooks = webhooks.filter((wh) => {
        const events = Array.isArray(wh.events) ? wh.events : [];
        return events.includes('*') || events.includes(event);
      });

      if (matchingWebhooks.length === 0) return;

      const envelope: WebhookEnvelope = {
        id: crypto.randomUUID(),
        event,
        timestamp: new Date().toISOString(),
        projectId,
        data: payload,
      };

      for (const webhook of matchingWebhooks) {
        this.deliver(webhook, envelope, 1).catch((err: unknown) => {
          this.logger.warn(`Failed initial delivery for webhook #${webhook.id}: ${err}`);
        });
      }
    } catch (err: unknown) {
      this.logger.warn(`Error during webhook dispatch for project #${projectId}: ${err}`);
    }
  }

  /**
   * Performs an HTTP POST delivery attempt. On failure, schedules Redis retry if attempts remain.
   */
  private async deliver(webhook: ProjectWebhook, envelope: WebhookEnvelope, attempt: number): Promise<boolean> {
    const body = JSON.stringify(envelope);
    const signature = this.signPayload(webhook.secret, body);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'BugTracker-Webhook/1.0',
          'X-BugTracker-Signature': `sha256=${signature}`,
          'X-BugTracker-Event': envelope.event,
          'X-BugTracker-Delivery': envelope.id,
        },
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        await this.webhookRepository.update(webhook.id, {
          lastTriggeredAt: new Date(),
          failureCount: 0,
          lastFailureReason: null,
        });
        return true;
      }

      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Webhook #${webhook.id} delivery attempt ${attempt} failed: ${errorMsg}`);

      if (attempt < 3) {
        // Enqueue into Redis sorted set with exponential backoff
        // Attempt 1 -> 5s delay, Attempt 2 -> 25s delay
        const backoffMs = Math.pow(5, attempt) * 1000;
        const nextRetryAt = Date.now() + backoffMs;
        const item: RetryQueueItem = {
          webhookId: webhook.id,
          envelope,
          attempt: attempt + 1,
        };

        await this.redisService.zadd(this.REDIS_RETRY_KEY, nextRetryAt, JSON.stringify(item));
      } else {
        // Final attempt failed
        await this.webhookRepository.increment({ id: webhook.id }, 'failureCount', 1);
        await this.webhookRepository.update(webhook.id, {
          lastFailureReason: `Exceeded 3 retry attempts: ${errorMsg}`,
        });
      }

      return false;
    }
  }

  /**
   * Drains due items from the Redis retry queue and executes re-deliveries.
   */
  async processRetryQueue(): Promise<void> {
    const now = Date.now();
    const rawItems = await this.redisService.zrangebyscore(this.REDIS_RETRY_KEY, 0, now, 20);

    if (!rawItems || rawItems.length === 0) return;

    for (const rawItem of rawItems) {
      // Atomically remove item to prevent duplicate processing by horizontal instances
      const removed = await this.redisService.zrem(this.REDIS_RETRY_KEY, rawItem);
      if (removed === 0) continue;

      try {
        const item: RetryQueueItem = JSON.parse(rawItem);
        const webhook = await this.webhookRepository.findOne({
          where: { id: item.webhookId },
        });

        if (webhook && webhook.isActive) {
          await this.deliver(webhook, item.envelope, item.attempt);
        }
      } catch (err: unknown) {
        this.logger.warn(`Failed processing webhook retry queue item: ${err}`);
      }
    }
  }
}
