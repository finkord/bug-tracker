import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
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
  ) {}

  // ================= GROUPS =================
  async getGroups(): Promise<Group[]> {
    return this.groupRepository.find({
      relations: {
        userGroups: {
          user: true,
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
    const isAdminGroup = ['administrators', 'admin', 'admins', 'jira-administrators'].includes(
      group.name.toLowerCase().trim(),
    );
    if (isAdminGroup && user.systemRole !== SystemRole.ADMIN) {
      user.systemRole = SystemRole.ADMIN;
      await this.userRepository.save(user);
    }

    const existing = await this.userGroupRepository.findOne({ where: { groupId, userId } });
    if (existing) return existing;

    const userGroup = this.userGroupRepository.create({ groupId, userId });
    return this.userGroupRepository.save(userGroup);
  }

  async removeUserFromGroup(groupId: number, userId: number): Promise<void> {
    const group = await this.groupRepository.findOne({ where: { id: groupId } });
    await this.userGroupRepository.delete({ groupId, userId });

    if (group) {
      const isAdminGroup = ['administrators', 'admin', 'admins', 'jira-administrators'].includes(
        group.name.toLowerCase().trim(),
      );
      if (isAdminGroup) {
        // Check if user belongs to any other admin groups
        const remainingAdminGroups = await this.userGroupRepository.createQueryBuilder('ug')
          .innerJoin('ug.group', 'g')
          .where('ug.userId = :userId', { userId })
          .andWhere('LOWER(g.name) IN (:...names)', { names: ['administrators', 'admin', 'admins'] })
          .getCount();

        if (remainingAdminGroups === 0) {
          const user = await this.userRepository.findOne({ where: { id: userId } });
          if (user && user.systemRole === SystemRole.ADMIN) {
            user.systemRole = SystemRole.USER;
            await this.userRepository.save(user);
          }
        }
      }
    }
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

    return this.roleActorRepository.save(actor);
  }

  async removeActorFromProjectRole(actorId: number): Promise<void> {
    await this.roleActorRepository.delete(actorId);
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

    return this.grantRepository.save(grant);
  }

  async removePermissionGrant(grantId: number): Promise<void> {
    await this.grantRepository.delete(grantId);
  }

  async assignPermissionSchemeToProject(projectId: number, schemeId: number): Promise<Project> {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const scheme = await this.schemeRepository.findOne({ where: { id: schemeId } });
    if (!scheme) throw new NotFoundException('Permission scheme not found');

    project.permissionSchemeId = scheme.id;
    return this.projectRepository.save(project);
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
}
