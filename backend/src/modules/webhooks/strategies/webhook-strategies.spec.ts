import { describe, it, expect, beforeEach } from 'vitest';
import { GenericWebhookStrategy } from './generic-webhook.strategy.js';
import { DiscordWebhookStrategy } from './discord-webhook.strategy.js';
import { SlackWebhookStrategy } from './slack-webhook.strategy.js';
import { WebhookFormatterRegistry } from './webhook-formatter.registry.js';
import type { WebhookEnvelope, WebhookPayloadStrategy } from './webhook-payload.strategy.js';
import type { ProjectWebhook } from '../entities/project-webhook.entity.js';

describe('Webhook Strategies (Strategy Pattern)', () => {
  const mockWebhook: ProjectWebhook = {
    id: 1,
    projectId: 1,
    name: 'Test Webhook',
    url: 'https://example.com/webhook',
    secret: 'whsec_testsecret123',
    format: 'generic',
    events: ['*'],
    isActive: true,
  } as ProjectWebhook;

  const mockEnvelope: WebhookEnvelope = {
    id: 'del_123',
    event: 'issue.created',
    timestamp: '2026-10-24T00:00:00.000Z',
    projectId: 1,
    data: {
      issue: {
        id: 10,
        key: 'CORE-10',
        title: 'Fix critical database deadlock',
        description: 'Deadlock observed in transaction pool',
        status: 'OPEN',
        priority: 'CRITICAL',
        issueType: 'BUG',
        assignee: { fullName: 'Volodymyr Fufalko' },
      },
    },
  };

  describe('GenericWebhookStrategy', () => {
    const strategy = new GenericWebhookStrategy();

    it('should format payload with HMAC-SHA256 signature and event headers', () => {
      const result = strategy.format(mockWebhook, mockEnvelope);

      expect(result.headers['Content-Type']).toBe('application/json');
      expect(result.headers['X-BugTracker-Event']).toBe('issue.created');
      expect(result.headers['X-BugTracker-Delivery']).toBe('del_123');
      expect(result.headers['X-BugTracker-Signature']).toMatch(/^sha256=[a-f0-9]{64}$/);

      const parsed = JSON.parse(result.body);
      expect(parsed.id).toBe('del_123');
      expect(parsed.event).toBe('issue.created');
    });
  });

  describe('DiscordWebhookStrategy', () => {
    const strategy = new DiscordWebhookStrategy();

    it('should unwrap nested issue data and format Discord embeds with fields and color', () => {
      const result = strategy.format(mockWebhook, mockEnvelope);
      const parsed = JSON.parse(result.body);

      expect(parsed.embeds).toBeDefined();
      expect(parsed.embeds.length).toBe(1);

      const embed = parsed.embeds[0];
      expect(embed.title).toContain('CORE-10');
      expect(embed.title).toContain('Fix critical database deadlock');
      expect(embed.color).toBe(0x22c55e); // Green for issue.created
      expect(embed.fields).toEqual(
        expect.arrayContaining([
          { name: 'Status', value: 'OPEN', inline: true },
          { name: 'Priority', value: 'CRITICAL', inline: true },
          { name: 'Type', value: 'BUG', inline: true },
          { name: 'Assignee', value: 'Volodymyr Fufalko', inline: true },
        ]),
      );
    });

    it('should format ping and status transition events with appropriate colors', () => {
      const pingEnvelope: WebhookEnvelope = {
        ...mockEnvelope,
        event: 'ping',
        data: {},
      };
      const pingResult = strategy.format(mockWebhook, pingEnvelope);
      const parsedPing = JSON.parse(pingResult.body);
      expect(parsedPing.embeds[0].title).toBe('BugTracker Webhook Ping');
      expect(parsedPing.embeds[0].color).toBe(0x0284c7);

      const statusEnvelope: WebhookEnvelope = {
        ...mockEnvelope,
        event: 'status.changed',
        data: { key: 'CORE-10', status: 'IN_PROGRESS' },
      };
      const statusResult = strategy.format(mockWebhook, statusEnvelope);
      const parsedStatus = JSON.parse(statusResult.body);
      expect(parsedStatus.embeds[0].title).toContain('Status Transitioned');
      expect(parsedStatus.embeds[0].color).toBe(0xf59e0b);
    });
  });

  describe('SlackWebhookStrategy', () => {
    const strategy = new SlackWebhookStrategy();

    it('should unwrap nested issue data and format Slack attachments with short fields', () => {
      const result = strategy.format(mockWebhook, mockEnvelope);
      const parsed = JSON.parse(result.body);

      expect(parsed.attachments).toBeDefined();
      expect(parsed.attachments.length).toBe(1);

      const attachment = parsed.attachments[0];
      expect(attachment.title).toContain('CORE-10');
      expect(attachment.color).toBe('#22c55e');
      expect(attachment.fields).toEqual(
        expect.arrayContaining([
          { title: 'Status', value: 'OPEN', short: true },
          { title: 'Priority', value: 'CRITICAL', short: true },
          { title: 'Type', value: 'BUG', short: true },
          { title: 'Assignee', value: 'Volodymyr Fufalko', short: true },
        ]),
      );
    });
  });

  describe('WebhookFormatterRegistry', () => {
    let registry: WebhookFormatterRegistry;

    beforeEach(() => {
      registry = new WebhookFormatterRegistry();
    });

    it('should resolve default generic, discord, and slack strategies', () => {
      expect(registry.getStrategy('generic')).toBeInstanceOf(GenericWebhookStrategy);
      expect(registry.getStrategy('discord')).toBeInstanceOf(DiscordWebhookStrategy);
      expect(registry.getStrategy('slack')).toBeInstanceOf(SlackWebhookStrategy);
    });

    it('should fallback to generic strategy for unknown format', () => {
      expect(registry.getStrategy('custom_unknown')).toBeInstanceOf(GenericWebhookStrategy);
    });

    it('should allow registering a custom strategy (Open-Closed Principle)', () => {
      const customStrategy: WebhookPayloadStrategy = {
        format: () => ({ body: 'CUSTOM_PAYLOAD', headers: { 'X-Custom': '1' } }),
      };

      registry.register('custom', customStrategy);
      const resolved = registry.getStrategy('custom');
      expect(resolved).toBe(customStrategy);

      const result = registry.format(mockWebhook, mockEnvelope, 'custom');
      expect(result.body).toBe('CUSTOM_PAYLOAD');
      expect(result.headers['X-Custom']).toBe('1');
    });
  });
});
