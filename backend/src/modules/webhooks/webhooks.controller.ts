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
import { WebhooksService } from './webhooks.service.js';
import { CreateWebhookDto } from './dto/create-webhook.dto.js';
import { UpdateWebhookDto } from './dto/update-webhook.dto.js';
import { WebhookResponseDto, WebhookTestResultDto } from './dto/webhook-response.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { ProjectPermissionGuard } from '../rbac/guards/project-permission.guard.js';
import { RequireProjectPermission } from '../rbac/decorators/require-permission.decorator.js';
import { ProjectPermission } from '../rbac/entities/permission-grant.entity.js';

@ApiTags('Webhooks')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, ProjectPermissionGuard)
@Controller('projects/:projectId/webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequireProjectPermission(ProjectPermission.ADMINISTER_PROJECTS)
  @ApiOperation({
    summary: 'Register outbound webhook',
    description: 'Registers a new outgoing webhook endpoint for project event subscriptions.',
  })
  @ApiResponse({ status: 201, type: WebhookResponseDto })
  async create(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateWebhookDto,
  ) {
    return this.webhooksService.create(projectId, dto);
  }

  @Get()
  @RequireProjectPermission(ProjectPermission.ADMINISTER_PROJECTS)
  @ApiOperation({
    summary: 'List project webhooks',
    description: 'Returns all outbound webhook subscriptions registered for the project.',
  })
  @ApiResponse({ status: 200, type: [WebhookResponseDto] })
  async findAll(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.webhooksService.findAll(projectId);
  }

  @Get(':id')
  @RequireProjectPermission(ProjectPermission.ADMINISTER_PROJECTS)
  @ApiOperation({ summary: 'Get webhook subscription details' })
  @ApiResponse({ status: 200, type: WebhookResponseDto })
  async findOne(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.webhooksService.findOne(projectId, id);
  }

  @Patch(':id')
  @RequireProjectPermission(ProjectPermission.ADMINISTER_PROJECTS)
  @ApiOperation({ summary: 'Update webhook subscription' })
  @ApiResponse({ status: 200, type: WebhookResponseDto })
  async update(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWebhookDto,
  ) {
    return this.webhooksService.update(projectId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequireProjectPermission(ProjectPermission.ADMINISTER_PROJECTS)
  @ApiOperation({ summary: 'Delete webhook subscription' })
  async remove(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.webhooksService.remove(projectId, id);
  }

  @Post(':id/test')
  @HttpCode(HttpStatus.OK)
  @RequireProjectPermission(ProjectPermission.ADMINISTER_PROJECTS)
  @ApiOperation({
    summary: 'Send test ping to webhook endpoint',
    description: 'Executes an immediate signed test payload to verify endpoint connectivity.',
  })
  @ApiResponse({ status: 200, type: WebhookTestResultDto })
  async testWebhook(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.webhooksService.testWebhook(projectId, id);
  }
}
