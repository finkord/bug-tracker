import crypto from 'node:crypto';
import type { ProjectWebhook } from '../entities/project-webhook.entity.js';
import type {
  FormattedWebhookPayload,
  WebhookEnvelope,
  WebhookPayloadStrategy,
} from './webhook-payload.strategy.js';

/**
 * Strategy implementation formatting generic JSON payloads with cryptographic HMAC-SHA256 signatures.
 */
export class GenericWebhookStrategy implements WebhookPayloadStrategy {
  format(webhook: ProjectWebhook, envelope: WebhookEnvelope): FormattedWebhookPayload {
    const genericBody = JSON.stringify(envelope);
    const signature = this.signPayload(webhook.secret, genericBody);

    return {
      body: genericBody,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'BugTracker-Webhook/1.0',
        'X-BugTracker-Signature': `sha256=${signature}`,
        'X-BugTracker-Event': envelope.event,
        'X-BugTracker-Delivery': envelope.id,
      },
    };
  }

  /**
   * Computes HMAC-SHA256 signature for outgoing payload.
   */
  private signPayload(secret: string, payload: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }
}
