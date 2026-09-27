import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as argon2 from 'argon2';
import { User, SystemRole, OAuthProvider } from '../users/entities/user.entity.js';
import { Project } from '../projects/entities/project.entity.js';
import { Issue, IssueType, IssueStatus, IssuePriority, IssueSeverity } from '../issues/entities/issue.entity.js';
import { IssueLink, IssueLinkType } from '../issues/entities/issue-link.entity.js';
import { Worklog } from '../issues/entities/worklog.entity.js';
import { Comment } from '../issues/entities/comment.entity.js';
import { Group } from '../rbac/entities/group.entity.js';
import { UserGroup } from '../rbac/entities/user-group.entity.js';
import { ProjectRole } from '../rbac/entities/project-role.entity.js';
import { ProjectRoleActor, ProjectActorType } from '../rbac/entities/project-role-actor.entity.js';
import { PermissionScheme } from '../rbac/entities/permission-scheme.entity.js';
import {
  PermissionGrant,
  ProjectPermission,
  PermissionGrantType,
} from '../rbac/entities/permission-grant.entity.js';
import { IssueSecurityScheme } from '../rbac/entities/issue-security-scheme.entity.js';
import { IssueSecurityLevel } from '../rbac/entities/issue-security-level.entity.js';
import { IssueSecurityGrant } from '../rbac/entities/issue-security-grant.entity.js';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Issue)
    private readonly issueRepository: Repository<Issue>,
    @InjectRepository(IssueLink)
    private readonly issueLinkRepository: Repository<IssueLink>,
    @InjectRepository(Worklog)
    private readonly worklogRepository: Repository<Worklog>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
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
  ) {}

  /**
   * Cleans existing records and seeds realistic multi-team engineering dataset.
   */
  async runSeed(options: { clean?: boolean } = { clean: true }): Promise<{
    projectsCount: number;
    usersCount: number;
    issuesCount: number;
    linksCount: number;
    worklogsCount: number;
    commentsCount: number;
    groupsCount: number;
    rolesCount: number;
    schemesCount: number;
  }> {
    this.logger.log('Starting realistic fake data generation & RBAC seeding...');

    if (options.clean) {
      this.logger.log('Cleaning existing database records...');
      await this.cleanDatabase();
    }

    // 1. Password hashing for all seed accounts
    const defaultPasswordHash = await argon2.hash('Password123!', {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    // 2. Create Users across 5 engineering domains
    const usersMap = await this.seedUsers(defaultPasswordHash);
    this.logger.log(`Seeded ${Object.keys(usersMap).length} engineers and leads.`);

    // 3. Create 5 Projects / Teams
    const projectsMap = await this.seedProjects(usersMap);
    this.logger.log(`Seeded ${Object.keys(projectsMap).length} projects / teams.`);

    // 4. Create RBAC Foundation (Groups, Roles, Schemes, Grants, Security Levels, Project Actors)
    const rbacStats = await this.seedRbacStructure(usersMap, projectsMap);
    this.logger.log(`Seeded RBAC: ${rbacStats.groupsCount} groups, ${rbacStats.rolesCount} roles, ${rbacStats.schemesCount} schemes, ${rbacStats.grantsCount} grants.`);

    // 5. Create Issues / Tickets
    const issuesMap = await this.seedIssues(projectsMap, usersMap);
    this.logger.log(`Seeded ${Object.keys(issuesMap).length} realistic tickets.`);

    // 6. Create Cross-Team Issue Dependencies
    const linksCount = await this.seedIssueLinks(issuesMap);
    this.logger.log(`Seeded ${linksCount} cross-project issue dependencies.`);

    // 7. Create Worklogs & Timesheet Distribution
    const worklogsCount = await this.seedWorklogs(issuesMap, usersMap);
    this.logger.log(`Seeded ${worklogsCount} worklogs across current and previous weeks.`);

    // 8. Create Issue Comments & PR discussions
    const commentsCount = await this.seedComments(issuesMap, usersMap);
    this.logger.log(`Seeded ${commentsCount} issue comments.`);

    return {
      projectsCount: Object.keys(projectsMap).length,
      usersCount: Object.keys(usersMap).length,
      issuesCount: Object.keys(issuesMap).length,
      linksCount,
      worklogsCount,
      commentsCount,
      groupsCount: rbacStats.groupsCount,
      rolesCount: rbacStats.rolesCount,
      schemesCount: rbacStats.schemesCount,
    };
  }

  private async cleanDatabase() {
    // Delete in dependency order
    await this.securityGrantRepository.createQueryBuilder().delete().from(IssueSecurityGrant).execute();
    await this.securityLevelRepository.createQueryBuilder().delete().from(IssueSecurityLevel).execute();
    await this.securitySchemeRepository.createQueryBuilder().delete().from(IssueSecurityScheme).execute();
    await this.grantRepository.createQueryBuilder().delete().from(PermissionGrant).execute();
    await this.roleActorRepository.createQueryBuilder().delete().from(ProjectRoleActor).execute();
    await this.userGroupRepository.createQueryBuilder().delete().from(UserGroup).execute();
    await this.groupRepository.createQueryBuilder().delete().from(Group).execute();
    await this.projectRoleRepository.createQueryBuilder().delete().from(ProjectRole).execute();
    await this.schemeRepository.createQueryBuilder().delete().from(PermissionScheme).execute();
    await this.issueLinkRepository.createQueryBuilder().delete().from(IssueLink).execute();
    await this.worklogRepository.createQueryBuilder().delete().from(Worklog).execute();
    await this.commentRepository.createQueryBuilder().delete().from(Comment).execute();
    await this.issueRepository.createQueryBuilder().delete().from(Issue).execute();
    await this.projectRepository.createQueryBuilder().delete().from(Project).execute();
    await this.userRepository.createQueryBuilder().delete().from(User).execute();
  }

  private async seedUsers(passwordHash: string): Promise<Record<string, User>> {
    const rawUsers: Array<{
      key: string;
      fullName: string;
      email: string;
      systemRole: SystemRole;
      jobTitle: string;
      avatarUrl?: string;
    }> = [
      // UI / Frontend Team
      { key: 'volodymyr', fullName: 'Volodymyr Fufalko', email: 'volodymyr@bugtracker.local', systemRole: SystemRole.ADMIN, jobTitle: 'Principal Frontend Architect' },
      { key: 'sonya', fullName: 'Sonya Saparava', email: 'sonya@bugtracker.local', systemRole: SystemRole.DEVELOPER, jobTitle: 'Senior UI/UX Engineer' },
      { key: 'olena', fullName: 'Olena Melnyk', email: 'olena@bugtracker.local', systemRole: SystemRole.DEVELOPER, jobTitle: 'Design Systems Developer' },
      { key: 'daniel', fullName: 'Daniel Kim', email: 'daniel.kim@bugtracker.local', systemRole: SystemRole.DEVELOPER, jobTitle: 'Frontend Engineer' },
      { key: 'sophia', fullName: 'Sophia Martinez', email: 'sophia.m@bugtracker.local', systemRole: SystemRole.QA_ENGINEER, jobTitle: 'Lead QA Automation Engineer' },
      { key: 'lucas', fullName: 'Lucas Weber', email: 'lucas.w@bugtracker.local', systemRole: SystemRole.DEVELOPER, jobTitle: 'Accessibility & CSS Specialist' },

      // CORE / Platform Team
      { key: 'alex', fullName: 'Alex Mercer', email: 'alex.mercer@bugtracker.local', systemRole: SystemRole.PROJECT_MANAGER, jobTitle: 'Core Platform Engineering Lead' },
      { key: 'marcus', fullName: 'Marcus Vance', email: 'marcus.v@bugtracker.local', systemRole: SystemRole.DEVELOPER, jobTitle: 'Senior Backend Engineer (Postgres/ORM)' },
      { key: 'taras', fullName: 'Taras Shevchenko', email: 'taras.sh@bugtracker.local', systemRole: SystemRole.DEVELOPER, jobTitle: 'Distributed Systems Engineer' },
      { key: 'rachel', fullName: 'Rachel Green', email: 'rachel.g@bugtracker.local', systemRole: SystemRole.DEVELOPER, jobTitle: 'Backend Security & Auth Engineer' },
      { key: 'dmitry', fullName: 'Dmitry Volkov', email: 'dmitry.v@bugtracker.local', systemRole: SystemRole.DEVELOPER, jobTitle: 'API Gateway & GraphQL Specialist' },
      { key: 'liam', fullName: 'Liam O\'Connor', email: 'liam.oc@bugtracker.local', systemRole: SystemRole.QA_ENGINEER, jobTitle: 'Backend QA & Performance Tester' },

      // MONOPS / Observability Team
      { key: 'sarah', fullName: 'Sarah Chen', email: 'sarah.chen@bugtracker.local', systemRole: SystemRole.DEVOPS_ENGINEER, jobTitle: 'Lead SRE & Observability Architect' },
      { key: 'ethan', fullName: 'Ethan Davis', email: 'ethan.davis@bugtracker.local', systemRole: SystemRole.DEVOPS_ENGINEER, jobTitle: 'Prometheus & Alertmanager Specialist' },
      { key: 'yuliia', fullName: 'Yuliia Kovalenko', email: 'yuliia.k@bugtracker.local', systemRole: SystemRole.DEVOPS_ENGINEER, jobTitle: 'Grafana & Telemetry Dashboard Engineer' },
      { key: 'kevin', fullName: 'Kevin Zhang', email: 'kevin.zhang@bugtracker.local', systemRole: SystemRole.DEVELOPER, jobTitle: 'OpenTelemetry Trace Instrumentation Dev' },
      { key: 'maya', fullName: 'Maya Patel', email: 'maya.patel@bugtracker.local', systemRole: SystemRole.QA_ENGINEER, jobTitle: 'Chaos Engineering & Reliability QA' },
      { key: 'noah', fullName: 'Noah Garcia', email: 'noah.g@bugtracker.local', systemRole: SystemRole.DEVOPS_ENGINEER, jobTitle: 'Logs & Elasticsearch Engineer' },

      // INFRAOPS / Cloud Platform Team
      { key: 'david', fullName: 'David Miller', email: 'david.miller@bugtracker.local', systemRole: SystemRole.DEVOPS_ENGINEER, jobTitle: 'Principal Cloud Platform Architect' },
      { key: 'brandon', fullName: 'Brandon Lee', email: 'brandon.lee@bugtracker.local', systemRole: SystemRole.DEVOPS_ENGINEER, jobTitle: 'Kubernetes Cluster Administrator' },
      { key: 'andrii', fullName: 'Andrii Boyko', email: 'andrii.b@bugtracker.local', systemRole: SystemRole.DEVOPS_ENGINEER, jobTitle: 'Terraform & Infrastructure-as-Code Dev' },
      { key: 'chloe', fullName: 'Chloe Dubois', email: 'chloe.dubois@bugtracker.local', systemRole: SystemRole.DEVOPS_ENGINEER, jobTitle: 'Redis & DB Cluster Ops Engineer' },
      { key: 'victor', fullName: 'Victor Stone', email: 'victor.stone@bugtracker.local', systemRole: SystemRole.DEVOPS_ENGINEER, jobTitle: 'CI/CD Pipeline Automation Specialist' },
      { key: 'benjamin', fullName: 'Benjamin Taylor', email: 'benjamin.t@bugtracker.local', systemRole: SystemRole.QA_ENGINEER, jobTitle: 'Infrastructure Integration QA' },

      // NETOPS / Security Operations Team
      { key: 'elena', fullName: 'Elena Rostova', email: 'elena.rostova@bugtracker.local', systemRole: SystemRole.SECURITY_ENGINEER, jobTitle: 'Head of Information Security' },
      { key: 'maxim', fullName: 'Maxim Petrov', email: 'maxim.petrov@bugtracker.local', systemRole: SystemRole.SECURITY_ENGINEER, jobTitle: 'Application Security & Penetration Tester' },
      { key: 'ryan', fullName: 'Ryan Murphy', email: 'ryan.murphy@bugtracker.local', systemRole: SystemRole.SECURITY_ENGINEER, jobTitle: 'Cloudflare Edge & WAF Specialist' },
      { key: 'oksana', fullName: 'Oksana Bondarenko', email: 'oksana.b@bugtracker.local', systemRole: SystemRole.SECURITY_ENGINEER, jobTitle: 'Identity & Access Management (IAM) Dev' },
      { key: 'arthur', fullName: 'Arthur Pendelton', email: 'arthur.p@bugtracker.local', systemRole: SystemRole.SECURITY_ENGINEER, jobTitle: 'Network Security & Firewall Engineer' },
      { key: 'grace', fullName: 'Grace Hopper', email: 'grace.h@bugtracker.local', systemRole: SystemRole.SECURITY_ENGINEER, jobTitle: 'Compliance & Cryptographic Auditor' },
    ];

    const result: Record<string, User> = {};

    for (const item of rawUsers) {
      const user = this.userRepository.create({
        fullName: item.fullName,
        email: item.email,
        passwordHash,
        systemRole: item.systemRole,
        jobTitle: item.jobTitle,
        avatarUrl: item.avatarUrl || null,
        isActivated: true,
        oauthProvider: OAuthProvider.LOCAL,
      });
      const saved = await this.userRepository.save(user);
      result[item.key] = saved;
    }

    return result;
  }

  private async seedProjects(users: Record<string, User>): Promise<Record<string, Project>> {
    const rawProjects = [
      {
        key: 'UI',
        name: 'Web UI & Design Systems',
        description: 'Frontend client interfaces, Kanban canvas, responsive layouts, and Material 3 design system.',
        lead: users['volodymyr'],
      },
      {
        key: 'CORE',
        name: 'Core Platform & Domain Engine',
        description: 'Business logic, NestJS modules, TypeORM database schema, JWT auth, and Lucene search indexing.',
        lead: users['alex'],
      },
      {
        key: 'MON',
        name: 'Observability & Telemetry',
        description: 'Prometheus metrics scrapers, OpenTelemetry distributed tracing, Grafana alerts, and health monitors.',
        lead: users['sarah'],
      },
      {
        key: 'INFRA',
        name: 'Cloud Infrastructure & DevOps',
        description: 'Kubernetes cluster deployments, Terraform scripts, Docker containers, and Redis session stores.',
        lead: users['david'],
      },
      {
        key: 'NET',
        name: 'Network Security & Edge Operations',
        description: 'Cloudflare Turnstile captcha integration, TLS 1.3 encryption, DDoS mitigation, and RBAC firewall rules.',
        lead: users['elena'],
      },
    ];

    const result: Record<string, Project> = {};

    for (const p of rawProjects) {
      const project = this.projectRepository.create({
        key: p.key,
        name: p.name,
        description: p.description,
        leadId: p.lead.id,
        lead: p.lead,
      });
      const saved = await this.projectRepository.save(project);
      result[p.key] = saved;
    }

    return result;
  }

  private async seedRbacStructure(
    users: Record<string, User>,
    projects: Record<string, Project>,
  ): Promise<{
    groupsCount: number;
    rolesCount: number;
    schemesCount: number;
    grantsCount: number;
  }> {
    // 1. Create Global Groups
    const rawGroups = [
      { name: 'administrators', description: 'System administrators with global access to all spaces and settings', isSystem: true },
      { name: 'all-users', description: 'All active software developers, QA, and SRE team members', isSystem: true },
      { name: 'ui-engineers', description: 'Design systems, CSS specialists, and frontend application engineers', isSystem: false },
      { name: 'core-platform', description: 'Backend service developers, database architects, and distributed systems engineers', isSystem: false },
      { name: 'devops-sre', description: 'Infrastructure, Kubernetes administrators, and reliability engineers', isSystem: false },
      { name: 'security-ops', description: 'Information security, IAM auditors, and penetration testing specialists', isSystem: false },
    ];

    const groupsMap: Record<string, Group> = {};
    for (const g of rawGroups) {
      const group = this.groupRepository.create(g);
      groupsMap[g.name] = await this.groupRepository.save(group);
    }

    // Assign users to groups
    const groupMemberships: Array<{ groupName: string; userKeys: string[] }> = [
      {
        groupName: 'administrators',
        userKeys: ['volodymyr', 'alex', 'sarah', 'david', 'elena'],
      },
      {
        groupName: 'all-users',
        userKeys: Object.keys(users),
      },
      {
        groupName: 'ui-engineers',
        userKeys: ['volodymyr', 'sonya', 'olena', 'daniel', 'sophia', 'lucas'],
      },
      {
        groupName: 'core-platform',
        userKeys: ['alex', 'marcus', 'taras', 'rachel', 'dmitry', 'liam'],
      },
      {
        groupName: 'devops-sre',
        userKeys: ['sarah', 'ethan', 'yuliia', 'kevin', 'maya', 'noah', 'david', 'brandon', 'andrii', 'chloe', 'victor', 'benjamin'],
      },
      {
        groupName: 'security-ops',
        userKeys: ['elena', 'maxim', 'ryan', 'oksana', 'arthur', 'grace'],
      },
    ];

    for (const gm of groupMemberships) {
      const group = groupsMap[gm.groupName];
      for (const uk of gm.userKeys) {
        const user = users[uk];
        if (user && group) {
          const ug = this.userGroupRepository.create({
            groupId: group.id,
            userId: user.id,
          });
          await this.userGroupRepository.save(ug);
        }
      }
    }

    // 2. Create Global Project Roles
    const rawRoles = [
      { name: 'Administrator', description: 'Project administrators with permission to configure workflows, components, and project settings', isDefault: true },
      { name: 'Developer', description: 'Core contributors with permission to create, transition, log work, and edit sprint issues', isDefault: true },
      { name: 'Member', description: 'Project collaborators with issue creation and comment capabilities', isDefault: true },
      { name: 'Viewer', description: 'Read-only observers able to browse projects, view roadmaps, and search issues', isDefault: true },
    ];

    const rolesMap: Record<string, ProjectRole> = {};
    for (const r of rawRoles) {
      const role = this.projectRoleRepository.create(r);
      rolesMap[r.name] = await this.projectRoleRepository.save(role);
    }

    // 3. Create Default Software Permission Scheme
    const defaultScheme = this.schemeRepository.create({
      name: 'Default Software Permission Scheme',
      description: 'Standard enterprise permission blueprint for agile engineering teams with role-decoupled access control.',
      isDefault: true,
    });
    const savedScheme = await this.schemeRepository.save(defaultScheme);

    // 4. Create Standard Grants
    const rawGrants: Array<{
      permission: ProjectPermission;
      grantType: PermissionGrantType;
      roleName?: string;
      groupName?: string;
    }> = [
      // Project operations
      { permission: ProjectPermission.BROWSE_PROJECTS, grantType: PermissionGrantType.ROLE, roleName: 'Viewer' },
      { permission: ProjectPermission.BROWSE_PROJECTS, grantType: PermissionGrantType.ROLE, roleName: 'Member' },
      { permission: ProjectPermission.BROWSE_PROJECTS, grantType: PermissionGrantType.ROLE, roleName: 'Developer' },
      { permission: ProjectPermission.BROWSE_PROJECTS, grantType: PermissionGrantType.ROLE, roleName: 'Administrator' },
      { permission: ProjectPermission.BROWSE_PROJECTS, grantType: PermissionGrantType.GROUP, groupName: 'all-users' },
      { permission: ProjectPermission.ADMINISTER_PROJECTS, grantType: PermissionGrantType.ROLE, roleName: 'Administrator' },
      { permission: ProjectPermission.ADMINISTER_PROJECTS, grantType: PermissionGrantType.LEAD },
      { permission: ProjectPermission.VIEW_ROADMAP, grantType: PermissionGrantType.ROLE, roleName: 'Viewer' },
      { permission: ProjectPermission.VIEW_ROADMAP, grantType: PermissionGrantType.ROLE, roleName: 'Developer' },

      // Issue operations
      { permission: ProjectPermission.CREATE_ISSUES, grantType: PermissionGrantType.ROLE, roleName: 'Member' },
      { permission: ProjectPermission.CREATE_ISSUES, grantType: PermissionGrantType.ROLE, roleName: 'Developer' },
      { permission: ProjectPermission.CREATE_ISSUES, grantType: PermissionGrantType.ROLE, roleName: 'Administrator' },
      { permission: ProjectPermission.CREATE_ISSUES, grantType: PermissionGrantType.GROUP, groupName: 'all-users' },
      { permission: ProjectPermission.EDIT_ISSUES, grantType: PermissionGrantType.ROLE, roleName: 'Developer' },
      { permission: ProjectPermission.EDIT_ISSUES, grantType: PermissionGrantType.ROLE, roleName: 'Administrator' },
      { permission: ProjectPermission.EDIT_ISSUES, grantType: PermissionGrantType.REPORTER },
      { permission: ProjectPermission.EDIT_ISSUES, grantType: PermissionGrantType.ASSIGNEE },
      { permission: ProjectPermission.TRANSITION_ISSUES, grantType: PermissionGrantType.ROLE, roleName: 'Developer' },
      { permission: ProjectPermission.TRANSITION_ISSUES, grantType: PermissionGrantType.ROLE, roleName: 'Administrator' },
      { permission: ProjectPermission.TRANSITION_ISSUES, grantType: PermissionGrantType.ASSIGNEE },
      { permission: ProjectPermission.ASSIGN_ISSUES, grantType: PermissionGrantType.ROLE, roleName: 'Developer' },
      { permission: ProjectPermission.ASSIGN_ISSUES, grantType: PermissionGrantType.ROLE, roleName: 'Administrator' },
      { permission: ProjectPermission.ASSIGNABLE_USER, grantType: PermissionGrantType.ROLE, roleName: 'Developer' },
      { permission: ProjectPermission.ASSIGNABLE_USER, grantType: PermissionGrantType.ROLE, roleName: 'Administrator' },
      { permission: ProjectPermission.DELETE_ISSUES, grantType: PermissionGrantType.ROLE, roleName: 'Administrator' },

      // Comments & Worklogs
      { permission: ProjectPermission.ADD_COMMENTS, grantType: PermissionGrantType.ROLE, roleName: 'Member' },
      { permission: ProjectPermission.ADD_COMMENTS, grantType: PermissionGrantType.ROLE, roleName: 'Developer' },
      { permission: ProjectPermission.ADD_COMMENTS, grantType: PermissionGrantType.ROLE, roleName: 'Administrator' },
      { permission: ProjectPermission.EDIT_OWN_COMMENTS, grantType: PermissionGrantType.REPORTER },
      { permission: ProjectPermission.EDIT_OWN_COMMENTS, grantType: PermissionGrantType.ROLE, roleName: 'Developer' },
      { permission: ProjectPermission.DELETE_OWN_COMMENTS, grantType: PermissionGrantType.ROLE, roleName: 'Developer' },
      { permission: ProjectPermission.LOG_WORK, grantType: PermissionGrantType.ROLE, roleName: 'Developer' },
      { permission: ProjectPermission.LOG_WORK, grantType: PermissionGrantType.ROLE, roleName: 'Administrator' },
      { permission: ProjectPermission.EDIT_OWN_WORKLOGS, grantType: PermissionGrantType.ASSIGNEE },
      { permission: ProjectPermission.EDIT_OWN_WORKLOGS, grantType: PermissionGrantType.ROLE, roleName: 'Developer' },

      // Attachments
      { permission: ProjectPermission.CREATE_ATTACHMENTS, grantType: PermissionGrantType.ROLE, roleName: 'Member' },
      { permission: ProjectPermission.CREATE_ATTACHMENTS, grantType: PermissionGrantType.ROLE, roleName: 'Developer' },
      { permission: ProjectPermission.CREATE_ATTACHMENTS, grantType: PermissionGrantType.ROLE, roleName: 'Administrator' },
      { permission: ProjectPermission.DELETE_OWN_ATTACHMENTS, grantType: PermissionGrantType.ROLE, roleName: 'Developer' },
    ];

    let grantsCount = 0;
    for (const rg of rawGrants) {
      const role = rg.roleName ? rolesMap[rg.roleName] : null;
      const group = rg.groupName ? groupsMap[rg.groupName] : null;

      const grant = this.grantRepository.create({
        schemeId: savedScheme.id,
        permission: rg.permission,
        grantType: rg.grantType,
        roleId: role ? role.id : null,
        groupId: group ? group.id : null,
      });

      await this.grantRepository.save(grant);
      grantsCount++;
    }

    // 5. Create Issue Security Scheme
    const secScheme = this.securitySchemeRepository.create({
      name: 'Standard Issue Security Scheme',
      description: 'Protects sensitive vulnerability disclosures, credentials, and internal engineering discussions.',
    });
    const savedSecScheme = await this.securitySchemeRepository.save(secScheme);

    const levelInternal = this.securityLevelRepository.create({
      schemeId: savedSecScheme.id,
      name: 'Internal Engineering Only',
      description: 'Visible to all developers, members, and administrators across the organization.',
    });
    const savedLvlInternal = await this.securityLevelRepository.save(levelInternal);

    const levelConfidential = this.securityLevelRepository.create({
      schemeId: savedSecScheme.id,
      name: 'Confidential / Security Vulnerability',
      description: 'Restricted strictly to Project Lead, Reporter, Administrators, and Security Operations.',
    });
    const savedLvlConfidential = await this.securityLevelRepository.save(levelConfidential);

    savedSecScheme.defaultLevelId = savedLvlInternal.id;
    await this.securitySchemeRepository.save(savedSecScheme);

    // Security Grants
    await this.securityGrantRepository.save([
      this.securityGrantRepository.create({ securityLevelId: savedLvlInternal.id, grantType: PermissionGrantType.ROLE, roleId: rolesMap['Developer'].id }),
      this.securityGrantRepository.create({ securityLevelId: savedLvlInternal.id, grantType: PermissionGrantType.ROLE, roleId: rolesMap['Administrator'].id }),
      this.securityGrantRepository.create({ securityLevelId: savedLvlInternal.id, grantType: PermissionGrantType.ROLE, roleId: rolesMap['Member'].id }),
      this.securityGrantRepository.create({ securityLevelId: savedLvlConfidential.id, grantType: PermissionGrantType.LEAD }),
      this.securityGrantRepository.create({ securityLevelId: savedLvlConfidential.id, grantType: PermissionGrantType.REPORTER }),
      this.securityGrantRepository.create({ securityLevelId: savedLvlConfidential.id, grantType: PermissionGrantType.ROLE, roleId: rolesMap['Administrator'].id }),
      this.securityGrantRepository.create({ securityLevelId: savedLvlConfidential.id, grantType: PermissionGrantType.GROUP, groupId: groupsMap['security-ops'].id }),
    ]);

    // 6. Attach schemes to all 5 projects & seed project role actors
    const projectTeamMembers: Record<string, string[]> = {
      UI: ['volodymyr', 'sonya', 'olena', 'daniel', 'sophia', 'lucas'],
      CORE: ['alex', 'marcus', 'taras', 'rachel', 'dmitry', 'liam'],
      MON: ['sarah', 'ethan', 'yuliia', 'kevin', 'maya', 'noah'],
      INFRA: ['david', 'brandon', 'andrii', 'chloe', 'victor', 'benjamin'],
      NET: ['elena', 'maxim', 'ryan', 'oksana', 'arthur', 'grace'],
    };

    for (const [projKey, project] of Object.entries(projects)) {
      project.permissionSchemeId = savedScheme.id;
      project.securitySchemeId = savedSecScheme.id;
      await this.projectRepository.save(project);

      // Lead -> Administrator
      await this.roleActorRepository.save(
        this.roleActorRepository.create({
          projectId: project.id,
          roleId: rolesMap['Administrator'].id,
          actorType: ProjectActorType.USER,
          userId: project.leadId,
        }),
      );

      // Team members -> Developer
      const memberKeys = projectTeamMembers[projKey] || [];
      for (const mk of memberKeys) {
        const u = users[mk];
        if (u) {
          await this.roleActorRepository.save(
            this.roleActorRepository.create({
              projectId: project.id,
              roleId: rolesMap['Developer'].id,
              actorType: ProjectActorType.USER,
              userId: u.id,
            }),
          );
        }
      }

      // All all-users group -> Viewer
      await this.roleActorRepository.save(
        this.roleActorRepository.create({
          projectId: project.id,
          roleId: rolesMap['Viewer'].id,
          actorType: ProjectActorType.GROUP,
          groupId: groupsMap['all-users'].id,
        }),
      );
    }

    return {
      groupsCount: Object.keys(groupsMap).length,
      rolesCount: Object.keys(rolesMap).length,
      schemesCount: 2, // 1 Permission Scheme + 1 Security Scheme
      grantsCount: grantsCount + 7,
    };
  }

  private async seedIssues(
    projects: Record<string, Project>,
    users: Record<string, User>,
  ): Promise<Record<string, Issue>> {
    const rawIssues: Array<{
      projectKey: string;
      issueNum: number;
      title: string;
      description: string;
      issueType: IssueType;
      status: IssueStatus;
      priority: IssuePriority;
      severity: IssueSeverity;
      estimatedHours: number;
      sprint: string | null;
      reporterKey: string;
      assigneeKey: string | null;
    }> = [
      // ================= UI TEAM TICKETS =================
      {
        projectKey: 'UI',
        issueNum: 1,
        title: 'Refactor Kanban column layout for ultra-wide monitors',
        description: 'Implement responsive flexbox wrapping and scroll snapping for Kanban swimlane columns on 4K and ultrawide viewports.',
        issueType: IssueType.IMPROVEMENT,
        status: IssueStatus.CLOSED,
        priority: IssuePriority.MEDIUM,
        severity: IssueSeverity.MINOR,
        estimatedHours: 8,
        sprint: 'Sprint 1 (Completed)',
        reporterKey: 'volodymyr',
        assigneeKey: 'sonya',
      },
      {
        projectKey: 'UI',
        issueNum: 2,
        title: 'Resolve visual glitch in mobile drawer backdrop blur',
        description: 'Safari iOS backdrop-filter rendering bug causes flickering when dismissing mobile navigation drawers.',
        issueType: IssueType.BUG,
        status: IssueStatus.CLOSED,
        priority: IssuePriority.HIGH,
        severity: IssueSeverity.MAJOR,
        estimatedHours: 6,
        sprint: 'Sprint 1 (Completed)',
        reporterKey: 'sophia',
        assigneeKey: 'lucas',
      },
      {
        projectKey: 'UI',
        issueNum: 3,
        title: 'Implement keyboard navigation shortcuts for issue triage (J/K/Enter)',
        description: 'Add global hotkeys allowing triage engineers to navigate between issues and open detail modals without mouse clicks.',
        issueType: IssueType.FEATURE,
        status: IssueStatus.IN_PROGRESS,
        priority: IssuePriority.HIGH,
        severity: IssueSeverity.MAJOR,
        estimatedHours: 12,
        sprint: 'Sprint 2 (Active)',
        reporterKey: 'volodymyr',
        assigneeKey: 'daniel',
      },
      {
        projectKey: 'UI',
        issueNum: 4,
        title: 'Verify WCAG 2.1 AA color contrast compliance across dark theme tokens',
        description: 'Run automated axe-core audits to ensure all text variants against surface-container background tokens meet 4.5:1 ratio.',
        issueType: IssueType.TASK,
        status: IssueStatus.REVIEW,
        priority: IssuePriority.MEDIUM,
        severity: IssueSeverity.MINOR,
        estimatedHours: 6,
        sprint: 'Sprint 2 (Active)',
        reporterKey: 'sophia',
        assigneeKey: 'lucas',
      },
      {
        projectKey: 'UI',
        issueNum: 5,
        title: 'Live WebSocket sync indicator for concurrent sprint edits',
        description: 'Display collaborative avatar indicators in header when other team members are actively moving cards on the Kanban board.',
        issueType: IssueType.FEATURE,
        status: IssueStatus.IN_PROGRESS,
        priority: IssuePriority.CRITICAL,
        severity: IssueSeverity.BLOCKER,
        estimatedHours: 16,
        sprint: 'Sprint 2 (Active)',
        reporterKey: 'volodymyr',
        assigneeKey: 'volodymyr',
      },
      {
        projectKey: 'UI',
        issueNum: 6,
        title: 'Interactive Timesheet Matrix cell hover preview tooltip',
        description: 'Hovering over individual day cells displays an interactive popup with tickets logged, hourly breakdown, and quick edit links.',
        issueType: IssueType.FEATURE,
        status: IssueStatus.RESOLVED,
        priority: IssuePriority.HIGH,
        severity: IssueSeverity.MAJOR,
        estimatedHours: 10,
        sprint: 'Sprint 2 (Active)',
        reporterKey: 'sonya',
        assigneeKey: 'olena',
      },
      {
        projectKey: 'UI',
        issueNum: 7,
        title: 'Implement drag-and-drop column reordering in board settings modal',
        description: 'Allow team leads to customize status workflow columns and reorder column positions via HTML5 Drag & Drop.',
        issueType: IssueType.FEATURE,
        status: IssueStatus.OPEN,
        priority: IssuePriority.MEDIUM,
        severity: IssueSeverity.MAJOR,
        estimatedHours: 14,
        sprint: 'Sprint 3 (Upcoming)',
        reporterKey: 'sonya',
        assigneeKey: 'olena',
      },
      {
        projectKey: 'UI',
        issueNum: 8,
        title: 'Gantt chart timeline roadmap view for multi-sprint planning',
        description: 'Interactive SVG Gantt view rendering sprint milestones, dependency arrows, and assignee resource allocation.',
        issueType: IssueType.FEATURE,
        status: IssueStatus.OPEN,
        priority: IssuePriority.LOW,
        severity: IssueSeverity.MINOR,
        estimatedHours: 32,
        sprint: null, // Backlog
        reporterKey: 'alex',
        assigneeKey: null,
      },
      {
        projectKey: 'UI',
        issueNum: 9,
        title: 'Memory leak in real-time notification toast listener',
        description: 'Socket.IO event listeners attached in useEffect are not properly unregistered on component unmount.',
        issueType: IssueType.BUG,
        status: IssueStatus.OPEN,
        priority: IssuePriority.HIGH,
        severity: IssueSeverity.MAJOR,
        estimatedHours: 4,
        sprint: null, // Backlog
        reporterKey: 'sophia',
        assigneeKey: 'volodymyr',
      },
      {
        projectKey: 'UI',
        issueNum: 10,
        title: 'Multi-select bulk issue updater for sprint planning triage',
        description: 'Allow holding Shift/Cmd to select multiple issue cards and change status, priority, or sprint in one batch action.',
        issueType: IssueType.FEATURE,
        status: IssueStatus.OPEN,
        priority: IssuePriority.MEDIUM,
        severity: IssueSeverity.MINOR,
        estimatedHours: 16,
        sprint: 'Sprint 3 (Upcoming)',
        reporterKey: 'volodymyr',
        assigneeKey: 'daniel',
      },
      {
        projectKey: 'UI',
        issueNum: 11,
        title: 'Customizable widget layout for personal engineer dashboard',
        description: 'Add drag-and-drop grid system allowing users to rearrange My Tasks, Recent Comments, and Time Tracking Summary cards.',
        issueType: IssueType.IMPROVEMENT,
        status: IssueStatus.OPEN,
        priority: IssuePriority.LOW,
        severity: IssueSeverity.TRIVIAL,
        estimatedHours: 20,
        sprint: null, // Backlog
        reporterKey: 'sonya',
        assigneeKey: null,
      },

      // ================= CORE TEAM TICKETS =================
      {
        projectKey: 'CORE',
        issueNum: 1,
        title: 'Optimize database index for login audit query performance',
        description: 'Add composite B-tree index on (user_id, created_at DESC) in login_audit_logs to prevent slow sequential scans.',
        issueType: IssueType.IMPROVEMENT,
        status: IssueStatus.RESOLVED,
        priority: IssuePriority.HIGH,
        severity: IssueSeverity.MAJOR,
        estimatedHours: 6,
        sprint: 'Sprint 1 (Completed)',
        reporterKey: 'alex',
        assigneeKey: 'marcus',
      },
      {
        projectKey: 'CORE',
        issueNum: 2,
        title: 'Mitigate race condition during concurrent refresh token rotation',
        description: 'Implement PostgreSQL row-level locking (SELECT FOR UPDATE) when rotating refresh tokens to prevent duplicate token validation exceptions.',
        issueType: IssueType.BUG,
        status: IssueStatus.IN_PROGRESS,
        priority: IssuePriority.CRITICAL,
        severity: IssueSeverity.BLOCKER,
        estimatedHours: 10,
        sprint: 'Sprint 2 (Active)',
        reporterKey: 'rachel',
        assigneeKey: 'taras',
      },
      {
        projectKey: 'CORE',
        issueNum: 3,
        title: 'Implement Lucene inverted index synchronization for issue search',
        description: 'Build asynchronous event listener updating search indices whenever issue title, description, or custom fields are modified.',
        issueType: IssueType.FEATURE,
        status: IssueStatus.IN_PROGRESS,
        priority: IssuePriority.HIGH,
        severity: IssueSeverity.MAJOR,
        estimatedHours: 20,
        sprint: 'Sprint 2 (Active)',
        reporterKey: 'alex',
        assigneeKey: 'marcus',
      },
      {
        projectKey: 'CORE',
        issueNum: 4,
        title: 'Webhook dispatch queue with exponential backoff retry mechanism',
        description: 'Queue outbound webhook payloads to external systems with exponential retry (3 attempts) on HTTP 5xx failures.',
        issueType: IssueType.FEATURE,
        status: IssueStatus.REVIEW,
        priority: IssuePriority.MEDIUM,
        severity: IssueSeverity.MINOR,
        estimatedHours: 12,
        sprint: 'Sprint 2 (Active)',
        reporterKey: 'alex',
        assigneeKey: 'dmitry',
      },
      {
        projectKey: 'CORE',
        issueNum: 5,
        title: 'SeaweedFS distributed storage provider for issue attachments',
        description: 'Implement streaming multi-part file upload service integrating SeaweedFS master & volume nodes with auto-replication.',
        issueType: IssueType.FEATURE,
        status: IssueStatus.IN_PROGRESS,
        priority: IssuePriority.HIGH,
        severity: IssueSeverity.MAJOR,
        estimatedHours: 16,
        sprint: 'Sprint 2 (Active)',
        reporterKey: 'alex',
        assigneeKey: 'rachel',
      },
      {
        projectKey: 'CORE',
        issueNum: 6,
        title: 'RBAC permissions caching layer using in-memory TTL store',
        description: 'Cache evaluated user role permissions for 5 minutes to reduce database read load during high-throughput API requests.',
        issueType: IssueType.IMPROVEMENT,
        status: IssueStatus.OPEN,
        priority: IssuePriority.HIGH,
        severity: IssueSeverity.MAJOR,
        estimatedHours: 14,
        sprint: 'Sprint 3 (Upcoming)',
        reporterKey: 'alex',
        assigneeKey: 'rachel',
      },
      {
        projectKey: 'CORE',
        issueNum: 7,
        title: 'CSV export stream for large issue datasets (>10k records)',
        description: 'Stream issue records directly via HTTP chunked transfer encoding to avoid Node.js buffer memory spikes.',
        issueType: IssueType.FEATURE,
        status: IssueStatus.OPEN,
        priority: IssuePriority.LOW,
        severity: IssueSeverity.MINOR,
        estimatedHours: 8,
        sprint: null, // Backlog
        reporterKey: 'liam',
        assigneeKey: null,
      },
      {
        projectKey: 'CORE',
        issueNum: 8,
        title: 'Cascade soft delete handler for project archives',
        description: 'Ensure archiving a project recursively flags associated issues, links, and worklogs without breaking historical reporting.',
        issueType: IssueType.TASK,
        status: IssueStatus.OPEN,
        priority: IssuePriority.MEDIUM,
        severity: IssueSeverity.MINOR,
        estimatedHours: 10,
        sprint: 'Sprint 3 (Upcoming)',
        reporterKey: 'marcus',
        assigneeKey: 'taras',
      },
      {
        projectKey: 'CORE',
        issueNum: 9,
        title: 'OpenAPI Swagger documentation automated schema generator',
        description: 'Integrate NestJS Swagger decorators across all v1 REST controllers with automated DTO schema validation definitions.',
        issueType: IssueType.IMPROVEMENT,
        status: IssueStatus.CLOSED,
        priority: IssuePriority.LOW,
        severity: IssueSeverity.TRIVIAL,
        estimatedHours: 6,
        sprint: 'Sprint 1 (Completed)',
        reporterKey: 'alex',
        assigneeKey: 'dmitry',
      },
      {
        projectKey: 'CORE',
        issueNum: 10,
        title: 'Database connection pool leakage under simulated socket disconnects',
        description: 'Investigate unreleased TypeORM QueryRunner connections when client terminates HTTP connection before query finishes.',
        issueType: IssueType.BUG,
        status: IssueStatus.OPEN,
        priority: IssuePriority.CRITICAL,
        severity: IssueSeverity.BLOCKER,
        estimatedHours: 8,
        sprint: null, // Backlog
        reporterKey: 'liam',
        assigneeKey: 'marcus',
      },

      // ================= MONOPS TEAM TICKETS =================
      {
        projectKey: 'MON',
        issueNum: 1,
        title: 'Prometheus metrics scrape endpoint for API request latency (p50/p95/p99)',
        description: 'Expose /metrics endpoint with histogram metrics capturing NestJS HTTP request duration and active DB connection pool counts.',
        issueType: IssueType.FEATURE,
        status: IssueStatus.CLOSED,
        priority: IssuePriority.HIGH,
        severity: IssueSeverity.MAJOR,
        estimatedHours: 8,
        sprint: 'Sprint 1 (Completed)',
        reporterKey: 'sarah',
        assigneeKey: 'ethan',
      },
      {
        projectKey: 'MON',
        issueNum: 2,
        title: 'OpenTelemetry trace context propagation across microservices',
        description: 'Inject W3C traceparent headers in outbound HTTP client requests to enable end-to-end distributed transaction tracing.',
        issueType: IssueType.FEATURE,
        status: IssueStatus.IN_PROGRESS,
        priority: IssuePriority.CRITICAL,
        severity: IssueSeverity.BLOCKER,
        estimatedHours: 16,
        sprint: 'Sprint 2 (Active)',
        reporterKey: 'sarah',
        assigneeKey: 'kevin',
      },
      {
        projectKey: 'MON',
        issueNum: 3,
        title: 'Grafana dashboard for database slow queries and connection starvation',
        description: 'Build real-time visualization dashboard tracking queries exceeding 250ms threshold and TypeORM transaction acquire wait times.',
        issueType: IssueType.TASK,
        status: IssueStatus.IN_PROGRESS,
        priority: IssuePriority.HIGH,
        severity: IssueSeverity.MAJOR,
        estimatedHours: 10,
        sprint: 'Sprint 2 (Active)',
        reporterKey: 'sarah',
        assigneeKey: 'yuliia',
      },
      {
        projectKey: 'MON',
        issueNum: 4,
        title: 'Alertmanager escalation route for error rate spike (>2% 5xx in 5m)',
        description: 'Configure automated PagerDuty/Slack routing rules when 5xx error rate crosses 2% over a 5-minute rolling window.',
        issueType: IssueType.TASK,
        status: IssueStatus.REVIEW,
        priority: IssuePriority.CRITICAL,
        severity: IssueSeverity.MAJOR,
        estimatedHours: 6,
        sprint: 'Sprint 2 (Active)',
        reporterKey: 'ethan',
        assigneeKey: 'noah',
      },
      {
        projectKey: 'MON',
        issueNum: 5,
        title: 'Synthetics health check probe for user login endpoint',
        description: 'Deploy headless browser synthetic probe testing user login flow every 60 seconds from multiple geographic regions.',
        issueType: IssueType.IMPROVEMENT,
        status: IssueStatus.OPEN,
        priority: IssuePriority.MEDIUM,
        severity: IssueSeverity.MINOR,
        estimatedHours: 12,
        sprint: 'Sprint 3 (Upcoming)',
        reporterKey: 'maya',
        assigneeKey: 'kevin',
      },
      {
        projectKey: 'MON',
        issueNum: 6,
        title: 'Loki distributed log aggregation pipeline for container stderr/stdout',
        description: 'Deploy Promtail DaemonSet streaming structured JSON logs from Kubernetes nodes into Grafana Loki.',
        issueType: IssueType.FEATURE,
        status: IssueStatus.IN_PROGRESS,
        priority: IssuePriority.HIGH,
        severity: IssueSeverity.MAJOR,
        estimatedHours: 14,
        sprint: 'Sprint 2 (Active)',
        reporterKey: 'sarah',
        assigneeKey: 'noah',
      },
      {
        projectKey: 'MON',
        issueNum: 7,
        title: 'Blackbox exporter probe for external SSL certificate expiration alerts',
        description: 'Set up automated alerts when wildcard TLS certificates have less than 14 days before expiration.',
        issueType: IssueType.TASK,
        status: IssueStatus.CLOSED,
        priority: IssuePriority.MEDIUM,
        severity: IssueSeverity.MINOR,
        estimatedHours: 4,
        sprint: 'Sprint 1 (Completed)',
        reporterKey: 'ethan',
        assigneeKey: 'ethan',
      },
      {
        projectKey: 'MON',
        issueNum: 8,
        title: 'SLA uptime percentage calculation dashboard for enterprise customers',
        description: 'Calculate monthly rolling 99.9% uptime compliance with drill-down views for scheduled maintenance windows.',
        issueType: IssueType.IMPROVEMENT,
        status: IssueStatus.OPEN,
        priority: IssuePriority.LOW,
        severity: IssueSeverity.TRIVIAL,
        estimatedHours: 8,
        sprint: null, // Backlog
        reporterKey: 'maya',
        assigneeKey: 'yuliia',
      },
      {
        projectKey: 'MON',
        issueNum: 9,
        title: 'Chaos engineering pod kill drill during peak traffic simulation',
        description: 'Execute Chaos Mesh automated pod deletion to verify Kubernetes replica set recovery under 200 RPS load.',
        issueType: IssueType.TASK,
        status: IssueStatus.OPEN,
        priority: IssuePriority.HIGH,
        severity: IssueSeverity.MAJOR,
        estimatedHours: 10,
        sprint: 'Sprint 3 (Upcoming)',
        reporterKey: 'sarah',
        assigneeKey: 'maya',
      },

      // ================= INFRAOPS TEAM TICKETS =================
      {
        projectKey: 'INFRA',
        issueNum: 1,
        title: 'Provision Kubernetes ingress controller with automated TLS cert-manager',
        description: 'Deploy NGINX Ingress controller with Let\'s Encrypt ACME cluster issuer for zero-touch SSL certificate renewals.',
        issueType: IssueType.TASK,
        status: IssueStatus.CLOSED,
        priority: IssuePriority.HIGH,
        severity: IssueSeverity.MAJOR,
        estimatedHours: 14,
        sprint: 'Sprint 1 (Completed)',
        reporterKey: 'david',
        assigneeKey: 'brandon',
      },
      {
        projectKey: 'INFRA',
        issueNum: 2,
        title: 'Deploy Redis Sentinel cluster for high-availability session caching',
        description: 'Set up 3-node Redis cluster with automatic master failover to support distributed session caching and rate limiter state.',
        issueType: IssueType.FEATURE,
        status: IssueStatus.IN_PROGRESS,
        priority: IssuePriority.CRITICAL,
        severity: IssueSeverity.BLOCKER,
        estimatedHours: 18,
        sprint: 'Sprint 2 (Active)',
        reporterKey: 'david',
        assigneeKey: 'chloe',
      },
      {
        projectKey: 'INFRA',
        issueNum: 3,
        title: 'Terraform module for PostgreSQL automated point-in-time recovery (PITR)',
        description: 'Automate WAL archiving to S3 bucket with 30-day retention policy and automated daily restore verification drills.',
        issueType: IssueType.TASK,
        status: IssueStatus.IN_PROGRESS,
        priority: IssuePriority.HIGH,
        severity: IssueSeverity.MAJOR,
        estimatedHours: 12,
        sprint: 'Sprint 2 (Active)',
        reporterKey: 'david',
        assigneeKey: 'andrii',
      },
      {
        projectKey: 'INFRA',
        issueNum: 4,
        title: 'Docker multi-stage build optimization to reduce production image size',
        description: 'Optimize Dockerfile layers to reduce final Node.js runtime image size from 850MB down to under 180MB using Alpine base.',
        issueType: IssueType.IMPROVEMENT,
        status: IssueStatus.REVIEW,
        priority: IssuePriority.MEDIUM,
        severity: IssueSeverity.MINOR,
        estimatedHours: 6,
        sprint: 'Sprint 2 (Active)',
        reporterKey: 'victor',
        assigneeKey: 'victor',
      },
      {
        projectKey: 'INFRA',
        issueNum: 5,
        title: 'Automated blue-green deployment pipeline with canary health checks',
        description: 'Implement GitHub Actions deployment workflow routing 10% traffic to canary pods before promoting release to 100%.',
        issueType: IssueType.FEATURE,
        status: IssueStatus.OPEN,
        priority: IssuePriority.HIGH,
        severity: IssueSeverity.MAJOR,
        estimatedHours: 24,
        sprint: 'Sprint 3 (Upcoming)',
        reporterKey: 'david',
        assigneeKey: 'brandon',
      },
      {
        projectKey: 'INFRA',
        issueNum: 6,
        title: 'HashiCorp Vault secret injection via Kubernetes CSI Secret Store driver',
        description: 'Eliminate plain environment variables by mounting dynamic database credentials directly from Vault into pod filesystems.',
        issueType: IssueType.FEATURE,
        status: IssueStatus.OPEN,
        priority: IssuePriority.HIGH,
        severity: IssueSeverity.MAJOR,
        estimatedHours: 16,
        sprint: 'Sprint 3 (Upcoming)',
        reporterKey: 'david',
        assigneeKey: 'andrii',
      },
      {
        projectKey: 'INFRA',
        issueNum: 7,
        title: 'Kubernetes Horizontal Pod Autoscaler (HPA) CPU & Custom Metric policies',
        description: 'Configure HPA to autoscale backend pods between 3 and 15 replicas based on CPU >70% or active HTTP connection queues.',
        issueType: IssueType.IMPROVEMENT,
        status: IssueStatus.CLOSED,
        priority: IssuePriority.MEDIUM,
        severity: IssueSeverity.MINOR,
        estimatedHours: 8,
        sprint: 'Sprint 1 (Completed)',
        reporterKey: 'brandon',
        assigneeKey: 'victor',
      },
      {
        projectKey: 'INFRA',
        issueNum: 8,
        title: 'Staging database sanitization anonymizer script for developers',
        description: 'Automate masking of user emails and PII in database dumps before restoring to developer local environments.',
        issueType: IssueType.TASK,
        status: IssueStatus.OPEN,
        priority: IssuePriority.LOW,
        severity: IssueSeverity.TRIVIAL,
        estimatedHours: 6,
        sprint: null, // Backlog
        reporterKey: 'benjamin',
        assigneeKey: 'chloe',
      },

      // ================= NETOPS TEAM TICKETS =================
      {
        projectKey: 'NET',
        issueNum: 1,
        title: 'Cloudflare Turnstile captcha validation challenge timeout handling',
        description: 'Handle edge-case network dropouts during Turnstile token validation by adding fallback verification retries.',
        issueType: IssueType.BUG,
        status: IssueStatus.CLOSED,
        priority: IssuePriority.HIGH,
        severity: IssueSeverity.MAJOR,
        estimatedHours: 6,
        sprint: 'Sprint 1 (Completed)',
        reporterKey: 'elena',
        assigneeKey: 'ryan',
      },
      {
        projectKey: 'NET',
        issueNum: 2,
        title: 'Enforce TLS 1.3 cipher suite hardening across API endpoints',
        description: 'Disable deprecated TLS 1.0/1.1 protocols and weak CBC cipher suites to achieve A+ rating on Qualys SSL Labs audit.',
        issueType: IssueType.TASK,
        status: IssueStatus.IN_PROGRESS,
        priority: IssuePriority.HIGH,
        severity: IssueSeverity.MAJOR,
        estimatedHours: 8,
        sprint: 'Sprint 2 (Active)',
        reporterKey: 'elena',
        assigneeKey: 'arthur',
      },
      {
        projectKey: 'NET',
        issueNum: 3,
        title: 'Rate limiter bypass mitigation on password reset initiation endpoint',
        description: 'Implement distributed IP & email token bucket throttling to protect against automated credential stuffing attacks.',
        issueType: IssueType.BUG,
        status: IssueStatus.IN_PROGRESS,
        priority: IssuePriority.CRITICAL,
        severity: IssueSeverity.BLOCKER,
        estimatedHours: 10,
        sprint: 'Sprint 2 (Active)',
        reporterKey: 'maxim',
        assigneeKey: 'maxim',
      },
      {
        projectKey: 'NET',
        issueNum: 4,
        title: 'TOTP 2FA secret generation entropy audit and RFC 6238 compliance',
        description: 'Verify crypto.randomBytes entropy source used for base32 TOTP secret generation complies with NIST SP 800-63B standards.',
        issueType: IssueType.TASK,
        status: IssueStatus.REVIEW,
        priority: IssuePriority.MEDIUM,
        severity: IssueSeverity.MINOR,
        estimatedHours: 6,
        sprint: 'Sprint 2 (Active)',
        reporterKey: 'grace',
        assigneeKey: 'oksana',
      },
      {
        projectKey: 'NET',
        issueNum: 5,
        title: 'Security incident response playbook for leaked service credentials',
        description: 'Document step-by-step containment, key revocation, and post-mortem protocol for compromised API tokens.',
        issueType: IssueType.TASK,
        status: IssueStatus.OPEN,
        priority: IssuePriority.LOW,
        severity: IssueSeverity.MINOR,
        estimatedHours: 8,
        sprint: null, // Backlog
        reporterKey: 'elena',
        assigneeKey: null,
      },
      {
        projectKey: 'NET',
        issueNum: 6,
        title: 'Content Security Policy (CSP) header nonce injection against XSS',
        description: 'Implement strict script-src nonce generation in NestJS helmet middleware to prevent script injection vulnerabilities.',
        issueType: IssueType.IMPROVEMENT,
        status: IssueStatus.IN_PROGRESS,
        priority: IssuePriority.HIGH,
        severity: IssueSeverity.MAJOR,
        estimatedHours: 12,
        sprint: 'Sprint 2 (Active)',
        reporterKey: 'elena',
        assigneeKey: 'ryan',
      },
      {
        projectKey: 'NET',
        issueNum: 7,
        title: 'Automated container vulnerability scanning using Trivy in CI pipeline',
        description: 'Block pull request merges if base OS packages contain Critical or High CVEs with available upstream patches.',
        issueType: IssueType.FEATURE,
        status: IssueStatus.OPEN,
        priority: IssuePriority.MEDIUM,
        severity: IssueSeverity.MINOR,
        estimatedHours: 8,
        sprint: 'Sprint 3 (Upcoming)',
        reporterKey: 'grace',
        assigneeKey: 'arthur',
      },
      {
        projectKey: 'NET',
        issueNum: 8,
        title: 'Enterprise SAML 2.0 / Okta Single Sign-On (SSO) integration spike',
        description: 'Design identity federation schema mapping Okta group assertions to BugTracker RBAC role permissions.',
        issueType: IssueType.FEATURE,
        status: IssueStatus.OPEN,
        priority: IssuePriority.HIGH,
        severity: IssueSeverity.MAJOR,
        estimatedHours: 20,
        sprint: null, // Backlog
        reporterKey: 'elena',
        assigneeKey: 'oksana',
      },
    ];

    const result: Record<string, Issue> = {};

    for (const item of rawIssues) {
      const project = projects[item.projectKey];
      const reporter = users[item.reporterKey] || Object.values(users)[0];
      const assignee = item.assigneeKey ? users[item.assigneeKey] : null;

      const issue = this.issueRepository.create({
        projectId: project.id,
        project,
        issueNum: item.issueNum,
        title: item.title,
        description: item.description,
        issueType: item.issueType,
        status: item.status,
        priority: item.priority,
        severity: item.severity,
        estimatedHours: item.estimatedHours,
        loggedHours: 0,
        sprint: item.sprint,
        reporterId: reporter.id,
        reporter,
        assigneeId: assignee ? assignee.id : null,
        assignee,
      });

      const saved = await this.issueRepository.save(issue);
      const compositeKey = `${item.projectKey}-${item.issueNum}`;
      result[compositeKey] = saved;
    }

    return result;
  }

  private async seedIssueLinks(issues: Record<string, Issue>): Promise<number> {
    const rawLinks: Array<{
      sourceKey: string;
      targetKey: string;
      linkType: IssueLinkType;
    }> = [
      // CORE blocks UI
      { sourceKey: 'CORE-2', targetKey: 'UI-5', linkType: IssueLinkType.BLOCKS },
      { sourceKey: 'CORE-1', targetKey: 'UI-2', linkType: IssueLinkType.BLOCKS },
      { sourceKey: 'CORE-3', targetKey: 'UI-3', linkType: IssueLinkType.RELATES_TO },
      { sourceKey: 'CORE-5', targetKey: 'UI-8', linkType: IssueLinkType.BLOCKS },
      { sourceKey: 'CORE-4', targetKey: 'UI-10', linkType: IssueLinkType.RELATES_TO },

      // INFRA blocks MON & CORE
      { sourceKey: 'INFRA-2', targetKey: 'CORE-2', linkType: IssueLinkType.BLOCKS },
      { sourceKey: 'INFRA-1', targetKey: 'MON-1', linkType: IssueLinkType.BLOCKS },
      { sourceKey: 'INFRA-3', targetKey: 'MON-3', linkType: IssueLinkType.RELATES_TO },
      { sourceKey: 'INFRA-6', targetKey: 'CORE-5', linkType: IssueLinkType.BLOCKS },
      { sourceKey: 'INFRA-5', targetKey: 'MON-9', linkType: IssueLinkType.RELATES_TO },

      // NET blocks CORE & UI
      { sourceKey: 'NET-1', targetKey: 'UI-5', linkType: IssueLinkType.RELATES_TO },
      { sourceKey: 'NET-3', targetKey: 'CORE-2', linkType: IssueLinkType.BLOCKS },
      { sourceKey: 'NET-2', targetKey: 'INFRA-1', linkType: IssueLinkType.RELATES_TO },
      { sourceKey: 'NET-6', targetKey: 'UI-6', linkType: IssueLinkType.RELATES_TO },
      { sourceKey: 'NET-7', targetKey: 'INFRA-4', linkType: IssueLinkType.BLOCKS },

      // MON monitors & relates
      { sourceKey: 'MON-2', targetKey: 'CORE-3', linkType: IssueLinkType.RELATES_TO },
      { sourceKey: 'MON-4', targetKey: 'INFRA-2', linkType: IssueLinkType.IS_BLOCKED_BY },
      { sourceKey: 'MON-6', targetKey: 'INFRA-5', linkType: IssueLinkType.RELATES_TO },
    ];

    let count = 0;
    for (const item of rawLinks) {
      const source = issues[item.sourceKey];
      const target = issues[item.targetKey];

      if (!source || !target) continue;

      const link = this.issueLinkRepository.create({
        sourceIssueId: source.id,
        sourceIssue: source,
        targetIssueId: target.id,
        targetIssue: target,
        linkType: item.linkType,
      });

      await this.issueLinkRepository.save(link);
      count++;
    }

    return count;
  }

  private async seedWorklogs(
    issues: Record<string, Issue>,
    users: Record<string, User>,
  ): Promise<number> {
    const formatLocalDate = (d: Date): string => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const now = new Date();

    // Generate dates across the current week and previous 3 weeks
    const getDateOffset = (daysAgo: number): string => {
      const d = new Date(now);
      d.setDate(d.getDate() - daysAgo);
      return formatLocalDate(d);
    };

    const rawWorklogs: Array<{
      issueKey: string;
      userKey: string;
      hours: number;
      dateLogged: string;
      description: string;
    }> = [
      // Today (0 days ago)
      { issueKey: 'UI-5', userKey: 'volodymyr', hours: 4.0, dateLogged: getDateOffset(0), description: 'Designed WebSocket state synchronizer and board update dispatchers' },
      { issueKey: 'UI-6', userKey: 'olena', hours: 3.5, dateLogged: getDateOffset(0), description: 'Integrated PopperJS hover tooltip in Timesheet matrix day cells' },
      { issueKey: 'CORE-2', userKey: 'taras', hours: 6.0, dateLogged: getDateOffset(0), description: 'Implemented row-level pessimistic locking in token refresh service' },
      { issueKey: 'CORE-5', userKey: 'rachel', hours: 4.0, dateLogged: getDateOffset(0), description: 'Configured SeaweedFS volume streaming buffer endpoint' },
      { issueKey: 'MON-2', userKey: 'kevin', hours: 4.5, dateLogged: getDateOffset(0), description: 'Instrumented OpenTelemetry trace spans in incoming request interceptors' },
      { issueKey: 'MON-6', userKey: 'noah', hours: 5.0, dateLogged: getDateOffset(0), description: 'Configured Promtail DaemonSet to parse structured JSON log lines' },
      { issueKey: 'INFRA-2', userKey: 'chloe', hours: 5.0, dateLogged: getDateOffset(0), description: 'Configured Redis Sentinel quorum configuration on cluster nodes' },
      { issueKey: 'INFRA-3', userKey: 'andrii', hours: 4.0, dateLogged: getDateOffset(0), description: 'Drafted S3 lifecycle policies for Postgres WAL backup retention' },
      { issueKey: 'NET-3', userKey: 'maxim', hours: 3.5, dateLogged: getDateOffset(0), description: 'Added sliding window rate limiting for authentication challenge tokens' },
      { issueKey: 'NET-6', userKey: 'ryan', hours: 4.0, dateLogged: getDateOffset(0), description: 'Constructed CSP nonce injector middleware for server-rendered HTML' },

      // Yesterday (1 day ago)
      { issueKey: 'UI-3', userKey: 'daniel', hours: 5.0, dateLogged: getDateOffset(1), description: 'Wired J/K keyboard shortcut handlers and focus trap logic' },
      { issueKey: 'UI-4', userKey: 'lucas', hours: 4.0, dateLogged: getDateOffset(1), description: 'Axe-core automated accessibility audits on surface container tokens' },
      { issueKey: 'UI-6', userKey: 'sonya', hours: 4.5, dateLogged: getDateOffset(1), description: 'Created day cell interactive hover preview component & styling' },
      { issueKey: 'CORE-3', userKey: 'marcus', hours: 7.0, dateLogged: getDateOffset(1), description: 'Built inverted index document generator for full-text search' },
      { issueKey: 'CORE-4', userKey: 'dmitry', hours: 4.0, dateLogged: getDateOffset(1), description: 'Wrote unit tests for webhook signature HMAC-SHA256 generator' },
      { issueKey: 'MON-3', userKey: 'yuliia', hours: 6.0, dateLogged: getDateOffset(1), description: 'Constructed Grafana panels for database connection pool wait durations' },
      { issueKey: 'MON-4', userKey: 'ethan', hours: 3.5, dateLogged: getDateOffset(1), description: 'Configured PagerDuty on-call webhook payload templates' },
      { issueKey: 'INFRA-4', userKey: 'victor', hours: 3.0, dateLogged: getDateOffset(1), description: 'Audited Alpine Linux base image packages for minimal CVE surface' },
      { issueKey: 'NET-2', userKey: 'arthur', hours: 4.0, dateLogged: getDateOffset(1), description: 'Hardened cipher suites to TLS_AES_256_GCM_SHA384 and TLS_CHACHA20_POLY1305' },
      { issueKey: 'NET-4', userKey: 'grace', hours: 3.0, dateLogged: getDateOffset(1), description: 'Ran cryptographic entropy validation tests against /dev/urandom output' },

      // 2 days ago
      { issueKey: 'UI-5', userKey: 'volodymyr', hours: 8.0, dateLogged: getDateOffset(2), description: 'Refactored sprint kanban live board drag event listeners' },
      { issueKey: 'UI-3', userKey: 'daniel', hours: 4.0, dateLogged: getDateOffset(2), description: 'Added ESC key listener to dismiss open detail panels' },
      { issueKey: 'CORE-4', userKey: 'dmitry', hours: 6.5, dateLogged: getDateOffset(2), description: 'Implemented exponential backoff retry queue with dead letter exchange' },
      { issueKey: 'CORE-2', userKey: 'taras', hours: 4.0, dateLogged: getDateOffset(2), description: 'Benchmarked row-locking overhead under 500 concurrent token refreshes' },
      { issueKey: 'INFRA-3', userKey: 'andrii', hours: 5.5, dateLogged: getDateOffset(2), description: 'Terraform script for automated WAL archive uploads to S3 bucket' },
      { issueKey: 'INFRA-2', userKey: 'david', hours: 3.5, dateLogged: getDateOffset(2), description: 'Architecture review of Redis failover switchover thresholds' },
      { issueKey: 'MON-4', userKey: 'noah', hours: 4.0, dateLogged: getDateOffset(2), description: 'Configured Alertmanager routing tree for severity critical alarms' },
      { issueKey: 'MON-2', userKey: 'kevin', hours: 5.0, dateLogged: getDateOffset(2), description: 'Added baggage header propagation for user ID and tenant context' },
      { issueKey: 'NET-4', userKey: 'oksana', hours: 3.0, dateLogged: getDateOffset(2), description: 'Validated crypto.randomBytes entropy generation for TOTP secrets' },
      { issueKey: 'NET-3', userKey: 'maxim', hours: 4.5, dateLogged: getDateOffset(2), description: 'Simulated brute-force login attack on staging environment' },

      // 3 days ago
      { issueKey: 'UI-1', userKey: 'sonya', hours: 6.0, dateLogged: getDateOffset(3), description: 'Adjusted Kanban column width calculations for 4K ultrawide viewports' },
      { issueKey: 'UI-4', userKey: 'sophia', hours: 2.0, dateLogged: getDateOffset(3), description: 'Created automated Cypress test suite for theme contrast verification' },
      { issueKey: 'CORE-1', userKey: 'marcus', hours: 4.0, dateLogged: getDateOffset(3), description: 'Created composite index on login audit log table' },
      { issueKey: 'CORE-3', userKey: 'alex', hours: 3.0, dateLogged: getDateOffset(3), description: 'Reviewed query parser architecture for search indexing' },
      { issueKey: 'MON-1', userKey: 'ethan', hours: 5.0, dateLogged: getDateOffset(3), description: 'Configured Prometheus scrape job and metric exposition endpoint' },
      { issueKey: 'MON-3', userKey: 'sarah', hours: 3.5, dateLogged: getDateOffset(3), description: 'Defined SLI metrics for database query latency percentiles' },
      { issueKey: 'INFRA-1', userKey: 'brandon', hours: 7.0, dateLogged: getDateOffset(3), description: 'Deployed NGINX Ingress controller in Kubernetes staging namespace' },
      { issueKey: 'NET-1', userKey: 'ryan', hours: 4.0, dateLogged: getDateOffset(3), description: 'Implemented Cloudflare Turnstile token validation fallback handler' },
      { issueKey: 'NET-6', userKey: 'elena', hours: 2.5, dateLogged: getDateOffset(3), description: 'Drafted company-wide CSP policy specifications' },

      // 4 days ago
      { issueKey: 'UI-2', userKey: 'lucas', hours: 5.0, dateLogged: getDateOffset(4), description: 'Fixed iOS Safari backdrop filter blur opacity bug' },
      { issueKey: 'UI-3', userKey: 'daniel', hours: 4.0, dateLogged: getDateOffset(4), description: 'Drafted unit tests for keyboard navigation state machine' },
      { issueKey: 'CORE-2', userKey: 'taras', hours: 3.5, dateLogged: getDateOffset(4), description: 'Conducted load test on concurrent token refresh requests' },
      { issueKey: 'CORE-5', userKey: 'rachel', hours: 5.0, dateLogged: getDateOffset(4), description: 'Built SeaweedFS client adapter with connection retries' },
      { issueKey: 'INFRA-2', userKey: 'chloe', hours: 6.0, dateLogged: getDateOffset(4), description: 'Tested Redis cluster split-brain auto-healing scenarios' },
      { issueKey: 'MON-2', userKey: 'kevin', hours: 4.0, dateLogged: getDateOffset(4), description: 'Added Jaeger span tags for database query execution' },
      { issueKey: 'NET-2', userKey: 'arthur', hours: 5.0, dateLogged: getDateOffset(4), description: 'Ran SSL Labs scan against staging environment' },

      // 5 to 7 days ago (Week 1 of active sprint)
      { issueKey: 'MON-2', userKey: 'kevin', hours: 6.0, dateLogged: getDateOffset(5), description: 'Integrated OpenTelemetry trace context propagation across services' },
      { issueKey: 'INFRA-2', userKey: 'chloe', hours: 8.0, dateLogged: getDateOffset(5), description: 'Benchmarked Redis Sentinel failover switch times under load' },
      { issueKey: 'UI-5', userKey: 'volodymyr', hours: 6.0, dateLogged: getDateOffset(5), description: 'Drafted WebSocket room subscription protocol for sprint boards' },
      { issueKey: 'CORE-3', userKey: 'marcus', hours: 5.5, dateLogged: getDateOffset(6), description: 'Configured Lucene tokenizers and lowercase filter chain' },
      { issueKey: 'NET-3', userKey: 'maxim', hours: 4.5, dateLogged: getDateOffset(6), description: 'Audited authentication endpoints for brute-force vulnerability' },
      { issueKey: 'CORE-3', userKey: 'marcus', hours: 7.5, dateLogged: getDateOffset(7), description: 'Implemented Lucene query parser and token filter pipeline' },
      { issueKey: 'UI-5', userKey: 'volodymyr', hours: 6.0, dateLogged: getDateOffset(7), description: 'Engineered optimistic UI card moving logic on drag drop' },
      { issueKey: 'INFRA-3', userKey: 'andrii', hours: 4.0, dateLogged: getDateOffset(7), description: 'Wrote automated Postgres backup restore verification test' },

      // 8 to 14 days ago (Previous Sprint / Week 2)
      { issueKey: 'INFRA-4', userKey: 'victor', hours: 4.0, dateLogged: getDateOffset(8), description: 'Refactored Docker multi-stage build layers to reduce container image size' },
      { issueKey: 'MON-3', userKey: 'yuliia', hours: 3.0, dateLogged: getDateOffset(9), description: 'Added query execution latency histogram visualizers' },
      { issueKey: 'CORE-1', userKey: 'marcus', hours: 2.0, dateLogged: getDateOffset(10), description: 'Validated query plan using EXPLAIN ANALYZE on audit table' },
      { issueKey: 'UI-1', userKey: 'sonya', hours: 4.0, dateLogged: getDateOffset(11), description: 'Created flexbox swimlane grid responsive breakpoints' },
      { issueKey: 'UI-2', userKey: 'sophia', hours: 3.0, dateLogged: getDateOffset(12), description: 'Reproduced Safari backdrop filter glitch on iPhone 14 test device' },
      { issueKey: 'INFRA-1', userKey: 'david', hours: 5.0, dateLogged: getDateOffset(12), description: 'Reviewed Ingress controller architecture and TLS cert-manager specs' },
      { issueKey: 'NET-1', userKey: 'ryan', hours: 4.0, dateLogged: getDateOffset(13), description: 'Wired Cloudflare Turnstile frontend widget callback handlers' },
      { issueKey: 'MON-1', userKey: 'ethan', hours: 4.5, dateLogged: getDateOffset(14), description: 'Defined Prometheus latency buckets: 10ms, 50ms, 100ms, 250ms, 1s' },
      { issueKey: 'CORE-9', userKey: 'dmitry', hours: 6.0, dateLogged: getDateOffset(14), description: 'Decorated all REST API controllers with Swagger ApiOperation tags' },

      // 15 to 21 days ago (Sprint 1 foundation / Week 3)
      { issueKey: 'INFRA-7', userKey: 'brandon', hours: 4.0, dateLogged: getDateOffset(15), description: 'Configured Kubernetes HPA manifest for auto-scaling' },
      { issueKey: 'MON-7', userKey: 'ethan', hours: 4.0, dateLogged: getDateOffset(16), description: 'Configured Blackbox exporter probe for domain SSL cert monitor' },
      { issueKey: 'CORE-9', userKey: 'alex', hours: 3.0, dateLogged: getDateOffset(17), description: 'Approved Swagger documentation generation schema' },
      { issueKey: 'UI-1', userKey: 'lucas', hours: 4.0, dateLogged: getDateOffset(18), description: 'CSS Grid swimlane column styling and horizontal scrollbar polish' },
      { issueKey: 'INFRA-1', userKey: 'brandon', hours: 6.0, dateLogged: getDateOffset(19), description: 'Configured cert-manager ClusterIssuer with Let\'s Encrypt production endpoint' },
      { issueKey: 'NET-1', userKey: 'elena', hours: 3.5, dateLogged: getDateOffset(20), description: 'Penetration testing on Turnstile bypass vectors' },
      { issueKey: 'CORE-1', userKey: 'marcus', hours: 5.0, dateLogged: getDateOffset(21), description: 'Initial schema migration for login_audit_logs index' },
    ];

    let count = 0;
    const issueLoggedHoursAccumulator: Record<number, number> = {};

    for (const item of rawWorklogs) {
      const issue = issues[item.issueKey];
      const user = users[item.userKey];

      if (!issue || !user) continue;

      const worklog = this.worklogRepository.create({
        issueId: issue.id,
        issue,
        userId: user.id,
        user,
        timeSpentHours: item.hours,
        dateLogged: item.dateLogged,
        description: item.description,
      });

      await this.worklogRepository.save(worklog);
      issueLoggedHoursAccumulator[issue.id] = (issueLoggedHoursAccumulator[issue.id] || 0) + item.hours;
      count++;
    }

    // Update aggregated loggedHours on issues
    for (const [issueIdStr, totalHours] of Object.entries(issueLoggedHoursAccumulator)) {
      await this.issueRepository.update(Number(issueIdStr), {
        loggedHours: totalHours,
      });
    }

    return count;
  }

  private async seedComments(
    issues: Record<string, Issue>,
    users: Record<string, User>,
  ): Promise<number> {
    const rawComments: Array<{
      issueKey: string;
      userKey: string;
      text: string;
    }> = [
      { issueKey: 'UI-5', userKey: 'sonya', text: 'WebSocket connection pooling verified in Chrome and Safari. The optimistic drag drop feels instantaneous!' },
      { issueKey: 'UI-5', userKey: 'volodymyr', text: 'Added debounce logic to prevent flooding socket channels during rapid card dragging.' },
      { issueKey: 'UI-6', userKey: 'volodymyr', text: 'The interactive day-hover tooltip in the Timesheet matrix works smoothly! Shows all ticket breakdowns.' },
      { issueKey: 'UI-6', userKey: 'olena', text: 'Added ESC key listener and viewport edge collision detection so the tooltip never clips outside the screen.' },
      { issueKey: 'CORE-2', userKey: 'alex', text: 'Please ensure row-level locking includes timeout configuration to avoid deadlocks.' },
      { issueKey: 'CORE-2', userKey: 'taras', text: 'Implemented 2000ms lock timeout with automatic retry on serialization failure.' },
      { issueKey: 'CORE-5', userKey: 'alex', text: 'SeaweedFS master volume failover tested. Storage volume writes automatically redirect on node failure.' },
      { issueKey: 'MON-2', userKey: 'sarah', text: 'Trace context propagation is working across all downstream RPCs. Ready for staging deploy.' },
      { issueKey: 'INFRA-2', userKey: 'david', text: 'Redis Sentinel failover switch tested under simulated network partition. Recovered in under 1.2s.' },
      { issueKey: 'NET-3', userKey: 'elena', text: 'Security review approved. Rate limiting rules successfully mitigated brute force token guessing.' },
      { issueKey: 'NET-6', userKey: 'maxim', text: 'Strict CSP policy passed automated XSS penetration tests. No inline script violations found.' },
    ];

    let count = 0;
    for (const item of rawComments) {
      const issue = issues[item.issueKey];
      const user = users[item.userKey];

      if (!issue || !user) continue;

      const comment = this.commentRepository.create({
        issueId: issue.id,
        issue,
        authorId: user.id,
        author: user,
        text: item.text,
      });

      await this.commentRepository.save(comment);
      count++;
    }

    return count;
  }
}
