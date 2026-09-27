import { request } from '../http.js';
import type { IssueItem } from '../types/issues.types.js';
import type { WorklogItem, WorklogStats, TeamTimesheetMatrix } from '../types/worklogs.types.js';

export const worklogsApi = {
  logWork: (
    issueId: number,
    payload: { timeSpentHours: number; dateLogged?: string; description?: string },
  ) =>
    request<IssueItem>(`/issues/${issueId}/worklogs`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getIssueWorklogs: (issueId: number) => request<WorklogItem[]>(`/issues/${issueId}/worklogs`),

  getMyWorklogs: () => request<WorklogItem[]>('/issues/worklogs/me'),

  getWorklogStats: () => request<WorklogStats>('/issues/worklogs/stats'),

  getTeamTimesheetMatrix: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<TeamTimesheetMatrix>(`/issues/worklogs/matrix${query}`);
  },
};
