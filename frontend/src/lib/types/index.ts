/**
 * Shared TypeScript types
 */

// User types
export interface User {
  id: string;
  email: string;
  username: string;
  profilePicture?: string;
  bio?: string;
  role: 'USER' | 'PREMIUM' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

// Score types
export interface Score {
  id: string;
  title: string;
  artist?: string;
  genre?: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PROFESSIONAL';
  tempo?: number;
  key?: string;
  timeSignature?: string;
  duration?: number;
  tabData?: any;
  musicXml?: string;
  midiData?: any;
  audioUrl?: string;
  thumbnailUrl?: string;
  isPublic: boolean;
  userId: string;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

// 업로드 관련 타입
export interface UploadStatus {
  status: 'idle' | 'uploading' | 'completed' | 'error';
  message?: string;
  error?: string;
}

// 전사 작업 관련 타입
export interface TranscriptionJob {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: Date;
  completedAt?: Date;
  result?: TranscriptionResult;
  error?: string;
}

export interface TranscriptionResult {
  success: boolean;
  midiUrl?: string;
  audioUrl?: string;
  duration: number;
  noteCount: number;
  confidence: number;
  metadata?: {
    title?: string;
    artist?: string;
    tempo: number;
    key: string;
    timeSignature: string;
  };
}

// 분석 관련 타입
export interface AnalysisResult {
  type: 'style' | 'technique' | 'accuracy';
  timestamp: number;
  data: any;
  confidence: number;
  message?: string;
  error?: string;
}

export interface StyleAnalysis {
  primaryStyle: string;
  confidence: number;
  matchedLegends: LegendMatch[];
  techniques: DetectedTechnique[];
  recommendations: string[];
}

export interface LegendMatch {
  name: string;
  similarity: number;
  characteristics: string[];
}

export interface DetectedTechnique {
  name: string;
  timestamp: number;
  duration: number;
  confidence: number;
}

// 음악 데이터 타입
export interface MusicData {
  title?: string;
  artist?: string;
  tempo: number;
  key: string;
  timeSignature: string;
  duration: number;
  measures: Measure[];
  tracks: Track[];
}

export interface Measure {
  number: number;
  notes: Note[];
  tempo?: number;
  timeSignature?: string;
}

export interface Note {
  pitch: number;
  duration: number;
  velocity: number;
  startTime: number;
  string?: number;
  fret?: number;
  techniques?: string[];
}

export interface Track {
  id: string;
  name: string;
  instrument: string;
  channel: number;
  notes: Note[];
}

// 재생 관련 타입
export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  tempo: number;
  loop?: {
    start: number;
    end: number;
    enabled: boolean;
  };
}

// 렌더링 관련 타입
export interface RenderOptions {
  showNotation: boolean;
  showTabs: boolean;
  showLyrics: boolean;
  showChords: boolean;
  zoom: number;
  pageLayout: 'single' | 'continuous' | 'horizontal';
}

export interface NotationData {
  svg?: string;
  vexflow?: any;
  alphatab?: any;
  pdf?: Blob;
}

// 실시간 피드백 타입
export interface RealtimeFeedback {
  pitch: {
    detected: number;
    expected: number;
    accuracy: number;
    cents: number;
  };
  timing: {
    offset: number;
    accuracy: number;
    classification: 'early' | 'onTime' | 'late';
  };
  technique?: {
    expected: string;
    detected: string;
    confidence: number;
  };
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// 파일 타입 검증
export const ALLOWED_AUDIO_TYPES = [
  'audio/mp3',
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/m4a',
  'audio/x-m4a',
  'audio/ogg',
  'audio/flac'
];

export const ALLOWED_MIDI_TYPES = [
  'audio/midi',
  'audio/x-midi',
  'application/x-midi'
];

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

// 유틸리티 함수
export function isValidAudioFile(file: File): boolean {
  return ALLOWED_AUDIO_TYPES.includes(file.type) || 
         file.name.toLowerCase().endsWith('.mp3') ||
         file.name.toLowerCase().endsWith('.wav') ||
         file.name.toLowerCase().endsWith('.m4a');
}

export function isValidMidiFile(file: File): boolean {
  return ALLOWED_MIDI_TYPES.includes(file.type) ||
         file.name.toLowerCase().endsWith('.mid') ||
         file.name.toLowerCase().endsWith('.midi');
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}