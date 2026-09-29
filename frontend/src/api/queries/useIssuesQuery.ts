import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  api,
  type IssueStatus,
  type IssuePriority,
  type IssueType,
  type CreateIssuePayload,
  type IssueLinkType,
} from '../client';

export const issueKeys = {
  all: ['issues'] as const,
  lists: () => [...issueKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown> | object) => [...issueKeys.lists(), filters ?? {}] as const,
  details: () => [...issueKeys.all, 'detail'] as const,
  detail: (keyOrId: string | number) => [...issueKeys.details(), String(keyOrId)] as const,
  attachments: (issueId: number) => [...issueKeys.detail(issueId), 'attachments'] as const,
  links: (issueId: number) => [...issueKeys.detail(issueId), 'links'] as const,
};

export function useIssuesQuery(filters?: {
  projectId?: number;
  status?: IssueStatus;
  priority?: IssuePriority;
  issueType?: IssueType;
  assigneeId?: number;
  sprint?: string;
  search?: string;
}) {
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
      queryClient.invalidateQueries({ queryKey: issueKeys.lists() });
      if (updatedIssue.key) {
        queryClient.invalidateQueries({ queryKey: issueKeys.detail(updatedIssue.key) });
      }
      queryClient.invalidateQueries({ queryKey: issueKeys.detail(updatedIssue.id) });
    },
  });
}

export function useUpdateIssueMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateIssuePayload> }) =>
      api.updateIssue(id, data),
    onSuccess: (updatedIssue) => {
      queryClient.invalidateQueries({ queryKey: issueKeys.lists() });
      if (updatedIssue.key) {
        queryClient.invalidateQueries({ queryKey: issueKeys.detail(updatedIssue.key) });
      }
      queryClient.invalidateQueries({ queryKey: issueKeys.detail(updatedIssue.id) });
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
      queryClient.invalidateQueries({ queryKey: issueKeys.lists() });
      queryClient.invalidateQueries({ queryKey: issueKeys.detail(updatedIssue.key) });
    },
  });
}

export function useUpdateIssueSprintMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, sprint }: { id: number; sprint: string | null }) =>
      api.updateIssueSprint(id, sprint),
    onSuccess: (updatedIssue) => {
      queryClient.invalidateQueries({ queryKey: issueKeys.lists() });
      queryClient.invalidateQueries({ queryKey: issueKeys.detail(updatedIssue.key) });
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
