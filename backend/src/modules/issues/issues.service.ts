import { Injectable } from '@nestjs/common';
import { IssueStatus } from './entities/issue.entity.js';
import { User } from '../users/entities/user.entity.js';
import { CreateIssueDto } from './dto/create-issue.dto.js';
import { UpdateIssueDto } from './dto/update-issue.dto.js';
import { CreateIssueLinkDto } from './dto/create-issue-link.dto.js';
import { ListIssuesQueryDto } from './dto/list-issues-query.dto.js';
import { LogWorkDto } from './dto/log-work.dto.js';
import { BulkUpdateIssuesDto, BulkDeleteIssuesDto, type BulkOperationResultDto } from './dto/bulk-issue.dto.js';
import { type UploadedFileInput } from './services/seaweedfs.service.js';
import { IssueCoreService } from './services/issue-core.service.js';
import { IssueWorklogService } from './services/issue-worklog.service.js';
import { IssueLinksService } from './services/issue-links.service.js';
import { IssueCommentsService } from './services/issue-comments.service.js';
import { IssueAttachmentsService } from './services/issue-attachments.service.js';
import { EventsGateway } from '../events/events.gateway.js';
import { Attachment } from './entities/attachment.entity.js';
import { JqlParserService } from './services/jql-parser.service.js';
import type { JqlValidationResponseDto } from './dto/validate-jql.dto.js';
import type {
  IssueDetailDto,
  WorklogItemDto,
  TimesheetMatrixResponseDto,
  WorklogStatsResponseDto,
  IssueLinkItemDto,
  CommentItemDto,
  PaginatedIssuesResponseDto,
  PaginatedWorklogsResponseDto,
} from './dto/issue-response.dto.js';

/**
 * Unified Facade for the Issues subsystem coordinating domain subservices.
 */
@Injectable()
export class IssuesService {
  constructor(
    private readonly issueCoreService: IssueCoreService,
    private readonly issueWorklogService: IssueWorklogService,
    private readonly issueLinksService: IssueLinksService,
    private readonly issueCommentsService: IssueCommentsService,
    private readonly issueAttachmentsService: IssueAttachmentsService,
    private readonly eventsGateway: EventsGateway,
    private readonly jqlParserService: JqlParserService,
  ) {}

  /**
   * Validates JQL syntax and returns parsed clauses/ordering information.
   */
  validateJql(jql: string): JqlValidationResponseDto {
    return this.jqlParserService.validate(jql);
  }

  /**
   * Retrieves list of issues with multi-criteria filtering.
   */
  async findAll(query: ListIssuesQueryDto, user?: User): Promise<PaginatedIssuesResponseDto> {
    return this.issueCoreService.findAll(query, user);
  }

  /**
   * Retrieves single issue with relations, full comments thread, and worklog history.
   */
  async findByKeyOrId(keyOrId: string | number): Promise<IssueDetailDto> {
    return this.issueCoreService.findByKeyOrId(keyOrId);
  }

  /**
   * Retrieves single issue by ID.
   */
  async findById(id: number): Promise<IssueDetailDto> {
    return this.issueCoreService.findById(id);
  }

  /**
   * Creates a new issue within a project.
   */
  async create(dto: CreateIssueDto, reporter: User): Promise<IssueDetailDto> {
    return this.issueCoreService.create(dto, reporter);
  }

  /**
   * Updates issue status.
   */
  async updateStatus(id: number, status: IssueStatus): Promise<IssueDetailDto> {
    return this.issueCoreService.updateStatus(id, status);
  }

  /**
   * Assigns the issue directly to the user.
   */
  async assignToMe(id: number, user: User): Promise<IssueDetailDto> {
    return this.issueCoreService.assignToMe(id, user);
  }

  /**
   * Updates relational sprint assignment.
   */
  async updateSprint(id: number, sprintId: number | null, user?: User): Promise<IssueDetailDto> {
    return this.issueCoreService.updateSprint(id, sprintId, user);
  }

  /**
   * Updates issue metadata.
   */
  async update(id: number, dto: UpdateIssueDto, user?: User): Promise<IssueDetailDto> {
    return this.issueCoreService.update(id, dto, user);
  }

  /**
   * Retrieves change audit log history for an issue.
   */
  async getIssueHistory(id: number) {
    return this.issueCoreService.getIssueHistory(id);
  }

  /**
   * Deletes an issue by ID.
   */
  async remove(id: number, user?: User): Promise<{ success: boolean; message: string }> {
    return this.issueCoreService.remove(id, user);
  }

  /**
   * Bulk updates multiple issues atomically.
   */
  async bulkUpdate(dto: BulkUpdateIssuesDto, user: User): Promise<BulkOperationResultDto> {
    return this.issueCoreService.bulkUpdate(dto, user);
  }

  /**
   * Bulk deletes multiple issues atomically.
   */
  async bulkDelete(dto: BulkDeleteIssuesDto, user: User): Promise<BulkOperationResultDto> {
    return this.issueCoreService.bulkDelete(dto, user);
  }

  /**
   * Retrieves semantic issue links.
   */
  async getIssueLinks(issueId: number): Promise<IssueLinkItemDto[]> {
    return this.issueLinksService.getIssueLinks(issueId);
  }

  /**
   * Creates a dependency link between issues.
   */
  async createIssueLink(sourceIssueId: number, dto: CreateIssueLinkDto): Promise<IssueLinkItemDto> {
    return this.issueLinksService.createIssueLink(sourceIssueId, dto);
  }

  /**
   * Deletes an issue link by ID.
   */
  async deleteIssueLink(linkId: number): Promise<{ success: boolean; message: string }> {
    return this.issueLinksService.deleteIssueLink(linkId);
  }

  /**
   * Logs work spent on an issue and broadcasts updates.
   */
  async logWork(issueId: number, user: User, dto: LogWorkDto): Promise<IssueDetailDto> {
    await this.issueWorklogService.logWork(issueId, user, dto);
    const updated = await this.issueCoreService.findById(issueId);
    await this.eventsGateway.broadcastIssueUpdated(updated);
    return updated;
  }

  /**
   * Retrieves worklogs for a given issue ID.
   */
  async getWorklogs(issueId: number): Promise<WorklogItemDto[]> {
    return this.issueWorklogService.getWorklogs(issueId);
  }

  /**
   * Deletes a worklog and broadcasts updated issue data.
   */
  async deleteWorklog(issueId: number, worklogId: number, user: User): Promise<{ success: boolean; issue: IssueDetailDto }> {
    await this.issueWorklogService.deleteWorklog(issueId, worklogId, user);
    const updated = await this.issueCoreService.findById(issueId);
    await this.eventsGateway.broadcastIssueUpdated(updated);
    return { success: true, issue: updated };
  }

  /**
   * Retrieves recent worklogs logged by the current user with server-side pagination.
   */
  async getMyWorklogs(userId: number, page?: number, limit?: number): Promise<PaginatedWorklogsResponseDto> {
    return this.issueWorklogService.getMyWorklogs(userId, page, limit);
  }

  /**
   * Retrieves team timesheet matrix with project isolation.
   */
  async getTeamTimesheetMatrix(
    user: User,
    startDate?: string,
    endDate?: string,
    projectId?: number,
    userId?: number,
    groupBy?: 'user' | 'issue',
  ): Promise<TimesheetMatrixResponseDto> {
    return this.issueWorklogService.getTeamTimesheetMatrix(user, startDate, endDate, projectId, userId, groupBy);
  }

  /**
   * Retrieves aggregated worklog statistics scoped by accessible projects.
   */
  async getWorklogStats(user: User): Promise<WorklogStatsResponseDto> {
    return this.issueWorklogService.getWorklogStats(user);
  }

  /**
   * Adds a discussion comment to an issue.
   */
  async addComment(issueId: number, text: string, author: User): Promise<CommentItemDto> {
    return this.issueCommentsService.addComment(issueId, text, author);
  }

  /**
   * Updates an issue comment.
   */
  async updateComment(issueId: number, commentId: number, text: string, user: User): Promise<CommentItemDto> {
    return this.issueCommentsService.updateComment(issueId, commentId, text, user);
  }

  /**
   * Deletes an issue comment.
   */
  async deleteComment(issueId: number, commentId: number, user: User): Promise<{ success: boolean; message: string }> {
    return this.issueCommentsService.deleteComment(issueId, commentId, user);
  }

  /**
   * Uploads file attachment to SeaweedFS.
   */
  async uploadAttachment(issueId: number, file: UploadedFileInput, uploader: User): Promise<Attachment> {
    return this.issueAttachmentsService.uploadAttachment(issueId, file, uploader);
  }

  /**
   * Retrieves attachment by ID.
   */
  async getAttachmentById(id: number): Promise<Attachment> {
    return this.issueAttachmentsService.getAttachmentById(id);
  }

  /**
   * Lists attachments for an issue.
   */
  async getAttachments(issueId: number): Promise<Attachment[]> {
    return this.issueAttachmentsService.getAttachments(issueId);
  }

  /**
   * Deletes attachment by ID.
   */
  async deleteAttachment(issueId: number, attachmentId: number, user: User): Promise<{ message: string }> {
    return this.issueAttachmentsService.deleteAttachment(issueId, attachmentId, user);
  }
}
