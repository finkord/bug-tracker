import { Injectable, Logger, Optional } from '@nestjs/common';
import { RedisService } from '../redis/redis.service.js';

export type BroadcastSeverity = 'info' | 'warning' | 'critical' | 'success';

export interface BroadcastConfig {
  enabled: boolean;
  message: string;
  severity: BroadcastSeverity;
  updatedAt: string;
  author: string;
}

export const DEFAULT_BROADCAST: BroadcastConfig = {
  enabled: true,
  message: 'BugTracker Operational: Real-Time Sockets & Distributed Storage Active',
  severity: 'info',
  updatedAt: new Date().toISOString(),
  author: 'System Operations',
};

@Injectable()
export class SystemBannerService {
  private readonly logger = new Logger(SystemBannerService.name);
  private static readonly BANNER_REDIS_KEY = 'system:broadcast_banner';

  constructor(
    @Optional()
    private readonly redisService?: RedisService,
  ) {}

  async getBanner(): Promise<BroadcastConfig> {
    if (this.redisService) {
      try {
        const raw = await this.redisService.get(SystemBannerService.BANNER_REDIS_KEY);
        if (raw) {
          return JSON.parse(raw) as BroadcastConfig;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Failed to read broadcast banner from Redis: ${msg}`);
      }
    }
    return DEFAULT_BROADCAST;
  }

  async updateBanner(
    patch: Partial<BroadcastConfig>,
    author = 'Administrator',
  ): Promise<BroadcastConfig> {
    const current = await this.getBanner();
    const updated: BroadcastConfig = {
      ...current,
      ...patch,
      author: patch.author || author,
      updatedAt: new Date().toISOString(),
    };

    if (this.redisService) {
      try {
        await this.redisService.set(
          SystemBannerService.BANNER_REDIS_KEY,
          JSON.stringify(updated),
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Failed to persist broadcast banner to Redis: ${msg}`);
      }
    }

    return updated;
  }
}
