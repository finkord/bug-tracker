import { queryOptions, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type LogWorkPayload } from '../client.js';
import { issueKeys } from './useIssuesQuery.js';

export const worklogQueries = {
  all: ['worklogs'] as const,
  issue: (issueId: number) =>
    queryOptions({
      queryKey: [...worklogQueries.all, 'issue', issueId] as const,
      queryFn: () => api.getIssueWorklogs(issueId),
      enabled: typeof issueId === 'number' && !isNaN(issueId),
    }),
  mine: (page = 1, limit = 20) =>
    queryOptions({
      queryKey: [...worklogQueries.all, 'mine', { page, limit }] as const,
      queryFn: () => api.getMyWorklogs(page, limit),
    }),
  stats: () =>
    queryOptions({
      queryKey: [...worklogQueries.all, 'stats'] as const,
      queryFn: () => api.getWorklogStats(),
    }),
  matrix: (
    startDate?: string,
    endDate?: string,
    projectId?: number,
    userId?: number,
    groupBy?: 'user' | 'issue',
  ) =>
    queryOptions({
      queryKey: [
        ...worklogQueries.all,
        'matrix',
        { startDate, endDate, projectId, userId, groupBy },
      ] as const,
      queryFn: () => api.getTeamTimesheetMatrix(startDate, endDate, projectId, userId, groupBy),
    }),
};

// Aliased for full backwards compatibility
export const worklogKeys = {
  all: worklogQueries.all,
  issue: (issueId: number) => worklogQueries.issue(issueId).queryKey,
  mine: (page?: number, limit?: number) => worklogQueries.mine(page, limit).queryKey,
  stats: () => worklogQueries.stats().queryKey,
  matrix: (
    startDate?: string,
    endDate?: string,
    projectId?: number,
    userId?: number,
    groupBy?: 'user' | 'issue',
  ) => worklogQueries.matrix(startDate, endDate, projectId, userId, groupBy).queryKey,
};

export function useIssueWorklogsQuery(issueId?: number) {
  return useQuery(worklogQueries.issue(issueId!));
}

export function useMyWorklogsQuery(page = 1, limit = 20) {
  return useQuery(worklogQueries.mine(page, limit));
}

export function useWorklogStatsQuery() {
  return useQuery(worklogQueries.stats());
}

export function useTeamTimesheetMatrixQuery(
  startDate?: string,
  endDate?: string,
  projectId?: number,
  userId?: number,
  groupBy?: 'user' | 'issue',
) {
  return useQuery(worklogQueries.matrix(startDate, endDate, projectId, userId, groupBy));
}

export function useLogWorkMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      issueId,
      payload,
    }: {
      issueId: number;
      payload: LogWorkPayload;
    }) => api.logWork(issueId, payload),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: worklogQueries.all });
      queryClient.invalidateQueries({ queryKey: issueKeys.detail(vars.issueId) });
      queryClient.invalidateQueries({ queryKey: issueKeys.lists() });
    },
  });
}

export function useDeleteWorklogMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      issueId,
      worklogId,
    }: {
      issueId: number;
      worklogId: number;
    }) => api.deleteWorklog(issueId, worklogId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: worklogQueries.all });
      queryClient.invalidateQueries({ queryKey: issueKeys.detail(vars.issueId) });
      queryClient.invalidateQueries({ queryKey: issueKeys.lists() });
    },
  });
}
