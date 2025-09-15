<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import { Upload, Youtube, Music, AlertCircle } from 'lucide-svelte';
  import { transcriptionService } from '$lib/services/transcription.service';
  import { API_CONFIG } from '$lib/api/config';
  import type { YouTubeVideoInfo } from '$lib/services/transcription.service';
  
  const dispatch = createEventDispatcher();
  
  let mode: 'youtube' | 'upload' = 'youtube';
  let youtubeUrl = '';
  let selectedFile: File | null = null;
  let dragActive = false;
  let loading = false;
  let error = '';
  let videoInfo: YouTubeVideoInfo | null = null;
  
  // Options
  let selectedInstrument = 'guitar';
  let selectedDifficulty = 'INTERMEDIATE';
  let selectedStyle = '';
  
  const instruments = [
    { value: 'guitar', label: 'Guitar' },
    { value: 'bass', label: 'Bass' },
    { value: 'piano', label: 'Piano' },
    { value: 'drums', label: 'Drums' },
  ];
  
  const difficulties = [
    { value: 'BEGINNER', label: 'Beginner' },
    { value: 'INTERMEDIATE', label: 'Intermediate' },
    { value: 'ADVANCED', label: 'Advanced' },
    { value: 'PROFESSIONAL', label: 'Professional' },
  ];
  
  async function validateYouTubeUrl() {
    if (!youtubeUrl) {
      error = 'Please enter a YouTube URL';
      return;
    }
    
    loading = true;
    error = '';
    
    try {
      videoInfo = await transcriptionService.validateYouTubeUrl(youtubeUrl);
    } catch (err: any) {
      error = err.response?.data?.detail || 'Invalid YouTube URL';
      videoInfo = null;
    } finally {
      loading = false;
    }
  }
  
  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      selectFile(input.files[0]);
    }
  }
  
  function handleDrop(event: DragEvent) {
    event.preventDefault();
    dragActive = false;
    
    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      selectFile(event.dataTransfer.files[0]);
    }
  }
  
  function selectFile(file: File) {
    // Validate file
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!API_CONFIG.ALLOWED_AUDIO_FORMATS.includes(extension)) {
      error = `Invalid file format. Allowed formats: ${API_CONFIG.ALLOWED_AUDIO_FORMATS.join(', ')}`;
      return;
    }
    
    if (file.size > API_CONFIG.MAX_FILE_SIZE) {
      error = `File too large. Maximum size: ${API_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`;
      return;
    }
    
    selectedFile = file;
    error = '';
  }
  
  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    dragActive = true;
  }
  
  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    dragActive = false;
  }
  
  async function startTranscription() {
    if (mode === 'youtube') {
      if (!videoInfo) {
        error = 'Please validate the YouTube URL first';
        return;
      }
      
      dispatch('start', {
        type: 'youtube',
        url: youtubeUrl,
        videoInfo,
        options: {
          instrument: selectedInstrument,
          difficulty: selectedDifficulty,
          style: selectedStyle,
        },
      });
    } else {
      if (!selectedFile) {
        error = 'Please select a file';
        return;
      }
      
      dispatch('start', {
        type: 'upload',
        file: selectedFile,
        options: {
          instrument: selectedInstrument,
          difficulty: selectedDifficulty,
          style: selectedStyle,
        },
      });
    }
  }
  
  function formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
</script>

<div class="transcription-uploader">
  <!-- Mode selector -->
  <div class="mode-selector">
    <button
      class="mode-btn"
      class:active={mode === 'youtube'}
      on:click={() => { mode = 'youtube'; error = ''; }}
    >
      <Youtube size={20} />
      YouTube URL
    </button>
    <button
      class="mode-btn"
      class:active={mode === 'upload'}
      on:click={() => { mode = 'upload'; error = ''; }}
    >
      <Upload size={20} />
      Upload File
    </button>
  </div>
  
  <!-- Input area -->
  <div class="input-area">
    {#if mode === 'youtube'}
      <div class="youtube-input" transition:fade={{ duration: 200 }}>
        <input
          type="url"
          placeholder="Enter YouTube URL (e.g., https://www.youtube.com/watch?v=...)"
          bind:value={youtubeUrl}
          on:blur={validateYouTubeUrl}
          disabled={loading}
        />
        
        {#if loading}
          <div class="loading">Validating URL...</div>
        {/if}
        
        {#if videoInfo}
          <div class="video-info" transition:scale={{ duration: 200 }}>
            <img src={videoInfo.thumbnailUrl} alt={videoInfo.title} />
            <div class="info-content">
              <h4>{videoInfo.title}</h4>
              <p>{videoInfo.author} • {formatDuration(videoInfo.duration)}</p>
            </div>
          </div>
        {/if}
      </div>
    {:else}
      <div
        class="file-upload"
        class:drag-active={dragActive}
        on:drop={handleDrop}
        on:dragover={handleDragOver}
        on:dragleave={handleDragLeave}
        transition:fade={{ duration: 200 }}
      >
        <input
          type="file"
          id="file-input"
          accept={API_CONFIG.ALLOWED_AUDIO_FORMATS.join(',')}
          on:change={handleFileSelect}
          hidden
        />
        
        <label for="file-input" class="upload-label">
          {#if selectedFile}
            <Music size={48} />
            <p class="file-name">{selectedFile.name}</p>
            <p class="file-size">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
          {:else}
            <Upload size={48} />
            <p>Drop audio file here or click to browse</p>
            <p class="formats">
              Supported formats: {API_CONFIG.ALLOWED_AUDIO_FORMATS.join(', ')}
            </p>
          {/if}
        </label>
      </div>
    {/if}
  </div>
  
  <!-- Options -->
  <div class="options">
    <div class="option-group">
      <label for="instrument">Instrument</label>
      <select id="instrument" bind:value={selectedInstrument}>
        {#each instruments as instrument}
          <option value={instrument.value}>{instrument.label}</option>
        {/each}
      </select>
    </div>
    
    <div class="option-group">
      <label for="difficulty">Difficulty</label>
      <select id="difficulty" bind:value={selectedDifficulty}>
        {#each difficulties as difficulty}
          <option value={difficulty.value}>{difficulty.label}</option>
        {/each}
      </select>
    </div>
    
    <div class="option-group">
      <label for="style">Style (Optional)</label>
      <input
        type="text"
        id="style"
        placeholder="e.g., Blues, Rock, Jazz"
        bind:value={selectedStyle}
      />
    </div>
  </div>
  
  <!-- Error message -->
  {#if error}
    <div class="error" transition:fade={{ duration: 200 }}>
      <AlertCircle size={16} />
      {error}
    </div>
  {/if}
  
  <!-- Action buttons -->
  <div class="actions">
    <button
      class="btn-primary"
      on:click={startTranscription}
      disabled={loading || (mode === 'youtube' ? !videoInfo : !selectedFile)}
    >
      Start Transcription
    </button>
  </div>
</div>

<style>
  .transcription-uploader {
    background: var(--surface);
    border-radius: 12px;
    padding: 2rem;
    max-width: 600px;
    margin: 0 auto;
  }
  
  .mode-selector {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
  }
  
  .mode-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: var(--surface-light);
    border: 2px solid transparent;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .mode-btn:hover {
    background: var(--surface-lighter);
  }
  
  .mode-btn.active {
    background: var(--primary);
    color: white;
    border-color: var(--primary-dark);
  }
  
  .input-area {
    margin-bottom: 2rem;
    min-height: 200px;
  }
  
  .youtube-input input {
    width: 100%;
    padding: 1rem;
    border: 2px solid var(--border);
    border-radius: 8px;
    font-size: 1rem;
    background: var(--background);
  }
  
  .youtube-input input:focus {
    outline: none;
    border-color: var(--primary);
  }
  
  .loading {
    text-align: center;
    padding: 1rem;
    color: var(--text-secondary);
  }
  
  .video-info {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
    padding: 1rem;
    background: var(--surface-light);
    border-radius: 8px;
  }
  
  .video-info img {
    width: 120px;
    height: 67px;
    object-fit: cover;
    border-radius: 4px;
  }
  
  .info-content h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
  }
  
  .info-content p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.875rem;
  }
  
  .file-upload {
    border: 2px dashed var(--border);
    border-radius: 8px;
    padding: 3rem;
    text-align: center;
    transition: all 0.2s;
  }
  
  .file-upload.drag-active {
    border-color: var(--primary);
    background: var(--primary-light);
  }
  
  .upload-label {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    cursor: pointer;
    color: var(--text-secondary);
  }
  
  .file-name {
    font-weight: 600;
    color: var(--text);
  }
  
  .file-size {
    font-size: 0.875rem;
  }
  
  .formats {
    font-size: 0.875rem;
    margin-top: 0.5rem;
  }
  
  .options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }
  
  .option-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .option-group label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-secondary);
  }
  
  .option-group select,
  .option-group input {
    padding: 0.5rem;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: var(--background);
  }
  
  .error {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: var(--error-light);
    color: var(--error);
    border-radius: 4px;
    margin-bottom: 1rem;
  }
  
  .actions {
    display: flex;
    justify-content: center;
  }
  
  .btn-primary {
    padding: 0.75rem 2rem;
    background: var(--primary);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .btn-primary:hover:not(:disabled) {
    background: var(--primary-dark);
    transform: translateY(-1px);
  }
  
  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>