import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, type FindOptionsWhere } from 'typeorm';
import { User, SystemRole } from '../../users/entities/user.entity.js';
import { Project } from '../../projects/entities/project.entity.js';
import { Issue } from '../../issues/entities/issue.entity.js';
import { UserGroup } from '../entities/user-group.entity.js';
import { ProjectRoleActor, ProjectActorType } from '../entities/project-role-actor.entity.js';
import { PermissionScheme } from '../entities/permission-scheme.entity.js';
import {
  PermissionGrant,
  ProjectPermission,
  PermissionGrantType,
} from '../entities/permission-grant.entity.js';
import { IssueSecurityGrant } from '../entities/issue-security-grant.entity.js';
import { RedisService } from '../../redis/redis.service.js';

export interface EvaluationContext {
  userId: number;
  projectId: number;
  permission: ProjectPermission;
  issueId?: number;
}

@Injectable()
export class PermissionEvaluatorService {
  private readonly logger = new Logger(PermissionEvaluatorService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Issue)
    private readonly issueRepository: Repository<Issue>,
    @InjectRepository(UserGroup)
    private readonly userGroupRepository: Repository<UserGroup>,
    @InjectRepository(ProjectRoleActor)
    private readonly roleActorRepository: Repository<ProjectRoleActor>,
    @InjectRepository(PermissionScheme)
    private readonly schemeRepository: Repository<PermissionScheme>,
    @InjectRepository(PermissionGrant)
    private readonly grantRepository: Repository<PermissionGrant>,
    @InjectRepository(IssueSecurityGrant)
    private readonly securityGrantRepository: Repository<IssueSecurityGrant>,
    @Optional()
    private readonly redisService?: RedisService,
  ) {}

  /**
   * Evaluates if a user has a specific permission in a project.
   */
  async hasPermission(context: EvaluationContext): Promise<boolean> {
    const { userId, projectId, permission, issueId } = context;

    // 1. Fetch user & check global ADMIN override (via systemRole or directory group)
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return false;
    if (user.systemRole === SystemRole.ADMIN) {
      return true;
    }

    const userAdminGroup = await this.userGroupRepository.createQueryBuilder('ug')
      .innerJoin('ug.group', 'g')
      .where('ug.userId = :userId', { userId })
      .andWhere('LOWER(g.name) IN (:...names)', { names: ['administrators', 'admin', 'admins'] })
      .getOne();

    if (userAdminGroup) {
      return true;
    }

    // 2. Fetch project with lead and attached permission scheme
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: {
        lead: true,
        permissionScheme: true,
      },
    });
    if (!project) return false;

    // 3. Resolve user's global group IDs
    const userGroups = await this.userGroupRepository.find({
      where: { userId },
    });
    const userGroupIds = userGroups.map((ug) => ug.groupId);

    // 4. Resolve effective Permission Scheme
    let schemeId = project.permissionSchemeId;
    if (!schemeId) {
      let defaultScheme = await this.schemeRepository.findOne({
        where: { isDefault: true },
      });
      if (!defaultScheme) {
        defaultScheme = await this.schemeRepository.findOne({
          order: { id: 'ASC' },
        });
      }
      schemeId = defaultScheme ? defaultScheme.id : null;
    }

    if (!schemeId) {
      // If no scheme is attached or found, project lead and developers get default browse/edit
      return project.leadId === userId;
    }

    // 5. Fetch all grants for this permission in the active scheme
    const grants = await this.grantRepository.find({
      where: { schemeId, permission },
    });

    if (grants.length === 0) {
      return false;
    }

    // 6. Resolve project roles held by this user directly or via global groups
    const actorWhereClauses: FindOptionsWhere<ProjectRoleActor>[] = [
      { projectId, actorType: ProjectActorType.USER, userId },
    ];
    if (userGroupIds.length > 0) {
      actorWhereClauses.push({
        projectId,
        actorType: ProjectActorType.GROUP,
        groupId: In(userGroupIds),
      });
    }

    const projectActors = await this.roleActorRepository.find({
      where: actorWhereClauses,
    });
    const userProjectRoleIds = new Set(projectActors.map((a) => a.roleId));

    // 7. Resolve Issue if provided
    let issue: Issue | null = null;
    if (issueId) {
      issue = await this.issueRepository.findOne({ where: { id: issueId } });
    }

    // 8. Match grants
    let hasGrant = false;
    for (const grant of grants) {
      switch (grant.grantType) {
        case PermissionGrantType.ANY_LOGGED_IN:
          hasGrant = true;
          break;

        case PermissionGrantType.LEAD:
          if (project.leadId === userId) {
            hasGrant = true;
          }
          break;

        case PermissionGrantType.REPORTER:
          if (issue && issue.reporterId === userId) {
            hasGrant = true;
          }
          break;

        case PermissionGrantType.ASSIGNEE:
          if (issue && issue.assigneeId === userId) {
            hasGrant = true;
          }
          break;

        case PermissionGrantType.GROUP:
          if (grant.groupId && userGroupIds.includes(grant.groupId)) {
            hasGrant = true;
          }
          break;

        case PermissionGrantType.ROLE:
          if (grant.roleId && userProjectRoleIds.has(grant.roleId)) {
            hasGrant = true;
          }
          break;
      }

      if (hasGrant) break;
    }

    if (!hasGrant) {
      return false;
    }

    // 9. If issue has securityLevelId, verify row-level security grant
    if (issue && issue.securityLevelId) {
      const canAccessSecurityLevel = await this.canAccessIssueSecurityLevel(
        userId,
        project,
        issue,
        userGroupIds,
        userProjectRoleIds,
      );
      if (!canAccessSecurityLevel) {
        return false;
      }
    }

    return true;
  }

  /**
   * Validates row-level access against issue security level.
   */
  private async canAccessIssueSecurityLevel(
    userId: number,
    project: Project,
    issue: Issue,
    userGroupIds: number[],
    userProjectRoleIds: Set<number>,
  ): Promise<boolean> {
    if (!issue.securityLevelId) return true;

    const grants = await this.securityGrantRepository.find({
      where: { securityLevelId: issue.securityLevelId },
    });

    if (grants.length === 0) return true;

    for (const grant of grants) {
      if (grant.grantType === PermissionGrantType.ANY_LOGGED_IN) return true;
      if (grant.grantType === PermissionGrantType.LEAD && project.leadId === userId) return true;
      if (grant.grantType === PermissionGrantType.REPORTER && issue.reporterId === userId) return true;
      if (grant.grantType === PermissionGrantType.ASSIGNEE && issue.assigneeId === userId) return true;
      if (grant.grantType === PermissionGrantType.GROUP && grant.groupId && userGroupIds.includes(grant.groupId)) return true;
      if (grant.grantType === PermissionGrantType.ROLE && grant.roleId && userProjectRoleIds.has(grant.roleId)) return true;
    }

    return false;
  }

  /**
   * Returns a map of all effective permissions for a user within a project.
   * Leverages Redis caching and a single-pass context query to prevent N+1 SQL cascades.
   */
  async getEffectivePermissions(userId: number, projectId: number): Promise<Record<string, boolean>> {
    const cacheKey = `rbac:user:${userId}:project:${projectId}`;
    if (this.redisService) {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        try {
          return JSON.parse(cached) as Record<string, boolean>;
        } catch (err: unknown) {
          this.logger.warn(`Failed to parse cached permissions for ${cacheKey}: ${err}`);
        }
      }
    }

    const allPermissions = Object.values(ProjectPermission);

    // 1. Fetch user & check global ADMIN override (via systemRole or directory group)
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return allPermissions.reduce<Record<string, boolean>>((acc, p) => {
        acc[p] = false;
        return acc;
      }, {});
    }

    const userAdminGroup = await this.userGroupRepository.createQueryBuilder('ug')
      .innerJoin('ug.group', 'g')
      .where('ug.userId = :userId', { userId })
      .andWhere('LOWER(g.name) IN (:...names)', { names: ['administrators', 'admin', 'admins'] })
      .getOne();

    if (user.systemRole === SystemRole.ADMIN || userAdminGroup) {
      const adminResult = allPermissions.reduce<Record<string, boolean>>((acc, p) => {
        acc[p] = true;
        return acc;
      }, {});
      if (this.redisService) {
        await this.redisService.set(cacheKey, JSON.stringify(adminResult), 300);
      }
      return adminResult;
    }

    // 2. Fetch project with lead and attached permission scheme
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: { lead: true },
    });
    if (!project) {
      return allPermissions.reduce<Record<string, boolean>>((acc, p) => {
        acc[p] = false;
        return acc;
      }, {});
    }

    // 3. Resolve user's global group IDs
    const userGroups = await this.userGroupRepository.find({
      where: { userId },
    });
    const userGroupIds = userGroups.map((ug) => ug.groupId);

    // 4. Resolve effective Permission Scheme
    let schemeId = project.permissionSchemeId;
    if (!schemeId) {
      let defaultScheme = await this.schemeRepository.findOne({
        where: { isDefault: true },
      });
      if (!defaultScheme) {
        defaultScheme = await this.schemeRepository.findOne({
          order: { id: 'ASC' },
        });
      }
      schemeId = defaultScheme ? defaultScheme.id : null;
    }

    const isLead = project.leadId === userId;
    if (!schemeId) {
      const fallbackResult = allPermissions.reduce<Record<string, boolean>>((acc, p) => {
        acc[p] = isLead && (p === ProjectPermission.BROWSE_PROJECTS || p === ProjectPermission.ADMINISTER_PROJECTS);
        return acc;
      }, {});
      if (this.redisService) {
        await this.redisService.set(cacheKey, JSON.stringify(fallbackResult), 300);
      }
      return fallbackResult;
    }

    // 5. Fetch ALL grants for the active scheme in ONE query
    const grants = await this.grantRepository.find({
      where: { schemeId },
    });

    // 6. Resolve project roles held by this user directly or via global groups in ONE query
    const actorWhereClauses: FindOptionsWhere<ProjectRoleActor>[] = [
      { projectId, actorType: ProjectActorType.USER, userId },
    ];
    if (userGroupIds.length > 0) {
      actorWhereClauses.push({
        projectId,
        actorType: ProjectActorType.GROUP,
        groupId: In(userGroupIds),
      });
    }

    const projectActors = await this.roleActorRepository.find({
      where: actorWhereClauses,
    });
    const userProjectRoleIds = new Set(projectActors.map((a) => a.roleId));

    // 7. Group grants in-memory by permission
    const grantsByPermission = new Map<ProjectPermission, PermissionGrant[]>();
    for (const grant of grants) {
      const list = grantsByPermission.get(grant.permission);
      if (list) {
        list.push(grant);
      } else {
        grantsByPermission.set(grant.permission, [grant]);
      }
    }

    // 8. Evaluate each permission in memory in O(1) time
    const result: Record<string, boolean> = {};
    for (const perm of allPermissions) {
      const permGrants = grantsByPermission.get(perm);
      if (!permGrants || permGrants.length === 0) {
        result[perm] = false;
        continue;
      }

      let hasGrant = false;
      for (const grant of permGrants) {
        switch (grant.grantType) {
          case PermissionGrantType.ANY_LOGGED_IN:
            hasGrant = true;
            break;

          case PermissionGrantType.LEAD:
            if (project.leadId === userId) {
              hasGrant = true;
            }
            break;

          case PermissionGrantType.GROUP:
            if (grant.groupId && userGroupIds.includes(grant.groupId)) {
              hasGrant = true;
            }
            break;

          case PermissionGrantType.ROLE:
            if (grant.roleId && userProjectRoleIds.has(grant.roleId)) {
              hasGrant = true;
            }
            break;
        }

        if (hasGrant) break;
      }

      result[perm] = hasGrant;
    }

    // 9. Store evaluated permissions in Redis (5-minute TTL)
    if (this.redisService) {
      await this.redisService.set(cacheKey, JSON.stringify(result), 300);
    }

    return result;
  }

  /**
   * Retrieves list of project IDs accessible to a user for a given permission (e.g. BROWSE_PROJECTS).
   * Performs a single indexed PostgreSQL query, completely eliminating N+1 table scans.
   */
  async getAccessibleProjectIds(
    userId: number,
    permission: ProjectPermission = ProjectPermission.BROWSE_PROJECTS,
  ): Promise<number[] | 'ALL'> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return [];
    if (user.systemRole === SystemRole.ADMIN) {
      return 'ALL';
    }

    const userAdminGroup = await this.userGroupRepository.createQueryBuilder('ug')
      .innerJoin('ug.group', 'g')
      .where('ug.userId = :userId', { userId })
      .andWhere('LOWER(g.name) IN (:...names)', { names: ['administrators', 'admin', 'admins'] })
      .getOne();

    if (userAdminGroup) {
      return 'ALL';
    }

    const userGroups = await this.userGroupRepository.find({ where: { userId } });
    const userGroupIds = userGroups.map((ug) => ug.groupId);

    let defaultScheme = await this.schemeRepository.findOne({ where: { isDefault: true } });
    if (!defaultScheme) {
      defaultScheme = await this.schemeRepository.findOne({ order: { id: 'ASC' } });
    }
    const defaultSchemeId = defaultScheme ? defaultScheme.id : null;

    const qb = this.projectRepository.createQueryBuilder('p')
      .distinct(true)
      .select('p.id', 'id')
      .leftJoin(
        PermissionGrant,
        'pg',
        'pg.schemeId = COALESCE(p.permissionSchemeId, :defaultSchemeId) AND pg.permission = :permission',
        { defaultSchemeId, permission },
      )
      .leftJoin(ProjectRoleActor, 'pra', 'pra.projectId = p.id');

    const conditions: string[] = [
      'pg.grantType = :anyLoggedIn',
      '(pg.grantType = :leadGrant AND p.leadId = :userId)',
    ];
    const params: Record<string, any> = {
      defaultSchemeId,
      permission,
      anyLoggedIn: PermissionGrantType.ANY_LOGGED_IN,
      leadGrant: PermissionGrantType.LEAD,
      userId,
    };

    if (userGroupIds.length > 0) {
      conditions.push('(pg.grantType = :groupGrant AND pg.groupId IN (:...userGroupIds))');
      params.groupGrant = PermissionGrantType.GROUP;
      params.userGroupIds = userGroupIds;
    }

    const roleConditions: string[] = ['(pra.actorType = :userActor AND pra.userId = :userId)'];
    params.userActor = ProjectActorType.USER;
    if (userGroupIds.length > 0) {
      roleConditions.push('(pra.actorType = :groupActor AND pra.groupId IN (:...userGroupIds))');
      params.groupActor = ProjectActorType.GROUP;
    }

    conditions.push(
      `(pg.grantType = :roleGrant AND pg.roleId = pra.roleId AND (${roleConditions.join(' OR ')}))`,
    );
    params.roleGrant = PermissionGrantType.ROLE;

    if (!defaultSchemeId) {
      conditions.push('(p.permissionSchemeId IS NULL AND p.leadId = :userId)');
    }

    qb.where(`(${conditions.join(' OR ')})`, params);

    const rows = await qb.getRawMany<{ id: string | number }>();
    return rows.map((r) => Number(r.id));
  }

  /**
   * Invalidates Redis permission cache for projects and users.
   */
  async invalidatePermissions(projectId?: number, userId?: number): Promise<void> {
    if (!this.redisService) return;
    if (projectId && userId) {
      await this.redisService.del(`rbac:user:${userId}:project:${projectId}`);
    } else if (projectId) {
      await this.redisService.delPattern(`rbac:user:*:project:${projectId}`);
    } else if (userId) {
      await this.redisService.delPattern(`rbac:user:${userId}:project:*`);
    } else {
      await this.redisService.delPattern('rbac:user:*');
    }
  }
}

