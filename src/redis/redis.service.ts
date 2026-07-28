import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL,
    });

    this.client.on('error', (err) =>
      console.error('Redis Client Error', err),
    );
  }

  async onModuleInit() {
    await this.client.connect();
  }
  async onModuleDestroy() {
    await this.client.quit();
  }

  getClient() {
    return this.client;
  }
}