<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Renderer, Stave, StaveNote, Voice, Formatter, TabStave, TabNote, Beam, Accidental } from 'vexflow';
  import * as Tone from 'tone';
  import { Midi } from '@tonejs/midi';
  import { 
    Play, 
    Pause, 
    RotateCcw, 
    SkipBack, 
    SkipForward, 
    Volume2,
    Download,
    ZoomIn,
    ZoomOut,
    Layers,
    Music
  } from 'lucide-svelte';
  
  export let midiData: ArrayBuffer | null = null;
  export let musicData: any = null;
  export let showNotation = true;
  export let showTabs = true;
  export let showLyrics = false;
  
  let container: HTMLDivElement;
  let renderer: any = null;
  let context: any = null;
  let synth: Tone.PolySynth | null = null;
  let part: Tone.Part | null = null;
  
  // Playback state
  let isPlaying = false;
  let currentTime = 0;
  let duration = 0;
  let tempo = 120;
  let volume = 75;
  let zoom = 100;
  
  // Display options
  let currentMeasure = 0;
  let totalMeasures = 0;
  let measuresPerLine = 4;
  let staveWidth = 250;
  
  // MIDI 파싱 및 렌더링
  async function loadMidiData() {
    if (!midiData || !container) return;
    
    try {
      // MIDI 파일 파싱
      const midi = new Midi(midiData);
      duration = midi.duration;
      
      // 첫 번째 트랙 가져오기 (기타 트랙 가정)
      const track = midi.tracks[0];
      if (!track) return;
      
      // 템포 설정
      if (midi.header.tempos.length > 0) {
        tempo = midi.header.tempos[0].bpm;
        Tone.Transport.bpm.value = tempo;
      }
      
      // VexFlow 렌더러 초기화
      initializeRenderer();
      
      // 악보 렌더링
      renderNotation(track);
      
      // Tone.js 시퀀스 생성
      createPlaybackSequence(track);
      
    } catch (error) {
      console.error('Failed to load MIDI data:', error);
    }
  }
  
  // VexFlow 렌더러 초기화
  function initializeRenderer() {
    if (!container) return;
    
    // 기존 렌더러 정리
    if (renderer) {
      container.innerHTML = '';
    }
    
    // 새 렌더러 생성
    renderer = new Renderer(container, Renderer.Backends.SVG);
    
    // 크기 설정
    const containerWidth = container.clientWidth;
    const containerHeight = 2000; // 충분한 높이 설정
    renderer.resize(containerWidth, containerHeight);
    
    context = renderer.getContext();
    context.setFont('Arial', 10);
    
    // 줌 적용
    context.scale(zoom / 100, zoom / 100);
  }
  
  // 악보 렌더링
  function renderNotation(track: any) {
    if (!context) return;
    
    let y = 50;
    let x = 10;
    let measureCount = 0;
    
    // 트랙의 노트를 마디별로 그룹화
    const measures = groupNotesIntoMeasures(track.notes);
    totalMeasures = measures.length;
    
    measures.forEach((measure, idx) => {
      // 새 줄 시작
      if (measureCount % measuresPerLine === 0 && measureCount > 0) {
        x = 10;
        y += 250; // 오선보 + 탭 높이
      }
      
      // 표준 악보 렌더링
      if (showNotation) {
        const stave = new Stave(x, y, staveWidth);
        
        // 첫 마디에 음자리표, 조표, 박자표 추가
        if (idx === 0) {
          stave.addClef('treble');
          stave.addTimeSignature('4/4');
          stave.addKeySignature('C');
        }
        
        stave.setContext(context).draw();
        
        // 노트 렌더링
        if (measure.length > 0) {
          const voice = createVoice(measure);
          new Formatter().joinVoices([voice]).format([voice], staveWidth - 50);
          voice.draw(context, stave);
        }
      }
      
      // 탭 악보 렌더링
      if (showTabs) {
        const tabY = showNotation ? y + 100 : y;
        const tabStave = new TabStave(x, tabY, staveWidth);
        
        // 첫 마디에 TAB 표시
        if (idx === 0) {
          tabStave.addClef('tab');
        }
        
        tabStave.setContext(context).draw();
        
        // 탭 노트 렌더링
        if (measure.length > 0) {
          const tabVoice = createTabVoice(measure);
          new Formatter().joinVoices([tabVoice]).format([tabVoice], staveWidth - 50);
          tabVoice.draw(context, tabStave);
        }
      }
      
      x += staveWidth;
      measureCount++;
    });
  }
  
  // 노트를 마디별로 그룹화
  function groupNotesIntoMeasures(notes: any[]): any[][] {
    const measures = [];
    let currentMeasure = [];
    let currentBeat = 0;
    const beatsPerMeasure = 4; // 4/4 박자 가정
    
    notes.forEach(note => {
      currentMeasure.push(note);
      currentBeat += note.duration;
      
      if (currentBeat >= beatsPerMeasure) {
        measures.push(currentMeasure);
        currentMeasure = [];
        currentBeat = 0;
      }
    });
    
    if (currentMeasure.length > 0) {
      measures.push(currentMeasure);
    }
    
    return measures;
  }
  
  // VexFlow Voice 생성
  function createVoice(notes: any[]): any {
    const staveNotes = notes.map(note => {
      const pitch = midiToPitch(note.midi);
      const duration = noteDurationToVexFlow(note.duration);
      
      const staveNote = new StaveNote({
        keys: [pitch],
        duration: duration
      });
      
      // 임시표 처리
      if (pitch.includes('#')) {
        staveNote.addModifier(new Accidental('#'), 0);
      } else if (pitch.includes('b')) {
        staveNote.addModifier(new Accidental('b'), 0);
      }
      
      return staveNote;
    });
    
    const voice = new Voice({ num_beats: 4, beat_value: 4 });
    voice.addTickables(staveNotes);
    
    return voice;
  }
  
  // VexFlow Tab Voice 생성
  function createTabVoice(notes: any[]): any {
    const tabNotes = notes.map(note => {
      const { string, fret } = midiToTab(note.midi);
      const duration = noteDurationToVexFlow(note.duration);
      
      return new TabNote({
        positions: [{ str: string, fret: fret }],
        duration: duration
      });
    });
    
    const voice = new Voice({ num_beats: 4, beat_value: 4 });
    voice.addTickables(tabNotes);
    
    return voice;
  }
  
  // MIDI 노트를 음높이로 변환
  function midiToPitch(midi: number): string {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midi / 12) - 1;
    const noteIndex = midi % 12;
    return `${noteNames[noteIndex]}/${octave}`;
  }
  
  // MIDI 노트를 탭 포지션으로 변환
  function midiToTab(midi: number): { string: number, fret: number } {
    // 표준 기타 튜닝 (E A D G B E)
    const openStrings = [40, 45, 50, 55, 59, 64]; // MIDI numbers
    
    // 각 줄에서 가능한 프렛 찾기
    for (let string = 6; string >= 1; string--) {
      const openNote = openStrings[6 - string];
      const fret = midi - openNote;
      
      if (fret >= 0 && fret <= 24) { // 24프렛까지
        return { string, fret };
      }
    }
    
    // 기본값: 1번 줄 0프렛
    return { string: 1, fret: 0 };
  }
  
  // 노트 길이를 VexFlow 형식으로 변환
  function noteDurationToVexFlow(duration: number): string {
    if (duration >= 3.5) return 'w'; // whole note
    if (duration >= 1.5) return 'h'; // half note
    if (duration >= 0.75) return 'q'; // quarter note
    if (duration >= 0.375) return '8'; // eighth note
    if (duration >= 0.1875) return '16'; // sixteenth note
    return '32'; // thirty-second note
  }
  
  // Tone.js 재생 시퀀스 생성
  function createPlaybackSequence(track: any) {
    if (!track.notes || track.notes.length === 0) return;
    
    // 신스 초기화
    synth = new Tone.PolySynth(Tone.Synth, {
      envelope: {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.3,
        release: 0.8
      }
    }).toDestination();
    
    // 볼륨 설정
    synth.volume.value = volumeToDb(volume);
    
    // Part 생성 (시퀀서)
    const events = track.notes.map((note: any) => ({
      time: note.time,
      note: Tone.Frequency(note.midi, 'midi').toNote(),
      duration: note.duration,
      velocity: note.velocity || 0.8
    }));
    
    part = new Tone.Part((time, event) => {
      synth?.triggerAttackRelease(event.note, event.duration, time, event.velocity);
      
      // 현재 재생 위치 업데이트
      Tone.Draw.schedule(() => {
        currentTime = Tone.Transport.seconds;
        updatePlaybackPosition();
      }, time);
    }, events);
    
    part.loop = false;
    part.start(0);
  }
  
  // 볼륨을 데시벨로 변환
  function volumeToDb(vol: number): number {
    return 20 * Math.log10(vol / 100);
  }
  
  // 재생 위치 업데이트
  function updatePlaybackPosition() {
    if (duration > 0) {
      const progress = (currentTime / duration) * 100;
      // 프로그레스 바 업데이트 로직
      const measureIndex = Math.floor((currentTime / duration) * totalMeasures);
      if (measureIndex !== currentMeasure) {
        currentMeasure = measureIndex;
        highlightCurrentMeasure();
      }
    }
  }
  
  // 현재 마디 강조
  function highlightCurrentMeasure() {
    // SVG 요소에서 현재 마디 찾아서 강조
    // 구현 예정
  }
  
  // 재생/일시정지
  async function togglePlayback() {
    if (!part || !synth) return;
    
    if (isPlaying) {
      Tone.Transport.pause();
    } else {
      await Tone.start();
      Tone.Transport.start();
    }
    
    isPlaying = !isPlaying;
  }
  
  // 정지
  function stopPlayback() {
    if (!part) return;
    
    Tone.Transport.stop();
    Tone.Transport.position = 0;
    currentTime = 0;
    currentMeasure = 0;
    isPlaying = false;
  }
  
  // 템포 변경
  function updateTempo(newTempo: number) {
    tempo = newTempo;
    Tone.Transport.bpm.value = tempo;
  }
  
  // 볼륨 변경
  function updateVolume(newVolume: number) {
    volume = newVolume;
    if (synth) {
      synth.volume.value = volumeToDb(volume);
    }
  }
  
  // 줌 변경
  function updateZoom(delta: number) {
    zoom = Math.max(50, Math.min(200, zoom + delta));
    initializeRenderer();
    if (midiData) {
      loadMidiData();
    }
  }
  
  // PDF 내보내기
  async function exportPDF() {
    // jsPDF를 사용한 PDF 내보내기
    // 구현 예정
    console.log('Exporting to PDF...');
  }
  
  // MusicXML 내보내기
  async function exportMusicXML() {
    // MusicXML 형식으로 내보내기
    // 구현 예정
    console.log('Exporting to MusicXML...');
  }
  
  onMount(() => {
    if (midiData) {
      loadMidiData();
    } else if (musicData) {
      // musicData로부터 렌더링
      // 구현 예정
    }
  });
  
  onDestroy(() => {
    // 리소스 정리
    if (part) {
      part.dispose();
    }
    if (synth) {
      synth.dispose();
    }
    Tone.Transport.stop();
    Tone.Transport.cancel();
  });
  
  // musicData 또는 midiData가 변경될 때마다 다시 로드
  $: if (midiData) {
    loadMidiData();
  }
</script>

<div class="music-viewer">
  <!-- 툴바 -->
  <div class="toolbar">
    <div class="toolbar-section">
      <!-- 재생 컨트롤 -->
      <button 
        class="btn btn-sm btn-circle"
        on:click={togglePlayback}
        disabled={!midiData && !musicData}
      >
        {#if isPlaying}
          <Pause size={18} />
        {:else}
          <Play size={18} />
        {/if}
      </button>
      
      <button 
        class="btn btn-sm btn-circle"
        on:click={stopPlayback}
        disabled={!midiData && !musicData}
      >
        <RotateCcw size={18} />
      </button>
      
      <button class="btn btn-sm btn-circle" disabled>
        <SkipBack size={18} />
      </button>
      
      <button class="btn btn-sm btn-circle" disabled>
        <SkipForward size={18} />
      </button>
      
      <!-- 템포 조절 -->
      <div class="tempo-control">
        <span class="text-sm">BPM</span>
        <input 
          type="number" 
          bind:value={tempo}
          on:change={() => updateTempo(tempo)}
          min="40" 
          max="240" 
          class="input input-sm input-bordered w-16"
        >
      </div>
      
      <!-- 볼륨 조절 -->
      <div class="volume-control">
        <Volume2 size={18} />
        <input 
          type="range" 
          bind:value={volume}
          on:input={() => updateVolume(volume)}
          min="0" 
          max="100" 
          class="range range-sm range-primary w-24"
        >
        <span class="text-sm">{volume}%</span>
      </div>
    </div>
    
    <div class="toolbar-section">
      <!-- 표시 옵션 -->
      <div class="form-control">
        <label class="label cursor-pointer gap-2">
          <input 
            type="checkbox" 
            bind:checked={showNotation}
            class="checkbox checkbox-sm checkbox-primary"
          >
          <span class="label-text">악보</span>
        </label>
      </div>
      
      <div class="form-control">
        <label class="label cursor-pointer gap-2">
          <input 
            type="checkbox" 
            bind:checked={showTabs}
            class="checkbox checkbox-sm checkbox-primary"
          >
          <span class="label-text">탭</span>
        </label>
      </div>
      
      <div class="form-control">
        <label class="label cursor-pointer gap-2">
          <input 
            type="checkbox" 
            bind:checked={showLyrics}
            class="checkbox checkbox-sm"
          >
          <span class="label-text">가사</span>
        </label>
      </div>
      
      <!-- 줌 컨트롤 -->
      <div class="zoom-control">
        <button 
          class="btn btn-sm btn-circle"
          on:click={() => updateZoom(-10)}
        >
          <ZoomOut size={18} />
        </button>
        <span class="text-sm px-2">{zoom}%</span>
        <button 
          class="btn btn-sm btn-circle"
          on:click={() => updateZoom(10)}
        >
          <ZoomIn size={18} />
        </button>
      </div>
      
      <!-- 내보내기 -->
      <div class="dropdown dropdown-end">
        <button class="btn btn-sm">
          <Download size={18} />
          내보내기
        </button>
        <ul class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
          <li><button on:click={exportPDF}>PDF로 내보내기</button></li>
          <li><button on:click={exportMusicXML}>MusicXML로 내보내기</button></li>
          <li><button>MIDI로 내보내기</button></li>
          <li><button>이미지로 내보내기</button></li>
        </ul>
      </div>
    </div>
  </div>
  
  <!-- 진행률 바 -->
  {#if midiData || musicData}
    <div class="progress-bar">
      <span class="time">{formatTime(currentTime)}</span>
      <progress 
        class="progress progress-primary"
        value={currentTime} 
        max={duration}
      ></progress>
      <span class="time">{formatTime(duration)}</span>
    </div>
  {/if}
  
  <!-- 악보 표시 영역 -->
  <div class="notation-container">
    {#if !midiData && !musicData}
      <div class="empty-state">
        <Music size={64} class="text-base-content/30" />
        <p class="text-lg text-base-content/50 mt-4">
          악보를 표시하려면 파일을 업로드하세요
        </p>
      </div>
    {:else}
      <div 
        bind:this={container}
        class="notation-canvas"
      ></div>
    {/if}
  </div>
  
  <!-- 마디 정보 -->
  {#if totalMeasures > 0}
    <div class="measure-info">
      <span>마디 {currentMeasure + 1} / {totalMeasures}</span>
    </div>
  {/if}
</div>

<style>
  .music-viewer {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }
  
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #f8f9fa;
    border-bottom: 1px solid #e5e7eb;
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .toolbar-section {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .tempo-control,
  .volume-control {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 8px;
    border-left: 1px solid #e5e7eb;
  }
  
  .zoom-control {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 0 8px;
    border-left: 1px solid #e5e7eb;
  }
  
  .progress-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 16px;
    background: #f8f9fa;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .progress-bar .progress {
    flex: 1;
  }
  
  .time {
    font-size: 0.875rem;
    color: #6b7280;
    min-width: 50px;
  }
  
  .notation-container {
    flex: 1;
    overflow: auto;
    padding: 20px;
    background: white;
  }
  
  .notation-canvas {
    min-height: 500px;
    width: 100%;
  }
  
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 400px;
  }
  
  .measure-info {
    padding: 8px 16px;
    background: #f8f9fa;
    border-top: 1px solid #e5e7eb;
    text-align: center;
    font-size: 0.875rem;
    color: #6b7280;
  }
  
  .form-control {
    display: flex;
    align-items: center;
  }
  
  .label {
    margin: 0;
    padding: 0;
  }
  
  /* 반응형 디자인 */
  @media (max-width: 768px) {
    .toolbar {
      flex-direction: column;
      align-items: stretch;
    }
    
    .toolbar-section {
      justify-content: center;
      flex-wrap: wrap;
    }
    
    .tempo-control,
    .volume-control,
    .zoom-control {
      border-left: none;
      border-top: 1px solid #e5e7eb;
      padding-top: 8px;
      margin-top: 8px;
      width: 100%;
      justify-content: center;
    }
  }
</style>

<script context="module" lang="ts">
  // 시간 포맷팅 헬퍼 함수
  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
</script>