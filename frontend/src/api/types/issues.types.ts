import type { SystemRole } from './auth.types.js';

export type IssueType = 'BUG' | 'TASK' | 'FEATURE' | 'IMPROVEMENT';
export type IssueStatus = 'OPEN' | 'IN_PROGRESS' | 'REVIEW' | 'RESOLVED' | 'CLOSED';
export type IssuePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IssueSeverity = 'MINOR' | 'MAJOR' | 'BLOCKER' | 'TRIVIAL';
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
  severity: IssueSeverity;
  estimatedHours: number;
  loggedHours: number;
  sprint: string | null;
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
  worklogs?: any[];
  attachments?: AttachmentItem[];
  links?: IssueLinkItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateIssuePayload {
  projectId: number;
  title: string;
  description?: string;
  issueType?: IssueType;
  priority?: IssuePriority;
  severity?: IssueSeverity;
  estimatedHours?: number;
  sprint?: string;
  assigneeId?: number;
}
