# Genesis Music UI Component Specifications
*Detailed Technical Specifications for Frontend Components*

## 🎸 TabViewer Component

### Overview
The core component for displaying guitar tablature with synchronized audio playback.

### Technical Requirements

```typescript
interface TabViewerProps {
  tabData: TabData;
  audioUrl?: string;
  options: {
    enablePlayback: boolean;
    enableLoop: boolean;
    enableZoom: boolean;
    enableAutoscroll: boolean;
    darkMode: boolean;
  };
  onProgressUpdate?: (progress: number) => void;
  onSectionComplete?: (section: string) => void;
}

interface TabData {
  measures: Measure[];
  tuning: string[];
  tempo: number;
  timeSignature: [number, number];
  key: string;
  capo?: number;
}
```

### Features Implementation

#### 1. Rendering Engine Selection
```javascript
// Option A: VexFlow (More established)
import Vex from 'vexflow';

// Option B: AlphaTab (Better guitar features)
import { AlphaTabApi, Settings } from '@coderline/alphatab';

// Recommended: AlphaTab for better guitar-specific features
const settings = new Settings();
settings.player.enablePlayer = true;
settings.player.enableCursor = true;
settings.display.layoutMode = 'horizontal';
```

#### 2. Synchronization Logic
```javascript
class TabAudioSync {
  private audioContext: AudioContext;
  private currentTime: number = 0;
  private measures: MeasureTimestamp[];
  
  syncTabToAudio(audioTime: number) {
    const currentMeasure = this.findMeasureAtTime(audioTime);
    this.scrollToMeasure(currentMeasure);
    this.highlightCurrentNotes(currentMeasure, audioTime);
  }
  
  private findMeasureAtTime(time: number): number {
    return this.measures.findIndex(m => 
      m.startTime <= time && m.endTime > time
    );
  }
}
```

#### 3. Interactive Features
```svelte
<!-- TabViewer.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { alphaTab } from '$lib/alphatab';
  
  let container: HTMLElement;
  let api: AlphaTabApi;
  let playbackSpeed = 1.0;
  let loopStart: number | null = null;
  let loopEnd: number | null = null;
  
  function handleSpeedChange(speed: number) {
    api.playbackSpeed = speed;
  }
  
  function setLoop(start: number, end: number) {
    api.playbackRange = { start, end };
  }
  
  function handleZoom(delta: number) {
    api.settings.display.scale += delta * 0.1;
    api.updateSettings();
    api.render();
  }
</script>

<div class="tab-viewer">
  <div class="controls">
    <button on:click={() => api.play()}>Play</button>
    <button on:click={() => api.pause()}>Pause</button>
    <input type="range" min="0.25" max="2" step="0.25" 
           bind:value={playbackSpeed} 
           on:change={() => handleSpeedChange(playbackSpeed)} />
    <button on:click={() => handleZoom(1)}>Zoom In</button>
    <button on:click={() => handleZoom(-1)}>Zoom Out</button>
  </div>
  
  <div bind:this={container} class="tab-container"></div>
  
  <div class="timeline">
    <!-- Waveform visualization here -->
  </div>
</div>
```

### Visual Design Specifications

```css
/* Tab display styling */
.tab-viewer {
  --tab-background: var(--color-surface);
  --tab-foreground: var(--color-text);
  --tab-highlight: var(--color-primary);
  --tab-measure-line: var(--color-border);
  
  /* Dimensions */
  --tab-line-height: 24px;
  --tab-measure-width: 200px;
  --tab-font-size: 14px;
  
  /* Responsive scaling */
  @media (max-width: 768px) {
    --tab-measure-width: 150px;
    --tab-font-size: 12px;
  }
}

/* Dark mode */
.dark .tab-viewer {
  --tab-background: #1a1a1a;
  --tab-foreground: #e0e0e0;
  --tab-highlight: #ff6b35;
}
```

## 🎵 AudioPlayer Component

### Technical Architecture

```typescript
class AudioEngine {
  private audioContext: AudioContext;
  private sourceNode: AudioBufferSourceNode | null;
  private gainNode: GainNode;
  private analyser: AnalyserNode;
  
  // Playback rate without pitch change
  private pitchShift: PitchShiftNode;
  
  async loadAudio(url: string) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
  }
  
  setPlaybackRate(rate: number) {
    // Use SoundTouch or similar library for pitch preservation
    this.pitchShift.pitch = 1.0 / rate;
    this.sourceNode.playbackRate.value = rate;
  }
  
  setLoop(startTime: number, endTime: number) {
    this.loopStart = startTime;
    this.loopEnd = endTime;
    this.sourceNode.loopStart = startTime;
    this.sourceNode.loopEnd = endTime;
    this.sourceNode.loop = true;
  }
}
```

### UI Implementation

```svelte
<!-- AudioPlayer.svelte -->
<script lang="ts">
  import WaveSurfer from 'wavesurfer.js';
  import RegionsPlugin from 'wavesurfer.js/plugins/regions';
  
  let wavesurfer: WaveSurfer;
  let regions: RegionsPlugin;
  
  onMount(() => {
    wavesurfer = WaveSurfer.create({
      container: '#waveform',
      waveColor: '#4F4F4F',
      progressColor: '#FF6B35',
      cursorColor: '#FFFFFF',
      barWidth: 2,
      responsive: true,
      plugins: [
        RegionsPlugin.create()
      ]
    });
    
    // Loop region creation
    regions.on('region-created', (region) => {
      dispatch('loop-set', { start: region.start, end: region.end });
    });
  });
</script>

<div class="audio-player">
  <div class="transport-controls">
    <button class="play-pause" on:click={togglePlayPause}>
      {#if isPlaying}
        <PauseIcon />
      {:else}
        <PlayIcon />
      {/if}
    </button>
    
    <div class="time-display">
      <span>{formatTime(currentTime)}</span>
      <span>/</span>
      <span>{formatTime(duration)}</span>
    </div>
    
    <div class="speed-control">
      <label>Speed</label>
      <select bind:value={playbackSpeed}>
        <option value="0.25">0.25x</option>
        <option value="0.5">0.5x</option>
        <option value="0.75">0.75x</option>
        <option value="1" selected>1x</option>
        <option value="1.25">1.25x</option>
        <option value="1.5">1.5x</option>
      </select>
    </div>
    
    <button class="loop-toggle" class:active={loopEnabled} on:click={toggleLoop}>
      <LoopIcon />
    </button>
  </div>
  
  <div id="waveform" class="waveform-container"></div>
  
  <div class="volume-control">
    <VolumeIcon />
    <input type="range" min="0" max="100" bind:value={volume} />
  </div>
</div>
```

## 🎹 FretboardView Component

### 3D Fretboard Implementation

```typescript
// Using Three.js for 3D visualization
import * as THREE from 'three';

class Fretboard3D {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private fretboard: THREE.Group;
  
  createFretboard() {
    // Fretboard geometry
    const neckGeometry = new THREE.BoxGeometry(100, 10, 2);
    const neckMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x8B4513,
      map: this.loadWoodTexture()
    });
    
    // Frets
    for (let i = 0; i <= 24; i++) {
      const fretGeometry = new THREE.BoxGeometry(0.5, 10, 0.3);
      const fretMaterial = new THREE.MeshPhongMaterial({ color: 0xC0C0C0 });
      const fret = new THREE.Mesh(fretGeometry, fretMaterial);
      fret.position.x = this.calculateFretPosition(i);
      this.fretboard.add(fret);
    }
    
    // Strings
    for (let i = 0; i < 6; i++) {
      const stringGeometry = new THREE.CylinderGeometry(0.1, 0.1, 100);
      const stringMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
      const string = new THREE.Mesh(stringGeometry, stringMaterial);
      string.rotation.z = Math.PI / 2;
      string.position.y = (i - 2.5) * 1.5;
      this.fretboard.add(string);
    }
  }
  
  highlightNote(string: number, fret: number) {
    const noteGeometry = new THREE.SphereGeometry(0.5);
    const noteMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xFF6B35,
      emissive: 0xFF6B35,
      emissiveIntensity: 0.5
    });
    const note = new THREE.Mesh(noteGeometry, noteMaterial);
    
    note.position.x = this.calculateFretPosition(fret) - 2;
    note.position.y = (string - 3.5) * 1.5;
    note.position.z = 1.5;
    
    this.fretboard.add(note);
    
    // Animate the note
    this.animateNote(note);
  }
}
```

### 2D Fallback Implementation

```svelte
<!-- FretboardView.svelte -->
<script lang="ts">
  export let currentNotes: Note[] = [];
  export let tuning = ['E', 'A', 'D', 'G', 'B', 'E'];
  export let fretCount = 24;
  export let leftHanded = false;
  
  function getFretPosition(fret: number): number {
    // Calculate fret position using the 12th root of 2
    const scale = 25.5; // typical scale length in inches
    return scale - (scale / Math.pow(2, fret / 12));
  }
</script>

<div class="fretboard" class:left-handed={leftHanded}>
  <div class="strings">
    {#each tuning as note, stringIndex}
      <div class="string" data-string={stringIndex + 1}>
        <span class="open-note">{note}</span>
        {#each Array(fretCount) as _, fretIndex}
          <div 
            class="fret" 
            data-fret={fretIndex + 1}
            style="width: {getFretWidth(fretIndex)}px"
          >
            {#if currentNotes.find(n => 
              n.string === stringIndex + 1 && 
              n.fret === fretIndex + 1
            )}
              <div class="note active">
                <span class="finger-number">
                  {getFingerNumber(stringIndex + 1, fretIndex + 1)}
                </span>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/each}
  </div>
  
  <div class="fret-markers">
    {#each [3, 5, 7, 9, 12, 15, 17, 19, 21] as marker}
      <div class="marker" style="left: {getFretPosition(marker)}%">
        {#if marker === 12}
          <span class="double-dot">••</span>
        {:else}
          <span class="single-dot">•</span>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .fretboard {
    --fretboard-width: 100%;
    --fretboard-height: 200px;
    --string-color: #999;
    --fret-color: #ccc;
    --note-color: var(--color-primary);
    
    position: relative;
    width: var(--fretboard-width);
    height: var(--fretboard-height);
    background: linear-gradient(90deg, #8B4513 0%, #654321 100%);
    border-radius: 4px;
    overflow-x: auto;
  }
  
  .string {
    position: relative;
    height: calc(100% / 6);
    border-bottom: 2px solid var(--string-color);
    display: flex;
  }
  
  .fret {
    position: relative;
    border-right: 2px solid var(--fret-color);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .note.active {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: var(--note-color);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: pulse 0.5s ease-in-out;
  }
  
  @keyframes pulse {
    0% { transform: scale(0); opacity: 0; }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); opacity: 1; }
  }
</style>
```

## 📊 TheoryPanel Component

### Implementation

```svelte
<!-- TheoryPanel.svelte -->
<script lang="ts">
  import { ChordDiagram } from '$lib/components/ChordDiagram.svelte';
  import { ScaleVisualizer } from '$lib/components/ScaleVisualizer.svelte';
  
  export let analysis: TheoryAnalysis;
  
  let selectedScale: Scale;
  let chordProgression: Chord[];
</script>

<div class="theory-panel">
  <div class="key-signature">
    <h3>Key: {analysis.key}</h3>
    <div class="confidence-meter">
      <div class="confidence-fill" style="width: {analysis.confidence * 100}%"></div>
    </div>
  </div>
  
  <div class="chord-progression">
    <h3>Chord Progression</h3>
    <div class="chord-timeline">
      {#each analysis.chords as chord, i}
        <div class="chord-block" style="width: {chord.duration}%">
          <span class="chord-name">{chord.name}</span>
          <span class="chord-roman">{chord.roman}</span>
        </div>
      {/each}
    </div>
  </div>
  
  <div class="suggested-scales">
    <h3>Suggested Scales</h3>
    <div class="scale-list">
      {#each analysis.suggestedScales as scale}
        <button 
          class="scale-option" 
          class:selected={selectedScale === scale}
          on:click={() => selectScale(scale)}
        >
          {scale.name}
        </button>
      {/each}
    </div>
    
    {#if selectedScale}
      <ScaleVisualizer scale={selectedScale} />
    {/if}
  </div>
  
  <div class="practice-tips">
    <h3>Practice Tips</h3>
    <ul>
      {#each analysis.tips as tip}
        <li>{tip}</li>
      {/each}
    </ul>
  </div>
</div>
```

## 🎯 YouTubeInput Component

### Advanced Implementation

```svelte
<!-- YouTubeInput.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  
  const dispatch = createEventDispatcher();
  
  let url = '';
  let isProcessing = false;
  let error = '';
  let recentUrls: string[] = [];
  
  const URL_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
  
  async function handleSubmit() {
    if (!URL_REGEX.test(url)) {
      error = 'Please enter a valid YouTube URL';
      return;
    }
    
    isProcessing = true;
    error = '';
    
    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      const data = await response.json();
      
      if (data.success) {
        dispatch('transcription-started', { jobId: data.jobId });
        addToRecent(url);
        url = '';
      } else {
        error = data.error || 'Failed to process URL';
      }
    } catch (e) {
      error = 'Network error. Please try again.';
    } finally {
      isProcessing = false;
    }
  }
  
  function addToRecent(url: string) {
    recentUrls = [url, ...recentUrls.filter(u => u !== url)].slice(0, 5);
    localStorage.setItem('recentUrls', JSON.stringify(recentUrls));
  }
</script>

<div class="youtube-input">
  <form on:submit|preventDefault={handleSubmit}>
    <div class="input-group">
      <input
        type="url"
        bind:value={url}
        placeholder="Paste YouTube URL here..."
        disabled={isProcessing}
        class:error={error}
      />
      
      <button type="submit" disabled={isProcessing || !url}>
        {#if isProcessing}
          <span class="spinner"></span>
          Processing...
        {:else}
          Convert to Tab
        {/if}
      </button>
    </div>
    
    {#if error}
      <div class="error-message" transition:fade>
        {error}
      </div>
    {/if}
  </form>
  
  {#if recentUrls.length > 0}
    <div class="recent-urls" transition:fly={{ y: 20 }}>
      <h4>Recent URLs</h4>
      <ul>
        {#each recentUrls as recentUrl}
          <li>
            <button on:click={() => url = recentUrl}>
              {getVideoTitle(recentUrl)}
            </button>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</div>

<style>
  .youtube-input {
    max-width: 600px;
    margin: 0 auto;
  }
  
  .input-group {
    display: flex;
    gap: 1rem;
  }
  
  input {
    flex: 1;
    padding: 1rem;
    border: 2px solid var(--color-border);
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.2s;
  }
  
  input:focus {
    outline: none;
    border-color: var(--color-primary);
  }
  
  input.error {
    border-color: var(--color-error);
  }
  
  button[type="submit"] {
    padding: 1rem 2rem;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }
  
  button[type="submit"]:hover:not(:disabled) {
    background: var(--color-primary-dark);
  }
  
  button[type="submit"]:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid transparent;
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
```

## 📱 Mobile Responsiveness Strategy

### Touch Gesture Implementation

```typescript
class TouchGestureHandler {
  private startX: number = 0;
  private startY: number = 0;
  private scale: number = 1;
  
  handlePinchZoom(event: TouchEvent) {
    if (event.touches.length === 2) {
      const distance = Math.hypot(
        event.touches[0].clientX - event.touches[1].clientX,
        event.touches[0].clientY - event.touches[1].clientY
      );
      
      this.scale = Math.min(Math.max(0.5, distance / 100), 3);
      this.updateTabScale(this.scale);
    }
  }
  
  handleSwipe(event: TouchEvent) {
    const deltaX = event.touches[0].clientX - this.startX;
    
    if (Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        this.navigatePrevious();
      } else {
        this.navigateNext();
      }
    }
  }
}
```

## 🎨 Theme System

```typescript
// theme.ts
export const themes = {
  light: {
    primary: '#FF6B35',
    secondary: '#004E89',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#1D3557',
    textSecondary: '#6B7280'
  },
  dark: {
    primary: '#FF8C5A',
    secondary: '#0066B3',
    background: '#0F0F0F',
    surface: '#1A1A1A',
    text: '#E0E0E0',
    textSecondary: '#9CA3AF'
  },
  stage: {
    primary: '#FF0000',
    secondary: '#00FF00',
    background: '#000000',
    surface: '#111111',
    text: '#FFFFFF',
    textSecondary: '#CCCCCC'
  }
};
```

## 🚀 Performance Optimization

### Code Splitting Strategy

```javascript
// routes/+layout.ts
export const load = async () => {
  // Lazy load heavy components
  const modules = {
    TabViewer: () => import('$lib/components/TabViewer.svelte'),
    AudioPlayer: () => import('$lib/components/AudioPlayer.svelte'),
    FretboardView: () => import('$lib/components/FretboardView.svelte')
  };
  
  return { modules };
};
```

### Virtual Scrolling for Long Tabs

```typescript
class VirtualScroller {
  private visibleRange: { start: number; end: number };
  private itemHeight: number = 100;
  
  calculateVisibleItems(scrollTop: number, containerHeight: number) {
    const start = Math.floor(scrollTop / this.itemHeight);
    const end = Math.ceil((scrollTop + containerHeight) / this.itemHeight);
    
    return this.items.slice(start, end);
  }
}
```

---

*These specifications provide the technical foundation for implementing Genesis Music's frontend components with industry-leading features and performance.*