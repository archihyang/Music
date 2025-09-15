/**
 * Transcription store for managing transcription state
 */
import { writable, derived } from 'svelte/store';
import type { TranscriptionJob, TranscriptionHistory } from '$lib/services/transcription.service';
import { wsClient } from '$lib/api/websocket';

export interface TranscriptionState {
  activeJobs: Map<string, TranscriptionJob>;
  history: TranscriptionHistory[];
  currentJob: TranscriptionJob | null;
  isProcessing: boolean;
  error: string | null;
}

function createTranscriptionStore() {
  const { subscribe, set, update } = writable<TranscriptionState>({
    activeJobs: new Map(),
    history: [],
    currentJob: null,
    isProcessing: false,
    error: null,
  });
  
  // Setup WebSocket listeners
  wsClient.on('transcription:progress', (data) => {
    update(state => {
      const job = state.activeJobs.get(data.jobId);
      if (job) {
        job.progress = data.progress;
        job.status = data.status;
        job.message = data.message;
        state.activeJobs.set(data.jobId, job);
        
        if (state.currentJob?.jobId === data.jobId) {
          state.currentJob = job;
        }
      }
      return state;
    });
  });
  
  wsClient.on('transcription:complete', (data) => {
    update(state => {
      const job = state.activeJobs.get(data.jobId);
      if (job) {
        job.status = 'COMPLETED';
        job.progress = 100;
        job.result = data.result;
        state.activeJobs.set(data.jobId, job);
        
        if (state.currentJob?.jobId === data.jobId) {
          state.currentJob = job;
          state.isProcessing = false;
        }
      }
      return state;
    });
  });
  
  wsClient.on('transcription:error', (data) => {
    update(state => {
      const job = state.activeJobs.get(data.jobId);
      if (job) {
        job.status = 'FAILED';
        job.message = data.error;
        state.activeJobs.set(data.jobId, job);
        
        if (state.currentJob?.jobId === data.jobId) {
          state.currentJob = job;
          state.isProcessing = false;
          state.error = data.error;
        }
      }
      return state;
    });
  });
  
  return {
    subscribe,
    
    addJob(job: TranscriptionJob) {
      update(state => {
        state.activeJobs.set(job.jobId, job);
        state.currentJob = job;
        state.isProcessing = true;
        state.error = null;
        return state;
      });
    },
    
    removeJob(jobId: string) {
      update(state => {
        state.activeJobs.delete(jobId);
        if (state.currentJob?.jobId === jobId) {
          state.currentJob = null;
          state.isProcessing = false;
        }
        return state;
      });
    },
    
    setCurrentJob(jobId: string | null) {
      update(state => {
        if (jobId) {
          state.currentJob = state.activeJobs.get(jobId) || null;
        } else {
          state.currentJob = null;
        }
        return state;
      });
    },
    
    updateHistory(history: TranscriptionHistory[]) {
      update(state => {
        state.history = history;
        return state;
      });
    },
    
    clearError() {
      update(state => {
        state.error = null;
        return state;
      });
    },
    
    reset() {
      set({
        activeJobs: new Map(),
        history: [],
        currentJob: null,
        isProcessing: false,
        error: null,
      });
    },
  };
}

export const transcriptionStore = createTranscriptionStore();

// Derived stores
export const currentProgress = derived(
  transcriptionStore,
  $store => $store.currentJob?.progress || 0
);

export const isTranscribing = derived(
  transcriptionStore,
  $store => $store.isProcessing
);

export const activeJobsCount = derived(
  transcriptionStore,
  $store => $store.activeJobs.size
);