import type { SystemRole } from './auth.types.js';

export type IssueType = 'BUG' | 'TASK' | 'FEATURE' | 'IMPROVEMENT' | 'SUBTASK';
export type IssueStatus = 'OPEN' | 'IN_PROGRESS' | 'REVIEW' | 'RESOLVED' | 'CLOSED';
export type IssuePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IssueLinkType = 'BLOCKS' | 'IS_BLOCKED_BY' | 'DUPLICATES' | 'RELATES_TO';

export interface IssueComment {
  id: number;
  text: string;
  author: {
    id: number;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
    systemRole?: SystemRole;
  };
  createdAt: string;
}

export interface AttachmentItem {
  id: number;
  filename: string;
  fileSize: number;
  mimeType: string;
  url: string;
  fid: string;
  uploader?: {
    id: number;
    fullName: string;
    avatarUrl?: string | null;
    systemRole?: SystemRole;
  };
  createdAt: string;
}

export interface IssueLinkItem {
  id: number;
  linkType: IssueLinkType;
  direction: 'OUTWARD' | 'INWARD';
  label: string;
  linkedIssue: {
    id: number;
    key: string;
    title: string;
    status: IssueStatus;
    priority: IssuePriority;
    issueType: IssueType;
    projectName?: string;
    projectKey?: string;
  };
  createdAt: string;
}

export interface IssueHistoryItem {
  id: number;
  issueId: number;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  user: {
    id: number;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
  } | null;
  createdAt: string;
}

export interface IssueItem {
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
  sprintId: number | null;
  sprint?: {
    id: number;
    name: string;
    status: string;
  } | null;
  componentId?: number | null;
  component?: import('./projects.types.js').ProjectComponentItem | null;
  fixVersionId?: number | null;
  fixVersion?: import('./projects.types.js').ProjectVersionItem | null;
  labels?: string[];
  reporter: {
    id: number;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
    systemRole?: SystemRole;
  };
  assignee: {
    id: number;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
    systemRole?: SystemRole;
  } | null;
  commentsCount?: number;
  comments?: IssueComment[];
  worklogs?: import('./worklogs.types.js').WorklogItem[];
  attachments?: AttachmentItem[];
  links?: IssueLinkItem[];
  parentId?: number | null;
  subtasksCount?: number;
  parent?: IssueItem | null;
  subtasks?: IssueItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateIssuePayload {
  projectId: number;
  title: string;
  description?: string;
  issueType?: IssueType;
  priority?: IssuePriority;
  estimatedHours?: number;
  sprintId?: number | null;
  assigneeId?: number | null;
  reporterId?: number;
  componentId?: number | null;
  fixVersionId?: number | null;
  affectsVersionId?: number | null;
  labels?: string[];
  parentId?: number | null;
}

export interface BulkUpdateIssuesDto {
  issueIds: number[];
  status?: IssueStatus;
  priority?: IssuePriority;
  assigneeId?: number | null;
  sprintId?: number | null;
}

export interface BulkDeleteIssuesDto {
  issueIds: number[];
}

export interface BulkOperationResultDto {
  success: boolean;
  affectedCount: number;
  message: string;
}

export interface PaginatedIssuesResponse {
  items: IssueItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetIssuesParams {
  projectId?: number;
  status?: IssueStatus;
  priority?: IssuePriority;
  issueType?: IssueType;
  assigneeId?: number;
  sprintId?: string | number;
  search?: string;
  jql?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface VcsPullRequestItem {
  id: number;
  issueId: number;
  provider: 'github' | 'gitlab' | 'bitbucket';
  repository: string;
  prNumber: number;
  title: string;
  sourceBranch: string;
  targetBranch: string;
  status: 'OPEN' | 'MERGED' | 'CLOSED';
  url: string;
  authorUsername: string | null;
  createdAt: string;
  updatedAt: string;
}
