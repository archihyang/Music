/**
 * Transcription service for YouTube and file uploads
 */
import { apiClient } from '$lib/api/client';
import { API_ENDPOINTS, API_CONFIG } from '$lib/api/config';
import { wsClient } from '$lib/api/websocket';
import { v4 as uuidv4 } from 'uuid';

export interface YouTubeVideoInfo {
  videoId: string;
  title: string;
  author: string;
  duration: number;
  thumbnailUrl: string;
  description?: string;
}

export interface TranscriptionJob {
  jobId: string;
  transcriptionId: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  message: string;
  progress?: number;
  result?: TranscriptionResult;
}

export interface TranscriptionResult {
  notes: Note[];
  tempo: number;
  key: string;
  timeSignature: string;
  tabData: TabData;
  styleAnalysis: StyleAnalysis;
  outputFiles: {
    midi?: string;
    musicxml?: string;
    tab?: string;
    metadata?: string;
  };
}

export interface Note {
  pitch: number;
  startTime: number;
  endTime: number;
  duration: number;
  velocity: number;
  noteName: string;
  instrument: string;
}

export interface TabData {
  tuning: number[];
  capo: number;
  measures: any[];
  strings: any[][];
}

export interface StyleAnalysis {
  features: Record<string, number>;
  styleMatches: StyleMatch[];
  techniques: string[];
  musicalAnalysis: {
    tempo: number;
    keySignature: string;
    timeSignature: string;
    pitchRange: number;
    averagePitch: number;
    totalDuration: number;
    noteCount: number;
  };
  recommendations: string[];
}

export interface StyleMatch {
  style: string;
  similarity: number;
  confidence: string;
}

export interface TranscriptionHistory {
  id: string;
  sourceType: 'YOUTUBE' | 'UPLOAD';
  sourceUrl?: string;
  sourceFilename?: string;
  status: string;
  progress: number;
  duration?: number;
  createdAt: string;
  completedAt?: string;
  score?: any;
}

class TranscriptionService {
  /**
   * Validate YouTube URL and get video info
   */
  async validateYouTubeUrl(url: string): Promise<YouTubeVideoInfo> {
    try {
      const response = await apiClient.post<{ success: boolean; data: YouTubeVideoInfo }>(
        API_ENDPOINTS.YOUTUBE.VALIDATE,
        { url }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to validate YouTube URL:', error);
      throw error;
    }
  }
  
  /**
   * Start YouTube video transcription
   */
  async transcribeYouTube(
    url: string,
    userId: string,
    options?: {
      instrument?: string;
      difficulty?: string;
      style?: string;
    }
  ): Promise<TranscriptionJob> {
    try {
      const jobId = uuidv4();
      const transcriptionId = uuidv4();
      
      // Start transcription via backend
      const response = await apiClient.post<any>(
        API_ENDPOINTS.YOUTUBE.TRANSCRIBE,
        {
          url,
          instrument: options?.instrument || 'guitar',
          difficulty: options?.difficulty || 'INTERMEDIATE',
          style: options?.style,
        }
      );
      
      // Also notify AI service
      await apiClient.postAI(
        API_ENDPOINTS.AI.TRANSCRIBE_YOUTUBE,
        {
          url,
          job_id: jobId,
          transcription_id: transcriptionId,
          user_id: userId,
          ...options,
        }
      );
      
      // Subscribe to WebSocket updates
      wsClient.subscribeToJob(jobId);
      
      return {
        jobId,
        transcriptionId,
        status: 'QUEUED',
        message: 'Transcription job started',
      };
    } catch (error) {
      console.error('Failed to start YouTube transcription:', error);
      throw error;
    }
  }
  
  /**
   * Transcribe uploaded audio file
   */
  async transcribeFile(
    file: File,
    userId: string,
    options?: {
      instrument?: string;
      difficulty?: string;
      style?: string;
    }
  ): Promise<TranscriptionJob> {
    try {
      // Validate file
      if (!this.validateAudioFile(file)) {
        throw new Error('Invalid audio file format');
      }
      
      const jobId = uuidv4();
      const transcriptionId = uuidv4();
      
      // Upload to AI service
      const response = await apiClient.uploadFileAI<any>(
        API_ENDPOINTS.AI.TRANSCRIBE_UPLOAD,
        file,
        {
          job_id: jobId,
          transcription_id: transcriptionId,
          user_id: userId,
          ...options,
        }
      );
      
      // Subscribe to WebSocket updates
      wsClient.subscribeToJob(jobId);
      
      return {
        jobId,
        transcriptionId,
        status: 'QUEUED',
        message: 'File transcription job started',
      };
    } catch (error) {
      console.error('Failed to transcribe file:', error);
      throw error;
    }
  }
  
  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<TranscriptionJob> {
    try {
      const response = await apiClient.get<any>(
        API_ENDPOINTS.YOUTUBE.JOB(jobId)
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get job status:', error);
      throw error;
    }
  }
  
  /**
   * Cancel transcription job
   */
  async cancelJob(jobId: string): Promise<void> {
    try {
      await apiClient.delete(API_ENDPOINTS.YOUTUBE.JOB(jobId));
      wsClient.unsubscribeFromJob(jobId);
    } catch (error) {
      console.error('Failed to cancel job:', error);
      throw error;
    }
  }
  
  /**
   * Get user's transcription history
   */
  async getTranscriptionHistory(limit: number = 20): Promise<TranscriptionHistory[]> {
    try {
      const response = await apiClient.get<any>(
        API_ENDPOINTS.YOUTUBE.HISTORY,
        { params: { limit } }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get transcription history:', error);
      throw error;
    }
  }
  
  /**
   * Get available guitar styles
   */
  async getGuitarStyles(): Promise<Array<{ id: string; name: string; description: string }>> {
    try {
      const response = await apiClient.getAI<any>(
        API_ENDPOINTS.AI.GUITAR_STYLES
      );
      return response.styles;
    } catch (error) {
      console.error('Failed to get guitar styles:', error);
      throw error;
    }
  }
  
  /**
   * Get detectable techniques
   */
  async getTechniques(): Promise<Array<{ id: string; name: string; description: string }>> {
    try {
      const response = await apiClient.getAI<any>(
        API_ENDPOINTS.AI.TECHNIQUES
      );
      return response.techniques;
    } catch (error) {
      console.error('Failed to get techniques:', error);
      throw error;
    }
  }
  
  /**
   * Validate audio file
   */
  private validateAudioFile(file: File): boolean {
    // Check file size
    if (file.size > API_CONFIG.MAX_FILE_SIZE) {
      return false;
    }
    
    // Check file extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    return API_CONFIG.ALLOWED_AUDIO_FORMATS.includes(extension);
  }
  
  /**
   * Download transcription result
   */
  async downloadResult(jobId: string, format: 'midi' | 'musicxml' | 'tab' | 'pdf'): Promise<Blob> {
    try {
      const response = await apiClient.get<Blob>(
        `/api/transcription/download/${jobId}/${format}`,
        { responseType: 'blob' }
      );
      return response;
    } catch (error) {
      console.error('Failed to download result:', error);
      throw error;
    }
  }
}

export const transcriptionService = new TranscriptionService();