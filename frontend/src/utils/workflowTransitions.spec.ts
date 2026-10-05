import { describe, it, expect } from 'vitest';
import { isAllowedTransition, WORKFLOW_TRANSITIONS_GRAPH } from './workflowTransitions.js';

describe('workflowTransitions', () => {
  it('allows same-status transitions as valid no-op/reorder', () => {
    expect(isAllowedTransition('OPEN', 'OPEN')).toBe(true);
    expect(isAllowedTransition('IN_PROGRESS', 'IN_PROGRESS')).toBe(true);
    expect(isAllowedTransition('REVIEW', 'REVIEW')).toBe(true);
    expect(isAllowedTransition('RESOLVED', 'RESOLVED')).toBe(true);
    expect(isAllowedTransition('CLOSED', 'CLOSED')).toBe(true);
  });

  it('permits valid transitions from OPEN', () => {
    expect(isAllowedTransition('OPEN', 'IN_PROGRESS')).toBe(true);
    expect(isAllowedTransition('OPEN', 'RESOLVED')).toBe(true);
    expect(isAllowedTransition('OPEN', 'CLOSED')).toBe(true);
    expect(isAllowedTransition('OPEN', 'REVIEW')).toBe(false);
  });

  it('permits valid transitions from IN_PROGRESS', () => {
    expect(isAllowedTransition('IN_PROGRESS', 'REVIEW')).toBe(true);
    expect(isAllowedTransition('IN_PROGRESS', 'RESOLVED')).toBe(true);
    expect(isAllowedTransition('IN_PROGRESS', 'OPEN')).toBe(true);
    expect(isAllowedTransition('IN_PROGRESS', 'CLOSED')).toBe(false);
  });

  it('permits valid transitions from REVIEW', () => {
    expect(isAllowedTransition('REVIEW', 'RESOLVED')).toBe(true);
    expect(isAllowedTransition('REVIEW', 'IN_PROGRESS')).toBe(true);
    expect(isAllowedTransition('REVIEW', 'OPEN')).toBe(false);
    expect(isAllowedTransition('REVIEW', 'CLOSED')).toBe(false);
  });

  it('permits valid transitions from RESOLVED', () => {
    expect(isAllowedTransition('RESOLVED', 'CLOSED')).toBe(true);
    expect(isAllowedTransition('RESOLVED', 'OPEN')).toBe(true);
    expect(isAllowedTransition('RESOLVED', 'IN_PROGRESS')).toBe(true);
    expect(isAllowedTransition('RESOLVED', 'REVIEW')).toBe(false);
  });

  it('permits valid transitions from CLOSED', () => {
    expect(isAllowedTransition('CLOSED', 'OPEN')).toBe(true);
    expect(isAllowedTransition('CLOSED', 'IN_PROGRESS')).toBe(false);
    expect(isAllowedTransition('CLOSED', 'REVIEW')).toBe(false);
    expect(isAllowedTransition('CLOSED', 'RESOLVED')).toBe(false);
  });

  it('contains graph definitions for all 5 statuses', () => {
    expect(Object.keys(WORKFLOW_TRANSITIONS_GRAPH)).toEqual([
      'OPEN',
      'IN_PROGRESS',
      'REVIEW',
      'RESOLVED',
      'CLOSED',
    ]);
  });
});
