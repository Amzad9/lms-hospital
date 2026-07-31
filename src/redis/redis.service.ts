import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: RedisClientType;
  private connected = false;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL,
      socket: {
        // Do not block startup — fail fast and move on
        connectTimeout: 3000,
        reconnectStrategy: (retries) => {
          // Stop retrying after 3 attempts so the app stays alive
          if (retries >= 3) {
            this.logger.warn('Redis reconnect giving up after 3 attempts');
            return false;
          }
          return Math.min(retries * 200, 1000);
        },
      },
    });

    this.client.on('error', (err) =>
      this.logger.warn(`Redis error (non-fatal): ${err.message}`),
    );
    this.client.on('connect', () => {
      this.connected = true;
      this.logger.log('Redis connected');
    });
  }

  async onModuleInit() {
    try {
      await this.client.connect();
      this.connected = true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Redis unavailable — caching disabled. Reason: ${msg}`,
      );
      // App continues without Redis — only caching is affected
    }
  }

  async onModuleDestroy() {
    if (this.connected) {
      await this.client.quit().catch(() => undefined);
    }
  }

  /** Returns true only when the Redis connection is live */
  isConnected(): boolean {
    return this.connected;
  }

  getClient() {
    return this.client;
  }
}