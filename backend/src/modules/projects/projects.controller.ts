import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ProjectsService } from './projects.service.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';
import { CreateQuickFilterDto, UpdateQuickFilterDto } from './dto/quick-filter.dto.js';
import { CreateComponentDto } from './dto/component.dto.js';
import {
  CreateProjectVersionDto,
  UpdateProjectVersionDto,
  ReleaseVersionDto,
} from './dto/project-version.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { User } from '../users/entities/user.entity.js';
import { ProjectPermissionGuard } from '../rbac/guards/project-permission.guard.js';
import { RequireProjectPermission } from '../rbac/decorators/require-permission.decorator.js';
import { ProjectPermission } from '../rbac/entities/permission-grant.entity.js';
import type { UploadedFileInput } from '../storage/services/seaweedfs.service.js';

@ApiTags('Projects')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, ProjectPermissionGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({
    summary: 'List all software projects',
    description: 'Retrieves all registered projects with issue count aggregations.',
  })
  async findAll(@CurrentUser() user: User) {
    return this.projectsService.findAll(user);
  }

  @Public()
  @Get('avatar/:fid')
  @ApiOperation({
    summary: 'Stream project avatar image directly from SeaweedFS object storage',
  })
  async getAvatarFile(
    @Param('fid') fid: string,
    @Res() res: Response,
  ) {
    const { buffer, contentType } = await this.projectsService.getAvatarBuffer(fid);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Content-Disposition', 'inline');
    res.send(buffer);
  }

  @Get('key/:key')
  @RequireProjectPermission(ProjectPermission.BROWSE_PROJECTS)
  @ApiOperation({ summary: 'Get project details by project key' })
  async findByKey(@Param('key') key: string) {
    return this.projectsService.findByIdOrKey(key);
  }

  @Get(':id')
  @RequireProjectPermission(ProjectPermission.BROWSE_PROJECTS)
  @ApiOperation({ summary: 'Get project details by ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.findById(id);
  }

  @Post(':id/avatar/upload')
  @HttpCode(HttpStatus.OK)
  @RequireProjectPermission(ProjectPermission.ADMINISTER_PROJECTS)
  @UseInterceptors(FileInterceptor('avatar', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload project avatar image file directly to SeaweedFS distributed storage',
  })
  async uploadAvatar(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: UploadedFileInput | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    const updated = await this.projectsService.uploadAvatar(id, file);
    return {
      message: 'Project avatar uploaded successfully',
      avatarUrl: updated.avatarUrl,
    };
  }

  @Patch(':id/avatar')
  @HttpCode(HttpStatus.OK)
  @RequireProjectPermission(ProjectPermission.ADMINISTER_PROJECTS)
  @ApiOperation({
    summary: 'Update project avatar URL or preset',
  })
  async updateAvatar(
    @Param('id', ParseIntPipe) id: number,
    @Body('avatarUrl') avatarUrl: string,
  ) {
    const updated = await this.projectsService.update(id, { avatarUrl });
    return {
      message: 'Project avatar updated successfully',
      avatarUrl: updated.avatarUrl,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new project workspace',
    description: 'Creates project workspace with unique key. Sets caller as project lead.',
  })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  @ApiResponse({ status: 409, description: 'Project key already exists' })
  async create(@Body() dto: CreateProjectDto, @CurrentUser() user: User) {
    return this.projectsService.create(dto, user);
  }

  @Patch(':id')
  @RequireProjectPermission(ProjectPermission.ADMINISTER_PROJECTS)
  @ApiOperation({ summary: 'Update project settings' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, dto);
  }

  @Delete(':id')
  @RequireProjectPermission(ProjectPermission.ADMINISTER_PROJECTS)
  @ApiOperation({ summary: 'Delete project workspace' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.remove(id);
  }

  @Get(':id/quick-filters')
  @RequireProjectPermission(ProjectPermission.BROWSE_PROJECTS)
  @ApiOperation({ summary: 'List board quick filters for project' })
  async getQuickFilters(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.getProjectQuickFilters(id);
  }

  @Post(':id/quick-filters')
  @HttpCode(HttpStatus.CREATED)
  @RequireProjectPermission(ProjectPermission.ADMINISTER_PROJECTS)
  @ApiOperation({ summary: 'Create custom board quick filter' })
  async createQuickFilter(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateQuickFilterDto,
  ) {
    return this.projectsService.createQuickFilter(id, dto);
  }

  @Put(':id/quick-filters/:filterId')
  @RequireProjectPermission(ProjectPermission.ADMINISTER_PROJECTS)
  @ApiOperation({ summary: 'Update board quick filter' })
  async updateQuickFilter(
    @Param('id', ParseIntPipe) id: number,
    @Param('filterId', ParseIntPipe) filterId: number,
    @Body() dto: UpdateQuickFilterDto,
  ) {
    return this.projectsService.updateQuickFilter(id, filterId, dto);
  }

  @Delete(':id/quick-filters/:filterId')
  @RequireProjectPermission(ProjectPermission.ADMINISTER_PROJECTS)
  @ApiOperation({ summary: 'Delete board quick filter' })
  async deleteQuickFilter(
    @Param('id', ParseIntPipe) id: number,
    @Param('filterId', ParseIntPipe) filterId: number,
  ) {
    return this.projectsService.deleteQuickFilter(id, filterId);
  }

  @Get(':id/components')
  @ApiOperation({ summary: 'List project components' })
  async getComponents(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.getComponents(id);
  }

  @Post(':id/components')
  @HttpCode(HttpStatus.CREATED)
  @RequireProjectPermission(ProjectPermission.ADMINISTER_PROJECTS)
  @ApiOperation({ summary: 'Create project component' })
  async createComponent(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateComponentDto,
  ) {
    return this.projectsService.createComponent(id, dto);
  }

  @Delete(':id/components/:componentId')
  @RequireProjectPermission(ProjectPermission.ADMINISTER_PROJECTS)
  @ApiOperation({ summary: 'Delete project component' })
  async deleteComponent(
    @Param('id', ParseIntPipe) id: number,
    @Param('componentId', ParseIntPipe) componentId: number,
  ) {
    return this.projectsService.deleteComponent(id, componentId);
  }

  // --- Software Releases & Versions ---

  @Get(':id/versions')
  @RequireProjectPermission(ProjectPermission.BROWSE_PROJECTS)
  @ApiOperation({ summary: 'List all software release versions with completion metrics' })
  async getVersions(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.getVersions(id);
  }

  @Post(':id/versions')
  @HttpCode(HttpStatus.CREATED)
  @RequireProjectPermission(ProjectPermission.ADMINISTER_PROJECTS)
  @ApiOperation({ summary: 'Create a new software release version' })
  async createVersion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateProjectVersionDto,
  ) {
    return this.projectsService.createVersion(id, dto);
  }

  @Patch(':id/versions/:versionId')
  @RequireProjectPermission(ProjectPermission.ADMINISTER_PROJECTS)
  @ApiOperation({ summary: 'Update a project version' })
  async updateVersion(
    @Param('id', ParseIntPipe) id: number,
    @Param('versionId', ParseIntPipe) versionId: number,
    @Body() dto: UpdateProjectVersionDto,
  ) {
    return this.projectsService.updateVersion(id, versionId, dto);
  }

  @Delete(':id/versions/:versionId')
  @RequireProjectPermission(ProjectPermission.ADMINISTER_PROJECTS)
  @ApiOperation({ summary: 'Delete a project version' })
  async deleteVersion(
    @Param('id', ParseIntPipe) id: number,
    @Param('versionId', ParseIntPipe) versionId: number,
  ) {
    return this.projectsService.deleteVersion(id, versionId);
  }

  @Post(':id/versions/:versionId/release')
  @HttpCode(HttpStatus.OK)
  @RequireProjectPermission(ProjectPermission.ADMINISTER_PROJECTS)
  @ApiOperation({ summary: 'Mark version as released and optionally migrate open issues' })
  async releaseVersion(
    @Param('id', ParseIntPipe) id: number,
    @Param('versionId', ParseIntPipe) versionId: number,
    @Body() dto: ReleaseVersionDto,
  ) {
    return this.projectsService.releaseVersion(id, versionId, dto);
  }

  @Get(':id/versions/:versionId/release-notes')
  @RequireProjectPermission(ProjectPermission.BROWSE_PROJECTS)
  @ApiOperation({ summary: 'Generate formatted markdown release notes for a version' })
  async generateReleaseNotes(
    @Param('id', ParseIntPipe) id: number,
    @Param('versionId', ParseIntPipe) versionId: number,
  ) {
    return this.projectsService.generateReleaseNotes(id, versionId);
  }
}
