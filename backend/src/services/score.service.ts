import { PrismaClient, Score, Difficulty } from '@prisma/client';
import { AppError, NotFoundError } from '../utils/AppError';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface ScoreFilters {
  search?: string;
  artist?: string;
  genre?: string;
  difficulty?: Difficulty;
  guitaristStyle?: string;
  isPublic?: boolean;
  userId?: string;
}

export interface ScoreCreateInput {
  title: string;
  artist?: string;
  genre?: string;
  difficulty?: Difficulty;
  musicXml?: string;
  tabData?: any;
  midiData?: Buffer;
  audioUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  tempo?: number;
  key?: string;
  timeSignature?: string;
  tuning?: string;
  capo?: number;
  styleAnalysis?: any;
  guitaristStyle?: string;
  techniques?: string[];
  isPublic?: boolean;
}

export interface ScoreUpdateInput extends Partial<ScoreCreateInput> {}

export interface ScorePaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'artist' | 'views' | 'likes';
  sortOrder?: 'asc' | 'desc';
}

export class ScoreService {
  /**
   * Create a new score
   */
  async createScore(userId: string, data: ScoreCreateInput): Promise<Score> {
    try {
      const score = await prisma.score.create({
        data: {
          ...data,
          userId,
          techniques: data.techniques || []
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      logger.info(`Score created: ${score.id} by user: ${userId}`);
      return score;
    } catch (error) {
      logger.error('Score creation error:', error);
      throw error;
    }
  }

  /**
   * Get score by ID
   */
  async getScoreById(scoreId: string, userId?: string): Promise<Score> {
    try {
      const score = await prisma.score.findUnique({
        where: { id: scoreId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          practiceSessions: userId ? {
            where: { userId },
            orderBy: { startTime: 'desc' },
            take: 5
          } : false
        }
      });

      if (!score) {
        throw new NotFoundError('Score not found');
      }

      // Check access permissions
      if (!score.isPublic && score.userId !== userId) {
        throw new AppError('Access denied', 403);
      }

      // Increment view count
      await prisma.score.update({
        where: { id: scoreId },
        data: { views: { increment: 1 } }
      });

      return score;
    } catch (error) {
      logger.error('Score fetch error:', error);
      throw error;
    }
  }

  /**
   * Get all scores with filters and pagination
   */
  async getScores(
    filters: ScoreFilters = {},
    options: ScorePaginationOptions = {}
  ): Promise<{ scores: Score[]; total: number; page: number; totalPages: number }> {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      const {
        search,
        artist,
        genre,
        difficulty,
        guitaristStyle,
        isPublic,
        userId
      } = filters;

      // Build where clause
      const where: any = {};

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { artist: { contains: search, mode: 'insensitive' } }
        ];
      }

      if (artist) {
        where.artist = { contains: artist, mode: 'insensitive' };
      }

      if (genre) {
        where.genre = genre;
      }

      if (difficulty) {
        where.difficulty = difficulty;
      }

      if (guitaristStyle) {
        where.guitaristStyle = guitaristStyle;
      }

      if (isPublic !== undefined) {
        where.isPublic = isPublic;
      }

      if (userId) {
        where.userId = userId;
      }

      // Get total count
      const total = await prisma.score.count({ where });

      // Get paginated scores
      const scores = await prisma.score.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit
      });

      const totalPages = Math.ceil(total / limit);

      return {
        scores,
        total,
        page,
        totalPages
      };
    } catch (error) {
      logger.error('Scores fetch error:', error);
      throw error;
    }
  }

  /**
   * Update score
   */
  async updateScore(
    scoreId: string,
    userId: string,
    data: ScoreUpdateInput
  ): Promise<Score> {
    try {
      // Check ownership
      const existingScore = await prisma.score.findUnique({
        where: { id: scoreId }
      });

      if (!existingScore) {
        throw new NotFoundError('Score not found');
      }

      if (existingScore.userId !== userId) {
        throw new AppError('You do not have permission to update this score', 403);
      }

      // Update score
      const score = await prisma.score.update({
        where: { id: scoreId },
        data: {
          ...data,
          techniques: data.techniques || existingScore.techniques
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      logger.info(`Score updated: ${scoreId} by user: ${userId}`);
      return score;
    } catch (error) {
      logger.error('Score update error:', error);
      throw error;
    }
  }

  /**
   * Delete score
   */
  async deleteScore(scoreId: string, userId: string): Promise<void> {
    try {
      // Check ownership
      const score = await prisma.score.findUnique({
        where: { id: scoreId }
      });

      if (!score) {
        throw new NotFoundError('Score not found');
      }

      if (score.userId !== userId) {
        throw new AppError('You do not have permission to delete this score', 403);
      }

      // Delete score (cascade will handle related records)
      await prisma.score.delete({
        where: { id: scoreId }
      });

      logger.info(`Score deleted: ${scoreId} by user: ${userId}`);
    } catch (error) {
      logger.error('Score deletion error:', error);
      throw error;
    }
  }

  /**
   * Toggle score public/private status
   */
  async toggleScoreVisibility(
    scoreId: string,
    userId: string
  ): Promise<Score> {
    try {
      // Check ownership
      const score = await prisma.score.findUnique({
        where: { id: scoreId }
      });

      if (!score) {
        throw new NotFoundError('Score not found');
      }

      if (score.userId !== userId) {
        throw new AppError('You do not have permission to modify this score', 403);
      }

      // Toggle visibility
      const updatedScore = await prisma.score.update({
        where: { id: scoreId },
        data: { isPublic: !score.isPublic }
      });

      logger.info(`Score visibility toggled: ${scoreId} to ${updatedScore.isPublic}`);
      return updatedScore;
    } catch (error) {
      logger.error('Score visibility toggle error:', error);
      throw error;
    }
  }

  /**
   * Like/unlike a score
   */
  async toggleScoreLike(scoreId: string, userId: string): Promise<{ liked: boolean; likes: number }> {
    try {
      // For now, we'll just increment/decrement the likes count
      // In a real app, you'd want a separate likes table to track who liked what
      
      const score = await prisma.score.findUnique({
        where: { id: scoreId }
      });

      if (!score) {
        throw new NotFoundError('Score not found');
      }

      // Simple toggle - in production, track likes in a separate table
      const updatedScore = await prisma.score.update({
        where: { id: scoreId },
        data: { likes: { increment: 1 } } // For demo, always increment
      });

      return {
        liked: true,
        likes: updatedScore.likes
      };
    } catch (error) {
      logger.error('Score like toggle error:', error);
      throw error;
    }
  }

  /**
   * Get popular scores
   */
  async getPopularScores(limit: number = 10): Promise<Score[]> {
    try {
      const scores = await prisma.score.findMany({
        where: { isPublic: true },
        orderBy: [
          { views: 'desc' },
          { likes: 'desc' }
        ],
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      });

      return scores;
    } catch (error) {
      logger.error('Popular scores fetch error:', error);
      throw error;
    }
  }

  /**
   * Get recent scores
   */
  async getRecentScores(limit: number = 10): Promise<Score[]> {
    try {
      const scores = await prisma.score.findMany({
        where: { isPublic: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      });

      return scores;
    } catch (error) {
      logger.error('Recent scores fetch error:', error);
      throw error;
    }
  }

  /**
   * Search scores by techniques
   */
  async searchByTechniques(techniques: string[], limit: number = 20): Promise<Score[]> {
    try {
      const scores = await prisma.score.findMany({
        where: {
          isPublic: true,
          techniques: {
            hasSome: techniques
          }
        },
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      });

      return scores;
    } catch (error) {
      logger.error('Technique search error:', error);
      throw error;
    }
  }

  /**
   * Get user's practice history for a score
   */
  async getScorePracticeHistory(scoreId: string, userId: string) {
    try {
      const sessions = await prisma.practiceSession.findMany({
        where: {
          scoreId,
          userId
        },
        orderBy: { startTime: 'desc' },
        take: 20
      });

      // Calculate statistics
      const totalSessions = sessions.length;
      const totalPracticeTime = sessions.reduce((sum, session) => sum + (session.duration || 0), 0);
      const averageAccuracy = sessions.reduce((sum, session) => sum + (session.accuracy || 0), 0) / (totalSessions || 1);
      const lastPracticed = sessions[0]?.startTime || null;

      return {
        sessions,
        statistics: {
          totalSessions,
          totalPracticeTime,
          averageAccuracy,
          lastPracticed
        }
      };
    } catch (error) {
      logger.error('Practice history fetch error:', error);
      throw error;
    }
  }
}

export const scoreService = new ScoreService();