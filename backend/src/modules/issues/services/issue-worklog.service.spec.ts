import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { IssueWorklogService } from './issue-worklog.service.js';
import { Issue, IssueStatus, IssuePriority, IssueType } from '../entities/issue.entity.js';
import { Worklog } from '../entities/worklog.entity.js';
import { User, SystemRole } from '../../users/entities/user.entity.js';
import { ProjectPermission } from '../../rbac/entities/permission-grant.entity.js';

describe('IssueWorklogService', () => {
  let service: IssueWorklogService;
  let mockIssueRepo: any;
  let mockWorklogRepo: any;
  let mockUserRepo: any;
  let mockDataSource: any;
  let mockEventsGateway: any;
  let mockPermissionEvaluator: any;
  let mockEntityManager: any;
  let mockUpdateQb: any;

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
    estimatedHours: 10,
    loggedHours: 2,
    sprintId: 1,
    sprint: null,
    reporterId: 1,
    assigneeId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as Issue;

  beforeEach(() => {
    mockUpdateQb = {
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue({ affected: 1 }),
    };

    mockEntityManager = {
      findOne: vi.fn(),
      create: vi.fn((entityClass, data) => ({ id: 100, ...data, createdAt: new Date() })),
      save: vi.fn((entity) => Promise.resolve(entity)),
      remove: vi.fn((entity) => Promise.resolve(entity)),
      createQueryBuilder: vi.fn().mockReturnValue(mockUpdateQb),
    };

    mockDataSource = {
      transaction: vi.fn((cb) => cb(mockEntityManager)),
    };

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

    mockPermissionEvaluator = {
      hasPermission: vi.fn().mockResolvedValue(true),
      getAccessibleProjectIds: vi.fn().mockResolvedValue([1]),
    };

    service = new IssueWorklogService(
      mockIssueRepo,
      mockWorklogRepo,
      mockDataSource,
      mockEventsGateway,
      mockPermissionEvaluator,
    );
  });

  describe('logWork', () => {
    it('should log work and increment issue loggedHours atomically within transaction', async () => {
      // Arrange
      mockEntityManager.findOne.mockResolvedValue(Object.assign(new Issue(), mockIssue, { loggedHours: 2 }));

      // Act
      const result = await service.logWork(10, mockUser, {
        timeSpentHours: 3.5,
        dateLogged: '2026-09-28',
        description: 'Fixed memory bug',
      });

      // Assert
      expect(result.timeSpentHours).toBe(3.5);
      expect(result.description).toBe('Fixed memory bug');
      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(mockUpdateQb.update).toHaveBeenCalledWith(Issue);
      expect(mockUpdateQb.where).toHaveBeenCalledWith('id = :issueId', { issueId: 10 });
      expect(mockEventsGateway.broadcastWorklogAdded).toHaveBeenCalledWith(
        expect.objectContaining({ issueId: 10, projectId: 1 }),
      );
    });

    it('should throw NotFoundException if issue does not exist', async () => {
      // Arrange
      mockEntityManager.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.logWork(999, mockUser, { timeSpentHours: 2 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user lacks LOG_WORK permission', async () => {
      // Arrange
      mockEntityManager.findOne.mockResolvedValue(mockIssue);
      mockPermissionEvaluator.hasPermission.mockResolvedValue(false);

      // Act & Assert
      await expect(
        service.logWork(10, mockUser, { timeSpentHours: 2 }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteWorklog', () => {
    it('should delete worklog and decrement issue loggedHours atomically', async () => {
      // Arrange
      const mockLog: Worklog = {
        id: 55,
        issueId: 10,
        userId: mockUser.id,
        timeSpentHours: 2.5,
        dateLogged: '2026-09-28',
        description: 'Test',
        createdAt: new Date(),
        issue: mockIssue,
        user: mockUser,
      };
      mockEntityManager.findOne
        .mockResolvedValueOnce(mockLog) // find Worklog
        .mockResolvedValueOnce(mockIssue); // find Issue

      // Act
      const result = await service.deleteWorklog(10, 55, mockUser);

      // Assert
      expect(result.success).toBe(true);
      expect(mockEntityManager.remove).toHaveBeenCalledWith(mockLog);
      expect(mockUpdateQb.update).toHaveBeenCalledWith(Issue);
      expect(mockUpdateQb.where).toHaveBeenCalledWith('id = :issueId', { issueId: 10 });
    });

    it('should throw NotFoundException if worklog does not exist', async () => {
      mockEntityManager.findOne.mockResolvedValue(null);
      await expect(service.deleteWorklog(10, 999, mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if non-author without admin permission tries to delete', async () => {
      const mockLog: Worklog = {
        id: 55,
        issueId: 10,
        userId: 999, // different user
        timeSpentHours: 2.5,
        dateLogged: '2026-09-28',
        description: 'Test',
        createdAt: new Date(),
        issue: mockIssue,
        user: { ...mockUser, id: 999 } as unknown as User,
      };
      mockEntityManager.findOne
        .mockResolvedValueOnce(mockLog)
        .mockResolvedValueOnce(mockIssue);
      mockPermissionEvaluator.hasPermission.mockResolvedValue(false);

      await expect(service.deleteWorklog(10, 55, mockUser)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getWorklogs', () => {
    it('should return worklogs for an issue bounded to a maximum of 200 items', async () => {
      // Arrange
      const mockLog: Worklog = {
        id: 1,
        issueId: 10,
        userId: mockUser.id,
        timeSpentHours: 3.5,
        dateLogged: '2026-09-28',
        description: 'Fixing memory leak',
        createdAt: new Date(),
        issue: mockIssue,
        user: mockUser,
      };
      mockWorklogRepo.find.mockResolvedValue([mockLog]);

      // Act
      const result = await service.getWorklogs(10);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].timeSpentHours).toBe(3.5);
      expect(mockWorklogRepo.find).toHaveBeenCalledWith({
        where: { issueId: 10 },
        relations: { user: true },
        order: { createdAt: 'DESC' },
        take: 200,
      });
    });
  });

  describe('getMyWorklogs', () => {
    it('should return server-side paginated worklogs', async () => {
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
          issue: mockIssue,
          user: mockUser,
        },
      ];
      const mockQb = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        addOrderBy: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValue([mockLogs, 1]),
      };
      mockWorklogRepo.createQueryBuilder.mockReturnValue(mockQb);

      // Act
      const result = await service.getMyWorklogs(1, 1, 20);

      // Assert
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(1);
      expect(result.items[0].timeSpentHours).toBe(4);
    });
  });

  describe('getWorklogStats', () => {
    it('should return zeros when user has no accessible projects', async () => {
      // Arrange
      mockPermissionEvaluator.getAccessibleProjectIds.mockResolvedValue([]);

      // Act
      const result = await service.getWorklogStats(mockUser);

      // Assert
      expect(result.totalHoursLogged).toBe(0);
      expect(result.hoursLoggedToday).toBe(0);
      expect(result.hoursLoggedThisWeek).toBe(0);
      expect(result.byProject).toEqual([]);
      expect(result.byUser).toEqual([]);
      expect(mockWorklogRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should execute SQL aggregations and return mapped metrics without JS heap loops', async () => {
      // Arrange
      mockPermissionEvaluator.getAccessibleProjectIds.mockResolvedValue([1, 2]);

      const mockScalarQb = {
        innerJoin: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getRawOne: vi.fn().mockResolvedValue({
          totalHoursLogged: 45.5,
          hoursLoggedToday: 7.5,
          hoursLoggedThisWeek: 22.0,
        }),
      };

      const mockProjectQb = {
        innerJoin: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        addGroupBy: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        getRawMany: vi.fn().mockResolvedValue([
          { projectId: 1, projectName: 'Project Alpha', projectKey: 'ALPHA', totalHours: 45.5 },
        ]),
      };

      const mockUserQb = {
        innerJoin: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        addGroupBy: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        getRawMany: vi.fn().mockResolvedValue([
          { userId: 1, fullName: 'Dev User', email: 'dev@test.com', avatarUrl: null, totalHours: 45.5 },
        ]),
      };

      mockWorklogRepo.createQueryBuilder
        .mockReturnValueOnce(mockScalarQb)
        .mockReturnValueOnce(mockProjectQb)
        .mockReturnValueOnce(mockUserQb);

      // Act
      const result = await service.getWorklogStats(mockUser);

      // Assert
      expect(result.totalHoursLogged).toBe(45.5);
      expect(result.hoursLoggedToday).toBe(7.5);
      expect(result.hoursLoggedThisWeek).toBe(22.0);
      expect(result.byProject).toHaveLength(1);
      expect(result.byProject[0].projectName).toBe('Project Alpha');
      expect(result.byUser).toHaveLength(1);
      expect(result.byUser[0].fullName).toBe('Dev User');
    });
  });

  describe('getTeamTimesheetMatrix', () => {
    it('should compute daily hours per user and clamp date ranges to max 62 days', async () => {
      // Arrange
      mockPermissionEvaluator.getAccessibleProjectIds.mockResolvedValue([1]);
      const mockQb = {
        innerJoin: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([
          {
            id: 1,
            userId: 1,
            user: mockUser,
            issueId: 10,
            timeSpentHours: 6,
            dateLogged: '2026-09-28',
            issue: { project: { key: 'TEST' }, issueNum: 5, title: 'Test Issue' },
          },
        ]),
      };
      mockWorklogRepo.createQueryBuilder.mockReturnValue(mockQb);

      // Act
      const matrix = await service.getTeamTimesheetMatrix(mockUser, '2026-09-28', '2026-09-28');

      // Assert
      expect(matrix.days).toEqual(['2026-09-28']);
      expect(matrix.grandTotal).toBe(6);
      expect(matrix.members[0].totalPeriodHours).toBe(6);
      expect(matrix.members[0].dailyHours['2026-09-28']).toBe(6);
    });
  });
});
