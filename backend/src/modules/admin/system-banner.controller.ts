import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Optional,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SystemBannerService, type BroadcastConfig } from './system-banner.service.js';
import { EventsGateway } from '../events/events.gateway.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { User, SystemRole } from '../users/entities/user.entity.js';

@ApiTags('System & Governance')
@Controller('system')
export class SystemBannerController {
  constructor(
    private readonly bannerService: SystemBannerService,
    @Optional()
    private readonly eventsGateway?: EventsGateway,
  ) {}

  @Public()
  @Get('banner')
  @ApiOperation({
    summary: 'Get active system announcement broadcast banner',
  })
  async getBanner(): Promise<BroadcastConfig> {
    return this.bannerService.getBanner();
  }

  @Put('banner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update and broadcast system announcement banner across all connected users (Admin only)',
  })
  async updateBanner(
    @CurrentUser() user: User,
    @Body() dto: Partial<BroadcastConfig>,
  ): Promise<BroadcastConfig> {
    const author = user.fullName || user.email;
    const updated = await this.bannerService.updateBanner(dto, author);
    if (this.eventsGateway) {
      this.eventsGateway.broadcastSystemBanner(updated);
    }
    return updated;
  }
}
