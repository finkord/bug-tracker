import type { IssueStatus } from '../api/client.js';

export const WORKFLOW_TRANSITIONS_GRAPH: Record<IssueStatus, IssueStatus[]> = {
  OPEN: ['IN_PROGRESS', 'RESOLVED', 'CLOSED'],
  IN_PROGRESS: ['REVIEW', 'RESOLVED', 'OPEN'],
  REVIEW: ['RESOLVED', 'IN_PROGRESS'],
  RESOLVED: ['CLOSED', 'OPEN', 'IN_PROGRESS'],
  CLOSED: ['OPEN'],
};

/**
 * Checks whether transitioning from `fromStatus` to `toStatus` is permitted by the workflow FSM.
 * Same status transitions are allowed (reordering / no-op).
 */
export function isAllowedTransition(fromStatus: IssueStatus, toStatus: IssueStatus): boolean {
  if (fromStatus === toStatus) {
    return true;
  }
  const allowed = WORKFLOW_TRANSITIONS_GRAPH[fromStatus];
  return allowed ? allowed.includes(toStatus) : false;
}
