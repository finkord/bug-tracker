import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { IssueAttachmentsService } from './issue-attachments.service.js';
import { Issue } from '../entities/issue.entity.js';
import { Attachment } from '../entities/attachment.entity.js';
import { User, SystemRole } from '../../users/entities/user.entity.js';

describe('IssueAttachmentsService', () => {
  let service: IssueAttachmentsService;
  let mockIssueRepo: any;
  let mockAttachmentRepo: any;
  let mockSeaweedFsService: any;
  let mockEventsGateway: any;

  const mockUser: User = {
    id: 1,
    email: 'dev@test.com',
    fullName: 'Dev User',
    systemRole: SystemRole.DEVELOPER,
  } as User;

  const mockAdminUser: User = {
    id: 99,
    email: 'admin@test.com',
    fullName: 'Admin User',
    systemRole: SystemRole.ADMIN,
  } as User;

  const mockIssue: Issue = {
    id: 10,
    title: 'Test Issue',
  } as Issue;

  beforeEach(() => {
    mockIssueRepo = {
      findOne: vi.fn(),
    };
    mockAttachmentRepo = {
      create: vi.fn((data) => ({ id: 1, ...data, createdAt: new Date() })),
      save: vi.fn((entity) => Promise.resolve(entity)),
      findOne: vi.fn(),
      find: vi.fn(),
      delete: vi.fn(),
    };
    mockSeaweedFsService = {
      uploadFile: vi.fn().mockResolvedValue({ fid: '3,12345678' }),
      deleteFile: vi.fn().mockResolvedValue(true),
    };
    mockEventsGateway = {
      broadcastAttachmentUploaded: vi.fn(),
    };

    service = new IssueAttachmentsService(
      mockIssueRepo,
      mockAttachmentRepo,
      mockSeaweedFsService,
      mockEventsGateway,
    );
  });

  describe('uploadAttachment', () => {
    it('should upload file to SeaweedFS and save attachment entity', async () => {
      // Arrange
      mockIssueRepo.findOne.mockResolvedValue(mockIssue);

      const fakeFile = {
        originalname: 'screenshot.png',
        buffer: Buffer.from('fake'),
        size: 1024,
        mimetype: 'image/png',
      };

      // Act
      const result = await service.uploadAttachment(10, fakeFile, mockUser);

      // Assert
      expect(result.filename).toBe('screenshot.png');
      expect(mockSeaweedFsService.uploadFile).toHaveBeenCalledWith(fakeFile);
      expect(mockEventsGateway.broadcastAttachmentUploaded).toHaveBeenCalled();
    });

    it('should throw NotFoundException if issue does not exist', async () => {
      // Arrange
      mockIssueRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.uploadAttachment(999, {} as any, mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteAttachment', () => {
    it('should allow uploader to delete attachment', async () => {
      // Arrange
      mockAttachmentRepo.findOne.mockResolvedValue({
        id: 5,
        issueId: 10,
        uploaderId: 1,
        fid: '3,12345678',
      } as Attachment);

      // Act
      const result = await service.deleteAttachment(10, 5, mockUser);

      // Assert
      expect(result.message).toBe('Attachment deleted successfully');
      expect(mockSeaweedFsService.deleteFile).toHaveBeenCalledWith('3,12345678');
      expect(mockAttachmentRepo.delete).toHaveBeenCalledWith(5);
    });

    it('should allow admin to delete attachment of other users', async () => {
      // Arrange
      mockAttachmentRepo.findOne.mockResolvedValue({
        id: 5,
        issueId: 10,
        uploaderId: 1,
        fid: '3,12345678',
      } as Attachment);

      // Act
      const result = await service.deleteAttachment(10, 5, mockAdminUser);

      // Assert
      expect(result.message).toBe('Attachment deleted successfully');
    });

    it('should reject non-uploader non-admin users', async () => {
      // Arrange
      mockAttachmentRepo.findOne.mockResolvedValue({
        id: 5,
        issueId: 10,
        uploaderId: 2,
        fid: '3,12345678',
      } as Attachment);

      // Act & Assert
      await expect(service.deleteAttachment(10, 5, mockUser)).rejects.toThrow(BadRequestException);
    });
  });
});
