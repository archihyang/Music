import { PrismaClient, TranscriptionStatus, SourceType } from '@prisma/client';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const prisma = new PrismaClient();

interface YouTubeVideoInfo {
  videoId: string;
  title: string;
  author: string;
  duration: number; // in seconds
  thumbnailUrl: string;
  description?: string;
}

interface TranscriptionRequest {
  url?: string;
  fileBuffer?: Buffer;
  fileName?: string;
  instrument?: string;
  difficulty?: string;
  style?: string;
  userId: string;
}

interface TranscriptionJobResponse {
  jobId: string;
  transcriptionId: string;
  status: TranscriptionStatus;
  message: string;
}

export class YouTubeService {
  private readonly AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  private readonly YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)[\w-]+/;

  /**
   * Validate YouTube URL
   */
  validateYouTubeUrl(url: string): boolean {
    return this.YOUTUBE_REGEX.test(url);
  }

  /**
   * Extract video ID from YouTube URL
   */
  extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Get YouTube video information
   */
  async getVideoInfo(url: string): Promise<YouTubeVideoInfo> {
    try {
      const videoId = this.extractVideoId(url);
      
      if (!videoId) {
        throw new AppError('Invalid YouTube URL', 400);
      }

      // In production, you would use YouTube Data API
      // For now, we'll return mock data
      // You need to get a YouTube API key and use it here
      
      // Mock data for development
      const mockInfo: YouTubeVideoInfo = {
        videoId,
        title: 'Guitar Performance Video',
        author: 'Unknown Artist',
        duration: 240, // 4 minutes
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        description: 'A guitar performance video'
      };

      // TODO: Implement actual YouTube API call
      // const response = await axios.get(
      //   `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${API_KEY}&part=snippet,contentDetails`
      // );

      logger.info(`Video info retrieved for: ${videoId}`);
      return mockInfo;
    } catch (error) {
      logger.error('Failed to get video info:', error);
      throw error;
    }
  }

  /**
   * Start transcription job for YouTube video
   */
  async startYouTubeTranscription(request: TranscriptionRequest): Promise<TranscriptionJobResponse> {
    try {
      const { url, instrument = 'guitar', difficulty = 'INTERMEDIATE', style, userId } = request;

      if (!url) {
        throw new AppError('YouTube URL is required', 400);
      }

      if (!this.validateYouTubeUrl(url)) {
        throw new AppError('Invalid YouTube URL', 400);
      }

      // Get video info
      const videoInfo = await this.getVideoInfo(url);

      // Create transcription record in database
      const transcription = await prisma.transcription.create({
        data: {
          userId,
          sourceType: SourceType.YOUTUBE,
          sourceUrl: url,
          status: TranscriptionStatus.PENDING,
          progress: 0,
          durationSeconds: videoInfo.duration,
        }
      });

      // Generate job ID
      const jobId = uuidv4();

      // Create job record
      await prisma.job.create({
        data: {
          transcriptionId: transcription.id,
          celeryTaskId: jobId,
          status: 'QUEUED',
          progress: 0
        }
      });

      // Send request to AI service
      try {
        const aiResponse = await axios.post(`${this.AI_SERVICE_URL}/api/transcribe/youtube`, {
          job_id: jobId,
          transcription_id: transcription.id,
          url,
          instrument,
          difficulty,
          style,
          user_id: userId
        });

        logger.info(`YouTube transcription started: ${jobId}`);

        // Update job status
        await prisma.job.update({
          where: { celeryTaskId: jobId },
          data: { 
            status: 'PROCESSING',
            startedAt: new Date()
          }
        });

        return {
          jobId,
          transcriptionId: transcription.id,
          status: TranscriptionStatus.PROCESSING,
          message: 'Transcription job started successfully'
        };
      } catch (aiError) {
        // If AI service fails, update status
        await prisma.transcription.update({
          where: { id: transcription.id },
          data: { status: TranscriptionStatus.FAILED }
        });

        await prisma.job.update({
          where: { celeryTaskId: jobId },
          data: { 
            status: 'FAILED',
            errorMessage: 'Failed to start AI processing'
          }
        });

        throw new AppError('Failed to start transcription processing', 500);
      }
    } catch (error) {
      logger.error('YouTube transcription error:', error);
      throw error;
    }
  }

  /**
   * Start transcription job for uploaded file
   */
  async startFileTranscription(request: TranscriptionRequest): Promise<TranscriptionJobResponse> {
    try {
      const { fileBuffer, fileName, instrument = 'guitar', difficulty = 'INTERMEDIATE', style, userId } = request;

      if (!fileBuffer || !fileName) {
        throw new AppError('File and filename are required', 400);
      }

      // Create transcription record
      const transcription = await prisma.transcription.create({
        data: {
          userId,
          sourceType: SourceType.UPLOAD,
          sourceFilename: fileName,
          status: TranscriptionStatus.PENDING,
          progress: 0
        }
      });

      // Generate job ID
      const jobId = uuidv4();

      // Create job record
      await prisma.job.create({
        data: {
          transcriptionId: transcription.id,
          celeryTaskId: jobId,
          status: 'QUEUED',
          progress: 0
        }
      });

      // TODO: Save file and send to AI service
      // For now, we'll simulate the process
      
      logger.info(`File transcription started: ${jobId}`);

      return {
        jobId,
        transcriptionId: transcription.id,
        status: TranscriptionStatus.PROCESSING,
        message: 'File transcription job started successfully'
      };
    } catch (error) {
      logger.error('File transcription error:', error);
      throw error;
    }
  }

  /**
   * Get transcription job status
   */
  async getJobStatus(jobId: string): Promise<any> {
    try {
      const job = await prisma.job.findFirst({
        where: { celeryTaskId: jobId },
        include: {
          transcription: {
            include: {
              score: true
            }
          }
        }
      });

      if (!job) {
        throw new AppError('Job not found', 404);
      }

      return {
        jobId,
        status: job.status,
        progress: job.progress,
        transcription: {
          id: job.transcription.id,
          status: job.transcription.status,
          progress: job.transcription.progress,
          sourceType: job.transcription.sourceType,
          sourceUrl: job.transcription.sourceUrl,
          sourceFilename: job.transcription.sourceFilename,
          score: job.transcription.score
        },
        error: job.errorMessage,
        startedAt: job.startedAt,
        completedAt: job.completedAt
      };
    } catch (error) {
      logger.error('Get job status error:', error);
      throw error;
    }
  }

  /**
   * Get user's transcription history
   */
  async getUserTranscriptions(userId: string, limit: number = 20): Promise<any[]> {
    try {
      const transcriptions = await prisma.transcription.findMany({
        where: { userId },
        include: {
          jobs: {
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          score: true
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      return transcriptions.map(t => ({
        id: t.id,
        sourceType: t.sourceType,
        sourceUrl: t.sourceUrl,
        sourceFilename: t.sourceFilename,
        status: t.status,
        progress: t.progress,
        duration: t.durationSeconds,
        createdAt: t.createdAt,
        completedAt: t.completedAt,
        currentJob: t.jobs[0] || null,
        score: t.score
      }));
    } catch (error) {
      logger.error('Get user transcriptions error:', error);
      throw error;
    }
  }

  /**
   * Cancel transcription job
   */
  async cancelJob(jobId: string, userId: string): Promise<void> {
    try {
      const job = await prisma.job.findFirst({
        where: { celeryTaskId: jobId },
        include: { transcription: true }
      });

      if (!job) {
        throw new AppError('Job not found', 404);
      }

      // Check ownership
      if (job.transcription.userId !== userId) {
        throw new AppError('Unauthorized to cancel this job', 403);
      }

      // Check if job can be cancelled
      if (job.status === 'COMPLETED' || job.status === 'FAILED') {
        throw new AppError('Cannot cancel completed or failed job', 400);
      }

      // Update job status
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: 'CANCELLED',
          completedAt: new Date()
        }
      });

      // Update transcription status
      await prisma.transcription.update({
        where: { id: job.transcription.id },
        data: { status: TranscriptionStatus.CANCELLED }
      });

      // TODO: Send cancellation request to AI service
      // await axios.post(`${this.AI_SERVICE_URL}/api/transcribe/cancel/${jobId}`);

      logger.info(`Job cancelled: ${jobId}`);
    } catch (error) {
      logger.error('Cancel job error:', error);
      throw error;
    }
  }

  /**
   * Update job progress (called by AI service webhook)
   */
  async updateJobProgress(jobId: string, progress: number, status?: string, message?: string): Promise<void> {
    try {
      const job = await prisma.job.findFirst({
        where: { celeryTaskId: jobId }
      });

      if (!job) {
        logger.warn(`Job not found for progress update: ${jobId}`);
        return;
      }

      // Update job
      const updateData: any = { progress };
      
      if (status) {
        updateData.status = status;
        
        if (status === 'COMPLETED') {
          updateData.completedAt = new Date();
        }
      }

      if (message) {
        updateData.errorMessage = message;
      }

      await prisma.job.update({
        where: { id: job.id },
        data: updateData
      });

      // Update transcription progress
      const transcriptionStatus = 
        status === 'COMPLETED' ? TranscriptionStatus.COMPLETED :
        status === 'FAILED' ? TranscriptionStatus.FAILED :
        TranscriptionStatus.PROCESSING;

      await prisma.transcription.update({
        where: { id: job.transcriptionId },
        data: {
          progress,
          status: transcriptionStatus,
          completedAt: status === 'COMPLETED' ? new Date() : undefined
        }
      });

      logger.info(`Job progress updated: ${jobId} - ${progress}%`);
    } catch (error) {
      logger.error('Update job progress error:', error);
      throw error;
    }
  }

  /**
   * Process transcription completion (webhook from AI service)
   */
  async handleTranscriptionComplete(
    jobId: string,
    result: {
      tabData: any;
      musicXml?: string;
      midiData?: Buffer;
      theoryAnalysis?: any;
      tempo?: number;
      key?: string;
      timeSignature?: string;
    }
  ): Promise<void> {
    try {
      const job = await prisma.job.findFirst({
        where: { celeryTaskId: jobId },
        include: { transcription: true }
      });

      if (!job) {
        logger.warn(`Job not found for completion: ${jobId}`);
        return;
      }

      // Create score from transcription result
      const score = await prisma.score.create({
        data: {
          title: `Transcription ${new Date().toLocaleDateString()}`,
          userId: job.transcription.userId,
          tabData: result.tabData,
          musicXml: result.musicXml,
          midiData: result.midiData,
          tempo: result.tempo,
          key: result.key,
          timeSignature: result.timeSignature,
          difficulty: 'INTERMEDIATE', // Default, should be determined by AI
          isPublic: false
        }
      });

      // Update transcription with score reference
      await prisma.transcription.update({
        where: { id: job.transcription.id },
        data: {
          scoreId: score.id,
          tabData: result.tabData,
          theoryAnalysis: result.theoryAnalysis,
          tempo: result.tempo,
          keySignature: result.key,
          timeSignature: result.timeSignature,
          status: TranscriptionStatus.COMPLETED,
          progress: 100,
          completedAt: new Date()
        }
      });

      // Update job
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: 'COMPLETED',
          progress: 100,
          completedAt: new Date()
        }
      });

      logger.info(`Transcription completed: ${jobId}, Score created: ${score.id}`);
    } catch (error) {
      logger.error('Handle transcription complete error:', error);
      throw error;
    }
  }
}

export const youtubeService = new YouTubeService();