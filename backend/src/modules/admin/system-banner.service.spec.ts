import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SystemBannerService, DEFAULT_BROADCAST } from './system-banner.service.js';

describe('SystemBannerService (Redis Global Broadcast)', () => {
  let service: SystemBannerService;
  let mockRedis: any;

  beforeEach(() => {
    mockRedis = {
      get: vi.fn(),
      set: vi.fn(),
    };
    service = new SystemBannerService(mockRedis);
  });

  it('should return default broadcast banner when Redis has no stored value', async () => {
    mockRedis.get.mockResolvedValue(null);

    const banner = await service.getBanner();
    expect(banner).toEqual(DEFAULT_BROADCAST);
    expect(mockRedis.get).toHaveBeenCalledWith('system:broadcast_banner');
  });

  it('should return parsed broadcast banner from Redis when stored', async () => {
    const stored = {
      enabled: true,
      message: 'Scheduled maintenance at midnight UTC',
      severity: 'warning',
      updatedAt: '2026-09-30T22:00:00.000Z',
      author: 'Principal DevOps',
    };
    mockRedis.get.mockResolvedValue(JSON.stringify(stored));

    const banner = await service.getBanner();
    expect(banner).toEqual(stored);
  });

  it('should update and persist banner in Redis with updated timestamp and author', async () => {
    mockRedis.get.mockResolvedValue(null);
    mockRedis.set.mockResolvedValue('OK');

    const updated = await service.updateBanner(
      {
        message: 'Security hotfix deployed',
        severity: 'critical',
      },
      'Security Officer',
    );

    expect(updated.message).toBe('Security hotfix deployed');
    expect(updated.severity).toBe('critical');
    expect(updated.author).toBe('Security Officer');
    expect(mockRedis.set).toHaveBeenCalledWith(
      'system:broadcast_banner',
      expect.stringContaining('Security hotfix deployed'),
    );
  });
});
