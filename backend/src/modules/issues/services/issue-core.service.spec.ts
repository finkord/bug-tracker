import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { IssueCoreService } from './issue-core.service.js';
import { Issue, IssueStatus, IssuePriority, IssueType } from '../entities/issue.entity.js';
import { User, SystemRole } from '../../users/entities/user.entity.js';
import { Project } from '../../projects/entities/project.entity.js';

describe('IssueCoreService', () => {
  let service: IssueCoreService;
  let mockIssueRepo: any;
  let mockProjectRepo: any;
  let mockAttachmentRepo: any;
  let mockSprintRepo: any;
  let mockIssueLinksService: any;
  let mockEventsGateway: any;

  const mockUser: User = {
    id: 1,
    email: 'dev@test.com',
    fullName: 'Dev User',
    systemRole: SystemRole.USER,
  } as User;

  const mockProject: Project = {
    id: 1,
    key: 'PROJ',
    name: 'Main Project',
  } as Project;

  const mockIssue: Issue = {
    id: 10,
    projectId: 1,
    issueNum: 1,
    title: 'Test Issue',
    description: 'Description',
    issueType: IssueType.BUG,
    status: IssueStatus.OPEN,
    priority: IssuePriority.HIGH,
    estimatedHours: 5,
    loggedHours: 0,
    sprintId: null,
    sprint: null,
    reporterId: 1,
    reporter: mockUser,
    assigneeId: null,
    assignee: null,
    project: mockProject,
    comments: [],
    worklogs: [],
    securityLevelId: null,
    securityLevel: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as Issue;

  beforeEach(() => {
    mockIssueRepo = {
      findOne: vi.fn(),
      find: vi.fn(),
      create: vi.fn((data) => ({ id: 10, ...data, createdAt: new Date(), updatedAt: new Date() })),
      save: vi.fn((entity) => Promise.resolve(entity)),
      update: vi.fn(),
      remove: vi.fn(),
      createQueryBuilder: vi.fn(),
    };
    mockProjectRepo = {
      findOne: vi.fn(),
    };
    mockAttachmentRepo = {
      find: vi.fn().mockResolvedValue([]),
    };
    mockSprintRepo = {
      findOne: vi.fn(),
    };
    mockIssueLinksService = {
      getIssueLinks: vi.fn().mockResolvedValue([]),
    };
    mockEventsGateway = {
      broadcastIssueCreated: vi.fn(),
      broadcastIssueUpdated: vi.fn(),
      broadcastIssueDeleted: vi.fn(),
    };
    const mockJqlParser = {
      parse: vi.fn(),
      applyToQueryBuilder: vi.fn().mockReturnValue(false),
    };
    const mockPermissionEvaluator = {
      getAccessibleProjectIds: vi.fn().mockResolvedValue('ALL'),
      hasPermission: vi.fn().mockResolvedValue(true),
    };
    const mockConfigService = {
      get: vi.fn((key: string, defaultValue?: any) => {
        if (key === 'PORT') return 3000;
        if (key === 'BACKEND_URL') return 'http://localhost:3000';
        return defaultValue;
      }),
    };

    const mockHistoryRepo = {
      create: vi.fn((data) => ({ ...data, id: 1, createdAt: new Date() })),
      save: vi.fn((data) => Promise.resolve(data)),
      find: vi.fn().mockResolvedValue([]),
    };

    const mockWebhooksService = {
      dispatch: vi.fn().mockResolvedValue(undefined),
    };

    service = new IssueCoreService(
      mockIssueRepo,
      mockHistoryRepo as any,
      mockProjectRepo,
      mockAttachmentRepo,
      mockSprintRepo,
      mockIssueLinksService,
      mockEventsGateway,
      mockJqlParser as any,
      mockPermissionEvaluator as any,
      mockConfigService as any,
      undefined,
      mockWebhooksService as any,
    );
  });

  describe('findAll', () => {
    it('should return paginated issues with server-side limit and offset', async () => {
      const mockQb = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        loadRelationIdAndMap: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValue([[mockIssue], 1]),
      };
      mockIssueRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.findAll({ page: 1, limit: 10 }, mockUser);

      expect(mockQb.skip).toHaveBeenCalledWith(0);
      expect(mockQb.take).toHaveBeenCalledWith(10);
      expect(result).toEqual({
        items: expect.arrayContaining([expect.objectContaining({ id: 10 })]),
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should filter accessible projects for non-admin users', async () => {
      const mockQb = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        loadRelationIdAndMap: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValue([[mockIssue], 1]),
      };
      mockIssueRepo.createQueryBuilder.mockReturnValue(mockQb);

      const mockPermEvaluator = (service as any).permissionEvaluator;
      mockPermEvaluator.getAccessibleProjectIds.mockResolvedValue([1, 2]);

      const result = await service.findAll({ page: 1, limit: 25 }, mockUser);

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'issue.projectId IN (:...accessibleProjectIds)',
        { accessibleProjectIds: [1, 2] },
      );
      expect(result.total).toBe(1);
    });

    it('should return empty envelope if non-admin has no accessible projects', async () => {
      const mockPermEvaluator = (service as any).permissionEvaluator;
      mockPermEvaluator.getAccessibleProjectIds.mockResolvedValue([]);

      const result = await service.findAll({ page: 1, limit: 25 }, mockUser);

      expect(result).toEqual({
        items: [],
        total: 0,
        page: 1,
        limit: 25,
        totalPages: 0,
      });
    });
  });

  describe('create', () => {
    it('should create issue with incremented issue number and broadcast event', async () => {
      // Arrange
      mockProjectRepo.findOne.mockResolvedValue(mockProject);
      const mockQb = {
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getRawOne: vi.fn().mockResolvedValue({ maxNum: 5 }),
      };
      mockIssueRepo.createQueryBuilder.mockReturnValue(mockQb);
      mockIssueRepo.findOne.mockResolvedValue(Object.assign(new Issue(), mockIssue, { issueNum: 6 }));

      // Act
      const result = await service.create(
        {
          projectId: 1,
          title: 'New Bug',
          issueType: IssueType.BUG,
          priority: IssuePriority.HIGH,
        },
        mockUser,
      );

      // Assert
      expect(mockIssueRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 1,
          issueNum: 6,
          title: 'New Bug',
          reporterId: 1,
        }),
      );
      expect(mockEventsGateway.broadcastIssueCreated).toHaveBeenCalled();
      expect(result.id).toBe(10);
    });

    it('should throw BadRequestException if project does not exist', async () => {
      // Arrange
      mockProjectRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.create(
          {
            projectId: 999,
            title: 'Bug',
            issueType: IssueType.BUG,
            priority: IssuePriority.LOW,
          },
          mockUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create subtask with parentId and broadcast event', async () => {
      mockProjectRepo.findOne.mockResolvedValue(mockProject);
      const parentIssue = { ...mockIssue, id: 10, parentId: null };
      mockIssueRepo.findOne.mockImplementation(({ where }: any) => {
        if (where?.id === 10) return Promise.resolve(parentIssue);
        return Promise.resolve(mockIssue);
      });
      const mockQb = {
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getRawOne: vi.fn().mockResolvedValue({ maxNum: 5 }),
      };
      mockIssueRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.create(
        {
          projectId: 1,
          title: 'Subtask 1',
          parentId: 10,
        },
        mockUser,
      );

      expect(mockIssueRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          parentId: 10,
          issueType: IssueType.SUBTASK,
        }),
      );
      expect(result).toBeDefined();
    });

    it('should reject creating subtask if parent already has parentId', async () => {
      mockProjectRepo.findOne.mockResolvedValue(mockProject);
      const nestedParent = { ...mockIssue, id: 20, parentId: 10 };
      mockIssueRepo.findOne.mockResolvedValue(nestedParent);

      await expect(
        service.create(
          {
            projectId: 1,
            title: 'Nested Subtask',
            parentId: 20,
          },
          mockUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStatus', () => {
    it('should update status and broadcast event', async () => {
      // Arrange
      mockIssueRepo.findOne.mockResolvedValue(mockIssue);

      // Act
      const result = await service.updateStatus(10, IssueStatus.RESOLVED);

      // Assert
      expect(mockIssueRepo.update).toHaveBeenCalledWith(10, { status: IssueStatus.RESOLVED });
      expect(mockEventsGateway.broadcastIssueUpdated).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should auto-transition parent to RESOLVED when all sibling subtasks reach completion', async () => {
      const parentIssue: Issue = {
        id: 99,
        projectId: 1,
        issueNum: 5,
        title: 'Parent Task',
        status: IssueStatus.IN_PROGRESS,
      } as unknown as Issue;

      const subtask: Issue = {
        id: 10,
        projectId: 1,
        parentId: 99,
        issueNum: 6,
        status: IssueStatus.IN_PROGRESS,
      } as unknown as Issue;

      mockIssueRepo.findOne.mockImplementation(({ where }: any) => {
        if (where?.id === 10) return Promise.resolve(subtask);
        if (where?.id === 99) return Promise.resolve(parentIssue);
        return Promise.resolve(mockIssue);
      });

      mockIssueRepo.find.mockImplementation(({ where }: any) => {
        if (where?.parentId === 99) {
          // Both subtasks are now completed
          return Promise.resolve([
            { id: 10, status: IssueStatus.RESOLVED },
            { id: 11, status: IssueStatus.CLOSED },
          ]);
        }
        return Promise.resolve([]);
      });

      await service.updateStatus(10, IssueStatus.RESOLVED, mockUser);

      expect(mockIssueRepo.update).toHaveBeenCalledWith(99, { status: IssueStatus.RESOLVED });
    });

    it('should NOT auto-transition parent if any sibling subtask is still open or in progress', async () => {
      const parentIssue: Issue = {
        id: 99,
        projectId: 1,
        status: IssueStatus.IN_PROGRESS,
      } as unknown as Issue;

      const subtask: Issue = {
        id: 10,
        projectId: 1,
        parentId: 99,
        status: IssueStatus.IN_PROGRESS,
      } as unknown as Issue;

      mockIssueRepo.findOne.mockImplementation(({ where }: any) => {
        if (where?.id === 10) return Promise.resolve(subtask);
        if (where?.id === 99) return Promise.resolve(parentIssue);
        return Promise.resolve(mockIssue);
      });

      mockIssueRepo.find.mockImplementation(({ where }: any) => {
        if (where?.parentId === 99) {
          // Sibling is still in progress
          return Promise.resolve([
            { id: 10, status: IssueStatus.RESOLVED },
            { id: 11, status: IssueStatus.IN_PROGRESS },
          ]);
        }
        return Promise.resolve([]);
      });

      await service.updateStatus(10, IssueStatus.RESOLVED, mockUser);

      expect(mockIssueRepo.update).not.toHaveBeenCalledWith(99, { status: IssueStatus.RESOLVED });
    });

    it('should NOT auto-transition parent if parent is already RESOLVED or CLOSED', async () => {
      const parentIssue: Issue = {
        id: 99,
        projectId: 1,
        status: IssueStatus.RESOLVED,
      } as unknown as Issue;

      const subtask: Issue = {
        id: 10,
        projectId: 1,
        parentId: 99,
        status: IssueStatus.IN_PROGRESS,
      } as unknown as Issue;

      mockIssueRepo.findOne.mockImplementation(({ where }: any) => {
        if (where?.id === 10) return Promise.resolve(subtask);
        if (where?.id === 99) return Promise.resolve(parentIssue);
        return Promise.resolve(mockIssue);
      });

      mockIssueRepo.find.mockImplementation(({ where }: any) => {
        if (where?.parentId === 99) {
          return Promise.resolve([{ id: 10, status: IssueStatus.RESOLVED }]);
        }
        return Promise.resolve([]);
      });

      await service.updateStatus(10, IssueStatus.RESOLVED, mockUser);

      expect(mockIssueRepo.update).not.toHaveBeenCalledWith(99, expect.anything());
    });
  });

  describe('assignToMe', () => {
    it('should assign issue to user and broadcast event', async () => {
      // Arrange
      mockIssueRepo.findOne.mockResolvedValue(mockIssue);

      // Act
      const result = await service.assignToMe(10, mockUser);

      // Assert
      expect(mockIssueRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ assigneeId: 1 }),
      );
      expect(mockEventsGateway.broadcastIssueUpdated).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('remove', () => {
    it('should remove issue and broadcast deletion event', async () => {
      // Arrange
      mockIssueRepo.findOne.mockResolvedValue(mockIssue);

      // Act
      const result = await service.remove(10);

      // Assert
      expect(result.success).toBe(true);
      expect(mockIssueRepo.remove).toHaveBeenCalled();
      expect(mockEventsGateway.broadcastIssueDeleted).toHaveBeenCalledWith(10, 1);
    });
  });

  describe('updateSprint', () => {
    it('should assign issue to sprint and broadcast event', async () => {
      mockIssueRepo.findOne.mockResolvedValue(Object.assign(new Issue(), mockIssue));
      mockSprintRepo.findOne.mockResolvedValue({ id: 5, projectId: 1, name: 'Sprint 1', status: 'ACTIVE' });

      const result = await service.updateSprint(10, 5);

      expect(mockSprintRepo.findOne).toHaveBeenCalledWith({ where: { id: 5, projectId: 1 } });
      expect(mockIssueRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ sprintId: 5 }),
      );
      expect(mockEventsGateway.broadcastIssueUpdated).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should detach issue to backlog when sprintId is null', async () => {
      mockIssueRepo.findOne.mockResolvedValue(Object.assign(new Issue(), mockIssue, { sprintId: 5 }));

      const result = await service.updateSprint(10, null);

      expect(mockIssueRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ sprintId: null }),
      );
      expect(mockEventsGateway.broadcastIssueUpdated).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if sprint is not in the project', async () => {
      mockIssueRepo.findOne.mockResolvedValue(Object.assign(new Issue(), mockIssue));
      mockSprintRepo.findOne.mockResolvedValue(null);

      await expect(service.updateSprint(10, 999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('bulkUpdate', () => {
    it('should update multiple issues atomically and broadcast updates', async () => {
      mockIssueRepo.find.mockResolvedValue([
        { ...mockIssue, id: 1 },
        { ...mockIssue, id: 2 },
      ]);
      mockIssueRepo.findOne.mockResolvedValue(mockIssue);

      const result = await service.bulkUpdate(
        {
          issueIds: [1, 2],
          status: IssueStatus.RESOLVED,
          priority: IssuePriority.CRITICAL,
        },
        mockUser,
      );

      expect(result.success).toBe(true);
      expect(result.affectedCount).toBe(2);
      expect(mockIssueRepo.update).toHaveBeenCalled();
      expect(mockEventsGateway.broadcastIssueUpdated).toHaveBeenCalledTimes(2);
    });

    it('should throw BadRequestException if issueIds is empty', async () => {
      await expect(
        service.bulkUpdate({ issueIds: [] }, mockUser),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('bulkDelete', () => {
    it('should delete multiple issues atomically and broadcast deletions', async () => {
      mockIssueRepo.find.mockResolvedValue([
        { ...mockIssue, id: 1, projectId: 1 },
        { ...mockIssue, id: 2, projectId: 1 },
      ]);

      const result = await service.bulkDelete(
        { issueIds: [1, 2] },
        mockUser,
      );

      expect(result.success).toBe(true);
      expect(result.affectedCount).toBe(2);
      expect(mockIssueRepo.remove).toHaveBeenCalled();
      expect(mockEventsGateway.broadcastIssueDeleted).toHaveBeenCalledWith(1, 1);
      expect(mockEventsGateway.broadcastIssueDeleted).toHaveBeenCalledWith(2, 1);
    });

    it('should throw BadRequestException if issueIds is empty', async () => {
      await expect(
        service.bulkDelete({ issueIds: [] }, mockUser),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
