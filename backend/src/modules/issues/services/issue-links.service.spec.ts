import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { IssueLinksService } from './issue-links.service.js';
import { Issue } from '../entities/issue.entity.js';
import { IssueLink, IssueLinkType } from '../entities/issue-link.entity.js';

describe('IssueLinksService', () => {
  let service: IssueLinksService;
  let mockIssueRepo: any;
  let mockIssueLinkRepo: any;

  const mockSourceIssue: Issue = {
    id: 1,
    projectId: 1,
    issueNum: 1,
    title: 'Source Issue',
    project: { key: 'PROJ', name: 'Main Project' },
  } as unknown as Issue;

  const mockTargetIssue: Issue = {
    id: 2,
    projectId: 1,
    issueNum: 2,
    title: 'Target Issue',
    project: { key: 'PROJ', name: 'Main Project' },
  } as unknown as Issue;

  beforeEach(() => {
    mockIssueRepo = {
      findOne: vi.fn(),
      createQueryBuilder: vi.fn(),
    };
    mockIssueLinkRepo = {
      findOne: vi.fn(),
      create: vi.fn((data) => ({ id: 50, ...data, createdAt: new Date() })),
      save: vi.fn((entity) => Promise.resolve(entity)),
      remove: vi.fn(),
      createQueryBuilder: vi.fn(),
    };

    service = new IssueLinksService(mockIssueRepo, mockIssueLinkRepo);
  });

  describe('createIssueLink', () => {
    it('should create link between two different issues', async () => {
      // Arrange
      mockIssueRepo.findOne.mockImplementation(({ where }: any) => {
        if (where.id === 1) return Promise.resolve(mockSourceIssue);
        if (where.id === 2) return Promise.resolve(mockTargetIssue);
        return Promise.resolve(null);
      });
      mockIssueLinkRepo.findOne.mockResolvedValue(null);

      const mockQb = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([
          {
            id: 50,
            sourceIssueId: 1,
            targetIssueId: 2,
            linkType: IssueLinkType.BLOCKS,
            sourceIssue: mockSourceIssue,
            targetIssue: mockTargetIssue,
            createdAt: new Date(),
          },
        ]),
      };
      mockIssueLinkRepo.createQueryBuilder.mockReturnValue(mockQb);

      // Act
      const result = await service.createIssueLink(1, {
        targetIssueKeyOrId: 2,
        linkType: IssueLinkType.BLOCKS,
      });

      // Assert
      expect(result.id).toBe(50);
      expect(result.linkType).toBe(IssueLinkType.BLOCKS);
      expect(result.label).toBe('blocks');
    });

    it('should throw BadRequestException when trying to link issue to itself', async () => {
      // Arrange
      mockIssueRepo.findOne.mockResolvedValue(mockSourceIssue);

      // Act & Assert
      await expect(
        service.createIssueLink(1, {
          targetIssueKeyOrId: 1,
          linkType: IssueLinkType.RELATES_TO,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when link already exists', async () => {
      // Arrange
      mockIssueRepo.findOne.mockImplementation(({ where }: any) => {
        if (where.id === 1) return Promise.resolve(mockSourceIssue);
        if (where.id === 2) return Promise.resolve(mockTargetIssue);
        return Promise.resolve(null);
      });
      mockIssueLinkRepo.findOne.mockResolvedValue({ id: 99 });

      // Act & Assert
      await expect(
        service.createIssueLink(1, {
          targetIssueKeyOrId: 2,
          linkType: IssueLinkType.BLOCKS,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteIssueLink', () => {
    it('should delete existing issue link', async () => {
      // Arrange
      mockIssueLinkRepo.findOne.mockResolvedValue({ id: 10 });

      // Act
      const result = await service.deleteIssueLink(10);

      // Assert
      expect(result.success).toBe(true);
      expect(mockIssueLinkRepo.remove).toHaveBeenCalled();
    });

    it('should throw NotFoundException if link does not exist', async () => {
      // Arrange
      mockIssueLinkRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.deleteIssueLink(999)).rejects.toThrow(NotFoundException);
    });
  });
});
