/**
 * Redis Service
 * Cache and session management
 */

import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

export class RedisService {
  private static instance: RedisService;
  private client: RedisClientType | null = null;
  
  private constructor() {}
  
  static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }
  
  async connect(): Promise<void> {
    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.error('Redis: Max reconnection attempts reached');
              return new Error('Max reconnection attempts reached');
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });
      
      this.client.on('error', (err) => logger.error('Redis Client Error:', err));
      this.client.on('connect', () => logger.info('Redis Client Connected'));
      this.client.on('ready', () => logger.info('Redis Client Ready'));
      
      await this.client.connect();
    } catch (error) {
      logger.error('Redis connection failed:', error);
      // Don't throw - Redis is optional for basic functionality
    }
  }
  
  async get(key: string): Promise<string | null> {
    if (!this.client) return null;
    
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error('Redis get error:', error);
      return null;
    }
  }
  
  async set(key: string, value: string, expirySeconds?: number): Promise<void> {
    if (!this.client) return;
    
    try {
      if (expirySeconds) {
        await this.client.setEx(key, expirySeconds, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      logger.error('Redis set error:', error);
    }
  }
  
  async del(key: string): Promise<void> {
    if (!this.client) return;
    
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error('Redis del error:', error);
    }
  }
  
  async incr(key: string): Promise<number> {
    if (!this.client) return 0;
    
    try {
      return await this.client.incr(key);
    } catch (error) {
      logger.error('Redis incr error:', error);
      return 0;
    }
  }
  
  async expire(key: string, seconds: number): Promise<void> {
    if (!this.client) return;
    
    try {
      await this.client.expire(key, seconds);
    } catch (error) {
      logger.error('Redis expire error:', error);
    }
  }
  
  async hGet(key: string, field: string): Promise<string | null> {
    if (!this.client) return null;
    
    try {
      return await this.client.hGet(key, field);
    } catch (error) {
      logger.error('Redis hGet error:', error);
      return null;
    }
  }
  
  async hSet(key: string, field: string, value: string): Promise<void> {
    if (!this.client) return;
    
    try {
      await this.client.hSet(key, field, value);
    } catch (error) {
      logger.error('Redis hSet error:', error);
    }
  }
  
  async hGetAll(key: string): Promise<Record<string, string>> {
    if (!this.client) return {};
    
    try {
      return await this.client.hGetAll(key);
    } catch (error) {
      logger.error('Redis hGetAll error:', error);
      return {};
    }
  }
  
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      logger.info('Redis connection closed');
    }
  }
}