import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SecurityAuditService } from './security-audit.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { SystemRole } from '../users/entities/user.entity.js';

@ApiTags('Admin Security')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SystemRole.ADMIN)
@Controller('admin/security')
export class SecurityAuditController {
  constructor(private readonly securityAuditService: SecurityAuditService) {}

  @Get('login-logs')
  @ApiOperation({
    summary: 'View user login audit logs (SDSecurity Task 4)',
    description:
      'Allows administrators to inspect who attempted to authenticate, IP addresses, timestamps, and status outcomes.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getLoginLogs(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit = 50,
  ) {
    return this.securityAuditService.getLoginLogs(page, limit);
  }
}
