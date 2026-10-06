import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity.js';
import {
  CreateNotificationDto,
  QueryNotificationsDto,
  MarkNotificationsReadDto,
} from './dto/notifications.dto.js';
import { EventsGateway } from '../events/events.gateway.js';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly eventsGateway: EventsGateway,
  ) {}

  /**
   * Creates and persists an in-app notification, broadcasting via real-time WebSocket.
   */
  async createNotification(dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId: dto.userId,
      actorId: dto.actorId ?? null,
      issueId: dto.issueId ?? null,
      type: dto.type,
      title: dto.title,
      message: dto.message,
      isRead: false,
    });

    const saved = await this.notificationRepository.save(notification);

    try {
      this.eventsGateway.server?.to(`user_${dto.userId}`).emit('notification:received', saved);
      this.eventsGateway.server?.to(`user_${dto.userId}`).emit('notification:new', saved);
    } catch (err) {
      this.logger.warn(`Failed to broadcast real-time notification to user ${dto.userId}: ${err}`);
    }

    return saved;
  }

  /**
   * Returns paginated notifications for a given user.
   */
  async getNotifications(
    userId: number,
    query: QueryNotificationsDto = {},
  ): Promise<{ items: Notification[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const unreadOnly = query.unreadOnly === true || query.unreadOnly === 'true';

    const qb = this.notificationRepository
      .createQueryBuilder('n')
      .leftJoinAndSelect('n.actor', 'actor')
      .leftJoinAndSelect('n.issue', 'issue')
      .where('n.userId = :userId', { userId });

    if (unreadOnly) {
      qb.andWhere('n.isRead = false');
      qb.andWhere('(n.snoozedUntil IS NULL OR n.snoozedUntil <= :now)', {
        now: new Date(),
      });
    }

    qb.orderBy('n.createdAt', 'DESC');
    qb.skip(skip).take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
    };
  }

  /**
   * Returns count of active unread notifications for badges.
   */
  async getUnreadCount(userId: number): Promise<{ count: number; unreadCount: number }> {
    const count = await this.notificationRepository
      .createQueryBuilder('n')
      .where('n.userId = :userId', { userId })
      .andWhere('n.isRead = false')
      .andWhere('(n.snoozedUntil IS NULL OR n.snoozedUntil <= :now)', {
        now: new Date(),
      })
      .getCount();

    return { count, unreadCount: count };
  }

  /**
   * Marks specific or all notifications as read.
   */
  async markAsRead(userId: number, dto: MarkNotificationsReadDto): Promise<{ success: boolean }> {
    const qb = this.notificationRepository
      .createQueryBuilder()
      .update(Notification)
      .set({ isRead: true })
      .where('userId = :userId', { userId });

    if (dto.notificationIds && dto.notificationIds.length > 0) {
      qb.andWhere('id IN (:...ids)', { ids: dto.notificationIds });
    }

    await qb.execute();
    return { success: true };
  }

  /**
   * Snoozes a notification until a future timestamp.
   */
  async snooze(
    userId: number,
    notificationId: number,
    snoozeUntil: Date,
  ): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification #${notificationId} not found`);
    }

    notification.snoozedUntil = snoozeUntil;
    return this.notificationRepository.save(notification);
  }
}
