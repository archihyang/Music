/**
 * API Service
 * Centralized API communication layer
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { writable, derived, get } from 'svelte/store';
import { errorHandler } from '$lib/utils/errorHandler';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000';

// Request timeout (ms)
const REQUEST_TIMEOUT = 30000;

// Auth token store
export const authToken = writable<string | null>(
  typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
);

// Subscribe to auth token changes
if (typeof window !== 'undefined') {
  authToken.subscribe(token => {
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  });
}

// User store
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  preferences?: {
    instrument?: string;
    difficulty?: string;
    theme?: string;
  };
  subscription?: {
    plan: 'free' | 'pro' | 'enterprise';
    expiresAt?: Date;
  };
}

export const currentUser = writable<User | null>(null);

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Request interceptor for auth
function createApiClient(baseURL: string): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout: REQUEST_TIMEOUT,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Request interceptor
  client.interceptors.request.use(
    (config) => {
      const token = get(authToken);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        // Token expired or invalid
        authToken.set(null);
        currentUser.set(null);
        
        // Redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
      
      return Promise.reject(error);
    }
  );

  return client;
}

// API Clients
const apiClient = createApiClient(API_BASE_URL);
const aiClient = createApiClient(AI_SERVICE_URL);

// API Service Class
class ApiService {
  private static instance: ApiService;
  
  private constructor() {}
  
  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  // Authentication
  async login(email: string, password: string): Promise<User> {
    try {
      const response = await apiClient.post<ApiResponse<{ user: User; token: string }>>(
        '/auth/login',
        { email, password }
      );
      
      if (response.data.success && response.data.data) {
        const { user, token } = response.data.data;
        authToken.set(token);
        currentUser.set(user);
        return user;
      }
      
      throw new Error(response.data.error || 'Login failed');
    } catch (error) {
      errorHandler.logError(error as Error, 'high', { context: 'Login' });
      throw error;
    }
  }

  async register(email: string, password: string, name: string): Promise<User> {
    try {
      const response = await apiClient.post<ApiResponse<{ user: User; token: string }>>(
        '/auth/register',
        { email, password, name }
      );
      
      if (response.data.success && response.data.data) {
        const { user, token } = response.data.data;
        authToken.set(token);
        currentUser.set(user);
        return user;
      }
      
      throw new Error(response.data.error || 'Registration failed');
    } catch (error) {
      errorHandler.logError(error as Error, 'high', { context: 'Registration' });
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      authToken.set(null);
      currentUser.set(null);
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiClient.get<ApiResponse<User>>('/auth/me');
      
      if (response.data.success && response.data.data) {
        currentUser.set(response.data.data);
        return response.data.data;
      }
      
      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  // Scores
  async getScores(params?: {
    page?: number;
    pageSize?: number;
    genre?: string;
    artist?: string;
  }): Promise<PaginatedResponse<any>> {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedResponse<any>>>(
        '/scores',
        { params }
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.error || 'Failed to fetch scores');
    } catch (error) {
      errorHandler.logError(error as Error, 'medium', { context: 'Fetching scores' });
      throw error;
    }
  }

  async getScore(id: string): Promise<any> {
    try {
      const response = await apiClient.get<ApiResponse<any>>(`/scores/${id}`);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.error || 'Failed to fetch score');
    } catch (error) {
      errorHandler.logError(error as Error, 'medium', { context: 'Fetching score', id });
      throw error;
    }
  }

  async saveScore(score: any): Promise<any> {
    try {
      const response = await apiClient.post<ApiResponse<any>>('/scores', score);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.error || 'Failed to save score');
    } catch (error) {
      errorHandler.logError(error as Error, 'high', { context: 'Saving score' });
      throw error;
    }
  }

  async updateScore(id: string, updates: any): Promise<any> {
    try {
      const response = await apiClient.patch<ApiResponse<any>>(
        `/scores/${id}`,
        updates
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.error || 'Failed to update score');
    } catch (error) {
      errorHandler.logError(error as Error, 'medium', { context: 'Updating score', id });
      throw error;
    }
  }

  async deleteScore(id: string): Promise<void> {
    try {
      await apiClient.delete(`/scores/${id}`);
    } catch (error) {
      errorHandler.logError(error as Error, 'medium', { context: 'Deleting score', id });
      throw error;
    }
  }

  // Transcription
  async startTranscription(data: FormData): Promise<string> {
    try {
      const response = await aiClient.post<{ job_id: string }>(
        '/transcribe',
        data,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      return response.data.job_id;
    } catch (error) {
      errorHandler.logError(error as Error, 'high', { context: 'Starting transcription' });
      throw error;
    }
  }

  async getTranscriptionStatus(jobId: string): Promise<any> {
    try {
      const response = await aiClient.get(`/transcribe/${jobId}`);
      return response.data;
    } catch (error) {
      errorHandler.logError(error as Error, 'medium', { context: 'Getting transcription status', jobId });
      throw error;
    }
  }

  // YouTube
  async getYouTubeInfo(videoId: string): Promise<any> {
    try {
      const response = await apiClient.get<ApiResponse<any>>(
        `/youtube/info/${videoId}`
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.error || 'Failed to fetch video info');
    } catch (error) {
      errorHandler.logError(error as Error, 'medium', { context: 'Fetching YouTube info', videoId });
      throw error;
    }
  }

  async downloadYouTubeAudio(videoId: string): Promise<Blob> {
    try {
      const response = await apiClient.get(
        `/youtube/download/${videoId}`,
        { responseType: 'blob' }
      );
      
      return response.data;
    } catch (error) {
      errorHandler.logError(error as Error, 'high', { context: 'Downloading YouTube audio', videoId });
      throw error;
    }
  }

  // Practice Sessions
  async getPracticeSessions(params?: {
    page?: number;
    pageSize?: number;
    scoreId?: string;
  }): Promise<PaginatedResponse<any>> {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedResponse<any>>>(
        '/practice/sessions',
        { params }
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.error || 'Failed to fetch practice sessions');
    } catch (error) {
      errorHandler.logError(error as Error, 'medium', { context: 'Fetching practice sessions' });
      throw error;
    }
  }

  async startPracticeSession(scoreId: string): Promise<any> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(
        '/practice/sessions',
        { scoreId }
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.error || 'Failed to start practice session');
    } catch (error) {
      errorHandler.logError(error as Error, 'high', { context: 'Starting practice session', scoreId });
      throw error;
    }
  }

  async endPracticeSession(sessionId: string, data: any): Promise<any> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(
        `/practice/sessions/${sessionId}/end`,
        data
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.error || 'Failed to end practice session');
    } catch (error) {
      errorHandler.logError(error as Error, 'high', { context: 'Ending practice session', sessionId });
      throw error;
    }
  }

  async getPracticeStats(): Promise<any> {
    try {
      const response = await apiClient.get<ApiResponse<any>>('/practice/stats');
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.error || 'Failed to fetch practice stats');
    } catch (error) {
      errorHandler.logError(error as Error, 'medium', { context: 'Fetching practice stats' });
      throw error;
    }
  }

  // Style Analysis
  async analyzeStyle(scoreId: string, guitarist: string): Promise<any> {
    try {
      const response = await aiClient.post<any>(
        '/analyze-style',
        { scoreId, guitarist }
      );
      
      return response.data;
    } catch (error) {
      errorHandler.logError(error as Error, 'medium', { context: 'Analyzing style', scoreId, guitarist });
      throw error;
    }
  }

  // File Upload
  async uploadFile(file: File, type: 'audio' | 'midi' | 'score'): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      const response = await apiClient.post<ApiResponse<{ url: string }>>(
        '/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data.url;
      }
      
      throw new Error(response.data.error || 'Failed to upload file');
    } catch (error) {
      errorHandler.logError(error as Error, 'high', { context: 'Uploading file', fileName: file.name });
      throw error;
    }
  }

  // Health Check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await apiClient.get('/health');
      return response.status === 200;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const apiService = ApiService.getInstance();

// Derived store for authentication status
export const isAuthenticated = derived(
  authToken,
  $token => !!$token
);

// Initialize user on load
if (typeof window !== 'undefined') {
  const token = get(authToken);
  if (token) {
    apiService.getCurrentUser().catch(console.error);
  }
}