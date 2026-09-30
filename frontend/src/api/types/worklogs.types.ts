import type { SystemRole } from './auth.types.js';
import type { IssuePriority, IssueStatus } from './issues.types.js';

export interface WorklogItem {
  id: number;
  timeSpentHours: number;
  dateLogged: string;
  description: string | null;
  createdAt: string;
  user: {
    id: number;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
    systemRole?: SystemRole;
  };
  issue?: {
    id: number;
    key: string;
    title: string;
    status: IssueStatus;
    priority: IssuePriority;
    projectName?: string;
  };
}

export interface PaginatedWorklogsResponse {
  items: WorklogItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SavedFilterItem {
  id: number;
  userId: number;
  name: string;
  criteria: string;
  description?: string | null;
  isFavorite?: boolean;
  createdAt: string;
}

export interface TeamTimesheetMemberWorklog {
  id: number;
  issueId?: number;
  issueKey?: string;
  issueTitle?: string;
  timeSpentHours: number;
  description?: string;
}

export interface TeamTimesheetMatrix {
  startDate: string;
  endDate: string;
  days: string[];
  members: Array<{
    userId: number;
    fullName: string;
    email: string;
    systemRole: SystemRole;
    avatarUrl: string | null;
    dailyHours: Record<string, number>;
    dailyWorklogs?: Record<string, TeamTimesheetMemberWorklog[]>;
    totalPeriodHours: number;
  }>;
  dailyTotals: Record<string, number>;
  grandTotal: number;
}

export interface WorklogStats {
  totalHoursLogged: number;
  hoursLoggedToday: number;
  hoursLoggedThisWeek: number;
  byProject: Array<{ projectId: number; projectName: string; projectKey: string; totalHours: number }>;
  byUser: Array<{ userId: number; fullName: string; email: string; avatarUrl: string | null; totalHours: number }>;
}
