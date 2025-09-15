import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { practiceService } from '../services/practice.service';
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
 * @route   POST /api/practice/sessions/start
 * @desc    Start a new practice session
 * @access  Private
 */
router.post(
  '/sessions/start',
  [
    body('scoreId').isUUID().withMessage('Valid score ID is required'),
    body('tempo').optional().isInt({ min: 20, max: 300 }),
    body('loopStart').optional().isInt({ min: 0 }),
    body('loopEnd').optional().isInt({ min: 0 }),
    body('notes').optional().trim(),
    handleValidationErrors
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const { scoreId, tempo, loopStart, loopEnd, notes } = req.body;

      const session = await practiceService.startSession({
        scoreId,
        userId,
        tempo,
        loopStart,
        loopEnd,
        notes
      });

      res.status(201).json({
        success: true,
        message: 'Practice session started',
        data: session
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   PUT /api/practice/sessions/:sessionId/end
 * @desc    End a practice session
 * @access  Private
 */
router.put(
  '/sessions/:sessionId/end',
  [
    param('sessionId').isUUID().withMessage('Valid session ID is required'),
    body('accuracy').optional().isFloat({ min: 0, max: 100 }),
    body('measuresPlayed').optional().isInt({ min: 0 }),
    body('mistakesCount').optional().isInt({ min: 0 }),
    body('averageTempo').optional().isInt({ min: 20, max: 300 }),
    body('difficultSections').optional().isArray(),
    handleValidationErrors
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const { sessionId } = req.params;
      const metrics = req.body;

      const session = await practiceService.endSession(sessionId, userId, metrics);

      res.json({
        success: true,
        message: 'Practice session ended',
        data: session
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   PUT /api/practice/sessions/:sessionId/progress
 * @desc    Update practice session progress
 * @access  Private
 */
router.put(
  '/sessions/:sessionId/progress',
  [
    param('sessionId').isUUID().withMessage('Valid session ID is required'),
    body('measuresPlayed').optional().isInt({ min: 0 }),
    body('accuracy').optional().isFloat({ min: 0, max: 100 }),
    body('tempo').optional().isInt({ min: 20, max: 300 }),
    body('notes').optional().trim(),
    handleValidationErrors
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const { sessionId } = req.params;
      const progress = req.body;

      const session = await practiceService.updateProgress(sessionId, userId, progress);

      res.json({
        success: true,
        message: 'Practice progress updated',
        data: session
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/practice/sessions/:sessionId
 * @desc    Get a specific practice session
 * @access  Private
 */
router.get(
  '/sessions/:sessionId',
  [
    param('sessionId').isUUID().withMessage('Valid session ID is required'),
    handleValidationErrors
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const { sessionId } = req.params;

      const session = await practiceService.getSession(sessionId, userId);

      res.json({
        success: true,
        data: session
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/practice/sessions
 * @desc    Get user's practice sessions
 * @access  Private
 */
router.get(
  '/sessions',
  [
    query('scoreId').optional().isUUID(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
    query('includeMetrics').optional().isBoolean().toBoolean(),
    handleValidationErrors
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const { scoreId, limit, offset, includeMetrics } = req.query;

      const result = await practiceService.getUserSessions(userId, {
        scoreId: scoreId as string,
        limit: limit as number,
        offset: offset as number,
        includeMetrics: includeMetrics as boolean
      });

      res.json({
        success: true,
        data: result.sessions,
        meta: {
          total: result.total,
          limit: limit || 20,
          offset: offset || 0
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/practice/statistics
 * @desc    Get user's practice statistics
 * @access  Private
 */
router.get(
  '/statistics',
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    handleValidationErrors
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const { startDate, endDate } = req.query;

      let period: { start: Date; end: Date } | undefined;
      if (startDate && endDate) {
        period = {
          start: new Date(startDate as string),
          end: new Date(endDate as string)
        };
      }

      const statistics = await practiceService.getUserStatistics(userId, period);

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/practice/statistics/score/:scoreId
 * @desc    Get practice statistics for a specific score
 * @access  Private
 */
router.get(
  '/statistics/score/:scoreId',
  [
    param('scoreId').isUUID().withMessage('Valid score ID is required'),
    handleValidationErrors
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const { scoreId } = req.params;

      const statistics = await practiceService.getScoreStatistics(scoreId, userId);

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/practice/leaderboard
 * @desc    Get practice leaderboard
 * @access  Private
 */
router.get(
  '/leaderboard',
  [
    query('period').optional().isIn(['daily', 'weekly', 'monthly', 'all']),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    handleValidationErrors
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const period = (req.query.period as any) || 'weekly';
      const limit = (req.query.limit as number) || 10;

      const leaderboard = await practiceService.getLeaderboard(period, limit);

      res.json({
        success: true,
        data: leaderboard,
        meta: {
          period,
          limit
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;