import { queryOptions, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  api,
  type IssueStatus,
  type CreateIssuePayload,
  type IssueLinkType,
  type GetIssuesParams,
  type BulkUpdateIssuesDto,
  type BulkDeleteIssuesDto,
  type PaginatedIssuesResponse,
} from '../client.js';

export const issueQueries = {
  all: ['issues'] as const,
  lists: () => [...issueQueries.all, 'list'] as const,
  list: (filters?: GetIssuesParams | Record<string, unknown>) =>
    queryOptions({
      queryKey: [...issueQueries.lists(), filters ?? {}] as const,
      queryFn: () => api.getIssues(filters as GetIssuesParams),
    }),
  details: () => [...issueQueries.all, 'detail'] as const,
  detail: (keyOrId: string | number) =>
    queryOptions({
      queryKey: [...issueQueries.details(), String(keyOrId)] as const,
      queryFn: () => api.getIssue(keyOrId),
      enabled: keyOrId !== undefined && keyOrId !== '',
    }),
  attachments: (issueId: number) =>
    queryOptions({
      queryKey: [...issueQueries.detail(issueId).queryKey, 'attachments'] as const,
      queryFn: () => api.getAttachments(issueId),
      enabled: typeof issueId === 'number' && !isNaN(issueId),
    }),
  links: (issueId: number) =>
    queryOptions({
      queryKey: [...issueQueries.detail(issueId).queryKey, 'links'] as const,
      queryFn: () => api.getIssueLinks(issueId),
      enabled: typeof issueId === 'number' && !isNaN(issueId),
    }),
  history: (issueId: number) =>
    queryOptions({
      queryKey: [...issueQueries.detail(issueId).queryKey, 'history'] as const,
      queryFn: () => api.getIssueHistory(issueId),
      enabled: typeof issueId === 'number' && !isNaN(issueId),
    }),
  transitions: (issueId: number) =>
    queryOptions({
      queryKey: [...issueQueries.detail(issueId).queryKey, 'transitions'] as const,
      queryFn: () => api.getTransitions(issueId),
      enabled: typeof issueId === 'number' && !isNaN(issueId),
    }),
  validateJql: (jql: string, enabled = true) =>
    queryOptions({
      queryKey: ['issues', 'jql', 'validate', jql] as const,
      queryFn: () => api.validateJql(jql),
      enabled: enabled && typeof jql === 'string',
      staleTime: 60_000,
    }),
};

// Aliased for full backwards compatibility
export const issueKeys = {
  all: issueQueries.all,
  lists: issueQueries.lists,
  list: (filters?: Record<string, unknown> | object) => issueQueries.list(filters as any).queryKey,
  details: issueQueries.details,
  detail: (keyOrId: string | number) => issueQueries.detail(keyOrId).queryKey,
  attachments: (issueId: number) => issueQueries.attachments(issueId).queryKey,
  links: (issueId: number) => issueQueries.links(issueId).queryKey,
  history: (issueId: number) => issueQueries.history(issueId).queryKey,
  transitions: (issueId: number) => issueQueries.transitions(issueId).queryKey,
};

export function useIssuesQuery(filters?: GetIssuesParams) {
  return useQuery(issueQueries.list(filters));
}

export function useIssueDetailQuery(keyOrId?: string | number) {
  return useQuery(issueQueries.detail(keyOrId!));
}

export function useCreateIssueMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateIssuePayload) => api.createIssue(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueQueries.lists() });
    },
  });
}

export function useUpdateIssueStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ issueId, status }: { issueId: number; status: IssueStatus }) =>
      api.updateIssueStatus(issueId, status),
    onMutate: async ({ issueId, status }) => {
      await queryClient.cancelQueries({ queryKey: issueQueries.lists() });
      const previousLists = queryClient.getQueriesData<PaginatedIssuesResponse>({ queryKey: issueQueries.lists() });
      queryClient.setQueriesData<PaginatedIssuesResponse>({ queryKey: issueQueries.lists() }, (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((item) => (item.id === issueId ? { ...item, status } : item)),
        };
      });
      return { previousLists };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousLists) {
        for (const [queryKey, data] of context.previousLists) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },
    onSuccess: (updatedIssue) => {
      if (updatedIssue.key) {
        queryClient.setQueryData(issueQueries.detail(updatedIssue.key).queryKey, updatedIssue);
      }
      queryClient.setQueryData(issueQueries.detail(String(updatedIssue.id)).queryKey, updatedIssue);
      queryClient.setQueryData(issueQueries.detail(updatedIssue.id).queryKey, updatedIssue);
      queryClient.setQueriesData<PaginatedIssuesResponse>(
        { queryKey: issueQueries.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((item) => (item.id === updatedIssue.id ? { ...item, ...updatedIssue } : item)),
          };
        },
      );
      queryClient.invalidateQueries({ queryKey: issueQueries.details() });
    },
  });
}

export function useIssueTransitionsQuery(issueId?: number) {
  return useQuery(issueQueries.transitions(issueId!));
}

export function useReorderIssueMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      issueId,
      order,
      status,
    }: {
      issueId: number;
      order: number;
      status?: IssueStatus;
    }) => api.reorderIssue(issueId, { order, status }),
    onSuccess: (updatedIssue) => {
      if (updatedIssue.key) {
        queryClient.setQueryData(issueQueries.detail(updatedIssue.key).queryKey, updatedIssue);
      }
      queryClient.setQueryData(issueQueries.detail(String(updatedIssue.id)).queryKey, updatedIssue);
      queryClient.setQueryData(issueQueries.detail(updatedIssue.id).queryKey, updatedIssue);
      queryClient.setQueriesData<PaginatedIssuesResponse>(
        { queryKey: issueQueries.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((item) => (item.id === updatedIssue.id ? { ...item, ...updatedIssue } : item)),
          };
        },
      );
    },
  });
}

export function useUpdateIssueMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateIssuePayload> }) =>
      api.updateIssue(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: issueQueries.lists() });
      const previousLists = queryClient.getQueriesData<PaginatedIssuesResponse>({
        queryKey: issueQueries.lists(),
      });
      queryClient.setQueriesData<PaginatedIssuesResponse>(
        { queryKey: issueQueries.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((item) => {
              if (item.id !== id) return item;
              return {
                ...item,
                ...data,
                assignee:
                  data.assigneeId === null
                    ? null
                    : data.assigneeId !== undefined
                      ? item.assignee
                        ? { ...item.assignee, id: data.assigneeId }
                        : { id: data.assigneeId, fullName: '', email: '' }
                      : item.assignee,
                parentId: data.parentId !== undefined ? data.parentId : item.parentId,
                epicId: data.epicId !== undefined ? data.epicId : item.epicId,
                priority: data.priority !== undefined ? data.priority : item.priority,
              };
            }),
          };
        },
      );
      return { previousLists };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousLists) {
        for (const [queryKey, prevData] of context.previousLists) {
          queryClient.setQueryData(queryKey, prevData);
        }
      }
    },
    onSuccess: (updatedIssue) => {
      if (updatedIssue.key) {
        queryClient.setQueryData(issueQueries.detail(updatedIssue.key).queryKey, updatedIssue);
      }
      queryClient.setQueryData(issueQueries.detail(String(updatedIssue.id)).queryKey, updatedIssue);
      queryClient.setQueryData(issueQueries.detail(updatedIssue.id).queryKey, updatedIssue);
      queryClient.setQueriesData<PaginatedIssuesResponse>(
        { queryKey: issueQueries.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((item) => (item.id === updatedIssue.id ? { ...item, ...updatedIssue } : item)),
          };
        },
      );
      queryClient.invalidateQueries({ queryKey: issueQueries.details() });
    },
  });
}

export function useDeleteIssueMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (issueId: number) => api.deleteIssue(issueId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueQueries.lists() });
    },
  });
}

export function useAssignIssueToMeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.assignIssueToMe(id),
    onSuccess: (updatedIssue) => {
      if (updatedIssue.key) {
        queryClient.setQueryData(issueQueries.detail(updatedIssue.key).queryKey, updatedIssue);
      }
      queryClient.setQueryData(issueQueries.detail(String(updatedIssue.id)).queryKey, updatedIssue);
      queryClient.setQueryData(issueQueries.detail(updatedIssue.id).queryKey, updatedIssue);
      queryClient.invalidateQueries({ queryKey: issueQueries.details() });
      queryClient.invalidateQueries({ queryKey: issueQueries.lists() });
    },
  });
}

export function useUpdateIssueSprintMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, sprintId }: { id: number; sprintId: number | null }) =>
      api.updateIssueSprint(id, sprintId),
    onMutate: async ({ id, sprintId }) => {
      await queryClient.cancelQueries({ queryKey: issueQueries.lists() });
      const previousLists = queryClient.getQueriesData<PaginatedIssuesResponse>({
        queryKey: issueQueries.lists(),
      });
      queryClient.setQueriesData<PaginatedIssuesResponse>(
        { queryKey: issueQueries.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((item) => {
              if (item.id === id || item.parentId === id) {
                return { ...item, sprintId };
              }
              return item;
            }),
          };
        },
      );
      return { previousLists };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousLists) {
        for (const [queryKey, prevData] of context.previousLists) {
          queryClient.setQueryData(queryKey, prevData);
        }
      }
    },
    onSuccess: (updatedIssue) => {
      if (updatedIssue.key) {
        queryClient.setQueryData(issueQueries.detail(updatedIssue.key).queryKey, updatedIssue);
      }
      queryClient.setQueryData(issueQueries.detail(String(updatedIssue.id)).queryKey, updatedIssue);
      queryClient.setQueryData(issueQueries.detail(updatedIssue.id).queryKey, updatedIssue);
      queryClient.setQueriesData<PaginatedIssuesResponse>(
        { queryKey: issueQueries.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((item) =>
              item.id === updatedIssue.id ? { ...item, ...updatedIssue } : item,
            ),
          };
        },
      );
      queryClient.invalidateQueries({ queryKey: issueQueries.details() });
    },
  });
}

export function useAddIssueCommentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ issueId, text }: { issueId: number; text: string }) =>
      api.addIssueComment(issueId, text),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: issueQueries.detail(vars.issueId).queryKey });
      queryClient.invalidateQueries({ queryKey: issueQueries.lists() });
    },
  });
}

export function useUpdateIssueCommentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      issueId,
      commentId,
      text,
    }: {
      issueId: number;
      commentId: number;
      text: string;
    }) => api.updateIssueComment(issueId, commentId, text),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: issueQueries.detail(vars.issueId).queryKey });
    },
  });
}

export function useDeleteIssueCommentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      issueId,
      commentId,
    }: {
      issueId: number;
      commentId: number;
    }) => api.deleteIssueComment(issueId, commentId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: issueQueries.detail(vars.issueId).queryKey });
    },
  });
}

export function useIssueAttachmentsQuery(issueId?: number) {
  return useQuery(issueQueries.attachments(issueId!));
}

export function useUploadAttachmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ issueId, file }: { issueId: number; file: File }) =>
      api.uploadAttachment(issueId, file),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: issueQueries.attachments(vars.issueId).queryKey });
      queryClient.invalidateQueries({ queryKey: issueQueries.detail(vars.issueId).queryKey });
    },
  });
}

export function useDeleteAttachmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ issueId, attachmentId }: { issueId: number; attachmentId: number }) =>
      api.deleteAttachment(issueId, attachmentId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: issueQueries.attachments(vars.issueId).queryKey });
      queryClient.invalidateQueries({ queryKey: issueQueries.detail(vars.issueId).queryKey });
    },
  });
}

export function useIssueLinksQuery(issueId?: number) {
  return useQuery(issueQueries.links(issueId!));
}

export function useCreateIssueLinkMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      issueId,
      targetIssueKeyOrId,
      linkType,
    }: {
      issueId: number;
      targetIssueKeyOrId: string | number;
      linkType: IssueLinkType;
    }) => api.createIssueLink(issueId, { targetIssueKeyOrId, linkType }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: issueQueries.links(vars.issueId).queryKey });
      queryClient.invalidateQueries({ queryKey: issueQueries.detail(vars.issueId).queryKey });
    },
  });
}

export function useDeleteIssueLinkMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ linkId }: { issueId: number; linkId: number }) =>
      api.deleteIssueLink(linkId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: issueQueries.links(vars.issueId).queryKey });
      queryClient.invalidateQueries({ queryKey: issueQueries.detail(vars.issueId).queryKey });
    },
  });
}

export function useBulkUpdateIssuesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BulkUpdateIssuesDto) => api.bulkUpdateIssues(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: issueQueries.lists() });
      const previousLists = queryClient.getQueriesData<PaginatedIssuesResponse>({
        queryKey: issueQueries.lists(),
      });
      const idSet = new Set(payload.issueIds);
      queryClient.setQueriesData<PaginatedIssuesResponse>(
        { queryKey: issueQueries.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((item) => {
              if (idSet.has(item.id) || (item.parentId && idSet.has(item.parentId))) {
                return {
                  ...item,
                  ...(payload.status !== undefined ? { status: payload.status } : {}),
                  ...(payload.priority !== undefined ? { priority: payload.priority } : {}),
                  ...(payload.assigneeId !== undefined
                    ? {
                        assignee:
                          payload.assigneeId === null
                            ? null
                            : item.assignee
                              ? { ...item.assignee, id: payload.assigneeId }
                              : { id: payload.assigneeId, fullName: '', email: '' },
                      }
                    : {}),
                  ...(payload.sprintId !== undefined ? { sprintId: payload.sprintId } : {}),
                };
              }
              return item;
            }),
          };
        },
      );
      return { previousLists };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousLists) {
        for (const [queryKey, prevData] of context.previousLists) {
          queryClient.setQueryData(queryKey, prevData);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueQueries.details() });
    },
  });
}

export function useBulkDeleteIssuesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BulkDeleteIssuesDto) => api.bulkDeleteIssues(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueQueries.all });
    },
  });
}

export function useIssueHistoryQuery(issueId?: number) {
  return useQuery(issueQueries.history(issueId!));
}

export function useValidateJqlQuery(jql: string, enabled = true) {
  return useQuery(issueQueries.validateJql(jql, enabled));
}
