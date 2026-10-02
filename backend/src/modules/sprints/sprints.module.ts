import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { Sprint } from './entities/sprint.entity.js';
import { SprintSnapshot } from './entities/sprint-snapshot.entity.js';
import { Project } from '../projects/entities/project.entity.js';
import { Issue } from '../issues/entities/issue.entity.js';
import { IssueHistory } from '../issues/entities/issue-history.entity.js';
import { SprintsService } from './sprints.service.js';
import { SprintsController } from './sprints.controller.js';
import { RbacModule } from '../rbac/rbac.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sprint, SprintSnapshot, Project, Issue, IssueHistory]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    RbacModule,
  ],
  controllers: [SprintsController],
  providers: [SprintsService],
  exports: [SprintsService],
})
export class SprintsModule {}
