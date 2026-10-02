import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConflictException } from '@nestjs/common';
import { DataSource, type Repository } from 'typeorm';
import { ProjectsService } from './projects.service.js';
import { Project } from './entities/project.entity.js';
import { User, SystemRole } from '../users/entities/user.entity.js';
import { PermissionEvaluatorService } from '../rbac/services/permission-evaluator.service.js';
import { ProjectPermission } from '../rbac/entities/permission-grant.entity.js';
import { PermissionScheme } from '../rbac/entities/permission-scheme.entity.js';
import { ProjectRole } from '../rbac/entities/project-role.entity.js';
import { ProjectRoleActor, ProjectActorType } from '../rbac/entities/project-role-actor.entity.js';
import { IssueType } from '../issues/entities/issue.entity.js';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let mockProjectRepo: any;
  let mockSchemeRepo: any;
  let mockRoleRepo: any;
  let mockActorRepo: any;
  let mockQuickFilterRepo: any;
  let mockComponentRepo: any;
  let mockVersionRepo: any;
  let mockIssueRepo: any;
  let mockJqlParser: any;
  let mockEvaluator: any;
  let mockDataSource: any;
  let mockManager: any;

  const mockAdminUser: User = {
    id: 1,
    email: 'admin@bugtracker.local',
    fullName: 'System Admin',
    systemRole: SystemRole.ADMIN,
  } as User;

  const mockDevUser: User = {
    id: 10,
    email: 'dev@bugtracker.local',
    fullName: 'Developer User',
    systemRole: SystemRole.USER,
  } as User;

  beforeEach(() => {
    mockProjectRepo = {
      findOne: vi.fn(),
      createQueryBuilder: vi.fn(() => ({
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        addGroupBy: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getRawMany: vi.fn().mockResolvedValue([
          {
            id: '1',
            name: 'Project Alpha',
            key: 'ALPHA',
            description: null,
            lead_id_ref: '10',
            lead_id: '10',
            lead_fullName: 'Lead User',
            lead_email: 'lead@test.local',
            totalIssues: '5',
            openIssues: '2',
            created_at_val: new Date(),
            updated_at_val: new Date(),
          },
        ]),
      })),
      save: vi.fn((p) => Promise.resolve({ id: 1, ...p })),
    };

    mockSchemeRepo = {
      findOne: vi.fn().mockResolvedValue({ id: 7, name: 'Default Scheme', isDefault: true }),
    };

    mockRoleRepo = {
      findOne: vi.fn().mockResolvedValue({ id: 3, name: 'Administrator', isDefault: true }),
    };

    mockActorRepo = {
      save: vi.fn((a) => Promise.resolve({ id: 1, ...a })),
    };

    mockEvaluator = {
      getAccessibleProjectIds: vi.fn(),
      invalidatePermissions: vi.fn().mockResolvedValue(undefined),
    };

    mockManager = {
      findOne: vi.fn(),
      create: vi.fn((entityClass, data) => ({ ...data })),
      save: vi.fn((entityClass, entity) => Promise.resolve({ id: 1, ...entity })),
    };

    mockDataSource = {
      transaction: vi.fn((cb) => cb(mockManager)),
    };

    mockQuickFilterRepo = {
      find: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn((data) => ({ id: Math.floor(Math.random() * 1000) + 1, ...data })),
      save: vi.fn((item) => Promise.resolve(item)),
      remove: vi.fn().mockResolvedValue(undefined),
      createQueryBuilder: vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        getRawOne: vi.fn().mockResolvedValue({ max: 2 }),
      })),
    };

    mockComponentRepo = {
      find: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn((data) => ({ id: 1, ...data })),
      save: vi.fn((item) => Promise.resolve({ id: 1, ...item })),
      remove: vi.fn().mockResolvedValue(undefined),
    };

    mockJqlParser = {
      parse: vi.fn((q) => ({ conditions: [], raw: q })),
    };

    mockVersionRepo = {
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn(),
      create: vi.fn((item: any) => ({ id: 1, ...item })),
      save: vi.fn((item: any) => Promise.resolve({ id: 1, ...item })),
      remove: vi.fn().mockResolvedValue(undefined),
    };

    mockIssueRepo = {
      find: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      createQueryBuilder: vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getCount: vi.fn().mockResolvedValue(0),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue({ affected: 0 }),
      })),
    };

    service = new ProjectsService(
      mockProjectRepo as Repository<Project>,
      mockEvaluator as PermissionEvaluatorService,
      mockDataSource as DataSource,
      mockSchemeRepo as Repository<PermissionScheme>,
      mockRoleRepo as Repository<ProjectRole>,
      mockActorRepo as Repository<ProjectRoleActor>,
      mockQuickFilterRepo as any,
      mockComponentRepo as any,
      mockVersionRepo as any,
      mockIssueRepo as any,
      mockJqlParser as any,
    );
  });

  describe('findAll - Multi-Tenant Project Isolation', () => {
    it('should return all projects without where filter for SystemRole.ADMIN', async () => {
      mockEvaluator.getAccessibleProjectIds.mockResolvedValue('ALL');

      const result = await service.findAll(mockAdminUser);

      expect(mockEvaluator.getAccessibleProjectIds).toHaveBeenCalledWith(
        mockAdminUser.id,
        ProjectPermission.BROWSE_PROJECTS,
      );
      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('ALPHA');
    });

    it('should filter projects by accessible IDs for standard users', async () => {
      mockEvaluator.getAccessibleProjectIds.mockResolvedValue([1]);

      const result = await service.findAll(mockDevUser);

      expect(mockEvaluator.getAccessibleProjectIds).toHaveBeenCalledWith(
        mockDevUser.id,
        ProjectPermission.BROWSE_PROJECTS,
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('should return empty array immediately if standard user has access to 0 projects', async () => {
      mockEvaluator.getAccessibleProjectIds.mockResolvedValue([]);

      const result = await service.findAll(mockDevUser);

      expect(result).toEqual([]);
      expect(mockProjectRepo.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  describe('create - RBAC Wiring and Atomic Transaction', () => {
    it('should create project with default permission scheme and creator as Administrator actor', async () => {
      // Arrange
      mockManager.findOne.mockImplementation((entityClass: any) => {
        if (entityClass === Project) return Promise.resolve(null);
        if (entityClass === PermissionScheme) {
          return Promise.resolve({ id: 7, name: 'Default Scheme', isDefault: true });
        }
        if (entityClass === ProjectRole) {
          return Promise.resolve({ id: 3, name: 'Administrator' });
        }
        return Promise.resolve(null);
      });

      // Act
      const result = await service.create(
        {
          name: 'New Platform',
          key: 'PLAT',
          description: 'A new platform project',
        },
        mockDevUser,
      );

      // Assert
      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(mockManager.create).toHaveBeenCalledWith(
        Project,
        expect.objectContaining({
          key: 'PLAT',
          permissionSchemeId: 7,
          leadId: mockDevUser.id,
        }),
      );
      expect(mockManager.create).toHaveBeenCalledWith(
        ProjectRoleActor,
        expect.objectContaining({
          roleId: 3,
          actorType: ProjectActorType.USER,
          userId: mockDevUser.id,
        }),
      );
      expect(mockEvaluator.invalidatePermissions).toHaveBeenCalledWith(1, mockDevUser.id);
      expect(result.key).toBe('PLAT');
    });

    it('should throw ConflictException if project key is already taken', async () => {
      mockManager.findOne.mockResolvedValue({ id: 99, key: 'PLAT' });

      await expect(
        service.create({ name: 'Duplicate', key: 'PLAT' }, mockDevUser),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Board Quick Filters Management', () => {
    it('should auto-seed default quick filters if none exist for project', async () => {
      mockProjectRepo.findOne.mockResolvedValue({ id: 1, key: 'ALPHA' });
      mockQuickFilterRepo.find.mockResolvedValue([]);

      const result = await service.getProjectQuickFilters(1);

      expect(mockQuickFilterRepo.create).toHaveBeenCalledTimes(3);
      expect(mockQuickFilterRepo.save).toHaveBeenCalled();
      expect(result).toHaveLength(3);
    });

    it('should return existing quick filters if present', async () => {
      mockProjectRepo.findOne.mockResolvedValue({ id: 1, key: 'ALPHA' });
      mockQuickFilterRepo.find.mockResolvedValue([
        { id: 1, name: 'Backend Bugs', jqlQuery: 'type = BUG', position: 0 },
      ]);

      const result = await service.getProjectQuickFilters(1);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Backend Bugs');
    });

    it('should create custom quick filter and validate JQL query', async () => {
      mockProjectRepo.findOne.mockResolvedValue({ id: 1, key: 'ALPHA' });

      const created = await service.createQuickFilter(1, {
        name: 'Urgent Ops',
        jqlQuery: 'priority = CRITICAL',
      });

      expect(mockJqlParser.parse).toHaveBeenCalledWith('priority = CRITICAL');
      expect(created.name).toBe('Urgent Ops');
    });

    it('should delete quick filter by id', async () => {
      mockQuickFilterRepo.findOne.mockResolvedValue({
        id: 5,
        projectId: 1,
        name: 'Old Filter',
      });

      const res = await service.deleteQuickFilter(1, 5);

      expect(mockQuickFilterRepo.remove).toHaveBeenCalled();
      expect(res.success).toBe(true);
    });
  });

  describe('Project Versions and Releases Management', () => {
    it('should return versions with calculated progress metrics', async () => {
      mockProjectRepo.findOne.mockResolvedValue({ id: 1, key: 'ALPHA' });
      mockVersionRepo.find.mockResolvedValue([
        { id: 10, projectId: 1, name: 'v1.0.0', status: 'UNRELEASED' },
      ]);
      mockIssueRepo.count.mockResolvedValue(10);
      mockIssueRepo.createQueryBuilder = vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getCount: vi.fn().mockResolvedValue(7),
      }));

      const versions = await service.getVersions(1);

      expect(versions).toHaveLength(1);
      expect(versions[0].totalIssues).toBe(10);
      expect(versions[0].completedIssues).toBe(7);
      expect(versions[0].progressPercentage).toBe(70);
    });

    it('should create a new project version', async () => {
      mockProjectRepo.findOne.mockResolvedValue({ id: 1, key: 'ALPHA' });
      mockVersionRepo.findOne.mockResolvedValue(null);
      mockVersionRepo.create.mockReturnValue({
        id: 11,
        projectId: 1,
        name: 'v2.0.0',
        status: 'UNRELEASED',
      });
      mockVersionRepo.save.mockResolvedValue({
        id: 11,
        projectId: 1,
        name: 'v2.0.0',
        status: 'UNRELEASED',
      });

      const version = await service.createVersion(1, { name: 'v2.0.0' });

      expect(version.name).toBe('v2.0.0');
      expect(mockVersionRepo.save).toHaveBeenCalled();
    });

    it('should release a version with releaseDate', async () => {
      const existing = {
        id: 10,
        projectId: 1,
        name: 'v1.0.0',
        status: 'UNRELEASED',
        releaseDate: null,
      };
      mockVersionRepo.findOne.mockResolvedValue(existing);
      mockVersionRepo.save.mockImplementation((v: any) => Promise.resolve(v));

      const released = await service.releaseVersion(1, 10, {
        moveUnresolvedIssuesToVersionId: 11,
      });

      expect(released.status).toBe('RELEASED');
      expect(released.releaseDate).toBeDefined();
    });

    it('should generate structured markdown release notes', async () => {
      mockProjectRepo.findOne.mockResolvedValue({ id: 1, key: 'ALPHA', name: 'Alpha Project' });
      mockVersionRepo.findOne.mockResolvedValue({
        id: 10,
        projectId: 1,
        name: 'v1.0.0',
        releaseDate: '2026-10-02',
      });
      mockIssueRepo.find.mockResolvedValue([
        {
          id: 101,
          issueNum: 1,
          title: 'Implement Dark Mode',
          issueType: IssueType.FEATURE,
          status: 'RESOLVED',
        },
        {
          id: 102,
          issueNum: 2,
          title: 'Fix CSRF token bug',
          issueType: IssueType.BUG,
          status: 'RESOLVED',
        },
      ]);

      const notes = await service.generateReleaseNotes(1, 10);

      expect(notes.version).toBe('v1.0.0');
      expect(notes.releaseNotes).toContain('# Release v1.0.0 - Alpha Project');
      expect(notes.releaseNotes).toContain('Features');
      expect(notes.releaseNotes).toContain('ALPHA-1');
      expect(notes.releaseNotes).toContain('Implement Dark Mode');
      expect(notes.releaseNotes).toContain('Bug Fixes');
      expect(notes.releaseNotes).toContain('ALPHA-2');
      expect(notes.releaseNotes).toContain('Fix CSRF token bug');
    });
  });
});

