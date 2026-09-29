import { z } from 'zod';

export const IssueTypeEnum = z.enum(['BUG', 'TASK', 'FEATURE', 'IMPROVEMENT']);
export const IssueStatusEnum = z.enum(['OPEN', 'IN_PROGRESS', 'REVIEW', 'RESOLVED', 'CLOSED']);
export const IssuePriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export const IssueSeverityEnum = z.enum(['MINOR', 'MAJOR', 'BLOCKER', 'TRIVIAL']);
export const IssueLinkTypeEnum = z.enum(['BLOCKS', 'IS_BLOCKED_BY', 'DUPLICATES', 'RELATES_TO']);

export const UserSnippetSchema = z.object({
  id: z.number(),
  fullName: z.string(),
  email: z.string().email(),
  avatarUrl: z.string().nullable().optional(),
  systemRole: z.string().optional(),
});

export const IssueCommentSchema = z.object({
  id: z.number(),
  text: z.string().min(1),
  author: UserSnippetSchema,
  createdAt: z.string(),
});

export const AttachmentSchema = z.object({
  id: z.number(),
  filename: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  url: z.string(),
  fid: z.string(),
  uploader: UserSnippetSchema.optional(),
  createdAt: z.string(),
});

export const IssueSchema = z.object({
  id: z.number(),
  key: z.string(),
  projectId: z.number(),
  projectKey: z.string(),
  projectName: z.string(),
  issueNum: z.number(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable(),
  issueType: IssueTypeEnum,
  status: IssueStatusEnum,
  priority: IssuePriorityEnum,
  severity: IssueSeverityEnum,
  estimatedHours: z.number().default(0),
  loggedHours: z.number().default(0),
  sprint: z.string().nullable(),
  reporter: UserSnippetSchema,
  assignee: UserSnippetSchema.nullable(),
  commentsCount: z.number().optional(),
  comments: z.array(IssueCommentSchema).optional(),
  attachments: z.array(AttachmentSchema).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Issue = z.infer<typeof IssueSchema>;

export const CreateIssueSchema = z.object({
  projectId: z.number({ message: 'Project ID is required' }),
  title: z.string().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters'),
  description: z.string().optional(),
  issueType: IssueTypeEnum.default('TASK'),
  priority: IssuePriorityEnum.default('MEDIUM'),
  severity: IssueSeverityEnum.default('MINOR'),
  estimatedHours: z.number().min(0).max(1000).optional(),
  sprint: z.string().optional(),
  assigneeId: z.number().optional(),
});

export type CreateIssueInput = z.infer<typeof CreateIssueSchema>;

export const UpdateIssueStatusSchema = z.object({
  status: IssueStatusEnum,
});

export type UpdateIssueStatusInput = z.infer<typeof UpdateIssueStatusSchema>;
