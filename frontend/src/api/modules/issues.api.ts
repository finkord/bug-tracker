import { request, API_BASE_URL } from '../http.js';
import type {
  IssueItem,
  CreateIssuePayload,
  IssueStatus,
  IssuePriority,
  IssueType,
  AttachmentItem,
  IssueComment,
  IssueLinkItem,
  IssueLinkType,
  PaginatedIssuesResponse,
  GetIssuesParams,
} from '../types/issues.types.js';
import type { AuthTokens } from '../types/auth.types.js';

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

  addIssueComment: (issueId: number, text: string) =>
    request<IssueComment>(`/issues/${issueId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  uploadAttachment: async (issueId: number, file: File): Promise<AttachmentItem> => {
    const formData = new FormData();
    formData.append('file', file);
    let token = localStorage.getItem('accessToken');

    let res = await fetch(`${API_BASE_URL}/issues/${issueId}/attachments`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (res.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });
          if (refreshRes.ok) {
            const data: AuthTokens = await refreshRes.json();
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            token = data.accessToken;

            res = await fetch(`${API_BASE_URL}/issues/${issueId}/attachments`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
              body: formData,
            });
          }
        } catch {
          // Fall through
        }
      }
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to upload attachment' }));
      throw new Error(err.message || 'Failed to upload attachment');
    }
    return res.json();
  },

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
};
