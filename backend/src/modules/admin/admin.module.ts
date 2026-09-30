import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity.js';
import { Project } from '../projects/entities/project.entity.js';
import { Issue } from '../issues/entities/issue.entity.js';
import { IssueLink } from '../issues/entities/issue-link.entity.js';
import { Worklog } from '../issues/entities/worklog.entity.js';
import { Comment } from '../issues/entities/comment.entity.js';
import { Group } from '../rbac/entities/group.entity.js';
import { UserGroup } from '../rbac/entities/user-group.entity.js';
import { ProjectRole } from '../rbac/entities/project-role.entity.js';
import { ProjectRoleActor } from '../rbac/entities/project-role-actor.entity.js';
import { PermissionScheme } from '../rbac/entities/permission-scheme.entity.js';
import { PermissionGrant } from '../rbac/entities/permission-grant.entity.js';
import { IssueSecurityScheme } from '../rbac/entities/issue-security-scheme.entity.js';
import { IssueSecurityLevel } from '../rbac/entities/issue-security-level.entity.js';
import { IssueSecurityGrant } from '../rbac/entities/issue-security-grant.entity.js';
import { Sprint } from '../sprints/entities/sprint.entity.js';
import { SeedService } from './seed.service.js';
import { SystemInitService } from './system-init.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Project,
      Sprint,
      Issue,
      IssueLink,
      Worklog,
      Comment,
      Group,
      UserGroup,
      ProjectRole,
      ProjectRoleActor,
      PermissionScheme,
      PermissionGrant,
      IssueSecurityScheme,
      IssueSecurityLevel,
      IssueSecurityGrant,
    ]),
  ],
  controllers: [],
  providers: [SeedService, SystemInitService],
  exports: [SeedService, SystemInitService],
})
export class AdminModule {}
