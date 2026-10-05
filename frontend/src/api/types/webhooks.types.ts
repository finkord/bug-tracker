import type { components } from './api.generated.js';

export type ProjectWebhookItem = Omit<components['schemas']['WebhookResponseDto'], 'lastTriggeredAt' | 'lastFailureReason'> & {
  lastTriggeredAt: string | null;
  lastFailureReason: string | null;
};
export type CreateWebhookPayload = components['schemas']['CreateWebhookDto'];
export type UpdateWebhookPayload = components['schemas']['UpdateWebhookDto'];
export type TestWebhookResult = components['schemas']['WebhookTestResultDto'];

