import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { webhooksApi } from '../modules/webhooks.api.js';
import type {
  CreateWebhookPayload,
  UpdateWebhookPayload,
} from '../types/webhooks.types.js';

export const webhookKeys = {
  all: ['webhooks'] as const,
  list: (projectId: number) => [...webhookKeys.all, 'list', projectId] as const,
  detail: (projectId: number, id: number) => [...webhookKeys.all, 'detail', projectId, id] as const,
};

export function useProjectWebhooksQuery(projectId?: number) {
  return useQuery({
    queryKey: webhookKeys.list(projectId!),
    queryFn: () => webhooksApi.getWebhooks(projectId!),
    enabled: typeof projectId === 'number' && projectId > 0,
  });
}

export function useCreateWebhookMutation(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateWebhookPayload) =>
      webhooksApi.createWebhook(projectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.list(projectId) });
    },
  });
}

export function useUpdateWebhookMutation(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateWebhookPayload }) =>
      webhooksApi.updateWebhook(projectId, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.list(projectId) });
    },
  });
}

export function useDeleteWebhookMutation(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => webhooksApi.deleteWebhook(projectId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.list(projectId) });
    },
  });
}

export function useTestWebhookMutation(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => webhooksApi.testWebhook(projectId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.list(projectId) });
    },
  });
}
