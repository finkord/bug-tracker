import { Injectable } from '@nestjs/common';
import type { ProjectWebhook } from '../entities/project-webhook.entity.js';
import type {
  FormattedWebhookPayload,
  WebhookEnvelope,
  WebhookPayloadStrategy,
} from './webhook-payload.strategy.js';
import { GenericWebhookStrategy } from './generic-webhook.strategy.js';
import { DiscordWebhookStrategy } from './discord-webhook.strategy.js';
import { SlackWebhookStrategy } from './slack-webhook.strategy.js';

/**
 * Registry holding and dispatching webhook payload formatting strategies.
 */
@Injectable()
export class WebhookFormatterRegistry {
  private readonly strategies = new Map<string, WebhookPayloadStrategy>();

  constructor() {
    this.register('generic', new GenericWebhookStrategy());
    this.register('discord', new DiscordWebhookStrategy());
    this.register('slack', new SlackWebhookStrategy());
  }

  /**
   * Registers or overrides a webhook formatting strategy for a specific format key.
   */
  register(format: string, strategy: WebhookPayloadStrategy): void {
    this.strategies.set(format.toLowerCase(), strategy);
  }

  /**
   * Resolves strategy for given format, falling back to 'generic'.
   */
  getStrategy(format?: string): WebhookPayloadStrategy {
    const key = (format || 'generic').toLowerCase();
    return this.strategies.get(key) || this.strategies.get('generic')!;
  }

  /**
   * Formats outbound webhook payload using the resolved strategy.
   */
  format(webhook: ProjectWebhook, envelope: WebhookEnvelope, explicitFormat?: string): FormattedWebhookPayload {
    const resolvedFormat = explicitFormat || webhook.format || 'generic';
    const strategy = this.getStrategy(resolvedFormat);
    return strategy.format(webhook, envelope);
  }
}
