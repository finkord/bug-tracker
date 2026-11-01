import { IssueStatus } from '../entities/issue.entity.js';
import { BaseIssueState, type WorkflowTransitionInfo } from './issue-state.interface.js';

/**
 * Concrete state representing an issue under code review.
 */
export class ReviewIssueState extends BaseIssueState {
  readonly status = IssueStatus.REVIEW;

  readonly allowedTransitions = [
    IssueStatus.RESOLVED,
    IssueStatus.IN_PROGRESS,
  ] as const;

  readonly transitionActions: readonly WorkflowTransitionInfo[] = [
    { id: 'approve_review', name: 'Approve & Resolve', toStatus: IssueStatus.RESOLVED },
    { id: 'reject_review', name: 'Request Changes', toStatus: IssueStatus.IN_PROGRESS },
  ];

  override onPullRequestAction(action: 'opened' | 'reopened' | 'merged' | 'closed'): IssueStatus | null {
    if (action === 'merged') {
      return IssueStatus.RESOLVED;
    }
    return null;
  }
}
