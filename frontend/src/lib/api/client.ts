/**
 * HTTP client for API communication
 */
import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { API_CONFIG } from './config';
import { authStore } from '$lib/stores/auth.store';
import { get } from 'svelte/store';

class ApiClient {
  private backendClient: AxiosInstance;
  private aiClient: AxiosInstance;
  
  constructor() {
    // Backend Node.js client
    this.backendClient = axios.create({
      baseURL: API_CONFIG.BACKEND_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // For cookies
    });
    
    // AI Service Python client
    this.aiClient = axios.create({
      baseURL: API_CONFIG.AI_SERVICE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    this.setupInterceptors();
  }
  
  private setupInterceptors() {
    // Request interceptor for auth token
    this.backendClient.interceptors.request.use(
      (config) => {
        const auth = get(authStore);
        if (auth.accessToken) {
          config.headers.Authorization = `Bearer ${auth.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Response interceptor for token refresh
    this.backendClient.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            // Try to refresh token
            const auth = get(authStore);
            if (auth.refreshToken) {
              const response = await this.backendClient.post('/api/auth/refresh', {
                refreshToken: auth.refreshToken,
              });
              
              const { accessToken, refreshToken } = response.data.tokens;
              authStore.updateTokens(accessToken, refreshToken);
              
              // Retry original request
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              }
              return this.backendClient(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, logout user
            authStore.logout();
            window.location.href = '/login';
          }
        }
        
        return Promise.reject(error);
      }
    );
    
    // AI client interceptor for auth
    this.aiClient.interceptors.request.use(
      (config) => {
        const auth = get(authStore);
        if (auth.accessToken) {
          config.headers.Authorization = `Bearer ${auth.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }
  
  // Backend API methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.backendClient.get<T>(url, config);
    return response.data;
  }
  
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.backendClient.post<T>(url, data, config);
    return response.data;
  }
  
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.backendClient.put<T>(url, data, config);
    return response.data;
  }
  
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.backendClient.delete<T>(url, config);
    return response.data;
  }
  
  // AI Service methods
  async getAI<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.aiClient.get<T>(url, config);
    return response.data;
  }
  
  async postAI<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.aiClient.post<T>(url, data, config);
    return response.data;
  }
  
  // File upload method
  async uploadFile<T>(url: string, file: File, additionalData?: Record<string, any>): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }
    
    const response = await this.backendClient.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  }
  
  // AI Service file upload
  async uploadFileAI<T>(url: string, file: File, additionalData?: Record<string, any>): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }
    
    const response = await this.aiClient.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  }
}

export const apiClient = new ApiClient();