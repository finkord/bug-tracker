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
  IssuePriority,
  IssueType,
} from '../api/client';

export interface UseIssuesParams {
  projectId?: number;
  status?: IssueStatus;
  priority?: IssuePriority;
  issueType?: IssueType;
  assigneeId?: number;
  sprint?: string;
  search?: string;
}

export function useIssues(params?: UseIssuesParams) {
  const queryClient = useQueryClient();
  const { data: issues = [], isLoading: loading, error, refetch } = useIssuesQuery(params);
  const statusMutation = useUpdateIssueStatusMutation();
  const assignMutation = useAssignIssueToMeMutation();
  const deleteMutation = useDeleteIssueMutation();

  const setIssues = (updater: IssueItem[] | ((prev: IssueItem[]) => IssueItem[])) => {
    queryClient.setQueryData<IssueItem[]>(issueKeys.list(params), (old = []) => {
      return typeof updater === 'function' ? updater(old) : updater;
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
    setIssues,
    loading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    reload: refetch,
    updateStatus,
    assignToMe,
    deleteIssue,
  };
}
