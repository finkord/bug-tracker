import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { User, SystemRole } from './entities/user.entity.js';

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
      createdAt: user.createdAt,
    };
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(SystemRole.ADMIN)
  @ApiOperation({
    summary: 'List all users and statuses (SDSecurity Task 4: Admin RBAC)',
  })
  async listUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit = 50,
  ) {
    return this.usersService.findAll(page, limit);
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
