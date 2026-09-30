import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as argon2 from 'argon2';
import { ARGON2_OPTIONS } from '../auth/constants/argon2.constants.js';
import { User, SystemRole } from '../users/entities/user.entity.js';
import { Group } from '../rbac/entities/group.entity.js';
import { UserGroup } from '../rbac/entities/user-group.entity.js';
import { ProjectRole } from '../rbac/entities/project-role.entity.js';
import { PermissionScheme } from '../rbac/entities/permission-scheme.entity.js';
import {
  PermissionGrant,
  ProjectPermission,
  PermissionGrantType,
} from '../rbac/entities/permission-grant.entity.js';
import { IssueSecurityScheme } from '../rbac/entities/issue-security-scheme.entity.js';
import { IssueSecurityLevel } from '../rbac/entities/issue-security-level.entity.js';
import { IssueSecurityGrant } from '../rbac/entities/issue-security-grant.entity.js';

export interface SystemInitResult {
  adminEmail: string;
  adminCreated: boolean;
  groupsCount: number;
  rolesCount: number;
  permissionSchemeId: number;
  securitySchemeId: number;
}

@Injectable()
export class SystemInitService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SystemInitService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(UserGroup)
    private readonly userGroupRepository: Repository<UserGroup>,
    @InjectRepository(ProjectRole)
    private readonly projectRoleRepository: Repository<ProjectRole>,
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
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Automatically executes on application startup to ensure foundational RBAC and initial administrator exist.
   */
  async onApplicationBootstrap(): Promise<void> {
    try {
      this.logger.log('Verifying baseline system initialization on startup...');
      await this.initializeSystem();
    } catch (err) {
      this.logger.error('Automatic baseline system initialization encountered an error:', err);
    }
  }

  /**
   * Initializes foundational system infrastructure:
   * 1. System groups (administrators, all-users)
   * 2. Project roles (Administrators, Developers, Project Lead, Reporters, Viewers)
   * 3. Default permission scheme and permission grants
   * 4. Default issue security scheme
   * 5. Initial system administrator account
   *
   * Idempotent: safe to run multiple times without duplicating or overwriting data.
   */
  async initializeSystem(options?: {
    adminEmail?: string;
    adminPassword?: string;
    adminName?: string;
  }): Promise<SystemInitResult> {
    this.logger.log('Starting system initialization...');

    // 1. Initialize System Groups
    const groupsMap = await this.ensureSystemGroups();

    // 2. Initialize Project Roles
    const rolesMap = await this.ensureProjectRoles();

    // 3. Initialize Default Permission Scheme
    const permissionScheme = await this.ensureDefaultPermissionScheme(rolesMap, groupsMap);

    // 4. Initialize Default Issue Security Scheme
    const securityScheme = await this.ensureDefaultSecurityScheme(rolesMap);

    // 5. Initialize Initial Administrator Account
    const { adminUser, created } = await this.ensureAdminUser(options, groupsMap);

    // 6. Reconcile Admin Users into 'administrators' Group and Active Users into 'all-users' Group
    await this.reconcileUserSystemGroups(groupsMap);

    // 7. Ensure High-Performance Database Indexes (GIN Full-Text Vector)
    await this.ensureDatabaseIndexes();

    this.logger.log('System initialization finished successfully.');

    return {
      adminEmail: adminUser.email,
      adminCreated: created,
      groupsCount: Object.keys(groupsMap).length,
      rolesCount: Object.keys(rolesMap).length,
      permissionSchemeId: permissionScheme.id,
      securitySchemeId: securityScheme.id,
    };
  }

  private async ensureDatabaseIndexes(): Promise<void> {
    try {
      await this.dataSource.query(`
        CREATE INDEX IF NOT EXISTS idx_issues_search_vector
        ON issues USING gin (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));
      `);
      await this.dataSource.query(`
        CREATE INDEX IF NOT EXISTS idx_worklogs_date_logged ON worklogs (date_logged);
        CREATE INDEX IF NOT EXISTS idx_worklogs_user_date ON worklogs (user_id, date_logged);
        CREATE INDEX IF NOT EXISTS idx_worklogs_issue_date ON worklogs (issue_id, date_logged);
        CREATE INDEX IF NOT EXISTS idx_worklogs_created_at ON worklogs (created_at);
      `);
      this.logger.log('Verified PostgreSQL GIN search vector and worklog indexes.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Could not ensure database indexes: ${msg}`);
    }
  }

  private async ensureSystemGroups(): Promise<Record<string, Group>> {
    const defaultGroups = [
      {
        name: 'administrators',
        description: 'System administrators with global access to all spaces and configuration',
        isSystem: true,
      },
      {
        name: 'all-users',
        description: 'Default group containing all active team members and engineers',
        isSystem: true,
      },
    ];

    const result: Record<string, Group> = {};

    for (const raw of defaultGroups) {
      let group = await this.groupRepository.findOne({ where: { name: raw.name } });
      if (!group) {
        group = this.groupRepository.create(raw);
        group = await this.groupRepository.save(group);
        this.logger.log(`Created system group: ${group.name}`);
      }
      result[group.name] = group;
    }

    return result;
  }

  private async ensureProjectRoles(): Promise<Record<string, ProjectRole>> {
    const defaultRoles = [
      {
        name: 'Administrators',
        description: 'Full administrative control over individual project settings, components, and versions',
      },
      {
        name: 'Project Lead',
        description: 'Sprint planning, backlog management, roadmap governance, and ticket assignments',
      },
      {
        name: 'Developers',
        description: 'Full access to create, edit, transition, log work, and resolve engineering tickets',
      },
      {
        name: 'Reporters',
        description: 'Access to log bug reports, submit feedback, and add issue comments',
      },
      {
        name: 'Viewers',
        description: 'Read-only visibility for cross-team observers and stakeholders',
      },
    ];

    const result: Record<string, ProjectRole> = {};

    for (const raw of defaultRoles) {
      let role = await this.projectRoleRepository.findOne({ where: { name: raw.name } });
      if (!role) {
        role = this.projectRoleRepository.create(raw);
        role = await this.projectRoleRepository.save(role);
        this.logger.log(`Created project role: ${role.name}`);
      }
      result[role.name] = role;
    }

    return result;
  }

  private async ensureDefaultPermissionScheme(
    roles: Record<string, ProjectRole>,
    groups: Record<string, Group>,
  ): Promise<PermissionScheme> {
    const schemeName = 'Default Software Scheme';
    let scheme = await this.schemeRepository.findOne({ where: { isDefault: true } });
    if (!scheme) {
      scheme = await this.schemeRepository.findOne({ where: { name: schemeName } });
    }

    if (!scheme) {
      scheme = this.schemeRepository.create({
        name: schemeName,
        description: 'Standard agile software development permission matrix for engineering spaces',
        isDefault: true,
      });
      scheme = await this.schemeRepository.save(scheme);
      this.logger.log(`Created default permission scheme: ${scheme.name}`);

      const grantsToCreate: Partial<PermissionGrant>[] = [];

      // Project Administration
      grantsToCreate.push(
        { schemeId: scheme.id, permission: ProjectPermission.ADMINISTER_PROJECTS, grantType: PermissionGrantType.ROLE, roleId: roles['Administrators']?.id },
        { schemeId: scheme.id, permission: ProjectPermission.ADMINISTER_PROJECTS, grantType: PermissionGrantType.ROLE, roleId: roles['Project Lead']?.id },
        { schemeId: scheme.id, permission: ProjectPermission.VIEW_ROADMAP, grantType: PermissionGrantType.GROUP, groupId: groups['all-users']?.id },
      );

      // Issue Lifecycle Permissions
      const standardIssuePermissions = [
        ProjectPermission.BROWSE_PROJECTS,
        ProjectPermission.CREATE_ISSUES,
        ProjectPermission.ADD_COMMENTS,
        ProjectPermission.CREATE_ATTACHMENTS,
      ];
      for (const perm of standardIssuePermissions) {
        grantsToCreate.push({
          schemeId: scheme.id,
          permission: perm,
          grantType: PermissionGrantType.GROUP,
          groupId: groups['all-users']?.id,
        });
      }

      // Developer & Lead mutating permissions
      const devPermissions = [
        ProjectPermission.EDIT_ISSUES,
        ProjectPermission.ASSIGN_ISSUES,
        ProjectPermission.ASSIGNABLE_USER,
        ProjectPermission.TRANSITION_ISSUES,
        ProjectPermission.MOVE_ISSUES,
        ProjectPermission.LOG_WORK,
        ProjectPermission.EDIT_OWN_WORKLOGS,
        ProjectPermission.DELETE_OWN_WORKLOGS,
        ProjectPermission.EDIT_OWN_COMMENTS,
        ProjectPermission.DELETE_OWN_COMMENTS,
        ProjectPermission.DELETE_OWN_ATTACHMENTS,
      ];
      for (const perm of devPermissions) {
        grantsToCreate.push(
          { schemeId: scheme.id, permission: perm, grantType: PermissionGrantType.ROLE, roleId: roles['Developers']?.id },
          { schemeId: scheme.id, permission: perm, grantType: PermissionGrantType.ROLE, roleId: roles['Administrators']?.id },
          { schemeId: scheme.id, permission: perm, grantType: PermissionGrantType.ROLE, roleId: roles['Project Lead']?.id },
        );
      }

      // Close Issues permission
      grantsToCreate.push(
        { schemeId: scheme.id, permission: ProjectPermission.CLOSE_ISSUES, grantType: PermissionGrantType.ROLE, roleId: roles['Administrators']?.id },
        { schemeId: scheme.id, permission: ProjectPermission.CLOSE_ISSUES, grantType: PermissionGrantType.ROLE, roleId: roles['Project Lead']?.id },
      );

      for (const grantData of grantsToCreate) {
        const grant = this.grantRepository.create(grantData);
        await this.grantRepository.save(grant);
      }

      this.logger.log(`Created ${grantsToCreate.length} permission grants for ${schemeName}`);
    } else if (!scheme.isDefault) {
      scheme.isDefault = true;
      scheme = await this.schemeRepository.save(scheme);
      this.logger.log(`Marked permission scheme as default: ${scheme.name}`);
    }

    return scheme;
  }

  private async ensureDefaultSecurityScheme(
    roles: Record<string, ProjectRole>,
  ): Promise<IssueSecurityScheme> {
    const schemeName = 'Default Issue Security Scheme';
    let scheme = await this.securitySchemeRepository.findOne({ where: { name: schemeName } });

    if (!scheme) {
      scheme = this.securitySchemeRepository.create({
        name: schemeName,
        description: 'Baseline security classification controlling issue visibility tiers',
      });
      scheme = await this.securitySchemeRepository.save(scheme);
      this.logger.log(`Created issue security scheme: ${scheme.name}`);

      // Level 1: Public (Standard visibility)
      const publicLevel = await this.securityLevelRepository.save(
        this.securityLevelRepository.create({
          schemeId: scheme.id,
          name: 'Public',
          description: 'Standard issue visible to all project members and stakeholders',
        }),
      );

      // Level 2: Confidential (Restricted to Leads and Admins)
      const confidentialLevel = await this.securityLevelRepository.save(
        this.securityLevelRepository.create({
          schemeId: scheme.id,
          name: 'Confidential',
          description: 'Restricted issue visible only to Project Leads and System Administrators',
        }),
      );

      // Set default level
      scheme.defaultLevelId = publicLevel.id;
      await this.securitySchemeRepository.save(scheme);

      // Grants for confidential level
      await this.securityGrantRepository.save([
        this.securityGrantRepository.create({
          securityLevelId: confidentialLevel.id,
          grantType: PermissionGrantType.ROLE,
          roleId: roles['Administrators']?.id,
        }),
        this.securityGrantRepository.create({
          securityLevelId: confidentialLevel.id,
          grantType: PermissionGrantType.ROLE,
          roleId: roles['Project Lead']?.id,
        }),
      ]);

      this.logger.log(`Configured default security levels for ${schemeName}`);
    }

    return scheme;
  }

  private async ensureAdminUser(
    options: { adminEmail?: string; adminPassword?: string; adminName?: string } | undefined,
    groups: Record<string, Group>,
  ): Promise<{ adminUser: User; created: boolean }> {
    const email = options?.adminEmail || process.env.INITIAL_ADMIN_EMAIL || 'admin@bugtracker.local';
    const fullName = options?.adminName || process.env.INITIAL_ADMIN_NAME || 'System Administrator';
    const rawPassword = options?.adminPassword || process.env.INITIAL_ADMIN_PASSWORD || 'AdminPassword123!';

    let admin = await this.userRepository.findOne({ where: { email } });

    if (admin) {
      let updated = false;
      if (admin.systemRole !== SystemRole.ADMIN) {
        admin.systemRole = SystemRole.ADMIN;
        updated = true;
      }
      if (!admin.isActivated) {
        admin.isActivated = true;
        updated = true;
      }

      // If configured password does not match current hash, synchronize it
      const matches = admin.passwordHash
        ? await argon2.verify(admin.passwordHash, rawPassword).catch(() => false)
        : false;
      if (!matches && (options?.adminPassword || process.env.INITIAL_ADMIN_PASSWORD)) {
        admin.passwordHash = await argon2.hash(rawPassword, ARGON2_OPTIONS);
        updated = true;
        this.logger.log(`Synchronized administrator password with configured INITIAL_ADMIN_PASSWORD`);
      }

      if (updated) {
        await this.userRepository.save(admin);
        this.logger.log(`Verified and ensured SystemRole.ADMIN for administrator: ${admin.email}`);
      } else {
        this.logger.log(`Administrator account already exists: ${admin.email}`);
      }

      // Ensure admin belongs to administrators group
      if (groups['administrators']) {
        const existingMembership = await this.userGroupRepository.findOne({
          where: { userId: admin.id, groupId: groups['administrators'].id },
        });
        if (!existingMembership) {
          await this.userGroupRepository.save(
            this.userGroupRepository.create({
              userId: admin.id,
              groupId: groups['administrators'].id,
            }),
          );
        }
      }

      if (!admin.isRoot) {
        admin.isRoot = true;
        await this.userRepository.save(admin);
      }

      return { adminUser: admin, created: false };
    }

    // Check if any other user already holds SystemRole.ADMIN (if custom email not provided)
    if (!options?.adminEmail) {
      const anyAdmin = await this.userRepository.findOne({ where: { systemRole: SystemRole.ADMIN } });
      if (anyAdmin) {
        this.logger.log(`Existing system administrator active: ${anyAdmin.email}`);
        if (!anyAdmin.isRoot) {
          anyAdmin.isRoot = true;
          await this.userRepository.save(anyAdmin);
        }
        return { adminUser: anyAdmin, created: false };
      }
    }

    const passwordHash = await argon2.hash(rawPassword, ARGON2_OPTIONS);

    admin = this.userRepository.create({
      fullName,
      email,
      passwordHash,
      systemRole: SystemRole.ADMIN,
      isRoot: true,
      isActivated: true,
      jobTitle: 'Principal System Administrator',
      twoFactorEnabled: false,
    });

    admin = await this.userRepository.save(admin);
    this.logger.log(`Created initial administrator account: ${admin.email}`);

    // Assign to system groups
    if (groups['administrators']) {
      await this.userGroupRepository.save(
        this.userGroupRepository.create({
          userId: admin.id,
          groupId: groups['administrators'].id,
        }),
      );
    }

    if (groups['all-users']) {
      await this.userGroupRepository.save(
        this.userGroupRepository.create({
          userId: admin.id,
          groupId: groups['all-users'].id,
        }),
      );
    }

    return { adminUser: admin, created: true };
  }

  /**
   * Reconciles existing system administrators and active users with baseline directory groups.
   */
  private async reconcileUserSystemGroups(groups: Record<string, Group>): Promise<void> {
    const adminGroup = groups['administrators'];
    const allUsersGroup = groups['all-users'];

    if (adminGroup) {
      const adminUsers = await this.userRepository.find({
        where: { systemRole: SystemRole.ADMIN },
      });
      for (const admin of adminUsers) {
        const existing = await this.userGroupRepository.findOne({
          where: { userId: admin.id, groupId: adminGroup.id },
        });
        if (!existing) {
          await this.userGroupRepository.save(
            this.userGroupRepository.create({
              userId: admin.id,
              groupId: adminGroup.id,
            }),
          );
          this.logger.log(`Reconciled administrator group membership for: ${admin.email}`);
        }
      }
    }

    if (allUsersGroup) {
      const activatedUsers = await this.userRepository.find({
        where: { isActivated: true },
      });
      for (const u of activatedUsers) {
        const existing = await this.userGroupRepository.findOne({
          where: { userId: u.id, groupId: allUsersGroup.id },
        });
        if (!existing) {
          await this.userGroupRepository.save(
            this.userGroupRepository.create({
              userId: u.id,
              groupId: allUsersGroup.id,
            }),
          );
        }
      }
    }
  }
}
