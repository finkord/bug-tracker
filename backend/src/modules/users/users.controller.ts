import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { User, SystemRole } from './entities/user.entity.js';
import { UpdateUserRoleDto } from './dto/update-user-role.dto.js';
import { ListUsersQueryDto } from './dto/list-users-query.dto.js';

@ApiTags('Users & Profile')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Get current user profile',
    description:
      'Returns current authenticated user details including email activation status, 2FA configuration, and avatar URL.',
  })
  async getProfile(@CurrentUser() user: User) {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      systemRole: user.systemRole,
      avatarUrl: user.avatarUrl,
      isActivated: user.isActivated,
      isBlocked: user.isBlocked,
      twoFactorEnabled: user.twoFactorEnabled,
      oauthProvider: user.oauthProvider,
      hasPassword: !!user.passwordHash,
      createdAt: user.createdAt,
    };
  }

  @Patch('me/avatar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update current user avatar URL or preset',
  })
  async updateAvatar(
    @CurrentUser() user: User,
    @Body('avatarUrl') avatarUrl: string,
  ) {
    const updated = await this.usersService.updateAvatar(user.id, avatarUrl);
    return {
      message: 'Avatar updated successfully',
      avatarUrl: updated.avatarUrl,
    };
  }

  @Patch('me/profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update current user profile info (Full name & Coworker job title)',
  })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() dto: { fullName?: string; jobTitle?: string },
  ) {
    const updated = await this.usersService.updateProfile(user.id, dto);
    return {
      message: 'Profile updated successfully',
      user: updated.toJSON(),
    };
  }

  @Get('me/filters')
  @ApiOperation({
    summary: 'Get saved search filters for current user',
  })
  async getMyFilters(@CurrentUser() user: User) {
    return this.usersService.getSavedFilters(user.id);
  }

  @Post('me/filters')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Save a new search filter for current user',
  })
  async createFilter(
    @CurrentUser() user: User,
    @Body() dto: { name: string; criteria: string },
  ) {
    return this.usersService.createSavedFilter(user.id, dto.name, dto.criteria);
  }

  @Delete('me/filters/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a saved search filter',
  })
  async deleteFilter(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.usersService.deleteSavedFilter(user.id, id);
    return { message: 'Filter deleted successfully' };
  }

  @Get('assignees')
  @ApiOperation({
    summary: 'Get active users eligible for issue assignment',
    description: 'Returns active user info (id, fullName, email, avatarUrl, systemRole) for dropdown selects.',
  })
  async getAssignees() {
    return this.usersService.findAssignees();
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(SystemRole.ADMIN)
  @ApiOperation({
    summary: 'Get system security and user metrics (Admin Dashboard)',
    description: 'Returns aggregated user totals, active counts, blocked accounts, 2FA adoption rates, and role breakdown.',
  })
  async getStats() {
    return this.usersService.getSystemStats();
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(SystemRole.ADMIN)
  @ApiOperation({
    summary: 'List users with pagination, search, and filters (Admin RBAC)',
  })
  async listUsers(@Query() query: ListUsersQueryDto) {
    return this.usersService.findAll(
      query.page,
      query.limit,
      query.search,
      query.role,
      query.isBlocked,
      query.isActivated,
    );
  }

  @Patch(':id/role')
  @UseGuards(RolesGuard)
  @Roles(SystemRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change user system role (Extended RBAC)',
    description:
      'Modifies user role across ADMIN, PROJECT_MANAGER, DEVELOPER, QA_ENGINEER, USER. Prevents administrators from demoting themselves.',
  })
  @ApiResponse({ status: 200, description: 'Role successfully modified' })
  @ApiResponse({ status: 400, description: 'Self-demotion attempt rejected' })
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() admin: User,
  ) {
    const updated = await this.usersService.updateRole(id, dto.role, admin.id, dto.jobTitle);
    return {
      message: `User #${id} role has been updated to ${updated.systemRole}`,
      userId: updated.id,
      systemRole: updated.systemRole,
      jobTitle: updated.jobTitle,
    };
  }

  @Patch(':id/activate')
  @UseGuards(RolesGuard)
  @Roles(SystemRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Manually activate user account (Admin override for Task 3)',
  })
  async activateUser(@Param('id', ParseIntPipe) id: number) {
    const updated = await this.usersService.activateUser(id);
    return {
      message: `User #${id} has been manually activated`,
      userId: updated.id,
      isActivated: updated.isActivated,
    };
  }

  @Patch(':id/reset-2fa')
  @UseGuards(RolesGuard)
  @Roles(SystemRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset user 2FA configuration (Admin recovery for Task 5)',
    description: 'Disables two-factor authentication and clears the TOTP secret if a user is locked out.',
  })
  async reset2Fa(@Param('id', ParseIntPipe) id: number) {
    const updated = await this.usersService.reset2Fa(id);
    return {
      message: `Two-factor authentication has been reset for user #${id}`,
      userId: updated.id,
      twoFactorEnabled: updated.twoFactorEnabled,
    };
  }

  @Patch(':id/block')
  @UseGuards(RolesGuard)
  @Roles(SystemRole.ADMIN)
  @ApiOperation({
    summary: 'Block a user account (SDSecurity Task 4: Admin controls)',
  })
  async blockUser(@Param('id', ParseIntPipe) id: number) {
    const updated = await this.usersService.blockUser(id);
    return {
      message: `User account #${id} has been blocked`,
      userId: updated.id,
      isBlocked: updated.isBlocked,
    };
  }

  @Patch(':id/unblock')
  @UseGuards(RolesGuard)
  @Roles(SystemRole.ADMIN)
  @ApiOperation({
    summary: 'Unblock a user account (SDSecurity Task 4: Admin controls)',
  })
  async unblockUser(@Param('id', ParseIntPipe) id: number) {
    const updated = await this.usersService.unblockUser(id);
    return {
      message: `User account #${id} has been unblocked`,
      userId: updated.id,
      isBlocked: updated.isBlocked,
    };
  }
}
