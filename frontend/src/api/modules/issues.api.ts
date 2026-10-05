import { request, uploadFile } from '../http.js';
import type {
  IssueItem,
  CreateIssuePayload,
  IssueStatus,
  AttachmentItem,
  IssueComment,
  IssueLinkItem,
  IssueLinkType,
  PaginatedIssuesResponse,
  GetIssuesParams,
  BulkUpdateIssuesDto,
  BulkDeleteIssuesDto,
  BulkOperationResultDto,
  IssueHistoryItem,
  VcsPullRequestItem,
  JqlValidationResult,
  WorkflowTransitionItem,
  ReorderIssuePayload,
} from '../types/issues.types.js';

export const issuesApi = {
  getIssues: (params: GetIssuesParams = {}) => {
    const query = new URLSearchParams();
    if (params.projectId) query.set('projectId', String(params.projectId));
    if (params.status) query.set('status', params.status);
    if (params.priority) query.set('priority', params.priority);
    if (params.issueType) query.set('issueType', params.issueType);
    if (params.assigneeId) query.set('assigneeId', String(params.assigneeId));
    if (params.sprintId !== undefined && params.sprintId !== null) query.set('sprintId', String(params.sprintId));
    if (params.search) query.set('search', params.search);
    if (params.jql) query.set('jql', params.jql);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortOrder) query.set('sortOrder', params.sortOrder);
    const qs = query.toString();
    return request<PaginatedIssuesResponse>(`/issues${qs ? `?${qs}` : ''}`);
  },

  getIssue: (idOrKey: string | number) => request<IssueItem>(`/issues/${idOrKey}`),

  createIssue: (payload: CreateIssuePayload) =>
    request<IssueItem>('/issues', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateIssueStatus: (id: number, status: IssueStatus) =>
    request<IssueItem>(`/issues/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  assignIssueToMe: (id: number) =>
    request<IssueItem>(`/issues/${id}/assign-me`, {
      method: 'PATCH',
    }),

  updateIssueSprint: (id: number, sprintId: number | null) =>
    request<IssueItem>(`/issues/${id}/sprint`, {
      method: 'PATCH',
      body: JSON.stringify({ sprintId }),
    }),

  updateIssue: (id: number, payload: Partial<CreateIssuePayload>) =>
    request<IssueItem>(`/issues/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteIssue: (id: number) =>
    request<{ success: boolean; message: string }>(`/issues/${id}`, {
      method: 'DELETE',
    }),

  bulkUpdateIssues: (payload: BulkUpdateIssuesDto) =>
    request<BulkOperationResultDto>('/issues/bulk', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  bulkDeleteIssues: (payload: BulkDeleteIssuesDto) =>
    request<BulkOperationResultDto>('/issues/bulk-delete', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  addIssueComment: (issueId: number, text: string) =>
    request<IssueComment>(`/issues/${issueId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  updateIssueComment: (issueId: number, commentId: number, text: string) =>
    request<IssueComment>(`/issues/${issueId}/comments/${commentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ text }),
    }),

  deleteIssueComment: (issueId: number, commentId: number) =>
    request<{ success: boolean }>(`/issues/${issueId}/comments/${commentId}`, {
      method: 'DELETE',
    }),

  uploadAttachment: (issueId: number, file: File) =>
    uploadFile<AttachmentItem>(`/issues/${issueId}/attachments`, file, 'file'),

  deleteAttachment: (issueId: number, attachmentId: number) =>
    request<{ message: string }>(`/issues/${issueId}/attachments/${attachmentId}`, {
      method: 'DELETE',
    }),

  getAttachments: (issueId: number) =>
    request<AttachmentItem[]>(`/issues/${issueId}/attachments`),

  getIssueLinks: (issueId: number) =>
    request<IssueLinkItem[]>(`/issues/${issueId}/links`),

  createIssueLink: (
    issueId: number,
    payload: { targetIssueKeyOrId: string | number; linkType: IssueLinkType },
  ) =>
    request<IssueLinkItem>(`/issues/${issueId}/links`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteIssueLink: (linkId: number) =>
    request<{ success: boolean; message: string }>(`/issues/links/${linkId}`, {
      method: 'DELETE',
    }),

  getIssueHistory: (issueId: number) =>
    request<IssueHistoryItem[]>(`/issues/${issueId}/history`),

  getPullRequests: (issueId: number) =>
    request<VcsPullRequestItem[]>(`/issues/${issueId}/vcs/pull-requests`),

  validateJql: (jql: string) =>
    request<JqlValidationResult>('/issues/jql/validate', {
      method: 'POST',
      body: JSON.stringify({ jql }),
    }),

  getTransitions: (issueId: number) =>
    request<WorkflowTransitionItem[]>(`/issues/${issueId}/transitions`),

  reorderIssue: (issueId: number, payload: ReorderIssuePayload) =>
    request<IssueItem>(`/issues/${issueId}/reorder`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
};
