import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = Number(this.configService.get<number>('REDIS_PORT', 6379));
    const password = this.configService.get<string>('REDIS_PASSWORD') || undefined;

    this.client = new Redis({
      host,
      port,
      password,
      lazyConnect: false,
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number): number | null => {
        if (times > 10) {
          this.logger.error('Redis retry limit exceeded. Backing off.');
          return null;
        }
        return Math.min(times * 200, 3000);
      },
    });

    this.client.on('connect', () => {
      this.isConnected = true;
      this.logger.log(`Connected to Redis instance at ${host}:${port}`);
    });

    this.client.on('error', (err: unknown) => {
      this.isConnected = false;
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Redis connection error: ${message}`);
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
        this.logger.log('Redis connection cleanly terminated');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Error while closing Redis connection: ${message}`);
      }
    }
  }

  getClient(): Redis | null {
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) {
      return null;
    }
    try {
      return await this.client.get(key);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Redis GET failed for key "${key}": ${message}`);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<'OK' | null> {
    if (!this.client) {
      return null;
    }
    try {
      if (typeof ttlSeconds === 'number' && ttlSeconds > 0) {
        return await this.client.set(key, value, 'EX', ttlSeconds);
      }
      return await this.client.set(key, value);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Redis SET failed for key "${key}": ${message}`);
      return null;
    }
  }

  async del(...keys: string[]): Promise<number> {
    if (!this.client || keys.length === 0) {
      return 0;
    }
    try {
      return await this.client.del(...keys);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Redis DEL failed for keys [${keys.join(', ')}]: ${message}`);
      return 0;
    }
  }

  async delPattern(pattern: string): Promise<number> {
    if (!this.client || !pattern) {
      return 0;
    }
    try {
      let cursor = '0';
      let totalDeleted = 0;
      do {
        const [nextCursor, keys] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        if (keys && keys.length > 0) {
          const deleted = await this.client.del(...keys);
          totalDeleted += deleted;
        }
      } while (cursor !== '0');
      return totalDeleted;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Redis delPattern failed for pattern "${pattern}": ${message}`);
      return 0;
    }
  }

  async getdel(key: string): Promise<string | null> {
    if (!this.client) {
      return null;
    }
    try {
      return await this.client.getdel(key);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Redis GETDEL failed for key "${key}": ${message}`);
      return null;
    }
  }

  async incr(key: string): Promise<number> {
    if (!this.client) {
      return 0;
    }
    try {
      return await this.client.incr(key);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Redis INCR failed for key "${key}": ${message}`);
      return 0;
    }
  }

  async expire(key: string, seconds: number): Promise<number> {
    if (!this.client) {
      return 0;
    }
    try {
      return await this.client.expire(key, seconds);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Redis EXPIRE failed for key "${key}": ${message}`);
      return 0;
    }
  }

  async ttl(key: string): Promise<number> {
    if (!this.client) {
      return -2;
    }
    try {
      return await this.client.ttl(key);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Redis TTL failed for key "${key}": ${message}`);
      return -2;
    }
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    if (!this.client || values.length === 0) {
      return 0;
    }
    try {
      return await this.client.rpush(key, ...values);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Redis RPUSH failed for key "${key}": ${message}`);
      return 0;
    }
  }

  async lpop(key: string): Promise<string | null> {
    if (!this.client) {
      return null;
    }
    try {
      return await this.client.lpop(key);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Redis LPOP failed for key "${key}": ${message}`);
      return null;
    }
  }

  async zadd(key: string, score: number, member: string): Promise<number> {
    if (!this.client) {
      return 0;
    }
    try {
      return await this.client.zadd(key, score, member);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Redis ZADD failed for key "${key}": ${message}`);
      return 0;
    }
  }

  async zrangebyscore(
    key: string,
    min: number | string,
    max: number | string,
    limit?: number,
  ): Promise<string[]> {
    if (!this.client) {
      return [];
    }
    try {
      if (limit) {
        return await this.client.zrangebyscore(key, min, max, 'LIMIT', 0, limit);
      }
      return await this.client.zrangebyscore(key, min, max);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Redis ZRANGEBYSCORE failed for key "${key}": ${message}`);
      return [];
    }
  }

  async zrem(key: string, ...members: string[]): Promise<number> {
    if (!this.client || members.length === 0) {
      return 0;
    }
    try {
      return await this.client.zrem(key, ...members);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Redis ZREM failed for key "${key}": ${message}`);
      return 0;
    }
  }
}

