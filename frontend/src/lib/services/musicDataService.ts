/**
 * Music Data Service
 * 실제 음악 데이터 관리 및 API 연동
 */

import axios from 'axios';
import { writable, derived } from 'svelte/store';
import { errorHandler } from '$lib/utils/errorHandler';

// API 엔드포인트
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000';

// 음악 데이터 타입 정의
export interface MusicScore {
  id: string;
  title: string;
  artist?: string;
  composer?: string;
  genre?: string;
  keySignature: string;
  timeSignature: string;
  tempo: number;
  measures: Measure[];
  tabData?: TabMeasure[];
  audioUrl?: string;
  midiUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Measure {
  index: number;
  notes: Note[];
  dynamics?: string;
  tempo?: number;
  timeSignature?: string;
  keySignature?: string;
}

export interface Note {
  keys: string[];
  duration: string;
  dots?: number;
  accidentals?: string[];
  articulations?: string[];
  lyrics?: string;
}

export interface TabMeasure {
  index: number;
  notes: TabNote[];
}

export interface TabNote {
  positions: TabPosition[];
  duration: string;
  technique?: 'hammer' | 'pull' | 'slide' | 'bend' | 'vibrato' | 'tap';
}

export interface TabPosition {
  str: number;  // String number (1-6 for guitar)
  fret: number; // Fret number
}

export interface TranscriptionRequest {
  source: 'youtube' | 'file' | 'url';
  url?: string;
  file?: File;
  options?: {
    instrument?: 'guitar' | 'bass' | 'piano' | 'drums';
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    includeTab?: boolean;
    includeMidi?: boolean;
    style?: string; // e.g., "Hendrix", "Page", "Clapton"
  };
}

export interface TranscriptionResult {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  score?: MusicScore;
  error?: string;
  processingTime?: number;
}

// Store for current music scores
function createMusicStore() {
  const { subscribe, set, update } = writable<MusicScore[]>([]);
  
  return {
    subscribe,
    set,
    add: (score: MusicScore) => update(scores => [...scores, score]),
    remove: (id: string) => update(scores => scores.filter(s => s.id !== id)),
    update: (id: string, updates: Partial<MusicScore>) => {
      update(scores => scores.map(s => s.id === id ? { ...s, ...updates } : s));
    },
    clear: () => set([])
  };
}

export const musicScores = createMusicStore();

// Store for current transcription jobs
function createTranscriptionStore() {
  const { subscribe, set, update } = writable<Map<string, TranscriptionResult>>(new Map());
  
  return {
    subscribe,
    add: (result: TranscriptionResult) => {
      update(jobs => {
        jobs.set(result.id, result);
        return new Map(jobs);
      });
    },
    update: (id: string, updates: Partial<TranscriptionResult>) => {
      update(jobs => {
        const job = jobs.get(id);
        if (job) {
          jobs.set(id, { ...job, ...updates });
        }
        return new Map(jobs);
      });
    },
    remove: (id: string) => {
      update(jobs => {
        jobs.delete(id);
        return new Map(jobs);
      });
    },
    clear: () => set(new Map())
  };
}

export const transcriptionJobs = createTranscriptionStore();

// Derived store for active jobs
export const activeJobs = derived(
  transcriptionJobs,
  $jobs => Array.from($jobs.values()).filter(job => 
    job.status === 'pending' || job.status === 'processing'
  )
);

// Music Data Service Class
class MusicDataService {
  private static instance: MusicDataService;
  private ws: WebSocket | null = null;
  
  private constructor() {}
  
  static getInstance(): MusicDataService {
    if (!MusicDataService.instance) {
      MusicDataService.instance = new MusicDataService();
    }
    return MusicDataService.instance;
  }
  
  /**
   * Initialize WebSocket connection for real-time updates
   */
  async initWebSocket() {
    const wsUrl = API_BASE_URL.replace('http', 'ws').replace('/api', '/ws');
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
      };
      
      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleWebSocketMessage(data);
      };
      
      this.ws.onerror = (error) => {
        errorHandler.logError('WebSocket error', 'medium', error);
      };
      
      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        // Attempt to reconnect after 5 seconds
        setTimeout(() => this.initWebSocket(), 5000);
      };
    } catch (error) {
      errorHandler.logError(error as Error, 'medium', { context: 'WebSocket initialization' });
    }
  }
  
  /**
   * Handle WebSocket messages
   */
  private handleWebSocketMessage(data: any) {
    switch (data.type) {
      case 'transcription_progress':
        transcriptionJobs.update(data.id, { progress: data.progress });
        break;
        
      case 'transcription_complete':
        transcriptionJobs.update(data.id, {
          status: 'completed',
          progress: 100,
          score: data.score
        });
        if (data.score) {
          musicScores.add(data.score);
        }
        break;
        
      case 'transcription_error':
        transcriptionJobs.update(data.id, {
          status: 'failed',
          error: data.error
        });
        break;
    }
  }
  
  /**
   * Start a new transcription job
   */
  async startTranscription(request: TranscriptionRequest): Promise<string> {
    try {
      const formData = new FormData();
      
      if (request.source === 'youtube' && request.url) {
        formData.append('source', 'youtube');
        formData.append('url', request.url);
      } else if (request.source === 'file' && request.file) {
        formData.append('source', 'file');
        formData.append('file', request.file);
      } else if (request.source === 'url' && request.url) {
        formData.append('source', 'url');
        formData.append('url', request.url);
      }
      
      if (request.options) {
        formData.append('options', JSON.stringify(request.options));
      }
      
      const response = await axios.post(`${AI_SERVICE_URL}/transcribe`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const jobId = response.data.job_id;
      
      // Add to jobs store
      transcriptionJobs.add({
        id: jobId,
        status: 'pending',
        progress: 0
      });
      
      return jobId;
    } catch (error) {
      errorHandler.logError(
        error as Error,
        'high',
        { context: 'Starting transcription', request }
      );
      throw error;
    }
  }
  
  /**
   * Get transcription job status
   */
  async getJobStatus(jobId: string): Promise<TranscriptionResult> {
    try {
      const response = await axios.get(`${AI_SERVICE_URL}/transcribe/${jobId}`);
      return response.data;
    } catch (error) {
      errorHandler.logError(
        error as Error,
        'medium',
        { context: 'Getting job status', jobId }
      );
      throw error;
    }
  }
  
  /**
   * Fetch music score by ID
   */
  async getScore(scoreId: string): Promise<MusicScore> {
    try {
      const response = await axios.get(`${API_BASE_URL}/scores/${scoreId}`);
      return response.data;
    } catch (error) {
      errorHandler.logError(
        error as Error,
        'medium',
        { context: 'Fetching score', scoreId }
      );
      throw error;
    }
  }
  
  /**
   * Save music score
   */
  async saveScore(score: MusicScore): Promise<MusicScore> {
    try {
      const response = await axios.post(`${API_BASE_URL}/scores`, score);
      const savedScore = response.data;
      musicScores.add(savedScore);
      return savedScore;
    } catch (error) {
      errorHandler.logError(
        error as Error,
        'high',
        { context: 'Saving score', score }
      );
      throw error;
    }
  }
  
  /**
   * Update music score
   */
  async updateScore(scoreId: string, updates: Partial<MusicScore>): Promise<MusicScore> {
    try {
      const response = await axios.patch(`${API_BASE_URL}/scores/${scoreId}`, updates);
      const updatedScore = response.data;
      musicScores.update(scoreId, updatedScore);
      return updatedScore;
    } catch (error) {
      errorHandler.logError(
        error as Error,
        'medium',
        { context: 'Updating score', scoreId, updates }
      );
      throw error;
    }
  }
  
  /**
   * Delete music score
   */
  async deleteScore(scoreId: string): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/scores/${scoreId}`);
      musicScores.remove(scoreId);
    } catch (error) {
      errorHandler.logError(
        error as Error,
        'medium',
        { context: 'Deleting score', scoreId }
      );
      throw error;
    }
  }
  
  /**
   * List user's scores
   */
  async listScores(filters?: {
    genre?: string;
    artist?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<MusicScore[]> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value.toString());
        });
      }
      
      const response = await axios.get(`${API_BASE_URL}/scores?${params}`);
      const scores = response.data;
      musicScores.set(scores);
      return scores;
    } catch (error) {
      errorHandler.logError(
        error as Error,
        'medium',
        { context: 'Listing scores', filters }
      );
      throw error;
    }
  }
  
  /**
   * Convert MIDI to Score
   */
  async midiToScore(midiFile: File): Promise<MusicScore> {
    try {
      const formData = new FormData();
      formData.append('midi', midiFile);
      
      const response = await axios.post(`${AI_SERVICE_URL}/midi-to-score`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      errorHandler.logError(
        error as Error,
        'high',
        { context: 'Converting MIDI to score' }
      );
      throw error;
    }
  }
  
  /**
   * Export score to MIDI
   */
  async scoreToMidi(score: MusicScore): Promise<Blob> {
    try {
      const response = await axios.post(
        `${AI_SERVICE_URL}/score-to-midi`,
        score,
        { responseType: 'blob' }
      );
      
      return response.data;
    } catch (error) {
      errorHandler.logError(
        error as Error,
        'medium',
        { context: 'Converting score to MIDI' }
      );
      throw error;
    }
  }
  
  /**
   * Export score to PDF
   */
  async scoreToPdf(score: MusicScore): Promise<Blob> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/export/pdf`,
        score,
        { responseType: 'blob' }
      );
      
      return response.data;
    } catch (error) {
      errorHandler.logError(
        error as Error,
        'medium',
        { context: 'Exporting score to PDF' }
      );
      throw error;
    }
  }
  
  /**
   * Analyze guitarist style
   */
  async analyzeStyle(scoreId: string, guitarist: string): Promise<{
    similarity: number;
    techniques: string[];
    recommendations: string[];
  }> {
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/analyze-style`, {
        scoreId,
        guitarist
      });
      
      return response.data;
    } catch (error) {
      errorHandler.logError(
        error as Error,
        'medium',
        { context: 'Analyzing style', scoreId, guitarist }
      );
      throw error;
    }
  }
  
  /**
   * Cleanup resources
   */
  destroy() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Export singleton instance
export const musicDataService = MusicDataService.getInstance();

// Initialize WebSocket on module load
if (typeof window !== 'undefined') {
  musicDataService.initWebSocket();
}