import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service.js';

describe('RedisService', () => {
  let service: RedisService;
  let mockConfigService: Partial<ConfigService>;
  let mockRedisClient: any;

  beforeEach(() => {
    mockConfigService = {
      get: vi.fn((key: string, defaultValue?: any) => {
        if (key === 'REDIS_HOST') return 'localhost';
        if (key === 'REDIS_PORT') return 6379;
        if (key === 'REDIS_PASSWORD') return undefined;
        return defaultValue;
      }),
    };

    mockRedisClient = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
      getdel: vi.fn(),
      incr: vi.fn(),
      expire: vi.fn(),
      ttl: vi.fn(),
      quit: vi.fn().mockResolvedValue('OK'),
      on: vi.fn(),
    };

    service = new RedisService(mockConfigService as ConfigService);
    // Inject mock client directly for unit tests
    (service as any).client = mockRedisClient;
    (service as any).isConnected = true;
  });

  afterEach(async () => {
    vi.clearAllMocks();
  });

  it('should set a key with TTL', async () => {
    mockRedisClient.set.mockResolvedValue('OK');

    const result = await service.set('test-key', 'test-value', 60);

    expect(mockRedisClient.set).toHaveBeenCalledWith('test-key', 'test-value', 'EX', 60);
    expect(result).toBe('OK');
  });

  it('should set a key without TTL', async () => {
    mockRedisClient.set.mockResolvedValue('OK');

    const result = await service.set('test-key', 'test-value');

    expect(mockRedisClient.set).toHaveBeenCalledWith('test-key', 'test-value');
    expect(result).toBe('OK');
  });

  it('should get a key value', async () => {
    mockRedisClient.get.mockResolvedValue('cached-data');

    const result = await service.get('test-key');

    expect(mockRedisClient.get).toHaveBeenCalledWith('test-key');
    expect(result).toBe('cached-data');
  });

  it('should atomically get and delete a key with getdel', async () => {
    mockRedisClient.getdel.mockResolvedValue('one-time-token');

    const result = await service.getdel('oauth:code:123');

    expect(mockRedisClient.getdel).toHaveBeenCalledWith('oauth:code:123');
    expect(result).toBe('one-time-token');
  });

  it('should delete keys', async () => {
    mockRedisClient.del.mockResolvedValue(2);

    const result = await service.del('key1', 'key2');

    expect(mockRedisClient.del).toHaveBeenCalledWith('key1', 'key2');
    expect(result).toBe(2);
  });

  it('should increment a key', async () => {
    mockRedisClient.incr.mockResolvedValue(1);

    const result = await service.incr('counter');

    expect(mockRedisClient.incr).toHaveBeenCalledWith('counter');
    expect(result).toBe(1);
  });

  it('should set expiration on a key', async () => {
    mockRedisClient.expire.mockResolvedValue(1);

    const result = await service.expire('counter', 900);

    expect(mockRedisClient.expire).toHaveBeenCalledWith('counter', 900);
    expect(result).toBe(1);
  });

  it('should get TTL of a key', async () => {
    mockRedisClient.ttl.mockResolvedValue(850);

    const result = await service.ttl('counter');

    expect(mockRedisClient.ttl).toHaveBeenCalledWith('counter');
    expect(result).toBe(850);
  });

  it('should return null when get encounters an error instead of crashing', async () => {
    mockRedisClient.get.mockRejectedValue(new Error('Redis connection lost'));

    const result = await service.get('faulty-key');

    expect(result).toBeNull();
  });
});

