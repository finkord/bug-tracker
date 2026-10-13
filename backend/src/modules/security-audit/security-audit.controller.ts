import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SecurityAuditService } from './security-audit.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { SystemRole } from '../users/entities/user.entity.js';
import { FindLoginLogsQueryDto } from './dto/find-login-logs-query.dto.js';

@ApiTags('Admin Security')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SystemRole.ADMIN)
@Controller('admin/security')
export class SecurityAuditController {
  constructor(private readonly securityAuditService: SecurityAuditService) {}

  @Get('login-logs')
  @ApiOperation({
    summary: 'View user login audit logs',
    description:
      'Allows administrators to inspect who attempted to authenticate, IP addresses, timestamps, and status outcomes with optional search and status filtering.',
  })
  async getLoginLogs(@Query() query: FindLoginLogsQueryDto) {
    return this.securityAuditService.getLoginLogs(query);
  }
}
