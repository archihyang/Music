<script>
  import { onMount } from 'svelte';
  import { fade, fly, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  
  // Professional Guitar Platform State Management
  let activeWorkspace = 'studio'; // studio, analyzer, practice, masterclass, theory, community
  let isLoading = false;
  let audioContext = null;
  
  // Advanced Player State
  let currentTrack = null;
  let isPlaying = false;
  let currentTime = 0;
  let duration = 0;
  let playbackRate = 1.0;
  let masterVolume = 0.8;
  let metronomeEnabled = false;
  let clickTrackBPM = 120;
  
  // Professional Audio Analysis
  let spectrumAnalyzer = null;
  let frequencyData = new Uint8Array(256);
  let waveformData = new Uint8Array(256);
  let pitchDetection = { note: 'A', octave: 4, cents: 0, confidence: 0 };
  
  // Advanced Tab/Music State
  let currentMeasure = 0;
  let currentBeat = 1;
  let tabData = null;
  let chordChart = null;
  let scaleHighlights = [];
  let fingeringMode = 'optimal'; // optimal, alternate, stretch
  
  // Professional UI State  
  let theme = 'studio-dark'; // studio-dark, vintage, modern-light
  let workspace = {
    leftPanel: true,
    rightPanel: true,
    bottomPanel: true,
    fullscreen: false
  };
  let zoomLevel = 1.0;
  let gridSnap = true;
  
  // API Configuration
  const API_BASE = 'http://localhost:3005/api/mastery';
  
  // Professional Guitar Data
  let masterSongs = [];
  let lessonsLibrary = [];
  let techniqueExercises = [];
  let gearRecommendations = [];
  
  // Advanced Music Theory Engine
  const SCALES = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    mixolydian: [0, 2, 4, 5, 7, 9, 10],
    pentatonic: [0, 2, 4, 7, 9],
    blues: [0, 3, 5, 6, 7, 10],
    harmonic_minor: [0, 2, 3, 5, 7, 8, 11]
  };
  
  const CHORD_VOICINGS = {
    'Cmaj7': { frets: [3, 3, 2, 0, 0, 0], fingers: [3, 4, 2, 0, 0, 0] },
    'Dm7': { frets: [1, 1, 0, 2, 1, 1], fingers: [1, 1, 0, 3, 2, 1] },
    'G7': { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] }
  };
  
  const TECHNIQUES = {
    'alternate-picking': { difficulty: 3, category: 'picking', bpm_range: [60, 200] },
    'sweep-picking': { difficulty: 8, category: 'advanced', bpm_range: [40, 160] },
    'economy-picking': { difficulty: 6, category: 'picking', bpm_range: [80, 180] },
    'legato': { difficulty: 5, category: 'fretting', bpm_range: [60, 140] },
    'tapping': { difficulty: 7, category: 'advanced', bpm_range: [80, 160] }
  };

  // Professional Form Handlers
  let youtubeUrl = '';
  let audioFile = null;
  
  async function transcribeAudio(source) {
    try {
      isLoading = true;
      let response;
      
      if (source.startsWith('http')) {
        response = await fetch(`${API_BASE}/transcribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ youtubeUrl: source })
        });
      } else {
        // Handle file upload
        const formData = new FormData();
        formData.append('audio', audioFile);
        response = await fetch(`${API_BASE}/upload/audio`, {
          method: 'POST',
          body: formData
        });
      }
      
      const result = await response.json();
      if (result.success) {
        pollTranscriptionStatus(result.transcriptionId);
        return result;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Transcription error:', error);
      throw error;
    }
  }

  async function pollTranscriptionStatus(transcriptionId) {
    const poll = async () => {
      try {
        const response = await fetch(`${API_BASE}/transcribe/${transcriptionId}`);
        const result = await response.json();
        
        if (result.success && result.data.status === 'completed') {
          isLoading = false;
          tabData = result.data.result.tabData;
          currentTrack = {
            title: result.data.result.title || 'Transcribed Track',
            audioUrl: result.data.result.audioUrl,
            analysis: result.data.result.analysis
          };
          activeWorkspace = 'studio';
        } else if (result.data.status === 'processing') {
          setTimeout(poll, 1000);
        } else {
          throw new Error('Transcription failed');
        }
      } catch (error) {
        console.error('Poll error:', error);
        isLoading = false;
      }
    };
    poll();
  }

  async function loadMasterContent() {
    try {
      const [songs, lessons, exercises] = await Promise.all([
        fetch(`${API_BASE}/songs/recommendations?limit=12`).then(r => r.json()),
        fetch(`${API_BASE}/practice-modules?limit=8`).then(r => r.json()),
        fetch(`${API_BASE}/learning-paths`).then(r => r.json())
      ]);
      
      masterSongs = songs.success ? songs.data : [];
      lessonsLibrary = lessons.success ? lessons.data : [];
      techniqueExercises = exercises.success ? exercises.data : [];
    } catch (error) {
      console.error('Content loading error:', error);
    }
  }

  // Professional Audio Engine
  async function initializeAudioEngine() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      spectrumAnalyzer = audioContext.createAnalyser();
      spectrumAnalyzer.fftSize = 512;
      spectrumAnalyzer.connect(audioContext.destination);
    }
  }

  function analyzeAudioSpectrum() {
    if (spectrumAnalyzer && isPlaying) {
      spectrumAnalyzer.getByteFrequencyData(frequencyData);
      spectrumAnalyzer.getByteTimeDomainData(waveformData);
      requestAnimationFrame(analyzeAudioSpectrum);
    }
  }

  // Advanced UI Functions
  function toggleWorkspace(workspace) {
    activeWorkspace = workspace;
  }

  function togglePanel(panel) {
    workspace[panel] = !workspace[panel];
  }

  function changeTheme(newTheme) {
    theme = newTheme;
  }

  // Professional Demo Data
  const masterTrackDemo = {
    title: "The Spirit Carries On - Dream Theater",
    artist: "John Petrucci",
    album: "Scenes from a Memory",
    year: 1999,
    key: "Am",
    timeSignature: "4/4",
    bpm: 85,
    difficulty: "Master Level",
    techniques: ["Alternate Picking", "Legato", "Sweep Picking", "Arpeggios"],
    tuning: "DADGBE", // Drop D
    capo: 0,
    measures: [
      {
        number: 1,
        chords: ["Am", "F", "C", "G"],
        tab: "e|--5--5--8--8--12-12-15-15--|\nB|--5--6--8--8--13-12-15-17--|\nG|--5--5--9--9--12-12-16-16--|\nD|--7--7-10-10--14-14-17-17--|\nA|--0--0--8--8--12-12-15-15--|\nE|--x--x--x--x---x--x--x--x--|",
        techniques: ["Alternate Picking", "String Skipping"],
        timing: [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5],
        dynamics: "mf",
        articulation: "legato"
      }
    ],
    analysis: {
      harmonic: {
        key_center: "A minor",
        modulations: ["C major", "F major"],
        chord_functions: ["i", "VI", "III", "VII"]
      },
      melodic: {
        primary_scales: ["A Natural Minor", "A Harmonic Minor"],
        phrase_structure: "AABA",
        motivic_development: "Sequential ascending"
      },
      rhythmic: {
        subdivision: "16th notes",
        syncopation: "Moderate",
        polyrhythm: false
      }
    }
  };

  onMount(async () => {
    await initializeAudioEngine();
    await loadMasterContent();
    console.log('🎸 Genesis Music Professional Platform - Initialized');
  });

  // Handle file upload
  function handleFileSelect(event) {
    audioFile = event.target.files[0];
    if (audioFile) {
      transcribeAudio('file');
    }
  }

  // Handle YouTube URL
  async function handleYouTubeTranscribe() {
    if (!youtubeUrl.trim()) {
      alert('Please enter a valid YouTube URL');
      return;
    }
    try {
      await transcribeAudio(youtubeUrl);
    } catch (error) {
      alert('Transcription failed: ' + error.message);
    }
  }

  // Demo function
  function loadDemoTrack() {
    tabData = masterTrackDemo;
    currentTrack = masterTrackDemo;
    activeWorkspace = 'studio';
  }
</script>

<svelte:head>
  <title>Genesis Music - Professional Guitar Platform</title>
  <meta name="description" content="세계 최고 수준의 AI 기반 기타 마스터리 플랫폼" />
</svelte:head>

<!-- Professional Guitar Platform UI -->
<div class="genesis-pro min-h-screen {theme} transition-all duration-300">
  
  <!-- Professional Header -->
  <header class="pro-header bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-orange-500/20">
    <div class="flex items-center justify-between px-6 py-4">
      
      <!-- Professional Logo & Branding -->
      <div class="flex items-center gap-4">
        <div class="logo-container relative">
          <div class="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
            <span class="text-2xl font-bold text-white">G</span>
          </div>
          <div class="absolute -inset-1 bg-gradient-to-br from-orange-500/50 to-red-600/50 rounded-xl blur opacity-60"></div>
        </div>
        <div>
          <h1 class="text-2xl font-bold text-white">Genesis Music</h1>
          <p class="text-sm text-gray-400">Professional Guitar Platform</p>
        </div>
      </div>
      
      <!-- Professional Workspace Navigation -->
      <nav class="workspace-nav flex gap-2">
        {#each ['studio', 'analyzer', 'practice', 'masterclass', 'theory', 'community'] as workspace}
          <button 
            on:click={() => toggleWorkspace(workspace)}
            class="nav-tab px-4 py-2 rounded-lg text-sm font-medium transition-all {
              activeWorkspace === workspace 
                ? 'bg-orange-500 text-white shadow-lg' 
                : 'text-gray-300 hover:text-white hover:bg-slate-700'
            }"
          >
            {workspace.charAt(0).toUpperCase() + workspace.slice(1)}
          </button>
        {/each}
      </nav>
      
      <!-- Professional Controls -->
      <div class="pro-controls flex items-center gap-3">
        <!-- Theme Switcher -->
        <select bind:value={theme} class="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600">
          <option value="studio-dark">Studio Dark</option>
          <option value="vintage">Vintage</option>
          <option value="modern-light">Modern Light</option>
        </select>
        
        <!-- Master Volume -->
        <div class="volume-control flex items-center gap-2">
          <svg class="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.78L4.617 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.617l3.766-3.78a1 1 0 011 .076z"/>
          </svg>
          <input 
            type="range" 
            bind:value={masterVolume} 
            min="0" 
            max="1" 
            step="0.01"
            class="volume-slider w-20"
          >
        </div>
        
        <!-- User Profile -->
        <div class="user-profile">
          <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold cursor-pointer hover:scale-110 transition-transform">
            Pro
          </div>
        </div>
      </div>
    </div>
  </header>

  <!-- Professional Workspace Container -->
  <main class="workspace-container flex">
    
    <!-- Left Professional Panel -->
    {#if workspace.leftPanel}
      <aside class="left-panel w-80 bg-slate-800/90 border-r border-slate-700 h-[calc(100vh-80px)] overflow-y-auto" transition:fly={{ x: -300, duration: 300 }}>
        <div class="p-6 space-y-6">
          
          <!-- Professional Tools -->
          <section class="pro-tools">
            <h3 class="text-lg font-bold text-white mb-4">Professional Tools</h3>
            <div class="tool-grid grid grid-cols-2 gap-3">
              <button class="tool-btn bg-slate-700 hover:bg-slate-600 p-4 rounded-xl text-center transition-colors">
                <div class="w-8 h-8 bg-green-500/20 rounded-lg mx-auto mb-2 flex items-center justify-center">
                  <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
                  </svg>
                </div>
                <span class="text-sm font-medium text-white">Transcribe</span>
              </button>
              
              <button class="tool-btn bg-slate-700 hover:bg-slate-600 p-4 rounded-xl text-center transition-colors">
                <div class="w-8 h-8 bg-blue-500/20 rounded-lg mx-auto mb-2 flex items-center justify-center">
                  <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                  </svg>
                </div>
                <span class="text-sm font-medium text-white">Analyzer</span>
              </button>
              
              <button class="tool-btn bg-slate-700 hover:bg-slate-600 p-4 rounded-xl text-center transition-colors">
                <div class="w-8 h-8 bg-purple-500/20 rounded-lg mx-auto mb-2 flex items-center justify-center">
                  <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                  </svg>
                </div>
                <span class="text-sm font-medium text-white">Theory</span>
              </button>
              
              <button class="tool-btn bg-slate-700 hover:bg-slate-600 p-4 rounded-xl text-center transition-colors">
                <div class="w-8 h-8 bg-red-500/20 rounded-lg mx-auto mb-2 flex items-center justify-center">
                  <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
                <span class="text-sm font-medium text-white">Practice</span>
              </button>
            </div>
          </section>
          
          <!-- Master Songs Library -->
          <section class="master-library">
            <h3 class="text-lg font-bold text-white mb-4">Master Tracks</h3>
            <div class="space-y-3 max-h-60 overflow-y-auto">
              {#each masterSongs.slice(0, 6) as song}
                <div class="song-item bg-slate-700/50 rounded-lg p-3 hover:bg-slate-600/50 transition-colors cursor-pointer">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                      {song.thumbnail || '🎸'}
                    </div>
                    <div class="flex-1 min-w-0">
                      <h4 class="font-medium text-white text-sm truncate">{song.title}</h4>
                      <p class="text-xs text-gray-400 truncate">{song.artist} • {song.difficulty}</p>
                    </div>
                    <div class="text-xs text-orange-400 font-medium">{song.rating}</div>
                  </div>
                </div>
              {/each}
            </div>
          </section>
          
          <!-- Professional Progress -->
          <section class="pro-progress">
            <h3 class="text-lg font-bold text-white mb-4">Your Progress</h3>
            <div class="progress-stats space-y-3">
              <div class="stat-item bg-slate-700/50 rounded-lg p-3">
                <div class="flex justify-between items-center mb-2">
                  <span class="text-sm text-gray-300">Practice Streak</span>
                  <span class="text-orange-400 font-bold">12 days</span>
                </div>
                <div class="h-2 bg-slate-600 rounded-full overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-orange-500 to-red-600 rounded-full" style="width: 85%"></div>
                </div>
              </div>
              
              <div class="stat-item bg-slate-700/50 rounded-lg p-3">
                <div class="flex justify-between items-center mb-2">
                  <span class="text-sm text-gray-300">Techniques Mastered</span>
                  <span class="text-green-400 font-bold">47/100</span>
                </div>
                <div class="h-2 bg-slate-600 rounded-full overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full" style="width: 47%"></div>
                </div>
              </div>
            </div>
          </section>
          
        </div>
      </aside>
    {/if}
    
    <!-- Professional Main Content Area -->
    <div class="main-content flex-1 overflow-auto">
      
      {#if activeWorkspace === 'studio'}
        <!-- Professional Studio Workspace -->
        <div class="studio-workspace p-8" in:fade={{ duration: 300 }}>
          
          {#if isLoading}
            <!-- Professional Loading Screen -->
            <div class="loading-screen flex items-center justify-center h-96">
              <div class="loading-content text-center">
                <div class="loading-spinner w-16 h-16 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-6"></div>
                <h3 class="text-xl font-bold text-white mb-2">Professional AI Analysis</h3>
                <p class="text-gray-400 mb-4">Analyzing harmonics, rhythm, and advanced techniques...</p>
                <div class="progress-bar w-64 h-2 bg-slate-700 rounded-full mx-auto overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-orange-500 to-red-600 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
            
          {:else if currentTrack && tabData}
            <!-- Professional Track Studio -->
            <div class="track-studio" in:fade={{ duration: 500 }}>
              
              <!-- Professional Track Header -->
              <header class="track-header bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-6 mb-6 border border-orange-500/20">
                <div class="flex items-start justify-between">
                  <div class="track-info">
                    <h1 class="text-3xl font-bold text-white mb-2">{tabData.title}</h1>
                    <div class="track-meta flex items-center gap-4 text-gray-400">
                      <span>🎸 {tabData.artist}</span>
                      <span>🎵 {tabData.key}</span>
                      <span>⏱️ {tabData.bpm} BPM</span>
                      <span>🎯 {tabData.difficulty}</span>
                      <span>🎚️ {tabData.tuning || 'Standard'}</span>
                    </div>
                    <div class="technique-badges flex gap-2 mt-3">
                      {#each tabData.techniques || [] as technique}
                        <span class="technique-badge px-3 py-1 bg-orange-500/20 text-orange-400 rounded-lg text-sm font-medium">
                          {technique}
                        </span>
                      {/each}
                    </div>
                  </div>
                  
                  <div class="track-controls flex gap-3">
                    <button class="control-btn bg-slate-700 hover:bg-slate-600 p-3 rounded-lg text-gray-400 hover:text-white transition-colors">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                      </svg>
                    </button>
                    <button class="control-btn bg-slate-700 hover:bg-slate-600 p-3 rounded-lg text-gray-400 hover:text-white transition-colors">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"/>
                      </svg>
                    </button>
                    <button class="control-btn bg-orange-500 hover:bg-orange-600 p-3 rounded-lg text-white transition-colors">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </header>
              
              <!-- Professional Tab Display -->
              <section class="pro-tab-display bg-slate-800 rounded-xl p-6 mb-6 border border-slate-700">
                <div class="tab-controls flex items-center justify-between mb-4">
                  <h3 class="text-xl font-bold text-white">Professional Tablature</h3>
                  <div class="tab-options flex gap-2">
                    <button class="option-btn px-3 py-1 bg-slate-700 text-gray-300 rounded-lg text-sm hover:bg-slate-600 transition-colors">
                      Standard
                    </button>
                    <button class="option-btn px-3 py-1 bg-slate-700 text-gray-300 rounded-lg text-sm hover:bg-slate-600 transition-colors">
                      Notation
                    </button>
                    <button class="option-btn px-3 py-1 bg-orange-500 text-white rounded-lg text-sm">
                      Tab + Audio
                    </button>
                  </div>
                </div>
                
                <!-- High-end Tab Rendering -->
                <div class="tab-content font-mono text-lg bg-slate-900 rounded-lg p-6 overflow-x-auto">
                  {#each tabData.measures as measure, i}
                    <div class="measure-block mb-6 p-4 rounded-lg {i === currentMeasure ? 'bg-orange-500/10 border-l-4 border-orange-500' : 'hover:bg-slate-700/50'} transition-all">
                      <div class="measure-header flex justify-between items-center mb-3">
                        <span class="measure-number text-orange-400 font-bold">Measure {i + 1}</span>
                        <div class="measure-info text-sm text-gray-400">
                          {measure.chord ? `Chord: ${measure.chord}` : ''} 
                          {measure.technique ? `• ${measure.technique}` : ''}
                        </div>
                      </div>
                      <pre class="tab-notation text-green-400 leading-relaxed whitespace-pre-wrap">{measure.tab || measure.notes}</pre>
                      {#if measure.timing}
                        <div class="timing-markers flex justify-between mt-2 text-xs text-gray-500">
                          {#each measure.timing as time, idx}
                            <span>{time}s</span>
                          {/each}
                        </div>
                      {/if}
                    </div>
                  {/each}
                </div>
              </section>
              
              <!-- Professional Audio Controls -->
              <section class="pro-audio-controls bg-slate-800 rounded-xl p-6 border border-slate-700">
                <div class="controls-layout flex items-center justify-between">
                  
                  <!-- Playback Controls -->
                  <div class="playback-controls flex items-center gap-4">
                    <button class="play-btn w-14 h-14 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform shadow-lg">
                      {#if isPlaying}
                        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <rect x="6" y="4" width="4" height="16"/>
                          <rect x="14" y="4" width="4" height="16"/>
                        </svg>
                      {:else}
                        <svg class="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      {/if}
                    </button>
                    
                    <div class="transport-controls flex gap-2">
                      <button class="transport-btn p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                        </svg>
                      </button>
                      <button class="transport-btn p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 18l8.5-6L6 6v12zM16 6h2v12h-2z"/>
                        </svg>
                      </button>
                    </div>
                    
                    <!-- Speed Control -->
                    <div class="speed-control flex items-center gap-2 ml-4">
                      <span class="text-sm text-gray-400">Speed:</span>
                      <select bind:value={playbackRate} class="bg-slate-700 text-white rounded-lg px-3 py-1 text-sm border border-slate-600">
                        <option value="0.5">0.5x</option>
                        <option value="0.75">0.75x</option>
                        <option value="1.0">1.0x</option>
                        <option value="1.25">1.25x</option>
                        <option value="1.5">1.5x</option>
                      </select>
                    </div>
                  </div>
                  
                  <!-- Progress Bar -->
                  <div class="progress-section flex-1 mx-8">
                    <div class="progress-bar-container">
                      <div class="flex justify-between text-xs text-gray-400 mb-1">
                        <span>{Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(0).padStart(2, '0')}</span>
                        <span>{Math.floor(duration / 60)}:{(duration % 60).toFixed(0).padStart(2, '0')}</span>
                      </div>
                      <div class="progress-bar h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div class="progress-fill h-full bg-gradient-to-r from-orange-500 to-red-600 rounded-full transition-all" 
                             style="width: {duration ? (currentTime / duration) * 100 : 0}%"></div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Advanced Controls -->
                  <div class="advanced-controls flex items-center gap-3">
                    <button class="advanced-btn p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors {metronomeEnabled ? 'text-orange-400' : ''}" 
                            on:click={() => metronomeEnabled = !metronomeEnabled}>
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </button>
                    <input type="range" bind:value={clickTrackBPM} min="60" max="200" class="bpm-slider w-20">
                    <span class="text-sm text-gray-400">{clickTrackBPM}</span>
                  </div>
                </div>
              </section>
              
            </div>
            
          {:else}
            <!-- Professional Upload Interface -->
            <div class="upload-interface" in:fade={{ duration: 300 }}>
              
              <!-- Professional Hero -->
              <section class="pro-hero bg-gradient-to-br from-slate-800 via-slate-800 to-slate-700 rounded-2xl p-12 mb-8 border border-orange-500/20 relative overflow-hidden">
                <div class="hero-bg absolute inset-0 opacity-10">
                  <div class="absolute top-0 right-0 w-96 h-96 bg-orange-500 rounded-full blur-3xl"></div>
                  <div class="absolute bottom-0 left-0 w-64 h-64 bg-red-600 rounded-full blur-2xl"></div>
                </div>
                <div class="hero-content relative z-10 max-w-4xl mx-auto text-center">
                  <h1 class="text-5xl font-bold text-white mb-6">Professional AI Guitar Analysis</h1>
                  <p class="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                    Advanced harmonic analysis, technique recognition, and professional transcription 
                    powered by cutting-edge AI technology.
                  </p>
                  <div class="hero-stats flex justify-center gap-8 text-center">
                    <div class="stat-item">
                      <div class="text-3xl font-bold text-orange-400">99.5%</div>
                      <div class="text-sm text-gray-400">Accuracy</div>
                    </div>
                    <div class="stat-item">
                      <div class="text-3xl font-bold text-green-400">15+</div>
                      <div class="text-sm text-gray-400">Techniques</div>
                    </div>
                    <div class="stat-item">
                      <div class="text-3xl font-bold text-blue-400">Real-time</div>
                      <div class="text-sm text-gray-400">Analysis</div>
                    </div>
                  </div>
                </div>
              </section>
              
              <!-- Professional Upload Options -->
              <div class="upload-options grid md:grid-cols-2 gap-8 mb-8">
                
                <!-- YouTube Professional -->
                <div class="upload-card bg-slate-800 rounded-2xl p-8 border border-slate-700 hover:border-orange-500/50 transition-all">
                  <div class="card-header flex items-center gap-4 mb-6">
                    <div class="icon-container w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                      <svg class="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0C.488 3.45.029 5.804 0 12c.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0C23.512 20.55 23.971 18.196 24 12c-.029-6.185-.484-8.549-4.385-8.816zM9.6 16.4V7.6l6.4 4.4-6.4 4.4z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 class="text-xl font-bold text-white">YouTube Analysis</h3>
                      <p class="text-gray-400 text-sm">Professional transcription from video</p>
                    </div>
                  </div>
                  
                  <div class="upload-form space-y-4">
                    <input 
                      bind:value={youtubeUrl}
                      type="url" 
                      placeholder="Enter YouTube URL (e.g., https://youtube.com/watch?v=...)"
                      class="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                    <button 
                      on:click={handleYouTubeTranscribe}
                      disabled={!youtubeUrl.trim() || isLoading}
                      class="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {isLoading ? 'Processing...' : 'Analyze Professional'}
                    </button>
                  </div>
                  
                  <div class="features-list mt-4 space-y-2 text-sm text-gray-400">
                    <div class="flex items-center gap-2">
                      <svg class="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                      </svg>
                      <span>Advanced harmonic analysis</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <svg class="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                      </svg>
                      <span>Technique recognition</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <svg class="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                      </svg>
                      <span>Real-time synchronization</span>
                    </div>
                  </div>
                </div>
                
                <!-- File Upload Professional -->
                <div class="upload-card bg-slate-800 rounded-2xl p-8 border border-slate-700 hover:border-orange-500/50 transition-all">
                  <div class="card-header flex items-center gap-4 mb-6">
                    <div class="icon-container w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                      <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                      </svg>
                    </div>
                    <div>
                      <h3 class="text-xl font-bold text-white">Audio Upload</h3>
                      <p class="text-gray-400 text-sm">High-quality file analysis</p>
                    </div>
                  </div>
                  
                  <div class="upload-dropzone border-2 border-dashed border-slate-600 rounded-xl p-8 text-center hover:border-orange-500/50 transition-colors cursor-pointer"
                       on:click={() => document.getElementById('audio-upload').click()}
                       on:dragover|preventDefault
                       on:drop|preventDefault={handleFileSelect}>
                    <div class="upload-icon w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg class="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
                      </svg>
                    </div>
                    <p class="text-lg font-semibold text-white mb-2">Drop your audio file here</p>
                    <p class="text-sm text-gray-400 mb-4">or click to browse (WAV, MP3, FLAC, M4A)</p>
                    <input 
                      id="audio-upload"
                      type="file" 
                      accept="audio/*" 
                      class="hidden"
                      on:change={handleFileSelect}
                    >
                    <button class="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
                      Choose File
                    </button>
                  </div>
                  
                  <div class="features-list mt-4 space-y-2 text-sm text-gray-400">
                    <div class="flex items-center gap-2">
                      <svg class="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                      </svg>
                      <span>Studio-quality processing</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <svg class="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                      </svg>
                      <span>Multi-track separation</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <svg class="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                      </svg>
                      <span>Professional metadata</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Professional Demo Section -->
              <section class="demo-section text-center">
                <h3 class="text-2xl font-bold text-white mb-4">Experience Professional Analysis</h3>
                <p class="text-gray-400 mb-6">Try our advanced analysis with a master-level demonstration track</p>
                <button 
                  on:click={loadDemoTrack}
                  class="px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-colors"
                >
                  🎸 Load Master Demo - "The Spirit Carries On"
                </button>
              </section>
              
            </div>
          {/if}
          
        </div>
        
      {:else if activeWorkspace === 'analyzer'}
        <!-- Professional Analyzer Workspace -->
        <div class="analyzer-workspace p-8" in:fade={{ duration: 300 }}>
          <h1 class="text-3xl font-bold text-white mb-8">Professional Audio Analyzer</h1>
          <!-- Advanced analyzer content would go here -->
          <div class="analyzer-placeholder bg-slate-800 rounded-xl p-12 border border-slate-700 text-center">
            <div class="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
            </div>
            <h3 class="text-xl font-bold text-white mb-2">Advanced Spectrum Analysis</h3>
            <p class="text-gray-400">Professional-grade audio analysis tools</p>
          </div>
        </div>
        
      {:else if activeWorkspace === 'practice'}
        <!-- Professional Practice Workspace -->
        <div class="practice-workspace p-8" in:fade={{ duration: 300 }}>
          <h1 class="text-3xl font-bold text-white mb-8">Professional Practice Studio</h1>
          <div class="practice-placeholder bg-slate-800 rounded-xl p-12 border border-slate-700 text-center">
            <div class="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <h3 class="text-xl font-bold text-white mb-2">Interactive Practice Sessions</h3>
            <p class="text-gray-400">Technique builders and performance tracking</p>
          </div>
        </div>
        
      {:else if activeWorkspace === 'masterclass'}
        <!-- Professional Masterclass Workspace -->
        <div class="masterclass-workspace p-8" in:fade={{ duration: 300 }}>
          <h1 class="text-3xl font-bold text-white mb-8">Master Class Sessions</h1>
          <div class="masterclass-placeholder bg-slate-800 rounded-xl p-12 border border-slate-700 text-center">
            <div class="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
              </svg>
            </div>
            <h3 class="text-xl font-bold text-white mb-2">World-Class Instruction</h3>
            <p class="text-gray-400">Learn from legendary guitarists</p>
          </div>
        </div>
        
      {:else if activeWorkspace === 'theory'}
        <!-- Professional Theory Workspace -->
        <div class="theory-workspace p-8" in:fade={{ duration: 300 }}>
          <h1 class="text-3xl font-bold text-white mb-8">Advanced Music Theory</h1>
          <div class="theory-placeholder bg-slate-800 rounded-xl p-12 border border-slate-700 text-center">
            <div class="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <h3 class="text-xl font-bold text-white mb-2">Comprehensive Theory Engine</h3>
            <p class="text-gray-400">Harmonic analysis and composition tools</p>
          </div>
        </div>
        
      {:else if activeWorkspace === 'community'}
        <!-- Professional Community Workspace -->
        <div class="community-workspace p-8" in:fade={{ duration: 300 }}>
          <h1 class="text-3xl font-bold text-white mb-8">Professional Community</h1>
          <div class="community-placeholder bg-slate-800 rounded-xl p-12 border border-slate-700 text-center">
            <div class="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            </div>
            <h3 class="text-xl font-bold text-white mb-2">Elite Guitar Network</h3>
            <p class="text-gray-400">Connect with professional musicians worldwide</p>
          </div>
        </div>
      {/if}
      
    </div>
    
  </main>
  
</div>

<style>
  .genesis-pro {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    min-height: 100vh;
  }
  
  .studio-dark {
    --bg-primary: #0f172a;
    --bg-secondary: #1e293b;
    --bg-tertiary: #334155;
    --text-primary: #ffffff;
    --text-secondary: #cbd5e1;
    --accent-primary: #f97316;
    --accent-secondary: #dc2626;
  }
  
  .vintage {
    --bg-primary: #1a1a1a;
    --bg-secondary: #2d2d2d;
    --bg-tertiary: #404040;
    --text-primary: #f5f5dc;
    --text-secondary: #ddd8c0;
    --accent-primary: #daa520;
    --accent-secondary: #cd853f;
  }
  
  .modern-light {
    --bg-primary: #fafafa;
    --bg-secondary: #ffffff;
    --bg-tertiary: #f5f5f5;
    --text-primary: #1a1a1a;
    --text-secondary: #666666;
    --accent-primary: #0066cc;
    --accent-secondary: #0052a3;
  }
  
  .volume-slider, .bpm-slider {
    -webkit-appearance: none;
    height: 4px;
    border-radius: 2px;
    background: #475569;
    outline: none;
  }
  
  .volume-slider::-webkit-slider-thumb, .bpm-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #f97316;
    cursor: pointer;
  }
  
  .tab-notation {
    text-shadow: 0 0 10px rgba(34, 197, 94, 0.3);
  }
  
  .loading-spinner {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .progress-fill {
    transition: width 0.3s ease-in-out;
  }
  
  /* Professional responsive design */
  @media (max-width: 1024px) {
    .left-panel {
      width: 300px;
    }
    
    .upload-options {
      grid-template-columns: 1fr;
    }
  }
  
  @media (max-width: 768px) {
    .workspace-nav {
      flex-wrap: wrap;
      gap: 1rem;
    }
    
    .nav-tab {
      font-size: 0.75rem;
      padding: 0.5rem 0.75rem;
    }
    
    .controls-layout {
      flex-direction: column;
      gap: 1rem;
    }
    
    .progress-section {
      margin: 0;
    }
  }
</style>