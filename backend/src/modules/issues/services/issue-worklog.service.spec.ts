import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { IssueWorklogService } from './issue-worklog.service.js';
import { Issue, IssueStatus, IssuePriority, IssueSeverity, IssueType } from '../entities/issue.entity.js';
import { Worklog } from '../entities/worklog.entity.js';
import { User, SystemRole } from '../../users/entities/user.entity.js';

describe('IssueWorklogService', () => {
  let service: IssueWorklogService;
  let mockIssueRepo: any;
  let mockWorklogRepo: any;
  let mockUserRepo: any;
  let mockEventsGateway: any;

  const mockUser: User = {
    id: 1,
    email: 'dev@test.com',
    fullName: 'Dev User',
    passwordHash: 'hash',
    systemRole: SystemRole.USER,
    isActivated: true,
    isBlocked: false,
    twoFactorEnabled: false,
    tokenVersion: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  const mockIssue: Issue = {
    id: 10,
    projectId: 1,
    issueNum: 5,
    title: 'Test Issue',
    description: 'Test Description',
    issueType: IssueType.BUG,
    status: IssueStatus.OPEN,
    priority: IssuePriority.HIGH,
    severity: IssueSeverity.MAJOR,
    estimatedHours: 10,
    loggedHours: 2,
    sprint: 'Sprint 1',
    reporterId: 1,
    assigneeId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Issue;

  beforeEach(() => {
    mockIssueRepo = {
      findOne: vi.fn(),
      save: vi.fn((entity) => Promise.resolve(entity)),
    };
    mockWorklogRepo = {
      create: vi.fn((data) => ({ id: 100, ...data, createdAt: new Date() })),
      save: vi.fn((entity) => Promise.resolve(entity)),
      find: vi.fn(),
      createQueryBuilder: vi.fn(),
    };
    mockUserRepo = {
      find: vi.fn(),
    };
    mockEventsGateway = {
      broadcastWorklogAdded: vi.fn(),
      broadcastIssueUpdated: vi.fn(),
    };

    service = new IssueWorklogService(
      mockIssueRepo,
      mockWorklogRepo,
      mockUserRepo,
      mockEventsGateway,
    );
  });

  describe('logWork', () => {
    it('should log work and increment issue loggedHours', async () => {
      // Arrange
      mockIssueRepo.findOne.mockResolvedValue(Object.assign(new Issue(), mockIssue, { loggedHours: 2 }));

      // Act
      const result = await service.logWork(10, mockUser, {
        timeSpentHours: 3.5,
        dateLogged: '2026-09-28',
        description: 'Fixed memory bug',
      });

      // Assert
      expect(result.timeSpentHours).toBe(3.5);
      expect(result.description).toBe('Fixed memory bug');
      expect(mockIssueRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ loggedHours: 5.5 }),
      );
      expect(mockEventsGateway.broadcastWorklogAdded).toHaveBeenCalled();
    });

    it('should throw NotFoundException if issue does not exist', async () => {
      // Arrange
      mockIssueRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.logWork(999, mockUser, { timeSpentHours: 2 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getWorklogs', () => {
    it('should return mapped worklogs for an issue', async () => {
      // Arrange
      const mockLogs: Worklog[] = [
        {
          id: 1,
          issueId: 10,
          userId: 1,
          timeSpentHours: 4,
          dateLogged: '2026-09-27',
          description: 'Refactoring modules',
          createdAt: new Date(),
          user: mockUser,
        } as Worklog,
      ];
      mockWorklogRepo.find.mockResolvedValue(mockLogs);

      // Act
      const result = await service.getWorklogs(10);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].timeSpentHours).toBe(4);
      expect(result[0].user.fullName).toBe('Dev User');
    });
  });

  describe('getTeamTimesheetMatrix', () => {
    it('should compute daily hours per user and daily totals', async () => {
      // Arrange
      mockUserRepo.find.mockResolvedValue([mockUser]);
      const mockQb = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([
          {
            id: 1,
            userId: 1,
            issueId: 10,
            timeSpentHours: 6,
            dateLogged: '2026-09-28',
            issue: { project: { key: 'TEST' }, issueNum: 5, title: 'Test Issue' },
          },
        ]),
      };
      mockWorklogRepo.createQueryBuilder.mockReturnValue(mockQb);

      // Act
      const matrix = await service.getTeamTimesheetMatrix('2026-09-28', '2026-09-28');

      // Assert
      expect(matrix.days).toEqual(['2026-09-28']);
      expect(matrix.grandTotal).toBe(6);
      expect(matrix.members[0].totalPeriodHours).toBe(6);
      expect(matrix.members[0].dailyHours['2026-09-28']).toBe(6);
    });
  });
});
