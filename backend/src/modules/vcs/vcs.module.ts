import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VcsPullRequest } from './entities/vcs-pull-request.entity.js';
import { Issue } from '../issues/entities/issue.entity.js';
import { IssueHistory } from '../issues/entities/issue-history.entity.js';
import { EventsModule } from '../events/events.module.js';
import { IssuesModule } from '../issues/issues.module.js';
import { VcsService } from './vcs.service.js';
import { VcsController } from './vcs.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([VcsPullRequest, Issue, IssueHistory]),
    EventsModule,
    IssuesModule,
  ],
  controllers: [VcsController],
  providers: [VcsService],
  exports: [VcsService],
})
export class VcsModule {}
