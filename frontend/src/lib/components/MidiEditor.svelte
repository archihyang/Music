<script>
  import { onMount, onDestroy } from 'svelte';
  import { midiStore, playbackState, midiService } from '$lib/services/midiService';
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  
  export let editable = true;
  export let showTransport = true;
  export let showMixer = true;
  export let height = 400;
  
  let container;
  let canvas;
  let ctx;
  let pianoRoll = null;
  
  // Grid settings
  let gridSize = 16; // 16th notes
  let noteHeight = 20;
  let noteWidth = 40;
  let pianoKeyWidth = 80;
  
  // View settings
  let scrollX = 0;
  let scrollY = 0;
  let zoom = 1.0;
  
  // Selection
  let selectedNotes = new Set();
  let isSelecting = false;
  let selectionStart = null;
  let selectionEnd = null;
  
  // Editing
  let isDrawing = false;
  let isDragging = false;
  let draggedNote = null;
  let dragOffset = { x: 0, y: 0 };
  
  // Playhead
  let playheadPosition = 0;
  let animationFrame = null;
  
  // Piano keys
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octaves = 8;
  const totalNotes = octaves * 12;
  
  // Colors
  const colors = {
    background: '#1a1a1a',
    grid: '#333333',
    gridStrong: '#555555',
    note: '#FF6B35',
    noteSelected: '#F39C12',
    notePlaying: '#4CAF50',
    pianoWhite: '#FFFFFF',
    pianoBlack: '#000000',
    pianoPressed: '#F39C12',
    playhead: '#FF0000',
    selection: 'rgba(243, 156, 18, 0.3)'
  };
  
  class PianoRoll {
    constructor(canvas, ctx) {
      this.canvas = canvas;
      this.ctx = ctx;
      this.notes = [];
      this.currentTrack = 0;
    }
    
    setMidiData(midiData) {
      if (!midiData || !midiData.tracks[this.currentTrack]) return;
      
      this.notes = midiData.tracks[this.currentTrack].notes.map(note => ({
        ...note,
        x: note.time * noteWidth * zoom,
        y: (127 - note.pitch) * noteHeight,
        width: note.duration * noteWidth * zoom,
        height: noteHeight
      }));
    }
    
    draw() {
      const { width, height } = this.canvas;
      
      // Clear canvas
      this.ctx.fillStyle = colors.background;
      this.ctx.fillRect(0, 0, width, height);
      
      // Draw grid
      this.drawGrid();
      
      // Draw piano keys
      this.drawPianoKeys();
      
      // Draw notes
      this.drawNotes();
      
      // Draw selection
      if (isSelecting && selectionStart && selectionEnd) {
        this.drawSelection();
      }
      
      // Draw playhead
      this.drawPlayhead();
    }
    
    drawGrid() {
      const { width, height } = this.canvas;
      
      // Vertical lines (time grid)
      for (let x = pianoKeyWidth; x < width; x += noteWidth / gridSize) {
        const isBar = x % (noteWidth * 4) === pianoKeyWidth;
        this.ctx.strokeStyle = isBar ? colors.gridStrong : colors.grid;
        this.ctx.lineWidth = isBar ? 2 : 1;
        this.ctx.beginPath();
        this.ctx.moveTo(x - scrollX, 0);
        this.ctx.lineTo(x - scrollX, height);
        this.ctx.stroke();
      }
      
      // Horizontal lines (note grid)
      for (let y = 0; y < totalNotes; y++) {
        const noteIndex = y % 12;
        const isBlackKey = [1, 3, 6, 8, 10].includes(noteIndex);
        
        this.ctx.fillStyle = isBlackKey ? '#252525' : colors.background;
        this.ctx.fillRect(pianoKeyWidth, y * noteHeight - scrollY, width - pianoKeyWidth, noteHeight);
        
        this.ctx.strokeStyle = colors.grid;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(pianoKeyWidth, y * noteHeight - scrollY);
        this.ctx.lineTo(width, y * noteHeight - scrollY);
        this.ctx.stroke();
      }
    }
    
    drawPianoKeys() {
      const { height } = this.canvas;
      
      // Draw white background
      this.ctx.fillStyle = '#2a2a2a';
      this.ctx.fillRect(0, 0, pianoKeyWidth, height);
      
      // Draw keys
      for (let i = 0; i < totalNotes; i++) {
        const noteIndex = i % 12;
        const isBlackKey = [1, 3, 6, 8, 10].includes(noteIndex);
        const y = (totalNotes - i - 1) * noteHeight - scrollY;
        
        if (y + noteHeight < 0 || y > height) continue;
        
        // Draw key
        this.ctx.fillStyle = isBlackKey ? colors.pianoBlack : colors.pianoWhite;
        const keyWidth = isBlackKey ? pianoKeyWidth * 0.6 : pianoKeyWidth;
        this.ctx.fillRect(0, y, keyWidth, noteHeight - 1);
        
        // Draw note name for C notes
        if (noteIndex === 0) {
          this.ctx.fillStyle = isBlackKey ? colors.pianoWhite : colors.pianoBlack;
          this.ctx.font = '10px Arial';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          const octave = Math.floor(i / 12);
          this.ctx.fillText(`C${octave}`, pianoKeyWidth - 20, y + noteHeight / 2);
        }
      }
      
      // Draw border
      this.ctx.strokeStyle = colors.gridStrong;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(pianoKeyWidth, 0);
      this.ctx.lineTo(pianoKeyWidth, height);
      this.ctx.stroke();
    }
    
    drawNotes() {
      this.notes.forEach(note => {
        const x = pianoKeyWidth + note.x - scrollX;
        const y = note.y - scrollY;
        
        // Skip if outside viewport
        if (x + note.width < pianoKeyWidth || x > this.canvas.width) return;
        if (y + note.height < 0 || y > this.canvas.height) return;
        
        // Determine color
        let color = colors.note;
        if (selectedNotes.has(note)) {
          color = colors.noteSelected;
        }
        if ($playbackState.isPlaying && Math.abs(playheadPosition - note.time) < 0.1) {
          color = colors.notePlaying;
        }
        
        // Draw note
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, note.width, note.height - 2);
        
        // Draw note border
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, note.width, note.height - 2);
        
        // Draw velocity
        const velocityAlpha = note.velocity / 127;
        this.ctx.fillStyle = `rgba(255, 255, 255, ${velocityAlpha * 0.3})`;
        this.ctx.fillRect(x, y, note.width, 4);
      });
    }
    
    drawSelection() {
      const x1 = Math.min(selectionStart.x, selectionEnd.x);
      const y1 = Math.min(selectionStart.y, selectionEnd.y);
      const x2 = Math.max(selectionStart.x, selectionEnd.x);
      const y2 = Math.max(selectionStart.y, selectionEnd.y);
      
      this.ctx.fillStyle = colors.selection;
      this.ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
      
      this.ctx.strokeStyle = colors.noteSelected;
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    }
    
    drawPlayhead() {
      if (!$playbackState.isPlaying) return;
      
      const x = pianoKeyWidth + playheadPosition * noteWidth * zoom - scrollX;
      
      this.ctx.strokeStyle = colors.playhead;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    
    getNoteAtPosition(x, y) {
      const adjustedX = x - pianoKeyWidth + scrollX;
      const adjustedY = y + scrollY;
      
      return this.notes.find(note => 
        adjustedX >= note.x &&
        adjustedX <= note.x + note.width &&
        adjustedY >= note.y &&
        adjustedY <= note.y + note.height
      );
    }
    
    getPitchAtY(y) {
      const adjustedY = y + scrollY;
      return 127 - Math.floor(adjustedY / noteHeight);
    }
    
    getTimeAtX(x) {
      const adjustedX = x - pianoKeyWidth + scrollX;
      return adjustedX / (noteWidth * zoom);
    }
    
    addNote(x, y) {
      const pitch = this.getPitchAtY(y);
      const time = this.getTimeAtX(x);
      const duration = 1 / gridSize; // Default to grid size
      
      const newNote = {
        pitch,
        time,
        duration,
        velocity: 80,
        x: time * noteWidth * zoom,
        y: (127 - pitch) * noteHeight,
        width: duration * noteWidth * zoom,
        height: noteHeight
      };
      
      this.notes.push(newNote);
      this.updateMidiStore();
      
      return newNote;
    }
    
    deleteSelectedNotes() {
      this.notes = this.notes.filter(note => !selectedNotes.has(note));
      selectedNotes.clear();
      this.updateMidiStore();
    }
    
    updateMidiStore() {
      midiStore.update(data => {
        if (!data) return data;
        
        const tracks = [...data.tracks];
        tracks[this.currentTrack] = {
          ...tracks[this.currentTrack],
          notes: this.notes.map(note => ({
            pitch: note.pitch,
            time: note.time,
            duration: note.duration,
            velocity: note.velocity,
            name: this.getPitchName(note.pitch)
          }))
        };
        
        return { ...data, tracks };
      });
    }
    
    getPitchName(pitch) {
      const octave = Math.floor(pitch / 12) - 1;
      const noteIndex = pitch % 12;
      return `${noteNames[noteIndex]}${octave}`;
    }
  }
  
  // Mouse event handlers
  function handleMouseDown(e) {
    if (!editable) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (x < pianoKeyWidth) {
      // Clicked on piano - play note
      const pitch = pianoRoll.getPitchAtY(y);
      playNote(pitch);
    } else {
      // Check if clicking on a note
      const note = pianoRoll.getNoteAtPosition(x, y);
      
      if (note) {
        if (e.shiftKey) {
          // Add to selection
          if (selectedNotes.has(note)) {
            selectedNotes.delete(note);
          } else {
            selectedNotes.add(note);
          }
        } else if (!selectedNotes.has(note)) {
          // Start dragging
          selectedNotes.clear();
          selectedNotes.add(note);
          isDragging = true;
          draggedNote = note;
          dragOffset = {
            x: x - (note.x - scrollX + pianoKeyWidth),
            y: y - (note.y - scrollY)
          };
        }
      } else if (e.altKey) {
        // Add new note
        const newNote = pianoRoll.addNote(x, y);
        selectedNotes.clear();
        selectedNotes.add(newNote);
      } else {
        // Start selection
        selectedNotes.clear();
        isSelecting = true;
        selectionStart = { x, y };
        selectionEnd = { x, y };
      }
    }
    
    pianoRoll.draw();
  }
  
  function handleMouseMove(e) {
    if (!editable) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (isDragging && draggedNote) {
      // Update note position
      const newTime = pianoRoll.getTimeAtX(x - dragOffset.x);
      const newPitch = pianoRoll.getPitchAtY(y - dragOffset.y);
      
      // Snap to grid
      const snappedTime = Math.round(newTime * gridSize) / gridSize;
      
      draggedNote.time = snappedTime;
      draggedNote.pitch = newPitch;
      draggedNote.x = snappedTime * noteWidth * zoom;
      draggedNote.y = (127 - newPitch) * noteHeight;
      
      pianoRoll.draw();
    } else if (isSelecting) {
      selectionEnd = { x, y };
      
      // Select notes in rectangle
      const x1 = Math.min(selectionStart.x, selectionEnd.x);
      const y1 = Math.min(selectionStart.y, selectionEnd.y);
      const x2 = Math.max(selectionStart.x, selectionEnd.x);
      const y2 = Math.max(selectionStart.y, selectionEnd.y);
      
      selectedNotes.clear();
      pianoRoll.notes.forEach(note => {
        const noteX = note.x - scrollX + pianoKeyWidth;
        const noteY = note.y - scrollY;
        
        if (noteX >= x1 && noteX <= x2 && noteY >= y1 && noteY <= y2) {
          selectedNotes.add(note);
        }
      });
      
      pianoRoll.draw();
    }
  }
  
  function handleMouseUp(e) {
    if (isDragging) {
      pianoRoll.updateMidiStore();
    }
    
    isDragging = false;
    draggedNote = null;
    isSelecting = false;
    selectionStart = null;
    selectionEnd = null;
    
    pianoRoll.draw();
  }
  
  function handleKeyDown(e) {
    if (!editable) return;
    
    if (e.key === 'Delete' || e.key === 'Backspace') {
      pianoRoll.deleteSelectedNotes();
      pianoRoll.draw();
    } else if (e.key === 'a' && e.ctrlKey) {
      e.preventDefault();
      selectedNotes.clear();
      pianoRoll.notes.forEach(note => selectedNotes.add(note));
      pianoRoll.draw();
    }
  }
  
  function handleWheel(e) {
    e.preventDefault();
    
    if (e.ctrlKey) {
      // Zoom
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      zoom = Math.max(0.1, Math.min(5, zoom * delta));
      
      // Recalculate note positions
      pianoRoll.notes.forEach(note => {
        note.x = note.time * noteWidth * zoom;
        note.width = note.duration * noteWidth * zoom;
      });
    } else {
      // Scroll
      scrollX += e.deltaX;
      scrollY += e.deltaY;
      
      // Clamp scroll
      scrollX = Math.max(0, scrollX);
      scrollY = Math.max(0, Math.min(totalNotes * noteHeight - canvas.height, scrollY));
    }
    
    pianoRoll.draw();
  }
  
  function playNote(pitch) {
    // Play note preview
    const frequency = 440 * Math.pow(2, (pitch - 69) / 12);
    const oscillator = new (window.AudioContext || window.webkitAudioContext)().createOscillator();
    const gainNode = new (window.AudioContext || window.webkitAudioContext)().createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(oscillator.context.destination);
    
    oscillator.frequency.value = frequency;
    gainNode.gain.setValueAtTime(0.3, oscillator.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, oscillator.context.currentTime + 0.5);
    
    oscillator.start();
    oscillator.stop(oscillator.context.currentTime + 0.5);
  }
  
  function updatePlayhead() {
    if ($playbackState.isPlaying) {
      playheadPosition = $playbackState.currentTime;
      pianoRoll?.draw();
      animationFrame = requestAnimationFrame(updatePlayhead);
    }
  }
  
  onMount(() => {
    ctx = canvas.getContext('2d');
    pianoRoll = new PianoRoll(canvas, ctx);
    
    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = container.clientWidth;
      canvas.height = height;
      pianoRoll.draw();
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Add event listeners
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
      document.removeEventListener('keydown', handleKeyDown);
    };
  });
  
  onDestroy(() => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
  });
  
  // React to MIDI data changes
  $: if (pianoRoll && $midiStore) {
    pianoRoll.setMidiData($midiStore);
    pianoRoll.draw();
  }
  
  // React to playback state
  $: if ($playbackState.isPlaying && !animationFrame) {
    updatePlayhead();
  } else if (!$playbackState.isPlaying && animationFrame) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }
</script>

<div class="midi-editor" bind:this={container}>
  {#if showTransport}
    <div class="transport-bar">
      <Button
        size="sm"
        variant={$playbackState.isPlaying ? 'secondary' : 'primary'}
        on:click={() => $playbackState.isPlaying ? midiService.pause() : midiService.play()}
      >
        {$playbackState.isPlaying ? 'Pause' : 'Play'}
      </Button>
      
      <Button size="sm" variant="ghost" on:click={() => midiService.stop()}>
        Stop
      </Button>
      
      <div class="tempo-display">
        <span>Tempo: {$playbackState.tempo} BPM</span>
      </div>
      
      <div class="time-display">
        <span>Bar {$playbackState.currentMeasure}.{$playbackState.currentBeat}</span>
      </div>
      
      <div class="zoom-controls">
        <Button size="sm" variant="ghost" on:click={() => zoom = Math.min(5, zoom * 1.2)}>
          Zoom In
        </Button>
        <span>{Math.round(zoom * 100)}%</span>
        <Button size="sm" variant="ghost" on:click={() => zoom = Math.max(0.1, zoom / 1.2)}>
          Zoom Out
        </Button>
      </div>
    </div>
  {/if}
  
  <div class="editor-container">
    <canvas bind:this={canvas} class="piano-roll-canvas"></canvas>
  </div>
  
  {#if showMixer && $midiStore}
    <div class="mixer-panel">
      {#each $midiStore.tracks as track, i}
        <Card variant="bordered" class="track-mixer">
          <h4>{track.name}</h4>
          <div class="track-controls">
            <Button
              size="sm"
              variant={track.muted ? 'danger' : 'ghost'}
              on:click={() => midiService.toggleTrackMute(i)}
            >
              {track.muted ? 'Unmute' : 'Mute'}
            </Button>
            
            <Button
              size="sm"
              variant={track.solo ? 'warning' : 'ghost'}
              on:click={() => midiService.toggleTrackSolo(i)}
            >
              Solo
            </Button>
            
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={track.volume}
              on:input={(e) => midiService.setTrackVolume(i, parseFloat(e.target.value))}
            />
          </div>
        </Card>
      {/each}
    </div>
  {/if}
  
  <div class="editor-info">
    <span>Click: Select | Alt+Click: Add Note | Shift+Click: Multi-select | Delete: Remove | Ctrl+Wheel: Zoom</span>
  </div>
</div>

<style>
  .midi-editor {
    display: flex;
    flex-direction: column;
    background: #1a1a1a;
    border-radius: 0.5rem;
    overflow: hidden;
  }
  
  .transport-bar {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem 1rem;
    background: #2a2a2a;
    border-bottom: 1px solid #444;
  }
  
  .tempo-display,
  .time-display {
    color: #fff;
    font-family: monospace;
    font-size: 0.875rem;
  }
  
  .zoom-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-left: auto;
    color: #fff;
    font-size: 0.875rem;
  }
  
  .editor-container {
    flex: 1;
    position: relative;
    overflow: hidden;
  }
  
  .piano-roll-canvas {
    cursor: crosshair;
  }
  
  .mixer-panel {
    display: flex;
    gap: 0.5rem;
    padding: 0.5rem;
    background: #2a2a2a;
    border-top: 1px solid #444;
    overflow-x: auto;
  }
  
  :global(.track-mixer) {
    min-width: 150px;
    padding: 0.5rem;
  }
  
  .track-mixer h4 {
    color: #fff;
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
  }
  
  .track-controls {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .track-controls input[type="range"] {
    width: 100%;
  }
  
  .editor-info {
    padding: 0.5rem 1rem;
    background: #2a2a2a;
    border-top: 1px solid #444;
    color: #888;
    font-size: 0.75rem;
    text-align: center;
  }
</style>