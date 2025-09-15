/**
 * Rate Limiting Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { RedisService } from '../services/redis';
import { logger } from '../utils/logger';

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

export function createRateLimiter(options: RateLimitOptions) {
  const { windowMs, maxRequests, message } = options;
  
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const redis = RedisService.getInstance();
      const key = `rate_limit:${req.ip}:${req.path}`;
      
      const current = await redis.incr(key);
      
      if (current === 1) {
        await redis.expire(key, Math.ceil(windowMs / 1000));
      }
      
      if (current > maxRequests) {
        return res.status(429).json({
          success: false,
          error: message || 'Too many requests, please try again later'
        });
      }
      
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - current).toString());
      
      next();
    } catch (error) {
      logger.error('Rate limiter error:', error);
      // If Redis is down, allow the request
      next();
    }
  };
}

// Default rate limiter
export const rateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  message: 'Too many requests from this IP, please try again later'
});

// Strict rate limiter for sensitive operations
export const strictRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  message: 'Too many attempts, please try again later'
});