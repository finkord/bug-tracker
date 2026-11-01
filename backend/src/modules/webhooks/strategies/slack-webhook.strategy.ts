import type { ProjectWebhook } from '../entities/project-webhook.entity.js';
import type {
  FormattedWebhookPayload,
  WebhookEnvelope,
  WebhookPayloadStrategy,
} from './webhook-payload.strategy.js';

/**
 * Strategy implementation formatting outbound payloads for Slack Block Kit / Attachments.
 */
export class SlackWebhookStrategy implements WebhookPayloadStrategy {
  format(_webhook: ProjectWebhook, envelope: WebhookEnvelope): FormattedWebhookPayload {
    const rawData = envelope.data || {};
    // Extract nested issue payload if present
    const data = (rawData.issue as Record<string, any>) || rawData;

    let title = `BugTracker Event: ${envelope.event}`;
    let text = data.description || data.message || '';
    let color = '#71717a';

    switch (envelope.event) {
      case 'ping':
        title = 'BugTracker Webhook Ping';
        text = 'Ping connection test received successfully from BugTracker outbound webhook engine.';
        color = '#0284c7';
        break;
      case 'issue.created':
        title = `Issue Created: [${data.key || 'Issue'}] ${data.title || ''}`;
        color = '#22c55e';
        break;
      case 'issue.updated':
        title = `Issue Updated: [${data.key || 'Issue'}] ${data.title || ''}`;
        color = '#3b82f6';
        break;
      case 'status.changed':
        title = `Status Transitioned: [${data.key || 'Issue'}] to ${data.status || 'Updated'}`;
        color = '#f59e0b';
        break;
      case 'comment.created': {
        const commentObj = rawData.comment || data.comment;
        title = `Comment Added on [${rawData.issueKey || data.key || 'Issue'}]`;
        text = commentObj?.text || commentObj?.body || rawData.body || data.body || text;
        color = '#6366f1';
        break;
      }
      case 'issue.deleted':
        title = `Issue Deleted: [${data.key || 'Issue'}]`;
        color = '#ef4444';
        break;
    }

    const fields: Array<{ title: string; value: string; short: boolean }> = [];
    if (data.status) fields.push({ title: 'Status', value: String(data.status), short: true });
    if (data.priority) fields.push({ title: 'Priority', value: String(data.priority), short: true });
    const issueType = data.issueType || data.type;
    if (issueType) fields.push({ title: 'Type', value: String(issueType), short: true });
    if (data.assignee?.fullName || data.assigneeName) {
      fields.push({ title: 'Assignee', value: String(data.assignee?.fullName || data.assigneeName), short: true });
    }

    const slackBody = {
      attachments: [
        {
          color,
          title: title.slice(0, 256),
          text: (text || 'No additional details provided').slice(0, 2048),
          fields: fields.slice(0, 25),
          footer: 'BugTracker Outbound Webhooks',
          ts: Math.floor(new Date(envelope.timestamp).getTime() / 1000),
        },
      ],
    };

    return {
      body: JSON.stringify(slackBody),
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'BugTracker-Webhook/1.0',
      },
    };
  }
}
