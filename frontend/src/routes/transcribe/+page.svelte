<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import TranscriptionUploader from '$lib/components/transcription/TranscriptionUploader.svelte';
  import TranscriptionProgress from '$lib/components/transcription/TranscriptionProgress.svelte';
  import { transcriptionService } from '$lib/services/transcription.service';
  import { transcriptionStore, currentProgress, isTranscribing } from '$lib/stores/transcription.store';
  import { authStore } from '$lib/stores/auth.store';
  import { wsClient } from '$lib/api/websocket';
  import toast from 'svelte-french-toast';
  
  let currentJob: any = null;
  let transcriptionHistory: any[] = [];
  let loading = false;
  
  // Subscribe to store
  $: currentJob = $transcriptionStore.currentJob;
  $: transcriptionHistory = $transcriptionStore.history;
  
  onMount(async () => {
    // Check if user is authenticated
    if (!$authStore.isAuthenticated) {
      toast.error('Please login to use transcription service');
      goto('/login');
      return;
    }
    
    // Connect WebSocket
    wsClient.connect();
    
    // Load transcription history
    await loadHistory();
  });
  
  onDestroy(() => {
    // Cleanup WebSocket subscriptions
    if (currentJob) {
      wsClient.unsubscribeFromJob(currentJob.jobId);
    }
  });
  
  async function loadHistory() {
    try {
      loading = true;
      const history = await transcriptionService.getTranscriptionHistory();
      transcriptionStore.updateHistory(history);
    } catch (error) {
      console.error('Failed to load history:', error);
      toast.error('Failed to load transcription history');
    } finally {
      loading = false;
    }
  }
  
  async function handleTranscriptionStart(event: CustomEvent) {
    const { type, url, file, videoInfo, options } = event.detail;
    
    try {
      let job;
      
      if (type === 'youtube') {
        toast.loading('Starting YouTube transcription...');
        job = await transcriptionService.transcribeYouTube(
          url,
          $authStore.user?.id || '',
          options
        );
      } else {
        toast.loading('Uploading file for transcription...');
        job = await transcriptionService.transcribeFile(
          file,
          $authStore.user?.id || '',
          options
        );
      }
      
      // Add job to store
      transcriptionStore.addJob(job);
      
      // Subscribe to WebSocket updates
      wsClient.subscribeToJob(job.jobId);
      
      toast.success('Transcription started successfully!');
      
      // Store video/file info for display
      if (type === 'youtube') {
        job.videoInfo = videoInfo;
      } else {
        job.fileInfo = {
          name: file.name,
          size: file.size,
        };
      }
      
    } catch (error: any) {
      console.error('Failed to start transcription:', error);
      toast.error(error.response?.data?.detail || 'Failed to start transcription');
    }
  }
  
  async function handleJobCancel() {
    if (!currentJob) return;
    
    try {
      await transcriptionService.cancelJob(currentJob.jobId);
      transcriptionStore.removeJob(currentJob.jobId);
      toast.success('Transcription cancelled');
    } catch (error) {
      console.error('Failed to cancel job:', error);
      toast.error('Failed to cancel transcription');
    }
  }
  
  function handleJobComplete() {
    if (!currentJob?.result) return;
    
    // Navigate to score viewer with the result
    goto(`/scores/view?jobId=${currentJob.jobId}`);
  }
  
  function viewHistoryItem(item: any) {
    if (item.score) {
      goto(`/scores/${item.score.id}`);
    }
  }
  
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
</script>

<svelte:head>
  <title>Transcribe Music - Genesis Music</title>
</svelte:head>

<div class="transcribe-page">
  <div class="page-header">
    <h1>Music Transcription</h1>
    <p>Transform YouTube videos or audio files into interactive sheet music and tabs</p>
  </div>
  
  <div class="transcribe-container">
    {#if !$isTranscribing}
      <TranscriptionUploader on:start={handleTranscriptionStart} />
    {:else if currentJob}
      <TranscriptionProgress job={currentJob} />
      
      <div class="job-actions">
        {#if currentJob.status === 'PROCESSING' || currentJob.status === 'QUEUED'}
          <button class="btn-secondary" on:click={handleJobCancel}>
            Cancel Transcription
          </button>
        {:else if currentJob.status === 'COMPLETED'}
          <button class="btn-primary" on:click={handleJobComplete}>
            View Result
          </button>
          <button class="btn-secondary" on:click={() => transcriptionStore.reset()}>
            New Transcription
          </button>
        {:else if currentJob.status === 'FAILED'}
          <button class="btn-secondary" on:click={() => transcriptionStore.reset()}>
            Try Again
          </button>
        {/if}
      </div>
    {/if}
  </div>
  
  <!-- Transcription History -->
  {#if transcriptionHistory.length > 0}
    <div class="history-section">
      <h2>Recent Transcriptions</h2>
      
      <div class="history-grid">
        {#each transcriptionHistory as item}
          <div class="history-item" on:click={() => viewHistoryItem(item)}>
            <div class="history-icon">
              {#if item.sourceType === 'YOUTUBE'}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                </svg>
              {:else}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 18V5l12-2v13"/>
                  <circle cx="6" cy="18" r="3"/>
                  <circle cx="18" cy="16" r="3"/>
                </svg>
              {/if}
            </div>
            
            <div class="history-content">
              <h4>
                {item.sourceUrl ? 'YouTube Video' : item.sourceFilename || 'Uploaded File'}
              </h4>
              <p class="history-meta">
                {formatDate(item.createdAt)}
                {#if item.duration}
                  • {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
                {/if}
              </p>
            </div>
            
            <div class="history-status" class:completed={item.status === 'COMPLETED'}>
              {item.status}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .transcribe-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  .page-header {
    text-align: center;
    margin-bottom: 3rem;
  }
  
  .page-header h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    background: linear-gradient(135deg, var(--primary), var(--secondary));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  .page-header p {
    color: var(--text-secondary);
    font-size: 1.125rem;
  }
  
  .transcribe-container {
    margin-bottom: 3rem;
  }
  
  .job-actions {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-top: 2rem;
  }
  
  .btn-primary,
  .btn-secondary {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .btn-primary {
    background: var(--primary);
    color: white;
  }
  
  .btn-primary:hover {
    background: var(--primary-dark);
    transform: translateY(-1px);
  }
  
  .btn-secondary {
    background: var(--surface-light);
    color: var(--text);
  }
  
  .btn-secondary:hover {
    background: var(--surface-lighter);
  }
  
  .history-section {
    margin-top: 4rem;
  }
  
  .history-section h2 {
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
  }
  
  .history-grid {
    display: grid;
    gap: 1rem;
  }
  
  .history-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: var(--surface);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .history-item:hover {
    background: var(--surface-light);
    transform: translateX(4px);
  }
  
  .history-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface-light);
    border-radius: 8px;
    color: var(--primary);
  }
  
  .history-content {
    flex: 1;
  }
  
  .history-content h4 {
    margin: 0 0 0.25rem 0;
    font-size: 1rem;
  }
  
  .history-meta {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.875rem;
  }
  
  .history-status {
    padding: 0.25rem 0.75rem;
    background: var(--surface-light);
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--text-secondary);
  }
  
  .history-status.completed {
    background: var(--success-light);
    color: var(--success);
  }
</style>