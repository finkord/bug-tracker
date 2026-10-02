import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { IssuePriority, IssueStatus } from '../api/client';

export interface RecentIssueItem {
  id: number;
  key: string;
  title: string;
  priority: IssuePriority;
  status: IssueStatus;
  visitedAt: number;
}

export interface RecentIssuesState {
  recentIssues: RecentIssueItem[];
  addRecentIssue: (issue: {
    id: number;
    key?: string;
    title: string;
    priority?: IssuePriority;
    status?: IssueStatus;
  }) => void;
  removeRecentIssue: (id: number) => void;
  clearRecentIssues: () => void;
}

export const useRecentIssuesStore = create<RecentIssuesState>()(
  persist(
    (set) => ({
      recentIssues: [],
      addRecentIssue: (issue) =>
        set((state) => {
          if (!issue.id || !issue.title) return state;
          const filtered = state.recentIssues.filter((item) => item.id !== issue.id);
          const newItem: RecentIssueItem = {
            id: issue.id,
            key: issue.key || `ISSUE-${issue.id}`,
            title: issue.title,
            priority: issue.priority || 'MEDIUM',
            status: issue.status || 'OPEN',
            visitedAt: Date.now(),
          };
          return {
            recentIssues: [newItem, ...filtered].slice(0, 6),
          };
        }),
      removeRecentIssue: (id) =>
        set((state) => ({
          recentIssues: state.recentIssues.filter((item) => item.id !== id),
        })),
      clearRecentIssues: () => set({ recentIssues: [] }),
    }),
    {
      name: 'bt_recent_issues',
    },
  ),
);
