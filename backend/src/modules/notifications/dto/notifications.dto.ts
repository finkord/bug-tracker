import { IsNotEmpty, IsString, IsEnum, IsOptional, IsInt } from 'class-validator';
import { NotificationType } from '../entities/notification.entity.js';

export class CreateNotificationDto {
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @IsOptional()
  @IsInt()
  actorId?: number;

  @IsOptional()
  @IsInt()
  issueId?: number;

  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}

export class QueryNotificationsDto {
  @IsOptional()
  unreadOnly?: boolean | string;

  @IsOptional()
  page?: number | string;

  @IsOptional()
  limit?: number | string;
}

export class MarkNotificationsReadDto {
  @IsOptional()
  notificationIds?: number[];
}

export class SnoozeNotificationDto {
  @IsNotEmpty()
  snoozeUntil: string;
}
