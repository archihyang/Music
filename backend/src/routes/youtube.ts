import { Router, Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import { youtubeService } from '../services/youtube.service';
import { authenticate } from '../middleware/auth';
import { ValidationError } from '../utils/AppError';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Validation middleware
 */
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }
  next();
};

/**
 * @route   POST /api/youtube/validate
 * @desc    Validate YouTube URL and get video info
 * @access  Public (rate limited)
 */
router.post(
  '/validate',
  [
    body('url').notEmpty().withMessage('YouTube URL is required'),
    handleValidationErrors
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { url } = req.body;

      if (!youtubeService.validateYouTubeUrl(url)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid YouTube URL'
        });
      }

      const videoInfo = await youtubeService.getVideoInfo(url);

      res.json({
        success: true,
        data: videoInfo
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/youtube/transcribe
 * @desc    Start YouTube video transcription
 * @access  Private
 */
router.post(
  '/transcribe',
  authenticate,
  [
    body('url').notEmpty().withMessage('YouTube URL is required'),
    body('instrument').optional().isIn(['guitar', 'bass', 'piano', 'drums']),
    body('difficulty').optional().isIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PROFESSIONAL']),
    body('style').optional().trim(),
    handleValidationErrors
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const { url, instrument, difficulty, style } = req.body;

      const result = await youtubeService.startYouTubeTranscription({
        url,
        instrument,
        difficulty,
        style,
        userId
      });

      res.status(202).json({
        success: true,
        message: 'Transcription job started',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/youtube/upload
 * @desc    Upload audio file for transcription
 * @access  Private
 */
router.post(
  '/upload',
  authenticate,
  [
    body('instrument').optional().isIn(['guitar', 'bass', 'piano', 'drums']),
    body('difficulty').optional().isIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PROFESSIONAL']),
    body('style').optional().trim(),
    handleValidationErrors
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const { instrument, difficulty, style } = req.body;

      // TODO: Handle file upload with multer
      // For now, we'll return a placeholder response
      
      res.status(202).json({
        success: true,
        message: 'File upload transcription to be implemented',
        data: {
          jobId: 'placeholder-job-id',
          status: 'pending'
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/youtube/jobs/:jobId
 * @desc    Get transcription job status
 * @access  Private
 */
router.get(
  '/jobs/:jobId',
  authenticate,
  [
    param('jobId').notEmpty().withMessage('Job ID is required'),
    handleValidationErrors
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { jobId } = req.params;

      const status = await youtubeService.getJobStatus(jobId);

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/youtube/history
 * @desc    Get user's transcription history
 * @access  Private
 */
router.get(
  '/history',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const limit = parseInt(req.query.limit as string) || 20;

      const transcriptions = await youtubeService.getUserTranscriptions(userId, limit);

      res.json({
        success: true,
        data: transcriptions
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   DELETE /api/youtube/jobs/:jobId
 * @desc    Cancel transcription job
 * @access  Private
 */
router.delete(
  '/jobs/:jobId',
  authenticate,
  [
    param('jobId').notEmpty().withMessage('Job ID is required'),
    handleValidationErrors
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { jobId } = req.params;
      const userId = (req as any).user.userId;

      await youtubeService.cancelJob(jobId, userId);

      res.json({
        success: true,
        message: 'Job cancelled successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/youtube/webhook/progress
 * @desc    Webhook for AI service to update job progress
 * @access  Internal (should be secured with API key)
 */
router.post(
  '/webhook/progress',
  [
    body('jobId').notEmpty(),
    body('progress').isInt({ min: 0, max: 100 }),
    body('status').optional().isIn(['QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED']),
    body('message').optional().trim(),
    handleValidationErrors
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // TODO: Verify webhook signature or API key for security
      const { jobId, progress, status, message } = req.body;

      await youtubeService.updateJobProgress(jobId, progress, status, message);

      res.json({
        success: true,
        message: 'Progress updated'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/youtube/webhook/complete
 * @desc    Webhook for AI service when transcription is complete
 * @access  Internal (should be secured with API key)
 */
router.post(
  '/webhook/complete',
  [
    body('jobId').notEmpty(),
    body('result').notEmpty(),
    handleValidationErrors
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // TODO: Verify webhook signature or API key for security
      const { jobId, result } = req.body;

      await youtubeService.handleTranscriptionComplete(jobId, result);

      res.json({
        success: true,
        message: 'Transcription completion processed'
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;