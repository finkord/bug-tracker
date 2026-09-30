import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import { INestApplicationContext, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Socket.IO adapter backed by Redis Pub/Sub for distributed horizontal scaling across multi-instance clusters.
 */
export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter> | null = null;
  private readonly adapterLogger = new Logger(RedisIoAdapter.name);

  constructor(private readonly appContext: INestApplicationContext) {
    super(appContext);
  }

  /**
   * Initializes Redis Pub/Sub clients and builds the Socket.IO Redis adapter.
   */
  async connectToRedis(): Promise<void> {
    const configService = this.appContext.get(ConfigService);
    const host = configService.get<string>('REDIS_HOST', 'localhost');
    const port = Number(configService.get<number>('REDIS_PORT', 6379));
    const password = configService.get<string>('REDIS_PASSWORD') || undefined;

    const pubClient = new Redis({
      host,
      port,
      password,
      lazyConnect: false,
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number): number | null => {
        if (times > 10) {
          this.adapterLogger.error('Redis adapter retry limit exceeded');
          return null;
        }
        return Math.min(times * 200, 3000);
      },
    });

    const subClient = pubClient.duplicate();

    try {
      await Promise.all([
        new Promise<void>((resolve, reject) => {
          pubClient.once('ready', () => resolve());
          pubClient.once('error', (err) => reject(err));
        }),
        new Promise<void>((resolve, reject) => {
          subClient.once('ready', () => resolve());
          subClient.once('error', (err) => reject(err));
        }),
      ]);

      this.adapterConstructor = createAdapter(pubClient, subClient);
      this.adapterLogger.log(`Redis WebSocket distributed adapter connected at ${host}:${port}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.adapterLogger.error(`Failed to connect Redis WebSocket adapter: ${message}. Using fallback in-memory adapter.`);
      this.adapterConstructor = null;
    }
  }

  override createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }
    return server;
  }
}
