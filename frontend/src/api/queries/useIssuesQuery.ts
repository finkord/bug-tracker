import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  api,
  type IssueStatus,
  type CreateIssuePayload,
  type IssueLinkType,
  type GetIssuesParams,
  type BulkUpdateIssuesDto,
  type BulkDeleteIssuesDto,
} from '../client';

export const issueKeys = {
  all: ['issues'] as const,
  lists: () => [...issueKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown> | object) => [...issueKeys.lists(), filters ?? {}] as const,
  details: () => [...issueKeys.all, 'detail'] as const,
  detail: (keyOrId: string | number) => [...issueKeys.details(), String(keyOrId)] as const,
  attachments: (issueId: number) => [...issueKeys.detail(issueId), 'attachments'] as const,
  links: (issueId: number) => [...issueKeys.detail(issueId), 'links'] as const,
  history: (issueId: number) => [...issueKeys.detail(issueId), 'history'] as const,
};

export function useIssuesQuery(filters?: GetIssuesParams) {
  return useQuery({
    queryKey: issueKeys.list(filters),
    queryFn: () => api.getIssues(filters),
  });
}

export function useIssueDetailQuery(keyOrId?: string | number) {
  return useQuery({
    queryKey: issueKeys.detail(keyOrId!),
    queryFn: () => api.getIssue(keyOrId!),
    enabled: keyOrId !== undefined && keyOrId !== '',
  });
}

export function useCreateIssueMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateIssuePayload) => api.createIssue(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.lists() });
    },
  });
}

export function useUpdateIssueStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ issueId, status }: { issueId: number; status: IssueStatus }) =>
      api.updateIssueStatus(issueId, status),
    onSuccess: (updatedIssue) => {
      if (updatedIssue.key) {
        queryClient.setQueryData(issueKeys.detail(updatedIssue.key), updatedIssue);
      }
      queryClient.setQueryData(issueKeys.detail(String(updatedIssue.id)), updatedIssue);
      queryClient.setQueryData(issueKeys.detail(updatedIssue.id), updatedIssue);
      queryClient.invalidateQueries({ queryKey: issueKeys.details() });
      queryClient.invalidateQueries({ queryKey: issueKeys.lists() });
    },
  });
}

export function useUpdateIssueMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateIssuePayload> }) =>
      api.updateIssue(id, data),
    onSuccess: (updatedIssue) => {
      if (updatedIssue.key) {
        queryClient.setQueryData(issueKeys.detail(updatedIssue.key), updatedIssue);
      }
      queryClient.setQueryData(issueKeys.detail(String(updatedIssue.id)), updatedIssue);
      queryClient.setQueryData(issueKeys.detail(updatedIssue.id), updatedIssue);
      queryClient.invalidateQueries({ queryKey: issueKeys.details() });
      queryClient.invalidateQueries({ queryKey: issueKeys.lists() });
    },
  });
}

export function useDeleteIssueMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (issueId: number) => api.deleteIssue(issueId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.lists() });
    },
  });
}

export function useAssignIssueToMeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.assignIssueToMe(id),
    onSuccess: (updatedIssue) => {
      if (updatedIssue.key) {
        queryClient.setQueryData(issueKeys.detail(updatedIssue.key), updatedIssue);
      }
      queryClient.setQueryData(issueKeys.detail(String(updatedIssue.id)), updatedIssue);
      queryClient.setQueryData(issueKeys.detail(updatedIssue.id), updatedIssue);
      queryClient.invalidateQueries({ queryKey: issueKeys.details() });
      queryClient.invalidateQueries({ queryKey: issueKeys.lists() });
    },
  });
}

export function useUpdateIssueSprintMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, sprintId }: { id: number; sprintId: number | null }) =>
      api.updateIssueSprint(id, sprintId),
    onSuccess: (updatedIssue) => {
      if (updatedIssue.key) {
        queryClient.setQueryData(issueKeys.detail(updatedIssue.key), updatedIssue);
      }
      queryClient.setQueryData(issueKeys.detail(String(updatedIssue.id)), updatedIssue);
      queryClient.setQueryData(issueKeys.detail(updatedIssue.id), updatedIssue);
      queryClient.invalidateQueries({ queryKey: issueKeys.details() });
      queryClient.invalidateQueries({ queryKey: issueKeys.lists() });
    },
  });
}

export function useAddIssueCommentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ issueId, text }: { issueId: number; text: string }) =>
      api.addIssueComment(issueId, text),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: issueKeys.detail(vars.issueId) });
      queryClient.invalidateQueries({ queryKey: issueKeys.lists() });
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
      queryClient.invalidateQueries({ queryKey: issueKeys.detail(vars.issueId) });
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
      queryClient.invalidateQueries({ queryKey: issueKeys.detail(vars.issueId) });
    },
  });
}

export function useIssueAttachmentsQuery(issueId?: number) {
  return useQuery({
    queryKey: issueKeys.attachments(issueId!),
    queryFn: () => api.getAttachments(issueId!),
    enabled: typeof issueId === 'number' && !isNaN(issueId),
  });
}

export function useUploadAttachmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ issueId, file }: { issueId: number; file: File }) =>
      api.uploadAttachment(issueId, file),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: issueKeys.attachments(vars.issueId) });
      queryClient.invalidateQueries({ queryKey: issueKeys.detail(vars.issueId) });
    },
  });
}

export function useDeleteAttachmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ issueId, attachmentId }: { issueId: number; attachmentId: number }) =>
      api.deleteAttachment(issueId, attachmentId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: issueKeys.attachments(vars.issueId) });
      queryClient.invalidateQueries({ queryKey: issueKeys.detail(vars.issueId) });
    },
  });
}

export function useIssueLinksQuery(issueId?: number) {
  return useQuery({
    queryKey: issueKeys.links(issueId!),
    queryFn: () => api.getIssueLinks(issueId!),
    enabled: typeof issueId === 'number' && !isNaN(issueId),
  });
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
      queryClient.invalidateQueries({ queryKey: issueKeys.links(vars.issueId) });
      queryClient.invalidateQueries({ queryKey: issueKeys.detail(vars.issueId) });
    },
  });
}

export function useDeleteIssueLinkMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ linkId }: { issueId: number; linkId: number }) =>
      api.deleteIssueLink(linkId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: issueKeys.links(vars.issueId) });
      queryClient.invalidateQueries({ queryKey: issueKeys.detail(vars.issueId) });
    },
  });
}

export function useBulkUpdateIssuesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BulkUpdateIssuesDto) => api.bulkUpdateIssues(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
    },
  });
}

export function useBulkDeleteIssuesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BulkDeleteIssuesDto) => api.bulkDeleteIssues(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
    },
  });
}

export function useIssueHistoryQuery(issueId?: number) {
  return useQuery({
    queryKey: issueKeys.history(issueId!),
    queryFn: () => api.getIssueHistory(issueId!),
    enabled: typeof issueId === 'number' && !isNaN(issueId),
  });
}

