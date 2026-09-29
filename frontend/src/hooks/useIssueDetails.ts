import { useQueryClient } from '@tanstack/react-query';
import {
  useIssueDetailQuery,
  useAddIssueCommentMutation,
  issueKeys,
} from '../api/queries/useIssuesQuery';
import type { IssueItem } from '../api/client';

export function useIssueDetails(issueKeyOrId: string | number | null | undefined) {
  const queryClient = useQueryClient();
  const {
    data: issue = null,
    isLoading: loading,
    error,
    refetch,
  } = useIssueDetailQuery(issueKeyOrId ?? undefined);

  const commentMutation = useAddIssueCommentMutation();

  const setIssue = (updater: IssueItem | null | ((prev: IssueItem | null) => IssueItem | null)) => {
    if (!issueKeyOrId) return;
    queryClient.setQueryData<IssueItem | null>(issueKeys.detail(issueKeyOrId), (old = null) => {
      return typeof updater === 'function' ? updater(old) : updater;
    });
  };

  const addComment = async (text: string) => {
    if (!issue) return;
    return commentMutation.mutateAsync({ issueId: issue.id, text });
  };

  return {
    issue,
    setIssue,
    loading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    reload: refetch,
    addComment,
  };
}
