import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { User, SystemRole } from './entities/user.entity.js';
import type { Repository } from 'typeorm';
import type { SavedFilter } from './entities/saved-filter.entity.js';
import type { Group } from '../rbac/entities/group.entity.js';
import type { UserGroup } from '../rbac/entities/user-group.entity.js';

describe('UsersService - Root Administrator Protections', () => {
  let service: UsersService;
  let mockUserRepo: Partial<Repository<User>>;
  let mockSavedFilterRepo: Partial<Repository<SavedFilter>>;
  let mockGroupRepo: Partial<Repository<Group>>;
  let mockUserGroupRepo: Partial<Repository<UserGroup>>;

  const mockAdminUser: User = Object.assign(new User(), {
    id: 1,
    fullName: 'System Administrator',
    email: 'admin@bugtracker.local',
    systemRole: SystemRole.ADMIN,
    isRoot: true,
    jobTitle: 'Principal System Administrator',
    isActivated: true,
    isBlocked: false,
  });

  const mockNonRootAdmin: User = Object.assign(new User(), {
    id: 2,
    fullName: 'Secondary Administrator',
    email: 'secondary@bugtracker.local',
    systemRole: SystemRole.ADMIN,
    isRoot: false,
    jobTitle: 'DevOps Lead',
    isActivated: true,
    isBlocked: false,
  });

  const mockStandardUser: User = Object.assign(new User(), {
    id: 10,
    fullName: 'Regular Developer',
    email: 'dev@bugtracker.local',
    systemRole: SystemRole.USER,
    isRoot: false,
    jobTitle: 'Software Engineer',
    isActivated: true,
    isBlocked: false,
  });

  beforeEach(() => {
    mockUserRepo = {
      findOne: vi.fn(),
      find: vi.fn(),
      count: vi.fn(),
      create: vi.fn((dto) => dto as User) as any,
      save: vi.fn(async (u) => u as User) as any,
      update: vi.fn(),
      delete: vi.fn(),
    };

    mockSavedFilterRepo = {
      find: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn() as any,
      save: vi.fn() as any,
      delete: vi.fn(),
    };

    mockGroupRepo = {
      findOne: vi.fn(),
    };

    mockUserGroupRepo = {
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn(),
      create: vi.fn((dto) => dto as UserGroup) as any,
      save: vi.fn() as any,
      delete: vi.fn(),
      createQueryBuilder: vi.fn(() => ({
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getExists: vi.fn().mockResolvedValue(false),
      })) as unknown as Repository<UserGroup>['createQueryBuilder'],
    };

    service = new UsersService(
      mockUserRepo as Repository<User>,
      mockSavedFilterRepo as Repository<SavedFilter>,
      mockGroupRepo as Repository<Group>,
      mockUserGroupRepo as Repository<UserGroup>,
    );
  });

  describe('updateRole (Demotion Protections)', () => {
    it('should throw ForbiddenException when attempting to demote the root administrator account', async () => {
      // Arrange
      vi.spyOn(service, 'findById').mockResolvedValue(mockAdminUser);

      // Act & Assert
      await expect(
        service.updateRole(1, SystemRole.USER, 2),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.updateRole(1, SystemRole.USER, 2),
      ).rejects.toThrow('Root administrator accounts cannot be demoted');
    });

    it('should throw BadRequestException when an administrator attempts to demote their own account', async () => {
      // Arrange
      vi.spyOn(service, 'findById').mockResolvedValue(mockNonRootAdmin);

      // Act & Assert
      await expect(
        service.updateRole(2, SystemRole.USER, 2),
      ).rejects.toThrow('Cannot demote your own administrator account');
    });

    it('should successfully demote a non-root administrator account to standard user', async () => {
      // Arrange
      vi.spyOn(service, 'findById').mockResolvedValue(mockNonRootAdmin);
      vi.spyOn(service, 'update').mockResolvedValue(
        Object.assign(new User(), mockNonRootAdmin, { systemRole: SystemRole.USER }),
      );
      vi.spyOn(service, 'syncUserGroupsWithRole').mockResolvedValue(undefined);

      // Act
      const result = await service.updateRole(2, SystemRole.USER, 1);

      // Assert
      expect(result.systemRole).toBe(SystemRole.USER);
      expect(service.update).toHaveBeenCalledWith(2, { systemRole: SystemRole.USER });
    });

    it('should successfully promote a standard user to administrator', async () => {
      // Arrange
      vi.spyOn(service, 'findById').mockResolvedValue(mockStandardUser);
      vi.spyOn(service, 'update').mockResolvedValue(
        Object.assign(new User(), mockStandardUser, { systemRole: SystemRole.ADMIN }),
      );
      vi.spyOn(service, 'syncUserGroupsWithRole').mockResolvedValue(undefined);

      // Act
      const result = await service.updateRole(10, SystemRole.ADMIN, 1);

      // Assert
      expect(result.systemRole).toBe(SystemRole.ADMIN);
      expect(service.update).toHaveBeenCalledWith(10, { systemRole: SystemRole.ADMIN });
    });
  });

  describe('blockUser (Lockout Protections)', () => {
    it('should throw ForbiddenException when attempting to block the root administrator account', async () => {
      // Arrange
      vi.spyOn(service, 'findById').mockResolvedValue(mockAdminUser);

      // Act & Assert
      await expect(service.blockUser(1)).rejects.toThrow(ForbiddenException);
      await expect(service.blockUser(1)).rejects.toThrow(
        'Root administrator accounts cannot be blocked',
      );
    });

    it('should successfully block a non-root administrator account', async () => {
      // Arrange
      vi.spyOn(service, 'findById').mockResolvedValue(mockNonRootAdmin);
      vi.spyOn(service, 'update').mockResolvedValue(
        Object.assign(new User(), mockNonRootAdmin, { isBlocked: true }),
      );

      // Act
      const result = await service.blockUser(2);

      // Assert
      expect(result.isBlocked).toBe(true);
      expect(service.update).toHaveBeenCalledWith(2, { isBlocked: true });
    });

    it('should successfully block a standard user account', async () => {
      // Arrange
      vi.spyOn(service, 'findById').mockResolvedValue(mockStandardUser);
      vi.spyOn(service, 'update').mockResolvedValue(
        Object.assign(new User(), mockStandardUser, { isBlocked: true }),
      );

      // Act
      const result = await service.blockUser(10);

      // Assert
      expect(result.isBlocked).toBe(true);
      expect(service.update).toHaveBeenCalledWith(10, { isBlocked: true });
    });
  });

  describe('deleteUser (Deletion Protections)', () => {
    it('should throw ForbiddenException when attempting to delete the root administrator account', async () => {
      // Arrange
      vi.spyOn(service, 'findById').mockResolvedValue(mockAdminUser);

      // Act & Assert
      await expect(service.deleteUser(1)).rejects.toThrow(ForbiddenException);
      await expect(service.deleteUser(1)).rejects.toThrow(
        'Root administrator accounts cannot be deleted',
      );
      expect(mockUserRepo.delete).not.toHaveBeenCalled();
    });

    it('should successfully delete a non-root administrator account', async () => {
      // Arrange
      vi.spyOn(service, 'findById').mockResolvedValue(mockNonRootAdmin);

      // Act
      const result = await service.deleteUser(2);

      // Assert
      expect(result.message).toContain('User #2 has been deleted');
      expect(mockUserRepo.delete).toHaveBeenCalledWith(2);
    });

    it('should successfully delete a standard user account', async () => {
      // Arrange
      vi.spyOn(service, 'findById').mockResolvedValue(mockStandardUser);

      // Act
      const result = await service.deleteUser(10);

      // Assert
      expect(result.message).toContain('User #10 has been deleted');
      expect(mockUserRepo.delete).toHaveBeenCalledWith(10);
    });
  });
});
