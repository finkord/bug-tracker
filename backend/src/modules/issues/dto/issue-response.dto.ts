import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IssuePriority, IssueStatus, IssueType } from '../entities/issue.entity.js';
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
  estimatedHours: number;
  loggedHours: number;
  order?: number;
  sprintId: number | null;
  sprint?: {
    id: number;
    name: string;
    status: string;
  } | null;
  reporter: UserSummaryDto;
  assignee: UserSummaryDto | null;
  commentsCount?: number;
  parentId?: number | null;
  subtasksCount?: number;
  componentId?: number | null;
  component?: {
    id: number;
    name: string;
    description: string | null;
  } | null;
  fixVersionId?: number | null;
  fixVersion?: {
    id: number;
    name: string;
    status: string;
  } | null;
  labels?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedIssuesResponseDto {
  items: IssueSummaryDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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

export interface PaginatedWorklogsResponseDto {
  items: MyWorklogItemDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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
  parent?: IssueSummaryDto | null;
  subtasks?: IssueSummaryDto[];
}

export class TimesheetMemberWorklogDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiPropertyOptional({ example: 42 })
  issueId?: number;

  @ApiPropertyOptional({ example: 'BT-42' })
  issueKey?: string;

  @ApiPropertyOptional({ example: 'Implement auth token rotation' })
  issueTitle?: string;

  @ApiProperty({ example: 2.5 })
  timeSpentHours: number;

  @ApiPropertyOptional({ example: 'Worked on unit tests' })
  description?: string;
}

export class TimesheetMemberDto {
  @ApiProperty({ example: 1 })
  userId: number;

  @ApiProperty({ example: 'Alice Developer' })
  fullName: string;

  @ApiProperty({ example: 'alice@example.com' })
  email: string;

  @ApiProperty({ example: 'USER' })
  systemRole: string;

  @ApiPropertyOptional({ type: String, example: null, nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ example: { '2026-09-24': 4 }, type: 'object', additionalProperties: { type: 'number' } })
  dailyHours: Record<string, number>;

  @ApiPropertyOptional({ type: () => Object })
  dailyWorklogs?: Record<string, TimesheetMemberWorklogDto[]>;

  @ApiProperty({ example: 20 })
  totalPeriodHours: number;
}

export class TimesheetIssueMemberDto {
  @ApiProperty({ example: 1 })
  userId: number;

  @ApiProperty({ example: 'Alice Developer' })
  fullName: string;

  @ApiPropertyOptional({ type: String, example: null, nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ example: { '2026-09-24': 4 }, type: 'object', additionalProperties: { type: 'number' } })
  dailyHours: Record<string, number>;

  @ApiProperty({ example: 8 })
  totalHours: number;

  @ApiProperty({ type: () => [TimesheetMemberWorklogDto] })
  worklogs: TimesheetMemberWorklogDto[];
}

export class TimesheetIssueGroupDto {
  @ApiProperty({ example: 42 })
  issueId: number;

  @ApiProperty({ example: 'BT-42' })
  issueKey: string;

  @ApiProperty({ example: 'Fix memory leak' })
  issueTitle: string;

  @ApiProperty({ example: 12 })
  totalHours: number;

  @ApiProperty({ example: { '2026-09-24': 4 }, type: 'object', additionalProperties: { type: 'number' } })
  dailyHours: Record<string, number>;

  @ApiProperty({ type: () => Object })
  members: Record<number, TimesheetIssueMemberDto>;
}

export class TimesheetMatrixResponseDto {
  @ApiProperty({ example: '2026-09-20' })
  startDate: string;

  @ApiProperty({ example: '2026-09-27' })
  endDate: string;

  @ApiProperty({ example: ['2026-09-20', '2026-09-21'] })
  days: string[];

  @ApiProperty({ type: () => [TimesheetMemberDto] })
  members: TimesheetMemberDto[];

  @ApiPropertyOptional({ type: () => [TimesheetIssueGroupDto] })
  issues?: TimesheetIssueGroupDto[];

  @ApiProperty({ example: { '2026-09-20': 8 }, type: 'object', additionalProperties: { type: 'number' } })
  dailyTotals: Record<string, number>;

  @ApiProperty({ example: 40 })
  grandTotal: number;

  @ApiPropertyOptional({ enum: ['user', 'issue'] })
  groupBy?: 'user' | 'issue';
}

export class ProjectWorklogStatDto {
  @ApiProperty({ example: 1 })
  projectId: number;

  @ApiProperty({ example: 'Core Platform' })
  projectName: string;

  @ApiProperty({ example: 'CORE' })
  projectKey: string;

  @ApiProperty({ example: 45.5 })
  totalHours: number;
}

export class UserWorklogStatDto {
  @ApiProperty({ example: 1 })
  userId: number;

  @ApiProperty({ example: 'Alice Developer' })
  fullName: string;

  @ApiProperty({ example: 'alice@example.com' })
  email: string;

  @ApiPropertyOptional({ type: String, example: null, nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ example: 38 })
  totalHours: number;
}

export class WorklogStatsResponseDto {
  @ApiProperty({ example: 120.5 })
  totalHoursLogged: number;

  @ApiProperty({ example: 7.5 })
  hoursLoggedToday: number;

  @ApiProperty({ example: 35 })
  hoursLoggedThisWeek: number;

  @ApiProperty({ type: () => [ProjectWorklogStatDto] })
  byProject: ProjectWorklogStatDto[];

  @ApiProperty({ type: () => [UserWorklogStatDto] })
  byUser: UserWorklogStatDto[];
}
