import type { components } from './api.generated.js';
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
  dateLogged?: string;
  user?: {
    id?: number;
    fullName: string;
    avatarUrl?: string | null;
  };
}

export interface TeamTimesheetIssueMember {
  userId: number;
  fullName: string;
  avatarUrl: string | null;
  dailyHours: Record<string, number>;
  totalHours: number;
  worklogs: TeamTimesheetMemberWorklog[];
}

export interface TeamTimesheetIssueGroup {
  issueId: number;
  issueKey: string;
  issueTitle: string;
  totalHours: number;
  dailyHours: Record<string, number>;
  members: Record<number, TeamTimesheetIssueMember>;
}

export type TeamTimesheetMember = Omit<components['schemas']['TimesheetMemberDto'], 'dailyWorklogs' | 'dailyHours' | 'avatarUrl'> & {
  systemRole?: SystemRole;
  avatarUrl?: string | null;
  dailyHours: Record<string, number>;
  dailyWorklogs?: Record<string, TeamTimesheetMemberWorklog[]>;
};

export type TeamTimesheetMatrix = Omit<components['schemas']['TimesheetMatrixResponseDto'], 'members' | 'issues' | 'dailyTotals'> & {
  members: TeamTimesheetMember[];
  issues?: TeamTimesheetIssueGroup[];
  dailyTotals: Record<string, number>;
};

export type WorklogStats = components['schemas']['WorklogStatsResponseDto'];
export type LogWorkPayload = components['schemas']['LogWorkDto'];
export type CreateSavedFilterPayload = components['schemas']['CreateSavedFilterDto'];
export type UpdateSavedFilterPayload = components['schemas']['UpdateSavedFilterDto'];

