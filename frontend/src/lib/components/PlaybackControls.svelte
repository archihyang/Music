<script lang="ts">
  let isPlaying = false;
  let currentTime = 0;
  let duration = 240; // 임시값 (4분)
  let playbackSpeed = 1;
  let volume = 0.8;
  
  const speeds = [0.5, 0.75, 1, 1.25, 1.5];
  
  function togglePlayback() {
    isPlaying = !isPlaying;
    // TODO: 실제 재생 로직 구현
  }
  
  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  function handleSeek(event: Event) {
    const input = event.target as HTMLInputElement;
    currentTime = Number(input.value);
  }
  
  function handleVolumeChange(event: Event) {
    const input = event.target as HTMLInputElement;
    volume = Number(input.value);
  }
  
  function changeSpeed(delta: number) {
    const currentIndex = speeds.indexOf(playbackSpeed);
    const newIndex = Math.max(0, Math.min(speeds.length - 1, currentIndex + delta));
    playbackSpeed = speeds[newIndex];
  }
</script>

<div class="playback-controls">
  <div class="controls-main">
    <!-- Play/Pause -->
    <button
      on:click={togglePlayback}
      class="play-button"
      aria-label={isPlaying ? 'Pause' : 'Play'}
    >
      {#if isPlaying}
        <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
        </svg>
      {:else}
        <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z"/>
        </svg>
      {/if}
    </button>
    
    <!-- Time Display -->
    <div class="time-display">
      <span>{formatTime(currentTime)}</span>
      <span class="text-gray-500">/</span>
      <span>{formatTime(duration)}</span>
    </div>
    
    <!-- Progress Bar -->
    <div class="progress-container">
      <input
        type="range"
        min="0"
        max={duration}
        value={currentTime}
        on:input={handleSeek}
        class="progress-slider"
      />
    </div>
    
    <!-- Speed Control -->
    <div class="speed-control">
      <button
        on:click={() => changeSpeed(-1)}
        class="speed-button"
        disabled={playbackSpeed === speeds[0]}
      >
        -
      </button>
      <span class="speed-display">{playbackSpeed}x</span>
      <button
        on:click={() => changeSpeed(1)}
        class="speed-button"
        disabled={playbackSpeed === speeds[speeds.length - 1]}
      >
        +
      </button>
    </div>
    
    <!-- Volume Control -->
    <div class="volume-control">
      <svg class="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
      </svg>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        on:input={handleVolumeChange}
        class="volume-slider"
      />
    </div>
  </div>
  
  <!-- Additional Controls -->
  <div class="controls-secondary">
    <button class="control-button" title="루프 설정">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    </button>
    <button class="control-button" title="메트로놈">
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2L6 7v10c0 3.3 2.7 6 6 6s6-2.7 6-6V7l-6-5zm0 2.5L16 8v9c0 2.2-1.8 4-4 4s-4-1.8-4-4V8l4-3.5z"/>
      </svg>
    </button>
    <button class="control-button" title="설정">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>
  </div>
</div>

<style>
  .playback-controls {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .controls-main {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .play-button {
    width: 3rem;
    height: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #3b82f6;
    border-radius: 50%;
    transition: all 0.2s;
  }
  
  .play-button:hover {
    background-color: #2563eb;
    transform: scale(1.05);
  }
  
  .time-display {
    font-family: monospace;
    font-size: 0.875rem;
    min-width: 80px;
  }
  
  .progress-container {
    flex: 1;
  }
  
  .progress-slider {
    width: 100%;
    height: 6px;
    background: #374151;
    outline: none;
    border-radius: 3px;
    cursor: pointer;
  }
  
  .speed-control {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background-color: #374151;
    border-radius: 0.375rem;
    padding: 0.25rem 0.5rem;
  }
  
  .speed-button {
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.25rem;
    transition: all 0.2s;
  }
  
  .speed-button:hover:not(:disabled) {
    background-color: #4b5563;
  }
  
  .speed-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .speed-display {
    font-family: monospace;
    font-size: 0.875rem;
    min-width: 3rem;
    text-align: center;
  }
  
  .volume-control {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .volume-slider {
    width: 80px;
    height: 4px;
    background: #374151;
    outline: none;
    border-radius: 2px;
    cursor: pointer;
  }
  
  .controls-secondary {
    display: flex;
    gap: 0.5rem;
  }
  
  .control-button {
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #374151;
    border-radius: 0.375rem;
    transition: all 0.2s;
  }
  
  .control-button:hover {
    background-color: #4b5563;
  }
  
  /* Range input styling */
  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
  }
  
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    background: #3b82f6;
    border-radius: 50%;
    cursor: pointer;
  }
  
  input[type="range"]::-moz-range-thumb {
    width: 14px;
    height: 14px;
    background: #3b82f6;
    border-radius: 50%;
    cursor: pointer;
    border: none;
  }
</style>
