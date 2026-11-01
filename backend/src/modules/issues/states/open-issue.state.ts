import { IssueStatus } from '../entities/issue.entity.js';
import { BaseIssueState, type WorkflowTransitionInfo } from './issue-state.interface.js';

/**
 * Concrete state representing an open issue.
 */
export class OpenIssueState extends BaseIssueState {
  readonly status = IssueStatus.OPEN;

  readonly allowedTransitions = [
    IssueStatus.IN_PROGRESS,
    IssueStatus.RESOLVED,
    IssueStatus.CLOSED,
  ] as const;

  readonly transitionActions: readonly WorkflowTransitionInfo[] = [
    { id: 'start_progress', name: 'Start Progress', toStatus: IssueStatus.IN_PROGRESS },
    { id: 'resolve', name: 'Resolve Issue', toStatus: IssueStatus.RESOLVED },
    { id: 'close', name: 'Close Issue', toStatus: IssueStatus.CLOSED },
  ];

  override onPullRequestAction(action: 'opened' | 'reopened' | 'merged' | 'closed'): IssueStatus | null {
    if (action === 'opened' || action === 'reopened') {
      return IssueStatus.REVIEW;
    }
    if (action === 'merged') {
      return IssueStatus.RESOLVED;
    }
    return null;
  }
}
