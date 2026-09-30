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
  let mockUserRepo: any;
  let mockSavedFilterRepo: any;
  let mockGroupRepo: any;
  let mockUserGroupRepo: any;
  let mockRedisService: any;
  let mockSeaweedFsService: any;

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
      remove: vi.fn(),
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

    mockRedisService = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
    };

    mockSeaweedFsService = {
      uploadFile: vi.fn(),
      getFileBuffer: vi.fn(),
      deleteFile: vi.fn(),
    };

    service = new UsersService(
      mockUserRepo as Repository<User>,
      mockSavedFilterRepo as Repository<SavedFilter>,
      mockGroupRepo as Repository<Group>,
      mockUserGroupRepo as Repository<UserGroup>,
      mockRedisService,
      mockSeaweedFsService,
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

  describe('Saved Filters', () => {
    it('should retrieve saved filters ordered by favorite and recency', async () => {
      const mockFilters = [
        { id: 1, userId: 10, name: 'Starred Filter', criteria: 'status = "OPEN"', isFavorite: true },
        { id: 2, userId: 10, name: 'Recent Filter', criteria: 'priority = "HIGH"', isFavorite: false },
      ];
      mockSavedFilterRepo.find.mockResolvedValue(mockFilters);

      const result = await service.getSavedFilters(10);

      expect(mockSavedFilterRepo.find).toHaveBeenCalledWith({
        where: { userId: 10 },
        order: { isFavorite: 'DESC', createdAt: 'DESC' },
      });
      expect(result).toEqual(mockFilters);
    });

    it('should create a saved filter with favorite and description', async () => {
      const dto = {
        name: 'Urgent Tasks',
        criteria: 'priority = "CRITICAL"',
        description: 'Triage queue',
        isFavorite: true,
      };
      const createdEntity = { id: 3, userId: 10, ...dto };
      mockSavedFilterRepo.create.mockReturnValue(createdEntity);
      mockSavedFilterRepo.save.mockResolvedValue(createdEntity);

      const result = await service.createSavedFilter(10, dto);

      expect(mockSavedFilterRepo.create).toHaveBeenCalledWith({
        userId: 10,
        name: 'Urgent Tasks',
        criteria: 'priority = "CRITICAL"',
        description: 'Triage queue',
        isFavorite: true,
      });
      expect(result).toEqual(createdEntity);
    });

    it('should update an existing saved filter', async () => {
      const existing = {
        id: 3,
        userId: 10,
        name: 'Old Name',
        criteria: 'status = "OPEN"',
        description: null,
        isFavorite: false,
      };
      mockSavedFilterRepo.findOne.mockResolvedValue(existing);
      mockSavedFilterRepo.save.mockImplementation((entity: any) => Promise.resolve(entity));

      const result = await service.updateSavedFilter(10, 3, {
        name: 'New Name',
        isFavorite: true,
      });

      expect(result.name).toBe('New Name');
      expect(result.isFavorite).toBe(true);
      expect(mockSavedFilterRepo.save).toHaveBeenCalled();
    });

    it('should delete a saved filter', async () => {
      const existing = { id: 3, userId: 10 };
      mockSavedFilterRepo.findOne.mockResolvedValue(existing);
      mockSavedFilterRepo.remove.mockResolvedValue(existing);

      await service.deleteSavedFilter(10, 3);

      expect(mockSavedFilterRepo.remove).toHaveBeenCalledWith(existing);
    });
  });

  describe('Preferences Synchronization', () => {
    it('should return preferences for a user', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: 10,
        preferences: { theme: 'light', showCollapsedLabels: true },
      });

      const prefs = await service.getPreferences(10);
      expect(prefs).toEqual({ theme: 'light', showCollapsedLabels: true });
    });

    it('should update preferences and persist them to database', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: 10,
        preferences: { theme: 'dark' },
      });
      mockUserRepo.update.mockResolvedValue({ affected: 1 });

      const updated = await service.updatePreferences(10, { showCollapsedLabels: true });

      expect(mockUserRepo.update).toHaveBeenCalledWith(10, {
        preferences: { theme: 'dark', showCollapsedLabels: true },
      });
      expect(updated).toEqual({ theme: 'dark', showCollapsedLabels: true });
    });
  });

  describe('Avatar Upload to SeaweedFS', () => {
    it('should upload image file to SeaweedFS and update avatarUrl', async () => {
      mockSeaweedFsService.uploadFile.mockResolvedValue({
        fid: '3,01a2b3c4',
        url: 'http://localhost:8080/3,01a2b3c4',
      });
      mockUserRepo.update.mockResolvedValue({ affected: 1 });
      mockUserRepo.findOne.mockResolvedValue({
        id: 10,
        avatarUrl: '/api/v1/users/avatar/3,01a2b3c4',
      });

      const file = {
        originalname: 'profile.png',
        buffer: Buffer.from('fake-png-data'),
        mimetype: 'image/png',
        size: 1024,
      };

      const result = await service.uploadAvatarFile(10, file);

      expect(mockSeaweedFsService.uploadFile).toHaveBeenCalledWith(file);
      expect(mockUserRepo.update).toHaveBeenCalledWith(10, {
        avatarUrl: '/api/v1/users/avatar/3,01a2b3c4',
      });
      expect(result.avatarUrl).toBe('/api/v1/users/avatar/3,01a2b3c4');
    });

    it('should reject unsupported file MIME types', async () => {
      const file = {
        originalname: 'malicious.exe',
        buffer: Buffer.from('MZ...'),
        mimetype: 'application/x-msdownload',
        size: 1024,
      };

      await expect(service.uploadAvatarFile(10, file)).rejects.toThrow();
    });
  });

  describe('getSystemStats (SQL Aggregation & Redis Caching)', () => {
    it('should return cached stats when present in Redis', async () => {
      const cachedStats = {
        totalUsers: 100,
        activeUsers: 85,
        blockedUsers: 5,
        twoFactorAdoptionCount: 60,
        twoFactorPercentage: 60,
        roleBreakdown: { ADMIN: 10, USER: 90 },
      };
      mockRedisService.get.mockResolvedValue(JSON.stringify(cachedStats));

      const stats = await service.getSystemStats();

      expect(mockRedisService.get).toHaveBeenCalledWith('admin:system_stats');
      expect(stats).toEqual(cachedStats);
    });

    it('should execute SQL aggregation and cache in Redis when cache misses', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockUserRepo.query = vi.fn().mockResolvedValue([
        {
          totalUsers: '50',
          activeUsers: '45',
          blockedUsers: '2',
          twoFactorAdoptionCount: '30',
          adminCount: '5',
          userCount: '45',
        },
      ]);

      const stats = await service.getSystemStats();

      expect(mockUserRepo.query).toHaveBeenCalledWith(
        expect.stringContaining('COUNT(*)::int AS "totalUsers"'),
      );
      expect(stats.totalUsers).toBe(50);
      expect(stats.activeUsers).toBe(45);
      expect(stats.blockedUsers).toBe(2);
      expect(stats.twoFactorAdoptionCount).toBe(30);
      expect(stats.twoFactorPercentage).toBe(60);
      expect(stats.roleBreakdown).toEqual({ ADMIN: 5, USER: 45 });
      expect(mockRedisService.set).toHaveBeenCalledWith(
        'admin:system_stats',
        expect.any(String),
        60,
      );
    });
  });
});
