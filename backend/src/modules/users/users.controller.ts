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
  UseInterceptors,
  UploadedFile,
  Res,
  BadRequestException,
  NotFoundException,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { User, SystemRole } from './entities/user.entity.js';
import { UpdateUserRoleDto } from './dto/update-user-role.dto.js';
import { ListUsersQueryDto } from './dto/list-users-query.dto.js';
import { CreateSavedFilterDto, UpdateSavedFilterDto } from './dto/saved-filter.dto.js';
import type { UploadedFileInput } from '../storage/services/seaweedfs.service.js';

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
    const groups = await this.usersService.getUserGroups(user.id);
    const isAdmin =
      groups.some((g) => ['administrators', 'admin', 'admins'].includes(g.toLowerCase())) ||
      user.systemRole === SystemRole.ADMIN;

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      systemRole: user.systemRole,
      jobTitle: user.jobTitle,
      avatarUrl: user.avatarUrl,
      groups,
      isAdmin,
      isRoot: this.usersService.isRootUser(user),
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

  @Post('me/avatar/upload')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('avatar', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload avatar image file directly to SeaweedFS distributed storage',
  })
  async uploadAvatar(
    @CurrentUser() user: User,
    @UploadedFile() file: UploadedFileInput | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    const updated = await this.usersService.uploadAvatarFile(user.id, file);
    return {
      message: 'Avatar uploaded successfully',
      avatarUrl: updated.avatarUrl,
    };
  }

  @Public()
  @Get('avatar/:fid')
  @ApiOperation({
    summary: 'Stream avatar image directly from SeaweedFS object storage',
  })
  async getAvatarFile(
    @Param('fid') fid: string,
    @Res() res: Response,
  ) {
    const { buffer, contentType } = await this.usersService.getAvatarBuffer(fid);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Content-Disposition', 'inline');
    res.send(buffer);
  }

  @Get('me/preferences')
  @ApiOperation({
    summary: 'Get cross-device persisted preferences for current user',
  })
  async getMyPreferences(@CurrentUser() user: User) {
    return this.usersService.getPreferences(user.id);
  }

  @Patch('me/preferences')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update cross-device persisted preferences for current user',
  })
  async updateMyPreferences(
    @CurrentUser() user: User,
    @Body() preferences: Record<string, unknown>,
  ) {
    return this.usersService.updatePreferences(user.id, preferences);
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
    @Body() dto: CreateSavedFilterDto,
  ) {
    return this.usersService.createSavedFilter(user.id, dto);
  }

  @Patch('me/filters/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a saved search filter (name, criteria, description, favorite)',
  })
  async updateFilter(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSavedFilterDto,
  ) {
    return this.usersService.updateSavedFilter(user.id, id, dto);
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
    description: 'Returns active user info (id, fullName, email, avatarUrl, systemRole) for dropdown selects with pagination and search.',
  })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAssignees(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.usersService.findAssignees(search, Number(page) || 1, Number(limit) || 50);
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

  @Get(':id')
  @ApiOperation({
    summary: 'Get public user profile by ID',
    description: 'Returns public user details for profile popovers and member pages.',
  })
  @ApiResponse({ status: 200, description: 'User public profile returned' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      systemRole: user.systemRole,
      jobTitle: user.jobTitle,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    };
  }

  @Patch(':id/role')
  @UseGuards(RolesGuard)
  @Roles(SystemRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change user system role (Extended RBAC)',
    description:
      'Modifies user role between ADMIN and USER. Prevents root administrators from being demoted.',
  })
  @ApiResponse({ status: 200, description: 'Role successfully modified' })
  @ApiResponse({ status: 403, description: 'Root administrator demotion attempt rejected' })
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
    summary: 'Block a user account (Admin controls)',
    description: 'Blocks a user account. Root administrator accounts cannot be blocked.',
  })
  @ApiResponse({ status: 200, description: 'User successfully blocked' })
  @ApiResponse({ status: 403, description: 'Root administrator block attempt rejected' })
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
    summary: 'Unblock a user account (Admin controls)',
  })
  async unblockUser(@Param('id', ParseIntPipe) id: number) {
    const updated = await this.usersService.unblockUser(id);
    return {
      message: `User account #${id} has been unblocked`,
      userId: updated.id,
      isBlocked: updated.isBlocked,
    };
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(SystemRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a user account (Admin controls)',
    description: 'Permanently removes a user account. Root administrator accounts cannot be deleted.',
  })
  @ApiResponse({ status: 200, description: 'User successfully deleted' })
  @ApiResponse({ status: 403, description: 'Root administrator deletion attempt rejected' })
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.deleteUser(id);
  }
}
