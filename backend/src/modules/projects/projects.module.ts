import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { Project } from './entities/project.entity.js';
import { ProjectQuickFilter } from './entities/quick-filter.entity.js';
import { ProjectComponent } from './entities/project-component.entity.js';
import { ProjectVersion } from './entities/project-version.entity.js';
import { Issue } from '../issues/entities/issue.entity.js';
import { ProjectsController } from './projects.controller.js';
import { ProjectsService } from './projects.service.js';
import { PermissionScheme } from '../rbac/entities/permission-scheme.entity.js';
import { ProjectRole } from '../rbac/entities/project-role.entity.js';
import { ProjectRoleActor } from '../rbac/entities/project-role-actor.entity.js';
import { RbacModule } from '../rbac/rbac.module.js';
import { IssuesModule } from '../issues/issues.module.js';
import { StorageModule } from '../storage/storage.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Project,
      ProjectQuickFilter,
      ProjectComponent,
      ProjectVersion,
      Issue,
      PermissionScheme,
      ProjectRole,
      ProjectRoleActor,
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    RbacModule,
    IssuesModule,
    StorageModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
