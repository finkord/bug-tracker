import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../entities/comment.entity.js';
import { Issue } from '../entities/issue.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { EventsGateway } from '../../events/events.gateway.js';
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
}
