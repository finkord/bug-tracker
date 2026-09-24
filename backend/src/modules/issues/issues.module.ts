import { User } from '../users/entities/user.entity.js';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { Issue } from './entities/issue.entity.js';
import { Comment } from './entities/comment.entity.js';
import { Worklog } from './entities/worklog.entity.js';
import { Attachment } from './entities/attachment.entity.js';
import { SeaweedFsService } from './services/seaweedfs.service.js';
import { Project } from '../projects/entities/project.entity.js';
import { IssuesController } from './issues.controller.js';
import { IssuesService } from './issues.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Issue, Comment, Project, Worklog, User, Attachment]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [IssuesController],
  providers: [IssuesService, SeaweedFsService],
  exports: [IssuesService, SeaweedFsService],
})
export class IssuesModule {}
