import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';
import { issueKeys } from './useIssuesQuery';

export const worklogKeys = {
  all: ['worklogs'] as const,
  issue: (issueId: number) => [...worklogKeys.all, 'issue', issueId] as const,
  mine: (page?: number, limit?: number) =>
    [...worklogKeys.all, 'mine', { page, limit }] as const,
  stats: () => [...worklogKeys.all, 'stats'] as const,
  matrix: (startDate?: string, endDate?: string, projectId?: number, userId?: number) =>
    [...worklogKeys.all, 'matrix', { startDate, endDate, projectId, userId }] as const,
};

export function useIssueWorklogsQuery(issueId?: number) {
  return useQuery({
    queryKey: worklogKeys.issue(issueId!),
    queryFn: () => api.getIssueWorklogs(issueId!),
    enabled: typeof issueId === 'number' && !isNaN(issueId),
  });
}

export function useMyWorklogsQuery(page = 1, limit = 20) {
  return useQuery({
    queryKey: worklogKeys.mine(page, limit),
    queryFn: () => api.getMyWorklogs(page, limit),
  });
}

export function useWorklogStatsQuery() {
  return useQuery({
    queryKey: worklogKeys.stats(),
    queryFn: () => api.getWorklogStats(),
  });
}

export function useTeamTimesheetMatrixQuery(
  startDate?: string,
  endDate?: string,
  projectId?: number,
  userId?: number,
) {
  return useQuery({
    queryKey: worklogKeys.matrix(startDate, endDate, projectId, userId),
    queryFn: () => api.getTeamTimesheetMatrix(startDate, endDate, projectId, userId),
  });
}

export function useLogWorkMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      issueId,
      payload,
    }: {
      issueId: number;
      payload: { timeSpentHours: number; dateLogged?: string; description?: string };
    }) => api.logWork(issueId, payload),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: worklogKeys.all });
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
      queryClient.invalidateQueries({ queryKey: worklogKeys.all });
      queryClient.invalidateQueries({ queryKey: issueKeys.detail(vars.issueId) });
      queryClient.invalidateQueries({ queryKey: issueKeys.lists() });
    },
  });
}
