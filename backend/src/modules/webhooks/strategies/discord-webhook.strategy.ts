import type { ProjectWebhook } from '../entities/project-webhook.entity.js';
import type {
  FormattedWebhookPayload,
  WebhookEnvelope,
  WebhookPayloadStrategy,
} from './webhook-payload.strategy.js';

/**
 * Strategy implementation formatting outbound payloads for Discord Embeds.
 */
export class DiscordWebhookStrategy implements WebhookPayloadStrategy {
  format(_webhook: ProjectWebhook, envelope: WebhookEnvelope): FormattedWebhookPayload {
    const rawData = envelope.data || {};
    // Extract nested issue payload if present
    const data = (rawData.issue as Record<string, any>) || rawData;

    let title = `BugTracker Event: ${envelope.event}`;
    let description = data.description || data.message || '';
    let color = 0x71717a;

    switch (envelope.event) {
      case 'ping':
        title = 'BugTracker Webhook Ping';
        description = 'Ping connection test received successfully from BugTracker outbound webhook engine.';
        color = 0x0284c7;
        break;
      case 'issue.created':
        title = `Issue Created: [${data.key || 'Issue'}] ${data.title || ''}`;
        color = 0x22c55e;
        break;
      case 'issue.updated':
        title = `Issue Updated: [${data.key || 'Issue'}] ${data.title || ''}`;
        color = 0x3b82f6;
        break;
      case 'status.changed':
        title = `Status Transitioned: [${data.key || 'Issue'}] to ${data.status || 'Updated'}`;
        color = 0xf59e0b;
        break;
      case 'comment.created': {
        const commentObj = rawData.comment || data.comment;
        title = `Comment Added on [${rawData.issueKey || data.key || 'Issue'}]`;
        description = commentObj?.text || commentObj?.body || rawData.body || data.body || description;
        color = 0x6366f1;
        break;
      }
      case 'issue.deleted':
        title = `Issue Deleted: [${data.key || 'Issue'}]`;
        color = 0xef4444;
        break;
    }

    const fields: Array<{ name: string; value: string; inline: boolean }> = [];
    if (data.status) fields.push({ name: 'Status', value: String(data.status), inline: true });
    if (data.priority) fields.push({ name: 'Priority', value: String(data.priority), inline: true });
    const issueType = data.issueType || data.type;
    if (issueType) fields.push({ name: 'Type', value: String(issueType), inline: true });
    if (data.assignee?.fullName || data.assigneeName) {
      fields.push({ name: 'Assignee', value: String(data.assignee?.fullName || data.assigneeName), inline: true });
    }

    const discordBody = {
      embeds: [
        {
          title: title.slice(0, 256),
          description: (description || 'No additional details provided').slice(0, 2048),
          color,
          fields: fields.slice(0, 25),
          footer: { text: 'BugTracker Outbound Webhooks' },
          timestamp: envelope.timestamp,
        },
      ],
    };

    return {
      body: JSON.stringify(discordBody),
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'BugTracker-Webhook/1.0',
      },
    };
  }
}
