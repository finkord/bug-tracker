import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../api/client';
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
  syncWithCloud: () => Promise<void>;
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
          const updated = [newItem, ...filtered].slice(0, 6);
          // Persist asynchronously to PostgreSQL user preferences in cloud
          api.updatePreferences({ recentIssues: updated }).catch(() => {});
          return {
            recentIssues: updated,
          };
        }),
      removeRecentIssue: (id) =>
        set((state) => {
          const updated = state.recentIssues.filter((item) => item.id !== id);
          api.updatePreferences({ recentIssues: updated }).catch(() => {});
          return {
            recentIssues: updated,
          };
        }),
      clearRecentIssues: () => {
        api.updatePreferences({ recentIssues: [] }).catch(() => {});
        set({ recentIssues: [] });
      },
      syncWithCloud: async () => {
        try {
          const prefs = await api.getPreferences();
          if (Array.isArray(prefs?.recentIssues)) {
            set({ recentIssues: prefs.recentIssues as RecentIssueItem[] });
          }
        } catch {
          // Graceful fallback if offline or unauthenticated
        }
      },
    }),
    {
      name: 'bt_recent_issues',
    },
  ),
);
