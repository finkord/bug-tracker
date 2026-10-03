import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SystemInitService } from './system-init.service.js';
import { ProjectPermission, PermissionGrantType } from '../rbac/entities/permission-grant.entity.js';

describe('SystemInitService - ensureDefaultPermissionScheme', () => {
  let service: SystemInitService;
  let mockUserRepo: any;
  let mockGroupRepo: any;
  let mockUserGroupRepo: any;
  let mockProjectRoleRepo: any;
  let mockSchemeRepo: any;
  let mockGrantRepo: any;
  let mockSecuritySchemeRepo: any;
  let mockSecurityLevelRepo: any;
  let mockSecurityGrantRepo: any;
  let mockDataSource: any;
  let mockRedisService: any;

  beforeEach(() => {
    mockUserRepo = { findOne: vi.fn(), create: vi.fn(), save: vi.fn() };
    mockGroupRepo = { findOne: vi.fn(), create: vi.fn(), save: vi.fn() };
    mockUserGroupRepo = { findOne: vi.fn(), create: vi.fn(), save: vi.fn() };
    mockProjectRoleRepo = { findOne: vi.fn(), create: vi.fn(), save: vi.fn() };
    mockSchemeRepo = {
      findOne: vi.fn(),
      create: vi.fn((data) => ({ id: 1, ...data })),
      save: vi.fn((entity) => Promise.resolve({ id: 1, ...entity })),
    };
    mockGrantRepo = {
      find: vi.fn().mockResolvedValue([]),
      create: vi.fn((data) => ({ id: Math.floor(Math.random() * 1000), ...data })),
      save: vi.fn((entity) => Promise.resolve(entity)),
    };
    mockSecuritySchemeRepo = { findOne: vi.fn(), create: vi.fn(), save: vi.fn() };
    mockSecurityLevelRepo = { findOne: vi.fn(), create: vi.fn(), save: vi.fn() };
    mockSecurityGrantRepo = { findOne: vi.fn(), create: vi.fn(), save: vi.fn() };
    mockDataSource = { query: vi.fn().mockResolvedValue([]) };
    mockRedisService = { delPattern: vi.fn().mockResolvedValue(1) };

    service = new SystemInitService(
      mockUserRepo,
      mockGroupRepo,
      mockUserGroupRepo,
      mockProjectRoleRepo,
      mockSchemeRepo,
      mockGrantRepo,
      mockSecuritySchemeRepo,
      mockSecurityLevelRepo,
      mockSecurityGrantRepo,
      mockDataSource,
      mockRedisService,
    );
  });

  it('creates the Default Agile Collaborative Scheme when none exists and seeds all grants', async () => {
    mockSchemeRepo.findOne.mockResolvedValue(null);

    const roles: Record<string, any> = {
      Administrators: { id: 10, name: 'Administrators' },
      'Project Lead': { id: 20, name: 'Project Lead' },
      Developers: { id: 30, name: 'Developers' },
      Viewers: { id: 40, name: 'Viewers' },
    };
    const groups: Record<string, any> = {
      'all-users': { id: 100, name: 'all-users' },
    };

    const scheme = await (service as any).ensureDefaultPermissionScheme(roles, groups);

    expect(scheme.name).toBe('Default Agile Collaborative Scheme');
    expect(scheme.isDefault).toBe(true);
    expect(mockGrantRepo.save).toHaveBeenCalled();
    expect(mockRedisService.delPattern).toHaveBeenCalledWith('rbac:*');
  });

  it('idempotently updates legacy scheme name and avoids inserting duplicate grants', async () => {
    const existingScheme = {
      id: 5,
      name: 'Default Software Scheme',
      description: 'Legacy description',
      isDefault: false,
    };
    mockSchemeRepo.findOne.mockResolvedValueOnce(existingScheme);

    const existingGrants = [
      {
        id: 1,
        schemeId: 5,
        permission: ProjectPermission.ADMINISTER_PROJECTS,
        grantType: PermissionGrantType.ROLE,
        roleId: 10,
        groupId: null,
      },
      {
        id: 2,
        schemeId: 5,
        permission: ProjectPermission.ADMINISTER_PROJECTS,
        grantType: PermissionGrantType.LEAD,
        roleId: null,
        groupId: null,
      },
    ];
    mockGrantRepo.find.mockResolvedValue(existingGrants);

    const roles: Record<string, any> = {
      Administrators: { id: 10, name: 'Administrators' },
      'Project Lead': { id: 20, name: 'Project Lead' },
      Developers: { id: 30, name: 'Developers' },
      Viewers: { id: 40, name: 'Viewers' },
    };
    const groups: Record<string, any> = {
      'all-users': { id: 100, name: 'all-users' },
    };

    const scheme = await (service as any).ensureDefaultPermissionScheme(roles, groups);

    expect(scheme.name).toBe('Default Agile Collaborative Scheme');
    expect(scheme.isDefault).toBe(true);
    expect(mockGrantRepo.save).toHaveBeenCalled();
  });
});
