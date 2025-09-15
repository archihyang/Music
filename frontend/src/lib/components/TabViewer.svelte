<script>
  import { onMount, onDestroy } from 'svelte';
  import { writable, derived } from 'svelte/store';
  
  // Props
  export let data = null;
  export let zoom = 1.0;
  export let scrollSync = false;
  export let currentMeasure = 0;
  export let showTechniques = true;
  export let colorScheme = 'dark';
  
  // Default tuning settings
  const DEFAULT_TUNING = ['E', 'A', 'D', 'G', 'B', 'E'];
  const MEASURE_WIDTH = 200;
  const STRING_SPACING = 25;
  
  // Reactive states
  $: tuning = data?.tuning || DEFAULT_TUNING;
  $: measures = data?.measures || [];
  $: scaledMeasureWidth = MEASURE_WIDTH * zoom;
  
  // Stores for performance optimization
  const visibleMeasures = writable([]);
  const containerRef = writable(null);
  
  // Derived store for viewport calculation
  const viewport = derived(
    [containerRef],
    ([$container]) => {
      if (!$container) return { start: 0, end: 10 };
      
      const scrollLeft = $container.scrollLeft;
      const viewportWidth = $container.clientWidth;
      const start = Math.floor(scrollLeft / scaledMeasureWidth);
      const end = Math.ceil((scrollLeft + viewportWidth) / scaledMeasureWidth);
      
      return { start, end };
    }
  );
  
  // Intersection Observer for lazy loading
  let observer = null;
  
  onMount(() => {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const measureIndex = parseInt(entry.target.getAttribute('data-measure') || '0');
              renderMeasure(measureIndex);
            }
          });
        },
        { rootMargin: '100px' }
      );
    }
  });
  
  onDestroy(() => {
    observer?.disconnect();
  });
  
  // Optimized measure rendering
  function renderMeasure(index) {
    const measure = measures[index];
    if (!measure) return '';
    
    // Cache rendered measures
    if (measure._rendered) return measure._rendered;
    
    const lines: string[][] = tuning.map(() => []);
    
    measure.notes?.forEach((note: Note) => {
      if (note.string >= 1 && note.string <= 6) {
        const stringIndex = note.string - 1;
        const fretStr = note.fret.toString().padStart(2, '-');
        
        // Add technique markers if enabled
        if (showTechniques && note.techniques?.length) {
          const techniqueMarker = getTechniqueMarker(note.techniques[0]);
          lines[stringIndex].push(fretStr + techniqueMarker);
        } else {
          lines[stringIndex].push(fretStr);
        }
      }
    });
    
    // Pad lines to equal length
    const maxLength = Math.max(...lines.map(l => l.join('').length), 20);
    const rendered = lines.map(line => {
      const content = line.join('-') || '';
      return content.padEnd(maxLength, '-');
    });
    
    measure._rendered = rendered;
    return rendered;
  }
  
  // Get technique marker symbol
  function getTechniqueMarker(technique) {
    const markers: Record<string, string> = {
      'hammer': 'h',
      'pull': 'p',
      'slide': '/',
      'bend': 'b',
      'vibrato': '~',
      'palm-mute': 'PM'
    };
    return markers[technique] || '';
  }
  
  // Scroll to specific measure
  export function scrollToMeasure(measureIndex) {
    const container = $containerRef;
    if (!container) return;
    
    const targetPosition = measureIndex * scaledMeasureWidth;
    container.scrollTo({
      left: targetPosition,
      behavior: 'smooth'
    });
  }
  
  // Handle scroll sync with audio playback
  $: if (scrollSync && currentMeasure >= 0) {
    scrollToMeasure(currentMeasure);
  }
  
  // Memoized color scheme
  const getColorClasses = (scheme: string) => {
    const schemes = {
      light: {
        bg: 'bg-gray-50',
        text: 'text-gray-800',
        border: 'border-gray-300',
        tuning: 'text-blue-600',
        string: 'text-gray-600'
      },
      dark: {
        bg: 'bg-gray-800',
        text: 'text-gray-100',
        border: 'border-gray-600',
        tuning: 'text-blue-400',
        string: 'text-gray-400'
      },
      auto: {
        bg: 'bg-gray-800 dark:bg-gray-50',
        text: 'text-gray-100 dark:text-gray-800',
        border: 'border-gray-600 dark:border-gray-300',
        tuning: 'text-blue-400 dark:text-blue-600',
        string: 'text-gray-400 dark:text-gray-600'
      }
    };
    return schemes[scheme] || schemes.dark;
  };
  
  $: colors = getColorClasses(colorScheme);
</script>

<div class="tab-viewer relative" style="--zoom: {zoom}">
  <!-- Header with controls -->
  <div class="tab-header flex justify-between items-center mb-4 px-2">
    <div class="tuning-info">
      <span class="text-sm opacity-70">Tuning: </span>
      <span class="font-mono font-semibold">{tuning.join('-')}</span>
    </div>
    
    <div class="tab-controls flex gap-2">
      <button
        on:click={() => zoom = Math.max(0.5, zoom - 0.1)}
        class="zoom-btn p-1 rounded hover:bg-gray-700 transition-colors"
        aria-label="Zoom out"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
        </svg>
      </button>
      
      <span class="text-sm self-center px-2">{Math.round(zoom * 100)}%</span>
      
      <button
        on:click={() => zoom = Math.min(2.0, zoom + 0.1)}
        class="zoom-btn p-1 rounded hover:bg-gray-700 transition-colors"
        aria-label="Zoom in"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
        </svg>
      </button>
    </div>
  </div>
  
  <!-- Tab container with virtualization -->
  <div 
    bind:this={$containerRef}
    class="tab-container {colors.bg} {colors.border} border rounded-lg p-6 overflow-x-auto overflow-y-hidden"
    style="max-height: {STRING_SPACING * 6 + 100}px"
  >
    {#if measures.length > 0}
      <div 
        class="tab-content flex"
        style="width: {measures.length * scaledMeasureWidth}px"
      >
        {#each measures as measure, index}
          {#if index >= $viewport.start && index <= $viewport.end}
            <div 
              class="measure-container"
              style="width: {scaledMeasureWidth}px"
              data-measure={index}
              class:current-measure={index === currentMeasure}
            >
              <!-- Measure number -->
              <div class="measure-number text-xs opacity-50 mb-2">
                {index + 1}
              </div>
              
              <!-- Tab lines -->
              <div class="tab-staff">
                {#each tuning as note, stringIndex}
                  <div class="tab-line flex items-center" style="height: {STRING_SPACING}px">
                    <span class="tab-tuning {colors.tuning} font-bold w-6">{note}</span>
                    <span class="tab-string {colors.string} font-mono flex-1 text-sm">
                      {renderMeasure(index)[stringIndex] || '─'.repeat(20)}
                    </span>
                  </div>
                {/each}
              </div>
              
              <!-- Chord notation if available -->
              {#if measure.chord}
                <div class="chord-notation text-sm font-semibold mt-2 {colors.tuning}">
                  {measure.chord}
                </div>
              {/if}
            </div>
          {:else}
            <!-- Placeholder for non-visible measures -->
            <div 
              class="measure-placeholder"
              style="width: {scaledMeasureWidth}px"
              data-measure={index}
            />
          {/if}
        {/each}
      </div>
    {:else}
      <!-- Empty state -->
      <div class="empty-state text-center py-12">
        <svg class="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
        <p class="text-lg mb-2 opacity-70">No Tab Data Available</p>
        <p class="text-sm opacity-50">Upload or transcribe music to see tablature here</p>
      </div>
    {/if}
  </div>
  
  <!-- Playback position indicator -->
  {#if scrollSync && currentMeasure >= 0}
    <div 
      class="playback-indicator absolute top-0 w-1 bg-blue-500 opacity-50"
      style="left: {currentMeasure * scaledMeasureWidth}px; height: 100%"
    />
  {/if}
</div>

<style>
  .tab-viewer {
    min-height: 300px;
    position: relative;
  }
  
  .tab-container {
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
  }
  
  .tab-container::-webkit-scrollbar {
    height: 8px;
  }
  
  .tab-container::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
  }
  
  .tab-container::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 4px;
  }
  
  .tab-container::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.5);
  }
  
  .measure-container {
    flex-shrink: 0;
    transition: transform 0.2s ease;
  }
  
  .measure-container:hover {
    transform: scale(1.02);
  }
  
  .current-measure {
    background: rgba(59, 130, 246, 0.1);
    border-left: 2px solid rgb(59, 130, 246);
  }
  
  .tab-line {
    display: flex;
    align-items: center;
    white-space: nowrap;
    letter-spacing: 0.1em;
  }
  
  .tab-string {
    user-select: none;
    transform: scaleX(var(--zoom, 1));
    transform-origin: left center;
  }
  
  .zoom-btn {
    opacity: 0.7;
    transition: opacity 0.2s;
  }
  
  .zoom-btn:hover {
    opacity: 1;
  }
  
  .measure-placeholder {
    flex-shrink: 0;
    visibility: hidden;
  }
  
  .playback-indicator {
    pointer-events: none;
    transition: left 0.1s linear;
  }
  
  @media (max-width: 640px) {
    .tab-viewer {
      font-size: 0.875rem;
    }
    
    .tab-controls {
      position: fixed;
      bottom: 1rem;
      right: 1rem;
      background: rgba(0, 0, 0, 0.8);
      border-radius: 0.5rem;
      padding: 0.5rem;
      z-index: 10;
    }
  }
</style>