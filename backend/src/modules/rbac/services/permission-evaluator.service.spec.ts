import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PermissionEvaluatorService, type EvaluationContext } from './permission-evaluator.service.js';
import { User, SystemRole } from '../../users/entities/user.entity.js';
import { Project } from '../../projects/entities/project.entity.js';
import { Issue, IssueStatus, IssuePriority, IssueSeverity, IssueType } from '../../issues/entities/issue.entity.js';
import {
  ProjectPermission,
  PermissionGrantType,
  PermissionGrant,
} from '../entities/permission-grant.entity.js';
import { ProjectActorType } from '../entities/project-role-actor.entity.js';

describe('PermissionEvaluatorService', () => {
  let service: PermissionEvaluatorService;
  let mockUserRepo: any;
  let mockProjectRepo: any;
  let mockIssueRepo: any;
  let mockUserGroupRepo: any;
  let mockRoleActorRepo: any;
  let mockSchemeRepo: any;
  let mockGrantRepo: any;
  let mockSecurityGrantRepo: any;

  const mockUser: User = {
    id: 10,
    email: 'dev@company.com',
    fullName: 'Developer User',
    systemRole: SystemRole.USER,
  } as User;

  const mockProject: Project = {
    id: 100,
    key: 'TEST',
    name: 'Test Project',
    leadId: 20,
    permissionSchemeId: 5,
  } as Project;

  const mockIssue: Issue = {
    id: 500,
    projectId: 100,
    title: 'Test Issue',
    issueType: IssueType.BUG,
    status: IssueStatus.OPEN,
    priority: IssuePriority.HIGH,
    severity: IssueSeverity.MAJOR,
    reporterId: 10,
    assigneeId: 30,
    securityLevelId: null,
  } as Issue;

  beforeEach(() => {
    mockUser.systemRole = SystemRole.USER;
    mockUserRepo = {
      findOne: vi.fn().mockResolvedValue(mockUser),
    };
    mockUserGroupRepo = {
      createQueryBuilder: vi.fn(() => ({
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue(null),
      })),
      find: vi.fn().mockResolvedValue([]),
    };
    mockProjectRepo = {
      findOne: vi.fn().mockResolvedValue(mockProject),
    };
    mockIssueRepo = {
      findOne: vi.fn().mockResolvedValue(mockIssue),
    };
    mockRoleActorRepo = {
      find: vi.fn().mockResolvedValue([]),
    };
    mockSchemeRepo = {
      findOne: vi.fn().mockResolvedValue({ id: 5, isDefault: true }),
    };
    mockGrantRepo = {
      find: vi.fn().mockResolvedValue([]),
    };
    mockSecurityGrantRepo = {
      find: vi.fn().mockResolvedValue([]),
    };
    service = new PermissionEvaluatorService(
      mockUserRepo,
      mockProjectRepo,
      mockIssueRepo,
      mockUserGroupRepo,
      mockRoleActorRepo,
      mockSchemeRepo,
      mockGrantRepo,
      mockSecurityGrantRepo,
    );
  });

  describe('hasPermission - Super Admin & System Overrides', () => {
    it('should return true immediately if user has ADMIN system role', async () => {
      // Arrange
      mockUser.systemRole = SystemRole.ADMIN;
      const inputContext: EvaluationContext = {
        userId: 10,
        projectId: 100,
        permission: ProjectPermission.ADMINISTER_PROJECTS,
      };
      // Act
      const actualResult = await service.hasPermission(inputContext);
      // Assert
      expect(actualResult).toBe(true);
      expect(mockProjectRepo.findOne).not.toHaveBeenCalled();
    });

    it('should return true if user belongs to administrators group', async () => {
      // Arrange
      mockUser.systemRole = SystemRole.USER;
      mockUserGroupRepo.createQueryBuilder = vi.fn(() => ({
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue({ id: 1, userId: 10, groupId: 99 }),
      }));
      const inputContext: EvaluationContext = {
        userId: 10,
        projectId: 100,
        permission: ProjectPermission.BROWSE_PROJECTS,
      };
      // Act
      const actualResult = await service.hasPermission(inputContext);
      // Assert
      expect(actualResult).toBe(true);
    });

    it('should return false if user does not exist', async () => {
      // Arrange
      mockUserRepo.findOne.mockResolvedValue(null);
      const inputContext: EvaluationContext = {
        userId: 999,
        projectId: 100,
        permission: ProjectPermission.BROWSE_PROJECTS,
      };
      // Act
      const actualResult = await service.hasPermission(inputContext);
      // Assert
      expect(actualResult).toBe(false);
    });
  });

  describe('hasPermission - Project Scheme Grants', () => {
    it('should grant permission when user is project lead and LEAD grant is configured', async () => {
      // Arrange
      mockProject.leadId = 10;
      const mockLeadGrant: PermissionGrant = {
        id: 1,
        schemeId: 5,
        permission: ProjectPermission.ADMINISTER_PROJECTS,
        grantType: PermissionGrantType.LEAD,
      } as PermissionGrant;
      mockGrantRepo.find.mockResolvedValue([mockLeadGrant]);
      const inputContext: EvaluationContext = {
        userId: 10,
        projectId: 100,
        permission: ProjectPermission.ADMINISTER_PROJECTS,
      };
      // Act
      const actualResult = await service.hasPermission(inputContext);
      // Assert
      expect(actualResult).toBe(true);
    });

    it('should grant permission when user is reporter on issue and REPORTER grant exists', async () => {
      // Arrange
      const mockReporterGrant: PermissionGrant = {
        id: 2,
        schemeId: 5,
        permission: ProjectPermission.EDIT_ISSUES,
        grantType: PermissionGrantType.REPORTER,
      } as PermissionGrant;
      mockGrantRepo.find.mockResolvedValue([mockReporterGrant]);
      const inputContext: EvaluationContext = {
        userId: 10,
        projectId: 100,
        permission: ProjectPermission.EDIT_ISSUES,
        issueId: 500,
      };
      // Act
      const actualResult = await service.hasPermission(inputContext);
      // Assert
      expect(actualResult).toBe(true);
    });

    it('should grant permission when user has project role mapped to grant', async () => {
      // Arrange
      const targetRoleId = 7;
      const mockRoleGrant: PermissionGrant = {
        id: 3,
        schemeId: 5,
        permission: ProjectPermission.CREATE_ISSUES,
        grantType: PermissionGrantType.ROLE,
        roleId: targetRoleId,
      } as PermissionGrant;
      mockGrantRepo.find.mockResolvedValue([mockRoleGrant]);
      mockRoleActorRepo.find.mockResolvedValue([
        {
          id: 1,
          projectId: 100,
          roleId: targetRoleId,
          actorType: ProjectActorType.USER,
          userId: 10,
        },
      ]);
      const inputContext: EvaluationContext = {
        userId: 10,
        projectId: 100,
        permission: ProjectPermission.CREATE_ISSUES,
      };
      // Act
      const actualResult = await service.hasPermission(inputContext);
      // Assert
      expect(actualResult).toBe(true);
    });

    it('should return false when no matching grants are satisfied', async () => {
      // Arrange
      const mockLeadGrant: PermissionGrant = {
        id: 4,
        schemeId: 5,
        permission: ProjectPermission.DELETE_ISSUES,
        grantType: PermissionGrantType.LEAD,
      } as PermissionGrant;
      mockProject.leadId = 99;
      mockGrantRepo.find.mockResolvedValue([mockLeadGrant]);
      const inputContext: EvaluationContext = {
        userId: 10,
        projectId: 100,
        permission: ProjectPermission.DELETE_ISSUES,
      };
      // Act
      const actualResult = await service.hasPermission(inputContext);
      // Assert
      expect(actualResult).toBe(false);
    });
  });
});
