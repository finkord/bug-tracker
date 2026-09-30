import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { Group } from './entities/group.entity.js';
import { UserGroup } from './entities/user-group.entity.js';
import { ProjectRole } from './entities/project-role.entity.js';
import { ProjectRoleActor } from './entities/project-role-actor.entity.js';
import { PermissionScheme } from './entities/permission-scheme.entity.js';
import { PermissionGrant } from './entities/permission-grant.entity.js';
import { IssueSecurityScheme } from './entities/issue-security-scheme.entity.js';
import { IssueSecurityLevel } from './entities/issue-security-level.entity.js';
import { IssueSecurityGrant } from './entities/issue-security-grant.entity.js';
import { User } from '../users/entities/user.entity.js';
import { Project } from '../projects/entities/project.entity.js';
import { Issue } from '../issues/entities/issue.entity.js';
import { RbacService } from './services/rbac.service.js';
import { PermissionEvaluatorService } from './services/permission-evaluator.service.js';
import { ProjectPermissionGuard } from './guards/project-permission.guard.js';
import { RbacController } from './rbac.controller.js';
import { RedisModule } from '../redis/redis.module.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    RedisModule,
    TypeOrmModule.forFeature([
      Group,
      UserGroup,
      ProjectRole,
      ProjectRoleActor,
      PermissionScheme,
      PermissionGrant,
      IssueSecurityScheme,
      IssueSecurityLevel,
      IssueSecurityGrant,
      User,
      Project,
      Issue,
    ]),
  ],
  controllers: [RbacController],
  providers: [RbacService, PermissionEvaluatorService, ProjectPermissionGuard],
  exports: [RbacService, PermissionEvaluatorService, ProjectPermissionGuard],
})
export class RbacModule {}
