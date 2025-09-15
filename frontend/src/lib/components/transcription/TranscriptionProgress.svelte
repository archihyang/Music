<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { Loader2, CheckCircle, XCircle, Music } from 'lucide-svelte';
  import type { TranscriptionJob } from '$lib/services/transcription.service';
  
  export let job: TranscriptionJob | null = null;
  
  const progress = tweened(0, {
    duration: 400,
    easing: cubicOut
  });
  
  $: if (job?.progress !== undefined) {
    progress.set(job.progress);
  }
  
  $: statusColor = getStatusColor(job?.status);
  $: statusIcon = getStatusIcon(job?.status);
  
  function getStatusColor(status?: string) {
    switch (status) {
      case 'COMPLETED':
        return 'var(--success)';
      case 'FAILED':
        return 'var(--error)';
      case 'PROCESSING':
        return 'var(--primary)';
      default:
        return 'var(--text-secondary)';
    }
  }
  
  function getStatusIcon(status?: string) {
    switch (status) {
      case 'COMPLETED':
        return CheckCircle;
      case 'FAILED':
        return XCircle;
      default:
        return null;
    }
  }
  
  const stages = [
    { threshold: 0, label: 'Initializing...', icon: '🎵' },
    { threshold: 10, label: 'Downloading audio...', icon: '📥' },
    { threshold: 30, label: 'Processing audio...', icon: '🎧' },
    { threshold: 50, label: 'Detecting notes...', icon: '🎼' },
    { threshold: 70, label: 'Analyzing style...', icon: '🎸' },
    { threshold: 85, label: 'Generating tablature...', icon: '📝' },
    { threshold: 95, label: 'Finalizing...', icon: '✨' },
    { threshold: 100, label: 'Complete!', icon: '✅' },
  ];
  
  $: currentStage = stages.reduce((acc, stage) => {
    return $progress >= stage.threshold ? stage : acc;
  }, stages[0]);
  
  // Animation for the processing indicator
  let pulseAnimation: any;
  
  onMount(() => {
    if (job?.status === 'PROCESSING') {
      pulseAnimation = setInterval(() => {
        // Trigger pulse animation
      }, 2000);
    }
  });
  
  onDestroy(() => {
    if (pulseAnimation) {
      clearInterval(pulseAnimation);
    }
  });
</script>

{#if job}
  <div class="transcription-progress" in:fly={{ y: 20, duration: 300 }}>
    <div class="progress-header">
      <div class="status-indicator" style="color: {statusColor}">
        {#if job.status === 'PROCESSING'}
          <Loader2 size={24} class="spinning" />
        {:else if statusIcon}
          <svelte:component this={statusIcon} size={24} />
        {:else}
          <Music size={24} />
        {/if}
      </div>
      
      <div class="progress-info">
        <h3>Transcription in Progress</h3>
        <p class="status-message">{job.message || currentStage.label}</p>
      </div>
      
      <div class="progress-percentage">
        {Math.round($progress)}%
      </div>
    </div>
    
    <div class="progress-bar-container">
      <div class="progress-bar">
        <div 
          class="progress-fill"
          style="width: {$progress}%; background: {statusColor}"
        >
          <div class="progress-glow"></div>
        </div>
      </div>
    </div>
    
    <div class="progress-stages">
      {#each stages as stage}
        <div 
          class="stage"
          class:active={$progress >= stage.threshold}
          class:current={currentStage === stage}
        >
          <span class="stage-icon">{stage.icon}</span>
          <span class="stage-label">{stage.label}</span>
        </div>
      {/each}
    </div>
    
    {#if job.status === 'COMPLETED' && job.result}
      <div class="result-preview" transition:fade={{ duration: 300 }}>
        <div class="result-stats">
          <div class="stat">
            <span class="stat-label">Notes Detected</span>
            <span class="stat-value">{job.result.notes.length}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Tempo</span>
            <span class="stat-value">{Math.round(job.result.tempo)} BPM</span>
          </div>
          <div class="stat">
            <span class="stat-label">Key</span>
            <span class="stat-value">{job.result.key}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Time Signature</span>
            <span class="stat-value">{job.result.timeSignature}</span>
          </div>
        </div>
        
        {#if job.result.styleAnalysis?.styleMatches?.[0]}
          <div class="style-match">
            <p>Style Match: <strong>{job.result.styleAnalysis.styleMatches[0].style}</strong></p>
            <p class="confidence">Confidence: {job.result.styleAnalysis.styleMatches[0].confidence}</p>
          </div>
        {/if}
      </div>
    {/if}
    
    {#if job.status === 'FAILED'}
      <div class="error-message" transition:fade={{ duration: 300 }}>
        <XCircle size={20} />
        <p>Transcription failed: {job.message}</p>
      </div>
    {/if}
  </div>
{/if}

<style>
  .transcription-progress {
    background: var(--surface);
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .progress-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .status-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    background: var(--surface-light);
    border-radius: 50%;
  }
  
  :global(.spinning) {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  
  .progress-info {
    flex: 1;
  }
  
  .progress-info h3 {
    margin: 0 0 0.25rem 0;
    font-size: 1.25rem;
  }
  
  .status-message {
    margin: 0;
    color: var(--text-secondary);
  }
  
  .progress-percentage {
    font-size: 2rem;
    font-weight: bold;
    color: var(--primary);
  }
  
  .progress-bar-container {
    margin-bottom: 1.5rem;
  }
  
  .progress-bar {
    height: 8px;
    background: var(--surface-light);
    border-radius: 4px;
    overflow: hidden;
    position: relative;
  }
  
  .progress-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
  }
  
  .progress-glow {
    position: absolute;
    top: 0;
    right: 0;
    width: 100px;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3));
    animation: glow 2s infinite;
  }
  
  @keyframes glow {
    0%, 100% {
      opacity: 0;
      transform: translateX(-100px);
    }
    50% {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  .progress-stages {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }
  
  .stage {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    opacity: 0.3;
    transition: all 0.3s;
  }
  
  .stage.active {
    opacity: 0.7;
  }
  
  .stage.current {
    opacity: 1;
    transform: scale(1.1);
  }
  
  .stage-icon {
    font-size: 1.5rem;
  }
  
  .stage-label {
    font-size: 0.75rem;
    color: var(--text-secondary);
    text-align: center;
    max-width: 80px;
  }
  
  .result-preview {
    background: var(--surface-light);
    border-radius: 8px;
    padding: 1.5rem;
  }
  
  .result-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .stat-label {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-bottom: 0.25rem;
  }
  
  .stat-value {
    font-size: 1.25rem;
    font-weight: bold;
    color: var(--primary);
  }
  
  .style-match {
    text-align: center;
    padding-top: 1rem;
    border-top: 1px solid var(--border);
  }
  
  .style-match p {
    margin: 0.25rem 0;
  }
  
  .confidence {
    color: var(--text-secondary);
    font-size: 0.875rem;
  }
  
  .error-message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    background: var(--error-light);
    color: var(--error);
    border-radius: 8px;
  }
  
  .error-message p {
    margin: 0;
  }
</style>