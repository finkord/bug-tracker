import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { Issue } from './entities/issue.entity.js';
import { Comment } from './entities/comment.entity.js';
import { Worklog } from './entities/worklog.entity.js';
import { Attachment } from './entities/attachment.entity.js';
import { IssueLink } from './entities/issue-link.entity.js';
import { Project } from '../projects/entities/project.entity.js';
import { User } from '../users/entities/user.entity.js';
import { Sprint } from '../sprints/entities/sprint.entity.js';
import { IssuesController } from './issues.controller.js';
import { IssuesService } from './issues.service.js';
import { IssueCoreService } from './services/issue-core.service.js';
import { IssueWorklogService } from './services/issue-worklog.service.js';
import { IssueLinksService } from './services/issue-links.service.js';
import { IssueCommentsService } from './services/issue-comments.service.js';
import { IssueAttachmentsService } from './services/issue-attachments.service.js';
import { SeaweedFsService } from './services/seaweedfs.service.js';
import { JqlParserService } from './services/jql-parser.service.js';
import { RbacModule } from '../rbac/rbac.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Issue, Comment, Project, Worklog, User, Attachment, IssueLink, Sprint]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    RbacModule,
  ],
  controllers: [IssuesController],
  providers: [
    IssueCoreService,
    IssueWorklogService,
    IssueLinksService,
    IssueCommentsService,
    IssueAttachmentsService,
    IssuesService,
    SeaweedFsService,
    JqlParserService,
  ],
  exports: [
    IssueCoreService,
    IssueWorklogService,
    IssueLinksService,
    IssueCommentsService,
    IssueAttachmentsService,
    IssuesService,
    SeaweedFsService,
    JqlParserService,
  ],
})
export class IssuesModule {}
