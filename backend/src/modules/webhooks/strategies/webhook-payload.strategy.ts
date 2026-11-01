import type { ProjectWebhook } from '../entities/project-webhook.entity.js';

/**
 * Common envelope for outgoing webhook events across all platforms.
 */
export interface WebhookEnvelope {
  id: string;
  event: string;
  timestamp: string;
  projectId: number;
  data: Record<string, any>;
}

/**
 * Standard formatted outgoing payload containing serialized body and platform HTTP headers.
 */
export interface FormattedWebhookPayload {
  body: string;
  headers: Record<string, string>;
}

/**
 * Strategy interface defining payload formatting algorithms for different webhook destinations.
 */
export interface WebhookPayloadStrategy {
  format(webhook: ProjectWebhook, envelope: WebhookEnvelope): FormattedWebhookPayload;
}
