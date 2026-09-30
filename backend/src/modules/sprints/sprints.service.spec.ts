import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SprintsService } from './sprints.service.js';
import { Sprint, SprintStatus } from './entities/sprint.entity.js';
import { Project } from '../projects/entities/project.entity.js';
import { Issue } from '../issues/entities/issue.entity.js';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';

describe('SprintsService', () => {
  let service: SprintsService;
  let mockSprintRepository: Partial<Repository<Sprint>>;
  let mockProjectRepository: Partial<Repository<Project>>;
  let mockIssueRepository: Partial<Repository<Issue>>;
  let mockQueryBuilder: any;
  const mockProject: Project = {
    id: 1,
    name: 'Bug Tracker',
    key: 'BT',
    description: 'Issue tracking system',
    leadId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    issues: [],
    lead: {} as any,
    permissionSchemeId: null,
    permissionScheme: null,
    securitySchemeId: null,
    securityScheme: null,
  } as unknown as Project;
  const mockSprint: Sprint = {
    id: 10,
    projectId: 1,
    name: 'Sprint 1',
    goal: 'Initial sprint goal',
    startDate: '2026-09-01',
    endDate: '2026-09-14',
    status: SprintStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
    project: mockProject,
    issues: [],
  } as unknown as Sprint;

  beforeEach(() => {
    mockSprintRepository = {
      find: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn((dto: any) => dto as Sprint) as any,
      save: vi.fn((sprint: any) => Promise.resolve({ ...sprint, id: sprint.id || 10 } as Sprint)) as any,
      delete: vi.fn().mockResolvedValue({ affected: 1 }),
    };
    mockProjectRepository = {
      findOne: vi.fn().mockResolvedValue(mockProject),
    };
    mockQueryBuilder = {
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue({ affected: 2 }),
    };
    mockIssueRepository = {
      createQueryBuilder: vi.fn().mockReturnValue(mockQueryBuilder),
    };
    service = new SprintsService(
      mockSprintRepository as Repository<Sprint>,
      mockProjectRepository as Repository<Project>,
      mockIssueRepository as Repository<Issue>,
    );
  });

  describe('getProjectSprints', () => {
    it('should throw NotFoundException if project does not exist', async () => {
      vi.mocked(mockProjectRepository.findOne!).mockResolvedValueOnce(null);
      await expect(service.getProjectSprints(999)).rejects.toThrow(NotFoundException);
    });
    it('should return existing sprints for project', async () => {
      vi.mocked(mockSprintRepository.find!).mockResolvedValueOnce([mockSprint]);
      const actualSprints = await service.getProjectSprints(1);
      expect(actualSprints).toEqual([mockSprint]);
      expect(mockSprintRepository.find).toHaveBeenCalledWith({
        where: { projectId: 1 },
        relations: { team: true },
        order: { createdAt: 'ASC' },
        take: 100,
      });
    });
    it('should initialize default sprint if project has none', async () => {
      vi.mocked(mockSprintRepository.find!).mockResolvedValueOnce([]);
      const actualSprints = await service.getProjectSprints(1);
      expect(actualSprints).toHaveLength(1);
      expect(actualSprints[0].name).toBe('Sprint 1');
      expect(mockSprintRepository.save).toHaveBeenCalled();
    });
  });

  describe('createSprint', () => {
    it('should create and save a new sprint', async () => {
      const inputDto = { name: 'Sprint 2', goal: 'Next deliverables' };
      const actualSprint = await service.createSprint(1, inputDto);
      expect(actualSprint.name).toBe('Sprint 2');
      expect(actualSprint.status).toBe(SprintStatus.PLANNED);
      expect(mockSprintRepository.save).toHaveBeenCalled();
    });
  });

  describe('updateSprint', () => {
    it('should update sprint details without modifying issues', async () => {
      vi.mocked(mockSprintRepository.findOne!).mockResolvedValueOnce(mockSprint);
      const actualSprint = await service.updateSprint(10, { name: 'Sprint 1 - Release' });
      expect(actualSprint.name).toBe('Sprint 1 - Release');
      expect(mockSprintRepository.save).toHaveBeenCalled();
    });
  });

  describe('startSprint', () => {
    it('should throw BadRequestException if sprint is already completed', async () => {
      const mockCompletedSprint = { ...mockSprint, status: SprintStatus.COMPLETED };
      vi.mocked(mockSprintRepository.findOne!).mockResolvedValueOnce(mockCompletedSprint);
      await expect(service.startSprint(10)).rejects.toThrow(BadRequestException);
    });
    it('should mark sprint as active and set default startDate if null', async () => {
      const mockPlannedSprint = { ...mockSprint, status: SprintStatus.PLANNED, startDate: null };
      vi.mocked(mockSprintRepository.findOne!).mockResolvedValueOnce(mockPlannedSprint);
      const actualSprint = await service.startSprint(10);
      expect(actualSprint.status).toBe(SprintStatus.ACTIVE);
      expect(actualSprint.startDate).toBeDefined();
    });
  });

  describe('completeSprint', () => {
    it('should mark sprint completed and reassign unfinished issues using relational sprintId', async () => {
      vi.mocked(mockSprintRepository.findOne!)
        .mockResolvedValueOnce(mockSprint)
        .mockResolvedValueOnce({ ...mockSprint, id: 11, name: 'Sprint 2' });
      const actualSprint = await service.completeSprint(10, { transferSprintId: 11 });
      expect(actualSprint.status).toBe(SprintStatus.COMPLETED);
      expect(mockIssueRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.set).toHaveBeenCalledWith({ sprintId: 11 });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('sprintId = :sprintId', { sprintId: 10 });
    });
  });

  describe('deleteSprint', () => {
    it('should delete sprint and detach unresolved issues using relational sprintId', async () => {
      vi.mocked(mockSprintRepository.findOne!).mockResolvedValueOnce(mockSprint);
      const actualResult = await service.deleteSprint(10);
      expect(actualResult.success).toBe(true);
      expect(mockQueryBuilder.set).toHaveBeenCalledWith({ sprintId: null });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('sprintId = :sprintId', { sprintId: 10 });
      expect(mockSprintRepository.delete).toHaveBeenCalledWith(10);
    });
  });
});
