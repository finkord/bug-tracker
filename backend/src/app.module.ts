import { EventsModule } from './modules/events/events.module.js';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { MailerModule } from '@nestjs-modules/mailer';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { User } from './modules/users/entities/user.entity.js';
import { SavedFilter } from './modules/users/entities/saved-filter.entity.js';
import { LoginAuditLog } from './modules/security-audit/entities/login-audit-log.entity.js';
import { Project } from './modules/projects/entities/project.entity.js';
import { ProjectQuickFilter } from './modules/projects/entities/quick-filter.entity.js';
import { ProjectComponent } from './modules/projects/entities/project-component.entity.js';
import { ProjectVersion } from './modules/projects/entities/project-version.entity.js';
import { Issue } from './modules/issues/entities/issue.entity.js';
import { IssueHistory } from './modules/issues/entities/issue-history.entity.js';
import { Comment } from './modules/issues/entities/comment.entity.js';
import { Worklog } from './modules/issues/entities/worklog.entity.js';
import { Attachment } from './modules/issues/entities/attachment.entity.js';
import { IssueLink } from './modules/issues/entities/issue-link.entity.js';
import { VcsPullRequest } from './modules/vcs/entities/vcs-pull-request.entity.js';
import { VcsModule } from './modules/vcs/vcs.module.js';
import { Notification } from './modules/notifications/entities/notification.entity.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { ProjectWebhook } from './modules/webhooks/entities/project-webhook.entity.js';
import { WebhooksModule } from './modules/webhooks/webhooks.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { SecurityAuditModule } from './modules/security-audit/security-audit.module.js';
import { CaptchaModule } from './modules/captcha/captcha.module.js';
import { ProjectsModule } from './modules/projects/projects.module.js';
import { IssuesModule } from './modules/issues/issues.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { RedisModule } from './modules/redis/redis.module.js';

import { Group } from './modules/rbac/entities/group.entity.js';
import { UserGroup } from './modules/rbac/entities/user-group.entity.js';
import { ProjectRole } from './modules/rbac/entities/project-role.entity.js';
import { ProjectRoleActor } from './modules/rbac/entities/project-role-actor.entity.js';
import { PermissionScheme } from './modules/rbac/entities/permission-scheme.entity.js';
import { PermissionGrant } from './modules/rbac/entities/permission-grant.entity.js';
import { IssueSecurityScheme } from './modules/rbac/entities/issue-security-scheme.entity.js';
import { IssueSecurityLevel } from './modules/rbac/entities/issue-security-level.entity.js';
import { IssueSecurityGrant } from './modules/rbac/entities/issue-security-grant.entity.js';
import { RbacModule } from './modules/rbac/rbac.module.js';
import { Sprint } from './modules/sprints/entities/sprint.entity.js';
import { SprintSnapshot } from './modules/sprints/entities/sprint-snapshot.entity.js';
import { SprintsModule } from './modules/sprints/sprints.module.js';
import { StorageModule } from './modules/storage/storage.module.js';
import { Team } from './modules/teams/entities/team.entity.js';
import { TeamMember } from './modules/teams/entities/team-member.entity.js';
import { TeamsModule } from './modules/teams/teams.module.js';

@Module({
  imports: [
    // Global environment configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),

    // PostgreSQL database connection via TypeORM
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USER', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_NAME', 'bug_tracker'),
        entities: [
          User,
          SavedFilter,
          LoginAuditLog,
          Project,
          ProjectQuickFilter,
          ProjectComponent,
          ProjectVersion,
          Issue,
          IssueHistory,
          Comment,
          Worklog,
          Attachment,
          IssueLink,
          Group,
          UserGroup,
          ProjectRole,
          ProjectRoleActor,
          PermissionScheme,
          PermissionGrant,
          IssueSecurityScheme,
          IssueSecurityLevel,
          IssueSecurityGrant,
          Sprint,
          SprintSnapshot,
          Team,
          TeamMember,
          VcsPullRequest,
          Notification,
          ProjectWebhook,
        ],
        synchronize:
          configService.get<string>('DB_SYNCHRONIZE') === 'true' ||
          configService.get<string>('NODE_ENV') !== 'production',
      }),
    }),

    // Rate limiting to mitigate brute-force and DDoS attacks
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds window
        limit: 10,  // Max 10 requests per window
      },
    ]),

    // Transactional email dispatch via Mailpit
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('MAIL_HOST', 'localhost'),
          port: configService.get<number>('MAIL_PORT', 1025),
          ignoreTLS: true,
          secure: false,
        },
        defaults: {
          from: configService.get<string>('MAIL_FROM', '"Bug Tracker" <no-reply@bugtracker.local>'),
        },
      }),
    }),

    // Application business modules
    RedisModule,
    AuthModule,
    UsersModule,
    SecurityAuditModule,
    CaptchaModule,
    ProjectsModule,
    IssuesModule,
    EventsModule,
    AdminModule,
    RbacModule,
    SprintsModule,
    StorageModule,
    TeamsModule,
    VcsModule,
    NotificationsModule,
    WebhooksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
