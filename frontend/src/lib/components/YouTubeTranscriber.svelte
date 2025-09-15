<script>
  import { createEventDispatcher } from 'svelte';
  import { writable } from 'svelte/store';
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import { musicDataService, transcriptionJobs, activeJobs } from '$lib/services/musicDataService';
  import { errorHandler } from '$lib/utils/errorHandler';
  
  const dispatch = createEventDispatcher();
  
  // State
  let youtubeUrl = '';
  let isValidUrl = false;
  let isProcessing = false;
  let currentJobId = null;
  let videoInfo = null;
  let transcriptionOptions = {
    instrument: 'guitar',
    difficulty: 'intermediate',
    includeTab: true,
    includeMidi: true,
    style: ''
  };
  
  // Available options
  const instruments = [
    { value: 'guitar', label: '🎸 Guitar' },
    { value: 'bass', label: '🎸 Bass' },
    { value: 'piano', label: '🎹 Piano' },
    { value: 'drums', label: '🥁 Drums' }
  ];
  
  const difficulties = [
    { value: 'beginner', label: 'Beginner', description: 'Simplified version' },
    { value: 'intermediate', label: 'Intermediate', description: 'Balanced accuracy' },
    { value: 'advanced', label: 'Advanced', description: 'Full complexity' }
  ];
  
  const guitarStyles = [
    { value: '', label: 'Auto-detect' },
    { value: 'hendrix', label: 'Jimi Hendrix' },
    { value: 'page', label: 'Jimmy Page' },
    { value: 'clapton', label: 'Eric Clapton' },
    { value: 'gilmour', label: 'David Gilmour' },
    { value: 'santana', label: 'Carlos Santana' },
    { value: 'knopfler', label: 'Mark Knopfler' }
  ];
  
  // YouTube URL validation
  function validateYouTubeUrl(url) {
    const patterns = [
      /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+(&[\w=]*)?$/,
      /^(https?:\/\/)?(www\.)?youtube\.com\/embed\/[\w-]+(\?[\w=&]*)?$/,
      /^(https?:\/\/)?(www\.)?m\.youtube\.com\/watch\?v=[\w-]+(&[\w=]*)?$/
    ];
    
    return patterns.some(pattern => pattern.test(url));
  }
  
  // Extract video ID from URL
  function extractVideoId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|m\.youtube\.com\/watch\?v=)([\w-]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  }
  
  // Fetch video information
  async function fetchVideoInfo() {
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) return;
    
    try {
      // This would normally call YouTube API
      // For now, we'll simulate with a placeholder
      videoInfo = {
        id: videoId,
        title: 'Loading...',
        duration: 0,
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        channel: 'Loading...'
      };
      
      // In production, this would call the backend API to get real video info
      // const response = await fetch(`/api/youtube/info/${videoId}`);
      // videoInfo = await response.json();
    } catch (error) {
      console.error('Failed to fetch video info:', error);
      videoInfo = null;
    }
  }
  
  // Start transcription
  async function startTranscription() {
    if (!isValidUrl || isProcessing) return;
    
    isProcessing = true;
    
    try {
      // Start transcription job
      const jobId = await musicDataService.startTranscription({
        source: 'youtube',
        url: youtubeUrl,
        options: transcriptionOptions
      });
      
      currentJobId = jobId;
      
      // Dispatch event
      dispatch('transcription-started', { jobId, url: youtubeUrl });
      
      // Monitor job progress
      monitorJob(jobId);
    } catch (error) {
      errorHandler.logError(
        error as Error,
        'high',
        { context: 'Starting YouTube transcription', url: youtubeUrl }
      );
      
      isProcessing = false;
      dispatch('error', error);
    }
  }
  
  // Monitor transcription job
  async function monitorJob(jobId) {
    const checkInterval = setInterval(async () => {
      try {
        const job = await musicDataService.getJobStatus(jobId);
        
        if (job.status === 'completed') {
          clearInterval(checkInterval);
          isProcessing = false;
          currentJobId = null;
          
          dispatch('transcription-completed', {
            jobId,
            score: job.score
          });
          
          // Reset form
          youtubeUrl = '';
          videoInfo = null;
          isValidUrl = false;
        } else if (job.status === 'failed') {
          clearInterval(checkInterval);
          isProcessing = false;
          currentJobId = null;
          
          dispatch('transcription-failed', {
            jobId,
            error: job.error
          });
        }
      } catch (error) {
        console.error('Failed to check job status:', error);
      }
    }, 2000); // Check every 2 seconds
  }
  
  // Handle URL input
  function handleUrlInput() {
    isValidUrl = validateYouTubeUrl(youtubeUrl);
    
    if (isValidUrl) {
      fetchVideoInfo();
    } else {
      videoInfo = null;
    }
  }
  
  // Handle paste
  function handlePaste(event) {
    const pastedText = event.clipboardData.getData('text');
    if (validateYouTubeUrl(pastedText)) {
      youtubeUrl = pastedText;
      handleUrlInput();
    }
  }
  
  // Get current job if exists
  $: currentJob = currentJobId ? $transcriptionJobs.get(currentJobId) : null;
</script>

<div class="youtube-transcriber">
  <Card variant="elevated" class="transcriber-card">
    <div class="header">
      <h2 class="title">🎵 YouTube to Tab/Score</h2>
      <p class="subtitle">Convert any YouTube video to professional sheet music and guitar tabs</p>
    </div>
    
    <!-- URL Input -->
    <div class="url-input-section">
      <label for="youtube-url" class="label">YouTube URL</label>
      <div class="input-group">
        <input
          id="youtube-url"
          type="url"
          bind:value={youtubeUrl}
          on:input={handleUrlInput}
          on:paste={handlePaste}
          placeholder="https://www.youtube.com/watch?v=..."
          class="url-input"
          class:valid={isValidUrl}
          class:invalid={youtubeUrl && !isValidUrl}
          disabled={isProcessing}
        />
        {#if isValidUrl}
          <span class="status-icon valid">✓</span>
        {:else if youtubeUrl}
          <span class="status-icon invalid">✗</span>
        {/if}
      </div>
      {#if youtubeUrl && !isValidUrl}
        <p class="error-text">Please enter a valid YouTube URL</p>
      {/if}
    </div>
    
    <!-- Video Preview -->
    {#if videoInfo}
      <div class="video-preview">
        <img 
          src={videoInfo.thumbnail} 
          alt={videoInfo.title}
          class="thumbnail"
          on:error={(e) => e.target.src = '/placeholder-video.jpg'}
        />
        <div class="video-info">
          <h3 class="video-title">{videoInfo.title}</h3>
          <p class="video-channel">{videoInfo.channel}</p>
        </div>
      </div>
    {/if}
    
    <!-- Transcription Options -->
    {#if isValidUrl && !isProcessing}
      <div class="options-section">
        <h3 class="section-title">Transcription Options</h3>
        
        <!-- Instrument Selection -->
        <div class="option-group">
          <label class="option-label">Instrument</label>
          <div class="radio-group">
            {#each instruments as instrument}
              <label class="radio-label">
                <input
                  type="radio"
                  bind:group={transcriptionOptions.instrument}
                  value={instrument.value}
                />
                <span>{instrument.label}</span>
              </label>
            {/each}
          </div>
        </div>
        
        <!-- Difficulty Level -->
        <div class="option-group">
          <label class="option-label">Difficulty Level</label>
          <div class="difficulty-options">
            {#each difficulties as difficulty}
              <button
                class="difficulty-btn"
                class:selected={transcriptionOptions.difficulty === difficulty.value}
                on:click={() => transcriptionOptions.difficulty = difficulty.value}
              >
                <span class="difficulty-label">{difficulty.label}</span>
                <span class="difficulty-desc">{difficulty.description}</span>
              </button>
            {/each}
          </div>
        </div>
        
        <!-- Style (for guitar) -->
        {#if transcriptionOptions.instrument === 'guitar'}
          <div class="option-group">
            <label for="style-select" class="option-label">
              Guitar Style (Optional)
            </label>
            <select
              id="style-select"
              bind:value={transcriptionOptions.style}
              class="style-select"
            >
              {#each guitarStyles as style}
                <option value={style.value}>{style.label}</option>
              {/each}
            </select>
          </div>
        {/if}
        
        <!-- Output Options -->
        <div class="option-group">
          <label class="option-label">Output Formats</label>
          <div class="checkbox-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                bind:checked={transcriptionOptions.includeTab}
              />
              <span>Guitar Tab</span>
            </label>
            <label class="checkbox-label">
              <input
                type="checkbox"
                bind:checked={transcriptionOptions.includeMidi}
              />
              <span>MIDI File</span>
            </label>
          </div>
        </div>
      </div>
    {/if}
    
    <!-- Progress Section -->
    {#if isProcessing && currentJob}
      <div class="progress-section">
        <div class="progress-header">
          <span class="progress-label">Transcribing...</span>
          <span class="progress-percentage">{currentJob.progress}%</span>
        </div>
        <div class="progress-bar">
          <div 
            class="progress-fill"
            style="width: {currentJob.progress}%"
          />
        </div>
        <p class="progress-status">
          {#if currentJob.progress < 20}
            Downloading video...
          {:else if currentJob.progress < 40}
            Extracting audio...
          {:else if currentJob.progress < 60}
            Analyzing music...
          {:else if currentJob.progress < 80}
            Generating notation...
          {:else}
            Finalizing...
          {/if}
        </p>
      </div>
    {/if}
    
    <!-- Action Buttons -->
    <div class="actions">
      {#if !isProcessing}
        <Button
          variant="primary"
          size="lg"
          disabled={!isValidUrl}
          on:click={startTranscription}
        >
          Start Transcription
        </Button>
      {:else}
        <Button
          variant="secondary"
          size="lg"
          disabled
        >
          Processing...
        </Button>
      {/if}
    </div>
    
    <!-- Active Jobs -->
    {#if $activeJobs.length > 0}
      <div class="active-jobs">
        <h3 class="section-title">Active Transcriptions</h3>
        <div class="jobs-list">
          {#each $activeJobs as job}
            <div class="job-item">
              <span class="job-id">Job #{job.id.slice(0, 8)}</span>
              <div class="job-progress">
                <div class="mini-progress-bar">
                  <div 
                    class="mini-progress-fill"
                    style="width: {job.progress}%"
                  />
                </div>
              </div>
              <span class="job-percentage">{job.progress}%</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </Card>
</div>

<style>
  .youtube-transcriber {
    max-width: 800px;
    margin: 0 auto;
  }
  
  :global(.transcriber-card) {
    padding: 2rem;
  }
  
  .header {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .title {
    font-size: 1.875rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }
  
  .subtitle {
    font-size: 1rem;
    color: var(--text-secondary);
  }
  
  .url-input-section {
    margin-bottom: 1.5rem;
  }
  
  .label,
  .option-label,
  .section-title {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }
  
  .section-title {
    font-size: 1.125rem;
    margin-top: 1.5rem;
    margin-bottom: 1rem;
  }
  
  .input-group {
    position: relative;
    display: flex;
    align-items: center;
  }
  
  .url-input {
    width: 100%;
    padding: 0.75rem 3rem 0.75rem 1rem;
    font-size: 1rem;
    border: 2px solid var(--border-color);
    border-radius: 0.5rem;
    background: var(--bg-primary);
    color: var(--text-primary);
    transition: all 0.2s;
  }
  
  .url-input:focus {
    outline: none;
    border-color: var(--primary-500);
  }
  
  .url-input.valid {
    border-color: var(--success-500);
  }
  
  .url-input.invalid {
    border-color: var(--danger-500);
  }
  
  .url-input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .status-icon {
    position: absolute;
    right: 1rem;
    font-size: 1.25rem;
    font-weight: bold;
  }
  
  .status-icon.valid {
    color: var(--success-500);
  }
  
  .status-icon.invalid {
    color: var(--danger-500);
  }
  
  .error-text {
    margin-top: 0.25rem;
    font-size: 0.875rem;
    color: var(--danger-500);
  }
  
  .video-preview {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background: var(--bg-secondary);
    border-radius: 0.5rem;
    margin-bottom: 1.5rem;
  }
  
  .thumbnail {
    width: 120px;
    height: 68px;
    object-fit: cover;
    border-radius: 0.25rem;
  }
  
  .video-info {
    flex: 1;
  }
  
  .video-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.25rem;
  }
  
  .video-channel {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }
  
  .options-section {
    margin-bottom: 1.5rem;
  }
  
  .option-group {
    margin-bottom: 1.25rem;
  }
  
  .radio-group,
  .checkbox-group {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }
  
  .radio-label,
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    color: var(--text-primary);
  }
  
  .radio-label input,
  .checkbox-label input {
    cursor: pointer;
  }
  
  .difficulty-options {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }
  
  .difficulty-btn {
    padding: 0.75rem;
    border: 2px solid var(--border-color);
    border-radius: 0.5rem;
    background: var(--bg-primary);
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
  }
  
  .difficulty-btn:hover {
    border-color: var(--primary-400);
    background: var(--bg-secondary);
  }
  
  .difficulty-btn.selected {
    border-color: var(--primary-500);
    background: var(--primary-100);
  }
  
  .difficulty-label {
    display: block;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.25rem;
  }
  
  .difficulty-desc {
    display: block;
    font-size: 0.75rem;
    color: var(--text-secondary);
  }
  
  .style-select {
    width: 100%;
    padding: 0.5rem;
    border: 2px solid var(--border-color);
    border-radius: 0.5rem;
    background: var(--bg-primary);
    color: var(--text-primary);
    cursor: pointer;
  }
  
  .style-select:focus {
    outline: none;
    border-color: var(--primary-500);
  }
  
  .progress-section {
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: var(--bg-secondary);
    border-radius: 0.5rem;
  }
  
  .progress-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }
  
  .progress-label {
    font-weight: 600;
    color: var(--text-primary);
  }
  
  .progress-percentage {
    font-weight: 600;
    color: var(--primary-500);
  }
  
  .progress-bar {
    height: 8px;
    background: var(--bg-tertiary);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--primary-400), var(--primary-600));
    transition: width 0.3s ease;
  }
  
  .progress-status {
    font-size: 0.875rem;
    color: var(--text-secondary);
    font-style: italic;
  }
  
  .actions {
    display: flex;
    justify-content: center;
    margin-top: 2rem;
  }
  
  .active-jobs {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid var(--border-color);
  }
  
  .jobs-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .job-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    background: var(--bg-secondary);
    border-radius: 0.5rem;
  }
  
  .job-id {
    font-family: monospace;
    font-size: 0.875rem;
    color: var(--text-secondary);
    min-width: 100px;
  }
  
  .job-progress {
    flex: 1;
  }
  
  .mini-progress-bar {
    height: 4px;
    background: var(--bg-tertiary);
    border-radius: 2px;
    overflow: hidden;
  }
  
  .mini-progress-fill {
    height: 100%;
    background: var(--primary-500);
    transition: width 0.3s ease;
  }
  
  .job-percentage {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--primary-500);
    min-width: 50px;
    text-align: right;
  }
  
  /* Dark mode adjustments */
  :global(.dark) .difficulty-btn.selected {
    background: rgba(14, 165, 233, 0.1);
  }
  
  @media (max-width: 640px) {
    .difficulty-options {
      grid-template-columns: 1fr;
    }
    
    .video-preview {
      flex-direction: column;
    }
    
    .thumbnail {
      width: 100%;
      height: auto;
      aspect-ratio: 16/9;
    }
  }
</style>