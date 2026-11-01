import { IssueStatus } from '../entities/issue.entity.js';

export interface WorkflowTransitionInfo {
  id: string;
  name: string;
  toStatus: IssueStatus;
}

export interface TransitionResult {
  valid: boolean;
  previousStatus: IssueStatus;
  newStatus: IssueStatus;
  error?: string;
}

/**
 * State pattern interface defining behavior and allowed transitions for an issue status.
 */
export interface IssueState {
  readonly status: IssueStatus;
  readonly allowedTransitions: readonly IssueStatus[];
  readonly transitionActions: readonly WorkflowTransitionInfo[];
  canTransitionTo(targetStatus: IssueStatus): boolean;
  onEnter?(previousStatus: IssueStatus): void;
  onExit?(targetStatus: IssueStatus): void;
  onPullRequestAction?(action: 'opened' | 'reopened' | 'merged' | 'closed'): IssueStatus | null;
}

/**
 * Abstract base state providing default verification logic for issue lifecycle transitions.
 */
export abstract class BaseIssueState implements IssueState {
  abstract readonly status: IssueStatus;
  abstract readonly allowedTransitions: readonly IssueStatus[];
  abstract readonly transitionActions: readonly WorkflowTransitionInfo[];

  canTransitionTo(targetStatus: IssueStatus): boolean {
    return this.allowedTransitions.includes(targetStatus);
  }

  onEnter?(_previousStatus: IssueStatus): void {}
  onExit?(_targetStatus: IssueStatus): void {}

  onPullRequestAction?(_action: 'opened' | 'reopened' | 'merged' | 'closed'): IssueStatus | null {
    return null;
  }
}
