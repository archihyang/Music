<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Renderer, Stave, StaveNote, Voice, Formatter, TabStave, TabNote, Beam, Accidental } from 'vexflow';
  import Button from './ui/Button.svelte';
  import Card from './ui/Card.svelte';
  import { errorHandler, safeExecute } from '$lib/utils/errorHandler';
  
  // Props
  export let musicData: any = null;
  export let showTab = true;
  export let showControls = true;
  export let autoResize = true;
  export let theme: 'light' | 'dark' = 'light';
  
  // State
  let container: HTMLDivElement;
  let tabContainer: HTMLDivElement;
  let zoom = 100;
  let currentPage = 1;
  let totalPages = 1;
  let isPlaying = false;
  let selectedMeasure = -1;
  let isLoading = false;
  let renderError = false;
  
  // Constants
  const MIN_ZOOM = 50;
  const MAX_ZOOM = 200;
  const ZOOM_STEP = 10;
  const MEASURES_PER_LINE = 4;
  const LINES_PER_PAGE = 4;
  
  // Reactive
  $: scale = zoom / 100;
  $: measuresPerPage = MEASURES_PER_LINE * LINES_PER_PAGE;
  $: totalMeasures = musicData?.measures?.length || 0;
  $: totalPages = Math.ceil(totalMeasures / measuresPerPage);
  $: currentMeasures = getCurrentPageMeasures();
  
  function getCurrentPageMeasures() {
    if (!musicData?.measures) return [];
    const start = (currentPage - 1) * measuresPerPage;
    const end = start + measuresPerPage;
    return musicData.measures.slice(start, end);
  }
  
  async function renderNotation() {
    if (!container || !musicData) return;
    
    isLoading = true;
    renderError = false;
    
    await safeExecute(
      () => {
        // Clear container
        container.innerHTML = '';
        
        // Create renderer
        const renderer = new Renderer(container, Renderer.Backends.SVG);
        const width = container.clientWidth || 1200;
        const scaledWidth = width / scale;
        renderer.resize(scaledWidth, 600);
        
        const context = renderer.getContext();
        context.setFont('Arial', 10);
        context.scale(scale, scale);
        
        // Apply theme
        if (theme === 'dark') {
          context.setFillStyle('#e5e5e5');
          context.setStrokeStyle('#e5e5e5');
        } else {
          context.setFillStyle('#000000');
          context.setStrokeStyle('#000000');
        }
        
        // Render measures
        let x = 20;
        let y = 40;
        const measureWidth = (scaledWidth - 40) / MEASURES_PER_LINE;
        
        currentMeasures.forEach((measure, index) => {
          const globalIndex = (currentPage - 1) * measuresPerPage + index;
          
          // Create stave
          const stave = new Stave(x, y, measureWidth - 10);
          
          // Add clef and signatures to first measure of each line
          if (index % MEASURES_PER_LINE === 0) {
            stave.addClef('treble');
            if (globalIndex === 0) {
              stave.addKeySignature(musicData.keySignature || 'C');
              stave.addTimeSignature(musicData.timeSignature || '4/4');
            }
          }
          
          // Highlight selected measure
          if (globalIndex === selectedMeasure) {
            context.save();
            context.setFillStyle('rgba(14, 165, 233, 0.1)');
            context.fillRect(x - 5, y - 20, measureWidth, 120);
            context.restore();
          }
          
          // Add measure number
          context.save();
          context.setFont('Arial', 8);
          context.setFillStyle('#666');
          context.fillText(String(globalIndex + 1), x, y - 5);
          context.restore();
          
          stave.setContext(context).draw();
          
          // Create and render notes
          if (measure.notes && measure.notes.length > 0) {
            const notes = measure.notes.map(noteData => {
              const note = new StaveNote({
                clef: 'treble',
                keys: noteData.keys || ['c/4'],
                duration: noteData.duration || 'q',
                auto_stem: true
              });
              
              // Add accidentals
              (noteData.keys || []).forEach((key, i) => {
                if (key.includes('#')) {
                  note.addModifier(new Accidental('#'), i);
                } else if (key.includes('b')) {
                  note.addModifier(new Accidental('b'), i);
                }
              });
              
              return note;
            });
            
            // Create beams
            const beams = Beam.generateBeams(notes);
            
            // Create voice
            const voice = new Voice({ 
              num_beats: parseInt(musicData.timeSignature?.split('/')[0] || '4'), 
              beat_value: parseInt(musicData.timeSignature?.split('/')[1] || '4')
            });
            voice.addTickables(notes);
            
            // Format and draw
            new Formatter().joinVoices([voice]).format([voice], measureWidth - 60);
            voice.draw(context, stave);
            
            // Draw beams
            beams.forEach(beam => beam.setContext(context).draw());
          }
          
          // Update position
          x += measureWidth;
          if ((index + 1) % MEASURES_PER_LINE === 0) {
            x = 20;
            y += 140;
          }
        });
        
        isLoading = false;
      },
      {
        fallback: undefined,
        errorMessage: '악보 렌더링 중 오류가 발생했습니다',
        severity: 'high',
        context: { component: 'ProfessionalNotationViewer' }
      }
    ).then(result => {
      if (result === undefined) {
        renderError = true;
      }
    });
  }
  
  async function renderTabNotation() {
    if (!tabContainer || !musicData?.tabData || !showTab) return;
    
    await safeExecute(
      () => {
        tabContainer.innerHTML = '';
        
        const renderer = new Renderer(tabContainer, Renderer.Backends.SVG);
        const width = tabContainer.clientWidth || 1200;
        const scaledWidth = width / scale;
        renderer.resize(scaledWidth, 300);
        
        const context = renderer.getContext();
        context.scale(scale, scale);
        
        // Apply theme
        if (theme === 'dark') {
          context.setFillStyle('#e5e5e5');
          context.setStrokeStyle('#e5e5e5');
        }
        
        // Render tab staves
        let x = 20;
        let y = 20;
        const measureWidth = (scaledWidth - 40) / MEASURES_PER_LINE;
        
        const tabData = musicData.tabData.slice(
          (currentPage - 1) * measuresPerPage,
          currentPage * measuresPerPage
        );
        
        tabData.forEach((measure, index) => {
          const tabStave = new TabStave(x, y, measureWidth - 10);
          
          if (index % MEASURES_PER_LINE === 0) {
            tabStave.addClef('tab');
          }
          
          tabStave.setContext(context).draw();
          
          if (measure.notes && measure.notes.length > 0) {
            const tabNotes = measure.notes.map(noteData => {
              return new TabNote({
                positions: noteData.positions || [{ str: 3, fret: 0 }],
                duration: noteData.duration || 'q'
              });
            });
            
            const voice = new Voice({
              num_beats: parseInt(musicData.timeSignature?.split('/')[0] || '4'),
              beat_value: parseInt(musicData.timeSignature?.split('/')[1] || '4')
            });
            voice.addTickables(tabNotes);
            
            new Formatter().joinVoices([voice]).format([voice], measureWidth - 60);
            voice.draw(context, tabStave);
          }
          
          x += measureWidth;
          if ((index + 1) % MEASURES_PER_LINE === 0) {
            x = 20;
            y += 80;
          }
        });
      },
      {
        errorMessage: 'Tab 악보 렌더링 중 오류가 발생했습니다',
        severity: 'medium'
      }
    );
  }
  
  // Event handlers
  function handleZoomIn() {
    if (zoom < MAX_ZOOM) {
      zoom = Math.min(zoom + ZOOM_STEP, MAX_ZOOM);
      renderNotation();
      if (showTab) renderTabNotation();
    }
  }
  
  function handleZoomOut() {
    if (zoom > MIN_ZOOM) {
      zoom = Math.max(zoom - ZOOM_STEP, MIN_ZOOM);
      renderNotation();
      if (showTab) renderTabNotation();
    }
  }
  
  function handleZoomReset() {
    zoom = 100;
    renderNotation();
    if (showTab) renderTabNotation();
  }
  
  function handlePrevPage() {
    if (currentPage > 1) {
      currentPage--;
      renderNotation();
      if (showTab) renderTabNotation();
    }
  }
  
  function handleNextPage() {
    if (currentPage < totalPages) {
      currentPage++;
      renderNotation();
      if (showTab) renderTabNotation();
    }
  }
  
  function handlePrint() {
    window.print();
  }
  
  function handleExport(format: 'svg' | 'pdf' | 'png') {
    // Implementation would go here
    console.log(`Exporting as ${format}`);
  }
  
  function handleMeasureClick(index: number) {
    selectedMeasure = selectedMeasure === index ? -1 : index;
    renderNotation();
  }
  
  // Lifecycle
  onMount(() => {
    if (musicData) {
      renderNotation();
      if (showTab) renderTabNotation();
    }
    
    // Handle resize
    if (autoResize && typeof window !== 'undefined') {
      const resizeObserver = new ResizeObserver(() => {
        renderNotation();
        if (showTab) renderTabNotation();
      });
      
      if (container) resizeObserver.observe(container);
      if (tabContainer) resizeObserver.observe(tabContainer);
      
      return () => {
        resizeObserver.disconnect();
      };
    }
  });
  
  $: if (musicData) {
    renderNotation();
    if (showTab) renderTabNotation();
  }
</script>

<div class="notation-viewer" data-theme={theme}>
  {#if showControls}
    <div class="toolbar">
      <div class="toolbar-section">
        <Button size="sm" variant="ghost" on:click={handlePrevPage} disabled={currentPage === 1}>
          ◀
        </Button>
        <span class="page-info">
          {currentPage} / {totalPages}
        </span>
        <Button size="sm" variant="ghost" on:click={handleNextPage} disabled={currentPage === totalPages}>
          ▶
        </Button>
      </div>
      
      <div class="toolbar-section">
        <Button size="sm" variant="ghost" on:click={handleZoomOut} disabled={zoom <= MIN_ZOOM}>
          －
        </Button>
        <span class="zoom-info">{zoom}%</span>
        <Button size="sm" variant="ghost" on:click={handleZoomIn} disabled={zoom >= MAX_ZOOM}>
          ＋
        </Button>
        <Button size="sm" variant="ghost" on:click={handleZoomReset}>
          ⟲
        </Button>
      </div>
      
      <div class="toolbar-section">
        <Button size="sm" variant="ghost" on:click={() => handleExport('svg')}>
          SVG
        </Button>
        <Button size="sm" variant="ghost" on:click={() => handleExport('pdf')}>
          PDF
        </Button>
        <Button size="sm" variant="ghost" on:click={() => handleExport('png')}>
          PNG
        </Button>
        <Button size="sm" variant="ghost" on:click={handlePrint}>
          🖨️
        </Button>
      </div>
      
      <div class="toolbar-section">
        <label class="toggle-label">
          <input type="checkbox" bind:checked={showTab} on:change={() => renderTabNotation()} />
          Tab 표시
        </label>
      </div>
    </div>
  {/if}
  
  <Card variant="bordered" padding="none" class="notation-card">
    {#if isLoading}
      <div class="loading-overlay">
        <div class="spinner"></div>
        <p>악보를 렌더링하고 있습니다...</p>
      </div>
    {/if}
    
    {#if renderError}
      <div class="error-message">
        <p>😢 악보를 표시할 수 없습니다</p>
        <p class="error-detail">VexFlow 렌더링 오류가 발생했습니다</p>
        <Button size="sm" on:click={renderNotation}>다시 시도</Button>
      </div>
    {:else}
      <div class="notation-container" bind:this={container}></div>
      
      {#if showTab}
        <div class="tab-container" bind:this={tabContainer}></div>
      {/if}
    {/if}
  </Card>
</div>

<style>
  .notation-viewer {
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
  
  .page-info,
  .zoom-info {
    min-width: 60px;
    text-align: center;
    font-size: 0.875rem;
    color: #666;
  }
  
  .toggle-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    cursor: pointer;
  }
  
  .notation-card {
    min-height: 400px;
    position: relative;
    overflow: hidden;
  }
  
  .notation-container,
  .tab-container {
    padding: 1rem;
    background: white;
    min-height: 200px;
  }
  
  .tab-container {
    border-top: 1px solid #e5e5e5;
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
  
  .error-message {
    padding: 3rem;
    text-align: center;
  }
  
  .error-message p {
    margin-bottom: 0.5rem;
    color: #666;
  }
  
  .error-detail {
    font-size: 0.875rem;
    color: #999;
    margin-bottom: 1rem !important;
  }
  
  /* Dark theme */
  [data-theme="dark"] .toolbar {
    background: #1a1a1a;
    border-color: #333;
  }
  
  [data-theme="dark"] .notation-container,
  [data-theme="dark"] .tab-container {
    background: #0a0a0a;
  }
  
  [data-theme="dark"] .tab-container {
    border-top-color: #333;
  }
  
  [data-theme="dark"] .page-info,
  [data-theme="dark"] .zoom-info {
    color: #a3a3a3;
  }
  
  [data-theme="dark"] .loading-overlay {
    background: rgba(10, 10, 10, 0.95);
  }
  
  /* Print styles */
  @media print {
    .toolbar {
      display: none;
    }
    
    .notation-card {
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
  }
</style>