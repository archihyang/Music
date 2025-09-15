# Genesis Music - Component Interface Design

## 🎨 Frontend Component Architecture

### Core Component Hierarchy
```
App
├── Layout
│   ├── Header
│   │   ├── Navigation
│   │   └── UserMenu
│   └── Footer
├── Pages
│   ├── HomePage
│   ├── TranscribePage
│   ├── ResultPage
│   └── ProfilePage
└── Components
    ├── Audio
    │   ├── AudioUploader
    │   ├── YouTubeInput
    │   └── AudioPlayer
    ├── Visualization
    │   ├── TabViewer
    │   ├── MusicNotation
    │   └── TheoryAnalyzer
    └── Common
        ├── ProgressTracker
        ├── ErrorBoundary
        └── LoadingSpinner
```

## 📦 Component Interfaces

### 1. AudioUploader Component
```typescript
// AudioUploader.svelte
interface AudioUploaderProps {
  maxFileSize?: number; // in MB, default 50
  acceptedFormats?: string[]; // default: ['mp3', 'wav', 'm4a']
  onUpload: (file: File) => Promise<void>;
  onProgress?: (progress: number) => void;
  disabled?: boolean;
}

interface AudioUploaderEvents {
  'file:selected': { file: File };
  'upload:start': { file: File };
  'upload:progress': { percent: number };
  'upload:complete': { jobId: string };
  'upload:error': { error: Error };
}

interface AudioUploaderSlots {
  default: {}; // Custom upload button
  preview: { file: File }; // File preview area
  error: { error: Error }; // Error message display
}

// Usage Example
<AudioUploader
  maxFileSize={100}
  acceptedFormats={['mp3', 'wav']}
  on:upload:complete={handleUploadComplete}
  let:progress
>
  <div class="upload-area">
    <Icon name="upload" />
    <p>Drop your audio file here or click to browse</p>
    {#if progress > 0}
      <ProgressBar value={progress} />
    {/if}
  </div>
</AudioUploader>
```

### 2. TabViewer Component
```typescript
// TabViewer.svelte
interface TabViewerProps {
  tabData: TabNotation;
  audioUrl?: string;
  options?: TabViewerOptions;
  interactive?: boolean;
  printable?: boolean;
}

interface TabViewerOptions {
  notation: 'tab' | 'standard' | 'both';
  zoom: number; // 0.5 to 2.0
  scrollSync: boolean;
  showMeasureNumbers: boolean;
  showTechniques: boolean;
  colorScheme: 'light' | 'dark' | 'auto';
}

interface TabNotation {
  measures: Measure[];
  metadata: {
    title?: string;
    artist?: string;
    tempo: number;
    timeSignature: string;
    keySignature: string;
    tuning: string;
  };
}

interface Measure {
  number: number;
  notes: Note[];
  chords?: Chord[];
  lyrics?: string;
}

interface Note {
  string: 1 | 2 | 3 | 4 | 5 | 6;
  fret: number;
  duration: Duration;
  techniques?: Technique[];
  velocity?: number;
}

type Duration = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth';
type Technique = 'hammer' | 'pull' | 'slide' | 'bend' | 'vibrato' | 'palm-mute';

// Component Methods
interface TabViewerMethods {
  zoomIn(): void;
  zoomOut(): void;
  resetZoom(): void;
  scrollToMeasure(measure: number): void;
  print(): void;
  exportPDF(): Promise<Blob>;
  exportMusicXML(): string;
}

// Usage Example
<TabViewer
  {tabData}
  audioUrl={audioFile}
  options={{
    notation: 'tab',
    zoom: 1.0,
    scrollSync: true
  }}
  bind:this={tabViewerRef}
>
  <div slot="toolbar">
    <button on:click={() => tabViewerRef.zoomIn()}>Zoom In</button>
    <button on:click={() => tabViewerRef.print()}>Print</button>
  </div>
</TabViewer>
```

### 3. AudioPlayer Component
```typescript
// AudioPlayer.svelte
interface AudioPlayerProps {
  src: string;
  tabData?: TabNotation;
  autoplay?: boolean;
  loop?: boolean;
  volume?: number; // 0.0 to 1.0
}

interface AudioPlayerState {
  playing: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  tempo: number; // 0.5x to 2.0x
  loopStart?: number;
  loopEnd?: number;
}

interface AudioPlayerMethods {
  play(): Promise<void>;
  pause(): void;
  stop(): void;
  seek(time: number): void;
  setTempo(tempo: number): void;
  setLoop(start: number, end: number): void;
  clearLoop(): void;
  syncWithTab(measure: number): void;
}

// Waveform Visualizer Sub-component
interface WaveformProps {
  audioBuffer: AudioBuffer;
  currentTime: number;
  duration: number;
  markers?: Marker[];
  onSeek: (time: number) => void;
}

interface Marker {
  time: number;
  label: string;
  color?: string;
}

// Usage Example
<AudioPlayer
  src={audioUrl}
  {tabData}
  bind:this={playerRef}
  on:timeupdate={handleTimeUpdate}
  let:playing
  let:currentTime
  let:duration
>
  <div class="player-controls">
    <button on:click={() => playing ? playerRef.pause() : playerRef.play()}>
      {playing ? 'Pause' : 'Play'}
    </button>
    <Slider
      value={currentTime}
      max={duration}
      on:change={(e) => playerRef.seek(e.detail)}
    />
    <TempoControl
      on:change={(e) => playerRef.setTempo(e.detail)}
    />
  </div>
</AudioPlayer>
```

### 4. TheoryAnalyzer Component
```typescript
// TheoryAnalyzer.svelte
interface TheoryAnalyzerProps {
  analysis: TheoryAnalysis;
  interactive?: boolean;
  showDiagrams?: boolean;
}

interface TheoryAnalysis {
  key: KeySignature;
  scale: Scale;
  chordProgression: ChordProgression[];
  sections: Section[];
  style?: StyleAnalysis;
}

interface KeySignature {
  tonic: string;
  mode: 'major' | 'minor';
  accidentals: number;
}

interface Scale {
  name: string;
  notes: string[];
  intervals: string[];
  mode?: string;
}

interface ChordProgression {
  chord: string;
  roman: string; // Roman numeral
  measure: number;
  beat: number;
  duration: number;
  function: 'tonic' | 'subdominant' | 'dominant' | 'other';
}

interface Section {
  type: 'intro' | 'verse' | 'chorus' | 'bridge' | 'solo' | 'outro';
  startMeasure: number;
  endMeasure: number;
  key?: KeySignature;
  dynamics?: 'pp' | 'p' | 'mp' | 'mf' | 'f' | 'ff';
}

interface StyleAnalysis {
  genre: string;
  era: string;
  similarArtists: string[];
  techniques: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

// Chord Diagram Sub-component
interface ChordDiagramProps {
  chord: string;
  fingering?: number[];
  capo?: number;
  showNotes?: boolean;
  size?: 'small' | 'medium' | 'large';
}

// Usage Example
<TheoryAnalyzer
  {analysis}
  interactive={true}
  showDiagrams={true}
>
  <div slot="header">
    <h3>Music Theory Analysis</h3>
  </div>
  
  <div slot="chord-details" let:chord>
    <ChordDiagram
      chord={chord.name}
      size="medium"
      showNotes={true}
    />
    <ChordInfo {chord} />
  </div>
</TheoryAnalyzer>
```

### 5. ProgressTracker Component
```typescript
// ProgressTracker.svelte
interface ProgressTrackerProps {
  jobId: string;
  websocketUrl?: string;
  pollInterval?: number; // ms, for fallback polling
  showSteps?: boolean;
}

interface ProgressState {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  currentStep?: string;
  steps?: Step[];
  message?: string;
  error?: Error;
}

interface Step {
  name: string;
  status: 'pending' | 'active' | 'completed' | 'skipped';
  progress?: number;
  startTime?: Date;
  endTime?: Date;
}

// WebSocket Events
interface ProgressWebSocketEvents {
  'connect': void;
  'disconnect': void;
  'progress:update': { progress: number; message?: string };
  'step:complete': { step: string };
  'job:complete': { result: any };
  'job:error': { error: Error };
}

// Usage Example
<ProgressTracker
  {jobId}
  showSteps={true}
  on:complete={handleComplete}
  on:error={handleError}
  let:progress
  let:status
  let:currentStep
>
  <div class="progress-container">
    {#if status === 'processing'}
      <CircularProgress value={progress} />
      <p>{currentStep || 'Processing...'}</p>
    {:else if status === 'completed'}
      <Icon name="check-circle" color="green" />
      <p>Transcription complete!</p>
    {:else if status === 'failed'}
      <Icon name="x-circle" color="red" />
      <p>Transcription failed</p>
    {/if}
  </div>
</ProgressTracker>
```

## 🔌 Service Interfaces

### TranscriptionService
```typescript
// services/transcription.service.ts
export class TranscriptionService {
  private api: ApiClient;
  private ws: WebSocketClient;
  
  constructor(config: ServiceConfig) {
    this.api = new ApiClient(config.apiUrl);
    this.ws = new WebSocketClient(config.wsUrl);
  }
  
  async startTranscription(source: AudioSource): Promise<TranscriptionJob> {
    const formData = new FormData();
    
    if (source.type === 'file') {
      formData.append('audioFile', source.file);
    } else if (source.type === 'youtube') {
      formData.append('youtubeUrl', source.url);
    }
    
    formData.append('options', JSON.stringify(source.options));
    
    const response = await this.api.post('/transcribe', formData);
    return response.data;
  }
  
  async getStatus(jobId: string): Promise<JobStatus> {
    const response = await this.api.get(`/transcribe/${jobId}`);
    return response.data;
  }
  
  async getResult(jobId: string, format: ResultFormat = 'json'): Promise<TranscriptionResult> {
    const response = await this.api.get(`/transcribe/${jobId}/result`, {
      params: { format }
    });
    return response.data;
  }
  
  subscribeToProgress(jobId: string, callback: ProgressCallback): () => void {
    this.ws.emit('subscribe:job', jobId);
    
    const handlers = {
      'progress:update': callback.onProgress,
      'job:complete': callback.onComplete,
      'job:error': callback.onError
    };
    
    Object.entries(handlers).forEach(([event, handler]) => {
      this.ws.on(event, handler);
    });
    
    // Return unsubscribe function
    return () => {
      this.ws.emit('unsubscribe:job', jobId);
      Object.keys(handlers).forEach(event => {
        this.ws.off(event);
      });
    };
  }
}

// Types
interface AudioSource {
  type: 'file' | 'youtube';
  file?: File;
  url?: string;
  options?: TranscriptionOptions;
}

interface TranscriptionOptions {
  tuning?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  includeTheory?: boolean;
}

interface ProgressCallback {
  onProgress: (progress: number) => void;
  onComplete: (result: TranscriptionResult) => void;
  onError: (error: Error) => void;
}

type ResultFormat = 'json' | 'musicxml' | 'midi' | 'pdf';
```

### AudioProcessingService
```typescript
// services/audio-processing.service.ts
export class AudioProcessingService {
  private audioContext: AudioContext;
  private analyser: AnalyserNode;
  
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
  }
  
  async loadAudio(url: string): Promise<AudioBuffer> {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return this.audioContext.decodeAudioData(arrayBuffer);
  }
  
  generateWaveform(audioBuffer: AudioBuffer, samples: number = 1000): Float32Array {
    const channelData = audioBuffer.getChannelData(0);
    const blockSize = Math.floor(channelData.length / samples);
    const waveform = new Float32Array(samples);
    
    for (let i = 0; i < samples; i++) {
      const start = blockSize * i;
      let sum = 0;
      
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(channelData[start + j]);
      }
      
      waveform[i] = sum / blockSize;
    }
    
    return waveform;
  }
  
  getFrequencyData(): Uint8Array {
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }
  
  changePlaybackRate(rate: number): void {
    // Implementation for tempo change
  }
}
```

## 🎨 Design System Integration

### Theme Configuration
```typescript
// design-system/theme.ts
export const theme = {
  colors: {
    primary: '#FF6B6B',
    secondary: '#4ECDC4',
    success: '#95E77E',
    warning: '#FFD93D',
    error: '#FF6B6B',
    
    text: {
      primary: '#2D3436',
      secondary: '#636E72',
      disabled: '#B2BEC3'
    },
    
    background: {
      primary: '#FFFFFF',
      secondary: '#F5F5F5',
      overlay: 'rgba(0, 0, 0, 0.5)'
    }
  },
  
  typography: {
    fontFamily: {
      sans: 'Inter, system-ui, sans-serif',
      mono: 'JetBrains Mono, monospace',
      music: 'Bravura, serif' // For music notation
    },
    
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem'
    }
  },
  
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem'
  },
  
  breakpoints: {
    mobile: '640px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1280px'
  },
  
  animation: {
    duration: {
      fast: '150ms',
      normal: '250ms',
      slow: '400ms'
    },
    
    easing: {
      linear: 'linear',
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    }
  }
};
```

### Component Styling Pattern
```svelte
<!-- Example Component with Theme -->
<script lang="ts">
  import { theme } from '$lib/design-system/theme';
  
  export let variant: 'primary' | 'secondary' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  
  $: buttonClass = `
    btn
    btn--${variant}
    btn--${size}
  `;
</script>

<button class={buttonClass}>
  <slot />
</button>

<style>
  .btn {
    font-family: var(--font-sans);
    border-radius: var(--radius-md);
    transition: all var(--duration-fast) var(--easing-ease);
  }
  
  .btn--primary {
    background-color: var(--color-primary);
    color: white;
  }
  
  .btn--secondary {
    background-color: var(--color-secondary);
    color: white;
  }
  
  .btn--sm {
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--text-sm);
  }
  
  .btn--md {
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--text-base);
  }
  
  .btn--lg {
    padding: var(--spacing-md) var(--spacing-lg);
    font-size: var(--text-lg);
  }
</style>
```