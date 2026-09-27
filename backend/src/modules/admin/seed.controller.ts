import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SeedService } from './seed.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { SystemRole } from '../users/entities/user.entity.js';

import { IsOptional, IsBoolean } from 'class-validator';

class SeedDatabaseDto {
  @IsOptional()
  @IsBoolean()
  clean?: boolean = true;
}

@ApiTags('Admin / Database Seeding')
@Controller('admin')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post('seed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Seed realistic multi-team engineering dataset (UI, CORE, MONOPS, INFRAOPS, NETOPS)',
    description: 'Generates projects, engineers, tickets with sprint distributions, worklogs, and inter-team issue dependencies.',
  })
  @ApiResponse({ status: 200, description: 'Seeding completed successfully' })
  async seed(@Body() dto: SeedDatabaseDto) {
    const result = await this.seedService.runSeed({ clean: dto.clean ?? true });
    return {
      success: true,
      message: 'Realistic multi-team engineering dataset generated successfully',
      data: result,
    };
  }
}
