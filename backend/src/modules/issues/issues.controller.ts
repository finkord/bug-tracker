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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { IssuesService } from './issues.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { User } from '../users/entities/user.entity.js';
import { IssueStatus } from './entities/issue.entity.js';
import { CreateIssueDto } from './dto/create-issue.dto.js';
import { ListIssuesQueryDto } from './dto/list-issues-query.dto.js';
import { LogWorkDto } from './dto/log-work.dto.js';

@ApiTags('Issues & Kanban')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('issues')
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Get()
  @ApiOperation({
    summary: 'List issues with multi-criteria filters (Kanban Board & Backlog)',
  })
  async findAll(@Query() query: ListIssuesQueryDto) {
    return this.issuesService.findAll(query);
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
  @ApiOperation({
    summary: 'Get single issue details with comments and worklog history',
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.issuesService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new issue (Available to all registered users)',
  })
  async create(@Body() dto: CreateIssueDto, @CurrentUser() user: User) {
    return this.issuesService.create(dto, user);
  }

  @Patch(':id/status')
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
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Move issue between Active Sprint and Backlog',
  })
  async updateSprint(
    @Param('id', ParseIntPipe) id: number,
    @Body('sprint') sprint: string | null,
  ) {
    return this.issuesService.updateSprint(id, sprint);
  }

  @Patch(':id')
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
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete an issue',
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.issuesService.remove(id);
  }

  @Post(':id/comments')
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
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 25 * 1024 * 1024 } }))
  @ApiOperation({ summary: 'Upload file attachment/evidence to SeaweedFS S3 storage' })
  async uploadAttachment(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: any,
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

  @Delete(':id/attachments/:attachmentId')
  @ApiOperation({ summary: 'Delete attachment from SeaweedFS and database' })
  async deleteAttachment(
    @Param('id', ParseIntPipe) id: number,
    @Param('attachmentId', ParseIntPipe) attachmentId: number,
    @CurrentUser() user: User,
  ) {
    return this.issuesService.deleteAttachment(id, attachmentId, user);
  }
}
