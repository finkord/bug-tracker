import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { IssueCommentsService } from './issue-comments.service.js';
import { Issue } from '../entities/issue.entity.js';
import { Comment } from '../entities/comment.entity.js';
import { User, SystemRole } from '../../users/entities/user.entity.js';

describe('IssueCommentsService', () => {
  let service: IssueCommentsService;
  let mockIssueRepo: any;
  let mockCommentRepo: any;
  let mockEventsGateway: any;

  const mockUser: User = {
    id: 1,
    email: 'dev@test.com',
    fullName: 'Dev User',
    systemRole: SystemRole.DEVELOPER,
  } as User;

  const mockIssue: Issue = {
    id: 10,
    title: 'Test Issue',
  } as Issue;

  beforeEach(() => {
    mockIssueRepo = {
      findOne: vi.fn(),
    };
    mockCommentRepo = {
      create: vi.fn((data) => ({ id: 1, ...data, createdAt: new Date() })),
      save: vi.fn((entity) => Promise.resolve(entity)),
      find: vi.fn(),
    };
    mockEventsGateway = {
      broadcastCommentAdded: vi.fn(),
    };

    service = new IssueCommentsService(mockIssueRepo, mockCommentRepo, mockEventsGateway);
  });

  describe('addComment', () => {
    it('should add comment and broadcast realtime event', async () => {
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
});
