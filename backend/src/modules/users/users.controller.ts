import {
  Controller,
  Get,
  Patch,
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
    summary: 'Get current user profile (SDSecurity Task 1 & Task 3)',
    description:
      'Returns current authenticated user details including email activation status and 2FA configuration.',
  })
  async getProfile(@CurrentUser() user: User) {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      systemRole: user.systemRole,
      isActivated: user.isActivated,
      isBlocked: user.isBlocked,
      twoFactorEnabled: user.twoFactorEnabled,
      oauthProvider: user.oauthProvider,
      hasPassword: !!user.passwordHash,
      createdAt: user.createdAt,
    };
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(SystemRole.ADMIN)
  @ApiOperation({
    summary: 'Get system security and user metrics (Admin Dashboard)',
    description: 'Returns aggregated user totals, active counts, blocked accounts, and 2FA adoption rates.',
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
    summary: 'Change user system role (PPofSE Tier 1 RBAC)',
    description:
      'Promotes or demotes user between ADMIN and USER roles. Prevents administrators from demoting themselves.',
  })
  @ApiResponse({ status: 200, description: 'Role successfully modified' })
  @ApiResponse({ status: 400, description: 'Self-demotion attempt rejected' })
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() admin: User,
  ) {
    const updated = await this.usersService.updateRole(id, dto.role, admin.id);
    return {
      message: `User #${id} role has been updated to ${updated.systemRole}`,
      userId: updated.id,
      systemRole: updated.systemRole,
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

