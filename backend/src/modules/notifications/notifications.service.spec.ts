import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationsService } from './notifications.service.js';
import { NotificationType } from './entities/notification.entity.js';
import { NotFoundException } from '@nestjs/common';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let mockNotificationRepository: any;
  let mockEventsGateway: any;
  let mockQueryBuilder: any;

  beforeEach(() => {
    mockQueryBuilder = {
      leftJoinAndSelect: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      take: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue({ affected: 1 }),
      getCount: vi.fn().mockResolvedValue(5),
      getManyAndCount: vi.fn().mockResolvedValue([
        [
          {
            id: 1,
            userId: 10,
            title: 'Assigned to issue',
            message: 'You were assigned to PROJ-1',
            isRead: false,
          },
        ],
        1,
      ]),
    };

    mockNotificationRepository = {
      create: vi.fn((dto) => dto),
      save: vi.fn((entity) => Promise.resolve({ id: 100, ...entity })),
      findOne: vi.fn(),
      createQueryBuilder: vi.fn(() => mockQueryBuilder),
    };

    mockEventsGateway = {
      server: {
        to: vi.fn().mockReturnValue({
          emit: vi.fn(),
        }),
      },
    };

    service = new NotificationsService(mockNotificationRepository, mockEventsGateway);
  });

  describe('createNotification', () => {
    it('should persist a notification and emit a real-time event to the user room', async () => {
      const dto = {
        userId: 42,
        actorId: 1,
        issueId: 10,
        type: NotificationType.ASSIGNED,
        title: 'New Assignment',
        message: 'You have been assigned to PROJ-42',
      };

      const result = await service.createNotification(dto);
      expect(result.id).toBe(100);
      expect(mockNotificationRepository.save).toHaveBeenCalled();
      expect(mockEventsGateway.server.to).toHaveBeenCalledWith('user_42');
    });
  });

  describe('getNotifications', () => {
    it('should paginate and filter notifications', async () => {
      const res = await service.getNotifications(10, { unreadOnly: true, page: 1, limit: 10 });
      expect(res.items.length).toBe(1);
      expect(res.total).toBe(1);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('n.userId = :userId', { userId: 10 });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('n.isRead = false');
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread notification count', async () => {
      const res = await service.getUnreadCount(10);
      expect(res.count).toBe(5);
      expect(res.unreadCount).toBe(5);
    });
  });

  describe('markAsRead', () => {
    it('should execute update query to mark notifications as read', async () => {
      const res = await service.markAsRead(10, { notificationIds: [1, 2, 3] });
      expect(res.success).toBe(true);
      expect(mockQueryBuilder.update).toHaveBeenCalled();
      expect(mockQueryBuilder.set).toHaveBeenCalledWith({ isRead: true });
    });
  });

  describe('snooze', () => {
    it('should update snoozedUntil date', async () => {
      const mockNotif = { id: 1, userId: 10, snoozedUntil: null };
      mockNotificationRepository.findOne.mockResolvedValue(mockNotif);

      const futureDate = new Date(Date.now() + 86400000);
      await service.snooze(10, 1, futureDate);

      expect(mockNotif.snoozedUntil).toBe(futureDate);
      expect(mockNotificationRepository.save).toHaveBeenCalledWith(mockNotif);
    });

    it('should throw NotFoundException if notification does not exist', async () => {
      mockNotificationRepository.findOne.mockResolvedValue(null);
      await expect(service.snooze(10, 999, new Date())).rejects.toThrow(NotFoundException);
    });
  });
});
