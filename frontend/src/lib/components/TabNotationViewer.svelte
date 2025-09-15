<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Flow } from 'vexflow';
  import type { TabData, MidiData } from '../../app';

  export let tabData: TabData;
  export let midiData: MidiData | null = null;
  export let showNotation: boolean = true;
  export let showTab: boolean = true;
  export let currentBeat: number = 0;
  export let zoom: number = 1;

  let container: HTMLDivElement;
  let renderer: any;
  let context: any;
  let measures: any[] = [];
  
  const VF = Flow;
  
  // 기타 튜닝 MIDI 번호
  const STANDARD_TUNING_MIDI = [40, 45, 50, 55, 59, 64]; // E2, A2, D3, G3, B3, E4
  
  class TabNotationRenderer {
    private renderer: any;
    private context: any;
    private width: number;
    private height: number;
    
    constructor(container: HTMLElement, width: number, height: number) {
      this.width = width;
      this.height = height;
      
      // SVG 렌더러 생성
      this.renderer = new VF.Renderer(container, VF.Renderer.Backends.SVG);
      this.renderer.resize(width, height);
      this.context = this.renderer.getContext();
      this.context.setFont('Arial', 10);
    }
    
    clear() {
      // SVG 내용 초기화
      const svg = this.context.svg;
      while (svg.firstChild) {
        svg.removeChild(svg.firstChild);
      }
    }
    
    renderMeasure(measureData: any, x: number, y: number, width: number) {
      const staveHeight = 100;
      
      // 오선보 스태브
      let notationStave = null;
      if (showNotation) {
        notationStave = new VF.Stave(x, y, width);
        notationStave.addClef('treble');
        if (measureData.timeSignature) {
          notationStave.addTimeSignature(measureData.timeSignature);
        }
        notationStave.setContext(this.context).draw();
      }
      
      // Tab 스태브
      let tabStave = null;
      if (showTab) {
        const tabY = showNotation ? y + staveHeight : y;
        tabStave = new VF.TabStave(x, tabY, width);
        tabStave.addClef('tab');
        tabStave.setNumLines(6);
        tabStave.setContext(this.context).draw();
      }
      
      // 노트 생성 및 렌더링
      if (measureData.notes && measureData.notes.length > 0) {
        const notes = this.createNotes(measureData.notes);
        
        if (notes.length > 0) {
          const voice = new VF.Voice({
            num_beats: 4,
            beat_value: 4
          });
          
          voice.addTickables(notes);
          
          const formatter = new VF.Formatter();
          formatter.joinVoices([voice]).format([voice], width - 100);
          
          if (showNotation && notationStave) {
            voice.draw(this.context, notationStave);
          }
          
          // Tab 노트는 별도로 그려야 함
          if (showTab && tabStave) {
            const tabNotes = this.createTabNotes(measureData.notes);
            const tabVoice = new VF.Voice({
              num_beats: 4,
              beat_value: 4
            });
            tabVoice.addTickables(tabNotes);
            formatter.joinVoices([tabVoice]).format([tabVoice], width - 100);
            tabVoice.draw(this.context, tabStave);
          }
        }
      }
      
      // 코드 심볼 표시
      if (measureData.chordSymbol && notationStave) {
        this.context.fillText(
          measureData.chordSymbol,
          x + 10,
          y - 10
        );
      }
      
      // 현재 재생 위치 하이라이트
      if (measureData.isCurrentMeasure) {
        this.highlightMeasure(x, y, width, staveHeight * (showNotation && showTab ? 2 : 1));
      }
    }
    
    createNotes(noteData: any[]): any[] {
      const notes: any[] = [];
      
      noteData.forEach(note => {
        if (note.pitch) {
          // MIDI 번호를 음표로 변환
          const noteName = this.midiToNoteName(note.pitch);
          const duration = note.duration || 'q';
          
          const staveNote = new VF.StaveNote({
            keys: [noteName],
            duration: duration
          });
          
          // 테크닉 추가
          if (note.techniques) {
            note.techniques.forEach((tech: string) => {
              switch(tech) {
                case 'bend':
                  staveNote.addModifier(new VF.Bend('1/2'));
                  break;
                case 'vibrato':
                  staveNote.addModifier(new VF.Vibrato());
                  break;
                case 'hammer-on':
                  staveNote.addArticulation(new VF.Articulation('a>'));
                  break;
                case 'pull-off':
                  staveNote.addArticulation(new VF.Articulation('a-'));
                  break;
              }
            });
          }
          
          notes.push(staveNote);
        }
      });
      
      return notes;
    }
    
    createTabNotes(noteData: any[]): any[] {
      const tabNotes: any[] = [];
      
      noteData.forEach(note => {
        if (note.string !== undefined && note.fret !== undefined) {
          const positions = [{
            str: note.string + 1, // VexFlow는 1부터 시작
            fret: note.fret
          }];
          
          const tabNote = new VF.TabNote({
            positions: positions,
            duration: note.duration || 'q'
          });
          
          // Tab 전용 테크닉
          if (note.techniques) {
            note.techniques.forEach((tech: string) => {
              switch(tech) {
                case 'bend':
                  tabNote.addModifier(new VF.Bend('1/2', false), 0);
                  break;
                case 'slide':
                  tabNote.addModifier(new VF.Annotation('sl'));
                  break;
                case 'palm-mute':
                  tabNote.addModifier(new VF.Annotation('P.M.'));
                  break;
              }
            });
          }
          
          tabNotes.push(tabNote);
        }
      });
      
      return tabNotes;
    }
    
    midiToNoteName(midi: number): string {
      const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const octave = Math.floor(midi / 12) - 1;
      const noteName = noteNames[midi % 12];
      return `${noteName}/${octave}`;
    }
    
    highlightMeasure(x: number, y: number, width: number, height: number) {
      this.context.save();
      this.context.setFillStyle('rgba(59, 130, 246, 0.2)');
      this.context.fillRect(x, y - 10, width, height + 20);
      this.context.restore();
    }
    
    renderAll(tabData: TabData, currentMeasure: number = 0) {
      this.clear();
      
      let x = 10;
      let y = 40;
      const measureWidth = 300 * zoom;
      const systemHeight = 250; // 한 시스템의 높이
      const measuresPerSystem = Math.floor((this.width - 20) / measureWidth);
      
      tabData.measures.forEach((measure, index) => {
        // 새로운 시스템으로 이동
        if (index > 0 && index % measuresPerSystem === 0) {
          x = 10;
          y += systemHeight;
        }
        
        // 현재 재생 중인 마디인지 확인
        const measureWithStatus = {
          ...measure,
          isCurrentMeasure: index === currentMeasure
        };
        
        this.renderMeasure(measureWithStatus, x, y, measureWidth);
        x += measureWidth;
      });
    }
  }
  
  let renderer: TabNotationRenderer;
  let resizeObserver: ResizeObserver;
  
  onMount(() => {
    if (container) {
      const rect = container.getBoundingClientRect();
      renderer = new TabNotationRenderer(container, rect.width, rect.height);
      
      if (tabData && tabData.measures) {
        renderer.renderAll(tabData, Math.floor(currentBeat / 4));
      }
      
      // 컨테이너 크기 변경 감지
      resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          const { width, height } = entry.contentRect;
          if (renderer) {
            renderer = new TabNotationRenderer(container, width, height);
            renderer.renderAll(tabData, Math.floor(currentBeat / 4));
          }
        }
      });
      
      resizeObserver.observe(container);
    }
  });
  
  onDestroy(() => {
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
  });
  
  // 반응형 업데이트
  $: if (renderer && tabData) {
    renderer.renderAll(tabData, Math.floor(currentBeat / 4));
  }
  
  // 줌 레벨 변경
  function handleZoom(delta: number) {
    zoom = Math.max(0.5, Math.min(2, zoom + delta));
  }
  
  // 내보내기 기능
  function exportAsSVG() {
    if (container) {
      const svg = container.querySelector('svg');
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tab-score.svg';
        a.click();
        URL.revokeObjectURL(url);
      }
    }
  }
  
  function exportAsPDF() {
    // TODO: PDF 내보내기 구현
    console.log('PDF export not implemented yet');
  }
</script>

<div class="tab-notation-viewer">
  <div class="viewer-controls">
    <div class="view-toggles">
      <label>
        <input type="checkbox" bind:checked={showNotation} />
        오선보
      </label>
      <label>
        <input type="checkbox" bind:checked={showTab} />
        Tab
      </label>
    </div>
    
    <div class="zoom-controls">
      <button on:click={() => handleZoom(-0.1)} title="축소">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
        </svg>
      </button>
      <span class="zoom-level">{Math.round(zoom * 100)}%</span>
      <button on:click={() => handleZoom(0.1)} title="확대">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
    
    <div class="export-controls">
      <button on:click={exportAsSVG} class="export-btn">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        SVG
      </button>
      <button on:click={exportAsPDF} class="export-btn">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        PDF
      </button>
    </div>
  </div>
  
  <div class="notation-container" bind:this={container}></div>
  
  {#if !tabData || !tabData.measures || tabData.measures.length === 0}
    <div class="empty-state">
      <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
      <p class="text-gray-400">Tab 데이터를 기다리는 중...</p>
      <p class="text-sm text-gray-500 mt-2">음악을 업로드하면 여기에 악보가 표시됩니다</p>
    </div>
  {/if}
</div>

<style>
  .tab-notation-viewer {
    background-color: #1f2937;
    border-radius: 0.5rem;
    overflow: hidden;
  }
  
  .viewer-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background-color: #111827;
    border-bottom: 1px solid #374151;
  }
  
  .view-toggles {
    display: flex;
    gap: 1rem;
  }
  
  .view-toggles label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }
  
  .zoom-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .zoom-controls button {
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #374151;
    border-radius: 0.25rem;
    transition: all 0.2s;
  }
  
  .zoom-controls button:hover {
    background-color: #4b5563;
  }
  
  .zoom-level {
    min-width: 3rem;
    text-align: center;
    font-family: monospace;
  }
  
  .export-controls {
    display: flex;
    gap: 0.5rem;
  }
  
  .export-btn {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem 1rem;
    background-color: #374151;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    transition: all 0.2s;
  }
  
  .export-btn:hover {
    background-color: #4b5563;
  }
  
  .notation-container {
    min-height: 400px;
    background-color: white;
    overflow: auto;
  }
  
  .empty-state {
    padding: 3rem;
    text-align: center;
    background-color: #1f2937;
  }
  
  /* VexFlow SVG 스타일 */
  :global(.notation-container svg) {
    display: block;
    margin: 0 auto;
  }
  
  :global(.notation-container text) {
    fill: #000;
  }
  
  :global(.notation-container path) {
    fill: #000;
    stroke: #000;
  }
</style>
