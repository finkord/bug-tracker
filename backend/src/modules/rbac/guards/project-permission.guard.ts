import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { REQUIRE_PROJECT_PERMISSION_KEY } from '../decorators/require-permission.decorator.js';
import { ProjectPermission } from '../entities/permission-grant.entity.js';
import { PermissionEvaluatorService } from '../services/permission-evaluator.service.js';
import { Issue } from '../../issues/entities/issue.entity.js';
import { Project } from '../../projects/entities/project.entity.js';

@Injectable()
export class ProjectPermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionEvaluator: PermissionEvaluatorService,
    private readonly dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<
      ProjectPermission | ProjectPermission[]
    >(REQUIRE_PROJECT_PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('User authentication required');
    }

    let projectId: number | undefined = undefined;
    let issueId: number | undefined = undefined;

    // 1. Explicit body projectId (e.g. POST /issues)
    if (request.body?.projectId) {
      projectId = Number(request.body.projectId);
    }

    // 2. Explicit route params
    if (request.params?.projectId) {
      const rawPid = String(request.params.projectId).trim();
      if (/^\d+$/.test(rawPid)) {
        projectId = Number(rawPid);
      } else {
        const project = await this.dataSource.getRepository(Project).findOne({
          where: { key: rawPid.toUpperCase() },
          select: { id: true },
        });
        if (project) {
          projectId = project.id;
        }
      }
    }
    if (request.params?.key && (request.originalUrl || request.url || '').includes('/projects/')) {
      const rawKey = String(request.params.key).trim().toUpperCase();
      const project = await this.dataSource.getRepository(Project).findOne({
        where: { key: rawKey },
        select: { id: true },
      });
      if (project) {
        projectId = project.id;
      }
    }
    if (request.params?.issueId) {
      issueId = Number(request.params.issueId);
      const issue = await this.dataSource.getRepository(Issue).findOne({
        where: { id: issueId },
        select: { id: true, projectId: true },
      });
      if (!issue) {
        throw new NotFoundException(`Issue #${issueId} not found`);
      }
      projectId = issue.projectId;
    }

    // 3. Resolve from :id depending on route context
    if (request.params?.id) {
      const rawId = String(request.params.id).trim();
      const url = request.originalUrl || request.url || '';
      if (url.includes('/projects/')) {
        if (/^\d+$/.test(rawId)) {
          projectId = Number(rawId);
        } else {
          const project = await this.dataSource.getRepository(Project).findOne({
            where: { key: rawId.toUpperCase() },
            select: { id: true },
          });
          if (project) {
            projectId = project.id;
          }
        }
      } else if (url.includes('/issues/')) {
        if (/^\d+$/.test(rawId)) {
          issueId = Number(rawId);
          const issue = await this.dataSource.getRepository(Issue).findOne({
            where: { id: issueId },
            select: { id: true, projectId: true },
          });
          if (!issue) {
            throw new NotFoundException(`Issue #${issueId} not found`);
          }
          projectId = issue.projectId;
        } else {
          const keyMatch = rawId.match(/^([a-zA-Z0-9_-]+)-(\d+)$/);
          if (keyMatch) {
            const [, projectKey, issueNumStr] = keyMatch;
            const issue = await this.dataSource.getRepository(Issue).findOne({
              where: {
                issueNum: parseInt(issueNumStr, 10),
                project: { key: projectKey.toUpperCase() },
              },
              relations: { project: true },
              select: { id: true, projectId: true },
            });
            if (!issue) {
              throw new NotFoundException(`Issue "${rawId}" not found`);
            }
            issueId = issue.id;
            projectId = issue.projectId;
          }
        }
      }
    }

    // 4. If issueId is known but projectId is not, resolve issue from DB
    if (!projectId && issueId && !Number.isNaN(issueId)) {
      const issue = await this.dataSource.getRepository(Issue).findOne({
        where: { id: issueId },
        select: { id: true, projectId: true },
      });
      if (!issue) {
        throw new NotFoundException(`Issue #${issueId} not found`);
      }
      projectId = issue.projectId;
    }

    if (!projectId || Number.isNaN(projectId)) {
      throw new ForbiddenException(
        'Unable to resolve project context required for project permission check',
      );
    }

    const permissionsToCheck = Array.isArray(requiredPermission)
      ? requiredPermission
      : [requiredPermission];

    let hasAccess = false;
    for (const perm of permissionsToCheck) {
      const allowed = await this.permissionEvaluator.hasPermission({
        userId: user.id,
        projectId,
        permission: perm,
        issueId,
      });
      if (allowed) {
        hasAccess = true;
        break;
      }
    }

    if (!hasAccess) {
      throw new ForbiddenException(
        `You do not have the required permission (${permissionsToCheck.join(' or ')}) to perform this action in this project.`,
      );
    }

    return true;
  }
}
