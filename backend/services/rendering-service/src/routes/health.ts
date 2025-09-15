import { Router } from 'express';
import { RedisClient } from '../services/redis';
import { QueueService } from '../services/queue';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'rendering-service',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0'
    };

    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

router.get('/detailed', async (req, res) => {
  try {
    // Check Redis connection
    let redisStatus = 'healthy';
    try {
      await RedisClient.getInstance().get('health-check');
    } catch (error) {
      redisStatus = 'unhealthy';
    }

    // Check queue service
    let queueStatus = 'healthy';
    try {
      const queueService = QueueService.getInstance();
      // Add queue health check logic here
    } catch (error) {
      queueStatus = 'unhealthy';
    }

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'rendering-service',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      dependencies: {
        redis: redisStatus,
        queue: queueStatus
      }
    };

    const overallStatus = redisStatus === 'healthy' && queueStatus === 'healthy' ? 200 : 503;
    res.status(overallStatus).json(health);
    
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Detailed health check failed'
    });
  }
});

export default router;