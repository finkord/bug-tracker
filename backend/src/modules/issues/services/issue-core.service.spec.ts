import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { IssueCoreService } from './issue-core.service.js';
import { Issue, IssueStatus, IssuePriority, IssueSeverity, IssueType } from '../entities/issue.entity.js';
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
    severity: IssueSeverity.MAJOR,
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

    service = new IssueCoreService(
      mockIssueRepo,
      mockProjectRepo,
      mockAttachmentRepo,
      mockSprintRepo,
      mockIssueLinksService,
      mockEventsGateway,
    );
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
          severity: IssueSeverity.MAJOR,
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
            severity: IssueSeverity.MINOR,
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
});
