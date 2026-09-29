import {
  useMyWorklogsQuery,
  useWorklogStatsQuery,
  useLogWorkMutation,
} from '../api/queries/useWorklogsQuery';

export function useWorklogs() {
  const {
    data: worklogs = [],
    isLoading: worklogsLoading,
    error: worklogsError,
    refetch: refetchWorklogs,
  } = useMyWorklogsQuery();

  const {
    data: stats = null,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useWorklogStatsQuery();

  const logWorkMutation = useLogWorkMutation();

  const loading = worklogsLoading || statsLoading;
  const rawError = worklogsError || statsError;
  const error = rawError instanceof Error ? rawError.message : rawError ? String(rawError) : null;

  const reload = async () => {
    await Promise.all([refetchWorklogs(), refetchStats()]);
  };

  const logWork = async (
    issueId: number,
    payload: { timeSpentHours: number; dateLogged?: string; description?: string },
  ) => {
    return logWorkMutation.mutateAsync({ issueId, payload });
  };

  return {
    worklogs,
    stats,
    loading,
    error,
    reload,
    logWork,
  };
}
