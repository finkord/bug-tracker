import { Injectable, BadRequestException } from '@nestjs/common';
import { IssueStatus } from '../entities/issue.entity.js';
import type { IssueState, WorkflowTransitionInfo } from './issue-state.interface.js';
import { OpenIssueState } from './open-issue.state.js';
import { InProgressIssueState } from './in-progress-issue.state.js';
import { ReviewIssueState } from './review-issue.state.js';
import { ResolvedIssueState } from './resolved-issue.state.js';
import { ClosedIssueState } from './closed-issue.state.js';

/**
 * Factory managing singleton instances of issue states and validating transitions.
 */
@Injectable()
export class IssueStateFactory {
  private readonly states: Map<IssueStatus, IssueState> = new Map();

  constructor() {
    this.states.set(IssueStatus.OPEN, new OpenIssueState());
    this.states.set(IssueStatus.IN_PROGRESS, new InProgressIssueState());
    this.states.set(IssueStatus.REVIEW, new ReviewIssueState());
    this.states.set(IssueStatus.RESOLVED, new ResolvedIssueState());
    this.states.set(IssueStatus.CLOSED, new ClosedIssueState());
  }

  /**
   * Retrieves polymorphic state object corresponding to an IssueStatus enum value.
   */
  getState(status: IssueStatus): IssueState {
    const state = this.states.get(status);
    if (!state) {
      // Default fallback to open state if unrecognized status occurs
      return this.states.get(IssueStatus.OPEN)!;
    }
    return state;
  }

  /**
   * Returns available workflow transitions for an issue in given status.
   */
  getTransitions(status: IssueStatus): readonly WorkflowTransitionInfo[] {
    return this.getState(status).transitionActions;
  }

  /**
   * Validates if transition from current to target status is permitted.
   * Throws BadRequestException if the transition is prohibited by state machine.
   */
  validateTransition(currentStatus: IssueStatus, targetStatus: IssueStatus): void {
    if (currentStatus === targetStatus) {
      return;
    }
    const state = this.getState(currentStatus);
    if (!state.canTransitionTo(targetStatus)) {
      const allowedTargets = state.allowedTransitions.join(', ') || 'none';
      throw new BadRequestException(
        `Cannot transition issue from ${currentStatus} to ${targetStatus}. Allowed target status(es): ${allowedTargets}`,
      );
    }
  }

  /**
   * Resolves automatic status transition for a VCS pull request event.
   */
  resolvePullRequestTransition(
    currentStatus: IssueStatus,
    action: 'opened' | 'reopened' | 'merged' | 'closed',
  ): IssueStatus | null {
    const state = this.getState(currentStatus);
    return state.onPullRequestAction ? state.onPullRequestAction(action) : null;
  }
}
