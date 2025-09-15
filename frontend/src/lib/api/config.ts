/**
 * API configuration and constants
 */

export const API_CONFIG = {
  // Backend Node.js API
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001',
  
  // AI Service Python API
  AI_SERVICE_URL: import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000',
  
  // WebSocket URL
  WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
  
  // Request timeout
  TIMEOUT: 30000,
  
  // File upload limits
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  ALLOWED_AUDIO_FORMATS: ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'],
  ALLOWED_MIDI_FORMATS: ['.mid', '.midi'],
};

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh',
    LOGOUT: '/api/auth/logout',
    VERIFY: '/api/auth/verify',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
  },
  
  // User endpoints
  USER: {
    PROFILE: '/api/users/profile',
    UPDATE_PROFILE: '/api/users/profile',
    CHANGE_PASSWORD: '/api/users/change-password',
    PREFERENCES: '/api/users/preferences',
  },
  
  // Score endpoints
  SCORES: {
    LIST: '/api/scores',
    GET: (id: string) => `/api/scores/${id}`,
    CREATE: '/api/scores',
    UPDATE: (id: string) => `/api/scores/${id}`,
    DELETE: (id: string) => `/api/scores/${id}`,
    SHARE: (id: string) => `/api/scores/${id}/share`,
    STATISTICS: '/api/scores/statistics',
  },
  
  // YouTube/Transcription endpoints
  YOUTUBE: {
    VALIDATE: '/api/youtube/validate',
    TRANSCRIBE: '/api/youtube/transcribe',
    UPLOAD: '/api/youtube/upload',
    JOB: (jobId: string) => `/api/youtube/jobs/${jobId}`,
    HISTORY: '/api/youtube/history',
  },
  
  // Practice endpoints
  PRACTICE: {
    START_SESSION: '/api/practice/sessions/start',
    END_SESSION: (id: string) => `/api/practice/sessions/${id}/end`,
    UPDATE_PROGRESS: (id: string) => `/api/practice/sessions/${id}/progress`,
    GET_SESSION: (id: string) => `/api/practice/sessions/${id}`,
    LIST_SESSIONS: '/api/practice/sessions',
    STATISTICS: '/api/practice/statistics',
    SCORE_STATS: (scoreId: string) => `/api/practice/statistics/score/${scoreId}`,
    LEADERBOARD: '/api/practice/leaderboard',
  },
  
  // AI Service endpoints
  AI: {
    HEALTH: '/api/health',
    TRANSCRIBE_YOUTUBE: '/api/transcription/youtube',
    TRANSCRIBE_UPLOAD: '/api/transcription/upload',
    JOB_STATUS: (jobId: string) => `/api/transcription/job/${jobId}`,
    ANALYZE_STYLE: '/api/analysis/style',
    GENERATE_TAB: '/api/analysis/tab',
    GENERATE_MUSICXML: '/api/analysis/musicxml',
    GUITAR_STYLES: '/api/analysis/styles',
    TECHNIQUES: '/api/analysis/techniques',
  },
};

export const WS_EVENTS = {
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  
  // Transcription events
  TRANSCRIPTION_PROGRESS: 'transcription:progress',
  TRANSCRIPTION_COMPLETE: 'transcription:complete',
  TRANSCRIPTION_ERROR: 'transcription:error',
  
  // Practice events
  PRACTICE_UPDATE: 'practice:update',
  PRACTICE_MILESTONE: 'practice:milestone',
  
  // Real-time collaboration
  SCORE_UPDATE: 'score:update',
  USER_JOIN: 'user:join',
  USER_LEAVE: 'user:leave',
};