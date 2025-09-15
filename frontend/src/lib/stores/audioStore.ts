import { writable, derived } from 'svelte/store';
import type { 
  UploadStatus, 
  AnalysisResult, 
  TranscriptionJob,
  MusicData,
  PlaybackState 
} from '$lib/types';

// Upload 관련 스토어
export const uploadProgress = writable<number>(0);
export const uploadStatus = writable<UploadStatus | null>(null);
export const currentFile = writable<File | null>(null);

// Transcription 관련 스토어
export const transcriptionJob = writable<TranscriptionJob | null>(null);
export const transcriptionProgress = writable<number>(0);

// Analysis 관련 스토어
export const analysisStatus = writable<AnalysisResult | null>(null);
export const analysisResults = writable<{
  currentPitch: number | null;
  accuracy: number;
  timestamp: number;
}>({
  currentPitch: null,
  accuracy: 0,
  timestamp: 0
});

// Music 데이터 스토어
export const musicData = writable<MusicData | null>(null);
export const midiData = writable<ArrayBuffer | null>(null);

// Playback 관련 스토어
export const playbackState = writable<PlaybackState>({
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  tempo: 120
});

// WebSocket 연결 스토어
export const wsConnection = writable<WebSocket | null>(null);
export const wsConnected = writable<boolean>(false);

// Derived 스토어
export const isProcessing = derived(
  [uploadStatus, transcriptionJob],
  ([$uploadStatus, $transcriptionJob]) => {
    return $uploadStatus?.status === 'uploading' || 
           $transcriptionJob?.status === 'processing';
  }
);

export const canPlayback = derived(
  [musicData, midiData],
  ([$musicData, $midiData]) => {
    return $musicData !== null && $midiData !== null;
  }
);

// WebSocket 연결 함수
export function connectWebSocket() {
  const ws = new WebSocket('ws://localhost:3002/ws');
  
  ws.onopen = () => {
    console.log('WebSocket connected');
    wsConnected.set(true);
    wsConnection.set(ws);
  };
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleWebSocketMessage(data);
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
  
  ws.onclose = () => {
    console.log('WebSocket disconnected');
    wsConnected.set(false);
    wsConnection.set(null);
    
    // 재연결 시도
    setTimeout(connectWebSocket, 5000);
  };
  
  return ws;
}

// WebSocket 메시지 처리
function handleWebSocketMessage(data: any) {
  switch (data.type) {
    case 'transcription_progress':
      transcriptionProgress.set(data.progress);
      break;
      
    case 'transcription_complete':
      transcriptionJob.update(job => ({
        ...job!,
        status: 'completed',
        result: data.result
      }));
      break;
      
    case 'analysis_update':
      analysisResults.set({
        currentPitch: data.pitch,
        accuracy: data.accuracy,
        timestamp: data.timestamp
      });
      break;
      
    default:
      console.log('Unknown WebSocket message type:', data.type);
  }
}

// 유틸리티 함수
export function resetUploadState() {
  uploadProgress.set(0);
  uploadStatus.set(null);
  currentFile.set(null);
}

export function resetTranscriptionState() {
  transcriptionJob.set(null);
  transcriptionProgress.set(0);
}

export function resetAllStates() {
  resetUploadState();
  resetTranscriptionState();
  analysisStatus.set(null);
  analysisResults.set({
    currentPitch: null,
    accuracy: 0,
    timestamp: 0
  });
  musicData.set(null);
  midiData.set(null);
  playbackState.set({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    tempo: 120
  });
}