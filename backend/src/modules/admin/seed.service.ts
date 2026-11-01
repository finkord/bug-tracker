import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { ARGON2_OPTIONS } from '../auth/constants/argon2.constants.js';
import { User, SystemRole, OAuthProvider } from '../users/entities/user.entity.js';
import { Project } from '../projects/entities/project.entity.js';
import { Issue, IssueType, IssueStatus, IssuePriority } from '../issues/entities/issue.entity.js';
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
import { faker } from '@faker-js/faker';
import { Sprint, SprintStatus } from '../sprints/entities/sprint.entity.js';
import { Team } from '../teams/entities/team.entity.js';
import { TeamMember, TeamMemberRole } from '../teams/entities/team-member.entity.js';
import { ProjectComponent } from '../projects/entities/project-component.entity.js';
import { ProjectVersion, ProjectVersionStatus } from '../projects/entities/project-version.entity.js';
import { ProjectQuickFilter } from '../projects/entities/quick-filter.entity.js';
import { VcsPullRequest, VcsProvider, VcsPullRequestStatus } from '../vcs/entities/vcs-pull-request.entity.js';
import { ProjectWebhook } from '../webhooks/entities/project-webhook.entity.js';
import { IssueHistory } from '../issues/entities/issue-history.entity.js';
import { Notification, NotificationType } from '../notifications/entities/notification.entity.js';
import { SavedFilter } from '../users/entities/saved-filter.entity.js';

export interface SeedOptions {
  clean?: boolean;
  usersCount?: number;
  projectsCount?: number;
  sprintsCount?: number;
  issuesCount?: number;
  seedNumber?: number;
}

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(TeamMember)
    private readonly teamMemberRepository: Repository<TeamMember>,
    @InjectRepository(Sprint)
    private readonly sprintRepository: Repository<Sprint>,
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
    @Optional()
    @InjectRepository(ProjectComponent)
    private readonly componentRepository?: Repository<ProjectComponent>,
    @Optional()
    @InjectRepository(ProjectVersion)
    private readonly versionRepository?: Repository<ProjectVersion>,
    @Optional()
    @InjectRepository(ProjectQuickFilter)
    private readonly quickFilterRepository?: Repository<ProjectQuickFilter>,
    @Optional()
    @InjectRepository(VcsPullRequest)
    private readonly vcsPrRepository?: Repository<VcsPullRequest>,
    @Optional()
    @InjectRepository(ProjectWebhook)
    private readonly webhookRepository?: Repository<ProjectWebhook>,
    @Optional()
    @InjectRepository(IssueHistory)
    private readonly historyRepository?: Repository<IssueHistory>,
    @Optional()
    @InjectRepository(Notification)
    private readonly notificationRepository?: Repository<Notification>,
    @Optional()
    @InjectRepository(SavedFilter)
    private readonly savedFilterRepository?: Repository<SavedFilter>,
  ) {}

  /**
   * Cleans existing records and seeds realistic multi-team engineering dataset.
   * Can scale to 100-500+ users, configurable projects, teams, sprints and issues.
   */
  async runSeed(options: SeedOptions = { clean: true }): Promise<{
    projectsCount: number;
    usersCount: number;
    issuesCount: number;
    linksCount: number;
    worklogsCount: number;
    commentsCount: number;
    groupsCount: number;
    rolesCount: number;
    schemesCount: number;
    teamsCount: number;
  }> {
    const isClean = options.clean ?? true;
    const targetUsersCount = Math.max(options.usersCount ?? 30, 6);
    const targetProjectsCount = Math.max(options.projectsCount ?? 5, 2);
    const sprintsPerProject = Math.max(options.sprintsCount ? Math.ceil(options.sprintsCount / targetProjectsCount) : 3, 1);
    const targetIssuesCount = Math.max(options.issuesCount ?? (targetUsersCount * 4), 30);
    const seedNumber = options.seedNumber ?? 42;

    faker.seed(seedNumber);
    this.logger.log(`Starting scalable data seeding (Target: ${targetUsersCount} users, ${targetProjectsCount} projects, ${targetIssuesCount} issues)...`);

    if (isClean) {
      this.logger.log('Cleaning existing database records...');
      await this.cleanDatabase();
    }

    // 1. Password hashing for all seed accounts (precomputed once for high-throughput batching)
    const defaultPasswordHash = await argon2.hash('Password123!', ARGON2_OPTIONS);

    // 2. Create Users (core engineers + scalable faker users up to targetUsersCount)
    const usersMap = await this.seedUsers(defaultPasswordHash, targetUsersCount);
    this.logger.log(`Seeded ${Object.keys(usersMap).length} engineers and leads.`);

    // 3. Create Projects (core 5 workspaces + dynamic projects up to targetProjectsCount)
    const projectsMap = await this.seedProjects(usersMap, targetProjectsCount);
    this.logger.log(`Seeded ${Object.keys(projectsMap).length} projects.`);

    // 4. Create Agile Teams & Team Memberships
    const teamsCount = await this.seedTeams(usersMap, projectsMap);
    this.logger.log(`Seeded ${teamsCount} engineering teams with leads and members.`);

    // 5. Create RBAC Foundation (Groups, Roles, Schemes, Grants, Security Levels, Project Actors)
    const rbacStats = await this.seedRbacStructure(usersMap, projectsMap);
    this.logger.log(`Seeded RBAC: ${rbacStats.groupsCount} groups, ${rbacStats.rolesCount} roles, ${rbacStats.schemesCount} schemes, ${rbacStats.grantsCount} grants.`);

    // 6. Create Sprints, Issues & Backlogs
    const issuesMap = await this.seedIssues(projectsMap, usersMap, targetIssuesCount, sprintsPerProject);
    this.logger.log(`Seeded ${Object.keys(issuesMap).length} realistic tickets across sprints and backlogs.`);

    // 7. Create Cross-Team Issue Dependencies
    const linksCount = await this.seedIssueLinks(issuesMap);
    this.logger.log(`Seeded ${linksCount} cross-project issue dependencies.`);

    // 8. Create Worklogs & Timesheet Distribution
    const worklogsCount = await this.seedWorklogs(issuesMap, usersMap);
    this.logger.log(`Seeded ${worklogsCount} worklogs across current and previous weeks.`);

    // 9. Create Issue Comments & PR discussions
    const commentsCount = await this.seedComments(issuesMap, usersMap);
    this.logger.log(`Seeded ${commentsCount} issue comments.`);

    // 10. Seed Extended Domain Entities (Components, Versions, QuickFilters, VCS PRs, Webhooks, Histories, Notifications, SavedFilters)
    await this.seedExtendedDomainEntities(projectsMap, usersMap, issuesMap);
    this.logger.log('Seeded extended domain entities (components, versions, quick filters, VCS pull requests, webhooks, histories, notifications, saved filters).');

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
      teamsCount,
    };
  }

  private async cleanDatabase() {
    // Delete in dependency order including extended domain tables
    if (this.notificationRepository) {
      await this.notificationRepository.createQueryBuilder().delete().from(Notification).execute();
    }
    if (this.historyRepository) {
      await this.historyRepository.createQueryBuilder().delete().from(IssueHistory).execute();
    }
    if (this.vcsPrRepository) {
      await this.vcsPrRepository.createQueryBuilder().delete().from(VcsPullRequest).execute();
    }
    if (this.webhookRepository) {
      await this.webhookRepository.createQueryBuilder().delete().from(ProjectWebhook).execute();
    }
    if (this.savedFilterRepository) {
      await this.savedFilterRepository.createQueryBuilder().delete().from(SavedFilter).execute();
    }
    if (this.quickFilterRepository) {
      await this.quickFilterRepository.createQueryBuilder().delete().from(ProjectQuickFilter).execute();
    }
    if (this.versionRepository) {
      await this.versionRepository.createQueryBuilder().delete().from(ProjectVersion).execute();
    }
    if (this.componentRepository) {
      await this.componentRepository.createQueryBuilder().delete().from(ProjectComponent).execute();
    }
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
    await this.teamMemberRepository.createQueryBuilder().delete().from(TeamMember).execute();
    await this.teamRepository.createQueryBuilder().delete().from(Team).execute();
    await this.sprintRepository.createQueryBuilder().delete().from(Sprint).execute();
    await this.projectRepository.createQueryBuilder().delete().from(Project).execute();
    await this.userRepository.createQueryBuilder().delete().from(User).execute();
  }

  private async seedUsers(passwordHash: string, targetCount = 30): Promise<Record<string, User>> {
    const rawUsers: Array<{
      key: string;
      fullName: string;
      email: string;
      systemRole: SystemRole;
      jobTitle: string;
      avatarUrl?: string;
    }> = [
      // Administrators
      { key: 'admin', fullName: 'System Administrator', email: 'admin@bugtracker.local', systemRole: SystemRole.ADMIN, jobTitle: 'Chief System Administrator' },

      // UI / Frontend Team
      { key: 'volodymyr', fullName: 'Volodymyr Fufalko', email: 'volodymyr@bugtracker.local', systemRole: SystemRole.ADMIN, jobTitle: 'Principal Frontend Architect' },
      { key: 'sonya', fullName: 'Sonya Saparava', email: 'sonya@bugtracker.local', systemRole: SystemRole.USER, jobTitle: 'Senior UI/UX Engineer' },
      { key: 'olena', fullName: 'Olena Melnyk', email: 'olena@bugtracker.local', systemRole: SystemRole.USER, jobTitle: 'Design Systems Developer' },
      { key: 'daniel', fullName: 'Daniel Kim', email: 'daniel.kim@bugtracker.local', systemRole: SystemRole.USER, jobTitle: 'Frontend Engineer' },
      { key: 'sophia', fullName: 'Sophia Martinez', email: 'sophia.m@bugtracker.local', systemRole: SystemRole.USER, jobTitle: 'Lead QA Automation Engineer' },
      { key: 'lucas', fullName: 'Lucas Weber', email: 'lucas.w@bugtracker.local', systemRole: SystemRole.USER, jobTitle: 'Accessibility & CSS Specialist' },

      // CORE / Platform Team
      { key: 'alex', fullName: 'Alex Mercer', email: 'alex.mercer@bugtracker.local', systemRole: SystemRole.USER, jobTitle: 'Core Platform Engineering Lead' },
      { key: 'marcus', fullName: 'Marcus Vance', email: 'marcus.v@bugtracker.local', systemRole: SystemRole.USER, jobTitle: 'Senior Backend Engineer (Postgres/ORM)' },
      { key: 'taras', fullName: 'Taras Shevchenko', email: 'taras.sh@bugtracker.local', systemRole: SystemRole.USER, jobTitle: 'Distributed Systems Engineer' },
      { key: 'rachel', fullName: 'Rachel Green', email: 'rachel.g@bugtracker.local', systemRole: SystemRole.USER, jobTitle: 'Backend Security & Auth Engineer' },
      { key: 'dmitry', fullName: 'Dmitry Volkov', email: 'dmitry.v@bugtracker.local', systemRole: SystemRole.USER, jobTitle: 'API Gateway & GraphQL Specialist' },
      { key: 'liam', fullName: 'Liam O\'Connor', email: 'liam.oc@bugtracker.local', systemRole: SystemRole.USER, jobTitle: 'Backend QA & Performance Tester' },

      // MONOPS / Observability Team
      { key: 'sarah', fullName: 'Sarah Chen', email: 'sarah.chen@bugtracker.local', systemRole: SystemRole.USER, jobTitle: 'Lead SRE & Observability Architect' },
      { key: 'ethan', fullName: 'Ethan Davis', email: 'ethan.davis@bugtracker.local', systemRole: SystemRole.USER, jobTitle: 'Prometheus & Alertmanager Specialist' },
      { key: 'yuliia', fullName: 'Yuliia Kovalenko', email: 'yuliia.k@bugtracker.local', systemRole: SystemRole.USER, jobTitle: 'Grafana & Telemetry Dashboard Engineer' },
      { key: 'kevin', fullName: 'Kevin Zhang', email: 'kevin.zhang@bugtracker.local', systemRole: SystemRole.USER, jobTitle: 'OpenTelemetry Trace Instrumentation Dev' },
      { key: 'maya', fullName: 'Maya Patel', email: 'maya.patel@bugtracker.local', systemRole: SystemRole.USER, jobTitle: 'Chaos Engineering & Reliability QA' },
      { key: 'noah', fullName: 'Noah Garcia', email: 'noah.g@bugtracker.local', systemRole: SystemRole.USER, jobTitle: 'Logs & Elasticsearch Engineer' },

      // INFRAOPS / Cloud Platform Team
      { key: 'david', fullName: 'David Miller', email: 'david.miller@bugtracker.local', systemRole: SystemRole.USER, jobTitle: 'Principal Cloud Platform Architect' },
      { key: 'brandon', fullName: 'Brandon Lee', email: 'brandon.lee@bugtracker.local', systemRole: SystemRole.USER, jobTitle: 'Kubernetes Cluster Administrator' },
      { key: 'andrii', fullName: 'Andrii Boyko', email: 'andrii.b@bugtracker.local', systemRole: SystemRole.USER, jobTitle: 'Terraform & Infrastructure-as-Code Dev' },
      { key: 'chloe', fullName: 'Chloe Dubois', email: 'chloe.dubois@bugtracker.local', systemRole: SystemRole.USER, jobTitle: 'Redis & DB Cluster Ops Engineer' },
      { key: 'victor', fullName: 'Victor Stone', email: 'victor.stone@bugtracker.local', systemRole: SystemRole.USER, jobTitle: 'CI/CD Pipeline Automation Specialist' },
      { key: 'benjamin', fullName: 'Benjamin Taylor', email: 'benjamin.t@bugtracker.local', systemRole: SystemRole.USER, jobTitle: 'Infrastructure Integration QA' },

      // NETOPS / Security Operations Team
      { key: 'elena', fullName: 'Elena Rostova', email: 'elena.rostova@bugtracker.local', systemRole: SystemRole.USER, jobTitle: 'Head of Information Security' },
      { key: 'maxim', fullName: 'Maxim Petrov', email: 'maxim.petrov@bugtracker.local', systemRole: SystemRole.USER, jobTitle: 'Application Security & Penetration Tester' },
      { key: 'ryan', fullName: 'Ryan Murphy', email: 'ryan.murphy@bugtracker.local', systemRole: SystemRole.USER, jobTitle: 'Cloudflare Edge & WAF Specialist' },
      { key: 'oksana', fullName: 'Oksana Bondarenko', email: 'oksana.b@bugtracker.local', systemRole: SystemRole.USER, jobTitle: 'Identity & Access Management (IAM) Dev' },
      { key: 'arthur', fullName: 'Arthur Pendelton', email: 'arthur.p@bugtracker.local', systemRole: SystemRole.USER, jobTitle: 'Network Security & Firewall Engineer' },
      { key: 'grace', fullName: 'Grace Hopper', email: 'grace.h@bugtracker.local', systemRole: SystemRole.USER, jobTitle: 'Compliance & Cryptographic Auditor' },
    ];

    const result: Record<string, User> = {};

    // 1. Save core seed engineers
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

    // 2. Generate scalable realistic users if targetCount > rawUsers.length
    const remainingToGenerate = Math.max(0, targetCount - rawUsers.length);
    if (remainingToGenerate > 0) {
      const rolesPool = [
        'Full Stack Engineer',
        'Senior Frontend Developer',
        'Backend Microservices Developer',
        'DevOps & Kubernetes Engineer',
        'QA Automation Engineer',
        'Site Reliability Engineer',
        'Cloud Infrastructure Engineer',
        'Database Reliability Specialist',
        'Security Operations Analyst',
        'UI/UX Design Systems Engineer',
      ];

      const additionalUsers: User[] = [];
      for (let i = 1; i <= remainingToGenerate; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const fullName = `${firstName} ${lastName}`;
        const email = `user${i}.${faker.internet.username().toLowerCase()}@bugtracker.local`;
        const jobTitle = faker.helpers.arrayElement(rolesPool);
        const avatarUrl = faker.image.avatarGitHub();

        const user = this.userRepository.create({
          fullName,
          email,
          passwordHash,
          systemRole: SystemRole.USER,
          jobTitle,
          avatarUrl,
          isActivated: true,
          oauthProvider: OAuthProvider.LOCAL,
        });
        additionalUsers.push(user);
      }

      // Batch save in chunks of 50
      for (let i = 0; i < additionalUsers.length; i += 50) {
        const chunk = additionalUsers.slice(i, i + 50);
        const savedChunk = await this.userRepository.save(chunk);
        for (let j = 0; j < savedChunk.length; j++) {
          result[`gen_user_${i + j + 1}`] = savedChunk[j];
        }
      }
    }

    return result;
  }

  private async seedProjects(users: Record<string, User>, targetCount = 5): Promise<Record<string, Project>> {
    const rawProjects = [
      {
        key: 'UI',
        name: 'Web UI & Design Systems',
        description: 'Frontend client interfaces, Kanban canvas, responsive layouts, and Material 3 design system.',
        lead: users['volodymyr'] || Object.values(users)[0],
      },
      {
        key: 'CORE',
        name: 'Core Platform & Domain Engine',
        description: 'Business logic, NestJS modules, TypeORM database schema, JWT auth, and Lucene search indexing.',
        lead: users['alex'] || Object.values(users)[0],
      },
      {
        key: 'MON',
        name: 'Observability & Telemetry',
        description: 'Prometheus metrics scrapers, OpenTelemetry distributed tracing, Grafana alerts, and health monitors.',
        lead: users['sarah'] || Object.values(users)[0],
      },
      {
        key: 'INFRA',
        name: 'Cloud Infrastructure & DevOps',
        description: 'Kubernetes cluster deployments, Terraform scripts, Docker containers, and Redis session stores.',
        lead: users['david'] || Object.values(users)[0],
      },
      {
        key: 'NET',
        name: 'Network Security & Edge Operations',
        description: 'Cloudflare Turnstile captcha integration, TLS 1.3 encryption, DDoS mitigation, and RBAC firewall rules.',
        lead: users['elena'] || Object.values(users)[0],
      },
    ];

    const extraProjectTemplates = [
      { key: 'PAY', name: 'Billing & Payment Orchestration', description: 'PCI-DSS compliant payment gateways, Stripe webhooks, subscriptions, and financial invoicing.' },
      { key: 'AUTH', name: 'Identity, OAuth & MFA Service', description: 'Centralized authentication service, Argon2 verification, RFC 6749 tokens, and session revocations.' },
      { key: 'ANALYT', name: 'Big Data & Realtime Analytics', description: 'ClickHouse OLAP ingestion pipelines, user telemetry aggregations, and business metrics dashboards.' },
      { key: 'MOBILE', name: 'Native iOS & Android Clients', description: 'SwiftUI and Jetpack Compose mobile applications, offline sync engines, and push notifications.' },
      { key: 'NOTIF', name: 'Omnichannel Notification Hub', description: 'Transactional emails via SMTP, WebSocket alerts, Discord/Slack webhooks, and SMS dispatchers.' },
      { key: 'SEARCH', name: 'Distributed Search & JQL Query', description: 'PostgreSQL full-text indexes, GIN search vectors, AST query parser, and rapid filters.' },
      { key: 'AI', name: 'AI Assistant & Copilot Gateway', description: 'LLM agents, vector embeddings, contextual code review suggestions, and automated bug deduplication.' },
      { key: 'DOCS', name: 'Developer Portal & Public API', description: 'OpenAPI 3.1 specifications, rate limit proxies, interactive SDK generation, and developer documentation.' },
      { key: 'SEC', name: 'Vulnerability Management & PenTesting', description: 'Static analysis tooling, automated dependency audits, OWASP ASVS verification, and secret scanning.' },
      { key: 'EDGE', name: 'Edge Caching & CDN Distribution', description: 'Global CDN edge compute handlers, Brotli compression, static asset delivery, and DDoS filters.' },
    ];

    const result: Record<string, Project> = {};
    const userValues = Object.values(users);

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

    const additionalNeeded = Math.max(0, targetCount - rawProjects.length);
    for (let i = 0; i < additionalNeeded; i++) {
      const template = extraProjectTemplates[i % extraProjectTemplates.length];
      const keySuffix = Math.floor(i / extraProjectTemplates.length) > 0 ? `${Math.floor(i / extraProjectTemplates.length) + 1}` : '';
      const uniqueKey = `${template.key}${keySuffix}`.slice(0, 10);
      const lead = userValues[(i + 5) % userValues.length];

      const project = this.projectRepository.create({
        key: uniqueKey,
        name: `${template.name}${keySuffix ? ` ${keySuffix}` : ''}`,
        description: template.description,
        leadId: lead.id,
        lead,
      });
      const saved = await this.projectRepository.save(project);
      result[uniqueKey] = saved;
    }

    return result;
  }

  private async seedTeams(
    users: Record<string, User>,
    projects: Record<string, Project>,
  ): Promise<number> {
    const userValues = Object.values(users);
    let teamCount = 0;

    const teamNames = [
      'Alpha Squad',
      'Bravo Explorers',
      'Delta Titans',
      'Phoenix Engine',
      'Nexus Forge',
      'Vanguard Operations',
      'Cyber Guardians',
      'Quantum Velocity',
      'Echo Flight',
      'Apex Pioneers',
    ];

    for (const [idx, project] of Object.values(projects).entries()) {
      const teamName = `${teamNames[idx % teamNames.length]} (${project.key})`;
      const lead = project.lead || userValues[idx % userValues.length];

      const team = this.teamRepository.create({
        name: teamName,
        description: `Dedicated agile engineering team delivering high-impact milestones for ${project.name}`,
        projectId: project.id,
        project,
        leadId: lead.id,
        lead,
        sprintCapacityHours: 160.0,
      });
      const savedTeam = await this.teamRepository.save(team);
      teamCount++;

      // Assign 4 to 8 members per team
      const memberCount = Math.min(8, Math.max(3, Math.floor(userValues.length / Object.keys(projects).length)));
      const teamMembers: TeamMember[] = [];

      for (let m = 0; m < memberCount; m++) {
        const userIndex = (idx * 5 + m) % userValues.length;
        const memberUser = userValues[userIndex];

        const role = m === 0 ? TeamMemberRole.SCRUM_MASTER
          : m === 1 ? TeamMemberRole.PRODUCT_OWNER
          : m % 3 === 0 ? TeamMemberRole.QA_ENGINEER
          : TeamMemberRole.DEVELOPER;

        teamMembers.push(
          this.teamMemberRepository.create({
            teamId: savedTeam.id,
            team: savedTeam,
            userId: memberUser.id,
            user: memberUser,
            role,
            weeklyCapacityHours: 40.0,
          }),
        );
      }

      await this.teamMemberRepository.save(teamMembers);
    }

    return teamCount;
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
        userKeys: ['admin', 'volodymyr', 'alex', 'sarah', 'david', 'elena'],
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
      { name: 'Project Lead', description: 'Sprint planning, backlog management, roadmap governance, and ticket assignments', isDefault: true },
      { name: 'Developer', description: 'Core contributors with permission to create, transition, log work, and edit sprint issues', isDefault: true },
      { name: 'Member', description: 'Project collaborators with issue creation and comment capabilities', isDefault: true },
      { name: 'Viewer', description: 'Read-only observers able to browse projects, view roadmaps, and search issues', isDefault: true },
    ];

    const rolesMap: Record<string, ProjectRole> = {};
    for (const r of rawRoles) {
      let role = await this.projectRoleRepository.findOne({ where: { name: r.name } });
      if (!role) {
        role = this.projectRoleRepository.create(r);
        role = await this.projectRoleRepository.save(role);
      }
      rolesMap[r.name] = role;
    }

    // 3. Create Default Agile Collaborative Scheme
    let defaultScheme = await this.schemeRepository.findOne({ where: { isDefault: true } });
    if (!defaultScheme) {
      defaultScheme = this.schemeRepository.create({
        name: 'Default Agile Collaborative Scheme',
        description: 'Standard enterprise agile collaborative permission matrix for engineering teams with role-decoupled access control.',
        isDefault: true,
      });
      defaultScheme = await this.schemeRepository.save(defaultScheme);
    } else if (defaultScheme.name !== 'Default Agile Collaborative Scheme') {
      defaultScheme.name = 'Default Agile Collaborative Scheme';
      defaultScheme.description = 'Standard enterprise agile collaborative permission matrix for engineering teams with role-decoupled access control.';
      defaultScheme = await this.schemeRepository.save(defaultScheme);
    }
    const savedScheme = defaultScheme;

    // 4. Create Standard Grants
    const rawGrants: Array<{
      permission: ProjectPermission;
      grantType: PermissionGrantType;
      roleName?: string;
      groupName?: string;
    }> = [
      // Project operations
      { permission: ProjectPermission.ADMINISTER_PROJECTS, grantType: PermissionGrantType.ROLE, roleName: 'Administrator' },
      { permission: ProjectPermission.ADMINISTER_PROJECTS, grantType: PermissionGrantType.ROLE, roleName: 'Project Lead' },
      { permission: ProjectPermission.ADMINISTER_PROJECTS, grantType: PermissionGrantType.LEAD },
      { permission: ProjectPermission.VIEW_ROADMAP, grantType: PermissionGrantType.GROUP, groupName: 'all-users' },
      { permission: ProjectPermission.VIEW_ROADMAP, grantType: PermissionGrantType.ROLE, roleName: 'Administrator' },
      { permission: ProjectPermission.VIEW_ROADMAP, grantType: PermissionGrantType.ROLE, roleName: 'Developer' },
      { permission: ProjectPermission.VIEW_ROADMAP, grantType: PermissionGrantType.ROLE, roleName: 'Viewer' },
      { permission: ProjectPermission.BROWSE_PROJECTS, grantType: PermissionGrantType.GROUP, groupName: 'all-users' },
      { permission: ProjectPermission.BROWSE_PROJECTS, grantType: PermissionGrantType.ROLE, roleName: 'Administrator' },
      { permission: ProjectPermission.BROWSE_PROJECTS, grantType: PermissionGrantType.ROLE, roleName: 'Developer' },
      { permission: ProjectPermission.BROWSE_PROJECTS, grantType: PermissionGrantType.ROLE, roleName: 'Viewer' },
      { permission: ProjectPermission.CREATE_ISSUES, grantType: PermissionGrantType.GROUP, groupName: 'all-users' },
      { permission: ProjectPermission.CREATE_ISSUES, grantType: PermissionGrantType.ROLE, roleName: 'Administrator' },
      { permission: ProjectPermission.CREATE_ISSUES, grantType: PermissionGrantType.ROLE, roleName: 'Developer' },

      // Issue operations
      { permission: ProjectPermission.EDIT_ISSUES, grantType: PermissionGrantType.ROLE, roleName: 'Developer' },
      { permission: ProjectPermission.EDIT_ISSUES, grantType: PermissionGrantType.ROLE, roleName: 'Administrator' },
      { permission: ProjectPermission.EDIT_ISSUES, grantType: PermissionGrantType.ROLE, roleName: 'Project Lead' },
      { permission: ProjectPermission.EDIT_ISSUES, grantType: PermissionGrantType.REPORTER },
      { permission: ProjectPermission.EDIT_ISSUES, grantType: PermissionGrantType.ASSIGNEE },
      { permission: ProjectPermission.ASSIGN_ISSUES, grantType: PermissionGrantType.ROLE, roleName: 'Developer' },
      { permission: ProjectPermission.ASSIGN_ISSUES, grantType: PermissionGrantType.ROLE, roleName: 'Administrator' },
      { permission: ProjectPermission.ASSIGN_ISSUES, grantType: PermissionGrantType.ROLE, roleName: 'Project Lead' },
      { permission: ProjectPermission.ASSIGNABLE_USER, grantType: PermissionGrantType.ROLE, roleName: 'Developer' },
      { permission: ProjectPermission.ASSIGNABLE_USER, grantType: PermissionGrantType.ROLE, roleName: 'Administrator' },
      { permission: ProjectPermission.ASSIGNABLE_USER, grantType: PermissionGrantType.ROLE, roleName: 'Project Lead' },
      { permission: ProjectPermission.TRANSITION_ISSUES, grantType: PermissionGrantType.ROLE, roleName: 'Developer' },
      { permission: ProjectPermission.TRANSITION_ISSUES, grantType: PermissionGrantType.ROLE, roleName: 'Administrator' },
      { permission: ProjectPermission.TRANSITION_ISSUES, grantType: PermissionGrantType.ROLE, roleName: 'Project Lead' },
      { permission: ProjectPermission.TRANSITION_ISSUES, grantType: PermissionGrantType.ASSIGNEE },
      { permission: ProjectPermission.MOVE_ISSUES, grantType: PermissionGrantType.ROLE, roleName: 'Developer' },
      { permission: ProjectPermission.MOVE_ISSUES, grantType: PermissionGrantType.ROLE, roleName: 'Administrator' },
      { permission: ProjectPermission.MOVE_ISSUES, grantType: PermissionGrantType.ROLE, roleName: 'Project Lead' },
      { permission: ProjectPermission.LOG_WORK, grantType: PermissionGrantType.ROLE, roleName: 'Developer' },
      { permission: ProjectPermission.LOG_WORK, grantType: PermissionGrantType.ROLE, roleName: 'Administrator' },
      { permission: ProjectPermission.LOG_WORK, grantType: PermissionGrantType.ROLE, roleName: 'Project Lead' },
      { permission: ProjectPermission.LOG_WORK, grantType: PermissionGrantType.ASSIGNEE },
      { permission: ProjectPermission.EDIT_OWN_WORKLOGS, grantType: PermissionGrantType.GROUP, groupName: 'all-users' },
      { permission: ProjectPermission.EDIT_OWN_WORKLOGS, grantType: PermissionGrantType.ROLE, roleName: 'Developer' },
      { permission: ProjectPermission.EDIT_OWN_WORKLOGS, grantType: PermissionGrantType.ROLE, roleName: 'Administrator' },
      { permission: ProjectPermission.DELETE_OWN_WORKLOGS, grantType: PermissionGrantType.GROUP, groupName: 'all-users' },
      { permission: ProjectPermission.DELETE_OWN_WORKLOGS, grantType: PermissionGrantType.ROLE, roleName: 'Developer' },
      { permission: ProjectPermission.DELETE_OWN_WORKLOGS, grantType: PermissionGrantType.ROLE, roleName: 'Administrator' },
      { permission: ProjectPermission.EDIT_ALL_WORKLOGS, grantType: PermissionGrantType.ROLE, roleName: 'Administrator' },
      { permission: ProjectPermission.EDIT_ALL_WORKLOGS, grantType: PermissionGrantType.ROLE, roleName: 'Project Lead' },
      { permission: ProjectPermission.DELETE_ALL_WORKLOGS, grantType: PermissionGrantType.ROLE, roleName: 'Administrator' },
      { permission: ProjectPermission.DELETE_ALL_WORKLOGS, grantType: PermissionGrantType.ROLE, roleName: 'Project Lead' },

      // Comments & Attachments
      { permission: ProjectPermission.ADD_COMMENTS, grantType: PermissionGrantType.GROUP, groupName: 'all-users' },
      { permission: ProjectPermission.ADD_COMMENTS, grantType: PermissionGrantType.ROLE, roleName: 'Developer' },
      { permission: ProjectPermission.ADD_COMMENTS, grantType: PermissionGrantType.ROLE, roleName: 'Administrator' },
      { permission: ProjectPermission.ADD_COMMENTS, grantType: PermissionGrantType.ROLE, roleName: 'Viewer' },
      { permission: ProjectPermission.EDIT_OWN_COMMENTS, grantType: PermissionGrantType.GROUP, groupName: 'all-users' },
      { permission: ProjectPermission.DELETE_OWN_COMMENTS, grantType: PermissionGrantType.GROUP, groupName: 'all-users' },
      { permission: ProjectPermission.EDIT_ALL_COMMENTS, grantType: PermissionGrantType.ROLE, roleName: 'Administrator' },
      { permission: ProjectPermission.EDIT_ALL_COMMENTS, grantType: PermissionGrantType.ROLE, roleName: 'Project Lead' },
      { permission: ProjectPermission.DELETE_ALL_COMMENTS, grantType: PermissionGrantType.ROLE, roleName: 'Administrator' },
      { permission: ProjectPermission.DELETE_ALL_COMMENTS, grantType: PermissionGrantType.ROLE, roleName: 'Project Lead' },
      { permission: ProjectPermission.CREATE_ATTACHMENTS, grantType: PermissionGrantType.GROUP, groupName: 'all-users' },
      { permission: ProjectPermission.CREATE_ATTACHMENTS, grantType: PermissionGrantType.ROLE, roleName: 'Developer' },
      { permission: ProjectPermission.CREATE_ATTACHMENTS, grantType: PermissionGrantType.ROLE, roleName: 'Administrator' },
      { permission: ProjectPermission.DELETE_OWN_ATTACHMENTS, grantType: PermissionGrantType.GROUP, groupName: 'all-users' },
      { permission: ProjectPermission.DELETE_ALL_ATTACHMENTS, grantType: PermissionGrantType.ROLE, roleName: 'Administrator' },
      { permission: ProjectPermission.DELETE_ALL_ATTACHMENTS, grantType: PermissionGrantType.ROLE, roleName: 'Project Lead' },

      // Lifecycle
      { permission: ProjectPermission.CLOSE_ISSUES, grantType: PermissionGrantType.ROLE, roleName: 'Developer' },
      { permission: ProjectPermission.CLOSE_ISSUES, grantType: PermissionGrantType.ROLE, roleName: 'Administrator' },
      { permission: ProjectPermission.CLOSE_ISSUES, grantType: PermissionGrantType.ROLE, roleName: 'Project Lead' },
      { permission: ProjectPermission.DELETE_ISSUES, grantType: PermissionGrantType.ROLE, roleName: 'Administrator' },
      { permission: ProjectPermission.DELETE_ISSUES, grantType: PermissionGrantType.ROLE, roleName: 'Project Lead' },
      { permission: ProjectPermission.DELETE_ISSUES, grantType: PermissionGrantType.REPORTER },
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
      const userList = Object.values(users);
      if (memberKeys.length > 0) {
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
      } else {
        // Dynamic project: allocate 5 developers
        for (let d = 0; d < Math.min(6, userList.length); d++) {
          const devUser = userList[(project.id * 3 + d) % userList.length];
          await this.roleActorRepository.save(
            this.roleActorRepository.create({
              projectId: project.id,
              roleId: rolesMap['Developer'].id,
              actorType: ProjectActorType.USER,
              userId: devUser.id,
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
    targetIssuesCount = 120,
    sprintsPerProject = 3,
  ): Promise<Record<string, Issue>> {
    const rawIssues: Array<{
      projectKey: string;
      issueNum: number;
      title: string;
      description: string;
      issueType: IssueType;
      status: IssueStatus;
      priority: IssuePriority;
      estimatedHours: number;
      sprint: string | null;
      reporterKey: string;
      assigneeKey: string | null;
      epicKey?: string;
      parentKey?: string;
      epicColor?: string;
      epicName?: string;
    }> = [
      // ================= UI TEAM TICKETS =================
      {
        projectKey: 'UI',
        issueNum: 1,
        title: 'Design System & Expressive Workspace UI Architecture',
        description: 'Comprehensive design system overhaul implementing Material Design 3 Expressive tokens, unified UI primitives, and responsive layout guidelines.',
        issueType: IssueType.EPIC,
        status: IssueStatus.IN_PROGRESS,
        priority: IssuePriority.HIGH,
        estimatedHours: 40,
        sprint: null,
        reporterKey: 'volodymyr',
        assigneeKey: 'sonya',
        epicColor: '#6554C0',
        epicName: 'Design System',
      },
      {
        projectKey: 'UI',
        issueNum: 2,
        title: 'Resolve visual glitch in mobile drawer backdrop blur',
        description: 'Safari iOS backdrop-filter rendering bug causes flickering when dismissing mobile navigation drawers.',
        issueType: IssueType.BUG,
        status: IssueStatus.CLOSED,
        priority: IssuePriority.HIGH,
        estimatedHours: 6,
        sprint: 'Sprint 1 (Completed)',
        reporterKey: 'sophia',
        assigneeKey: 'lucas',
        epicKey: 'UI-1',
      },
      {
        projectKey: 'UI',
        issueNum: 3,
        title: 'Design token contrast ratio validation for dark mode',
        description: 'Ensure all primary and surface colors strictly adhere to WCAG AAA contrast requirements under dark theme.',
        issueType: IssueType.STORY,
        status: IssueStatus.IN_PROGRESS,
        priority: IssuePriority.HIGH,
        estimatedHours: 12,
        sprint: 'Sprint 2 (Active)',
        reporterKey: 'volodymyr',
        assigneeKey: 'lucas',
        epicKey: 'UI-1',
      },
      {
        projectKey: 'UI',
        issueNum: 4,
        title: 'Verify WCAG 2.1 AA color contrast compliance across dark theme tokens',
        description: 'Run automated axe-core audits to ensure all text variants against surface-container background tokens meet 4.5:1 ratio.',
        issueType: IssueType.TASK,
        status: IssueStatus.REVIEW,
        priority: IssuePriority.MEDIUM,
        estimatedHours: 6,
        sprint: 'Sprint 2 (Active)',
        reporterKey: 'sophia',
        assigneeKey: 'lucas',
        epicKey: 'UI-1',
      },
      {
        projectKey: 'UI',
        issueNum: 5,
        title: 'Live WebSocket sync indicator for concurrent sprint edits',
        description: 'Display collaborative avatar indicators in header when other team members are actively moving cards on the Kanban board.',
        issueType: IssueType.FEATURE,
        status: IssueStatus.IN_PROGRESS,
        priority: IssuePriority.CRITICAL,
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
        estimatedHours: 4,
        sprint: null, // Backlog
        reporterKey: 'sophia',
        assigneeKey: 'volodymyr',
      },
      {
        projectKey: 'UI',
        issueNum: 10,
        title: 'Implement keyboard navigation shortcuts for issue triage (J/K/Enter)',
        description: 'Add global hotkeys allowing triage engineers to navigate between issues and open detail modals without mouse clicks.',
        issueType: IssueType.FEATURE,
        status: IssueStatus.IN_PROGRESS,
        priority: IssuePriority.HIGH,
        estimatedHours: 12,
        sprint: 'Sprint 2 (Active)',
        reporterKey: 'volodymyr',
        assigneeKey: 'daniel',
      },
      {
        projectKey: 'UI',
        issueNum: 11,
        title: 'Multi-select bulk issue updater for sprint planning triage',
        description: 'Allow holding Shift/Cmd to select multiple issue cards and change status, priority, or sprint in one batch action.',
        issueType: IssueType.FEATURE,
        status: IssueStatus.OPEN,
        priority: IssuePriority.MEDIUM,
        estimatedHours: 16,
        sprint: 'Sprint 3 (Upcoming)',
        reporterKey: 'volodymyr',
        assigneeKey: 'daniel',
      },
      {
        projectKey: 'UI',
        issueNum: 12,
        title: 'Customizable widget layout for personal engineer dashboard',
        description: 'Add drag-and-drop grid system allowing users to rearrange My Tasks, Recent Comments, and Time Tracking Summary cards.',
        issueType: IssueType.IMPROVEMENT,
        status: IssueStatus.OPEN,
        priority: IssuePriority.LOW,
        estimatedHours: 20,
        sprint: null, // Backlog
        reporterKey: 'sonya',
        assigneeKey: null,
      },
      {
        projectKey: 'UI',
        issueNum: 13,
        title: 'Define dark mode color token contrast test matrix',
        description: 'Create test fixtures covering button, input, dialog, and badge surface contrast against background tokens.',
        issueType: IssueType.SUBTASK,
        status: IssueStatus.IN_PROGRESS,
        priority: IssuePriority.HIGH,
        estimatedHours: 4,
        sprint: 'Sprint 2 (Active)',
        reporterKey: 'volodymyr',
        assigneeKey: 'lucas',
        parentKey: 'UI-3',
      },
      {
        projectKey: 'UI',
        issueNum: 14,
        title: 'Client-side debounce for WebSocket card movement',
        description: 'Prevent sending redundant drag position updates across socket rooms during active dragging.',
        issueType: IssueType.SUBTASK,
        status: IssueStatus.IN_PROGRESS,
        priority: IssuePriority.HIGH,
        estimatedHours: 4,
        sprint: 'Sprint 2 (Active)',
        reporterKey: 'volodymyr',
        assigneeKey: 'volodymyr',
        parentKey: 'UI-5',
      },

      // ================= CORE TEAM TICKETS =================
      {
        projectKey: 'CORE',
        issueNum: 1,
        title: 'Authentication & Security Infrastructure Overhaul',
        description: 'Hardened identity tier implementing RFC 6749 OAuth2, Argon2id side-channel defense, and Redis sliding-window brute force protection.',
        issueType: IssueType.EPIC,
        status: IssueStatus.IN_PROGRESS,
        priority: IssuePriority.CRITICAL,
        estimatedHours: 40,
        sprint: null,
        reporterKey: 'alex',
        assigneeKey: 'marcus',
        epicColor: '#0052CC',
        epicName: 'Core Security',
      },
      {
        projectKey: 'CORE',
        issueNum: 2,
        title: 'Mitigate race condition during concurrent refresh token rotation',
        description: 'Implement PostgreSQL row-level locking (SELECT FOR UPDATE) when rotating refresh tokens to prevent duplicate token validation exceptions.',
        issueType: IssueType.BUG,
        status: IssueStatus.IN_PROGRESS,
        priority: IssuePriority.CRITICAL,
        estimatedHours: 10,
        sprint: 'Sprint 2 (Active)',
        reporterKey: 'rachel',
        assigneeKey: 'taras',
        epicKey: 'CORE-1',
      },
      {
        projectKey: 'CORE',
        issueNum: 3,
        title: 'Implement Lucene inverted index synchronization for issue search',
        description: 'Build asynchronous event listener updating search indices whenever issue title, description, or custom fields are modified.',
        issueType: IssueType.FEATURE,
        status: IssueStatus.IN_PROGRESS,
        priority: IssuePriority.HIGH,
        estimatedHours: 20,
        sprint: 'Sprint 2 (Active)',
        reporterKey: 'alex',
        assigneeKey: 'marcus',
        epicKey: 'CORE-1',
      },
      {
        projectKey: 'CORE',
        issueNum: 4,
        title: 'Webhook dispatch queue with exponential backoff retry mechanism',
        description: 'Queue outbound webhook payloads to external systems with exponential retry (3 attempts) on HTTP 5xx failures.',
        issueType: IssueType.FEATURE,
        status: IssueStatus.REVIEW,
        priority: IssuePriority.MEDIUM,
        estimatedHours: 12,
        sprint: 'Sprint 2 (Active)',
        reporterKey: 'alex',
        assigneeKey: 'dmitry',
        epicKey: 'CORE-1',
      },
      {
        projectKey: 'CORE',
        issueNum: 5,
        title: 'SeaweedFS distributed storage provider for issue attachments',
        description: 'Implement streaming multi-part file upload service integrating SeaweedFS master & volume nodes with auto-replication.',
        issueType: IssueType.FEATURE,
        status: IssueStatus.IN_PROGRESS,
        priority: IssuePriority.HIGH,
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
        estimatedHours: 8,
        sprint: null, // Backlog
        reporterKey: 'liam',
        assigneeKey: 'marcus',
      },
      {
        projectKey: 'CORE',
        issueNum: 11,
        title: 'Add Redis distributed lock unit tests for token rotation',
        description: 'Verify token rotation concurrency under 50 simultaneous worker threads with zero double-spend or lock starvation.',
        issueType: IssueType.SUBTASK,
        status: IssueStatus.IN_PROGRESS,
        priority: IssuePriority.HIGH,
        estimatedHours: 4,
        sprint: 'Sprint 2 (Active)',
        reporterKey: 'alex',
        assigneeKey: 'taras',
        parentKey: 'CORE-2',
      },
      {
        projectKey: 'CORE',
        issueNum: 12,
        title: 'Verify PostgreSQL row-level locking under 50 concurrent transactions',
        description: 'Execute stress test script validating FOR UPDATE row lock serialization on refresh token records.',
        issueType: IssueType.SUBTASK,
        status: IssueStatus.IN_PROGRESS,
        priority: IssuePriority.HIGH,
        estimatedHours: 4,
        sprint: 'Sprint 2 (Active)',
        reporterKey: 'alex',
        assigneeKey: 'taras',
        parentKey: 'CORE-2',
      },

      // ================= MONOPS TEAM TICKETS =================
      {
        projectKey: 'MON',
        issueNum: 1,
        title: 'Distributed Observability, Telemetry & Real-Time Metrics Pipeline',
        description: 'Unified telemetry architecture combining Prometheus metrics, OpenTelemetry distributed tracing, and Loki log aggregation.',
        issueType: IssueType.EPIC,
        status: IssueStatus.IN_PROGRESS,
        priority: IssuePriority.HIGH,
        estimatedHours: 40,
        sprint: null,
        reporterKey: 'sarah',
        assigneeKey: 'kevin',
        epicColor: '#FFAB00',
        epicName: 'Observability',
      },
      {
        projectKey: 'MON',
        issueNum: 2,
        title: 'Prometheus metrics scrape endpoint for API request latency (p50/p95/p99)',
        description: 'Expose /metrics endpoint with histogram metrics capturing NestJS HTTP request duration and active DB connection pool counts.',
        issueType: IssueType.FEATURE,
        status: IssueStatus.CLOSED,
        priority: IssuePriority.HIGH,
        estimatedHours: 8,
        sprint: 'Sprint 1 (Completed)',
        reporterKey: 'sarah',
        assigneeKey: 'ethan',
        epicKey: 'MON-1',
      },
      {
        projectKey: 'MON',
        issueNum: 3,
        title: 'OpenTelemetry trace context propagation across microservices',
        description: 'Inject W3C traceparent headers in outbound HTTP client requests to enable end-to-end distributed transaction tracing.',
        issueType: IssueType.FEATURE,
        status: IssueStatus.IN_PROGRESS,
        priority: IssuePriority.CRITICAL,
        estimatedHours: 16,
        sprint: 'Sprint 2 (Active)',
        reporterKey: 'sarah',
        assigneeKey: 'kevin',
        epicKey: 'MON-1',
      },
      {
        projectKey: 'MON',
        issueNum: 4,
        title: 'Grafana dashboard for database slow queries and connection starvation',
        description: 'Build real-time visualization dashboard tracking queries exceeding 250ms threshold and TypeORM transaction acquire wait times.',
        issueType: IssueType.TASK,
        status: IssueStatus.IN_PROGRESS,
        priority: IssuePriority.HIGH,
        estimatedHours: 10,
        sprint: 'Sprint 2 (Active)',
        reporterKey: 'sarah',
        assigneeKey: 'yuliia',
        epicKey: 'MON-1',
      },
      {
        projectKey: 'MON',
        issueNum: 5,
        title: 'Alertmanager escalation route for error rate spike (>2% 5xx in 5m)',
        description: 'Configure automated PagerDuty/Slack routing rules when 5xx error rate crosses 2% over a 5-minute rolling window.',
        issueType: IssueType.TASK,
        status: IssueStatus.REVIEW,
        priority: IssuePriority.CRITICAL,
        estimatedHours: 6,
        sprint: 'Sprint 2 (Active)',
        reporterKey: 'ethan',
        assigneeKey: 'noah',
        epicKey: 'MON-1',
      },
      {
        projectKey: 'MON',
        issueNum: 6,
        title: 'Synthetics health check probe for user login endpoint',
        description: 'Deploy headless browser synthetic probe testing user login flow every 60 seconds from multiple geographic regions.',
        issueType: IssueType.IMPROVEMENT,
        status: IssueStatus.OPEN,
        priority: IssuePriority.MEDIUM,
        estimatedHours: 12,
        sprint: 'Sprint 3 (Upcoming)',
        reporterKey: 'maya',
        assigneeKey: 'kevin',
      },
      {
        projectKey: 'MON',
        issueNum: 7,
        title: 'Loki distributed log aggregation pipeline for container stderr/stdout',
        description: 'Deploy Promtail DaemonSet streaming structured JSON logs from Kubernetes nodes into Grafana Loki.',
        issueType: IssueType.FEATURE,
        status: IssueStatus.IN_PROGRESS,
        priority: IssuePriority.HIGH,
        estimatedHours: 14,
        sprint: 'Sprint 2 (Active)',
        reporterKey: 'sarah',
        assigneeKey: 'noah',
        epicKey: 'MON-1',
      },
      {
        projectKey: 'MON',
        issueNum: 8,
        title: 'Blackbox exporter probe for external SSL certificate expiration alerts',
        description: 'Set up automated alerts when wildcard TLS certificates have less than 14 days before expiration.',
        issueType: IssueType.TASK,
        status: IssueStatus.CLOSED,
        priority: IssuePriority.MEDIUM,
        estimatedHours: 4,
        sprint: 'Sprint 1 (Completed)',
        reporterKey: 'ethan',
        assigneeKey: 'ethan',
      },
      {
        projectKey: 'MON',
        issueNum: 9,
        title: 'SLA uptime percentage calculation dashboard for enterprise customers',
        description: 'Calculate monthly rolling 99.9% uptime compliance with drill-down views for scheduled maintenance windows.',
        issueType: IssueType.IMPROVEMENT,
        status: IssueStatus.OPEN,
        priority: IssuePriority.LOW,
        estimatedHours: 8,
        sprint: null, // Backlog
        reporterKey: 'maya',
        assigneeKey: 'yuliia',
      },
      {
        projectKey: 'MON',
        issueNum: 10,
        title: 'Chaos engineering pod kill drill during peak traffic simulation',
        description: 'Execute Chaos Mesh automated pod deletion to verify Kubernetes replica set recovery under 200 RPS load.',
        issueType: IssueType.TASK,
        status: IssueStatus.OPEN,
        priority: IssuePriority.HIGH,
        estimatedHours: 10,
        sprint: 'Sprint 3 (Upcoming)',
        reporterKey: 'sarah',
        assigneeKey: 'maya',
      },
      {
        projectKey: 'MON',
        issueNum: 11,
        title: 'Inject traceparent headers into Axios interceptor',
        description: 'Propagate W3C distributed trace headers in all downstream internal REST API calls.',
        issueType: IssueType.SUBTASK,
        status: IssueStatus.IN_PROGRESS,
        priority: IssuePriority.HIGH,
        estimatedHours: 4,
        sprint: 'Sprint 2 (Active)',
        reporterKey: 'sarah',
        assigneeKey: 'kevin',
        parentKey: 'MON-3',
      },

      // ================= INFRAOPS TEAM TICKETS =================
      {
        projectKey: 'INFRA',
        issueNum: 1,
        title: 'High-Availability Container Orchestration & Cloud Infrastructure',
        description: 'Enterprise Kubernetes cluster provisioning, GitOps deployment pipeline, and Redis Sentinel high-availability state store.',
        issueType: IssueType.EPIC,
        status: IssueStatus.IN_PROGRESS,
        priority: IssuePriority.CRITICAL,
        estimatedHours: 40,
        sprint: null,
        reporterKey: 'david',
        assigneeKey: 'brandon',
        epicColor: '#00875A',
        epicName: 'Cloud & K8s',
      },
      {
        projectKey: 'INFRA',
        issueNum: 2,
        title: 'Provision Kubernetes ingress controller with automated TLS cert-manager',
        description: 'Deploy NGINX Ingress controller with Let\'s Encrypt ACME cluster issuer for zero-touch SSL certificate renewals.',
        issueType: IssueType.TASK,
        status: IssueStatus.CLOSED,
        priority: IssuePriority.HIGH,
        estimatedHours: 14,
        sprint: 'Sprint 1 (Completed)',
        reporterKey: 'david',
        assigneeKey: 'brandon',
        epicKey: 'INFRA-1',
      },
      {
        projectKey: 'INFRA',
        issueNum: 3,
        title: 'Deploy Redis Sentinel cluster for high-availability session caching',
        description: 'Set up 3-node Redis cluster with automatic master failover to support distributed session caching and rate limiter state.',
        issueType: IssueType.FEATURE,
        status: IssueStatus.IN_PROGRESS,
        priority: IssuePriority.CRITICAL,
        estimatedHours: 18,
        sprint: 'Sprint 2 (Active)',
        reporterKey: 'david',
        assigneeKey: 'chloe',
        epicKey: 'INFRA-1',
      },
      {
        projectKey: 'INFRA',
        issueNum: 4,
        title: 'Terraform module for PostgreSQL automated point-in-time recovery (PITR)',
        description: 'Automate WAL archiving to S3 bucket with 30-day retention policy and automated daily restore verification drills.',
        issueType: IssueType.TASK,
        status: IssueStatus.IN_PROGRESS,
        priority: IssuePriority.HIGH,
        estimatedHours: 12,
        sprint: 'Sprint 2 (Active)',
        reporterKey: 'david',
        assigneeKey: 'andrii',
        epicKey: 'INFRA-1',
      },
      {
        projectKey: 'INFRA',
        issueNum: 5,
        title: 'Docker multi-stage build optimization to reduce production image size',
        description: 'Optimize Dockerfile layers to reduce final Node.js runtime image size from 850MB down to under 180MB using Alpine base.',
        issueType: IssueType.IMPROVEMENT,
        status: IssueStatus.REVIEW,
        priority: IssuePriority.MEDIUM,
        estimatedHours: 6,
        sprint: 'Sprint 2 (Active)',
        reporterKey: 'victor',
        assigneeKey: 'victor',
      },
      {
        projectKey: 'INFRA',
        issueNum: 6,
        title: 'Automated blue-green deployment pipeline with canary health checks',
        description: 'Implement GitHub Actions deployment workflow routing 10% traffic to canary pods before promoting release to 100%.',
        issueType: IssueType.FEATURE,
        status: IssueStatus.OPEN,
        priority: IssuePriority.HIGH,
        estimatedHours: 24,
        sprint: 'Sprint 3 (Upcoming)',
        reporterKey: 'david',
        assigneeKey: 'brandon',
        epicKey: 'INFRA-1',
      },
      {
        projectKey: 'INFRA',
        issueNum: 7,
        title: 'HashiCorp Vault secret injection via Kubernetes CSI Secret Store driver',
        description: 'Eliminate plain environment variables by mounting dynamic database credentials directly from Vault into pod filesystems.',
        issueType: IssueType.FEATURE,
        status: IssueStatus.OPEN,
        priority: IssuePriority.HIGH,
        estimatedHours: 16,
        sprint: 'Sprint 3 (Upcoming)',
        reporterKey: 'david',
        assigneeKey: 'andrii',
      },
      {
        projectKey: 'INFRA',
        issueNum: 8,
        title: 'Kubernetes Horizontal Pod Autoscaler (HPA) CPU & Custom Metric policies',
        description: 'Configure HPA to autoscale backend pods between 3 and 15 replicas based on CPU >70% or active HTTP connection queues.',
        issueType: IssueType.IMPROVEMENT,
        status: IssueStatus.CLOSED,
        priority: IssuePriority.MEDIUM,
        estimatedHours: 8,
        sprint: 'Sprint 1 (Completed)',
        reporterKey: 'brandon',
        assigneeKey: 'victor',
      },
      {
        projectKey: 'INFRA',
        issueNum: 9,
        title: 'Staging database sanitization anonymizer script for developers',
        description: 'Automate masking of user emails and PII in database dumps before restoring to developer local environments.',
        issueType: IssueType.TASK,
        status: IssueStatus.OPEN,
        priority: IssuePriority.LOW,
        estimatedHours: 6,
        sprint: null, // Backlog
        reporterKey: 'benjamin',
        assigneeKey: 'chloe',
      },
      {
        projectKey: 'INFRA',
        issueNum: 10,
        title: 'Redis Sentinel sentinel.conf quorum configuration verification',
        description: 'Verify 2-of-3 quorum consensus timing during abrupt node shutdown.',
        issueType: IssueType.SUBTASK,
        status: IssueStatus.IN_PROGRESS,
        priority: IssuePriority.HIGH,
        estimatedHours: 4,
        sprint: 'Sprint 2 (Active)',
        reporterKey: 'david',
        assigneeKey: 'chloe',
        parentKey: 'INFRA-3',
      },

      // ================= NETOPS TEAM TICKETS =================
      {
        projectKey: 'NET',
        issueNum: 1,
        title: 'Zero-Trust Network Architecture & Enterprise Identity Federation',
        description: 'End-to-end network security hardening including TLS 1.3 enforcement, distributed rate limiting, and Okta SAML 2.0 SSO.',
        issueType: IssueType.EPIC,
        status: IssueStatus.IN_PROGRESS,
        priority: IssuePriority.CRITICAL,
        estimatedHours: 40,
        sprint: null,
        reporterKey: 'elena',
        assigneeKey: 'ryan',
        epicColor: '#DE350B',
        epicName: 'Zero Trust',
      },
      {
        projectKey: 'NET',
        issueNum: 2,
        title: 'Cloudflare Turnstile captcha validation challenge timeout handling',
        description: 'Handle edge-case network dropouts during Turnstile token validation by adding fallback verification retries.',
        issueType: IssueType.BUG,
        status: IssueStatus.CLOSED,
        priority: IssuePriority.HIGH,
        estimatedHours: 6,
        sprint: 'Sprint 1 (Completed)',
        reporterKey: 'elena',
        assigneeKey: 'ryan',
        epicKey: 'NET-1',
      },
      {
        projectKey: 'NET',
        issueNum: 3,
        title: 'Enforce TLS 1.3 cipher suite hardening across API endpoints',
        description: 'Disable deprecated TLS 1.0/1.1 protocols and weak CBC cipher suites to achieve A+ rating on Qualys SSL Labs audit.',
        issueType: IssueType.TASK,
        status: IssueStatus.IN_PROGRESS,
        priority: IssuePriority.HIGH,
        estimatedHours: 8,
        sprint: 'Sprint 2 (Active)',
        reporterKey: 'elena',
        assigneeKey: 'arthur',
        epicKey: 'NET-1',
      },
      {
        projectKey: 'NET',
        issueNum: 4,
        title: 'Rate limiter bypass mitigation on password reset initiation endpoint',
        description: 'Implement distributed IP & email token bucket throttling to protect against automated credential stuffing attacks.',
        issueType: IssueType.BUG,
        status: IssueStatus.IN_PROGRESS,
        priority: IssuePriority.CRITICAL,
        estimatedHours: 10,
        sprint: 'Sprint 2 (Active)',
        reporterKey: 'maxim',
        assigneeKey: 'maxim',
        epicKey: 'NET-1',
      },
      {
        projectKey: 'NET',
        issueNum: 5,
        title: 'TOTP 2FA secret generation entropy audit and RFC 6238 compliance',
        description: 'Verify crypto.randomBytes entropy source used for base32 TOTP secret generation complies with NIST SP 800-63B standards.',
        issueType: IssueType.TASK,
        status: IssueStatus.REVIEW,
        priority: IssuePriority.MEDIUM,
        estimatedHours: 6,
        sprint: 'Sprint 2 (Active)',
        reporterKey: 'grace',
        assigneeKey: 'oksana',
        epicKey: 'NET-1',
      },
      {
        projectKey: 'NET',
        issueNum: 6,
        title: 'Security incident response playbook for leaked service credentials',
        description: 'Document step-by-step containment, key revocation, and post-mortem protocol for compromised API tokens.',
        issueType: IssueType.TASK,
        status: IssueStatus.OPEN,
        priority: IssuePriority.LOW,
        estimatedHours: 8,
        sprint: null, // Backlog
        reporterKey: 'elena',
        assigneeKey: null,
      },
      {
        projectKey: 'NET',
        issueNum: 7,
        title: 'Content Security Policy (CSP) header nonce injection against XSS',
        description: 'Implement strict script-src nonce generation in NestJS helmet middleware to prevent script injection vulnerabilities.',
        issueType: IssueType.IMPROVEMENT,
        status: IssueStatus.IN_PROGRESS,
        priority: IssuePriority.HIGH,
        estimatedHours: 12,
        sprint: 'Sprint 2 (Active)',
        reporterKey: 'elena',
        assigneeKey: 'ryan',
        epicKey: 'NET-1',
      },
      {
        projectKey: 'NET',
        issueNum: 8,
        title: 'Automated container vulnerability scanning using Trivy in CI pipeline',
        description: 'Block pull request merges if base OS packages contain Critical or High CVEs with available upstream patches.',
        issueType: IssueType.FEATURE,
        status: IssueStatus.OPEN,
        priority: IssuePriority.MEDIUM,
        estimatedHours: 8,
        sprint: 'Sprint 3 (Upcoming)',
        reporterKey: 'grace',
        assigneeKey: 'arthur',
      },
      {
        projectKey: 'NET',
        issueNum: 9,
        title: 'Enterprise SAML 2.0 / Okta Single Sign-On (SSO) integration spike',
        description: 'Design identity federation schema mapping Okta group assertions to BugTracker RBAC role permissions.',
        issueType: IssueType.FEATURE,
        status: IssueStatus.OPEN,
        priority: IssuePriority.HIGH,
        estimatedHours: 20,
        sprint: null, // Backlog
        reporterKey: 'elena',
        assigneeKey: 'oksana',
        epicKey: 'NET-1',
      },
      {
        projectKey: 'NET',
        issueNum: 10,
        title: 'Verify TLS 1.3 cipher suites with OpenSSL s_client',
        description: 'Run automated handshake audit verifying rejection of TLS 1.2 CBC cipher suites.',
        issueType: IssueType.SUBTASK,
        status: IssueStatus.IN_PROGRESS,
        priority: IssuePriority.HIGH,
        estimatedHours: 4,
        sprint: 'Sprint 2 (Active)',
        reporterKey: 'elena',
        assigneeKey: 'arthur',
        parentKey: 'NET-3',
      },
    ];

    const result: Record<string, Issue> = {};
    const sprintMap: Record<string, Record<string, number>> = {};
    const projectSprintsList: Record<string, number[]> = {};
    const maxIssueNumByProject: Record<string, number> = {};

    for (const [key, proj] of Object.entries(projects)) {
      sprintMap[key] = {};
      projectSprintsList[key] = [];

      const count = Math.max(1, sprintsPerProject);
      if (count === 1) {
        const s = this.sprintRepository.create({
          projectId: proj.id,
          name: 'Sprint 1 (Active)',
          goal: `${proj.name} core delivery milestone and production stabilization`,
          status: SprintStatus.ACTIVE,
          startDate: '2026-08-15',
          endDate: '2026-08-29',
        });
        const savedS = await this.sprintRepository.save(s);
        sprintMap[key]['Sprint 1 (Active)'] = savedS.id;
        sprintMap[key]['Sprint 2 (Active)'] = savedS.id;
        projectSprintsList[key].push(savedS.id);
      } else {
        const s1 = this.sprintRepository.create({
          projectId: proj.id,
          name: 'Sprint 1 (Completed)',
          goal: `${proj.name} initial architecture and foundational MVP components`,
          status: SprintStatus.COMPLETED,
          startDate: '2026-08-01',
          endDate: '2026-08-14',
        });
        const savedS1 = await this.sprintRepository.save(s1);
        sprintMap[key]['Sprint 1 (Completed)'] = savedS1.id;
        projectSprintsList[key].push(savedS1.id);

        const s2 = this.sprintRepository.create({
          projectId: proj.id,
          name: 'Sprint 2 (Active)',
          goal: `${proj.name} feature implementation, testing, and production stabilization`,
          status: SprintStatus.ACTIVE,
          startDate: '2026-08-15',
          endDate: '2026-08-29',
        });
        const savedS2 = await this.sprintRepository.save(s2);
        sprintMap[key]['Sprint 2 (Active)'] = savedS2.id;
        projectSprintsList[key].push(savedS2.id);

        for (let i = 3; i <= count; i++) {
          const sprintName = i === 3 ? 'Sprint 3 (Upcoming)' : `Sprint ${i}`;
          const startDateObj = new Date(Date.UTC(2026, 8, 1));
          startDateObj.setUTCDate(startDateObj.getUTCDate() + (i - 3) * 14);
          const endDateObj = new Date(startDateObj);
          endDateObj.setUTCDate(endDateObj.getUTCDate() + 13);

          const sN = this.sprintRepository.create({
            projectId: proj.id,
            name: sprintName,
            goal: `${proj.name} milestone ${i} enhancements, enterprise scalability, and maintenance`,
            status: SprintStatus.PLANNED,
            startDate: startDateObj.toISOString().slice(0, 10),
            endDate: endDateObj.toISOString().slice(0, 10),
          });
          const savedSN = await this.sprintRepository.save(sN);
          sprintMap[key][sprintName] = savedSN.id;
          projectSprintsList[key].push(savedSN.id);
        }
      }
    }

    // Insert curated raw issues
    for (const item of rawIssues) {
      const project = projects[item.projectKey];
      if (!project) continue;

      const reporter = users[item.reporterKey] || Object.values(users)[0];
      const assignee = item.assigneeKey ? users[item.assigneeKey] : null;
      const targetSprintId = item.sprint ? sprintMap[item.projectKey]?.[item.sprint] || null : null;
      const targetEpicId = item.epicKey && result[item.epicKey] ? result[item.epicKey].id : null;
      const targetParentId = item.parentKey && result[item.parentKey] ? result[item.parentKey].id : null;

      const issue = this.issueRepository.create({
        projectId: project.id,
        project,
        issueNum: item.issueNum,
        title: item.title,
        description: item.description,
        issueType: item.issueType,
        status: item.status,
        priority: item.priority,
        estimatedHours: item.estimatedHours,
        loggedHours: 0,
        sprintId: targetSprintId,
        epicId: targetEpicId,
        epicColor: item.epicColor || null,
        parentId: targetParentId,
        reporterId: reporter.id,
        reporter,
        assigneeId: assignee ? assignee.id : null,
        assignee,
      });

      const saved = await this.issueRepository.save(issue);
      const compositeKey = `${item.projectKey}-${item.issueNum}`;
      result[compositeKey] = saved;
      maxIssueNumByProject[item.projectKey] = Math.max(maxIssueNumByProject[item.projectKey] || 0, item.issueNum);
    }

    // Scalable faker issues generation if targetIssuesCount > raw issues count
    const remainingIssuesCount = Math.max(0, targetIssuesCount - Object.keys(result).length);
    if (remainingIssuesCount > 0) {
      const allProjectKeys = Object.keys(projects);
      const allUsersList = Object.values(users);

      const epicsByProject: Record<string, Issue[]> = {};
      for (const iss of Object.values(result)) {
        if (iss.issueType === IssueType.EPIC) {
          const pKey = iss.project?.key || Object.keys(projects).find((k) => projects[k].id === iss.projectId);
          if (pKey) {
            epicsByProject[pKey] = epicsByProject[pKey] || [];
            epicsByProject[pKey].push(iss);
          }
        }
      }

      const actionVerbs = [
        'Implement', 'Refactor', 'Optimize', 'Fix race condition in', 'Add unit tests for',
        'Upgrade', 'Investigate latency in', 'Design architecture for', 'Enhance caching on',
        'Resolve regression in', 'Configure metrics for', 'Automate migration of', 'Audit security of',
        'Harden error handling on', 'Benchmark throughput for',
      ];
      const techComponents = [
        'distributed lock coordinator', 'JWT token revocation blacklist', 'audit log streaming pipeline',
        'PostgreSQL B-tree index', 'SeaweedFS chunk storage', 'real-time WebSocket gateway',
        'RBAC permission evaluator', 'rate limiter sliding window', 'session cookie serializer',
        'Elasticsearch query parser', 'OAuth provider exchange', 'database connection pool',
        'timesheet aggregation query', 'Kanban drag-and-drop state machine', 'password policy validator',
        'CORS origin filter', 'Kubernetes liveness probe', 'Prometheus histogram collector',
      ];
      const techContexts = [
        'under high concurrent load', 'to prevent deadlock timeouts', 'for enterprise tenant isolation',
        'in multi-node cluster topology', 'complying with OWASP standards', 'with zero-downtime deployment',
        'to reduce memory heap overhead', 'during background cron synchronization', 'to improve P99 response time',
      ];

      const additionalIssues: Issue[] = [];

      for (let i = 0; i < remainingIssuesCount; i++) {
        const projKey = allProjectKeys[i % allProjectKeys.length];
        const project = projects[projKey];
        const nextNum = (maxIssueNumByProject[projKey] || 0) + 1;
        maxIssueNumByProject[projKey] = nextNum;

        const verb = faker.helpers.arrayElement(actionVerbs);
        const comp = faker.helpers.arrayElement(techComponents);
        const ctx = faker.helpers.arrayElement(techContexts);
        const title = `${verb} ${comp} ${ctx}`;
        const description = `${faker.hacker.phrase()} Implement comprehensive regression test suites and verify performance telemetry under peak traffic.`;

        const issueType = faker.helpers.arrayElement([
          IssueType.BUG,
          IssueType.TASK,
          IssueType.FEATURE,
          IssueType.IMPROVEMENT,
        ]);
        const priority = faker.helpers.arrayElement([
          IssuePriority.LOW,
          IssuePriority.MEDIUM,
          IssuePriority.HIGH,
          IssuePriority.CRITICAL,
        ]);

        // Distribute: 30% Active sprint, 25% Completed sprint, 25% Planned sprint, 20% Backlog (null)
        const projectSprints = projectSprintsList[projKey] || [];
        let assignedSprintId: number | null = null;
        let status: IssueStatus;

        const sprintChoice = faker.number.int({ min: 1, max: 100 });
        if (sprintChoice <= 30 && projectSprints.length >= 2) {
          // Active sprint (index 1)
          assignedSprintId = projectSprints[1];
          status = faker.helpers.arrayElement([
            IssueStatus.IN_PROGRESS,
            IssueStatus.REVIEW,
            IssueStatus.RESOLVED,
            IssueStatus.OPEN,
          ]);
        } else if (sprintChoice <= 55 && projectSprints.length >= 1) {
          // Completed sprint (index 0)
          assignedSprintId = projectSprints[0];
          status = faker.helpers.arrayElement([IssueStatus.RESOLVED, IssueStatus.CLOSED]);
        } else if (sprintChoice <= 80 && projectSprints.length >= 3) {
          // Planned sprint (index 2 or later)
          assignedSprintId = faker.helpers.arrayElement(projectSprints.slice(2));
          status = IssueStatus.OPEN;
        } else {
          // Backlog
          assignedSprintId = null;
          status = IssueStatus.OPEN;
        }

        const reporter = faker.helpers.arrayElement(allUsersList);
        const assignee = faker.number.int({ min: 1, max: 10 }) === 1
          ? null
          : faker.helpers.arrayElement(allUsersList);

        const estHours = faker.helpers.arrayElement([2, 4, 6, 8, 12, 16, 20, 24, 32]);
        const labels = [
          projKey.toLowerCase(),
          faker.helpers.arrayElement(['backend', 'frontend', 'security', 'infra', 'performance', 'database']),
        ];

        // Link ~65% of faker issues to an epic in the same project
        const pEpics = epicsByProject[projKey] || [];
        const assignedEpicId = pEpics.length > 0 && faker.number.int({ min: 1, max: 100 }) <= 65
          ? faker.helpers.arrayElement(pEpics).id
          : null;

        const issue = this.issueRepository.create({
          projectId: project.id,
          project,
          issueNum: nextNum,
          title,
          description,
          issueType,
          status,
          priority,
          estimatedHours: estHours,
          loggedHours: 0,
          sprintId: assignedSprintId,
          epicId: assignedEpicId,
          reporterId: reporter.id,
          reporter,
          assigneeId: assignee ? assignee.id : null,
          assignee,
          labels,
        });

        additionalIssues.push(issue);
      }

      // Save in batches of 200 for high-throughput insertion
      for (let i = 0; i < additionalIssues.length; i += 200) {
        const chunk = additionalIssues.slice(i, i + 200);
        const savedChunk = await this.issueRepository.save(chunk);
        for (const saved of savedChunk) {
          const compKey = `${saved.project?.key || Object.keys(projects).find((k) => projects[k].id === saved.projectId)}-${saved.issueNum}`;
          result[compKey] = saved;
        }
      }
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
      { sourceKey: 'INFRA-3', targetKey: 'CORE-2', linkType: IssueLinkType.BLOCKS },
      { sourceKey: 'INFRA-2', targetKey: 'MON-2', linkType: IssueLinkType.BLOCKS },
      { sourceKey: 'INFRA-4', targetKey: 'MON-4', linkType: IssueLinkType.RELATES_TO },
      { sourceKey: 'INFRA-7', targetKey: 'CORE-5', linkType: IssueLinkType.BLOCKS },
      { sourceKey: 'INFRA-6', targetKey: 'MON-10', linkType: IssueLinkType.RELATES_TO },

      // NET blocks CORE & UI
      { sourceKey: 'NET-2', targetKey: 'UI-5', linkType: IssueLinkType.RELATES_TO },
      { sourceKey: 'NET-4', targetKey: 'CORE-2', linkType: IssueLinkType.BLOCKS },
      { sourceKey: 'NET-3', targetKey: 'INFRA-2', linkType: IssueLinkType.RELATES_TO },
      { sourceKey: 'NET-7', targetKey: 'UI-6', linkType: IssueLinkType.RELATES_TO },
      { sourceKey: 'NET-8', targetKey: 'INFRA-5', linkType: IssueLinkType.BLOCKS },

      // MON monitors & relates
      { sourceKey: 'MON-3', targetKey: 'CORE-3', linkType: IssueLinkType.RELATES_TO },
      { sourceKey: 'MON-5', targetKey: 'INFRA-3', linkType: IssueLinkType.IS_BLOCKED_BY },
      { sourceKey: 'MON-7', targetKey: 'INFRA-6', linkType: IssueLinkType.RELATES_TO },
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
      { issueKey: 'MON-3', userKey: 'kevin', hours: 4.5, dateLogged: getDateOffset(0), description: 'Instrumented OpenTelemetry trace spans in incoming request interceptors' },
      { issueKey: 'MON-7', userKey: 'noah', hours: 5.0, dateLogged: getDateOffset(0), description: 'Configured Promtail DaemonSet to parse structured JSON log lines' },
      { issueKey: 'INFRA-3', userKey: 'chloe', hours: 5.0, dateLogged: getDateOffset(0), description: 'Configured Redis Sentinel quorum configuration on cluster nodes' },
      { issueKey: 'INFRA-4', userKey: 'andrii', hours: 4.0, dateLogged: getDateOffset(0), description: 'Drafted S3 lifecycle policies for Postgres WAL backup retention' },
      { issueKey: 'NET-4', userKey: 'maxim', hours: 3.5, dateLogged: getDateOffset(0), description: 'Added sliding window rate limiting for authentication challenge tokens' },
      { issueKey: 'NET-7', userKey: 'ryan', hours: 4.0, dateLogged: getDateOffset(0), description: 'Constructed CSP nonce injector middleware for server-rendered HTML' },

      // Yesterday (1 day ago)
      { issueKey: 'UI-10', userKey: 'daniel', hours: 5.0, dateLogged: getDateOffset(1), description: 'Wired J/K keyboard shortcut handlers and focus trap logic' },
      { issueKey: 'UI-4', userKey: 'lucas', hours: 4.0, dateLogged: getDateOffset(1), description: 'Axe-core automated accessibility audits on surface container tokens' },
      { issueKey: 'UI-6', userKey: 'sonya', hours: 4.5, dateLogged: getDateOffset(1), description: 'Created day cell interactive hover preview component & styling' },
      { issueKey: 'CORE-3', userKey: 'marcus', hours: 7.0, dateLogged: getDateOffset(1), description: 'Built inverted index document generator for full-text search' },
      { issueKey: 'CORE-4', userKey: 'dmitry', hours: 4.0, dateLogged: getDateOffset(1), description: 'Wrote unit tests for webhook signature HMAC-SHA256 generator' },
      { issueKey: 'MON-4', userKey: 'yuliia', hours: 6.0, dateLogged: getDateOffset(1), description: 'Constructed Grafana panels for database connection pool wait durations' },
      { issueKey: 'MON-5', userKey: 'ethan', hours: 3.5, dateLogged: getDateOffset(1), description: 'Configured PagerDuty on-call webhook payload templates' },
      { issueKey: 'INFRA-5', userKey: 'victor', hours: 3.0, dateLogged: getDateOffset(1), description: 'Audited Alpine Linux base image packages for minimal CVE surface' },
      { issueKey: 'NET-3', userKey: 'arthur', hours: 4.0, dateLogged: getDateOffset(1), description: 'Hardened cipher suites to TLS_AES_256_GCM_SHA384 and TLS_CHACHA20_POLY1305' },
      { issueKey: 'NET-5', userKey: 'grace', hours: 3.0, dateLogged: getDateOffset(1), description: 'Ran cryptographic entropy validation tests against /dev/urandom output' },

      // 2 days ago
      { issueKey: 'UI-5', userKey: 'volodymyr', hours: 8.0, dateLogged: getDateOffset(2), description: 'Refactored sprint kanban live board drag event listeners' },
      { issueKey: 'UI-10', userKey: 'daniel', hours: 4.0, dateLogged: getDateOffset(2), description: 'Added ESC key listener to dismiss open detail panels' },
      { issueKey: 'CORE-4', userKey: 'dmitry', hours: 6.5, dateLogged: getDateOffset(2), description: 'Implemented exponential backoff retry queue with dead letter exchange' },
      { issueKey: 'CORE-2', userKey: 'taras', hours: 4.0, dateLogged: getDateOffset(2), description: 'Benchmarked row-locking overhead under 500 concurrent token refreshes' },
      { issueKey: 'INFRA-4', userKey: 'andrii', hours: 5.5, dateLogged: getDateOffset(2), description: 'Terraform script for automated WAL archive uploads to S3 bucket' },
      { issueKey: 'INFRA-3', userKey: 'david', hours: 3.5, dateLogged: getDateOffset(2), description: 'Architecture review of Redis failover switchover thresholds' },
      { issueKey: 'MON-5', userKey: 'noah', hours: 4.0, dateLogged: getDateOffset(2), description: 'Configured Alertmanager routing tree for severity critical alarms' },
      { issueKey: 'MON-3', userKey: 'kevin', hours: 5.0, dateLogged: getDateOffset(2), description: 'Added baggage header propagation for user ID and tenant context' },
      { issueKey: 'NET-5', userKey: 'oksana', hours: 3.0, dateLogged: getDateOffset(2), description: 'Validated crypto.randomBytes entropy generation for TOTP secrets' },
      { issueKey: 'NET-4', userKey: 'maxim', hours: 4.5, dateLogged: getDateOffset(2), description: 'Simulated brute-force login attack on staging environment' },

      // 3 days ago
      { issueKey: 'UI-1', userKey: 'sonya', hours: 6.0, dateLogged: getDateOffset(3), description: 'Adjusted Kanban column width calculations for 4K ultrawide viewports' },
      { issueKey: 'UI-4', userKey: 'sophia', hours: 2.0, dateLogged: getDateOffset(3), description: 'Created automated Cypress test suite for theme contrast verification' },
      { issueKey: 'CORE-1', userKey: 'marcus', hours: 4.0, dateLogged: getDateOffset(3), description: 'Created composite index on login audit log table' },
      { issueKey: 'CORE-3', userKey: 'alex', hours: 3.0, dateLogged: getDateOffset(3), description: 'Reviewed query parser architecture for search indexing' },
      { issueKey: 'MON-2', userKey: 'ethan', hours: 5.0, dateLogged: getDateOffset(3), description: 'Configured Prometheus scrape job and metric exposition endpoint' },
      { issueKey: 'MON-4', userKey: 'sarah', hours: 3.5, dateLogged: getDateOffset(3), description: 'Defined SLI metrics for database query latency percentiles' },
      { issueKey: 'INFRA-2', userKey: 'brandon', hours: 7.0, dateLogged: getDateOffset(3), description: 'Deployed NGINX Ingress controller in Kubernetes staging namespace' },
      { issueKey: 'NET-2', userKey: 'ryan', hours: 4.0, dateLogged: getDateOffset(3), description: 'Implemented Cloudflare Turnstile token validation fallback handler' },
      { issueKey: 'NET-7', userKey: 'elena', hours: 2.5, dateLogged: getDateOffset(3), description: 'Drafted company-wide CSP policy specifications' },

      // 4 days ago
      { issueKey: 'UI-2', userKey: 'lucas', hours: 5.0, dateLogged: getDateOffset(4), description: 'Fixed iOS Safari backdrop filter blur opacity bug' },
      { issueKey: 'UI-10', userKey: 'daniel', hours: 4.0, dateLogged: getDateOffset(4), description: 'Drafted unit tests for keyboard navigation state machine' },
      { issueKey: 'CORE-2', userKey: 'taras', hours: 3.5, dateLogged: getDateOffset(4), description: 'Conducted load test on concurrent token refresh requests' },
      { issueKey: 'CORE-5', userKey: 'rachel', hours: 5.0, dateLogged: getDateOffset(4), description: 'Built SeaweedFS client adapter with connection retries' },
      { issueKey: 'INFRA-3', userKey: 'chloe', hours: 6.0, dateLogged: getDateOffset(4), description: 'Tested Redis cluster split-brain auto-healing scenarios' },
      { issueKey: 'MON-3', userKey: 'kevin', hours: 4.0, dateLogged: getDateOffset(4), description: 'Added Jaeger span tags for database query execution' },
      { issueKey: 'NET-3', userKey: 'arthur', hours: 5.0, dateLogged: getDateOffset(4), description: 'Ran SSL Labs scan against staging environment' },

      // 5 to 7 days ago (Week 1 of active sprint)
      { issueKey: 'MON-3', userKey: 'kevin', hours: 6.0, dateLogged: getDateOffset(5), description: 'Integrated OpenTelemetry trace context propagation across services' },
      { issueKey: 'INFRA-3', userKey: 'chloe', hours: 8.0, dateLogged: getDateOffset(5), description: 'Benchmarked Redis Sentinel failover switch times under load' },
      { issueKey: 'UI-5', userKey: 'volodymyr', hours: 6.0, dateLogged: getDateOffset(5), description: 'Drafted WebSocket room subscription protocol for sprint boards' },
      { issueKey: 'CORE-3', userKey: 'marcus', hours: 5.5, dateLogged: getDateOffset(6), description: 'Configured Lucene tokenizers and lowercase filter chain' },
      { issueKey: 'NET-4', userKey: 'maxim', hours: 4.5, dateLogged: getDateOffset(6), description: 'Audited authentication endpoints for brute-force vulnerability' },
      { issueKey: 'CORE-3', userKey: 'marcus', hours: 7.5, dateLogged: getDateOffset(7), description: 'Implemented Lucene query parser and token filter pipeline' },
      { issueKey: 'UI-5', userKey: 'volodymyr', hours: 6.0, dateLogged: getDateOffset(7), description: 'Engineered optimistic UI card moving logic on drag drop' },
      { issueKey: 'INFRA-4', userKey: 'andrii', hours: 4.0, dateLogged: getDateOffset(7), description: 'Wrote automated Postgres backup restore verification test' },

      // 8 to 14 days ago (Previous Sprint / Week 2)
      { issueKey: 'INFRA-5', userKey: 'victor', hours: 4.0, dateLogged: getDateOffset(8), description: 'Refactored Docker multi-stage build layers to reduce container image size' },
      { issueKey: 'MON-4', userKey: 'yuliia', hours: 3.0, dateLogged: getDateOffset(9), description: 'Added query execution latency histogram visualizers' },
      { issueKey: 'CORE-1', userKey: 'marcus', hours: 2.0, dateLogged: getDateOffset(10), description: 'Validated query plan using EXPLAIN ANALYZE on audit table' },
      { issueKey: 'UI-1', userKey: 'sonya', hours: 4.0, dateLogged: getDateOffset(11), description: 'Created flexbox swimlane grid responsive breakpoints' },
      { issueKey: 'UI-2', userKey: 'sophia', hours: 3.0, dateLogged: getDateOffset(12), description: 'Reproduced Safari backdrop filter glitch on iPhone 14 test device' },
      { issueKey: 'INFRA-2', userKey: 'david', hours: 5.0, dateLogged: getDateOffset(12), description: 'Reviewed Ingress controller architecture and TLS cert-manager specs' },
      { issueKey: 'NET-2', userKey: 'ryan', hours: 4.0, dateLogged: getDateOffset(13), description: 'Wired Cloudflare Turnstile frontend widget callback handlers' },
      { issueKey: 'MON-2', userKey: 'ethan', hours: 4.5, dateLogged: getDateOffset(14), description: 'Defined Prometheus latency buckets: 10ms, 50ms, 100ms, 250ms, 1s' },
      { issueKey: 'CORE-9', userKey: 'dmitry', hours: 6.0, dateLogged: getDateOffset(14), description: 'Decorated all REST API controllers with Swagger ApiOperation tags' },

      // 15 to 21 days ago (Sprint 1 foundation / Week 3)
      { issueKey: 'INFRA-8', userKey: 'brandon', hours: 4.0, dateLogged: getDateOffset(15), description: 'Configured Kubernetes HPA manifest for auto-scaling' },
      { issueKey: 'MON-8', userKey: 'ethan', hours: 4.0, dateLogged: getDateOffset(16), description: 'Configured Blackbox exporter probe for domain SSL cert monitor' },
      { issueKey: 'CORE-9', userKey: 'alex', hours: 3.0, dateLogged: getDateOffset(17), description: 'Approved Swagger documentation generation schema' },
      { issueKey: 'UI-1', userKey: 'lucas', hours: 4.0, dateLogged: getDateOffset(18), description: 'CSS Grid swimlane column styling and horizontal scrollbar polish' },
      { issueKey: 'INFRA-2', userKey: 'brandon', hours: 6.0, dateLogged: getDateOffset(19), description: 'Configured cert-manager ClusterIssuer with Let\'s Encrypt production endpoint' },
      { issueKey: 'NET-2', userKey: 'elena', hours: 3.5, dateLogged: getDateOffset(20), description: 'Penetration testing on Turnstile bypass vectors' },
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
      { issueKey: 'MON-3', userKey: 'sarah', text: 'Trace context propagation is working across all downstream RPCs. Ready for staging deploy.' },
      { issueKey: 'INFRA-3', userKey: 'david', text: 'Redis Sentinel failover switch tested under simulated network partition. Recovered in under 1.2s.' },
      { issueKey: 'NET-4', userKey: 'elena', text: 'Security review approved. Rate limiting rules successfully mitigated brute force token guessing.' },
      { issueKey: 'NET-7', userKey: 'maxim', text: 'Strict CSP policy passed automated XSS penetration tests. No inline script violations found.' },
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

  private async seedExtendedDomainEntities(
    projects: Record<string, Project>,
    users: Record<string, User>,
    issues: Record<string, Issue>,
  ): Promise<void> {
    const adminUser = users['admin'] || Object.values(users)[0];
    const volodymyr = users['volodymyr'] || adminUser;

    // 1. Project Components & Versions
    const componentsByProject: Record<string, ProjectComponent[]> = {};
    const versionsByProject: Record<string, ProjectVersion[]> = {};

    const rawComponentsConfig: Record<string, Array<{ name: string; description: string; leadKey?: string }>> = {
      UI: [
        { name: 'Design System', description: 'M3 tokens, styles, and reusable UI components', leadKey: 'sonya' },
        { name: 'Kanban Board', description: 'Drag-and-drop workflow management canvas', leadKey: 'volodymyr' },
        { name: 'Navigation & Layout', description: 'Responsive shell, sidebar, and headers', leadKey: 'lucas' },
      ],
      CORE: [
        { name: 'Authentication Tier', description: 'OAuth2, JWT tokens, and Argon2id hashing', leadKey: 'alex' },
        { name: 'Distributed Storage', description: 'SeaweedFS chunk storage and attachment pipeline', leadKey: 'rachel' },
        { name: 'Search Engine', description: 'Lucene full-text indexing and query execution', leadKey: 'marcus' },
      ],
      MON: [
        { name: 'Metrics Collector', description: 'Prometheus scrapers and metric exporters', leadKey: 'sarah' },
        { name: 'Trace Instrumentation', description: 'OpenTelemetry distributed spans', leadKey: 'kevin' },
        { name: 'Visualization Dashboards', description: 'Grafana dashboards and panels', leadKey: 'yuliia' },
      ],
      INFRA: [
        { name: 'Kubernetes Platform', description: 'EKS cluster configuration and Helm manifests', leadKey: 'david' },
        { name: 'Redis Cache Tier', description: 'High-availability Redis Sentinel cluster', leadKey: 'chloe' },
        { name: 'CI/CD Pipelines', description: 'GitHub Actions automated build and test workflows', leadKey: 'brandon' },
      ],
      NET: [
        { name: 'Security Gateway', description: 'Reverse proxy, WAF, and rate limiting', leadKey: 'elena' },
        { name: 'TLS & Encryption', description: 'TLS 1.3 cipher suite enforcement and cert-manager', leadKey: 'arthur' },
        { name: 'Identity Federation', description: 'Okta SAML 2.0 and enterprise SSO', leadKey: 'maxim' },
      ],
    };

    for (const [projKey, proj] of Object.entries(projects)) {
      // Components
      if (this.componentRepository) {
        componentsByProject[projKey] = [];
        const compConfigs = rawComponentsConfig[projKey] || [
          { name: `${proj.key} Core`, description: 'Core functional modules' },
          { name: `${proj.key} API`, description: 'External API endpoints' },
        ];
        for (const cfg of compConfigs) {
          const lead = cfg.leadKey && users[cfg.leadKey] ? users[cfg.leadKey] : null;
          const comp = this.componentRepository.create({
            name: cfg.name,
            description: cfg.description,
            projectId: proj.id,
            leadId: lead ? lead.id : null,
          });
          const savedComp = await this.componentRepository.save(comp);
          componentsByProject[projKey].push(savedComp);
        }
      }

      // Versions
      if (this.versionRepository) {
        versionsByProject[projKey] = [];
        const v1 = this.versionRepository.create({
          projectId: proj.id,
          name: 'v1.0.0',
          description: 'Initial production release and foundational baseline',
          status: ProjectVersionStatus.RELEASED,
          releaseDate: '2026-08-14',
          startDate: '2026-08-01',
        });
        const savedV1 = await this.versionRepository.save(v1);
        versionsByProject[projKey].push(savedV1);

        const v11 = this.versionRepository.create({
          projectId: proj.id,
          name: 'v1.1.0',
          description: 'Performance enhancements and stability updates',
          status: ProjectVersionStatus.UNRELEASED,
          releaseDate: '2026-09-15',
          startDate: '2026-08-15',
        });
        const savedV11 = await this.versionRepository.save(v11);
        versionsByProject[projKey].push(savedV11);

        const v20 = this.versionRepository.create({
          projectId: proj.id,
          name: 'v2.0.0',
          description: 'Next-generation architecture and enterprise scalability',
          status: ProjectVersionStatus.UNRELEASED,
          releaseDate: '2026-12-31',
          startDate: '2026-09-16',
        });
        const savedV20 = await this.versionRepository.save(v20);
        versionsByProject[projKey].push(savedV20);
      }

      // Quick Filters
      if (this.quickFilterRepository) {
        const qf1 = this.quickFilterRepository.create({
          projectId: proj.id,
          name: 'My Open Issues',
          jqlQuery: 'assignee = currentUser() AND status != "CLOSED"',
          description: 'Issues assigned to current active engineer',
          position: 0,
        });
        const qf2 = this.quickFilterRepository.create({
          projectId: proj.id,
          name: 'Critical Defects',
          jqlQuery: 'priority = "CRITICAL" AND issueType = "BUG"',
          description: 'High-severity production blocking defects',
          position: 1,
        });
        const qf3 = this.quickFilterRepository.create({
          projectId: proj.id,
          name: 'Needs Code Review',
          jqlQuery: 'status = "REVIEW"',
          description: 'Pull requests and tickets pending peer review',
          position: 2,
        });
        await this.quickFilterRepository.save([qf1, qf2, qf3]);
      }

      // Webhooks
      if (this.webhookRepository) {
        const webhookConfigs: Record<string, { name: string; url: string }> = {
          UI: { name: 'Frontend Slack Channel', url: 'https://hooks.slack.com/services/T001/B001/ui-team-feed' },
          CORE: { name: 'Core Architecture Discord', url: 'https://discord.com/api/webhooks/12345/core-engineering' },
          INFRA: { name: 'DevOps Incident Alert Webhook', url: 'https://ops.bugtracker.local/webhooks/infra-events' },
        };
        const whCfg = webhookConfigs[projKey];
        if (whCfg) {
          const webhook = this.webhookRepository.create({
            projectId: proj.id,
            name: whCfg.name,
            url: whCfg.url,
            secret: `whsec_${projKey.toLowerCase()}_production_token_99`,
            events: ['issue.created', 'issue.updated', 'issue.deleted'],
            isActive: true,
          });
          await this.webhookRepository.save(webhook);
        }
      }
    }

    // 2. Link some issues to components and fix versions
    for (const [key, issue] of Object.entries(issues)) {
      const projKey = key.split('-')[0];
      const comps = componentsByProject[projKey];
      const vers = versionsByProject[projKey];

      const updates: Partial<Issue> = {};
      if (comps && comps.length > 0 && issue.issueNum % 2 === 0) {
        updates.componentId = comps[issue.issueNum % comps.length].id;
      }
      if (vers && vers.length > 0 && issue.issueNum % 3 === 0) {
        updates.fixVersionId = vers[issue.issueNum % vers.length].id;
      }

      if (Object.keys(updates).length > 0) {
        await this.issueRepository.update(issue.id, updates);
      }
    }

    // 3. VCS Pull Requests
    if (this.vcsPrRepository) {
      const samplePrs = [
        {
          issueKey: 'UI-2',
          provider: VcsProvider.GITHUB,
          repository: 'bugtracker/frontend-ui',
          prNumber: 102,
          title: 'fix(drawer): resolve backdrop blur opacity flicker on iOS Safari',
          url: 'https://github.com/bugtracker/frontend-ui/pull/102',
          status: VcsPullRequestStatus.MERGED,
          sourceBranch: 'fix/safari-backdrop-blur',
          targetBranch: 'main',
          authorUsername: 'lucas',
        },
        {
          issueKey: 'UI-5',
          provider: VcsProvider.GITHUB,
          repository: 'bugtracker/frontend-ui',
          prNumber: 105,
          title: 'feat(kanban): live WebSocket sprint sync and active card broadcast',
          url: 'https://github.com/bugtracker/frontend-ui/pull/105',
          status: VcsPullRequestStatus.OPEN,
          sourceBranch: 'feat/sprint-live-sync',
          targetBranch: 'main',
          authorUsername: 'volodymyr',
        },
        {
          issueKey: 'CORE-2',
          provider: VcsProvider.GITHUB,
          repository: 'bugtracker/backend-core',
          prNumber: 204,
          title: 'fix(auth): implement SELECT FOR UPDATE row locking during token rotation',
          url: 'https://github.com/bugtracker/backend-core/pull/204',
          status: VcsPullRequestStatus.OPEN,
          sourceBranch: 'fix/token-rotation-race',
          targetBranch: 'main',
          authorUsername: 'taras',
        },
        {
          issueKey: 'INFRA-3',
          provider: VcsProvider.GITLAB,
          repository: 'bugtracker/infrastructure',
          prNumber: 38,
          title: 'feat(redis): 3-node Redis Sentinel cluster configuration',
          url: 'https://gitlab.com/bugtracker/infrastructure/-/merge_requests/38',
          status: VcsPullRequestStatus.OPEN,
          sourceBranch: 'feature/redis-sentinel-quorum',
          targetBranch: 'master',
          authorUsername: 'chloe',
        },
      ];

      for (const prItem of samplePrs) {
        const iss = issues[prItem.issueKey];
        if (!iss) continue;

        const pr = this.vcsPrRepository.create({
          issue: iss,
          issueId: iss.id,
          provider: prItem.provider,
          repository: prItem.repository,
          prNumber: prItem.prNumber,
          title: prItem.title,
          url: prItem.url,
          status: prItem.status,
          sourceBranch: prItem.sourceBranch,
          targetBranch: prItem.targetBranch,
          authorUsername: prItem.authorUsername,
        });
        await this.vcsPrRepository.save(pr);
      }
    }

    // 4. Issue Histories
    if (this.historyRepository) {
      const historyItems = [
        { issueKey: 'UI-2', userKey: 'sophia', field: 'status', oldValue: 'OPEN', newValue: 'IN_PROGRESS' },
        { issueKey: 'UI-2', userKey: 'lucas', field: 'status', oldValue: 'IN_PROGRESS', newValue: 'CLOSED' },
        { issueKey: 'UI-5', userKey: 'volodymyr', field: 'priority', oldValue: 'HIGH', newValue: 'CRITICAL' },
        { issueKey: 'CORE-2', userKey: 'taras', field: 'status', oldValue: 'OPEN', newValue: 'IN_PROGRESS' },
        { issueKey: 'INFRA-2', userKey: 'brandon', field: 'status', oldValue: 'IN_PROGRESS', newValue: 'CLOSED' },
      ];

      for (const h of historyItems) {
        const iss = issues[h.issueKey];
        const u = users[h.userKey] || adminUser;
        if (!iss) continue;

        const history = this.historyRepository.create({
          issueId: iss.id,
          userId: u.id,
          field: h.field,
          oldValue: h.oldValue,
          newValue: h.newValue,
        });
        await this.historyRepository.save(history);
      }
    }

    // 5. Notifications
    if (this.notificationRepository) {
      const targetUser = volodymyr;
      const sampleNotifications = [
        {
          userId: targetUser.id,
          type: NotificationType.ASSIGNED,
          title: 'Assigned to UI-5',
          message: 'You were assigned to Live WebSocket sync indicator for concurrent sprint edits',
          issueId: issues['UI-5']?.id || null,
          actorId: adminUser.id,
          isRead: false,
        },
        {
          userId: targetUser.id,
          type: NotificationType.COMMENT_ADDED,
          title: 'New comment on UI-5',
          message: 'Sonya left a comment: WebSocket connection pooling verified in Chrome and Safari.',
          issueId: issues['UI-5']?.id || null,
          actorId: users['sonya']?.id || adminUser.id,
          isRead: true,
        },
        {
          userId: targetUser.id,
          type: NotificationType.STATUS_CHANGED,
          title: 'Status changed on UI-2',
          message: 'Lucas marked UI-2 as CLOSED',
          issueId: issues['UI-2']?.id || null,
          actorId: users['lucas']?.id || adminUser.id,
          isRead: true,
        },
      ];

      for (const n of sampleNotifications) {
        const notif = this.notificationRepository.create(n);
        await this.notificationRepository.save(notif);
      }
    }

    // 6. Saved Filters
    if (this.savedFilterRepository) {
      const userFilters = [
        {
          userId: volodymyr.id,
          name: 'My High Priority Tasks',
          description: 'Current tasks assigned to me requiring immediate attention',
          isFavorite: true,
          query: 'assignee = currentUser() AND priority IN ("HIGH", "CRITICAL") AND status != "CLOSED"',
        },
        {
          userId: volodymyr.id,
          name: 'Active Sprint UI Issues',
          description: 'All UI workspace tickets in currently running sprint',
          isFavorite: true,
          query: 'project = "UI" AND sprint in (openSprints())',
        },
        {
          userId: adminUser.id,
          name: 'Critical Production Bugs',
          description: 'System-wide open critical severity bugs',
          isFavorite: false,
          query: 'priority = "CRITICAL" AND issueType = "BUG" AND status != "CLOSED"',
        },
      ];

      for (const sf of userFilters) {
        const filter = this.savedFilterRepository.create(sf);
        await this.savedFilterRepository.save(filter);
      }
    }
  }
}

