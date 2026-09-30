import { useQueryClient } from '@tanstack/react-query';
import {
  useIssuesQuery,
  useUpdateIssueStatusMutation,
  useAssignIssueToMeMutation,
  useDeleteIssueMutation,
  issueKeys,
} from '../api/queries/useIssuesQuery';
import type {
  IssueItem,
  IssueStatus,
  PaginatedIssuesResponse,
  GetIssuesParams,
} from '../api/client';

export type UseIssuesParams = GetIssuesParams;

export function useIssues(params?: UseIssuesParams) {
  const queryClient = useQueryClient();
  const { data: issuesData, isLoading: loading, error, refetch } = useIssuesQuery(params);
  const issues = issuesData?.items ?? [];
  const total = issuesData?.total ?? 0;
  const statusMutation = useUpdateIssueStatusMutation();
  const assignMutation = useAssignIssueToMeMutation();
  const deleteMutation = useDeleteIssueMutation();

  const setIssues = (updater: IssueItem[] | ((prev: IssueItem[]) => IssueItem[])) => {
    queryClient.setQueryData<PaginatedIssuesResponse>(issueKeys.list(params), (old) => {
      const currentItems = old?.items ?? [];
      const nextItems = typeof updater === 'function' ? updater(currentItems) : updater;
      return {
        items: nextItems,
        total: nextItems.length,
        page: old?.page ?? 1,
        limit: old?.limit ?? 50,
        totalPages: Math.ceil(nextItems.length / (old?.limit ?? 50)),
      };
    });
  };

  const updateStatus = async (issueId: number, status: IssueStatus): Promise<IssueItem> => {
    return statusMutation.mutateAsync({ issueId, status });
  };

  const assignToMe = async (issueId: number): Promise<IssueItem> => {
    return assignMutation.mutateAsync(issueId);
  };

  const deleteIssue = async (issueId: number): Promise<void> => {
    await deleteMutation.mutateAsync(issueId);
  };

  return {
    issues,
    total,
    setIssues,
    loading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    reload: refetch,
    updateStatus,
    assignToMe,
    deleteIssue,
  };
}
