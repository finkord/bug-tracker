import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';
import { issueKeys } from './useIssuesQuery';

export const worklogKeys = {
  all: ['worklogs'] as const,
  issue: (issueId: number) => [...worklogKeys.all, 'issue', issueId] as const,
  mine: () => [...worklogKeys.all, 'mine'] as const,
  stats: () => [...worklogKeys.all, 'stats'] as const,
  matrix: (startDate?: string, endDate?: string) =>
    [...worklogKeys.all, 'matrix', { startDate, endDate }] as const,
};

export function useIssueWorklogsQuery(issueId?: number) {
  return useQuery({
    queryKey: worklogKeys.issue(issueId!),
    queryFn: () => api.getIssueWorklogs(issueId!),
    enabled: typeof issueId === 'number' && !isNaN(issueId),
  });
}

export function useMyWorklogsQuery() {
  return useQuery({
    queryKey: worklogKeys.mine(),
    queryFn: () => api.getMyWorklogs(),
  });
}

export function useWorklogStatsQuery() {
  return useQuery({
    queryKey: worklogKeys.stats(),
    queryFn: () => api.getWorklogStats(),
  });
}

export function useTeamTimesheetMatrixQuery(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: worklogKeys.matrix(startDate, endDate),
    queryFn: () => api.getTeamTimesheetMatrix(startDate, endDate),
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
      queryClient.invalidateQueries({ queryKey: worklogKeys.issue(vars.issueId) });
      queryClient.invalidateQueries({ queryKey: worklogKeys.mine() });
      queryClient.invalidateQueries({ queryKey: worklogKeys.stats() });
      queryClient.invalidateQueries({ queryKey: issueKeys.detail(vars.issueId) });
      queryClient.invalidateQueries({ queryKey: issueKeys.lists() });
    },
  });
}
