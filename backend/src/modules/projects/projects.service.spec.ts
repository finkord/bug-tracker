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

describe('ProjectsService', () => {
  let service: ProjectsService;
  let mockProjectRepo: any;
  let mockSchemeRepo: any;
  let mockRoleRepo: any;
  let mockActorRepo: any;
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

    service = new ProjectsService(
      mockProjectRepo as Repository<Project>,
      mockEvaluator as PermissionEvaluatorService,
      mockDataSource as DataSource,
      mockSchemeRepo as Repository<PermissionScheme>,
      mockRoleRepo as Repository<ProjectRole>,
      mockActorRepo as Repository<ProjectRoleActor>,
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
});
