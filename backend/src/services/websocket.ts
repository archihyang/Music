/**
 * WebSocket Service
 * Real-time communication for transcription progress
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { verifyToken } from '../middleware/auth';

interface TranscriptionUpdate {
  jobId: string;
  userId: string;
  progress: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message?: string;
  data?: any;
}

export class WebSocketService {
  private io: SocketIOServer;
  private userSockets: Map<string, Set<string>> = new Map();
  
  constructor(io: SocketIOServer) {
    this.io = io;
  }
  
  initialize(): void {
    this.io.on('connection', (socket: Socket) => {
      logger.info(`WebSocket client connected: ${socket.id}`);
      
      // Authentication
      socket.on('authenticate', async (token: string) => {
        try {
          const decoded = verifyToken(token);
          const userId = decoded.id;
          
          // Store user-socket mapping
          if (!this.userSockets.has(userId)) {
            this.userSockets.set(userId, new Set());
          }
          this.userSockets.get(userId)!.add(socket.id);
          
          // Join user room
          socket.join(`user:${userId}`);
          socket.emit('authenticated', { userId });
          
          logger.info(`User ${userId} authenticated on socket ${socket.id}`);
        } catch (error) {
          logger.error('WebSocket authentication error:', error);
          socket.emit('authentication_error', 'Invalid token');
          socket.disconnect();
        }
      });
      
      // Subscribe to transcription job updates
      socket.on('subscribe_job', (jobId: string) => {
        socket.join(`job:${jobId}`);
        logger.info(`Socket ${socket.id} subscribed to job ${jobId}`);
      });
      
      // Unsubscribe from transcription job updates
      socket.on('unsubscribe_job', (jobId: string) => {
        socket.leave(`job:${jobId}`);
        logger.info(`Socket ${socket.id} unsubscribed from job ${jobId}`);
      });
      
      // Handle disconnect
      socket.on('disconnect', () => {
        logger.info(`WebSocket client disconnected: ${socket.id}`);
        
        // Remove from user sockets mapping
        for (const [userId, sockets] of this.userSockets.entries()) {
          if (sockets.has(socket.id)) {
            sockets.delete(socket.id);
            if (sockets.size === 0) {
              this.userSockets.delete(userId);
            }
            break;
          }
        }
      });
    });
  }
  
  // Send transcription progress update
  sendTranscriptionUpdate(update: TranscriptionUpdate): void {
    // Send to specific job room
    this.io.to(`job:${update.jobId}`).emit('transcription_update', {
      type: 'progress',
      jobId: update.jobId,
      progress: update.progress,
      status: update.status,
      message: update.message
    });
    
    // Send to user room
    this.io.to(`user:${update.userId}`).emit('transcription_update', {
      type: 'progress',
      jobId: update.jobId,
      progress: update.progress,
      status: update.status,
      message: update.message
    });
    
    logger.info(`Transcription update sent for job ${update.jobId}: ${update.progress}%`);
  }
  
  // Send transcription completion
  sendTranscriptionComplete(jobId: string, userId: string, data: any): void {
    const message = {
      type: 'complete',
      jobId,
      status: 'completed',
      data
    };
    
    this.io.to(`job:${jobId}`).emit('transcription_complete', message);
    this.io.to(`user:${userId}`).emit('transcription_complete', message);
    
    logger.info(`Transcription complete sent for job ${jobId}`);
  }
  
  // Send transcription error
  sendTranscriptionError(jobId: string, userId: string, error: string): void {
    const message = {
      type: 'error',
      jobId,
      status: 'failed',
      error
    };
    
    this.io.to(`job:${jobId}`).emit('transcription_error', message);
    this.io.to(`user:${userId}`).emit('transcription_error', message);
    
    logger.error(`Transcription error sent for job ${jobId}: ${error}`);
  }
  
  // Send notification to user
  sendNotification(userId: string, notification: any): void {
    this.io.to(`user:${userId}`).emit('notification', notification);
  }
  
  // Broadcast to all connected clients
  broadcast(event: string, data: any): void {
    this.io.emit(event, data);
  }
  
  // Get connected users count
  getConnectedUsersCount(): number {
    return this.userSockets.size;
  }
  
  // Check if user is connected
  isUserConnected(userId: string): boolean {
    return this.userSockets.has(userId);
  }
}