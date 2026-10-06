import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
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
import { IssueSecurityScheme } from '../entities/issue-security-scheme.entity.js';
import { IssueSecurityLevel } from '../entities/issue-security-level.entity.js';
import { IssueSecurityGrant } from '../entities/issue-security-grant.entity.js';
import { Project } from '../../projects/entities/project.entity.js';
import { User, SystemRole } from '../../users/entities/user.entity.js';
import { PermissionEvaluatorService } from './permission-evaluator.service.js';

@Injectable()
export class RbacService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(UserGroup)
    private readonly userGroupRepository: Repository<UserGroup>,
    @InjectRepository(ProjectRole)
    private readonly projectRoleRepository: Repository<ProjectRole>,
    @InjectRepository(ProjectRoleActor)
    private readonly roleActorRepository: Repository<ProjectRoleActor>,
    @InjectRepository(PermissionScheme)
    private readonly schemeRepository: Repository<PermissionScheme>,
    @InjectRepository(PermissionGrant)
    private readonly grantRepository: Repository<PermissionGrant>,
    @InjectRepository(IssueSecurityScheme)
    private readonly securitySchemeRepository: Repository<IssueSecurityScheme>,
    @InjectRepository(IssueSecurityLevel)
    private readonly securityLevelRepository: Repository<IssueSecurityLevel>,
    @InjectRepository(IssueSecurityGrant)
    private readonly securityGrantRepository: Repository<IssueSecurityGrant>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Optional()
    private readonly permissionEvaluator?: PermissionEvaluatorService,
  ) {}

  // ================= GROUPS =================
  async getGroups(): Promise<Group[]> {
    return this.groupRepository.find({
      relations: {
        userGroups: {
          user: true,
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        isSystem: true,
        createdAt: true,
        updatedAt: true,
        userGroups: {
          id: true,
          userId: true,
          groupId: true,
          createdAt: true,
          user: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
            systemRole: true,
          },
        },
      },
      order: { name: 'ASC' },
    });
  }

  async createGroup(name: string, description?: string): Promise<Group> {
    const existing = await this.groupRepository.findOne({ where: { name } });
    if (existing) {
      throw new BadRequestException(`Group "${name}" already exists`);
    }
    const group = this.groupRepository.create({ name, description, isSystem: false });
    return this.groupRepository.save(group);
  }

  async addUserToGroup(groupId: number, userId: number): Promise<UserGroup> {
    const group = await this.groupRepository.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // If added to an administrative group, upgrade user's systemRole to ADMIN
    const isAdminGroup = ['administrators', 'admin', 'admins'].includes(
      group.name.toLowerCase().trim(),
    );
    if (isAdminGroup && user.systemRole !== SystemRole.ADMIN) {
      user.systemRole = SystemRole.ADMIN;
      await this.userRepository.save(user);
    }

    const existing = await this.userGroupRepository.findOne({ where: { groupId, userId } });
    if (existing) return existing;

    const userGroup = this.userGroupRepository.create({ groupId, userId });
    const saved = await this.userGroupRepository.save(userGroup);
    await this.permissionEvaluator?.invalidatePermissions(undefined, userId);
    return saved;
  }

  async removeUserFromGroup(groupId: number, userId: number): Promise<void> {
    const group = await this.groupRepository.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');

    const isAdminGroup = ['administrators', 'admin', 'admins'].includes(
      group.name.toLowerCase().trim(),
    );

    if (isAdminGroup) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      const rootAdminEmail = (process.env.INITIAL_ADMIN_EMAIL || 'admin@bugtracker.local').toLowerCase();
      const isRoot = user && (user.isRoot === true || user.email.toLowerCase() === rootAdminEmail);
      if (isRoot) {
        throw new ForbiddenException(
          'Root administrator accounts cannot be removed from the administrators group',
        );
      }

      if (user && user.systemRole === SystemRole.ADMIN) {
        user.systemRole = SystemRole.USER;
        await this.userRepository.save(user);
      }
    }

    await this.userGroupRepository.delete({ groupId, userId });
    await this.permissionEvaluator?.invalidatePermissions(undefined, userId);
  }

  async deleteGroup(id: number): Promise<void> {
    const group = await this.groupRepository.findOne({ where: { id } });
    if (!group) throw new NotFoundException('Group not found');

    const protectedGroups = ['administrators', 'admin', 'admins'];
    if (group.isSystem || protectedGroups.includes(group.name.toLowerCase().trim())) {
      throw new BadRequestException('System directory groups (administrators) cannot be deleted');
    }

    await this.userGroupRepository.delete({ groupId: id });
    await this.roleActorRepository.delete({ groupId: id });
    await this.grantRepository.delete({ groupId: id });
    await this.securityGrantRepository.delete({ groupId: id });
    await this.groupRepository.delete(id);
    await this.permissionEvaluator?.invalidatePermissions();
  }

  // ================= PROJECT ROLES =================
  async getProjectRoles(): Promise<ProjectRole[]> {
    return this.projectRoleRepository.find({ order: { id: 'ASC' } });
  }

  async createProjectRole(name: string, description?: string, isDefault = false): Promise<ProjectRole> {
    const existing = await this.projectRoleRepository.findOne({ where: { name } });
    if (existing) {
      throw new BadRequestException(`Role "${name}" already exists`);
    }
    const role = this.projectRoleRepository.create({ name, description, isDefault });
    return this.projectRoleRepository.save(role);
  }

  async updateProjectRole(
    id: number,
    payload: { name?: string; description?: string; isDefault?: boolean },
  ): Promise<ProjectRole> {
    const role = await this.projectRoleRepository.findOne({ where: { id } });
    if (!role) throw new NotFoundException('Project role not found');

    if (payload.name && payload.name.trim() !== role.name) {
      const existing = await this.projectRoleRepository.findOne({ where: { name: payload.name.trim() } });
      if (existing && existing.id !== id) {
        throw new BadRequestException(`Role "${payload.name}" already exists`);
      }
      role.name = payload.name.trim();
    }

    if (payload.description !== undefined) {
      role.description = payload.description;
    }

    if (payload.isDefault !== undefined) {
      role.isDefault = payload.isDefault;
    }

    return this.projectRoleRepository.save(role);
  }

  async deleteProjectRole(id: number): Promise<void> {
    const role = await this.projectRoleRepository.findOne({ where: { id } });
    if (!role) throw new NotFoundException('Project role not found');

    const protectedRoles = ['administrator', 'member', 'viewer'];
    if (protectedRoles.includes(role.name.toLowerCase().trim())) {
      throw new BadRequestException(
        `Baseline system role "${role.name}" cannot be deleted`,
      );
    }

    await this.roleActorRepository.delete({ roleId: id });
    await this.grantRepository.delete({ roleId: id });
    await this.securityGrantRepository.delete({ roleId: id });
    await this.projectRoleRepository.delete(id);
    await this.permissionEvaluator?.invalidatePermissions();
  }

  // ================= PROJECT ACTORS (PEOPLE PER PROJECT) =================
  async getProjectActors(projectId: number) {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const roles = await this.projectRoleRepository.find({ order: { id: 'ASC' } });
    const actors = await this.roleActorRepository.find({
      where: { projectId },
      relations: {
        user: true,
        group: true,
      },
    });

    return roles.map((role) => {
      const roleActors = actors.filter((a) => a.roleId === role.id);
      return {
        roleId: role.id,
        roleName: role.name,
        description: role.description,
        users: roleActors.filter((a) => a.actorType === ProjectActorType.USER && a.user).map((a) => ({
          actorId: a.id,
          user: a.user,
        })),
        groups: roleActors.filter((a) => a.actorType === ProjectActorType.GROUP && a.group).map((a) => ({
          actorId: a.id,
          group: a.group,
        })),
      };
    });
  }

  async addActorToProjectRole(
    projectId: number,
    roleId: number,
    payload: { actorType: ProjectActorType; userId?: number; groupId?: number },
  ): Promise<ProjectRoleActor> {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const role = await this.projectRoleRepository.findOne({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');

    const actor = this.roleActorRepository.create({
      projectId,
      roleId,
      actorType: payload.actorType,
      userId: payload.actorType === ProjectActorType.USER ? payload.userId : null,
      groupId: payload.actorType === ProjectActorType.GROUP ? payload.groupId : null,
    });

    const saved = await this.roleActorRepository.save(actor);
    await this.permissionEvaluator?.invalidatePermissions(projectId, payload.userId);
    return saved;
  }

  async removeActorFromProjectRole(actorId: number): Promise<void> {
    const actor = await this.roleActorRepository.findOne({ where: { id: actorId } });
    await this.roleActorRepository.delete(actorId);
    if (actor) {
      await this.permissionEvaluator?.invalidatePermissions(actor.projectId, actor.userId || undefined);
    }
  }

  // ================= PERMISSION SCHEMES =================
  async getPermissionSchemes(): Promise<PermissionScheme[]> {
    return this.schemeRepository.find({
      relations: {
        grants: {
          role: true,
          group: true,
        },
      },
      order: { id: 'ASC' },
    });
  }

  async getPermissionScheme(id: number): Promise<PermissionScheme> {
    const scheme = await this.schemeRepository.findOne({
      where: { id },
      relations: {
        grants: {
          role: true,
          group: true,
        },
      },
    });
    if (!scheme) throw new NotFoundException('Permission scheme not found');
    return scheme;
  }

  async createPermissionScheme(name: string, description?: string): Promise<PermissionScheme> {
    const scheme = this.schemeRepository.create({ name, description, isDefault: false });
    return this.schemeRepository.save(scheme);
  }

  async deletePermissionScheme(id: number): Promise<void> {
    const scheme = await this.schemeRepository.findOne({ where: { id } });
    if (!scheme) throw new NotFoundException('Permission scheme not found');

    if (scheme.isDefault) {
      throw new BadRequestException('The default permission scheme cannot be deleted');
    }

    const boundProjectsCount = await this.projectRepository.count({
      where: { permissionSchemeId: id },
    });
    if (boundProjectsCount > 0) {
      throw new BadRequestException(
        `Cannot delete permission scheme: assigned to ${boundProjectsCount} project(s). Reassign them first.`,
      );
    }

    await this.grantRepository.delete({ schemeId: id });
    await this.schemeRepository.delete(id);
    await this.permissionEvaluator?.invalidatePermissions();
  }

  async addPermissionGrant(
    schemeId: number,
    payload: {
      permission: ProjectPermission;
      grantType: PermissionGrantType;
      roleId?: number;
      groupId?: number;
    },
  ): Promise<PermissionGrant> {
    const scheme = await this.schemeRepository.findOne({ where: { id: schemeId } });
    if (!scheme) throw new NotFoundException('Permission scheme not found');

    const grant = this.grantRepository.create({
      schemeId,
      permission: payload.permission,
      grantType: payload.grantType,
      roleId: payload.grantType === PermissionGrantType.ROLE ? payload.roleId : null,
      groupId: payload.grantType === PermissionGrantType.GROUP ? payload.groupId : null,
    });

    const saved = await this.grantRepository.save(grant);
    await this.permissionEvaluator?.invalidatePermissions();
    return saved;
  }

  async removePermissionGrant(grantId: number): Promise<void> {
    await this.grantRepository.delete(grantId);
    await this.permissionEvaluator?.invalidatePermissions();
  }

  async assignPermissionSchemeToProject(projectId: number, schemeId: number): Promise<Project> {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const scheme = await this.schemeRepository.findOne({ where: { id: schemeId } });
    if (!scheme) throw new NotFoundException('Permission scheme not found');

    project.permissionSchemeId = scheme.id;
    const saved = await this.projectRepository.save(project);
    await this.permissionEvaluator?.invalidatePermissions(projectId);
    return saved;
  }

  // ================= ISSUE SECURITY SCHEMES =================
  async getSecuritySchemes(): Promise<IssueSecurityScheme[]> {
    return this.securitySchemeRepository.find({
      relations: {
        levels: {
          grants: {
            role: true,
            group: true,
          },
        },
      },
      order: { id: 'ASC' },
    });
  }

  async createSecurityScheme(name: string, description?: string): Promise<IssueSecurityScheme> {
    const existing = await this.securitySchemeRepository.findOne({ where: { name } });
    if (existing) {
      throw new BadRequestException(`Security scheme "${name}" already exists`);
    }

    const scheme = this.securitySchemeRepository.create({
      name,
      description,
    });
    const saved = await this.securitySchemeRepository.save(scheme);

    const defaultLevel = this.securityLevelRepository.create({
      schemeId: saved.id,
      name: 'Default',
      description: 'Default issue security level',
    });
    const savedLevel = await this.securityLevelRepository.save(defaultLevel);

    saved.defaultLevelId = savedLevel.id;
    await this.securitySchemeRepository.save(saved);

    const result = await this.securitySchemeRepository.findOne({
      where: { id: saved.id },
      relations: {
        levels: {
          grants: {
            role: true,
            group: true,
          },
        },
      },
    });
    if (!result) throw new NotFoundException('Created security scheme not found');
    return result;
  }

  async deleteSecurityScheme(id: number): Promise<void> {
    const scheme = await this.securitySchemeRepository.findOne({ where: { id } });
    if (!scheme) throw new NotFoundException('Issue security scheme not found');

    if (scheme.name === 'Default Issue Security Scheme' || scheme.id === 1) {
      throw new BadRequestException('The default issue security scheme cannot be deleted');
    }

    const boundProjectsCount = await this.projectRepository.count({
      where: { securitySchemeId: id },
    });
    if (boundProjectsCount > 0) {
      throw new BadRequestException(
        `Cannot delete issue security scheme: assigned to ${boundProjectsCount} project(s). Reassign them first.`,
      );
    }

    const levels = await this.securityLevelRepository.find({ where: { schemeId: id } });
    for (const lvl of levels) {
      await this.securityGrantRepository.delete({ securityLevelId: lvl.id });
    }
    await this.securityLevelRepository.delete({ schemeId: id });
    await this.securitySchemeRepository.delete(id);
  }

  async addSecurityLevel(
    schemeId: number,
    payload: { name: string; description?: string },
  ): Promise<IssueSecurityLevel> {
    const scheme = await this.securitySchemeRepository.findOne({ where: { id: schemeId } });
    if (!scheme) throw new NotFoundException('Issue security scheme not found');

    const trimmedName = payload.name.trim();
    const existing = await this.securityLevelRepository.findOne({
      where: { schemeId, name: trimmedName },
    });
    if (existing) {
      throw new BadRequestException(`Security level "${trimmedName}" already exists in this scheme`);
    }

    const level = this.securityLevelRepository.create({
      schemeId,
      name: trimmedName,
      description: payload.description?.trim() || null,
    });
    return this.securityLevelRepository.save(level);
  }

  async deleteSecurityLevel(schemeId: number, levelId: number): Promise<void> {
    const scheme = await this.securitySchemeRepository.findOne({ where: { id: schemeId } });
    if (!scheme) throw new NotFoundException('Issue security scheme not found');

    const level = await this.securityLevelRepository.findOne({
      where: { id: levelId, schemeId },
    });
    if (!level) throw new NotFoundException('Security level not found in this scheme');

    if (scheme.defaultLevelId === levelId) {
      throw new BadRequestException('Cannot delete the default security level. Please designate another default level first.');
    }

    await this.securityGrantRepository.delete({ securityLevelId: levelId });
    await this.securityLevelRepository.delete(levelId);
  }

  async setDefaultSecurityLevel(schemeId: number, defaultLevelId: number | null): Promise<IssueSecurityScheme> {
    const scheme = await this.securitySchemeRepository.findOne({ where: { id: schemeId } });
    if (!scheme) throw new NotFoundException('Issue security scheme not found');

    if (defaultLevelId !== null) {
      const level = await this.securityLevelRepository.findOne({
        where: { id: defaultLevelId, schemeId },
      });
      if (!level) throw new NotFoundException('Designated security level does not belong to this scheme');
    }

    scheme.defaultLevelId = defaultLevelId;
    await this.securitySchemeRepository.save(scheme);

    const updated = await this.securitySchemeRepository.findOne({
      where: { id: schemeId },
      relations: {
        levels: {
          grants: {
            role: true,
            group: true,
          },
        },
      },
    });
    if (!updated) throw new NotFoundException('Issue security scheme not found');
    return updated;
  }

  async addSecurityGrant(
    schemeId: number,
    levelId: number,
    payload: {
      grantType: PermissionGrantType;
      roleId?: number;
      groupId?: number;
    },
  ): Promise<IssueSecurityGrant> {
    const level = await this.securityLevelRepository.findOne({
      where: { id: levelId, schemeId },
    });
    if (!level) throw new NotFoundException('Security level not found in this scheme');

    const roleId = payload.grantType === PermissionGrantType.ROLE ? (payload.roleId ?? null) : null;
    const groupId = payload.grantType === PermissionGrantType.GROUP ? (payload.groupId ?? null) : null;

    if (payload.grantType === PermissionGrantType.ROLE && !roleId) {
      throw new BadRequestException('Role ID is required for ROLE grant type');
    }
    if (payload.grantType === PermissionGrantType.GROUP && !groupId) {
      throw new BadRequestException('Group ID is required for GROUP grant type');
    }

    const existing = await this.securityGrantRepository.findOne({
      where: {
        securityLevelId: levelId,
        grantType: payload.grantType,
        roleId: roleId === null ? IsNull() : roleId,
        groupId: groupId === null ? IsNull() : groupId,
      },
    });
    if (existing) {
      throw new BadRequestException('This grant already exists for this security level');
    }

    const grant = this.securityGrantRepository.create({
      securityLevelId: levelId,
      grantType: payload.grantType,
      roleId,
      groupId,
    });
    const saved = await this.securityGrantRepository.save(grant);
    const loaded = await this.securityGrantRepository.findOne({
      where: { id: saved.id },
      relations: { role: true, group: true },
    });
    return loaded || saved;
  }

  async deleteSecurityGrant(grantId: number): Promise<void> {
    const grant = await this.securityGrantRepository.findOne({ where: { id: grantId } });
    if (!grant) throw new NotFoundException('Security grant not found');
    await this.securityGrantRepository.delete(grantId);
  }
}
