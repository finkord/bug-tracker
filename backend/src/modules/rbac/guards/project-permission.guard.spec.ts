import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ForbiddenException, NotFoundException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { ProjectPermissionGuard } from './project-permission.guard.js';
import { ProjectPermission } from '../entities/permission-grant.entity.js';
import { PermissionEvaluatorService } from '../services/permission-evaluator.service.js';

describe('ProjectPermissionGuard', () => {
  let guard: ProjectPermissionGuard;
  let mockReflector: Partial<Reflector>;
  let mockEvaluator: Partial<PermissionEvaluatorService>;
  let mockDataSource: Partial<DataSource>;
  let mockIssueRepo: any;

  beforeEach(() => {
    mockReflector = {
      getAllAndOverride: vi.fn(),
    };
    mockEvaluator = {
      hasPermission: vi.fn(),
    };
    mockIssueRepo = {
      findOne: vi.fn(),
    };
    mockDataSource = {
      getRepository: vi.fn().mockReturnValue(mockIssueRepo),
    };

    guard = new ProjectPermissionGuard(
      mockReflector as Reflector,
      mockEvaluator as PermissionEvaluatorService,
      mockDataSource as DataSource,
    );
  });

  const createMockContext = (request: any): ExecutionContext => {
    return {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue(request),
      }),
    } as unknown as ExecutionContext;
  };

  it('should allow access if no project permission is required on the route', async () => {
    (mockReflector.getAllAndOverride as any).mockReturnValue(undefined);
    const context = createMockContext({ user: { id: 1 } });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should throw ForbiddenException if user is not authenticated', async () => {
    (mockReflector.getAllAndOverride as any).mockReturnValue(ProjectPermission.BROWSE_PROJECTS);
    const context = createMockContext({ user: null });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should FAIL-CLOSED and throw ForbiddenException if projectId cannot be resolved', async () => {
    (mockReflector.getAllAndOverride as any).mockReturnValue(ProjectPermission.BROWSE_PROJECTS);
    const context = createMockContext({
      user: { id: 1 },
      params: {},
      body: {},
      url: '/some-ambiguous-route',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    await expect(guard.canActivate(context)).rejects.toThrow(
      'Unable to resolve project context required for project permission check',
    );
  });

  it('should resolve projectId from body and permit if user has permission', async () => {
    (mockReflector.getAllAndOverride as any).mockReturnValue(ProjectPermission.CREATE_ISSUES);
    (mockEvaluator.hasPermission as any).mockResolvedValue(true);
    const context = createMockContext({
      user: { id: 1 },
      body: { projectId: 42 },
      params: {},
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockEvaluator.hasPermission).toHaveBeenCalledWith({
      userId: 1,
      projectId: 42,
      permission: ProjectPermission.CREATE_ISSUES,
      issueId: undefined,
    });
  });

  it('should throw NotFoundException if referenced issue does not exist in database', async () => {
    (mockReflector.getAllAndOverride as any).mockReturnValue(ProjectPermission.BROWSE_PROJECTS);
    mockIssueRepo.findOne.mockResolvedValue(null);
    const context = createMockContext({
      user: { id: 1 },
      params: { id: 'PROJ-9999' },
      originalUrl: '/api/v1/issues/PROJ-9999',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException if user lacks required permission', async () => {
    (mockReflector.getAllAndOverride as any).mockReturnValue(ProjectPermission.ADMINISTER_PROJECTS);
    (mockEvaluator.hasPermission as any).mockResolvedValue(false);
    const context = createMockContext({
      user: { id: 10 },
      params: { projectId: '42' },
      body: {},
    });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });
});
