export type SearchMode = 'basic' | 'jql';
export type ViewLayout = 'list' | 'detail';

export type SortField = 'createdAt' | 'updatedAt' | 'priority' | 'key' | 'title' | 'status';
export type SortOrder = 'asc' | 'desc';

export interface BasicFilterCriteria {
  projectKey: string; // 'ALL' or specific project key
  issueTypes: string[]; // empty array for ALL or array of IssueType
  statuses: string[]; // empty array for ALL or array of IssueStatus
  priorities: string[]; // empty array for ALL or array of IssuePriority
  assignee: string; // 'ALL', 'ME', 'UNASSIGNED', or userId
  sprint: string; // 'ALL', 'BACKLOG', 'ACTIVE', or sprint name
}

export interface SavedFilterPreset {
  id: string;
  name: string;
  description?: string;
  jql: string;
  isFavorite?: boolean;
  createdAt: string;
}

export interface SystemFilterPreset {
  id: string;
  name: string;
  iconName: string;
  description: string;
  jql: string;
  basicCriteria?: Partial<BasicFilterCriteria>;
}

export const SYSTEM_FILTER_PRESETS: SystemFilterPreset[] = [
  {
    id: 'my-open',
    name: 'My Open Issues',
    iconName: 'UserCheck',
    description: 'Unresolved issues assigned to you',
    jql: 'assignee = currentUser() AND status != "DONE" ORDER BY priority DESC',
  },
  {
    id: 'reported-by-me',
    name: 'Reported by Me',
    iconName: 'FileCheck2',
    description: 'Issues created by you across all workspaces',
    jql: 'reporter = currentUser() ORDER BY createdAt DESC',
  },
  {
    id: 'critical-high',
    name: 'Critical & High Priority',
    iconName: 'Sparkles',
    description: 'High-urgency open work requiring immediate attention',
    jql: 'priority IN ("CRITICAL", "HIGH") AND status != "DONE" ORDER BY priority DESC',
  },
  {
    id: 'recently-updated',
    name: 'Recently Updated',
    iconName: 'Clock',
    description: 'Issues modified most recently across all workspaces',
    jql: 'status != "DONE" ORDER BY updatedAt DESC',
  },
  {
    id: 'done-issues',
    name: 'Done Issues',
    iconName: 'CheckCircle2',
    description: 'Completed and closed issues',
    jql: 'status = "DONE" ORDER BY updatedAt DESC',
  },
];
