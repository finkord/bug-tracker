import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { IssueCommentsService } from './issue-comments.service.js';
import { Issue } from '../entities/issue.entity.js';
import { Comment } from '../entities/comment.entity.js';
import { User, SystemRole } from '../../users/entities/user.entity.js';
import { NotificationType } from '../../notifications/entities/notification.entity.js';

describe('IssueCommentsService', () => {
  let service: IssueCommentsService;
  let mockIssueRepo: any;
  let mockCommentRepo: any;
  let mockEventsGateway: any;
  let mockNotificationsService: any;

  const mockUser: User = {
    id: 1,
    email: 'dev@test.com',
    fullName: 'Dev User',
    systemRole: SystemRole.USER,
  } as User;

  const mockIssue: Issue = {
    id: 10,
    projectId: 100,
    title: 'Test Issue',
    assigneeId: 2,
  } as Issue;

  beforeEach(() => {
    mockIssueRepo = {
      findOne: vi.fn().mockResolvedValue(mockIssue),
    };
    mockCommentRepo = {
      create: vi.fn((data) => ({ id: 1, ...data, createdAt: new Date() })),
      save: vi.fn((entity) => Promise.resolve(entity)),
      find: vi.fn(),
      findOne: vi.fn(),
      remove: vi.fn().mockResolvedValue({ id: 1 }),
    };
    mockEventsGateway = {
      broadcastCommentAdded: vi.fn(),
      broadcastCommentUpdated: vi.fn(),
      broadcastCommentDeleted: vi.fn(),
    };
    mockNotificationsService = {
      createNotification: vi.fn().mockResolvedValue({ id: 1 }),
    };
    const mockPermissionEvaluator = {
      hasPermission: vi.fn().mockResolvedValue(true),
    };

    const mockUserQueryBuilder = {
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      take: vi.fn().mockReturnThis(),
      getMany: vi.fn().mockResolvedValue([]),
    };
    const mockUserRepo = {
      findOne: vi.fn(),
      createQueryBuilder: vi.fn(() => mockUserQueryBuilder),
    };

    service = new IssueCommentsService(
      mockIssueRepo,
      mockCommentRepo,
      mockUserRepo as any,
      mockEventsGateway,
      mockNotificationsService,
      mockPermissionEvaluator as any,
    );
  });

  describe('addComment', () => {
    it('should add comment and broadcast realtime event and notify assignee', async () => {
      // Arrange
      mockIssueRepo.findOne.mockResolvedValue(mockIssue);

      // Act
      const result = await service.addComment(10, 'Looks good to me!', mockUser);

      // Assert
      expect(result.text).toBe('Looks good to me!');
      expect(result.author.fullName).toBe('Dev User');
      expect(mockEventsGateway.broadcastCommentAdded).toHaveBeenCalledWith({
        issueId: 10,
        comment: expect.objectContaining({ text: 'Looks good to me!' }),
      });
      expect(mockNotificationsService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 2,
          actorId: 1,
          issueId: 10,
        }),
      );
    });

    it('should parse @username mentions and dispatch MENTIONED notification', async () => {
      // Arrange
      const mentionedUser = {
        id: 99,
        email: 'colleague@test.com',
        fullName: 'Colleague Dev',
      };
      const mockUserQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([mentionedUser]),
      };
      (service as any).userRepository = {
        createQueryBuilder: vi.fn(() => mockUserQueryBuilder),
      };

      // Act
      await service.addComment(10, 'Hey @colleague please check this out', mockUser);

      // Assert
      expect(mockNotificationsService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 99,
          actorId: 1,
          type: NotificationType.MENTIONED,
        }),
      );
    });

    it('should throw NotFoundException if issue does not exist', async () => {
      // Arrange
      mockIssueRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.addComment(999, 'Text', mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getCommentsByIssueId', () => {
    it('should return comments thread', async () => {
      // Arrange
      mockCommentRepo.find.mockResolvedValue([
        {
          id: 1,
          text: 'First comment',
          author: mockUser,
          createdAt: new Date(),
        } as Comment,
      ]);

      // Act
      const result = await service.getCommentsByIssueId(10);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('First comment');
    });
  });

  describe('updateComment', () => {
    it('should update comment text and broadcast realtime update when author edits', async () => {
      const existingComment = {
        id: 1,
        issueId: 10,
        authorId: 1,
        text: 'Old comment',
        author: mockUser,
        issue: mockIssue,
        createdAt: new Date(),
      };
      mockCommentRepo.findOne.mockResolvedValue(existingComment);
      mockCommentRepo.save.mockImplementation((c: any) => Promise.resolve(c));

      const result = await service.updateComment(10, 1, 'Updated comment text', mockUser);

      expect(result.text).toBe('Updated comment text');
      expect(mockEventsGateway.broadcastCommentUpdated).toHaveBeenCalledWith({
        issueId: 10,
        comment: expect.objectContaining({ text: 'Updated comment text' }),
      });
    });

    it('should throw NotFoundException if comment does not exist', async () => {
      mockCommentRepo.findOne.mockResolvedValue(null);

      await expect(service.updateComment(10, 999, 'Text', mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteComment', () => {
    it('should delete comment and broadcast realtime event when author deletes', async () => {
      const existingComment = {
        id: 1,
        issueId: 10,
        authorId: 1,
        text: 'To be deleted',
        author: mockUser,
        issue: mockIssue,
      };
      mockCommentRepo.findOne.mockResolvedValue(existingComment);

      const result = await service.deleteComment(10, 1, mockUser);

      expect(result.success).toBe(true);
      expect(mockCommentRepo.remove).toHaveBeenCalledWith(existingComment);
      expect(mockEventsGateway.broadcastCommentDeleted).toHaveBeenCalledWith({
        issueId: 10,
        commentId: 1,
      });
    });
  });
});
