import { IssueStatus } from '../entities/issue.entity.js';
import { BaseIssueState, type WorkflowTransitionInfo } from './issue-state.interface.js';

/**
 * Concrete state representing an in-progress issue.
 */
export class InProgressIssueState extends BaseIssueState {
  readonly status = IssueStatus.IN_PROGRESS;

  readonly allowedTransitions = [
    IssueStatus.REVIEW,
    IssueStatus.RESOLVED,
    IssueStatus.OPEN,
  ] as const;

  readonly transitionActions: readonly WorkflowTransitionInfo[] = [
    { id: 'submit_review', name: 'Submit for Review', toStatus: IssueStatus.REVIEW },
    { id: 'resolve', name: 'Resolve Issue', toStatus: IssueStatus.RESOLVED },
    { id: 'stop_progress', name: 'Stop Progress', toStatus: IssueStatus.OPEN },
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
