import { IssuePriority, IssueSeverity, IssueStatus, IssueType } from '../entities/issue.entity.js';
import { IssueLinkType } from '../entities/issue-link.entity.js';

export interface UserSummaryDto {
  id: number;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  systemRole?: string;
}

export interface IssueSummaryDto {
  id: number;
  key: string;
  projectId: number;
  projectKey: string;
  projectName: string;
  issueNum: number;
  title: string;
  description: string | null;
  issueType: IssueType;
  status: IssueStatus;
  priority: IssuePriority;
  severity: IssueSeverity;
  estimatedHours: number;
  loggedHours: number;
  sprint: string | null;
  reporter: UserSummaryDto;
  assignee: UserSummaryDto | null;
  commentsCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentItemDto {
  id: number;
  text: string;
  author: UserSummaryDto;
  createdAt: Date;
}

export interface WorklogItemDto {
  id: number;
  timeSpentHours: number;
  dateLogged: string;
  description: string | null;
  createdAt: Date;
  user: UserSummaryDto;
}

export interface MyWorklogItemDto {
  id: number;
  timeSpentHours: number;
  dateLogged: string;
  description: string | null;
  createdAt: Date;
  issue: {
    id: number;
    key: string;
    title: string;
    status: IssueStatus;
    priority: IssuePriority;
    projectName?: string;
  } | null;
}

export interface IssueAttachmentDto {
  id: number;
  filename: string;
  fileSize: number;
  mimeType: string;
  fid: string;
  url: string;
  createdAt: Date;
  uploader: UserSummaryDto | null;
}

export interface LinkedIssueSummaryDto {
  id: number;
  key: string;
  title: string;
  status: IssueStatus;
  priority: IssuePriority;
  issueType: IssueType;
  projectName?: string;
  projectKey?: string;
}

export interface IssueLinkItemDto {
  id: number;
  linkType: IssueLinkType;
  direction: 'OUTWARD' | 'INWARD';
  label: string;
  linkedIssue: LinkedIssueSummaryDto | null;
  createdAt: Date;
}

export interface IssueDetailDto extends IssueSummaryDto {
  comments: CommentItemDto[];
  worklogs: WorklogItemDto[];
  attachments: IssueAttachmentDto[];
  links: IssueLinkItemDto[];
}

export interface TimesheetMemberWorklogDto {
  id: number;
  issueId?: number;
  issueKey?: string;
  issueTitle?: string;
  timeSpentHours: number;
  description?: string;
}

export interface TimesheetMemberDto {
  userId: number;
  fullName: string;
  email: string;
  systemRole: string;
  avatarUrl: string | null;
  dailyHours: Record<string, number>;
  dailyWorklogs?: Record<string, TimesheetMemberWorklogDto[]>;
  totalPeriodHours: number;
}

export interface TimesheetMatrixResponseDto {
  startDate: string;
  endDate: string;
  days: string[];
  members: TimesheetMemberDto[];
  dailyTotals: Record<string, number>;
  grandTotal: number;
}

export interface ProjectWorklogStatDto {
  projectId: number;
  projectName: string;
  projectKey: string;
  totalHours: number;
}

export interface UserWorklogStatDto {
  userId: number;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  totalHours: number;
}

export interface WorklogStatsResponseDto {
  totalHoursLogged: number;
  hoursLoggedToday: number;
  hoursLoggedThisWeek: number;
  byProject: ProjectWorklogStatDto[];
  byUser: UserWorklogStatDto[];
}
