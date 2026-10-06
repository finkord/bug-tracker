import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SeedService } from './seed.service.js';

describe('SeedService', () => {
  let service: SeedService;
  let mockUserRepo: any;
  let mockProjectRepo: any;
  let mockSprintRepo: any;
  let mockIssueRepo: any;
  let mockIssueLinkRepo: any;
  let mockWorklogRepo: any;
  let mockCommentRepo: any;
  let mockGroupRepo: any;
  let mockUserGroupRepo: any;
  let mockProjectRoleRepo: any;
  let mockRoleActorRepo: any;
  let mockSchemeRepo: any;
  let mockGrantRepo: any;
  let mockSecuritySchemeRepo: any;
  let mockSecurityLevelRepo: any;
  let mockSecurityGrantRepo: any;
  let mockTeamRepo: any;
  let mockTeamMemberRepo: any;

  beforeEach(() => {
    mockUserRepo = {
      create: vi.fn((data) => ({ id: Math.floor(Math.random() * 1000) + 1, ...data })),
      save: vi.fn((entity) => {
        if (Array.isArray(entity)) {
          return Promise.resolve(entity.map((e, idx) => ({ id: idx + 100, ...e })));
        }
        return Promise.resolve({ id: 1, ...entity });
      }),
      createQueryBuilder: vi.fn(() => ({
        delete: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue({ affected: 1 }),
      })),
    };

    mockProjectRepo = {
      create: vi.fn((data) => ({ id: Math.floor(Math.random() * 1000) + 1, ...data })),
      save: vi.fn((entity) => Promise.resolve({ id: 1, ...entity })),
      createQueryBuilder: vi.fn(() => ({
        delete: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue({ affected: 1 }),
      })),
    };

    mockSprintRepo = {
      create: vi.fn((data) => ({ id: Math.floor(Math.random() * 1000) + 1, ...data })),
      save: vi.fn((entity) => Promise.resolve({ id: Math.floor(Math.random() * 1000) + 1, ...entity })),
      createQueryBuilder: vi.fn(() => ({
        delete: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue({ affected: 1 }),
      })),
    };

    mockIssueRepo = {
      create: vi.fn((data) => ({ id: Math.floor(Math.random() * 1000) + 1, ...data })),
      save: vi.fn((entity) => {
        if (Array.isArray(entity)) {
          return Promise.resolve(entity.map((e, idx) => ({ id: idx + 1000, ...e })));
        }
        return Promise.resolve({ id: 1, ...entity });
      }),
      update: vi.fn().mockResolvedValue({ affected: 1 }),
      createQueryBuilder: vi.fn(() => ({
        delete: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue({ affected: 1 }),
      })),
    };

    mockIssueLinkRepo = {
      create: vi.fn((data) => ({ id: 1, ...data })),
      save: vi.fn((entity) => Promise.resolve(entity)),
      createQueryBuilder: vi.fn(() => ({
        delete: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue({ affected: 1 }),
      })),
    };

    mockWorklogRepo = {
      create: vi.fn((data) => ({ id: 1, ...data })),
      save: vi.fn((entity) => Promise.resolve(entity)),
      createQueryBuilder: vi.fn(() => ({
        delete: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue({ affected: 1 }),
      })),
    };

    mockCommentRepo = {
      create: vi.fn((data) => ({ id: 1, ...data })),
      save: vi.fn((entity) => Promise.resolve(entity)),
      createQueryBuilder: vi.fn(() => ({
        delete: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue({ affected: 1 }),
      })),
    };

    const makeGenericRepo = () => ({
      findOne: vi.fn().mockResolvedValue(null),
      create: vi.fn((data) => ({ id: Math.floor(Math.random() * 1000) + 1, ...data })),
      save: vi.fn((entity) => Promise.resolve({ id: 1, ...entity })),
      createQueryBuilder: vi.fn(() => ({
        delete: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue({ affected: 1 }),
      })),
    });

    mockGroupRepo = makeGenericRepo();
    mockUserGroupRepo = makeGenericRepo();
    mockProjectRoleRepo = makeGenericRepo();
    mockRoleActorRepo = makeGenericRepo();
    mockSchemeRepo = makeGenericRepo();
    mockGrantRepo = makeGenericRepo();
    mockSecuritySchemeRepo = makeGenericRepo();
    mockSecurityLevelRepo = makeGenericRepo();
    mockSecurityGrantRepo = makeGenericRepo();
    mockTeamRepo = makeGenericRepo();
    mockTeamMemberRepo = makeGenericRepo();

    service = new SeedService(
      mockUserRepo,
      mockProjectRepo,
      mockTeamRepo,
      mockTeamMemberRepo,
      mockSprintRepo,
      mockIssueRepo,
      mockIssueLinkRepo,
      mockWorklogRepo,
      mockCommentRepo,
      mockGroupRepo,
      mockUserGroupRepo,
      mockProjectRoleRepo,
      mockRoleActorRepo,
      mockSchemeRepo,
      mockGrantRepo,
      mockSecuritySchemeRepo,
      mockSecurityLevelRepo,
      mockSecurityGrantRepo,
    );
  });

  it('instantiates successfully with all injected repositories', () => {
    expect(service).toBeDefined();
  });

  it('runs seed process with default options and generates summary statistics', async () => {
    const stats = await service.runSeed({
      clean: true,
      usersCount: 25,
      projectsCount: 5,
      sprintsCount: 15,
      issuesCount: 50,
      seedNumber: 42,
    });

    expect(stats).toBeDefined();
    expect(stats.projectsCount).toBeGreaterThanOrEqual(5);
    expect(stats.usersCount).toBeGreaterThanOrEqual(25);
    expect(stats.issuesCount).toBeGreaterThanOrEqual(50);
    expect(stats.teamsCount).toBeGreaterThanOrEqual(5);
  });
});
