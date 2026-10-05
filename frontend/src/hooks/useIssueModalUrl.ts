import { useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';

/**
 * Hook providing URL-driven issue modal state management.
 * Synchronizes the currently open issue to '?issue=KEY-123' in query params,
 * making modals directly shareable via deep links and persistent across page reloads.
 */
export function useIssueModalUrl() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeIssueKey = searchParams.get('issue');

  const openIssue = useCallback((keyOrId: string | number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('issue', String(keyOrId));
      return next;
    }, { replace: false });
  }, [setSearchParams]);

  const closeIssue = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('issue');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  return {
    activeIssueKey,
    isOpen: Boolean(activeIssueKey),
    openIssue,
    closeIssue,
  };
}
