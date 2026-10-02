import { request } from '../http.js';
import type {
  ProjectWebhookItem,
  CreateWebhookPayload,
  UpdateWebhookPayload,
  TestWebhookResult,
} from '../types/webhooks.types.js';

export const webhooksApi = {
  getWebhooks: (projectId: number) =>
    request<ProjectWebhookItem[]>(`/projects/${projectId}/webhooks`),

  getWebhook: (projectId: number, id: number) =>
    request<ProjectWebhookItem>(`/projects/${projectId}/webhooks/${id}`),

  createWebhook: (projectId: number, payload: CreateWebhookPayload) =>
    request<ProjectWebhookItem>(`/projects/${projectId}/webhooks`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateWebhook: (projectId: number, id: number, payload: UpdateWebhookPayload) =>
    request<ProjectWebhookItem>(`/projects/${projectId}/webhooks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteWebhook: (projectId: number, id: number) =>
    request<{ success: boolean }>(`/projects/${projectId}/webhooks/${id}`, {
      method: 'DELETE',
    }),

  testWebhook: (projectId: number, id: number) =>
    request<TestWebhookResult>(`/projects/${projectId}/webhooks/${id}/test`, {
      method: 'POST',
    }),
};
