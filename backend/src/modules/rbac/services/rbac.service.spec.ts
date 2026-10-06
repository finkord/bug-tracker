import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RbacService } from './rbac.service.js';
import { ProjectRole } from '../entities/project-role.entity.js';
import { Group } from '../entities/group.entity.js';
import { PermissionScheme } from '../entities/permission-scheme.entity.js';
import { IssueSecurityScheme } from '../entities/issue-security-scheme.entity.js';

describe('RbacService Enterprise CRUD & Safeguards', () => {
  let service: RbacService;
  let mockGroupRepo: any;
  let mockUserGroupRepo: any;
  let mockRoleRepo: any;
  let mockRoleActorRepo: any;
  let mockSchemeRepo: any;
  let mockGrantRepo: any;
  let mockSecuritySchemeRepo: any;
  let mockSecurityLevelRepo: any;
  let mockSecurityGrantRepo: any;
  let mockProjectRepo: any;
  let mockUserRepo: any;
  let mockPermissionEvaluator: any;

  beforeEach(() => {
    mockGroupRepo = {
      find: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn((dto) => dto),
      save: vi.fn((dto) => Promise.resolve({ id: 1, ...dto })),
      delete: vi.fn().mockResolvedValue({ affected: 1 }),
    };

    mockUserGroupRepo = {
      findOne: vi.fn(),
      create: vi.fn((dto) => dto),
      save: vi.fn((dto) => Promise.resolve(dto)),
      delete: vi.fn().mockResolvedValue({ affected: 1 }),
    };

    mockRoleRepo = {
      find: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn((dto) => dto),
      save: vi.fn((dto) => Promise.resolve({ id: dto.id || 1, ...dto })),
      delete: vi.fn().mockResolvedValue({ affected: 1 }),
    };

    mockRoleActorRepo = {
      find: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn((dto) => dto),
      save: vi.fn((dto) => Promise.resolve(dto)),
      delete: vi.fn().mockResolvedValue({ affected: 1 }),
    };

    mockSchemeRepo = {
      find: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn((dto) => dto),
      save: vi.fn((dto) => Promise.resolve({ id: 1, ...dto })),
      delete: vi.fn().mockResolvedValue({ affected: 1 }),
    };

    mockGrantRepo = {
      create: vi.fn((dto) => dto),
      save: vi.fn((dto) => Promise.resolve(dto)),
      delete: vi.fn().mockResolvedValue({ affected: 1 }),
    };

    mockSecuritySchemeRepo = {
      find: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn((dto) => dto),
      save: vi.fn((dto) => Promise.resolve({ id: 10, ...dto })),
      delete: vi.fn().mockResolvedValue({ affected: 1 }),
    };

    mockSecurityLevelRepo = {
      find: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn((dto) => dto),
      save: vi.fn((dto) => Promise.resolve({ id: 20, ...dto })),
      delete: vi.fn().mockResolvedValue({ affected: 1 }),
    };

    mockSecurityGrantRepo = {
      findOne: vi.fn(),
      create: vi.fn((dto) => dto),
      save: vi.fn((dto) => Promise.resolve({ id: 50, ...dto })),
      delete: vi.fn().mockResolvedValue({ affected: 1 }),
    };

    mockProjectRepo = {
      findOne: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
      save: vi.fn((p) => Promise.resolve(p)),
    };

    mockUserRepo = {
      findOne: vi.fn(),
      save: vi.fn((u) => Promise.resolve(u)),
    };

    mockPermissionEvaluator = {
      invalidatePermissions: vi.fn().mockResolvedValue(undefined),
    };

    service = new RbacService(
      mockGroupRepo,
      mockUserGroupRepo,
      mockRoleRepo,
      mockRoleActorRepo,
      mockSchemeRepo,
      mockGrantRepo,
      mockSecuritySchemeRepo,
      mockSecurityLevelRepo,
      mockSecurityGrantRepo,
      mockProjectRepo,
      mockUserRepo,
      mockPermissionEvaluator,
    );
  });

  describe('Project Roles Management', () => {
    it('prevents deletion of baseline system roles (Administrator, Member, Viewer)', async () => {
      mockRoleRepo.findOne.mockResolvedValue({ id: 1, name: 'Administrator' } as ProjectRole);
      await expect(service.deleteProjectRole(1)).rejects.toThrow(BadRequestException);

      mockRoleRepo.findOne.mockResolvedValue({ id: 2, name: 'Member' } as ProjectRole);
      await expect(service.deleteProjectRole(2)).rejects.toThrow(BadRequestException);

      mockRoleRepo.findOne.mockResolvedValue({ id: 3, name: 'Viewer' } as ProjectRole);
      await expect(service.deleteProjectRole(3)).rejects.toThrow(BadRequestException);
    });

    it('successfully deletes custom role and cleans up actors and grants', async () => {
      mockRoleRepo.findOne.mockResolvedValue({ id: 99, name: 'Custom Auditor' } as ProjectRole);
      await service.deleteProjectRole(99);

      expect(mockRoleActorRepo.delete).toHaveBeenCalledWith({ roleId: 99 });
      expect(mockGrantRepo.delete).toHaveBeenCalledWith({ roleId: 99 });
      expect(mockSecurityGrantRepo.delete).toHaveBeenCalledWith({ roleId: 99 });
      expect(mockRoleRepo.delete).toHaveBeenCalledWith(99);
      expect(mockPermissionEvaluator.invalidatePermissions).toHaveBeenCalled();
    });

    it('updates role properties including isDefault and validates unique name', async () => {
      const existing = { id: 5, name: 'Old Role', description: 'Desc', isDefault: false };
      mockRoleRepo.findOne
        .mockResolvedValueOnce(existing) // for role find
        .mockResolvedValueOnce(null); // for duplicate name check

      const updated = await service.updateProjectRole(5, {
        name: 'Updated Role',
        description: 'New Desc',
        isDefault: true,
      });

      expect(updated.name).toBe('Updated Role');
      expect(updated.description).toBe('New Desc');
      expect(updated.isDefault).toBe(true);
      expect(mockRoleRepo.save).toHaveBeenCalled();
    });
  });

  describe('Permission Scheme Deletion', () => {
    it('prevents deletion of default permission scheme', async () => {
      mockSchemeRepo.findOne.mockResolvedValue({ id: 1, name: 'Default Scheme', isDefault: true });
      await expect(service.deletePermissionScheme(1)).rejects.toThrow(BadRequestException);
    });

    it('prevents deletion if assigned to active projects', async () => {
      mockSchemeRepo.findOne.mockResolvedValue({ id: 2, name: 'Custom Scheme', isDefault: false });
      mockProjectRepo.count.mockResolvedValue(3);
      await expect(service.deletePermissionScheme(2)).rejects.toThrow(
        /Cannot delete permission scheme: assigned to 3 project\(s\)/,
      );
    });

    it('successfully deletes unassigned permission scheme and its grants', async () => {
      mockSchemeRepo.findOne.mockResolvedValue({ id: 2, name: 'Custom Scheme', isDefault: false });
      mockProjectRepo.count.mockResolvedValue(0);

      await service.deletePermissionScheme(2);
      expect(mockGrantRepo.delete).toHaveBeenCalledWith({ schemeId: 2 });
      expect(mockSchemeRepo.delete).toHaveBeenCalledWith(2);
      expect(mockPermissionEvaluator.invalidatePermissions).toHaveBeenCalled();
    });
  });

  describe('Directory Groups Deletion', () => {
    it('prevents deletion of system administrative groups', async () => {
      mockGroupRepo.findOne.mockResolvedValue({ id: 1, name: 'administrators', isSystem: false } as Group);
      await expect(service.deleteGroup(1)).rejects.toThrow(BadRequestException);

      mockGroupRepo.findOne.mockResolvedValue({ id: 2, name: 'Developers', isSystem: true } as Group);
      await expect(service.deleteGroup(2)).rejects.toThrow(BadRequestException);
    });

    it('successfully deletes custom directory group and associated memberships', async () => {
      mockGroupRepo.findOne.mockResolvedValue({ id: 15, name: 'Contractors', isSystem: false } as Group);

      await service.deleteGroup(15);
      expect(mockUserGroupRepo.delete).toHaveBeenCalledWith({ groupId: 15 });
      expect(mockRoleActorRepo.delete).toHaveBeenCalledWith({ groupId: 15 });
      expect(mockGrantRepo.delete).toHaveBeenCalledWith({ groupId: 15 });
      expect(mockSecurityGrantRepo.delete).toHaveBeenCalledWith({ groupId: 15 });
      expect(mockGroupRepo.delete).toHaveBeenCalledWith(15);
      expect(mockPermissionEvaluator.invalidatePermissions).toHaveBeenCalled();
    });
  });

  describe('Issue Security Scheme Management', () => {
    it('creates security scheme with a default level', async () => {
      mockSecuritySchemeRepo.findOne
        .mockResolvedValueOnce(null) // uniqueness check
        .mockResolvedValueOnce({ id: 10, name: 'Confidential Scheme', levels: [] }); // return findOne

      const result = await service.createSecurityScheme('Confidential Scheme', 'Protected issues');
      expect(mockSecuritySchemeRepo.create).toHaveBeenCalledWith({
        name: 'Confidential Scheme',
        description: 'Protected issues',
      });
      expect(mockSecurityLevelRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Default' }),
      );
      expect(result).toBeDefined();
    });

    it('prevents deletion of default issue security scheme', async () => {
      mockSecuritySchemeRepo.findOne.mockResolvedValue({ id: 1, name: 'Default Issue Security Scheme' });
      await expect(service.deleteSecurityScheme(1)).rejects.toThrow(BadRequestException);
    });

    it('prevents deletion if assigned to active projects', async () => {
      mockSecuritySchemeRepo.findOne.mockResolvedValue({ id: 5, name: 'Custom Security' });
      mockProjectRepo.count.mockResolvedValue(2);
      await expect(service.deleteSecurityScheme(5)).rejects.toThrow(
        /Cannot delete issue security scheme: assigned to 2 project\(s\)/,
      );
    });

    it('successfully deletes unassigned security scheme with levels and grants', async () => {
      mockSecuritySchemeRepo.findOne.mockResolvedValue({ id: 5, name: 'Custom Security' });
      mockProjectRepo.count.mockResolvedValue(0);
      mockSecurityLevelRepo.find.mockResolvedValue([{ id: 101, schemeId: 5 }]);

      await service.deleteSecurityScheme(5);
      expect(mockSecurityGrantRepo.delete).toHaveBeenCalledWith({ securityLevelId: 101 });
      expect(mockSecurityLevelRepo.delete).toHaveBeenCalledWith({ schemeId: 5 });
      expect(mockSecuritySchemeRepo.delete).toHaveBeenCalledWith(5);
    });

    it('adds a security level to an existing scheme', async () => {
      mockSecuritySchemeRepo.findOne.mockResolvedValue({ id: 5, name: 'Custom Security' });
      mockSecurityLevelRepo.findOne.mockResolvedValue(null); // not duplicate

      const level = await service.addSecurityLevel(5, {
        name: 'Confidential',
        description: 'Internal only',
      });
      expect(mockSecurityLevelRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Confidential', schemeId: 5 }),
      );
      expect(level).toBeDefined();
    });

    it('prevents adding a duplicate security level name to the same scheme', async () => {
      mockSecuritySchemeRepo.findOne.mockResolvedValue({ id: 5, name: 'Custom Security' });
      mockSecurityLevelRepo.findOne.mockResolvedValue({ id: 10, name: 'Confidential', schemeId: 5 });

      await expect(
        service.addSecurityLevel(5, { name: 'Confidential' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('prevents deleting the default security level', async () => {
      mockSecuritySchemeRepo.findOne.mockResolvedValue({
        id: 5,
        name: 'Custom Security',
        defaultLevelId: 101,
      });
      mockSecurityLevelRepo.findOne.mockResolvedValue({ id: 101, schemeId: 5 });

      await expect(service.deleteSecurityLevel(5, 101)).rejects.toThrow(
        /Cannot delete the default security level/,
      );
    });

    it('successfully deletes a non-default security level and its grants', async () => {
      mockSecuritySchemeRepo.findOne.mockResolvedValue({
        id: 5,
        name: 'Custom Security',
        defaultLevelId: 101,
      });
      mockSecurityLevelRepo.findOne.mockResolvedValue({ id: 102, schemeId: 5 });

      await service.deleteSecurityLevel(5, 102);
      expect(mockSecurityGrantRepo.delete).toHaveBeenCalledWith({ securityLevelId: 102 });
      expect(mockSecurityLevelRepo.delete).toHaveBeenCalledWith(102);
    });

    it('sets default security level for a scheme', async () => {
      mockSecuritySchemeRepo.findOne
        .mockResolvedValueOnce({ id: 5, defaultLevelId: null })
        .mockResolvedValueOnce({ id: 5, defaultLevelId: 102, levels: [] });
      mockSecurityLevelRepo.findOne.mockResolvedValue({ id: 102, schemeId: 5 });

      const updated = await service.setDefaultSecurityLevel(5, 102);
      expect(mockSecuritySchemeRepo.save).toHaveBeenCalled();
      expect(updated).toBeDefined();
    });

    it('adds actor grant to a security level', async () => {
      mockSecurityLevelRepo.findOne.mockResolvedValue({ id: 101, schemeId: 5 });
      mockSecurityGrantRepo.findOne
        .mockResolvedValueOnce(null) // uniqueness check
        .mockResolvedValueOnce({ id: 50, securityLevelId: 101, roleId: 3, role: { name: 'Developers' } });

      const grant = await service.addSecurityGrant(5, 101, {
        grantType: 'ROLE' as any,
        roleId: 3,
      });
      expect(mockSecurityGrantRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ securityLevelId: 101, roleId: 3 }),
      );
      expect(grant).toBeDefined();
    });

    it('deletes actor grant by ID', async () => {
      mockSecurityGrantRepo.findOne.mockResolvedValue({ id: 50 });
      await service.deleteSecurityGrant(50);
      expect(mockSecurityGrantRepo.delete).toHaveBeenCalledWith(50);
    });
  });
});
