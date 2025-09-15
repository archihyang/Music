import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';
import { logger } from '../utils/logger';
import { QueueService } from '../services/queue';
import { RedisClient } from '../services/redis';

const router = Router();

// Validation schemas
const renderRequestSchema = Joi.object({
  midiData: Joi.string().required(),
  format: Joi.string().valid('svg', 'png', 'pdf').default('svg'),
  width: Joi.number().min(100).max(2000).default(800),
  height: Joi.number().min(100).max(2000).default(600),
  clef: Joi.string().valid('treble', 'bass', 'alto').default('treble'),
  keySignature: Joi.string().default('C'),
  timeSignature: Joi.string().default('4/4'),
  showTabs: Joi.boolean().default(false),
  title: Joi.string().optional(),
  composer: Joi.string().optional()
});

// Render notation from MIDI data
router.post('/render', async (req, res, next) => {
  try {
    const { error, value } = renderRequestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const jobId = uuidv4();
    const job = {
      id: jobId,
      type: 'notation' as const,
      data: {
        midiData: value.midiData,
        options: {
          format: value.format,
          width: value.width,
          height: value.height,
          clef: value.clef,
          keySignature: value.keySignature,
          timeSignature: value.timeSignature,
          showTabs: value.showTabs,
          title: value.title,
          composer: value.composer
        }
      },
      userId: req.headers['user-id'] as string,
      priority: 1
    };

    // Add job to queue
    const queueService = QueueService.getInstance();
    const bullJob = await queueService.addJob(job);

    // Store job info in Redis
    const redisClient = RedisClient.getInstance();
    await redisClient.hset(`job:${jobId}`, 'status', 'queued');
    await redisClient.hset(`job:${jobId}`, 'type', 'notation');
    await redisClient.hset(`job:${jobId}`, 'created_at', new Date().toISOString());

    res.status(202).json({
      success: true,
      jobId: jobId,
      status: 'queued',
      message: 'Notation rendering job queued successfully'
    });

  } catch (error) {
    logger.error('Error in notation render endpoint', error);
    next(error);
  }
});

// Get rendering job status
router.get('/job/:jobId/status', async (req, res, next) => {
  try {
    const { jobId } = req.params;
    
    const queueService = QueueService.getInstance();
    const job = await queueService.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    const state = await job.getState();
    const progress = job.progress();

    res.json({
      success: true,
      jobId,
      status: state,
      progress,
      data: job.data,
      createdAt: new Date(job.timestamp),
      processedAt: job.processedOn ? new Date(job.processedOn) : null,
      completedAt: job.finishedOn ? new Date(job.finishedOn) : null
    });

  } catch (error) {
    logger.error('Error getting job status', error);
    next(error);
  }
});

// Get rendering job result
router.get('/job/:jobId/result', async (req, res, next) => {
  try {
    const { jobId } = req.params;
    
    const queueService = QueueService.getInstance();
    const job = await queueService.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    const state = await job.getState();
    
    if (state !== 'completed') {
      return res.status(202).json({
        success: false,
        error: 'Job not completed yet',
        status: state,
        progress: job.progress()
      });
    }

    const result = job.returnvalue;
    
    res.json({
      success: true,
      jobId,
      result,
      completedAt: new Date(job.finishedOn!)
    });

  } catch (error) {
    logger.error('Error getting job result', error);
    next(error);
  }
});

// Render notation with synchronous processing (for small files)
router.post('/render-sync', async (req, res, next) => {
  try {
    const { error, value } = renderRequestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    // For now, return a mock response
    // This would integrate with VexFlow/AlphaTab for actual rendering
    const mockResult = {
      success: true,
      format: value.format,
      data: 'base64-encoded-notation-data',
      metadata: {
        width: value.width,
        height: value.height,
        measures: 8,
        notes: 32,
        duration: 120
      }
    };

    res.json(mockResult);

  } catch (error) {
    logger.error('Error in sync notation render', error);
    next(error);
  }
});

// Preview notation (quick render)
router.post('/preview', async (req, res, next) => {
  try {
    const schema = Joi.object({
      midiData: Joi.string().required(),
      measures: Joi.number().min(1).max(4).default(2)
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    // Mock preview response
    const preview = {
      success: true,
      preview: 'base64-encoded-preview-data',
      measures: value.measures,
      format: 'svg'
    };

    res.json(preview);

  } catch (error) {
    logger.error('Error generating preview', error);
    next(error);
  }
});

export default router;