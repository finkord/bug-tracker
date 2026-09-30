import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { Project } from './entities/project.entity.js';
import { ProjectsController } from './projects.controller.js';
import { ProjectsService } from './projects.service.js';
import { PermissionScheme } from '../rbac/entities/permission-scheme.entity.js';
import { ProjectRole } from '../rbac/entities/project-role.entity.js';
import { ProjectRoleActor } from '../rbac/entities/project-role-actor.entity.js';
import { RbacModule } from '../rbac/rbac.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Project,
      PermissionScheme,
      ProjectRole,
      ProjectRoleActor,
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    RbacModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
