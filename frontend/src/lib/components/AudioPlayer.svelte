<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { writable, derived } from 'svelte/store';
  import WaveSurfer from 'wavesurfer.js';
  import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions';
  import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline';
  import * as Tone from 'tone';
  
  // Props
  export let audioUrl = null;
  export let midiData = null;
  export let currentMeasure = 0;
  export let isPlaying = false;
  export let playbackSpeed = 1.0;
  export let loopEnabled = false;
  export let loopStart = 0;
  export let loopEnd = 0;
  
  const dispatch = createEventDispatcher();
  
  // State
  let container: HTMLDivElement;
  let wavesurfer = null;
  let synth = null;
  let currentTime = writable(0);
  let duration = writable(0);
  let isLoading = writable(false);
  let volume = writable(0.7);
  let regions = null;
  let selectedRegion = null;
  
  // Playback modes
  let playbackMode = 'audio';
  
  // Speed presets for practice
  const SPEED_PRESETS = [
    { label: '25%', value: 0.25 },
    { label: '50%', value: 0.5 },
    { label: '75%', value: 0.75 },
    { label: '100%', value: 1.0 },
    { label: '125%', value: 1.25 },
    { label: '150%', value: 1.5 }
  ];
  
  // Initialize WaveSurfer
  function initWaveSurfer() {
    if (!container) return;
    
    wavesurfer = WaveSurfer.create({
      container,
      waveColor: '#F39C12',
      progressColor: '#FF6B35',
      cursorColor: '#FFFFFF',
      barWidth: 2,
      barRadius: 3,
      responsive: true,
      height: 80,
      normalize: true,
      backend: 'WebAudio',
      plugins: [
        RegionsPlugin.create({
          dragSelection: {
            slop: 5
          }
        }),
        TimelinePlugin.create({
          container: '#timeline',
          primaryColor: '#666',
          secondaryColor: '#333',
          primaryFontColor: '#AAA',
          secondaryFontColor: '#888'
        })
      ]
    });
    
    regions = wavesurfer.registerPlugin(RegionsPlugin.create());
    
    // Event listeners
    wavesurfer.on('ready', () => {
      duration.set(wavesurfer!.getDuration());
      isLoading.set(false);
      dispatch('ready');
    });
    
    wavesurfer.on('audioprocess', () => {
      const time = wavesurfer!.getCurrentTime();
      currentTime.set(time);
      updateMeasure(time);
      
      // Handle loop
      if (loopEnabled && selectedRegion) {
        const regionEnd = selectedRegion.end;
        if (time >= regionEnd) {
          wavesurfer!.seekTo(selectedRegion.start / wavesurfer!.getDuration());
        }
      }
    });
    
    wavesurfer.on('play', () => {
      isPlaying = true;
      dispatch('play');
    });
    
    wavesurfer.on('pause', () => {
      isPlaying = false;
      dispatch('pause');
    });
    
    wavesurfer.on('error', (error) => {
      console.error('WaveSurfer error:', error);
      dispatch('error', error);
    });
    
    // Region events for loop functionality
    regions.on('region-created', (region) => {
      selectedRegion = region;
      loopStart = region.start;
      loopEnd = region.end;
      dispatch('loop-set', { start: loopStart, end: loopEnd });
    });
    
    regions.on('region-updated', (region) => {
      loopStart = region.start;
      loopEnd = region.end;
      dispatch('loop-updated', { start: loopStart, end: loopEnd });
    });
  }
  
  // Initialize Tone.js synth for MIDI playback
  function initSynth() {
    synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'triangle'
      },
      envelope: {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.3,
        release: 0.8
      }
    }).toDestination();
    
    // Set initial volume
    synth.volume.value = Tone.gainToDb($volume);
  }
  
  // Load audio file
  async function loadAudio(url) {
    if (!wavesurfer) return;
    
    isLoading.set(true);
    try {
      await wavesurfer.load(url);
    } catch (error) {
      console.error('Failed to load audio:', error);
      dispatch('error', error);
      isLoading.set(false);
    }
  }
  
  // Load and schedule MIDI data
  async function loadMidi(data) {
    if (!synth || !data) return;
    
    // Parse MIDI data and create Tone.js sequence
    const part = new Tone.Part((time, note) => {
      synth!.triggerAttackRelease(
        note.pitch,
        note.duration,
        time,
        note.velocity
      );
    }, parseMidiNotes(data));
    
    part.loop = loopEnabled;
    part.loopStart = loopStart;
    part.loopEnd = loopEnd;
    part.playbackRate = playbackSpeed;
    
    return part;
  }
  
  // Parse MIDI notes for Tone.js
  function parseMidiNotes(midiData) {
    // Convert MIDI data to Tone.js compatible format
    // This is a simplified version - actual implementation would parse real MIDI
    const notes = [];
    if (midiData.tracks) {
      midiData.tracks.forEach(track => {
        track.notes?.forEach(note => {
          notes.push({
            time: note.time,
            pitch: midiToNoteName(note.pitch),
            duration: note.duration,
            velocity: note.velocity / 127
          });
        });
      });
    }
    return notes;
  }
  
  // Convert MIDI note number to note name
  function midiToNoteName(midi) {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midi / 12) - 1;
    const noteIndex = midi % 12;
    return `${noteNames[noteIndex]}${octave}`;
  }
  
  // Update current measure based on time
  function updateMeasure(time) {
    // Calculate measure based on tempo and time signature
    // This is simplified - actual implementation would use real tempo data
    const measuresPerSecond = 120 / 60 / 4; // 120 BPM, 4/4 time
    const measure = Math.floor(time * measuresPerSecond);
    if (measure !== currentMeasure) {
      currentMeasure = measure;
      dispatch('measure-change', measure);
    }
  }
  
  // Playback controls
  export function play() {
    if (playbackMode === 'audio' && wavesurfer) {
      wavesurfer.play();
    } else if (playbackMode === 'midi' && synth) {
      Tone.Transport.start();
    } else if (playbackMode === 'sync') {
      // Sync both audio and MIDI
      wavesurfer?.play();
      Tone.Transport.start();
    }
  }
  
  export function pause() {
    wavesurfer?.pause();
    Tone.Transport.pause();
  }
  
  export function stop() {
    wavesurfer?.stop();
    Tone.Transport.stop();
    currentTime.set(0);
    currentMeasure = 0;
  }
  
  export function seekTo(progress) {
    wavesurfer?.seekTo(progress);
    Tone.Transport.seconds = progress * ($duration || 0);
  }
  
  export function setSpeed(speed) {
    playbackSpeed = speed;
    wavesurfer?.setPlaybackRate(speed);
    Tone.Transport.bpm.value = 120 * speed; // Adjust BPM
  }
  
  export function setVolume(vol) {
    volume.set(vol);
    wavesurfer?.setVolume(vol);
    if (synth) {
      synth.volume.value = Tone.gainToDb(vol);
    }
  }
  
  // Create loop region
  export function createLoop(start, end) {
    if (!regions) return;
    
    // Clear existing regions
    regions.clearRegions();
    
    // Create new region
    selectedRegion = regions.addRegion({
      start,
      end,
      color: 'rgba(255, 107, 53, 0.3)',
      drag: true,
      resize: true
    });
    
    loopEnabled = true;
    loopStart = start;
    loopEnd = end;
  }
  
  export function clearLoop() {
    regions?.clearRegions();
    selectedRegion = null;
    loopEnabled = false;
    loopStart = 0;
    loopEnd = 0;
  }
  
  // Lifecycle
  onMount(async () => {
    await Tone.start();
    initWaveSurfer();
    initSynth();
    
    if (audioUrl) {
      await loadAudio(audioUrl);
    }
    
    if (midiData) {
      await loadMidi(midiData);
    }
  });
  
  onDestroy(() => {
    wavesurfer?.destroy();
    synth?.dispose();
    Tone.Transport.stop();
    Tone.Transport.cancel();
  });
  
  // Reactive updates
  $: if (wavesurfer && audioUrl) {
    loadAudio(audioUrl);
  }
  
  $: if (synth && midiData) {
    loadMidi(midiData);
  }
  
  $: formattedTime = formatTime($currentTime);
  $: formattedDuration = formatTime($duration);
  
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
</script>

<div class="audio-player bg-gray-900 rounded-lg p-4">
  <!-- Waveform Display -->
  <div class="waveform-container mb-4">
    <div bind:this={container} class="waveform"></div>
    <div id="timeline" class="timeline mt-2"></div>
    
    {#if $isLoading}
      <div class="loading-overlay absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
        <div class="spinner"></div>
        <span class="ml-2 text-white">Loading audio...</span>
      </div>
    {/if}
  </div>
  
  <!-- Playback Controls -->
  <div class="controls flex items-center justify-between mb-4">
    <div class="playback-buttons flex items-center gap-2">
      <button
        on:click={stop}
        class="btn-control p-2 rounded hover:bg-gray-800 transition-colors"
        aria-label="Stop"
      >
        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="6" width="12" height="12" />
        </svg>
      </button>
      
      <button
        on:click={() => isPlaying ? pause() : play()}
        class="btn-control btn-primary p-3 rounded-full bg-orange-500 hover:bg-orange-600 transition-colors"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {#if isPlaying}
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        {:else}
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        {/if}
      </button>
      
      <button
        on:click={() => loopEnabled ? clearLoop() : createLoop($currentTime, $currentTime + 10)}
        class="btn-control p-2 rounded hover:bg-gray-800 transition-colors"
        class:active={loopEnabled}
        aria-label="Loop"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>
    
    <!-- Time Display -->
    <div class="time-display flex items-center gap-2 font-mono text-sm">
      <span>{formattedTime}</span>
      <span class="text-gray-500">/</span>
      <span>{formattedDuration}</span>
    </div>
    
    <!-- Speed Control -->
    <div class="speed-control flex items-center gap-2">
      <label class="text-sm text-gray-400">Speed:</label>
      <div class="speed-presets flex gap-1">
        {#each SPEED_PRESETS as preset}
          <button
            on:click={() => setSpeed(preset.value)}
            class="px-2 py-1 text-xs rounded hover:bg-gray-800 transition-colors"
            class:active={playbackSpeed === preset.value}
          >
            {preset.label}
          </button>
        {/each}
      </div>
    </div>
    
    <!-- Volume Control -->
    <div class="volume-control flex items-center gap-2">
      <svg class="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
      </svg>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={$volume}
        on:input={(e) => setVolume(parseFloat(e.target.value))}
        class="w-24"
      />
      <span class="text-sm text-gray-400 w-10">{Math.round($volume * 100)}%</span>
    </div>
    
    <!-- Playback Mode Selector -->
    <div class="playback-mode flex items-center gap-2">
      <label class="text-sm text-gray-400">Mode:</label>
      <select
        bind:value={playbackMode}
        class="bg-gray-800 text-white px-2 py-1 rounded text-sm"
      >
        <option value="audio">Audio Only</option>
        <option value="midi">MIDI Only</option>
        <option value="sync">Synchronized</option>
      </select>
    </div>
  </div>
  
  <!-- Progress Bar (clickable) -->
  <div 
    class="progress-bar-container h-2 bg-gray-700 rounded-full cursor-pointer relative"
    on:click={(e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const progress = (e.clientX - rect.left) / rect.width;
      seekTo(progress);
    }}
  >
    <div 
      class="progress-bar h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
      style="width: {($currentTime / $duration) * 100}%"
    />
    
    {#if loopEnabled}
      <div 
        class="loop-region absolute top-0 h-full bg-blue-500 bg-opacity-30"
        style="left: {(loopStart / $duration) * 100}%; width: {((loopEnd - loopStart) / $duration) * 100}%"
      />
    {/if}
  </div>
</div>

<style>
  .audio-player {
    position: relative;
    min-height: 200px;
  }
  
  .waveform-container {
    position: relative;
  }
  
  .btn-control {
    color: white;
    transition: all 0.2s;
  }
  
  .btn-control:hover {
    transform: scale(1.05);
  }
  
  .btn-control.active {
    color: #F39C12;
  }
  
  .spinner {
    border: 2px solid transparent;
    border-top-color: #F39C12;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    animation: spin 0.8s linear infinite;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  .speed-presets button.active {
    background-color: rgba(243, 156, 18, 0.2);
    color: #F39C12;
  }
  
  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    cursor: pointer;
  }
  
  input[type="range"]::-webkit-slider-track {
    background: #374151;
    height: 4px;
    border-radius: 2px;
  }
  
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    background: #F39C12;
    height: 16px;
    width: 16px;
    border-radius: 50%;
    margin-top: -6px;
  }
  
  input[type="range"]::-moz-range-track {
    background: #374151;
    height: 4px;
    border-radius: 2px;
  }
  
  input[type="range"]::-moz-range-thumb {
    background: #F39C12;
    height: 16px;
    width: 16px;
    border-radius: 50%;
    border: none;
  }
  
  select {
    outline: none;
    border: 1px solid #374151;
  }
  
  select:focus {
    border-color: #F39C12;
  }
  
  @media (max-width: 768px) {
    .controls {
      flex-wrap: wrap;
      gap: 1rem;
    }
    
    .speed-control,
    .volume-control,
    .playback-mode {
      width: 100%;
      justify-content: space-between;
    }
  }
</style>