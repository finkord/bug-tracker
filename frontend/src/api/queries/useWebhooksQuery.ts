import { queryOptions, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { webhooksApi } from '../modules/webhooks.api.js';
import type {
  CreateWebhookPayload,
  UpdateWebhookPayload,
} from '../types/webhooks.types.js';

export const webhookQueries = {
  all: ['webhooks'] as const,
  list: (projectId: number) =>
    queryOptions({
      queryKey: [...webhookQueries.all, 'list', projectId] as const,
      queryFn: () => webhooksApi.getWebhooks(projectId),
      enabled: typeof projectId === 'number' && projectId > 0,
    }),
  detail: (projectId: number, id: number) =>
    queryOptions({
      queryKey: [...webhookQueries.all, 'detail', projectId, id] as const,
      queryFn: () => webhooksApi.getWebhook(projectId, id),
      enabled: typeof projectId === 'number' && projectId > 0 && typeof id === 'number' && id > 0,
    }),
};

// Aliased for full backwards compatibility
export const webhookKeys = {
  all: webhookQueries.all,
  list: (projectId: number) => webhookQueries.list(projectId).queryKey,
  detail: (projectId: number, id: number) => webhookQueries.detail(projectId, id).queryKey,
};

export function useProjectWebhooksQuery(projectId?: number) {
  return useQuery(webhookQueries.list(projectId!));
}

export function useCreateWebhookMutation(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateWebhookPayload) =>
      webhooksApi.createWebhook(projectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: webhookQueries.list(projectId).queryKey });
    },
  });
}

export function useUpdateWebhookMutation(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateWebhookPayload }) =>
      webhooksApi.updateWebhook(projectId, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: webhookQueries.list(projectId).queryKey });
    },
  });
}

export function useDeleteWebhookMutation(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => webhooksApi.deleteWebhook(projectId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: webhookQueries.list(projectId).queryKey });
    },
  });
}

export function useTestWebhookMutation(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => webhooksApi.testWebhook(projectId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: webhookQueries.list(projectId).queryKey });
    },
  });
}
