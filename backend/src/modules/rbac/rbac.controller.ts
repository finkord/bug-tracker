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

  @Delete('rbac/groups/:id')
  @UseGuards(RolesGuard)
  @Roles(SystemRole.ADMIN)
  @ApiOperation({ summary: 'Delete directory group' })
  async deleteGroup(@Param('id', ParseIntPipe) id: number) {
    await this.rbacService.deleteGroup(id);
    return { success: true, message: 'Group deleted successfully' };
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

  @Put('rbac/roles/:id')
  @UseGuards(RolesGuard)
  @Roles(SystemRole.ADMIN)
  @ApiOperation({ summary: 'Update global project role' })
  async updateProjectRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { name?: string; description?: string; isDefault?: boolean },
  ) {
    return this.rbacService.updateProjectRole(id, dto);
  }

  @Delete('rbac/roles/:id')
  @UseGuards(RolesGuard)
  @Roles(SystemRole.ADMIN)
  @ApiOperation({ summary: 'Delete global project role' })
  async deleteProjectRole(@Param('id', ParseIntPipe) id: number) {
    await this.rbacService.deleteProjectRole(id);
    return { success: true, message: 'Project role deleted successfully' };
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

  @Delete('rbac/permission-schemes/:id')
  @UseGuards(RolesGuard)
  @Roles(SystemRole.ADMIN)
  @ApiOperation({ summary: 'Delete permission scheme' })
  async deletePermissionScheme(@Param('id', ParseIntPipe) id: number) {
    await this.rbacService.deletePermissionScheme(id);
    return { success: true, message: 'Permission scheme deleted successfully' };
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

  @Post('rbac/security-schemes')
  @UseGuards(RolesGuard)
  @Roles(SystemRole.ADMIN)
  @ApiOperation({ summary: 'Create issue security scheme' })
  async createSecurityScheme(@Body() dto: { name: string; description?: string }) {
    return this.rbacService.createSecurityScheme(dto.name, dto.description);
  }

  @Delete('rbac/security-schemes/:id')
  @UseGuards(RolesGuard)
  @Roles(SystemRole.ADMIN)
  @ApiOperation({ summary: 'Delete issue security scheme' })
  async deleteSecurityScheme(@Param('id', ParseIntPipe) id: number) {
    await this.rbacService.deleteSecurityScheme(id);
    return { success: true, message: 'Issue security scheme deleted successfully' };
  }

  @Post('rbac/security-schemes/:id/levels')
  @UseGuards(RolesGuard)
  @Roles(SystemRole.ADMIN)
  @ApiOperation({ summary: 'Add a security level to an issue security scheme' })
  async addSecurityLevel(
    @Param('id', ParseIntPipe) schemeId: number,
    @Body() dto: { name: string; description?: string },
  ) {
    return this.rbacService.addSecurityLevel(schemeId, dto);
  }

  @Delete('rbac/security-schemes/:id/levels/:levelId')
  @UseGuards(RolesGuard)
  @Roles(SystemRole.ADMIN)
  @ApiOperation({ summary: 'Delete a security level from an issue security scheme' })
  async deleteSecurityLevel(
    @Param('id', ParseIntPipe) schemeId: number,
    @Param('levelId', ParseIntPipe) levelId: number,
  ) {
    await this.rbacService.deleteSecurityLevel(schemeId, levelId);
    return { success: true, message: 'Security level deleted successfully' };
  }

  @Put('rbac/security-schemes/:id/default-level')
  @UseGuards(RolesGuard)
  @Roles(SystemRole.ADMIN)
  @ApiOperation({ summary: 'Set the default security level for an issue security scheme' })
  async setDefaultSecurityLevel(
    @Param('id', ParseIntPipe) schemeId: number,
    @Body() dto: { defaultLevelId: number | null },
  ) {
    return this.rbacService.setDefaultSecurityLevel(schemeId, dto.defaultLevelId);
  }

  @Post('rbac/security-schemes/:id/levels/:levelId/grants')
  @UseGuards(RolesGuard)
  @Roles(SystemRole.ADMIN)
  @ApiOperation({ summary: 'Add an actor grant to a security level' })
  async addSecurityGrant(
    @Param('id', ParseIntPipe) schemeId: number,
    @Param('levelId', ParseIntPipe) levelId: number,
    @Body()
    dto: {
      grantType: PermissionGrantType;
      roleId?: number;
      groupId?: number;
    },
  ) {
    return this.rbacService.addSecurityGrant(schemeId, levelId, dto);
  }

  @Delete('rbac/security-schemes/levels/grants/:grantId')
  @UseGuards(RolesGuard)
  @Roles(SystemRole.ADMIN)
  @ApiOperation({ summary: 'Remove an actor grant from a security level' })
  async deleteSecurityGrant(@Param('grantId', ParseIntPipe) grantId: number) {
    await this.rbacService.deleteSecurityGrant(grantId);
    return { success: true, message: 'Security grant removed successfully' };
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
  @UseGuards(ProjectPermissionGuard)
  @RequireProjectPermission(ProjectPermission.ADMINISTER_PROJECTS)
  @ApiOperation({ summary: 'Assign permission scheme to project' })
  async assignPermissionSchemeToProject(
    @Param('id', ParseIntPipe) projectId: number,
    @Body() dto: { schemeId: number },
  ) {
    return this.rbacService.assignPermissionSchemeToProject(projectId, dto.schemeId);
  }
}
