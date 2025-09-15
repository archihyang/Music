<script>
  import { onMount } from 'svelte';
  import { fade, slide } from 'svelte/transition';
  import { writable, derived } from 'svelte/store';
  
  // Props
  export let analysisData: any = null;
  export let currentChord: string | null = null;
  export let currentScale: string | null = null;
  export let tempo: number = 120;
  export let timeSignature: string = '4/4';
  export let key: string | null = null;
  
  // State
  let activeTab: 'chords' | 'scales' | 'progression' | 'techniques' = 'chords';
  let selectedChord = writable<string | null>(null);
  let selectedScale = writable<string | null>(null);
  let chordProgression = writable<string[]>([]);
  
  // Music theory data
  const CHORD_TYPES = {
    major: { intervals: [0, 4, 7], symbol: '', name: 'Major' },
    minor: { intervals: [0, 3, 7], symbol: 'm', name: 'Minor' },
    seventh: { intervals: [0, 4, 7, 11], symbol: '7', name: 'Dominant 7th' },
    maj7: { intervals: [0, 4, 7, 11], symbol: 'maj7', name: 'Major 7th' },
    min7: { intervals: [0, 3, 7, 10], symbol: 'm7', name: 'Minor 7th' },
    dim: { intervals: [0, 3, 6], symbol: 'dim', name: 'Diminished' },
    aug: { intervals: [0, 4, 8], symbol: 'aug', name: 'Augmented' },
    sus2: { intervals: [0, 2, 7], symbol: 'sus2', name: 'Suspended 2nd' },
    sus4: { intervals: [0, 5, 7], symbol: 'sus4', name: 'Suspended 4th' }
  };
  
  const SCALE_TYPES = {
    major: { intervals: [0, 2, 4, 5, 7, 9, 11], name: 'Major (Ionian)' },
    minor: { intervals: [0, 2, 3, 5, 7, 8, 10], name: 'Natural Minor (Aeolian)' },
    dorian: { intervals: [0, 2, 3, 5, 7, 9, 10], name: 'Dorian' },
    phrygian: { intervals: [0, 1, 3, 5, 7, 8, 10], name: 'Phrygian' },
    lydian: { intervals: [0, 2, 4, 6, 7, 9, 11], name: 'Lydian' },
    mixolydian: { intervals: [0, 2, 4, 5, 7, 9, 10], name: 'Mixolydian' },
    locrian: { intervals: [0, 1, 3, 5, 6, 8, 10], name: 'Locrian' },
    harmonic_minor: { intervals: [0, 2, 3, 5, 7, 8, 11], name: 'Harmonic Minor' },
    melodic_minor: { intervals: [0, 2, 3, 5, 7, 9, 11], name: 'Melodic Minor' },
    pentatonic_major: { intervals: [0, 2, 4, 7, 9], name: 'Major Pentatonic' },
    pentatonic_minor: { intervals: [0, 3, 5, 7, 10], name: 'Minor Pentatonic' },
    blues: { intervals: [0, 3, 5, 6, 7, 10], name: 'Blues' }
  };
  
  const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  // Common chord progressions
  const COMMON_PROGRESSIONS = {
    'I-IV-V': ['I', 'IV', 'V'],
    'I-V-vi-IV': ['I', 'V', 'vi', 'IV'],
    'ii-V-I': ['ii', 'V', 'I'],
    'I-vi-IV-V': ['I', 'vi', 'IV', 'V'],
    'vi-IV-I-V': ['vi', 'IV', 'I', 'V'],
    '12-bar Blues': ['I', 'I', 'I', 'I', 'IV', 'IV', 'I', 'I', 'V', 'IV', 'I', 'V'],
    'Pachelbel': ['I', 'V', 'vi', 'iii', 'IV', 'I', 'IV', 'V']
  };
  
  // Guitar techniques found in analysis
  const TECHNIQUE_ICONS = {
    'bend': '↗',
    'slide': '/',
    'hammer': 'h',
    'pull': 'p',
    'vibrato': '~',
    'palm-mute': 'PM',
    'harmonic': '◊',
    'tapping': 'T'
  };
  
  // Calculate chord from intervals
  function getChordNotes(root: string, type: string): string[] {
    const rootIndex = NOTES.indexOf(root);
    const chordType = CHORD_TYPES[type] || CHORD_TYPES.major;
    
    return chordType.intervals.map(interval => 
      NOTES[(rootIndex + interval) % 12]
    );
  }
  
  // Calculate scale notes
  function getScaleNotes(root: string, type: string): string[] {
    const rootIndex = NOTES.indexOf(root);
    const scaleType = SCALE_TYPES[type] || SCALE_TYPES.major;
    
    return scaleType.intervals.map(interval => 
      NOTES[(rootIndex + interval) % 12]
    );
  }
  
  // Roman numeral analysis
  function getRomanNumeral(degree: number, isMinor: boolean = false): string {
    const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
    const numeral = numerals[degree - 1];
    return isMinor ? numeral.toLowerCase() : numeral;
  }
  
  // Analyze chord progression in key
  function analyzeProgression(chords: string[], key: string): any[] {
    const keyIndex = NOTES.indexOf(key);
    const isMinorKey = analysisData?.key?.includes('minor');
    
    return chords.map(chord => {
      const chordRoot = chord[0];
      const chordIndex = NOTES.indexOf(chordRoot);
      const degree = ((chordIndex - keyIndex + 12) % 12) + 1;
      
      // Determine if chord is major or minor based on key
      const scaleType = isMinorKey ? 'minor' : 'major';
      const scale = SCALE_TYPES[scaleType];
      const isChordMinor = chord.includes('m') && !chord.includes('maj');
      
      return {
        chord,
        roman: getRomanNumeral(degree, isChordMinor),
        function: getChordFunction(degree),
        notes: getChordNotes(chordRoot, isChordMinor ? 'minor' : 'major')
      };
    });
  }
  
  // Get chord function in key
  function getChordFunction(degree: number): string {
    const functions = {
      1: 'Tonic',
      2: 'Supertonic',
      3: 'Mediant',
      4: 'Subdominant',
      5: 'Dominant',
      6: 'Submediant',
      7: 'Leading Tone'
    };
    return functions[degree] || 'Unknown';
  }
  
  // Format techniques for display
  function formatTechniques(techniques: any[]): string {
    if (!techniques || techniques.length === 0) return 'None detected';
    
    return techniques
      .map(t => `${TECHNIQUE_ICONS[t.type] || t.type} (${t.count}x)`)
      .join(', ');
  }
  
  // Calculate mode characteristics
  function getModeCharacteristics(mode: string): any {
    const characteristics = {
      major: { mood: 'Happy, Bright', color: '#FFD700', usage: 'Pop, Rock, Country' },
      minor: { mood: 'Sad, Dark', color: '#4B0082', usage: 'Blues, Metal, Ballads' },
      dorian: { mood: 'Jazzy, Sophisticated', color: '#008B8B', usage: 'Jazz, Funk, Progressive' },
      phrygian: { mood: 'Spanish, Exotic', color: '#8B0000', usage: 'Flamenco, Metal, Middle Eastern' },
      lydian: { mood: 'Dreamy, Ethereal', color: '#87CEEB', usage: 'Film Scores, Progressive Rock' },
      mixolydian: { mood: 'Bluesy, Rock', color: '#FF8C00', usage: 'Blues, Rock, Jam Bands' },
      locrian: { mood: 'Dissonant, Unstable', color: '#2F4F4F', usage: 'Rarely used, Experimental' }
    };
    
    return characteristics[mode] || characteristics.major;
  }
  
  // Derived stores
  const chordNotes = derived(selectedChord, ($chord) => {
    if (!$chord) return [];
    const [root, ...type] = $chord.split('');
    return getChordNotes(root, type.join(''));
  });
  
  const scaleNotes = derived(selectedScale, ($scale) => {
    if (!$scale) return [];
    const [root, type] = $scale.split(' ');
    return getScaleNotes(root, type);
  });
</script>

<div class="theory-panel bg-gray-900 rounded-lg p-4">
  <!-- Header with tabs -->
  <div class="header mb-4">
    <h3 class="text-lg font-semibold mb-3">Music Theory Analysis</h3>
    
    <div class="tabs flex gap-2 border-b border-gray-700">
      <button
        on:click={() => activeTab = 'chords'}
        class="tab px-4 py-2 transition-colors"
        class:active={activeTab === 'chords'}
      >
        Chords
      </button>
      <button
        on:click={() => activeTab = 'scales'}
        class="tab px-4 py-2 transition-colors"
        class:active={activeTab === 'scales'}
      >
        Scales
      </button>
      <button
        on:click={() => activeTab = 'progression'}
        class="tab px-4 py-2 transition-colors"
        class:active={activeTab === 'progression'}
      >
        Progression
      </button>
      <button
        on:click={() => activeTab = 'techniques'}
        class="tab px-4 py-2 transition-colors"
        class:active={activeTab === 'techniques'}
      >
        Techniques
      </button>
    </div>
  </div>
  
  <!-- Song Info -->
  {#if analysisData}
    <div class="song-info mb-4 p-3 bg-gray-800 rounded" transition:fade>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div>
          <span class="text-gray-400">Key:</span>
          <span class="ml-2 font-semibold">{key || 'Unknown'}</span>
        </div>
        <div>
          <span class="text-gray-400">Tempo:</span>
          <span class="ml-2 font-semibold">{tempo} BPM</span>
        </div>
        <div>
          <span class="text-gray-400">Time:</span>
          <span class="ml-2 font-semibold">{timeSignature}</span>
        </div>
        <div>
          <span class="text-gray-400">Mode:</span>
          <span class="ml-2 font-semibold">{analysisData.mode || 'Major'}</span>
        </div>
      </div>
    </div>
  {/if}
  
  <!-- Tab Content -->
  <div class="tab-content">
    {#if activeTab === 'chords'}
      <div class="chords-panel" transition:slide>
        <!-- Current Chord Display -->
        {#if currentChord}
          <div class="current-chord mb-4 p-4 bg-gradient-to-r from-orange-900 to-orange-800 rounded">
            <h4 class="text-sm text-orange-200 mb-1">Currently Playing</h4>
            <div class="text-2xl font-bold">{currentChord}</div>
            <div class="chord-notes mt-2 flex gap-2">
              {#each getChordNotes(currentChord[0], currentChord.slice(1)) as note}
                <span class="px-2 py-1 bg-orange-700 rounded text-sm">{note}</span>
              {/each}
            </div>
          </div>
        {/if}
        
        <!-- Chord Library -->
        <div class="chord-library">
          <h4 class="text-sm font-semibold mb-3">Common Chords in {key || 'C'}</h4>
          <div class="grid grid-cols-3 md:grid-cols-4 gap-2">
            {#each Object.entries(CHORD_TYPES) as [type, data]}
              <button
                on:click={() => selectedChord.set(`${key || 'C'}${data.symbol}`)}
                class="chord-btn p-2 bg-gray-800 hover:bg-gray-700 rounded transition-colors text-sm"
                class:selected={$selectedChord === `${key || 'C'}${data.symbol}`}
              >
                {key || 'C'}{data.symbol}
                <div class="text-xs text-gray-400 mt-1">{data.name}</div>
              </button>
            {/each}
          </div>
        </div>
        
        <!-- Selected Chord Details -->
        {#if $selectedChord}
          <div class="chord-details mt-4 p-3 bg-gray-800 rounded" transition:fade>
            <h4 class="text-sm font-semibold mb-2">Chord Analysis: {$selectedChord}</h4>
            <div class="flex gap-2 mb-2">
              {#each $chordNotes as note}
                <span class="px-2 py-1 bg-gray-700 rounded text-xs">{note}</span>
              {/each}
            </div>
            <div class="text-xs text-gray-400">
              Click on the fretboard to see fingering positions
            </div>
          </div>
        {/if}
      </div>
    {/if}
    
    {#if activeTab === 'scales'}
      <div class="scales-panel" transition:slide>
        <!-- Current Scale Display -->
        {#if currentScale}
          <div class="current-scale mb-4 p-4 bg-gradient-to-r from-blue-900 to-blue-800 rounded">
            <h4 class="text-sm text-blue-200 mb-1">Active Scale</h4>
            <div class="text-2xl font-bold">{currentScale}</div>
            <div class="scale-notes mt-2 flex flex-wrap gap-2">
              {#each getScaleNotes(currentScale.split(' ')[0], currentScale.split(' ')[1]) as note}
                <span class="px-2 py-1 bg-blue-700 rounded text-sm">{note}</span>
              {/each}
            </div>
          </div>
        {/if}
        
        <!-- Scale Selector -->
        <div class="scale-library">
          <h4 class="text-sm font-semibold mb-3">Available Scales</h4>
          <div class="grid grid-cols-2 gap-2">
            {#each Object.entries(SCALE_TYPES) as [type, data]}
              <button
                on:click={() => selectedScale.set(`${key || 'C'} ${type}`)}
                class="scale-btn p-3 bg-gray-800 hover:bg-gray-700 rounded transition-colors text-sm"
                class:selected={$selectedScale === `${key || 'C'} ${type}`}
              >
                <div class="font-semibold">{key || 'C'} {data.name}</div>
                <div class="text-xs text-gray-400 mt-1">
                  {data.intervals.length} notes
                </div>
              </button>
            {/each}
          </div>
        </div>
        
        <!-- Mode Characteristics -->
        {#if $selectedScale}
          {@const mode = $selectedScale.split(' ')[1] || 'major'}
          {@const characteristics = getModeCharacteristics(mode)}
          <div class="mode-info mt-4 p-3 bg-gray-800 rounded" transition:fade>
            <h4 class="text-sm font-semibold mb-2">Mode Characteristics</h4>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span class="text-gray-400">Mood:</span>
                <span class="ml-2">{characteristics.mood}</span>
              </div>
              <div>
                <span class="text-gray-400">Common Usage:</span>
                <span class="ml-2">{characteristics.usage}</span>
              </div>
            </div>
            <div class="scale-notes mt-3 flex flex-wrap gap-2">
              {#each $scaleNotes as note}
                <span class="px-2 py-1 bg-gray-700 rounded text-xs">{note}</span>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/if}
    
    {#if activeTab === 'progression'}
      <div class="progression-panel" transition:slide>
        <!-- Detected Progression -->
        {#if analysisData?.progression}
          <div class="detected-progression mb-4 p-4 bg-gradient-to-r from-purple-900 to-purple-800 rounded">
            <h4 class="text-sm text-purple-200 mb-2">Detected Progression</h4>
            <div class="flex gap-2 flex-wrap">
              {#each analysisData.progression as chord}
                <div class="chord-box p-2 bg-purple-700 rounded">
                  <div class="font-bold">{chord.chord}</div>
                  <div class="text-xs text-purple-200">{chord.roman}</div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
        
        <!-- Common Progressions -->
        <div class="common-progressions">
          <h4 class="text-sm font-semibold mb-3">Common Progressions</h4>
          <div class="space-y-2">
            {#each Object.entries(COMMON_PROGRESSIONS) as [name, progression]}
              <button
                on:click={() => chordProgression.set(progression)}
                class="progression-btn w-full p-3 bg-gray-800 hover:bg-gray-700 rounded transition-colors text-left"
              >
                <div class="font-semibold">{name}</div>
                <div class="text-sm text-gray-400 mt-1">
                  {progression.join(' - ')}
                </div>
              </button>
            {/each}
          </div>
        </div>
        
        <!-- Selected Progression Analysis -->
        {#if $chordProgression.length > 0}
          <div class="progression-analysis mt-4 p-3 bg-gray-800 rounded" transition:fade>
            <h4 class="text-sm font-semibold mb-2">Progression Analysis</h4>
            <div class="space-y-2">
              {#each analyzeProgression($chordProgression, key || 'C') as step, i}
                <div class="flex items-center gap-3 text-sm">
                  <span class="text-gray-400 w-8">{i + 1}.</span>
                  <span class="font-semibold w-12">{step.roman}</span>
                  <span class="text-gray-300">{step.function}</span>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/if}
    
    {#if activeTab === 'techniques'}
      <div class="techniques-panel" transition:slide>
        <!-- Detected Techniques -->
        <div class="detected-techniques mb-4">
          <h4 class="text-sm font-semibold mb-3">Detected Guitar Techniques</h4>
          
          {#if analysisData?.techniques}
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              {#each analysisData.techniques as technique}
                <div class="technique-card p-3 bg-gray-800 rounded">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-2xl">{TECHNIQUE_ICONS[technique.type]}</span>
                    <span class="font-semibold capitalize">{technique.type}</span>
                  </div>
                  <div class="text-xs text-gray-400">
                    {technique.count} occurrences
                  </div>
                  <div class="text-xs text-gray-500 mt-1">
                    Measures: {technique.measures.join(', ')}
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <div class="text-gray-400 text-sm">
              No techniques detected yet. Start playing to see analysis.
            </div>
          {/if}
        </div>
        
        <!-- Technique Guide -->
        <div class="technique-guide mt-4">
          <h4 class="text-sm font-semibold mb-3">Technique Guide</h4>
          <div class="space-y-2">
            {#each Object.entries(TECHNIQUE_ICONS) as [type, icon]}
              <div class="flex items-center gap-3 p-2 bg-gray-800 rounded text-sm">
                <span class="text-xl w-8 text-center">{icon}</span>
                <span class="capitalize font-semibold">{type.replace('-', ' ')}</span>
                <span class="text-gray-400 text-xs ml-auto">
                  {type === 'bend' && 'Bend string to raise pitch'}
                  {type === 'slide' && 'Slide between frets'}
                  {type === 'hammer' && 'Hammer-on to higher fret'}
                  {type === 'pull' && 'Pull-off to lower fret'}
                  {type === 'vibrato' && 'Rapid pitch variation'}
                  {type === 'palm-mute' && 'Mute with palm'}
                  {type === 'harmonic' && 'Natural or artificial harmonic'}
                  {type === 'tapping' && 'Tap with picking hand'}
                </span>
              </div>
            {/each}
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .theory-panel {
    min-height: 400px;
  }
  
  .tab {
    position: relative;
    color: #9CA3AF;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
  }
  
  .tab:hover {
    color: #FFFFFF;
  }
  
  .tab.active {
    color: #F39C12;
    border-bottom-color: #F39C12;
  }
  
  .chord-btn.selected,
  .scale-btn.selected {
    background-color: rgba(243, 156, 18, 0.2);
    border: 1px solid #F39C12;
  }
  
  .technique-card {
    transition: transform 0.2s;
  }
  
  .technique-card:hover {
    transform: translateY(-2px);
  }
  
  @media (max-width: 640px) {
    .tabs {
      overflow-x: auto;
      white-space: nowrap;
    }
    
    .grid {
      grid-template-columns: 1fr;
    }
  }
</style>