import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, type FindOptionsWhere } from 'typeorm';
import { User, SystemRole } from '../../users/entities/user.entity.js';
import { Project } from '../../projects/entities/project.entity.js';
import { Issue } from '../../issues/entities/issue.entity.js';
import { Group } from '../entities/group.entity.js';
import { UserGroup } from '../entities/user-group.entity.js';
import { ProjectRole } from '../entities/project-role.entity.js';
import { ProjectRoleActor, ProjectActorType } from '../entities/project-role-actor.entity.js';
import { PermissionScheme } from '../entities/permission-scheme.entity.js';
import {
  PermissionGrant,
  ProjectPermission,
  PermissionGrantType,
} from '../entities/permission-grant.entity.js';
import { IssueSecurityLevel } from '../entities/issue-security-level.entity.js';
import { IssueSecurityGrant } from '../entities/issue-security-grant.entity.js';

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
      const defaultScheme = await this.schemeRepository.findOne({
        where: { isDefault: true },
      });
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
   */
  async getEffectivePermissions(userId: number, projectId: number): Promise<Record<string, boolean>> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const allPermissions = Object.values(ProjectPermission);

    if (!user) {
      return allPermissions.reduce((acc, p) => ({ ...acc, [p]: false }), {});
    }

    const userAdminGroup = await this.userGroupRepository.createQueryBuilder('ug')
      .innerJoin('ug.group', 'g')
      .where('ug.userId = :userId', { userId })
      .andWhere('LOWER(g.name) IN (:...names)', { names: ['administrators', 'admin', 'admins'] })
      .getOne();

    if (user.systemRole === SystemRole.ADMIN || userAdminGroup) {
      return allPermissions.reduce((acc, p) => ({ ...acc, [p]: true }), {});
    }

    const result: Record<string, boolean> = {};
    for (const perm of allPermissions) {
      result[perm] = await this.hasPermission({
        userId,
        projectId,
        permission: perm,
      });
    }

    return result;
  }
}
