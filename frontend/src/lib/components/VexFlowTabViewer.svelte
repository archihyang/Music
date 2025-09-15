<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { VexFlowData, TabMeasure, GuitarNote } from '$lib/types/tab';
  
  export let vexflowData: VexFlowData | null = null;
  export let width: number = 1200;
  export let height: number = 800;
  export let interactive: boolean = true;
  export let showPlayhead: boolean = false;
  export let currentTime: number = 0;
  
  let container: HTMLDivElement;
  let renderer: any;
  let context: any;
  let VF: any;
  let isLoaded = false;
  let selectedNote: GuitarNote | null = null;
  
  // Playhead position
  let playheadX = 0;
  let playheadVisible = false;
  
  // Load VexFlow library
  onMount(async () => {
    // Load VexFlow from CDN
    if (!window.Vex) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/vexflow@4.2.2/build/cjs/vexflow.js';
      script.onload = () => {
        initializeVexFlow();
      };
      document.head.appendChild(script);
    } else {
      initializeVexFlow();
    }
  });
  
  onDestroy(() => {
    // Clean up
    if (renderer) {
      renderer = null;
      context = null;
    }
  });
  
  function initializeVexFlow() {
    VF = window.Vex.Flow;
    isLoaded = true;
    
    if (vexflowData) {
      renderTab();
    }
  }
  
  function renderTab() {
    if (!isLoaded || !container || !vexflowData) return;
    
    // Clear previous content
    container.innerHTML = '';
    
    // Create renderer
    renderer = new VF.Renderer(container, VF.Renderer.Backends.SVG);
    renderer.resize(width, height);
    context = renderer.getContext();
    
    // Set font styles
    context.setFont(vexflowData.config.font_family, vexflowData.config.font_size);
    context.setFillStyle(vexflowData.config.note_color);
    
    // Render chord diagrams
    renderChordDiagrams();
    
    // Render staves
    renderStaves();
    
    // Add interactive features
    if (interactive) {
      addInteractivity();
    }
  }
  
  function renderStaves() {
    vexflowData.staves.forEach((staveData, index) => {
      // Create stave
      const stave = new VF.TabStave(
        staveData.x,
        staveData.y,
        staveData.width,
        {
          num_lines: staveData.options.num_lines || 6,
          spacing_between_lines_px: staveData.options.spacing_between_lines_px || 20
        }
      );
      
      // Add clef and time signature
      if (staveData.clef) {
        stave.addClef(staveData.clef);
      }
      if (staveData.time_signature) {
        stave.addTimeSignature(staveData.time_signature);
      }
      if (staveData.tempo) {
        stave.setTempo(staveData.tempo.bpm, staveData.tempo.duration);
      }
      
      // Draw stave
      stave.setContext(context).draw();
      
      // Create and draw notes
      if (staveData.notes && staveData.notes.length > 0) {
        const notes = createNotes(staveData.notes);
        const voice = createVoice(notes, vexflowData.time_signature);
        
        // Format and draw voice
        new VF.Formatter()
          .joinVoices([voice])
          .format([voice], staveData.width - 50);
        
        voice.draw(context, stave);
        
        // Add techniques and annotations
        addTechniques(notes, staveData.notes);
      }
    });
  }
  
  function createNotes(noteData: any[]): any[] {
    return noteData.map(data => {
      const tabNote = new VF.TabNote({
        positions: data.positions,
        duration: data.duration
      });
      
      // Store original data for interaction
      tabNote.originalData = data;
      
      return tabNote;
    });
  }
  
  function createVoice(notes: any[], timeSignature: [number, number]): any {
    const voice = new VF.Voice({
      num_beats: timeSignature[0],
      beat_value: timeSignature[1]
    });
    voice.addTickables(notes);
    return voice;
  }
  
  function addTechniques(vexNotes: any[], noteData: any[]) {
    vexNotes.forEach((note, index) => {
      const data = noteData[index];
      
      if (data.modifiers) {
        data.modifiers.forEach(mod => {
          if (mod.type === 'annotation') {
            const annotation = new VF.Annotation(mod.text);
            annotation.setPosition(mod.position === 'above' ? 3 : 4);
            annotation.setStyle({
              fillStyle: vexflowData.config.technique_color,
              strokeStyle: vexflowData.config.technique_color
            });
            note.addModifier(annotation);
          }
        });
      }
    });
  }
  
  function renderChordDiagrams() {
    if (!vexflowData.chord_diagrams || !vexflowData.config.show_chord_diagrams) return;
    
    vexflowData.chord_diagrams.forEach(diagram => {
      drawChordDiagram(
        diagram.x,
        diagram.y,
        diagram.chord,
        diagram.positions,
        diagram.barres
      );
    });
  }
  
  function drawChordDiagram(x: number, y: number, chordName: string, positions: any[], barres: any[]) {
    const size = vexflowData.config.chord_diagram_size;
    
    // Draw chord name
    context.setFont('Arial', 14, 'bold');
    context.fillText(chordName, x + size/2 - 10, y - 5);
    
    // Draw diagram box
    context.setLineWidth(1);
    context.beginPath();
    
    // Vertical lines (strings)
    for (let i = 0; i < 6; i++) {
      const stringX = x + (i * size/5);
      context.moveTo(stringX, y);
      context.lineTo(stringX, y + size);
    }
    
    // Horizontal lines (frets)
    for (let i = 0; i <= 5; i++) {
      const fretY = y + (i * size/5);
      context.moveTo(x, fretY);
      context.lineTo(x + size, fretY);
    }
    
    context.stroke();
    
    // Draw positions
    positions.forEach(pos => {
      if (pos.fret > 0) {
        const dotX = x + ((pos.str - 1) * size/5);
        const dotY = y + ((pos.fret - 0.5) * size/5);
        
        context.beginPath();
        context.arc(dotX, dotY, size/20, 0, Math.PI * 2);
        context.fill();
      } else if (pos.fret === 0) {
        // Open string
        const circleX = x + ((pos.str - 1) * size/5);
        const circleY = y - size/20;
        
        context.beginPath();
        context.arc(circleX, circleY, size/30, 0, Math.PI * 2);
        context.stroke();
      }
    });
    
    // Draw barres
    barres.forEach(barre => {
      const barreY = y + ((barre.fret - 0.5) * size/5);
      const fromX = x + ((barre.from_string - 1) * size/5);
      const toX = x + ((barre.to_string - 1) * size/5);
      
      context.setLineWidth(size/15);
      context.beginPath();
      context.moveTo(fromX, barreY);
      context.lineTo(toX, barreY);
      context.stroke();
      context.setLineWidth(1);
    });
  }
  
  function addInteractivity() {
    const svg = container.querySelector('svg');
    if (!svg) return;
    
    // Add click handlers to notes
    const notes = svg.querySelectorAll('.vf-tabnote');
    notes.forEach((note, index) => {
      note.addEventListener('click', (e) => {
        handleNoteClick(index);
      });
      
      note.addEventListener('mouseenter', (e) => {
        note.style.cursor = 'pointer';
        note.style.opacity = '0.7';
      });
      
      note.addEventListener('mouseleave', (e) => {
        note.style.opacity = '1';
      });
    });
  }
  
  function handleNoteClick(noteIndex: number) {
    console.log('Note clicked:', noteIndex);
    // Emit event for parent component
    dispatch('noteClick', { index: noteIndex });
  }
  
  function updatePlayhead() {
    if (!showPlayhead || !vexflowData) return;
    
    // Calculate playhead position based on current time
    const totalDuration = vexflowData.duration || 10; // seconds
    const progress = currentTime / totalDuration;
    
    playheadX = width * progress;
    playheadVisible = progress >= 0 && progress <= 1;
  }
  
  // React to prop changes
  $: if (vexflowData && isLoaded) {
    renderTab();
  }
  
  $: if (showPlayhead) {
    updatePlayhead();
  }
  
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
</script>

<div class="vexflow-container" bind:this={container}>
  {#if !isLoaded}
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading VexFlow...</p>
    </div>
  {/if}
  
  {#if showPlayhead && playheadVisible}
    <div 
      class="playhead" 
      style="left: {playheadX}px"
      aria-hidden="true"
    ></div>
  {/if}
</div>

<style>
  .vexflow-container {
    position: relative;
    width: 100%;
    height: 100%;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    overflow: auto;
    padding: 20px;
  }
  
  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
  }
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .playhead {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    background: #ff0000;
    pointer-events: none;
    z-index: 10;
    transition: left 0.1s linear;
  }
  
  /* Print styles */
  @media print {
    .vexflow-container {
      border: none;
      page-break-inside: avoid;
    }
    
    .playhead {
      display: none;
    }
  }
  
  /* Dark mode support */
  :global(.dark) .vexflow-container {
    background: #1a1a1a;
    border-color: #333;
  }
  
  :global(.dark) .vexflow-container :global(svg) {
    filter: invert(1) hue-rotate(180deg);
  }
</style>
