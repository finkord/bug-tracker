import { IssueStatus } from '../entities/issue.entity.js';
import { BaseIssueState, type WorkflowTransitionInfo } from './issue-state.interface.js';

/**
 * Concrete state representing a closed issue.
 */
export class ClosedIssueState extends BaseIssueState {
  readonly status = IssueStatus.CLOSED;

  readonly allowedTransitions = [
    IssueStatus.OPEN,
  ] as const;

  readonly transitionActions: readonly WorkflowTransitionInfo[] = [
    { id: 'reopen', name: 'Reopen Issue', toStatus: IssueStatus.OPEN },
  ];
}
