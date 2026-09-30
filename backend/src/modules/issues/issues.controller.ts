import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ForbiddenException,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IssuesService } from './issues.service.js';
import { SeaweedFsService, type UploadedFileInput } from './services/seaweedfs.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { User } from '../users/entities/user.entity.js';
import { IssueStatus } from './entities/issue.entity.js';
import { CreateIssueDto } from './dto/create-issue.dto.js';
import { ListIssuesQueryDto } from './dto/list-issues-query.dto.js';
import { UpdateIssueSprintDto } from './dto/update-issue-sprint.dto.js';
import { LogWorkDto } from './dto/log-work.dto.js';
import { CreateIssueLinkDto } from './dto/create-issue-link.dto.js';
import { ProjectPermissionGuard } from '../rbac/guards/project-permission.guard.js';
import { RequireProjectPermission } from '../rbac/decorators/require-permission.decorator.js';
import { ProjectPermission } from '../rbac/entities/permission-grant.entity.js';
import { PermissionEvaluatorService } from '../rbac/services/permission-evaluator.service.js';
import type { PaginatedIssuesResponseDto } from './dto/issue-response.dto.js';

@ApiTags('Issues & Kanban')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, ProjectPermissionGuard)
@Controller('issues')
export class IssuesController {
  constructor(
    private readonly issuesService: IssuesService,
    private readonly seaweedFsService: SeaweedFsService,
    private readonly permissionEvaluator: PermissionEvaluatorService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List issues with multi-criteria filters (Kanban Board & Backlog)',
  })
  async findAll(
    @Query() query: ListIssuesQueryDto,
    @CurrentUser() user: User,
  ): Promise<PaginatedIssuesResponseDto> {
    return this.issuesService.findAll(query, user);
  }

  @Get('worklogs/me')
  @ApiOperation({
    summary: 'Get worklogs logged by the current authenticated user',
  })
  async getMyWorklogs(@CurrentUser() user: User) {
    return this.issuesService.getMyWorklogs(user.id);
  }

  
  @Get('worklogs/matrix')
  @ApiOperation({
    summary: 'Get team timesheet matrix with daily hours per worker',
  })
  async getTimesheetMatrix(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.issuesService.getTeamTimesheetMatrix(startDate, endDate);
  }

  @Get('worklogs/stats')
  @ApiOperation({
    summary: 'Get aggregated time tracking statistics across projects and users',
  })
  async getWorklogStats() {
    return this.issuesService.getWorklogStats();
  }

  @Get(':id')
  @RequireProjectPermission(ProjectPermission.BROWSE_PROJECTS)
  @ApiOperation({
    summary: 'Get single issue details with comments and worklog history by ID or Issue Key (e.g. PROJ-6)',
  })
  async findOne(@Param('id') keyOrId: string) {
    return this.issuesService.findByKeyOrId(keyOrId);
  }

  @Post()
  @RequireProjectPermission(ProjectPermission.CREATE_ISSUES)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new issue in a project',
  })
  async create(@Body() dto: CreateIssueDto, @CurrentUser() user: User) {
    return this.issuesService.create(dto, user);
  }

  @Patch(':id/status')
  @RequireProjectPermission(ProjectPermission.TRANSITION_ISSUES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Transition issue FSM status (To Do, In Progress, Review, Resolved, Closed)',
  })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: IssueStatus,
  ) {
    return this.issuesService.updateStatus(id, status);
  }

  @Patch(':id/assign-me')
  @RequireProjectPermission(ProjectPermission.ASSIGNABLE_USER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Assign the issue directly to the authenticated developer (Self-assignment)',
  })
  async assignToMe(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.issuesService.assignToMe(id, user);
  }

  @Patch(':id/sprint')
  @RequireProjectPermission(ProjectPermission.EDIT_ISSUES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Move issue between Active Sprint and Backlog',
  })
  async updateSprint(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateIssueSprintDto,
  ) {
    return this.issuesService.updateSprint(id, dto.sprintId ?? null);
  }

  @Patch(':id')
  @RequireProjectPermission(ProjectPermission.EDIT_ISSUES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update issue title, description, priority, severity, or assignee',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateIssueDto>,
  ) {
    return this.issuesService.update(id, dto);
  }

  @Delete(':id')
  @RequireProjectPermission(ProjectPermission.DELETE_ISSUES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete an issue',
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.issuesService.remove(id);
  }

  @Post(':id/comments')
  @RequireProjectPermission(ProjectPermission.ADD_COMMENTS)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Post a comment to an issue thread',
  })
  async addComment(
    @Param('id', ParseIntPipe) id: number,
    @Body('text') text: string,
    @CurrentUser() user: User,
  ) {
    return this.issuesService.addComment(id, text, user);
  }

  @Post(':id/worklogs')
  @RequireProjectPermission(ProjectPermission.LOG_WORK)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Log work hours spent on an issue',
  })
  async logWork(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: LogWorkDto,
    @CurrentUser() user: User,
  ) {
    return this.issuesService.logWork(id, user, dto);
  }

  @Get(':id/worklogs')
  @ApiOperation({
    summary: 'Get all worklogs logged for an issue',
  })
  async getWorklogs(@Param('id', ParseIntPipe) id: number) {
    return this.issuesService.getWorklogs(id);
  }

  @Post(':id/attachments')
  @RequireProjectPermission(ProjectPermission.CREATE_ATTACHMENTS)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 25 * 1024 * 1024 } }))
  @ApiOperation({ summary: 'Upload file attachment/evidence to SeaweedFS S3 storage' })
  async uploadAttachment(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: UploadedFileInput | undefined,
    @CurrentUser() user: User,
  ) {
    if (!file) {
      throw new BadRequestException('A valid file payload is required');
    }
    return this.issuesService.uploadAttachment(id, file, user);
  }

  @Get(':id/attachments')
  @ApiOperation({ summary: 'Get all attachments linked to this issue' })
  async getAttachments(@Param('id', ParseIntPipe) id: number) {
    return this.issuesService.getAttachments(id);
  }

  @Get('attachments/:id/file')
  @ApiOperation({ summary: 'Serve attachment file securely from SeaweedFS' })
  async getAttachmentFile(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    const attachment = await this.issuesService.getAttachmentById(id);
    if (attachment.issue?.projectId) {
      const hasAccess = await this.permissionEvaluator.hasPermission({
        userId: user.id,
        projectId: attachment.issue.projectId,
        permission: ProjectPermission.BROWSE_PROJECTS,
        issueId: attachment.issueId,
      });
      if (!hasAccess) {
        throw new ForbiddenException('Insufficient permissions to access attachments in this project.');
      }
    }

    const { buffer, contentType } = await this.seaweedFsService.getFileBuffer(attachment.fid);
    const safeInlineTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
    const isSafeInline = safeInlineTypes.includes(contentType.toLowerCase());

    res.setHeader('Content-Type', isSafeInline ? contentType : 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      isSafeInline
        ? `inline; filename="${encodeURIComponent(attachment.filename)}"`
        : `attachment; filename="${encodeURIComponent(attachment.filename)}"`,
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'");
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(buffer);
  }

  @Delete(':id/attachments/:attachmentId')
  @RequireProjectPermission(ProjectPermission.DELETE_OWN_ATTACHMENTS)
  @ApiOperation({ summary: 'Delete attachment from SeaweedFS and database' })
  async deleteAttachment(
    @Param('id', ParseIntPipe) id: number,
    @Param('attachmentId', ParseIntPipe) attachmentId: number,
    @CurrentUser() user: User,
  ) {
    return this.issuesService.deleteAttachment(id, attachmentId, user);
  }

  @Get(':id/links')
  @ApiOperation({ summary: 'Get all semantic links/dependencies for an issue' })
  async getLinks(@Param('id', ParseIntPipe) id: number) {
    return this.issuesService.getIssueLinks(id);
  }

  @Post(':id/links')
  @RequireProjectPermission(ProjectPermission.EDIT_ISSUES)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a semantic dependency link between two issues' })
  async createLink(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateIssueLinkDto,
  ) {
    return this.issuesService.createIssueLink(id, dto);
  }

  @Delete('links/:linkId')
  @RequireProjectPermission(ProjectPermission.EDIT_ISSUES)
  @ApiOperation({ summary: 'Delete an existing issue link' })
  async deleteLink(@Param('linkId', ParseIntPipe) linkId: number) {
    return this.issuesService.deleteIssueLink(linkId);
  }
}
