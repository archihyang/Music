<script>
  import { onMount, onDestroy } from 'svelte';
  import { writable } from 'svelte/store';
  import * as THREE from 'three';
  
  // Props
  export let currentNotes: Array<{string: number, fret: number}> = [];
  export let highlightedScale: string | null = null;
  export let highlightedChord: string | null = null;
  export let tuning: string[] = ['E', 'A', 'D', 'G', 'B', 'E'];
  export let fretCount: number = 22;
  export let interactive: boolean = true;
  export let view3D: boolean = false;
  
  // State
  let canvas: HTMLCanvasElement;
  let container: HTMLDivElement;
  let hoveredNote: {string: number, fret: number} | null = null;
  let selectedNotes = writable<Array<{string: number, fret: number}>>([]);
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let renderer: THREE.WebGLRenderer;
  let fretboard3D: THREE.Group;
  
  // Note colors based on intervals
  const NOTE_COLORS = {
    root: '#FF6B35',      // Orange - Root note
    third: '#F39C12',     // Yellow - Major/Minor third
    fifth: '#00BCD4',     // Cyan - Perfect fifth
    seventh: '#9C27B0',   // Purple - Seventh
    scale: '#4CAF50',     // Green - Scale notes
    chord: '#2196F3',     // Blue - Chord tones
    current: '#FF5252',   // Red - Currently playing
    hover: '#FFC107'      // Amber - Hover state
  };
  
  // Fretboard dimensions
  const FRET_WIDTH = 60;
  const STRING_SPACING = 30;
  const FRET_POSITIONS = calculateFretPositions();
  
  // Musical note mapping
  const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  // Calculate fret positions (based on guitar physics)
  function calculateFretPositions(): number[] {
    const positions = [0];
    const scaleLength = 25.5; // Standard scale length in inches
    
    for (let i = 1; i <= fretCount; i++) {
      const position = scaleLength - (scaleLength / Math.pow(2, i / 12));
      positions.push(position * 40); // Scale for display
    }
    
    return positions;
  }
  
  // Get note name for a position
  function getNoteName(string: number, fret: number): string {
    const openNote = tuning[string];
    const openNoteIndex = NOTES.indexOf(openNote.replace(/\d/, ''));
    const noteIndex = (openNoteIndex + fret) % 12;
    return NOTES[noteIndex];
  }
  
  // Get note color based on musical context
  function getNoteColor(string: number, fret: number): string {
    const note = getNoteName(string, fret);
    
    // Check if note is currently playing
    if (currentNotes.some(n => n.string === string && n.fret === fret)) {
      return NOTE_COLORS.current;
    }
    
    // Check if note is in highlighted scale
    if (highlightedScale && isNoteInScale(note, highlightedScale)) {
      return NOTE_COLORS.scale;
    }
    
    // Check if note is in highlighted chord
    if (highlightedChord && isNoteInChord(note, highlightedChord)) {
      return NOTE_COLORS.chord;
    }
    
    // Default color
    return '#666666';
  }
  
  // Check if note is in scale
  function isNoteInScale(note: string, scale: string): boolean {
    // Parse scale (e.g., "C major", "A minor")
    const [root, type] = scale.split(' ');
    const scaleNotes = getScaleNotes(root, type);
    return scaleNotes.includes(note);
  }
  
  // Check if note is in chord
  function isNoteInChord(note: string, chord: string): boolean {
    // Parse chord (e.g., "C", "Am", "G7")
    const chordNotes = getChordNotes(chord);
    return chordNotes.includes(note);
  }
  
  // Get scale notes
  function getScaleNotes(root: string, type: string): string[] {
    const rootIndex = NOTES.indexOf(root);
    const intervals = type === 'major' 
      ? [0, 2, 4, 5, 7, 9, 11] // Major scale intervals
      : [0, 2, 3, 5, 7, 8, 10]; // Minor scale intervals
    
    return intervals.map(interval => 
      NOTES[(rootIndex + interval) % 12]
    );
  }
  
  // Get chord notes
  function getChordNotes(chord: string): string[] {
    // Simple chord parsing - extend for more complex chords
    const root = chord[0];
    const isMinor = chord.includes('m');
    const isSeventh = chord.includes('7');
    
    const rootIndex = NOTES.indexOf(root);
    const intervals = [0]; // Root
    
    intervals.push(isMinor ? 3 : 4); // Minor or major third
    intervals.push(7); // Perfect fifth
    
    if (isSeventh) {
      intervals.push(isMinor ? 10 : 11); // Minor or major seventh
    }
    
    return intervals.map(interval => 
      NOTES[(rootIndex + interval) % 12]
    );
  }
  
  // Draw 2D fretboard
  function draw2DFretboard() {
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw fretboard background
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, '#3E2723');
    gradient.addColorStop(0.5, '#4E342E');
    gradient.addColorStop(1, '#3E2723');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Draw frets
    ctx.strokeStyle = '#C0C0C0';
    ctx.lineWidth = 2;
    
    for (let fret = 0; fret <= fretCount; fret++) {
      const x = FRET_POSITIONS[fret];
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      
      // Thicker line for nut
      if (fret === 0) {
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#C0C0C0';
      }
    }
    
    // Draw strings
    ctx.strokeStyle = '#999999';
    for (let string = 0; string < 6; string++) {
      const y = STRING_SPACING * (string + 1);
      ctx.lineWidth = 1 + (string * 0.3); // Thicker bass strings
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Draw fret markers
    const markers = [3, 5, 7, 9, 12, 15, 17, 19, 21];
    ctx.fillStyle = '#666666';
    
    markers.forEach(fret => {
      if (fret <= fretCount) {
        const x = (FRET_POSITIONS[fret - 1] + FRET_POSITIONS[fret]) / 2;
        
        if (fret === 12) {
          // Double dot at 12th fret
          ctx.beginPath();
          ctx.arc(x, height / 3, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x, (height * 2) / 3, 5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Single dot
          ctx.beginPath();
          ctx.arc(x, height / 2, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });
    
    // Draw notes
    for (let string = 0; string < 6; string++) {
      for (let fret = 0; fret <= fretCount; fret++) {
        const note = getNoteName(string, fret);
        const color = getNoteColor(string, fret);
        
        if (color !== '#666666' || (hoveredNote && hoveredNote.string === string && hoveredNote.fret === fret)) {
          const x = fret === 0 ? 15 : (FRET_POSITIONS[fret - 1] + FRET_POSITIONS[fret]) / 2;
          const y = STRING_SPACING * (string + 1);
          
          // Draw note circle
          ctx.fillStyle = hoveredNote?.string === string && hoveredNote?.fret === fret 
            ? NOTE_COLORS.hover 
            : color;
          ctx.beginPath();
          ctx.arc(x, y, 12, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw note name
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 10px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(note, x, y);
        }
      }
    }
    
    // Draw selected notes with border
    $selectedNotes.forEach(({string, fret}) => {
      const x = fret === 0 ? 15 : (FRET_POSITIONS[fret - 1] + FRET_POSITIONS[fret]) / 2;
      const y = STRING_SPACING * (string + 1);
      
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.stroke();
    });
  }
  
  // Initialize 3D fretboard
  function init3DFretboard() {
    if (!container || !view3D) return;
    
    // Setup Three.js scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    
    // Camera
    camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 150, 300);
    camera.lookAt(0, 0, 0);
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // Create fretboard group
    fretboard3D = new THREE.Group();
    
    // Fretboard neck
    const neckGeometry = new THREE.BoxGeometry(800, 10, 120);
    const neckMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x4e342e,
      shininess: 100
    });
    const neck = new THREE.Mesh(neckGeometry, neckMaterial);
    neck.receiveShadow = true;
    fretboard3D.add(neck);
    
    // Add frets
    for (let i = 0; i <= fretCount; i++) {
      const fretGeometry = new THREE.BoxGeometry(2, 12, 120);
      const fretMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xc0c0c0,
        metalness: 0.8
      });
      const fret = new THREE.Mesh(fretGeometry, fretMaterial);
      fret.position.x = FRET_POSITIONS[i] - 400;
      fret.castShadow = true;
      fretboard3D.add(fret);
    }
    
    // Add strings
    for (let i = 0; i < 6; i++) {
      const stringGeometry = new THREE.CylinderGeometry(0.5 + i * 0.2, 0.5 + i * 0.2, 800);
      const stringMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x999999,
        metalness: 0.9
      });
      const string = new THREE.Mesh(stringGeometry, stringMaterial);
      string.rotation.z = Math.PI / 2;
      string.position.z = -50 + i * 20;
      string.position.y = 7;
      string.castShadow = true;
      fretboard3D.add(string);
    }
    
    scene.add(fretboard3D);
    
    // Animation loop
    animate3D();
  }
  
  // 3D animation loop
  function animate3D() {
    if (!view3D || !renderer) return;
    
    requestAnimationFrame(animate3D);
    
    // Rotate fretboard slightly for better view
    if (fretboard3D) {
      fretboard3D.rotation.x = -0.1;
      fretboard3D.rotation.y = Math.sin(Date.now() * 0.0005) * 0.1;
    }
    
    renderer.render(scene, camera);
  }
  
  // Handle mouse events
  function handleMouseMove(event: MouseEvent) {
    if (!interactive || !canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Find which string and fret is under cursor
    const string = Math.floor(y / STRING_SPACING) - 1;
    let fret = 0;
    
    for (let i = 0; i < fretCount; i++) {
      if (x >= FRET_POSITIONS[i] && x < FRET_POSITIONS[i + 1]) {
        fret = i + 1;
        break;
      }
    }
    
    if (string >= 0 && string < 6 && fret >= 0 && fret <= fretCount) {
      hoveredNote = { string, fret };
    } else {
      hoveredNote = null;
    }
    
    draw2DFretboard();
  }
  
  function handleClick(event: MouseEvent) {
    if (!interactive || !hoveredNote) return;
    
    selectedNotes.update(notes => {
      const index = notes.findIndex(n => 
        n.string === hoveredNote!.string && n.fret === hoveredNote!.fret
      );
      
      if (index >= 0) {
        // Remove if already selected
        return notes.filter((_, i) => i !== index);
      } else {
        // Add to selection
        return [...notes, hoveredNote!];
      }
    });
    
    draw2DFretboard();
  }
  
  // Lifecycle
  onMount(() => {
    if (view3D) {
      init3DFretboard();
    } else if (canvas) {
      // Set canvas size
      canvas.width = FRET_POSITIONS[fretCount] + 50;
      canvas.height = STRING_SPACING * 7;
      draw2DFretboard();
    }
  });
  
  onDestroy(() => {
    if (renderer) {
      renderer.dispose();
    }
  });
  
  // Reactive updates
  $: if (!view3D && canvas) {
    draw2DFretboard();
  }
  
  $: if (currentNotes && !view3D && canvas) {
    draw2DFretboard();
  }
</script>

<div class="fretboard-view bg-gray-900 rounded-lg p-4">
  <div class="header flex justify-between items-center mb-4">
    <h3 class="text-lg font-semibold">Interactive Fretboard</h3>
    
    <div class="controls flex gap-2">
      <button
        on:click={() => view3D = !view3D}
        class="px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 transition-colors text-sm"
      >
        {view3D ? '2D View' : '3D View'}
      </button>
      
      <button
        on:click={() => selectedNotes.set([])}
        class="px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 transition-colors text-sm"
      >
        Clear Selection
      </button>
    </div>
  </div>
  
  {#if view3D}
    <div bind:this={container} class="fretboard-3d-container" style="height: 400px;" />
  {:else}
    <div class="fretboard-2d-container overflow-x-auto">
      <canvas
        bind:this={canvas}
        on:mousemove={handleMouseMove}
        on:click={handleClick}
        on:mouseleave={() => { hoveredNote = null; draw2DFretboard(); }}
        class="fretboard-canvas cursor-pointer"
      />
    </div>
  {/if}
  
  <!-- Legend -->
  <div class="legend mt-4 flex flex-wrap gap-4 text-sm">
    <div class="legend-item flex items-center gap-2">
      <div class="w-4 h-4 rounded-full" style="background-color: {NOTE_COLORS.current}"></div>
      <span>Currently Playing</span>
    </div>
    <div class="legend-item flex items-center gap-2">
      <div class="w-4 h-4 rounded-full" style="background-color: {NOTE_COLORS.scale}"></div>
      <span>Scale Notes</span>
    </div>
    <div class="legend-item flex items-center gap-2">
      <div class="w-4 h-4 rounded-full" style="background-color: {NOTE_COLORS.chord}"></div>
      <span>Chord Tones</span>
    </div>
    <div class="legend-item flex items-center gap-2">
      <div class="w-4 h-4 rounded-full" style="background-color: {NOTE_COLORS.hover}"></div>
      <span>Hover</span>
    </div>
  </div>
  
  <!-- Note Display -->
  {#if $selectedNotes.length > 0}
    <div class="selected-notes mt-4 p-3 bg-gray-800 rounded">
      <h4 class="text-sm font-semibold mb-2">Selected Notes:</h4>
      <div class="flex flex-wrap gap-2">
        {#each $selectedNotes as note}
          <span class="px-2 py-1 bg-gray-700 rounded text-xs">
            {getNoteName(note.string, note.fret)} (String {6 - note.string}, Fret {note.fret})
          </span>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .fretboard-view {
    min-height: 300px;
  }
  
  .fretboard-canvas {
    image-rendering: crisp-edges;
    image-rendering: -webkit-crisp-edges;
  }
  
  .fretboard-2d-container {
    max-width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
  }
  
  .fretboard-2d-container::-webkit-scrollbar {
    height: 8px;
  }
  
  .fretboard-2d-container::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
  }
  
  .fretboard-2d-container::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 4px;
  }
  
  .fretboard-3d-container {
    width: 100%;
    position: relative;
  }
  
  @media (max-width: 640px) {
    .controls {
      flex-direction: column;
      width: 100%;
    }
    
    .controls button {
      width: 100%;
    }
  }
</style>