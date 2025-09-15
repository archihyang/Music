<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Button from './ui/Button.svelte';
  import Card from './ui/Card.svelte';
  import { errorHandler, safeExecute } from '$lib/utils/errorHandler';
  
  // Props
  export let scoreData: any = null;
  export let gpxFile: File | null = null;
  export let theme: 'light' | 'dark' = 'light';
  export let showControls = true;
  export let autoPlay = false;
  export let initialTempo = 120;
  
  // State
  let container: HTMLDivElement;
  let api: any = null;
  let isLoading = false;
  let isPlaying = false;
  let currentBeat = 0;
  let totalBeats = 0;
  let tempo = initialTempo;
  let volume = 80;
  let trackIndex = 0;
  let tracks: any[] = [];
  let selectedTrack: any = null;
  
  // Constants
  const MIN_TEMPO = 40;
  const MAX_TEMPO = 300;
  const TEMPO_STEP = 10;
  
  async function initializeAlphaTab() {
    if (!container) return;
    
    isLoading = true;
    
    await safeExecute(
      async () => {
        // Dynamic import to avoid SSR issues
        const alphaTab = await import('@coderline/alphatab');
        
        // Clear container
        container.innerHTML = '';
        
        // AlphaTab settings
        const settings = {
          core: {
            engine: 'html5',
            logLevel: 1,
            useWorkers: true,
            fontDirectory: '/fonts/'
          },
          display: {
            staveProfile: 'Tab',
            layoutMode: 'Page',
            startBar: 1,
            barCount: -1,
            barCountPerPartial: 4,
            scale: 1.0,
            stretchForce: 1.0,
            resources: {
              staffLineColor: theme === 'dark' ? '#e5e5e5' : '#000000',
              barNumberColor: theme === 'dark' ? '#a3a3a3' : '#666666',
              mainGlyphColor: theme === 'dark' ? '#ffffff' : '#000000',
              scoreInfoColor: theme === 'dark' ? '#d4d4d4' : '#333333'
            }
          },
          notation: {
            notationMode: 'GuitarPro',
            fingeringMode: 'SingleNoteEffectBand',
            elements: {
              scoreTitle: true,
              scoreSubTitle: true,
              scoreArtist: true,
              scoreAlbum: true,
              scoreWords: true,
              scoreMusic: true,
              scoreWordsAndMusic: true,
              scoreCopyright: true,
              guitarTuning: true,
              trackNames: true,
              chordDiagrams: true,
              parentheses: true,
              tempo: true,
              dynamics: true,
              tripletFeel: true,
              markers: true,
              vibrato: true,
              palmMutes: true,
              tapping: true,
              letRing: true,
              harmonics: true,
              pickStroke: true,
              pickSlide: true,
              bends: true,
              tremoloBar: true,
              slideIn: true,
              slideOut: true,
              tap: true,
              slap: true,
              pop: true
            }
          },
          player: {
            enablePlayer: true,
            enableCursor: true,
            enableUserInteraction: true,
            soundFont: '/soundfont/sonivox.sf2',
            scrollElement: container,
            scrollMode: 'continuous',
            scrollSpeed: 300,
            scrollOffsetX: 0,
            scrollOffsetY: 0
          }
        };
        
        // Create AlphaTab instance
        api = new alphaTab.AlphaTabApi(container, settings);
        
        // Event listeners
        api.scoreLoaded.on((score) => {
          console.log('Score loaded:', score.title);
          tracks = score.tracks;
          if (tracks.length > 0) {
            selectedTrack = tracks[0];
            api.renderTracks([selectedTrack]);
          }
          totalBeats = score.masterBars.length * 4; // Approximate
        });
        
        api.renderStarted.on(() => {
          isLoading = true;
        });
        
        api.renderFinished.on(() => {
          isLoading = false;
        });
        
        api.playerReady.on(() => {
          console.log('Player ready');
        });
        
        api.playerStateChanged.on((args) => {
          isPlaying = args.state === 1; // 1 = playing
        });
        
        api.playerPositionChanged.on((args) => {
          currentBeat = args.currentBeat;
        });
        
        api.playbackSpeedChanged.on((args) => {
          tempo = args.playbackSpeed * initialTempo;
        });
        
        // Load score data
        if (scoreData) {
          if (typeof scoreData === 'string') {
            // Load from file path
            api.load(scoreData);
          } else if (scoreData instanceof ArrayBuffer) {
            // Load from binary data
            api.load(scoreData);
          } else {
            // Load from TEX format
            api.tex(scoreData);
          }
        } else if (gpxFile) {
          // Load from Guitar Pro file
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              api.load(e.target.result as ArrayBuffer);
            }
          };
          reader.readAsArrayBuffer(gpxFile);
        }
        
        // Auto play if enabled
        if (autoPlay && api.player) {
          setTimeout(() => {
            api.playPause();
          }, 1000);
        }
      },
      {
        errorMessage: 'AlphaTab 초기화 중 오류가 발생했습니다',
        severity: 'high',
        context: { component: 'AlphaTabViewer' }
      }
    );
  }
  
  // Control functions
  function handlePlayPause() {
    if (api && api.player) {
      api.playPause();
    }
  }
  
  function handleStop() {
    if (api && api.player) {
      api.stop();
      currentBeat = 0;
    }
  }
  
  function handleTempoDecrease() {
    if (api && tempo > MIN_TEMPO) {
      const newSpeed = Math.max((tempo - TEMPO_STEP) / initialTempo, MIN_TEMPO / initialTempo);
      api.playbackSpeed = newSpeed;
    }
  }
  
  function handleTempoIncrease() {
    if (api && tempo < MAX_TEMPO) {
      const newSpeed = Math.min((tempo + TEMPO_STEP) / initialTempo, MAX_TEMPO / initialTempo);
      api.playbackSpeed = newSpeed;
    }
  }
  
  function handleTempoReset() {
    if (api) {
      api.playbackSpeed = 1.0;
      tempo = initialTempo;
    }
  }
  
  function handleVolumeChange(event: Event) {
    const target = event.target as HTMLInputElement;
    volume = parseInt(target.value);
    if (api && api.player) {
      api.masterVolume = volume / 100;
    }
  }
  
  function handleTrackChange(track: any) {
    selectedTrack = track;
    if (api) {
      api.renderTracks([track]);
    }
  }
  
  function handlePrint() {
    if (api) {
      api.print();
    }
  }
  
  function handleExportPdf() {
    // This would require additional implementation
    console.log('Export to PDF');
  }
  
  function handleExportMidi() {
    if (api && api.score) {
      // Generate MIDI from score
      console.log('Export to MIDI');
    }
  }
  
  function handleZoomIn() {
    if (api && api.settings) {
      api.settings.display.scale = Math.min(api.settings.display.scale * 1.1, 2.0);
      api.updateSettings();
      api.render();
    }
  }
  
  function handleZoomOut() {
    if (api && api.settings) {
      api.settings.display.scale = Math.max(api.settings.display.scale * 0.9, 0.5);
      api.updateSettings();
      api.render();
    }
  }
  
  function handleZoomReset() {
    if (api && api.settings) {
      api.settings.display.scale = 1.0;
      api.updateSettings();
      api.render();
    }
  }
  
  // Lifecycle
  onMount(() => {
    initializeAlphaTab();
  });
  
  onDestroy(() => {
    if (api) {
      api.destroy();
    }
  });
  
  // Reactive
  $: if (api && theme) {
    // Update theme colors
    if (api.settings && api.settings.display.resources) {
      api.settings.display.resources.staffLineColor = theme === 'dark' ? '#e5e5e5' : '#000000';
      api.settings.display.resources.barNumberColor = theme === 'dark' ? '#a3a3a3' : '#666666';
      api.settings.display.resources.mainGlyphColor = theme === 'dark' ? '#ffffff' : '#000000';
      api.settings.display.resources.scoreInfoColor = theme === 'dark' ? '#d4d4d4' : '#333333';
      api.updateSettings();
      api.render();
    }
  }
</script>

<div class="alphatab-viewer" data-theme={theme}>
  {#if showControls}
    <div class="toolbar">
      <!-- Playback Controls -->
      <div class="toolbar-section">
        <Button 
          size="sm" 
          variant="ghost" 
          on:click={handlePlayPause}
          disabled={!api}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </Button>
        <Button 
          size="sm" 
          variant="ghost" 
          on:click={handleStop}
          disabled={!api}
        >
          ⏹️
        </Button>
      </div>
      
      <!-- Tempo Controls -->
      <div class="toolbar-section">
        <Button 
          size="sm" 
          variant="ghost" 
          on:click={handleTempoDecrease}
          disabled={!api || tempo <= MIN_TEMPO}
        >
          －
        </Button>
        <span class="tempo-info">♩ = {Math.round(tempo)}</span>
        <Button 
          size="sm" 
          variant="ghost" 
          on:click={handleTempoIncrease}
          disabled={!api || tempo >= MAX_TEMPO}
        >
          ＋
        </Button>
        <Button 
          size="sm" 
          variant="ghost" 
          on:click={handleTempoReset}
          disabled={!api}
        >
          ⟲
        </Button>
      </div>
      
      <!-- Volume Control -->
      <div class="toolbar-section">
        <span class="volume-icon">🔊</span>
        <input 
          type="range" 
          min="0" 
          max="100" 
          bind:value={volume}
          on:input={handleVolumeChange}
          class="volume-slider"
        />
        <span class="volume-value">{volume}%</span>
      </div>
      
      <!-- Track Selector -->
      {#if tracks.length > 1}
        <div class="toolbar-section">
          <label for="track-select">트랙:</label>
          <select 
            id="track-select"
            on:change={(e) => handleTrackChange(tracks[parseInt(e.currentTarget.value)])}
            class="track-selector"
          >
            {#each tracks as track, i}
              <option value={i} selected={track === selectedTrack}>
                {track.name || `Track ${i + 1}`}
              </option>
            {/each}
          </select>
        </div>
      {/if}
      
      <!-- Zoom Controls -->
      <div class="toolbar-section">
        <Button size="sm" variant="ghost" on:click={handleZoomOut}>
          🔍－
        </Button>
        <Button size="sm" variant="ghost" on:click={handleZoomReset}>
          100%
        </Button>
        <Button size="sm" variant="ghost" on:click={handleZoomIn}>
          🔍＋
        </Button>
      </div>
      
      <!-- Export Options -->
      <div class="toolbar-section">
        <Button size="sm" variant="ghost" on:click={handlePrint}>
          🖨️
        </Button>
        <Button size="sm" variant="ghost" on:click={handleExportPdf}>
          PDF
        </Button>
        <Button size="sm" variant="ghost" on:click={handleExportMidi}>
          MIDI
        </Button>
      </div>
    </div>
    
    <!-- Progress Bar -->
    {#if api && totalBeats > 0}
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          style="width: {(currentBeat / totalBeats) * 100}%"
        ></div>
      </div>
    {/if}
  {/if}
  
  <Card variant="bordered" padding="none" class="tab-card">
    {#if isLoading}
      <div class="loading-overlay">
        <div class="spinner"></div>
        <p>Tab 악보를 로딩하고 있습니다...</p>
      </div>
    {/if}
    
    <div 
      bind:this={container} 
      class="alphatab-container"
      class:loading={isLoading}
    ></div>
  </Card>
</div>

<style>
  .alphatab-viewer {
    width: 100%;
    position: relative;
  }
  
  .toolbar {
    display: flex;
    align-items: center;
    gap: 2rem;
    padding: 0.75rem 1rem;
    background: white;
    border: 1px solid #e5e5e5;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }
  
  .toolbar-section {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .tempo-info {
    min-width: 80px;
    text-align: center;
    font-size: 0.875rem;
    color: #666;
    font-family: monospace;
  }
  
  .volume-slider {
    width: 100px;
    height: 4px;
    -webkit-appearance: none;
    appearance: none;
    background: #e5e5e5;
    border-radius: 2px;
    outline: none;
  }
  
  .volume-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    background: #0ea5e9;
    border-radius: 50%;
    cursor: pointer;
  }
  
  .volume-slider::-moz-range-thumb {
    width: 12px;
    height: 12px;
    background: #0ea5e9;
    border-radius: 50%;
    cursor: pointer;
  }
  
  .volume-icon {
    font-size: 1rem;
  }
  
  .volume-value {
    min-width: 40px;
    text-align: right;
    font-size: 0.875rem;
    color: #666;
  }
  
  .track-selector {
    padding: 0.25rem 0.5rem;
    border: 1px solid #e5e5e5;
    border-radius: 0.25rem;
    background: white;
    font-size: 0.875rem;
    cursor: pointer;
  }
  
  .progress-bar {
    height: 4px;
    background: #e5e5e5;
    border-radius: 2px;
    margin-bottom: 1rem;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #0ea5e9, #0284c7);
    border-radius: 2px;
    transition: width 0.1s linear;
  }
  
  .tab-card {
    min-height: 600px;
    position: relative;
    overflow: auto;
  }
  
  .alphatab-container {
    min-height: 600px;
    background: white;
    transition: opacity 0.3s;
  }
  
  .alphatab-container.loading {
    opacity: 0.5;
  }
  
  .loading-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.95);
    z-index: 10;
  }
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #e5e5e5;
    border-top-color: #0ea5e9;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  /* Dark theme */
  [data-theme="dark"] .toolbar {
    background: #1a1a1a;
    border-color: #333;
  }
  
  [data-theme="dark"] .alphatab-container {
    background: #0a0a0a;
  }
  
  [data-theme="dark"] .track-selector {
    background: #1a1a1a;
    border-color: #333;
    color: #e5e5e5;
  }
  
  [data-theme="dark"] .volume-slider {
    background: #333;
  }
  
  [data-theme="dark"] .progress-bar {
    background: #333;
  }
  
  [data-theme="dark"] .loading-overlay {
    background: rgba(10, 10, 10, 0.95);
  }
  
  [data-theme="dark"] .tempo-info,
  [data-theme="dark"] .volume-value {
    color: #a3a3a3;
  }
  
  /* Print styles */
  @media print {
    .toolbar,
    .progress-bar {
      display: none;
    }
    
    .tab-card {
      border: none !important;
      box-shadow: none !important;
    }
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    .toolbar {
      gap: 1rem;
    }
    
    .toolbar-section {
      flex-wrap: wrap;
    }
    
    .volume-slider {
      width: 80px;
    }
  }
  
  /* AlphaTab specific overrides */
  :global(.at-surface) {
    background: transparent !important;
  }
  
  :global(.at-highlight) {
    background: rgba(14, 165, 233, 0.2) !important;
  }
  
  :global(.at-selection) {
    background: rgba(14, 165, 233, 0.3) !important;
  }
</style>