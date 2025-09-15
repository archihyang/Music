import Bull from 'bull';
import { logger } from '../utils/logger';

export interface RenderingJob {
  id: string;
  type: 'notation' | 'tab' | 'combined';
  data: any;
  userId?: string;
  priority?: number;
}

export class QueueService {
  private static instance: QueueService;
  private renderingQueue: Bull.Queue<RenderingJob> | null = null;

  private constructor() {}

  public static getInstance(): QueueService {
    if (!QueueService.instance) {
      QueueService.instance = new QueueService();
    }
    return QueueService.instance;
  }

  public async initialize(): Promise<void> {
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD
    };

    this.renderingQueue = new Bull('rendering-queue', {
      redis: redisConfig,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      }
    });

    // Process jobs
    this.renderingQueue.process(async (job) => {
      logger.info('Processing rendering job', { jobId: job.id, type: job.data.type });
      
      try {
        // Process based on job type
        switch (job.data.type) {
          case 'notation':
            return await this.processNotationJob(job.data);
          case 'tab':
            return await this.processTabJob(job.data);
          case 'combined':
            return await this.processCombinedJob(job.data);
          default:
            throw new Error(`Unknown job type: ${job.data.type}`);
        }
      } catch (error) {
        logger.error('Job processing failed', { jobId: job.id, error });
        throw error;
      }
    });

    // Event handlers
    this.renderingQueue.on('completed', (job, result) => {
      logger.info('Job completed', { jobId: job.id });
    });

    this.renderingQueue.on('failed', (job, err) => {
      logger.error('Job failed', { jobId: job.id, error: err.message });
    });

    this.renderingQueue.on('stalled', (job) => {
      logger.warn('Job stalled', { jobId: job.id });
    });

    logger.info('Queue service initialized');
  }

  public async addJob(job: RenderingJob): Promise<Bull.Job<RenderingJob>> {
    if (!this.renderingQueue) {
      throw new Error('Queue not initialized');
    }

    const options: Bull.JobOptions = {
      priority: job.priority || 0,
      delay: 0
    };

    const bullJob = await this.renderingQueue.add(job, options);
    logger.info('Job added to queue', { jobId: bullJob.id, type: job.type });
    
    return bullJob;
  }

  public async getJob(jobId: string): Promise<Bull.Job<RenderingJob> | null> {
    if (!this.renderingQueue) {
      throw new Error('Queue not initialized');
    }
    return await this.renderingQueue.getJob(jobId);
  }

  public async getJobStatus(jobId: string): Promise<string | null> {
    const job = await this.getJob(jobId);
    if (!job) return null;
    
    const state = await job.getState();
    return state;
  }

  public async close(): Promise<void> {
    if (this.renderingQueue) {
      await this.renderingQueue.close();
      this.renderingQueue = null;
    }
  }

  private async processNotationJob(data: any): Promise<any> {
    // Implement notation rendering logic
    logger.info('Processing notation job', data);
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      type: 'notation',
      result: 'Notation rendered successfully'
    };
  }

  private async processTabJob(data: any): Promise<any> {
    // Implement tab rendering logic
    logger.info('Processing tab job', data);
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      type: 'tab',
      result: 'Tab rendered successfully'
    };
  }

  private async processCombinedJob(data: any): Promise<any> {
    // Implement combined rendering logic
    logger.info('Processing combined job', data);
    
    // Process both notation and tab
    const [notation, tab] = await Promise.all([
      this.processNotationJob(data),
      this.processTabJob(data)
    ]);
    
    return {
      success: true,
      type: 'combined',
      notation: notation.result,
      tab: tab.result
    };
  }
}