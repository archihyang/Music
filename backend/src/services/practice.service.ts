import { PrismaClient, PracticeSession } from '@prisma/client';
import { AppError, NotFoundError } from '../utils/AppError';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface PracticeSessionInput {
  scoreId: string;
  userId: string;
  tempo?: number;
  loopStart?: number;
  loopEnd?: number;
  notes?: string;
}

interface PracticeMetrics {
  accuracy?: number;
  measuresPlayed?: number;
  mistakesCount?: number;
  averageTempo?: number;
  difficultSections?: any[];
}

interface PracticeGoal {
  id: string;
  userId: string;
  scoreId?: string;
  type: 'DAILY_PRACTICE' | 'WEEKLY_PRACTICE' | 'ACCURACY_TARGET' | 'SPEED_TARGET' | 'COMPLETION';
  target: number;
  current: number;
  completed: boolean;
  deadline?: Date;
}

interface PracticeStatistics {
  totalSessions: number;
  totalPracticeTime: number;
  averageSessionDuration: number;
  averageAccuracy: number;
  mostPracticedScore?: any;
  currentStreak: number;
  longestStreak: number;
  practiceHistory: any[];
}

export class PracticeService {
  /**
   * Start a new practice session
   */
  async startSession(input: PracticeSessionInput): Promise<PracticeSession> {
    try {
      const { scoreId, userId, tempo, loopStart, loopEnd, notes } = input;

      // Verify score exists and user has access
      const score = await prisma.score.findUnique({
        where: { id: scoreId }
      });

      if (!score) {
        throw new NotFoundError('Score not found');
      }

      if (!score.isPublic && score.userId !== userId) {
        throw new AppError('Access denied to this score', 403);
      }

      // Check for existing active session
      const activeSession = await prisma.practiceSession.findFirst({
        where: {
          userId,
          scoreId,
          endTime: null
        }
      });

      if (activeSession) {
        // End the previous session
        await this.endSession(activeSession.id, userId);
      }

      // Create new session
      const session = await prisma.practiceSession.create({
        data: {
          scoreId,
          userId,
          tempo,
          loopStart,
          loopEnd,
          notes
        },
        include: {
          score: {
            select: {
              id: true,
              title: true,
              artist: true,
              difficulty: true
            }
          }
        }
      });

      logger.info(`Practice session started: ${session.id} for user: ${userId}`);
      return session;
    } catch (error) {
      logger.error('Start practice session error:', error);
      throw error;
    }
  }

  /**
   * End a practice session
   */
  async endSession(
    sessionId: string,
    userId: string,
    metrics?: PracticeMetrics
  ): Promise<PracticeSession> {
    try {
      // Verify session exists and belongs to user
      const session = await prisma.practiceSession.findUnique({
        where: { id: sessionId }
      });

      if (!session) {
        throw new NotFoundError('Practice session not found');
      }

      if (session.userId !== userId) {
        throw new AppError('Unauthorized to end this session', 403);
      }

      if (session.endTime) {
        throw new AppError('Session already ended', 400);
      }

      // Calculate duration
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - session.startTime.getTime()) / 1000);

      // Update session with metrics
      const updatedSession = await prisma.practiceSession.update({
        where: { id: sessionId },
        data: {
          endTime,
          duration,
          accuracy: metrics?.accuracy,
          measuresPlayed: metrics?.measuresPlayed || 0,
          metrics: metrics ? metrics : undefined
        },
        include: {
          score: {
            select: {
              id: true,
              title: true,
              artist: true,
              difficulty: true
            }
          }
        }
      });

      // Update user's last practice time
      await prisma.user.update({
        where: { id: userId },
        data: { lastLoginAt: new Date() } // Using lastLoginAt as lastPracticeAt
      });

      logger.info(`Practice session ended: ${sessionId}, duration: ${duration}s`);
      return updatedSession;
    } catch (error) {
      logger.error('End practice session error:', error);
      throw error;
    }
  }

  /**
   * Update practice session progress
   */
  async updateProgress(
    sessionId: string,
    userId: string,
    progress: {
      measuresPlayed?: number;
      accuracy?: number;
      tempo?: number;
      notes?: string;
    }
  ): Promise<PracticeSession> {
    try {
      // Verify session exists and belongs to user
      const session = await prisma.practiceSession.findUnique({
        where: { id: sessionId }
      });

      if (!session) {
        throw new NotFoundError('Practice session not found');
      }

      if (session.userId !== userId) {
        throw new AppError('Unauthorized to update this session', 403);
      }

      if (session.endTime) {
        throw new AppError('Cannot update ended session', 400);
      }

      // Update session progress
      const updatedSession = await prisma.practiceSession.update({
        where: { id: sessionId },
        data: {
          measuresPlayed: progress.measuresPlayed || session.measuresPlayed,
          accuracy: progress.accuracy || session.accuracy,
          tempo: progress.tempo || session.tempo,
          notes: progress.notes || session.notes
        }
      });

      logger.info(`Practice session progress updated: ${sessionId}`);
      return updatedSession;
    } catch (error) {
      logger.error('Update practice progress error:', error);
      throw error;
    }
  }

  /**
   * Get practice session by ID
   */
  async getSession(sessionId: string, userId: string): Promise<PracticeSession> {
    try {
      const session = await prisma.practiceSession.findUnique({
        where: { id: sessionId },
        include: {
          score: true,
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

      if (!session) {
        throw new NotFoundError('Practice session not found');
      }

      // Check access (user owns session or score is public)
      if (session.userId !== userId && !session.score.isPublic) {
        throw new AppError('Access denied to this session', 403);
      }

      return session;
    } catch (error) {
      logger.error('Get practice session error:', error);
      throw error;
    }
  }

  /**
   * Get user's practice sessions
   */
  async getUserSessions(
    userId: string,
    options: {
      scoreId?: string;
      limit?: number;
      offset?: number;
      includeMetrics?: boolean;
    } = {}
  ): Promise<{ sessions: PracticeSession[]; total: number }> {
    try {
      const { scoreId, limit = 20, offset = 0, includeMetrics = false } = options;

      const where: any = { userId };
      if (scoreId) {
        where.scoreId = scoreId;
      }

      const [sessions, total] = await Promise.all([
        prisma.practiceSession.findMany({
          where,
          include: {
            score: {
              select: {
                id: true,
                title: true,
                artist: true,
                difficulty: true,
                thumbnailUrl: true
              }
            }
          },
          orderBy: { startTime: 'desc' },
          skip: offset,
          take: limit
        }),
        prisma.practiceSession.count({ where })
      ]);

      return { sessions, total };
    } catch (error) {
      logger.error('Get user sessions error:', error);
      throw error;
    }
  }

  /**
   * Get practice statistics for a user
   */
  async getUserStatistics(
    userId: string,
    period?: { start: Date; end: Date }
  ): Promise<PracticeStatistics> {
    try {
      const where: any = { userId };
      if (period) {
        where.startTime = {
          gte: period.start,
          lte: period.end
        };
      }

      // Get all sessions for statistics
      const sessions = await prisma.practiceSession.findMany({
        where,
        include: {
          score: {
            select: {
              id: true,
              title: true,
              artist: true
            }
          }
        },
        orderBy: { startTime: 'desc' }
      });

      // Calculate statistics
      const totalSessions = sessions.length;
      const totalPracticeTime = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
      const averageSessionDuration = totalSessions > 0 ? totalPracticeTime / totalSessions : 0;
      
      const sessionsWithAccuracy = sessions.filter(s => s.accuracy !== null);
      const averageAccuracy = sessionsWithAccuracy.length > 0
        ? sessionsWithAccuracy.reduce((sum, s) => sum + (s.accuracy || 0), 0) / sessionsWithAccuracy.length
        : 0;

      // Find most practiced score
      const scoreCount = new Map<string, { count: number; score: any }>();
      sessions.forEach(session => {
        const scoreId = session.scoreId;
        const current = scoreCount.get(scoreId) || { count: 0, score: session.score };
        scoreCount.set(scoreId, { count: current.count + 1, score: session.score });
      });

      let mostPracticedScore = null;
      let maxCount = 0;
      scoreCount.forEach(({ count, score }) => {
        if (count > maxCount) {
          maxCount = count;
          mostPracticedScore = { ...score, practiceCount: count };
        }
      });

      // Calculate practice streak
      const { currentStreak, longestStreak } = this.calculateStreaks(sessions);

      // Get practice history for last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const practiceHistory = this.generatePracticeHistory(sessions, thirtyDaysAgo);

      return {
        totalSessions,
        totalPracticeTime,
        averageSessionDuration,
        averageAccuracy,
        mostPracticedScore,
        currentStreak,
        longestStreak,
        practiceHistory
      };
    } catch (error) {
      logger.error('Get user statistics error:', error);
      throw error;
    }
  }

  /**
   * Get practice statistics for a specific score
   */
  async getScoreStatistics(
    scoreId: string,
    userId: string
  ): Promise<any> {
    try {
      const sessions = await prisma.practiceSession.findMany({
        where: {
          scoreId,
          userId
        },
        orderBy: { startTime: 'desc' }
      });

      const totalSessions = sessions.length;
      const totalPracticeTime = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
      
      const sessionsWithAccuracy = sessions.filter(s => s.accuracy !== null);
      const averageAccuracy = sessionsWithAccuracy.length > 0
        ? sessionsWithAccuracy.reduce((sum, s) => sum + (s.accuracy || 0), 0) / sessionsWithAccuracy.length
        : 0;

      const lastSession = sessions[0];
      const firstSession = sessions[sessions.length - 1];

      // Calculate improvement
      let accuracyImprovement = 0;
      let tempoImprovement = 0;

      if (firstSession && lastSession && firstSession.id !== lastSession.id) {
        if (firstSession.accuracy && lastSession.accuracy) {
          accuracyImprovement = lastSession.accuracy - firstSession.accuracy;
        }
        if (firstSession.tempo && lastSession.tempo) {
          tempoImprovement = lastSession.tempo - firstSession.tempo;
        }
      }

      // Find best session
      const bestSession = sessions.reduce((best, current) => {
        if (!best || (current.accuracy || 0) > (best.accuracy || 0)) {
          return current;
        }
        return best;
      }, null as PracticeSession | null);

      return {
        totalSessions,
        totalPracticeTime,
        averageAccuracy,
        lastPracticed: lastSession?.startTime,
        firstPracticed: firstSession?.startTime,
        accuracyImprovement,
        tempoImprovement,
        bestSession: bestSession ? {
          id: bestSession.id,
          accuracy: bestSession.accuracy,
          date: bestSession.startTime,
          duration: bestSession.duration
        } : null,
        recentSessions: sessions.slice(0, 5)
      };
    } catch (error) {
      logger.error('Get score statistics error:', error);
      throw error;
    }
  }

  /**
   * Get practice leaderboard
   */
  async getLeaderboard(
    period: 'daily' | 'weekly' | 'monthly' | 'all',
    limit: number = 10
  ): Promise<any[]> {
    try {
      let startDate: Date | undefined;
      const now = new Date();

      switch (period) {
        case 'daily':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'weekly':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'monthly':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
      }

      const where: any = {};
      if (startDate) {
        where.startTime = { gte: startDate };
      }

      // Get aggregated practice data per user
      const sessions = await prisma.practiceSession.findMany({
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
        }
      });

      // Aggregate by user
      const userStats = new Map<string, any>();
      
      sessions.forEach(session => {
        const userId = session.userId;
        const current = userStats.get(userId) || {
          user: session.user,
          totalPracticeTime: 0,
          sessionCount: 0,
          averageAccuracy: 0,
          accuracyCount: 0
        };

        current.totalPracticeTime += session.duration || 0;
        current.sessionCount += 1;
        
        if (session.accuracy !== null) {
          current.averageAccuracy = 
            (current.averageAccuracy * current.accuracyCount + session.accuracy) / 
            (current.accuracyCount + 1);
          current.accuracyCount += 1;
        }

        userStats.set(userId, current);
      });

      // Convert to array and sort by practice time
      const leaderboard = Array.from(userStats.values())
        .map(stats => ({
          user: stats.user,
          totalPracticeTime: stats.totalPracticeTime,
          sessionCount: stats.sessionCount,
          averageAccuracy: stats.averageAccuracy,
          practiceScore: stats.totalPracticeTime + (stats.averageAccuracy * 100)
        }))
        .sort((a, b) => b.practiceScore - a.practiceScore)
        .slice(0, limit);

      return leaderboard;
    } catch (error) {
      logger.error('Get leaderboard error:', error);
      throw error;
    }
  }

  /**
   * Calculate practice streaks
   */
  private calculateStreaks(sessions: PracticeSession[]): { currentStreak: number; longestStreak: number } {
    if (sessions.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    // Group sessions by date
    const practiceByDate = new Map<string, boolean>();
    sessions.forEach(session => {
      const date = session.startTime.toISOString().split('T')[0];
      practiceByDate.set(date, true);
    });

    // Convert to sorted array of dates
    const practiceDates = Array.from(practiceByDate.keys()).sort();

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    // Calculate streaks
    for (let i = 1; i < practiceDates.length; i++) {
      const prevDate = new Date(practiceDates[i - 1]);
      const currDate = new Date(practiceDates[i]);
      const dayDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

      if (dayDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Check if current streak is active (includes today or yesterday)
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    if (practiceDates.includes(today) || practiceDates.includes(yesterday)) {
      currentStreak = tempStreak;
    }

    return { currentStreak, longestStreak };
  }

  /**
   * Generate practice history for chart
   */
  private generatePracticeHistory(sessions: PracticeSession[], startDate: Date): any[] {
    const history: any[] = [];
    const endDate = new Date();
    
    // Create a map of practice time by date
    const practiceByDate = new Map<string, number>();
    sessions.forEach(session => {
      if (session.startTime >= startDate) {
        const date = session.startTime.toISOString().split('T')[0];
        const current = practiceByDate.get(date) || 0;
        practiceByDate.set(date, current + (session.duration || 0));
      }
    });

    // Generate array with all dates
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      history.push({
        date: dateStr,
        practiceTime: practiceByDate.get(dateStr) || 0
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return history;
  }
}

export const practiceService = new PracticeService();