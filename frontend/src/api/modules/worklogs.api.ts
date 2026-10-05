import { request } from '../http.js';
import type { IssueItem } from '../types/issues.types.js';
import type {
  WorklogItem,
  WorklogStats,
  TeamTimesheetMatrix,
  PaginatedWorklogsResponse,
} from '../types/worklogs.types.js';

export const worklogsApi = {
  logWork: (
    issueId: number,
    payload: { timeSpentHours: number; dateLogged?: string; description?: string },
  ) =>
    request<IssueItem>(`/issues/${issueId}/worklogs`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteWorklog: (issueId: number, worklogId: number) =>
    request<{ success: boolean; issue: IssueItem }>(`/issues/${issueId}/worklogs/${worklogId}`, {
      method: 'DELETE',
    }),

  getIssueWorklogs: (issueId: number) => request<WorklogItem[]>(`/issues/${issueId}/worklogs`),

  getMyWorklogs: (page = 1, limit = 20) => {
    const params = new URLSearchParams();
    if (page) params.append('page', String(page));
    if (limit) params.append('limit', String(limit));
    return request<PaginatedWorklogsResponse>(`/issues/worklogs/me?${params.toString()}`);
  },

  getWorklogStats: () => request<WorklogStats>('/issues/worklogs/stats'),

  getTeamTimesheetMatrix: (
    startDate?: string,
    endDate?: string,
    projectId?: number,
    userId?: number,
    groupBy?: 'user' | 'issue',
  ) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (projectId) params.append('projectId', String(projectId));
    if (userId) params.append('userId', String(userId));
    if (groupBy) params.append('groupBy', groupBy);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<TeamTimesheetMatrix>(`/issues/worklogs/matrix${query}`);
  },
};
