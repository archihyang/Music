import { Router, Request, Response, NextFunction } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { scoreService } from '../services/score.service';
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
 * @route   GET /api/scores
 * @desc    Get all scores with filters
 * @access  Private
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('search').optional().trim(),
    query('artist').optional().trim(),
    query('genre').optional().trim(),
    query('difficulty').optional().isIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PROFESSIONAL']),
    query('guitaristStyle').optional().trim(),
    query('isPublic').optional().isBoolean().toBoolean(),
    query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'title', 'artist', 'views', 'likes']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
    handleValidationErrors
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.userId;
      
      const filters = {
        search: req.query.search as string,
        artist: req.query.artist as string,
        genre: req.query.genre as string,
        difficulty: req.query.difficulty as any,
        guitaristStyle: req.query.guitaristStyle as string,
        isPublic: req.query.isPublic as boolean,
        userId: req.query.myScores === 'true' ? userId : undefined
      };

      const options = {
        page: req.query.page as number || 1,
        limit: req.query.limit as number || 20,
        sortBy: req.query.sortBy as any || 'createdAt',
        sortOrder: req.query.sortOrder as any || 'desc'
      };

      const result = await scoreService.getScores(filters, options);

      res.json({
        success: true,
        data: result.scores,
        meta: {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
          limit: options.limit
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/scores/popular
 * @desc    Get popular scores
 * @access  Private
 */
router.get('/popular', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const scores = await scoreService.getPopularScores(limit);

    res.json({
      success: true,
      data: scores
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/scores/recent
 * @desc    Get recent scores
 * @access  Private
 */
router.get('/recent', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const scores = await scoreService.getRecentScores(limit);

    res.json({
      success: true,
      data: scores
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/scores/techniques
 * @desc    Search scores by techniques
 * @access  Private
 */
router.get(
  '/techniques',
  [
    query('techniques').isArray().withMessage('Techniques must be an array'),
    handleValidationErrors
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const techniques = req.query.techniques as string[];
      const limit = parseInt(req.query.limit as string) || 20;
      
      const scores = await scoreService.searchByTechniques(techniques, limit);

      res.json({
        success: true,
        data: scores
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/scores/:id
 * @desc    Get score by ID
 * @access  Private
 */
router.get(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid score ID'),
    handleValidationErrors
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const scoreId = req.params.id;
      const userId = (req as any).user?.userId;

      const score = await scoreService.getScoreById(scoreId, userId);

      res.json({
        success: true,
        data: score
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/scores/:id/practice-history
 * @desc    Get practice history for a score
 * @access  Private
 */
router.get(
  '/:id/practice-history',
  [
    param('id').isUUID().withMessage('Invalid score ID'),
    handleValidationErrors
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const scoreId = req.params.id;
      const userId = (req as any).user.userId;

      const history = await scoreService.getScorePracticeHistory(scoreId, userId);

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/scores
 * @desc    Create a new score
 * @access  Private
 */
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('artist').optional().trim(),
    body('genre').optional().trim(),
    body('difficulty').optional().isIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PROFESSIONAL']),
    body('musicXml').optional().isString(),
    body('tabData').optional(),
    body('audioUrl').optional().isURL(),
    body('thumbnailUrl').optional().isURL(),
    body('duration').optional().isInt({ min: 0 }),
    body('tempo').optional().isInt({ min: 20, max: 300 }),
    body('key').optional().trim(),
    body('timeSignature').optional().matches(/^\d+\/\d+$/),
    body('tuning').optional().trim(),
    body('capo').optional().isInt({ min: 0, max: 12 }),
    body('guitaristStyle').optional().trim(),
    body('techniques').optional().isArray(),
    body('isPublic').optional().isBoolean(),
    handleValidationErrors
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const scoreData = req.body;

      const score = await scoreService.createScore(userId, scoreData);

      res.status(201).json({
        success: true,
        message: 'Score created successfully',
        data: score
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   PUT /api/scores/:id
 * @desc    Update a score
 * @access  Private (owner only)
 */
router.put(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid score ID'),
    body('title').optional().trim().notEmpty(),
    body('artist').optional().trim(),
    body('genre').optional().trim(),
    body('difficulty').optional().isIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PROFESSIONAL']),
    body('musicXml').optional().isString(),
    body('tabData').optional(),
    body('audioUrl').optional().isURL(),
    body('thumbnailUrl').optional().isURL(),
    body('duration').optional().isInt({ min: 0 }),
    body('tempo').optional().isInt({ min: 20, max: 300 }),
    body('key').optional().trim(),
    body('timeSignature').optional().matches(/^\d+\/\d+$/),
    body('tuning').optional().trim(),
    body('capo').optional().isInt({ min: 0, max: 12 }),
    body('guitaristStyle').optional().trim(),
    body('techniques').optional().isArray(),
    body('isPublic').optional().isBoolean(),
    handleValidationErrors
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const scoreId = req.params.id;
      const userId = (req as any).user.userId;
      const updateData = req.body;

      const score = await scoreService.updateScore(scoreId, userId, updateData);

      res.json({
        success: true,
        message: 'Score updated successfully',
        data: score
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   DELETE /api/scores/:id
 * @desc    Delete a score
 * @access  Private (owner only)
 */
router.delete(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid score ID'),
    handleValidationErrors
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const scoreId = req.params.id;
      const userId = (req as any).user.userId;

      await scoreService.deleteScore(scoreId, userId);

      res.json({
        success: true,
        message: 'Score deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   PUT /api/scores/:id/visibility
 * @desc    Toggle score visibility (public/private)
 * @access  Private (owner only)
 */
router.put(
  '/:id/visibility',
  [
    param('id').isUUID().withMessage('Invalid score ID'),
    handleValidationErrors
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const scoreId = req.params.id;
      const userId = (req as any).user.userId;

      const score = await scoreService.toggleScoreVisibility(scoreId, userId);

      res.json({
        success: true,
        message: `Score is now ${score.isPublic ? 'public' : 'private'}`,
        data: {
          id: score.id,
          isPublic: score.isPublic
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/scores/:id/like
 * @desc    Like/unlike a score
 * @access  Private
 */
router.post(
  '/:id/like',
  [
    param('id').isUUID().withMessage('Invalid score ID'),
    handleValidationErrors
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const scoreId = req.params.id;
      const userId = (req as any).user.userId;

      const result = await scoreService.toggleScoreLike(scoreId, userId);

      res.json({
        success: true,
        message: result.liked ? 'Score liked' : 'Score unliked',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;