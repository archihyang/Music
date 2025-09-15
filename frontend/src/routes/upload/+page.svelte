<script>
  import { goto } from '$app/navigation';
  import Container from '$lib/components/layout/Container.svelte';
  import Section from '$lib/components/layout/Section.svelte';
  import Grid from '$lib/components/layout/Grid.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import YouTubeTranscriber from '$lib/components/YouTubeTranscriber.svelte';
  import { musicDataService, transcriptionJobs } from '$lib/services/musicDataService';
  import { midiService } from '$lib/services/midiService';
  import { errorHandler } from '$lib/utils/errorHandler';
  
  let activeTab = 'youtube';
  let fileInput;
  let dragOver = false;
  let uploadProgress = 0;
  let isUploading = false;
  
  // File upload options
  let fileOptions = {
    instrument: 'guitar',
    difficulty: 'intermediate',
    includeTab: true,
    includeMidi: true
  };
  
  // Supported file formats
  const supportedFormats = {
    audio: ['mp3', 'wav', 'ogg', 'm4a', 'flac'],
    midi: ['mid', 'midi'],
    score: ['xml', 'mxl', 'musicxml', 'gp', 'gp3', 'gp4', 'gp5', 'gpx']
  };
  
  // Handle file selection
  async function handleFileSelect(event) {
    const files = event.target?.files || event.dataTransfer?.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    await processFile(file);
  }
  
  // Process uploaded file
  async function processFile(file) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (!extension) {
      errorHandler.showNotification('Invalid file format', 'error');
      return;
    }
    
    isUploading = true;
    uploadProgress = 0;
    
    try {
      if (supportedFormats.audio.includes(extension)) {
        // Audio file - need transcription
        await transcribeAudioFile(file);
      } else if (supportedFormats.midi.includes(extension)) {
        // MIDI file - load directly
        await loadMidiFile(file);
      } else if (supportedFormats.score.includes(extension)) {
        // Score file - parse and display
        await loadScoreFile(file);
      } else {
        throw new Error(`Unsupported file format: ${extension}`);
      }
    } catch (error) {
      errorHandler.logError(
        error as Error,
        'high',
        { context: 'Processing uploaded file', fileName: file.name }
      );
      errorHandler.showNotification('Failed to process file', 'error');
    } finally {
      isUploading = false;
      uploadProgress = 0;
    }
  }
  
  // Transcribe audio file
  async function transcribeAudioFile(file) {
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        uploadProgress = Math.min(uploadProgress + 10, 90);
      }, 200);
      
      // Start transcription
      const jobId = await musicDataService.startTranscription({
        source: 'file',
        file,
        options: fileOptions
      });
      
      clearInterval(progressInterval);
      uploadProgress = 100;
      
      // Navigate to results page
      setTimeout(() => {
        goto(`/transcription/${jobId}`);
      }, 500);
    } catch (error) {
      throw error;
    }
  }
  
  // Load MIDI file
  async function loadMidiFile(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const midiData = await midiService.loadMidiFromBuffer(arrayBuffer);
      
      uploadProgress = 100;
      
      // Navigate to editor
      setTimeout(() => {
        goto('/editor?type=midi');
      }, 500);
    } catch (error) {
      throw error;
    }
  }
  
  // Load score file
  async function loadScoreFile(file) {
    try {
      // This would parse MusicXML or Guitar Pro files
      // For now, we'll simulate the process
      uploadProgress = 100;
      
      errorHandler.showNotification('Score file loaded successfully', 'success');
      
      // Navigate to notation viewer
      setTimeout(() => {
        goto('/notation');
      }, 500);
    } catch (error) {
      throw error;
    }
  }
  
  // Handle drag and drop
  function handleDragOver(event) {
    event.preventDefault();
    dragOver = true;
  }
  
  function handleDragLeave(event) {
    event.preventDefault();
    dragOver = false;
  }
  
  function handleDrop(event) {
    event.preventDefault();
    dragOver = false;
    handleFileSelect(event);
  }
  
  // Handle YouTube transcription events
  function handleTranscriptionStarted(event) {
    const { jobId } = event.detail;
    errorHandler.showNotification('Transcription started', 'info');
  }
  
  function handleTranscriptionCompleted(event) {
    const { jobId, score } = event.detail;
    errorHandler.showNotification('Transcription completed!', 'success');
    goto(`/notation?scoreId=${score.id}`);
  }
  
  function handleTranscriptionFailed(event) {
    const { error } = event.detail;
    errorHandler.showNotification(`Transcription failed: ${error}`, 'error');
  }
</script>

<svelte:head>
  <title>Upload Music - Genesis Music</title>
  <meta name="description" content="Upload audio files or YouTube videos for AI-powered transcription" />
</svelte:head>

<Section spacing="lg" background="gray">
  <Container>
    <div class="page-header">
      <h1 class="page-title">Upload Music</h1>
      <p class="page-subtitle">Transform any music into professional notation and tabs</p>
    </div>
    
    <!-- Tab Navigation -->
    <div class="tab-nav">
      <button
        class="tab-button"
        class:active={activeTab === 'youtube'}
        on:click={() => activeTab = 'youtube'}
      >
        <span class="tab-icon">🎬</span>
        YouTube
      </button>
      <button
        class="tab-button"
        class:active={activeTab === 'file'}
        on:click={() => activeTab = 'file'}
      >
        <span class="tab-icon">📁</span>
        File Upload
      </button>
      <button
        class="tab-button"
        class:active={activeTab === 'record'}
        on:click={() => activeTab = 'record'}
      >
        <span class="tab-icon">🎤</span>
        Record
      </button>
    </div>
    
    <!-- Tab Content -->
    <div class="tab-content">
      {#if activeTab === 'youtube'}
        <YouTubeTranscriber
          on:transcription-started={handleTranscriptionStarted}
          on:transcription-completed={handleTranscriptionCompleted}
          on:transcription-failed={handleTranscriptionFailed}
        />
      {:else if activeTab === 'file'}
        <Card variant="elevated" class="upload-card">
          <div
            class="upload-zone"
            class:drag-over={dragOver}
            on:dragover={handleDragOver}
            on:dragleave={handleDragLeave}
            on:drop={handleDrop}
          >
            {#if !isUploading}
              <div class="upload-content">
                <div class="upload-icon">📁</div>
                <h3 class="upload-title">Drop your file here</h3>
                <p class="upload-description">or click to browse</p>
                
                <div class="supported-formats">
                  <p class="formats-label">Supported formats:</p>
                  <div class="format-badges">
                    <span class="format-badge audio">Audio: MP3, WAV, OGG, M4A, FLAC</span>
                    <span class="format-badge midi">MIDI: MID, MIDI</span>
                    <span class="format-badge score">Score: MusicXML, Guitar Pro</span>
                  </div>
                </div>
                
                <input
                  bind:this={fileInput}
                  type="file"
                  accept=".mp3,.wav,.ogg,.m4a,.flac,.mid,.midi,.xml,.mxl,.musicxml,.gp,.gp3,.gp4,.gp5,.gpx"
                  on:change={handleFileSelect}
                  class="file-input"
                />
                
                <Button
                  variant="primary"
                  size="lg"
                  on:click={() => fileInput.click()}
                >
                  Choose File
                </Button>
              </div>
            {:else}
              <div class="upload-progress">
                <div class="progress-icon">⏳</div>
                <h3 class="progress-title">Processing file...</h3>
                <div class="progress-bar-container">
                  <div class="progress-bar">
                    <div 
                      class="progress-fill"
                      style="width: {uploadProgress}%"
                    />
                  </div>
                  <span class="progress-text">{uploadProgress}%</span>
                </div>
              </div>
            {/if}
          </div>
          
          <!-- File Options -->
          {#if !isUploading}
            <div class="file-options">
              <h4 class="options-title">Transcription Settings</h4>
              
              <div class="option-row">
                <label class="option-label">Instrument:</label>
                <select bind:value={fileOptions.instrument} class="option-select">
                  <option value="guitar">Guitar</option>
                  <option value="bass">Bass</option>
                  <option value="piano">Piano</option>
                  <option value="drums">Drums</option>
                </select>
              </div>
              
              <div class="option-row">
                <label class="option-label">Difficulty:</label>
                <select bind:value={fileOptions.difficulty} class="option-select">
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              
              <div class="option-row">
                <label class="checkbox-option">
                  <input type="checkbox" bind:checked={fileOptions.includeTab} />
                  <span>Generate Tab</span>
                </label>
                <label class="checkbox-option">
                  <input type="checkbox" bind:checked={fileOptions.includeMidi} />
                  <span>Generate MIDI</span>
                </label>
              </div>
            </div>
          {/if}
        </Card>
      {:else if activeTab === 'record'}
        <Card variant="elevated" class="record-card">
          <div class="record-content">
            <div class="record-icon">🎤</div>
            <h3 class="record-title">Record Audio</h3>
            <p class="record-description">
              Record yourself playing and get instant transcription
            </p>
            
            <Button variant="primary" size="lg" disabled>
              Coming Soon
            </Button>
            
            <p class="coming-soon-text">
              Audio recording feature will be available in the next update
            </p>
          </div>
        </Card>
      {/if}
    </div>
    
    <!-- Recent Transcriptions -->
    {#if $transcriptionJobs.size > 0}
      <div class="recent-section">
        <h2 class="section-title">Recent Transcriptions</h2>
        <Grid cols={{ xs: 1, md: 2, lg: 3 }} gap={4}>
          {#each Array.from($transcriptionJobs.values()).slice(0, 6) as job}
            <Card variant="bordered" hoverable class="job-card">
              <div class="job-status" class:completed={job.status === 'completed'}>
                {#if job.status === 'completed'}
                  ✓ Completed
                {:else if job.status === 'processing'}
                  ⏳ Processing
                {:else if job.status === 'failed'}
                  ✗ Failed
                {:else}
                  ⏸ Pending
                {/if}
              </div>
              <div class="job-id">#{job.id.slice(0, 8)}</div>
              {#if job.score}
                <Button
                  size="sm"
                  variant="ghost"
                  on:click={() => goto(`/notation?scoreId=${job.score.id}`)}
                >
                  View Score
                </Button>
              {/if}
            </Card>
          {/each}
        </Grid>
      </div>
    {/if}
  </Container>
</Section>

<style>
  .page-header {
    text-align: center;
    margin-bottom: 3rem;
  }
  
  .page-title {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }
  
  .page-subtitle {
    font-size: 1.25rem;
    color: var(--text-secondary);
  }
  
  .tab-nav {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 2rem;
    background: var(--bg-primary);
    padding: 0.5rem;
    border-radius: 0.75rem;
  }
  
  .tab-button {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    border-radius: 0.5rem;
    color: var(--text-secondary);
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .tab-button:hover {
    background: var(--bg-secondary);
  }
  
  .tab-button.active {
    background: var(--primary-500);
    color: white;
  }
  
  .tab-icon {
    font-size: 1.25rem;
  }
  
  :global(.upload-card),
  :global(.record-card) {
    padding: 2rem;
  }
  
  .upload-zone {
    border: 3px dashed var(--border-color);
    border-radius: 1rem;
    padding: 3rem;
    text-align: center;
    transition: all 0.3s;
    cursor: pointer;
    position: relative;
  }
  
  .upload-zone:hover,
  .upload-zone.drag-over {
    border-color: var(--primary-500);
    background: var(--bg-secondary);
  }
  
  .upload-icon,
  .record-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }
  
  .upload-title,
  .record-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }
  
  .upload-description,
  .record-description {
    color: var(--text-secondary);
    margin-bottom: 2rem;
  }
  
  .supported-formats {
    margin: 2rem 0;
  }
  
  .formats-label {
    font-size: 0.875rem;
    color: var(--text-tertiary);
    margin-bottom: 0.5rem;
  }
  
  .format-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
  }
  
  .format-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
  }
  
  .format-badge.audio {
    background: rgba(14, 165, 233, 0.1);
    color: var(--primary-500);
  }
  
  .format-badge.midi {
    background: rgba(168, 85, 247, 0.1);
    color: #a855f7;
  }
  
  .format-badge.score {
    background: rgba(34, 197, 94, 0.1);
    color: #22c55e;
  }
  
  .file-input {
    display: none;
  }
  
  .upload-progress {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .progress-icon {
    font-size: 3rem;
    animation: spin 2s linear infinite;
    margin-bottom: 1rem;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  .progress-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 1.5rem;
  }
  
  .progress-bar-container {
    width: 100%;
    max-width: 300px;
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
  
  .progress-text {
    display: block;
    text-align: center;
    font-weight: 600;
    color: var(--primary-500);
  }
  
  .file-options {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid var(--border-color);
  }
  
  .options-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 1rem;
  }
  
  .option-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  .option-label {
    min-width: 100px;
    font-weight: 500;
    color: var(--text-primary);
  }
  
  .option-select {
    flex: 1;
    padding: 0.5rem;
    border: 2px solid var(--border-color);
    border-radius: 0.5rem;
    background: var(--bg-primary);
    color: var(--text-primary);
  }
  
  .checkbox-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    color: var(--text-primary);
  }
  
  .record-content {
    text-align: center;
    padding: 2rem;
  }
  
  .coming-soon-text {
    margin-top: 1rem;
    color: var(--text-tertiary);
    font-style: italic;
  }
  
  .recent-section {
    margin-top: 3rem;
  }
  
  .section-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 1.5rem;
  }
  
  :global(.job-card) {
    padding: 1rem;
  }
  
  .job-status {
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
    color: var(--text-secondary);
  }
  
  .job-status.completed {
    color: var(--success-500);
  }
  
  .job-id {
    font-family: monospace;
    font-size: 0.875rem;
    color: var(--text-tertiary);
    margin-bottom: 1rem;
  }
</style>