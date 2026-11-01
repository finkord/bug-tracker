import { describe, it, expect, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { IssueStatus } from '../entities/issue.entity.js';
import { IssueStateFactory } from './issue-state.factory.js';
import { OpenIssueState } from './open-issue.state.js';
import { InProgressIssueState } from './in-progress-issue.state.js';
import { ReviewIssueState } from './review-issue.state.js';
import { ResolvedIssueState } from './resolved-issue.state.js';
import { ClosedIssueState } from './closed-issue.state.js';

describe('Issue Lifecycle States (State Pattern)', () => {
  let factory: IssueStateFactory;

  beforeEach(() => {
    factory = new IssueStateFactory();
  });

  describe('OpenIssueState', () => {
    const state = new OpenIssueState();

    it('should have OPEN status and correct transitions', () => {
      expect(state.status).toBe(IssueStatus.OPEN);
      expect(state.canTransitionTo(IssueStatus.IN_PROGRESS)).toBe(true);
      expect(state.canTransitionTo(IssueStatus.RESOLVED)).toBe(true);
      expect(state.canTransitionTo(IssueStatus.CLOSED)).toBe(true);
      expect(state.canTransitionTo(IssueStatus.REVIEW)).toBe(false);
    });

    it('should resolve PR open/reopen to REVIEW and merged to RESOLVED', () => {
      expect(state.onPullRequestAction('opened')).toBe(IssueStatus.REVIEW);
      expect(state.onPullRequestAction('reopened')).toBe(IssueStatus.REVIEW);
      expect(state.onPullRequestAction('merged')).toBe(IssueStatus.RESOLVED);
      expect(state.onPullRequestAction('closed')).toBeNull();
    });
  });

  describe('InProgressIssueState', () => {
    const state = new InProgressIssueState();

    it('should allow transitions to REVIEW, RESOLVED, and back to OPEN', () => {
      expect(state.status).toBe(IssueStatus.IN_PROGRESS);
      expect(state.canTransitionTo(IssueStatus.REVIEW)).toBe(true);
      expect(state.canTransitionTo(IssueStatus.RESOLVED)).toBe(true);
      expect(state.canTransitionTo(IssueStatus.OPEN)).toBe(true);
      expect(state.canTransitionTo(IssueStatus.CLOSED)).toBe(false);
    });
  });

  describe('ReviewIssueState', () => {
    const state = new ReviewIssueState();

    it('should allow transitions to RESOLVED and back to IN_PROGRESS', () => {
      expect(state.status).toBe(IssueStatus.REVIEW);
      expect(state.canTransitionTo(IssueStatus.RESOLVED)).toBe(true);
      expect(state.canTransitionTo(IssueStatus.IN_PROGRESS)).toBe(true);
      expect(state.canTransitionTo(IssueStatus.OPEN)).toBe(false);
      expect(state.canTransitionTo(IssueStatus.CLOSED)).toBe(false);
    });
  });

  describe('ResolvedIssueState', () => {
    const state = new ResolvedIssueState();

    it('should allow transitions to CLOSED, OPEN, and IN_PROGRESS', () => {
      expect(state.status).toBe(IssueStatus.RESOLVED);
      expect(state.canTransitionTo(IssueStatus.CLOSED)).toBe(true);
      expect(state.canTransitionTo(IssueStatus.OPEN)).toBe(true);
      expect(state.canTransitionTo(IssueStatus.IN_PROGRESS)).toBe(true);
      expect(state.canTransitionTo(IssueStatus.REVIEW)).toBe(false);
    });
  });

  describe('ClosedIssueState', () => {
    const state = new ClosedIssueState();

    it('should only allow reopening to OPEN', () => {
      expect(state.status).toBe(IssueStatus.CLOSED);
      expect(state.canTransitionTo(IssueStatus.OPEN)).toBe(true);
      expect(state.canTransitionTo(IssueStatus.IN_PROGRESS)).toBe(false);
      expect(state.canTransitionTo(IssueStatus.RESOLVED)).toBe(false);
    });
  });

  describe('IssueStateFactory', () => {
    it('should return correct polymorphic state instances', () => {
      expect(factory.getState(IssueStatus.OPEN)).toBeInstanceOf(OpenIssueState);
      expect(factory.getState(IssueStatus.IN_PROGRESS)).toBeInstanceOf(InProgressIssueState);
      expect(factory.getState(IssueStatus.REVIEW)).toBeInstanceOf(ReviewIssueState);
      expect(factory.getState(IssueStatus.RESOLVED)).toBeInstanceOf(ResolvedIssueState);
      expect(factory.getState(IssueStatus.CLOSED)).toBeInstanceOf(ClosedIssueState);
    });

    it('should not throw when target status matches current status', () => {
      expect(() => factory.validateTransition(IssueStatus.OPEN, IssueStatus.OPEN)).not.toThrow();
      expect(() => factory.validateTransition(IssueStatus.IN_PROGRESS, IssueStatus.IN_PROGRESS)).not.toThrow();
    });

    it('should throw BadRequestException on invalid status transition', () => {
      expect(() => factory.validateTransition(IssueStatus.OPEN, IssueStatus.REVIEW)).toThrow(
        BadRequestException,
      );
      expect(() => factory.validateTransition(IssueStatus.CLOSED, IssueStatus.RESOLVED)).toThrow(
        BadRequestException,
      );
    });

    it('should return transition action descriptors for UI', () => {
      const openTransitions = factory.getTransitions(IssueStatus.OPEN);
      expect(openTransitions.length).toBe(3);
      expect(openTransitions.map((t) => t.toStatus)).toEqual(
        expect.arrayContaining([IssueStatus.IN_PROGRESS, IssueStatus.RESOLVED, IssueStatus.CLOSED]),
      );
    });

    it('should delegate VCS Pull Request transitions', () => {
      expect(factory.resolvePullRequestTransition(IssueStatus.OPEN, 'opened')).toBe(IssueStatus.REVIEW);
      expect(factory.resolvePullRequestTransition(IssueStatus.IN_PROGRESS, 'opened')).toBe(IssueStatus.REVIEW);
      expect(factory.resolvePullRequestTransition(IssueStatus.REVIEW, 'opened')).toBeNull();
      expect(factory.resolvePullRequestTransition(IssueStatus.REVIEW, 'merged')).toBe(IssueStatus.RESOLVED);
      expect(factory.resolvePullRequestTransition(IssueStatus.CLOSED, 'merged')).toBeNull();
    });
  });
});
