/**
 * WebSocket client for real-time communication
 */
import { io, Socket } from 'socket.io-client';
import { API_CONFIG, WS_EVENTS } from './config';
import { authStore } from '$lib/stores/auth.store';
import { get } from 'svelte/store';

export interface TranscriptionProgress {
  jobId: string;
  progress: number;
  status: string;
  message: string;
}

export interface TranscriptionComplete {
  jobId: string;
  transcriptionId: string;
  result: any;
}

class WebSocketClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();
  
  connect(): void {
    if (this.socket?.connected) {
      return;
    }
    
    const auth = get(authStore);
    
    this.socket = io(API_CONFIG.WS_URL, {
      transports: ['websocket'],
      auth: {
        token: auth.accessToken,
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    this.setupEventHandlers();
  }
  
  private setupEventHandlers(): void {
    if (!this.socket) return;
    
    // Connection events
    this.socket.on(WS_EVENTS.CONNECT, () => {
      console.log('WebSocket connected');
      this.emit('connected', true);
    });
    
    this.socket.on(WS_EVENTS.DISCONNECT, () => {
      console.log('WebSocket disconnected');
      this.emit('connected', false);
    });
    
    this.socket.on(WS_EVENTS.ERROR, (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    });
    
    // Transcription events
    this.socket.on(WS_EVENTS.TRANSCRIPTION_PROGRESS, (data: TranscriptionProgress) => {
      this.emit('transcription:progress', data);
    });
    
    this.socket.on(WS_EVENTS.TRANSCRIPTION_COMPLETE, (data: TranscriptionComplete) => {
      this.emit('transcription:complete', data);
    });
    
    this.socket.on(WS_EVENTS.TRANSCRIPTION_ERROR, (data) => {
      this.emit('transcription:error', data);
    });
    
    // Practice events
    this.socket.on(WS_EVENTS.PRACTICE_UPDATE, (data) => {
      this.emit('practice:update', data);
    });
    
    this.socket.on(WS_EVENTS.PRACTICE_MILESTONE, (data) => {
      this.emit('practice:milestone', data);
    });
    
    // Collaboration events
    this.socket.on(WS_EVENTS.SCORE_UPDATE, (data) => {
      this.emit('score:update', data);
    });
    
    this.socket.on(WS_EVENTS.USER_JOIN, (data) => {
      this.emit('user:join', data);
    });
    
    this.socket.on(WS_EVENTS.USER_LEAVE, (data) => {
      this.emit('user:leave', data);
    });
  }
  
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
  
  // Subscribe to transcription job updates
  subscribeToJob(jobId: string): void {
    if (!this.socket) {
      this.connect();
    }
    
    this.socket?.emit('subscribe:job', { jobId });
  }
  
  unsubscribeFromJob(jobId: string): void {
    this.socket?.emit('unsubscribe:job', { jobId });
  }
  
  // Subscribe to practice session updates
  subscribeToPracticeSession(sessionId: string): void {
    if (!this.socket) {
      this.connect();
    }
    
    this.socket?.emit('subscribe:practice', { sessionId });
  }
  
  unsubscribeFromPracticeSession(sessionId: string): void {
    this.socket?.emit('unsubscribe:practice', { sessionId });
  }
  
  // Join score collaboration room
  joinScoreRoom(scoreId: string): void {
    if (!this.socket) {
      this.connect();
    }
    
    this.socket?.emit('join:score', { scoreId });
  }
  
  leaveScoreRoom(scoreId: string): void {
    this.socket?.emit('leave:score', { scoreId });
  }
  
  // Send practice progress update
  sendPracticeProgress(sessionId: string, progress: any): void {
    this.socket?.emit('practice:progress', { sessionId, progress });
  }
  
  // Event emitter pattern for components
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }
  
  off(event: string, callback: Function): void {
    this.listeners.get(event)?.delete(callback);
  }
  
  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }
  
  // Check connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
  
  // Reconnect manually
  reconnect(): void {
    if (!this.isConnected()) {
      this.connect();
    }
  }
}

export const wsClient = new WebSocketClient();