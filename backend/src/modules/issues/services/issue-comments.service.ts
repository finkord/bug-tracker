import { Injectable, NotFoundException, ForbiddenException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../entities/comment.entity.js';
import { Issue } from '../entities/issue.entity.js';
import { User, SystemRole } from '../../users/entities/user.entity.js';
import { EventsGateway } from '../../events/events.gateway.js';
import { NotificationsService } from '../../notifications/notifications.service.js';
import { NotificationType } from '../../notifications/entities/notification.entity.js';
import { PermissionEvaluatorService } from '../../rbac/services/permission-evaluator.service.js';
import { ProjectPermission } from '../../rbac/entities/permission-grant.entity.js';
import type { CommentItemDto } from '../dto/issue-response.dto.js';

/**
 * Service responsible for managing issue comments and discussion threads.
 */
@Injectable()
export class IssueCommentsService {
  constructor(
    @InjectRepository(Issue)
    private readonly issueRepository: Repository<Issue>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    private readonly eventsGateway: EventsGateway,
    private readonly notificationsService: NotificationsService,
    @Optional()
    private readonly permissionEvaluator?: PermissionEvaluatorService,
  ) {}

  /**
   * Adds a discussion comment to an issue and broadcasts realtime socket event.
   */
  async addComment(issueId: number, text: string, author: User): Promise<CommentItemDto> {
    const issue = await this.issueRepository.findOne({ where: { id: issueId } });
    if (!issue) {
      throw new NotFoundException(`Issue #${issueId} not found`);
    }
    const comment = this.commentRepository.create({
      issueId,
      issue,
      authorId: author.id,
      author,
      text: text.trim(),
    });
    const saved = await this.commentRepository.save(comment);
    const commentPayload: CommentItemDto = {
      id: saved.id,
      text: saved.text,
      author: {
        id: author.id,
        fullName: author.fullName,
        email: author.email,
        avatarUrl: author.avatarUrl || null,
        systemRole: author.systemRole,
      },
      createdAt: saved.createdAt,
    };
    this.eventsGateway.broadcastCommentAdded({ issueId, comment: commentPayload });

    // Trigger notification to assignee or reporter
    const notifyTargetUserId =
      issue.assigneeId && issue.assigneeId !== author.id
        ? issue.assigneeId
        : issue.reporterId && issue.reporterId !== author.id
          ? issue.reporterId
          : null;

    if (notifyTargetUserId) {
      await this.notificationsService.createNotification({
        userId: notifyTargetUserId,
        actorId: author.id,
        issueId: issue.id,
        type: NotificationType.COMMENT_ADDED,
        title: `New comment on ${issue.title}`,
        message: `${author.fullName}: "${text.slice(0, 100)}${text.length > 100 ? '...' : ''}"`,
      });
    }

    return commentPayload;
  }

  /**
   * Retrieves comments thread for a given issue ID.
   */
  async getCommentsByIssueId(issueId: number): Promise<CommentItemDto[]> {
    const comments = await this.commentRepository.find({
      where: { issueId },
      relations: { author: true },
      order: { createdAt: 'ASC' },
    });
    return comments.map((c) => ({
      id: c.id,
      text: c.text,
      author: {
        id: c.author?.id,
        fullName: c.author?.fullName,
        email: c.author?.email,
        avatarUrl: c.author?.avatarUrl || null,
        systemRole: c.author?.systemRole,
      },
      createdAt: c.createdAt,
    }));
  }

  /**
   * Updates an existing comment on an issue and broadcasts realtime socket event.
   * Enforces EDIT_OWN_COMMENTS vs EDIT_ALL_COMMENTS / ADMINISTER_PROJECTS.
   */
  async updateComment(
    issueId: number,
    commentId: number,
    text: string,
    user: User,
  ): Promise<CommentItemDto> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId, issueId },
      relations: { author: true, issue: true },
    });
    if (!comment) {
      throw new NotFoundException(`Comment #${commentId} on issue #${issueId} not found`);
    }

    const isAuthor = comment.authorId === user.id;
    const isSystemAdmin = user.systemRole === SystemRole.ADMIN;
    let hasAccess = isSystemAdmin;

    if (!hasAccess && this.permissionEvaluator) {
      const issue = comment.issue || (await this.issueRepository.findOne({ where: { id: issueId } }));
      const projectId = issue?.projectId;
      if (projectId) {
        if (isAuthor) {
          hasAccess = await this.permissionEvaluator.hasPermission({
            userId: user.id,
            projectId,
            permission: ProjectPermission.EDIT_OWN_COMMENTS,
            issueId,
          });
        }
        if (!hasAccess) {
          hasAccess = await this.permissionEvaluator.hasPermission({
            userId: user.id,
            projectId,
            permission: ProjectPermission.EDIT_ALL_COMMENTS,
            issueId,
          });
        }
        if (!hasAccess) {
          hasAccess = await this.permissionEvaluator.hasPermission({
            userId: user.id,
            projectId,
            permission: ProjectPermission.ADMINISTER_PROJECTS,
          });
        }
      }
    } else if (isAuthor) {
      hasAccess = true;
    }

    if (!hasAccess) {
      throw new ForbiddenException('You do not have permission to edit this comment');
    }

    comment.text = text.trim();
    const saved = await this.commentRepository.save(comment);

    const commentPayload: CommentItemDto = {
      id: saved.id,
      text: saved.text,
      author: {
        id: comment.author?.id || user.id,
        fullName: comment.author?.fullName || user.fullName,
        email: comment.author?.email || user.email,
        avatarUrl: comment.author?.avatarUrl || null,
        systemRole: comment.author?.systemRole || user.systemRole,
      },
      createdAt: saved.createdAt,
    };

    this.eventsGateway.broadcastCommentUpdated({ issueId, comment: commentPayload });
    return commentPayload;
  }

  /**
   * Deletes a comment from an issue and broadcasts realtime socket event.
   * Enforces DELETE_OWN_COMMENTS vs DELETE_ALL_COMMENTS / ADMINISTER_PROJECTS.
   */
  async deleteComment(
    issueId: number,
    commentId: number,
    user: User,
  ): Promise<{ success: boolean; message: string }> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId, issueId },
      relations: { author: true, issue: true },
    });
    if (!comment) {
      throw new NotFoundException(`Comment #${commentId} on issue #${issueId} not found`);
    }

    const isAuthor = comment.authorId === user.id;
    const isSystemAdmin = user.systemRole === SystemRole.ADMIN;
    let hasAccess = isSystemAdmin;

    if (!hasAccess && this.permissionEvaluator) {
      const issue = comment.issue || (await this.issueRepository.findOne({ where: { id: issueId } }));
      const projectId = issue?.projectId;
      if (projectId) {
        if (isAuthor) {
          hasAccess = await this.permissionEvaluator.hasPermission({
            userId: user.id,
            projectId,
            permission: ProjectPermission.DELETE_OWN_COMMENTS,
            issueId,
          });
        }
        if (!hasAccess) {
          hasAccess = await this.permissionEvaluator.hasPermission({
            userId: user.id,
            projectId,
            permission: ProjectPermission.DELETE_ALL_COMMENTS,
            issueId,
          });
        }
        if (!hasAccess) {
          hasAccess = await this.permissionEvaluator.hasPermission({
            userId: user.id,
            projectId,
            permission: ProjectPermission.ADMINISTER_PROJECTS,
          });
        }
      }
    } else if (isAuthor) {
      hasAccess = true;
    }

    if (!hasAccess) {
      throw new ForbiddenException('You do not have permission to delete this comment');
    }

    await this.commentRepository.remove(comment);
    this.eventsGateway.broadcastCommentDeleted({ issueId, commentId });
    return { success: true, message: `Comment #${commentId} deleted successfully` };
  }
}
