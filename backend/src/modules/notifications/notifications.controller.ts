import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service.js';
import {
  QueryNotificationsDto,
  MarkNotificationsReadDto,
  SnoozeNotificationDto,
} from './dto/notifications.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { User } from '../users/entities/user.entity.js';

@ApiTags('Notifications & Triage Inbox')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiOperation({ summary: 'Get current user notifications with optional unread filter' })
  @Get()
  async getNotifications(
    @CurrentUser() user: User,
    @Query() query: QueryNotificationsDto,
  ) {
    return this.notificationsService.getNotifications(user.id, query);
  }

  @ApiOperation({ summary: 'Get unread notification count for badge display' })
  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: User) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @ApiOperation({ summary: 'Mark notifications as read (batch or all)' })
  @HttpCode(HttpStatus.OK)
  @Post('mark-read')
  async markAsRead(
    @CurrentUser() user: User,
    @Body() dto: MarkNotificationsReadDto,
  ) {
    return this.notificationsService.markAsRead(user.id, dto);
  }

  @ApiOperation({ summary: 'Snooze a notification until a future time' })
  @HttpCode(HttpStatus.OK)
  @Post(':id/snooze')
  async snooze(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SnoozeNotificationDto,
  ) {
    return this.notificationsService.snooze(user.id, id, new Date(dto.snoozeUntil));
  }
}
