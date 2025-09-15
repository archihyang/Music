import Redis from 'ioredis';
import { logger } from '../utils/logger';

export class RedisClient {
  private static instance: RedisClient;
  private client: Redis | null = null;

  private constructor() {}

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  public async connect(): Promise<void> {
    if (this.client) {
      return;
    }

    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    this.client.on('connect', () => {
      logger.info('Connected to Redis');
    });

    this.client.on('error', (error) => {
      logger.error('Redis error', error);
    });

    this.client.on('close', () => {
      logger.info('Redis connection closed');
    });
  }

  public getClient(): Redis {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }
    return this.client;
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }

  // Cache operations
  public async get(key: string): Promise<string | null> {
    if (!this.client) throw new Error('Redis client not initialized');
    return await this.client.get(key);
  }

  public async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.client) throw new Error('Redis client not initialized');
    if (ttl) {
      await this.client.set(key, value, 'EX', ttl);
    } else {
      await this.client.set(key, value);
    }
  }

  public async del(key: string): Promise<void> {
    if (!this.client) throw new Error('Redis client not initialized');
    await this.client.del(key);
  }

  public async exists(key: string): Promise<boolean> {
    if (!this.client) throw new Error('Redis client not initialized');
    const result = await this.client.exists(key);
    return result === 1;
  }

  // Hash operations
  public async hset(key: string, field: string, value: string): Promise<void> {
    if (!this.client) throw new Error('Redis client not initialized');
    await this.client.hset(key, field, value);
  }

  public async hget(key: string, field: string): Promise<string | null> {
    if (!this.client) throw new Error('Redis client not initialized');
    return await this.client.hget(key, field);
  }

  public async hgetall(key: string): Promise<Record<string, string>> {
    if (!this.client) throw new Error('Redis client not initialized');
    return await this.client.hgetall(key);
  }

  // Pub/Sub operations
  public async publish(channel: string, message: string): Promise<void> {
    if (!this.client) throw new Error('Redis client not initialized');
    await this.client.publish(channel, message);
  }
}