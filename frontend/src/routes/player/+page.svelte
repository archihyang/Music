<script>
  import YouTubeInput from '$lib/components/YouTubeInput.svelte';
  import TabViewer from '$lib/components/TabViewer.svelte';
  import AudioPlayer from '$lib/components/AudioPlayer.svelte';
  import FretboardView from '$lib/components/FretboardView.svelte';
  import TheoryPanel from '$lib/components/TheoryPanel.svelte';
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { fade, fly } from 'svelte/transition';
  
  // Component state
  let tabData = null;
  let audioUrl = null;
  let midiData = null;
  let analysisData = null;
  let isLoading = false;
  let currentMeasure = 0;
  let zoom = 1.0;
  let scrollSync = true;
  let isPlaying = false;
  let currentNotes = [];
  let currentChord = null;
  let currentScale = null;
  let tempo = 120;
  let key = 'C';
  let showSidebar = true;
  
  // Demo data for testing
  const demoData = {
    tab: {
      measures: [
        {
          notes: [
            { string: 1, fret: 5, techniques: ['hammer'] },
            { string: 2, fret: 7 },
            { string: 3, fret: 5, techniques: ['slide'] },
            { string: 2, fret: 8 }
          ],
          chord: 'Am',
          timeSignature: '4/4'
        },
        {
          notes: [
            { string: 4, fret: 7 },
            { string: 3, fret: 5 },
            { string: 2, fret: 5, techniques: ['bend'] },
            { string: 1, fret: 5 }
          ],
          chord: 'C',
          timeSignature: '4/4'
        }
      ],
      tuning: ['E', 'A', 'D', 'G', 'B', 'E']
    },
    audioUrl: '/demo/audio.mp3',
    midi: {
      tracks: [
        {
          notes: [
            { time: 0, pitch: 69, duration: 0.5, velocity: 80 },
            { time: 0.5, pitch: 71, duration: 0.5, velocity: 75 },
            { time: 1, pitch: 72, duration: 0.5, velocity: 85 },
            { time: 1.5, pitch: 74, duration: 0.5, velocity: 70 }
          ]
        }
      ]
    },
    analysis: {
      tempo: 120,
      key: 'A minor',
      scale: 'A minor',
      mode: 'Natural Minor',
      progression: [
        { chord: 'Am', roman: 'i', function: 'Tonic' },
        { chord: 'F', roman: 'VI', function: 'Submediant' },
        { chord: 'C', roman: 'III', function: 'Mediant' },
        { chord: 'G', roman: 'VII', function: 'Subtonic' }
      ],
      techniques: [
        { type: 'hammer', count: 12, measures: [1, 3, 5, 7] },
        { type: 'bend', count: 8, measures: [2, 4, 6, 8] },
        { type: 'slide', count: 6, measures: [1, 2, 5, 6] },
        { type: 'vibrato', count: 4, measures: [3, 4, 7, 8] }
      ]
    }
  };
  
  // Handle transcription complete
  async function handleTranscriptionComplete(event) {
    console.log('Transcription complete:', event.detail);
    
    // In production, this would come from the API
    // For now, use demo data
    tabData = demoData.tab;
    audioUrl = demoData.audioUrl;
    midiData = demoData.midi;
    analysisData = demoData.analysis;
    
    // Extract analysis info
    if (analysisData) {
      tempo = analysisData.tempo || 120;
      key = analysisData.key || 'C';
      currentScale = analysisData.scale || null;
    }
  }
  
  // Handle measure change from audio player
  function handleMeasureChange(event) {
    currentMeasure = event.detail;
    
    // Update current notes based on measure
    if (tabData?.measures?.[currentMeasure]) {
      currentNotes = tabData.measures[currentMeasure].notes || [];
      currentChord = tabData.measures[currentMeasure].chord || null;
    }
  }
  
  // Load demo data
  function loadDemoData() {
    tabData = demoData.tab;
    audioUrl = demoData.audioUrl;
    midiData = demoData.midi;
    analysisData = demoData.analysis;
    tempo = demoData.analysis.tempo;
    key = demoData.analysis.key;
    currentScale = demoData.analysis.scale;
  }
  
  onMount(() => {
    console.log('Player page loaded');
  });
</script>

<svelte:head>
  <title>Genesis Music Player - Interactive Guitar Learning</title>
</svelte:head>

<div class="player-layout bg-gray-900 min-h-screen">
  <!-- Header -->
  <header class="bg-gray-800 border-b border-gray-700 px-6 py-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <a href="/" class="text-2xl font-bold text-orange-500">🎸 Genesis Music</a>
        <span class="text-gray-500">|</span>
        <h1 class="text-xl font-semibold text-white">Interactive Player</h1>
      </div>
      
      <div class="flex items-center gap-4">
        <button
          on:click={loadDemoData}
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors text-white"
        >
          Load Demo
        </button>
        
        <button
          on:click={() => showSidebar = !showSidebar}
          class="p-2 rounded hover:bg-gray-700 transition-colors text-white"
          aria-label="Toggle sidebar"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </div>
  </header>
  
  <div class="flex flex-col lg:flex-row gap-6 p-6">
    <!-- Main Content -->
    <div class="flex-1 space-y-6">
      <!-- YouTube Input -->
      <section class="bg-gray-800 rounded-lg p-6" in:fade>
        <h2 class="text-2xl font-bold mb-4 text-white">Load Music</h2>
        <YouTubeInput on:transcriptionComplete={handleTranscriptionComplete} />
      </section>
      
      <!-- Audio Player -->
      {#if audioUrl || midiData}
        <section class="bg-gray-800 rounded-lg p-6" in:fly={{ y: 20, duration: 500 }}>
          <h2 class="text-2xl font-bold mb-4 text-white">Audio Player</h2>
          <AudioPlayer
            {audioUrl}
            {midiData}
            bind:currentMeasure
            bind:isPlaying
            on:measure-change={handleMeasureChange}
          />
        </section>
      {/if}
      
      <!-- Tab Viewer -->
      {#if tabData}
        <section class="bg-gray-800 rounded-lg p-6" in:fly={{ y: 20, duration: 500, delay: 100 }}>
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-2xl font-bold text-white">Guitar Tab</h2>
            <div class="flex items-center gap-2">
              <label class="text-sm text-gray-400">Sync:</label>
              <input
                type="checkbox"
                bind:checked={scrollSync}
                class="rounded"
              />
            </div>
          </div>
          <TabViewer 
            data={tabData}
            {zoom}
            {scrollSync}
            {currentMeasure}
          />
        </section>
      {/if}
      
      <!-- Interactive Fretboard -->
      {#if tabData || currentNotes.length > 0}
        <section class="bg-gray-800 rounded-lg p-6" in:fly={{ y: 20, duration: 500, delay: 200 }}>
          <h2 class="text-2xl font-bold mb-4 text-white">Interactive Fretboard</h2>
          <FretboardView
            {currentNotes}
            highlightedScale={currentScale}
            highlightedChord={currentChord}
          />
        </section>
      {/if}
    </div>
    
    <!-- Sidebar -->
    {#if showSidebar}
      <aside class="lg:w-96 space-y-6" transition:fly={{ x: 20, duration: 300 }}>
        <!-- Theory Panel -->
        <section class="bg-gray-800 rounded-lg p-6 sticky top-6">
          <h2 class="text-2xl font-bold mb-4 text-white">Music Theory</h2>
          <TheoryPanel
            {analysisData}
            {currentChord}
            {currentScale}
            {tempo}
            {key}
          />
        </section>
        
        <!-- Quick Stats -->
        {#if analysisData}
          <section class="bg-gray-800 rounded-lg p-6">
            <h3 class="text-lg font-semibold mb-3 text-white">Quick Stats</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-400">Tempo:</span>
                <span class="text-white font-semibold">{tempo} BPM</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Key:</span>
                <span class="text-white font-semibold">{key}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Current Measure:</span>
                <span class="text-white font-semibold">{currentMeasure + 1}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Total Measures:</span>
                <span class="text-white font-semibold">{tabData?.measures?.length || 0}</span>
              </div>
            </div>
          </section>
        {/if}
      </aside>
    {/if}
  </div>
</div>

<style>
  .player-layout {
    font-family: var(--font-interface);
  }
  
  @media (max-width: 1024px) {
    .player-layout aside {
      width: 100%;
    }
  }
</style>