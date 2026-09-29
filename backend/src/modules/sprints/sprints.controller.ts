import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { SprintsService } from './sprints.service.js';
import { CreateSprintDto } from './dto/create-sprint.dto.js';
import { UpdateSprintDto, CompleteSprintDto } from './dto/update-sprint.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { ProjectPermissionGuard } from '../rbac/guards/project-permission.guard.js';
import { RequireProjectPermission } from '../rbac/decorators/require-permission.decorator.js';
import { ProjectPermission } from '../rbac/entities/permission-grant.entity.js';

@ApiTags('Agile Sprints')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, ProjectPermissionGuard)
@Controller('projects/:projectId/sprints')
export class SprintsController {
  constructor(private readonly sprintsService: SprintsService) {}

  @Get()
  @RequireProjectPermission(ProjectPermission.BROWSE_PROJECTS)
  @ApiOperation({ summary: 'List all sprints for a given project' })
  async getProjectSprints(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.sprintsService.getProjectSprints(projectId);
  }

  @Post()
  @RequireProjectPermission(ProjectPermission.ADMINISTER_PROJECTS)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new sprint in planned status' })
  async createSprint(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateSprintDto,
  ) {
    return this.sprintsService.createSprint(projectId, dto);
  }

  @Patch(':id')
  @RequireProjectPermission(ProjectPermission.ADMINISTER_PROJECTS)
  @ApiOperation({ summary: 'Update sprint details (name, goal, dates)' })
  async updateSprint(
    @Param('projectId', ParseIntPipe) _projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSprintDto,
  ) {
    return this.sprintsService.updateSprint(id, dto);
  }

  @Post(':id/start')
  @RequireProjectPermission(ProjectPermission.ADMINISTER_PROJECTS)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start a planned sprint' })
  async startSprint(
    @Param('projectId', ParseIntPipe) _projectId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.sprintsService.startSprint(id);
  }

  @Post(':id/complete')
  @RequireProjectPermission(ProjectPermission.ADMINISTER_PROJECTS)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete an active sprint and triage unresolved issues' })
  async completeSprint(
    @Param('projectId', ParseIntPipe) _projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CompleteSprintDto,
  ) {
    return this.sprintsService.completeSprint(id, dto);
  }

  @Delete(':id')
  @RequireProjectPermission(ProjectPermission.ADMINISTER_PROJECTS)
  @ApiOperation({ summary: 'Delete a sprint and return issues to backlog' })
  async deleteSprint(
    @Param('projectId', ParseIntPipe) _projectId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.sprintsService.deleteSprint(id);
  }
}
