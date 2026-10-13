import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SecurityAuditService } from './security-audit.service.js';
import { LoginAuditLog, LoginAttemptStatus } from './entities/login-audit-log.entity.js';
import type { Repository } from 'typeorm';

describe('SecurityAuditService', () => {
  let service: SecurityAuditService;
  let mockAuditLogRepo: any;

  beforeEach(() => {
    mockAuditLogRepo = {
      create: vi.fn((dto) => Object.assign(new LoginAuditLog(), dto)),
      save: vi.fn((entity) => Promise.resolve(Object.assign(entity, { id: 1 }))),
      count: vi.fn().mockResolvedValue(0),
      find: vi.fn().mockResolvedValue([]),
      createQueryBuilder: vi.fn(),
    };

    service = new SecurityAuditService(
      mockAuditLogRepo as unknown as Repository<LoginAuditLog>,
    );
  });

  describe('recordLoginAttempt', () => {
    it('normalizes email and persists audit record', async () => {
      const result = await service.recordLoginAttempt({
        userId: 1,
        attemptedEmail: '  TEST@BUGTRACKER.LOCAL ',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 Chrome/120',
        status: LoginAttemptStatus.SUCCESS,
      });

      expect(mockAuditLogRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          attemptedEmail: 'test@bugtracker.local',
          ipAddress: '127.0.0.1',
          status: LoginAttemptStatus.SUCCESS,
        }),
      );
      expect(mockAuditLogRepo.save).toHaveBeenCalled();
      expect(result.id).toBe(1);
    });
  });

  describe('countRecentFailedAttempts', () => {
    it('counts failed password attempts within time window', async () => {
      mockAuditLogRepo.count.mockResolvedValue(3);

      const count = await service.countRecentFailedAttempts('user@example.com', 15);
      expect(count).toBe(3);
      expect(mockAuditLogRepo.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            attemptedEmail: 'user@example.com',
            status: LoginAttemptStatus.FAILED_PASSWORD,
          }),
        }),
      );
    });
  });

  describe('getLoginLogs', () => {
    it('queries logs with pagination, search filter and status filter', async () => {
      const mockLogs = [
        {
          id: 1,
          attemptedEmail: 'admin@bugtracker.local',
          ipAddress: '192.168.1.1',
          status: LoginAttemptStatus.SUCCESS,
          createdAt: new Date(),
        },
      ];

      const mockQb = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValue([mockLogs, 1]),
      };

      mockAuditLogRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.getLoginLogs({
        page: 2,
        limit: 25,
        status: LoginAttemptStatus.SUCCESS,
        search: 'admin@bugtracker',
      });

      expect(mockAuditLogRepo.createQueryBuilder).toHaveBeenCalledWith('log');
      expect(mockQb.leftJoinAndSelect).toHaveBeenCalledWith('log.user', 'user');
      expect(mockQb.orderBy).toHaveBeenCalledWith('log.createdAt', 'DESC');
      expect(mockQb.skip).toHaveBeenCalledWith(25);
      expect(mockQb.take).toHaveBeenCalledWith(25);
      expect(mockQb.andWhere).toHaveBeenCalledWith('log.status = :status', {
        status: LoginAttemptStatus.SUCCESS,
      });
      expect(mockQb.andWhere).toHaveBeenCalledWith(
        '(log.attemptedEmail ILIKE :term OR log.ipAddress ILIKE :term OR log.failureReason ILIKE :term)',
        { term: '%admin@bugtracker%' },
      );
      expect(result).toEqual({ items: mockLogs, total: 1 });
    });

    it('defaults to page 1 and limit 50 when empty query provided', async () => {
      const mockQb = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValue([[], 0]),
      };

      mockAuditLogRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.getLoginLogs({});

      expect(mockQb.skip).toHaveBeenCalledWith(0);
      expect(mockQb.take).toHaveBeenCalledWith(50);
      expect(mockQb.andWhere).not.toHaveBeenCalled();
      expect(result).toEqual({ items: [], total: 0 });
    });
  });
});
