import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { SystemRole, User } from '../users/entities/user.entity.js';
import { RbacService } from './services/rbac.service.js';
import { PermissionEvaluatorService } from './services/permission-evaluator.service.js';
import { ProjectActorType } from './entities/project-role-actor.entity.js';
import {
  ProjectPermission,
  PermissionGrantType,
} from './entities/permission-grant.entity.js';
import { ProjectPermissionGuard } from './guards/project-permission.guard.js';
import { RequireProjectPermission } from './decorators/require-permission.decorator.js';

@ApiTags('RBAC & Project Permissions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller()
export class RbacController {
  constructor(
    private readonly rbacService: RbacService,
    private readonly permissionEvaluator: PermissionEvaluatorService,
  ) {}

  // ================= GLOBAL GROUPS =================
  @Get('rbac/groups')
  @ApiOperation({ summary: 'List all global directory groups' })
  async getGroups() {
    return this.rbacService.getGroups();
  }

  @Post('rbac/groups')
  @UseGuards(RolesGuard)
  @Roles(SystemRole.ADMIN)
  @ApiOperation({ summary: 'Create new global group (Admin only)' })
  async createGroup(@Body() dto: { name: string; description?: string }) {
    return this.rbacService.createGroup(dto.name, dto.description);
  }

  @Post('rbac/groups/:id/members')
  @UseGuards(RolesGuard)
  @Roles(SystemRole.ADMIN)
  @ApiOperation({ summary: 'Add user to global group' })
  async addUserToGroup(
    @Param('id', ParseIntPipe) groupId: number,
    @Body() dto: { userId: number },
  ) {
    return this.rbacService.addUserToGroup(groupId, dto.userId);
  }

  @Delete('rbac/groups/:id/members/:userId')
  @UseGuards(RolesGuard)
  @Roles(SystemRole.ADMIN)
  @ApiOperation({ summary: 'Remove user from global group' })
  async removeUserFromGroup(
    @Param('id', ParseIntPipe) groupId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    await this.rbacService.removeUserFromGroup(groupId, userId);
    return { success: true, message: 'User removed from group' };
  }

  // ================= PROJECT ROLES =================
  @Get('rbac/roles')
  @ApiOperation({ summary: 'List globally defined project roles' })
  async getProjectRoles() {
    return this.rbacService.getProjectRoles();
  }

  @Post('rbac/roles')
  @UseGuards(RolesGuard)
  @Roles(SystemRole.ADMIN)
  @ApiOperation({ summary: 'Create global project role' })
  async createProjectRole(
    @Body() dto: { name: string; description?: string; isDefault?: boolean },
  ) {
    return this.rbacService.createProjectRole(dto.name, dto.description, dto.isDefault);
  }

  // ================= PERMISSION SCHEMES =================
  @Get('rbac/permission-schemes')
  @ApiOperation({ summary: 'List all permission schemes' })
  async getPermissionSchemes() {
    return this.rbacService.getPermissionSchemes();
  }

  @Get('rbac/permission-schemes/:id')
  @ApiOperation({ summary: 'Get permission scheme details and grants matrix' })
  async getPermissionScheme(@Param('id', ParseIntPipe) id: number) {
    return this.rbacService.getPermissionScheme(id);
  }

  @Post('rbac/permission-schemes')
  @UseGuards(RolesGuard)
  @Roles(SystemRole.ADMIN)
  @ApiOperation({ summary: 'Create new permission scheme' })
  async createPermissionScheme(@Body() dto: { name: string; description?: string }) {
    return this.rbacService.createPermissionScheme(dto.name, dto.description);
  }

  @Post('rbac/permission-schemes/:id/grants')
  @UseGuards(RolesGuard)
  @Roles(SystemRole.ADMIN)
  @ApiOperation({ summary: 'Add permission grant to scheme' })
  async addPermissionGrant(
    @Param('id', ParseIntPipe) schemeId: number,
    @Body()
    dto: {
      permission: ProjectPermission;
      grantType: PermissionGrantType;
      roleId?: number;
      groupId?: number;
    },
  ) {
    return this.rbacService.addPermissionGrant(schemeId, dto);
  }

  @Delete('rbac/permission-schemes/:id/grants/:grantId')
  @UseGuards(RolesGuard)
  @Roles(SystemRole.ADMIN)
  @ApiOperation({ summary: 'Remove permission grant from scheme' })
  async removePermissionGrant(
    @Param('grantId', ParseIntPipe) grantId: number,
  ) {
    await this.rbacService.removePermissionGrant(grantId);
    return { success: true, message: 'Grant removed from scheme' };
  }

  // ================= ISSUE SECURITY SCHEMES =================
  @Get('rbac/security-schemes')
  @ApiOperation({ summary: 'List issue security schemes' })
  async getSecuritySchemes() {
    return this.rbacService.getSecuritySchemes();
  }

  // ================= PROJECT RBAC & PEOPLE =================
  @Get('projects/:id/rbac/people')
  @UseGuards(ProjectPermissionGuard)
  @RequireProjectPermission(ProjectPermission.BROWSE_PROJECTS)
  @ApiOperation({ summary: 'List project roles with assigned users and groups' })
  async getProjectPeople(@Param('id', ParseIntPipe) projectId: number) {
    return this.rbacService.getProjectActors(projectId);
  }

  @Post('projects/:id/rbac/roles/:roleId/actors')
  @UseGuards(ProjectPermissionGuard)
  @RequireProjectPermission(ProjectPermission.ADMINISTER_PROJECTS)
  @ApiOperation({ summary: 'Assign user or group to a project role' })
  async addActorToProjectRole(
    @Param('id', ParseIntPipe) projectId: number,
    @Param('roleId', ParseIntPipe) roleId: number,
    @Body()
    dto: {
      actorType: ProjectActorType;
      userId?: number;
      groupId?: number;
    },
  ) {
    return this.rbacService.addActorToProjectRole(projectId, roleId, dto);
  }

  @Delete('projects/:id/rbac/roles/:roleId/actors/:actorId')
  @UseGuards(ProjectPermissionGuard)
  @RequireProjectPermission(ProjectPermission.ADMINISTER_PROJECTS)
  @ApiOperation({ summary: 'Remove user or group from a project role' })
  async removeActorFromProjectRole(
    @Param('actorId', ParseIntPipe) actorId: number,
  ) {
    await this.rbacService.removeActorFromProjectRole(actorId);
    return { success: true, message: 'Actor removed from project role' };
  }

  @Get('projects/:id/rbac/permissions/me')
  @ApiOperation({ summary: 'Get current user effective permissions for this project' })
  async getMyProjectPermissions(
    @Param('id', ParseIntPipe) projectId: number,
    @CurrentUser() user: User,
  ) {
    return this.permissionEvaluator.getEffectivePermissions(user.id, projectId);
  }

  @Put('projects/:id/rbac/permission-scheme')
  @UseGuards(RolesGuard)
  @Roles(SystemRole.ADMIN)
  @ApiOperation({ summary: 'Assign permission scheme to project' })
  async assignPermissionSchemeToProject(
    @Param('id', ParseIntPipe) projectId: number,
    @Body() dto: { schemeId: number },
  ) {
    return this.rbacService.assignPermissionSchemeToProject(projectId, dto.schemeId);
  }
}
