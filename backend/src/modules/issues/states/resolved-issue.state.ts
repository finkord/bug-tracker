import { IssueStatus } from '../entities/issue.entity.js';
import { BaseIssueState, type WorkflowTransitionInfo } from './issue-state.interface.js';

/**
 * Concrete state representing a resolved issue.
 */
export class ResolvedIssueState extends BaseIssueState {
  readonly status = IssueStatus.RESOLVED;

  readonly allowedTransitions = [
    IssueStatus.CLOSED,
    IssueStatus.OPEN,
    IssueStatus.IN_PROGRESS,
  ] as const;

  readonly transitionActions: readonly WorkflowTransitionInfo[] = [
    { id: 'close', name: 'Close Issue', toStatus: IssueStatus.CLOSED },
    { id: 'reopen', name: 'Reopen Issue', toStatus: IssueStatus.OPEN },
    { id: 'reopen_progress', name: 'Reopen to In Progress', toStatus: IssueStatus.IN_PROGRESS },
  ];
}
