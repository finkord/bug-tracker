import { describe, it, expect, beforeEach } from 'vitest';
import { useRecentIssuesStore } from './useRecentIssuesStore';

describe('useRecentIssuesStore', () => {
  beforeEach(() => {
    useRecentIssuesStore.getState().clearRecentIssues();
  });

  it('initializes with empty recent issues', () => {
    expect(useRecentIssuesStore.getState().recentIssues).toEqual([]);
  });

  it('adds an issue to the front of recent list', () => {
    useRecentIssuesStore.getState().addRecentIssue({
      id: 1,
      key: 'BUG-1',
      title: 'First issue',
      priority: 'HIGH',
      status: 'OPEN',
    });

    const items = useRecentIssuesStore.getState().recentIssues;
    expect(items).toHaveLength(1);
    expect(items[0].key).toBe('BUG-1');
    expect(items[0].title).toBe('First issue');
  });

  it('deduplicates existing issue and moves it to top', () => {
    useRecentIssuesStore.getState().addRecentIssue({ id: 1, key: 'BUG-1', title: 'Issue 1' });
    useRecentIssuesStore.getState().addRecentIssue({ id: 2, key: 'BUG-2', title: 'Issue 2' });
    useRecentIssuesStore.getState().addRecentIssue({ id: 1, key: 'BUG-1', title: 'Issue 1 updated' });

    const items = useRecentIssuesStore.getState().recentIssues;
    expect(items).toHaveLength(2);
    expect(items[0].id).toBe(1);
    expect(items[1].id).toBe(2);
  });

  it('limits recent items to maximum 6', () => {
    for (let i = 1; i <= 8; i++) {
      useRecentIssuesStore.getState().addRecentIssue({ id: i, key: `BUG-${i}`, title: `Issue ${i}` });
    }

    const items = useRecentIssuesStore.getState().recentIssues;
    expect(items).toHaveLength(6);
    expect(items[0].id).toBe(8);
  });
});
