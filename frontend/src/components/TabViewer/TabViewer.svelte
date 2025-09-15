<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Vex from 'vexflow';
  import * as Tone from 'tone';
  import { tabStore } from '../../stores/tabStore';
  import type { TabData, PlaybackSettings } from '../../types/tab';
  
  export let tabData: TabData;
  export let height: number = 600;
  
  let container: HTMLDivElement;
  let renderer: any;
  let context: any;
  let currentMeasure = 0;
  let currentBeat = 0;
  let isPlaying = false;
  let playbackSpeed = 1.0;
  
  // VexFlow 설정
  const VF = Vex.Flow;
  const staveWidth = 400;
  const staveSpacing = 150;
  
  // 뷰 모드
  let viewMode: 'tab' | 'standard' | 'combined' | 'chord' = 'combined';
  
  // 재생 설정
  let playbackSettings: PlaybackSettings = {
    tempo: 120,
    volume: 80,
    loop: { enabled: false, start: 0, end: 0 },
    countIn: true,
    metronome: false,
    guitarTone: 'clean'
  };
  
  // 트랙 설정
  let tracks = {
    guitar: { volume: 100, muted: false, solo: false },
    bass: { volume: 80, muted: false, solo: false },
    drums: { volume: 90, muted: false, solo: false },
    backing: { volume: 70, muted: false, solo: false }
  };
  
  // 기타 톤 프리셋
  const guitarTones = {
    clean: 'Clean Electric',
    acoustic: 'Acoustic Guitar',
    overdrive: 'Overdrive',
    distortion: 'Distortion',
    jazz: 'Jazz Tone'
  };
  
  onMount(() => {
    initializeRenderer();
    renderTab();
    initializeAudio();
  });
  
  onDestroy(() => {
    if (isPlaying) {
      stop();
    }
    Tone.Transport.cancel();
  });
  
  function initializeRenderer() {
    // VexFlow 렌더러 초기화
    renderer = new VF.Renderer(container, VF.Renderer.Backends.SVG);
    renderer.resize(container.clientWidth, height);
    context = renderer.getContext();
    context.setFont('Arial', 10, '').setBackgroundFillStyle('#fff');
  }
  
  function renderTab() {
    // 컨텍스트 클리어
    context.clear();
    
    const measures = tabData.measures || [];
    let x = 10;
    let y = 50;
    
    measures.forEach((measure, measureIndex) => {
      // 새 라인 체크
      if (x + staveWidth > container.clientWidth - 20) {
        x = 10;
        y += staveSpacing;
      }
      
      if (viewMode === 'combined' || viewMode === 'standard') {
        renderStandardNotation(measure, x, y, measureIndex);
      }
      
      if (viewMode === 'combined' || viewMode === 'tab') {
        const tabY = viewMode === 'combined' ? y + 80 : y;
        renderTabNotation(measure, x, tabY, measureIndex);
      }
      
      if (viewMode === 'chord') {
        renderChordDiagrams(measure, x, y);
      }
      
      x += staveWidth;
    });
  }
  
  function renderStandardNotation(measure: any, x: number, y: number, index: number) {
    // 오선보 생성
    const stave = new VF.Stave(x, y, staveWidth);
    
    // 첫 마디에 조표, 박자표 추가
    if (index === 0) {
      stave.addClef('treble');
      stave.addTimeSignature(measure.timeSignature || '4/4');
      if (tabData.key) {
        stave.addKeySignature(tabData.key);
      }
    }
    
    stave.setContext(context).draw();
    
    // 노트 렌더링
    const notes = measure.notes.map((noteData: any) => {
      const note = new VF.StaveNote({
        keys: [noteData.pitch || 'c/4'],
        duration: noteData.duration || 'q'
      });
      
      // 아티큘레이션 추가
      if (noteData.articulation) {
        addArticulation(note, noteData.articulation);
      }
      
      // 가사 추가
      if (noteData.lyric) {
        note.addAnnotation(0, new VF.Annotation(noteData.lyric)
          .setVerticalJustification(VF.Annotation.VerticalJustify.BOTTOM));
      }
      
      return note;
    });
    
    // Voice 생성 및 포맷
    if (notes.length > 0) {
      const voice = new VF.Voice({
        num_beats: parseInt(measure.timeSignature?.split('/')[0] || '4'),
        beat_value: parseInt(measure.timeSignature?.split('/')[1] || '4')
      });
      
      voice.addTickables(notes);
      
      const formatter = new VF.Formatter();
      formatter.joinVoices([voice]).format([voice], staveWidth - 100);
      
      voice.draw(context, stave);
    }
    
    // 현재 재생 위치 표시
    if (measureIndex === currentMeasure) {
      highlightMeasure(x, y, staveWidth, 80);
    }
  }
  
  function renderTabNotation(measure: any, x: number, y: number, index: number) {
    // Tab 보표 생성
    const tabStave = new VF.TabStave(x, y, staveWidth);
    
    if (index === 0) {
      tabStave.addClef('tab');
    }
    
    tabStave.setContext(context).draw();
    
    // Tab 노트 렌더링
    const tabNotes = measure.notes.map((noteData: any) => {
      const positions = noteData.positions || [{ str: 1, fret: 0 }];
      
      const tabNote = new VF.TabNote({
        positions: positions,
        duration: noteData.duration || 'q'
      });
      
      // 테크닉 표시
      if (noteData.technique) {
        addTechnique(tabNote, noteData.technique);
      }
      
      return tabNote;
    });
    
    // Voice 생성 및 포맷
    if (tabNotes.length > 0) {
      const voice = new VF.Voice({
        num_beats: parseInt(measure.timeSignature?.split('/')[0] || '4'),
        beat_value: parseInt(measure.timeSignature?.split('/')[1] || '4')
      });
      
      voice.addTickables(tabNotes);
      
      const formatter = new VF.Formatter();
      formatter.joinVoices([voice]).format([voice], staveWidth - 100);
      
      voice.draw(context, tabStave);
    }
  }
  
  function renderChordDiagrams(measure: any, x: number, y: number) {
    // 코드 다이어그램 렌더링
    measure.chords?.forEach((chord: any, i: number) => {
      const chordX = x + (i * 80);
      drawChordDiagram(chord, chordX, y);
    });
  }
  
  function drawChordDiagram(chord: any, x: number, y: number) {
    // 간단한 코드 다이어그램 그리기
    const ctx = context;
    const fretWidth = 10;
    const stringSpacing = 10;
    
    // 프렛 그리기
    for (let fret = 0; fret < 5; fret++) {
      ctx.moveTo(x, y + fret * fretWidth);
      ctx.lineTo(x + 5 * stringSpacing, y + fret * fretWidth);
    }
    
    // 줄 그리기
    for (let string = 0; string < 6; string++) {
      ctx.moveTo(x + string * stringSpacing, y);
      ctx.lineTo(x + string * stringSpacing, y + 4 * fretWidth);
    }
    
    ctx.stroke();
    
    // 코드 이름 표시
    ctx.fillText(chord.name, x, y - 10);
    
    // 핑거 포지션 표시
    chord.positions?.forEach((pos: any) => {
      if (pos.fret > 0) {
        ctx.beginPath();
        ctx.arc(
          x + pos.string * stringSpacing,
          y + (pos.fret - 0.5) * fretWidth,
          4, 0, 2 * Math.PI
        );
        ctx.fill();
      }
    });
  }
  
  function addArticulation(note: any, articulation: string) {
    const articulationMap: Record<string, any> = {
      'staccato': new VF.Articulation('a.'),
      'accent': new VF.Articulation('a>'),
      'tenuto': new VF.Articulation('a-'),
      'fermata': new VF.Articulation('a@a'),
      'harmonic': new VF.Annotation('Harm.')
    };
    
    if (articulationMap[articulation]) {
      note.addModifier(articulationMap[articulation], 0);
    }
  }
  
  function addTechnique(tabNote: any, technique: string) {
    const techniqueMap: Record<string, any> = {
      'bend': new VF.Bend('Full'),
      'vibrato': new VF.Vibrato(),
      'hammer_on': new VF.Annotation('H'),
      'pull_off': new VF.Annotation('P'),
      'slide_up': new VF.Annotation('/'),
      'slide_down': new VF.Annotation('\\'),
      'palm_mute': new VF.Annotation('P.M.'),
      'tap': new VF.Annotation('T')
    };
    
    if (techniqueMap[technique]) {
      if (technique === 'bend' || technique === 'vibrato') {
        tabNote.addModifier(techniqueMap[technique], 0);
      } else {
        tabNote.addAnnotation(0, techniqueMap[technique]);
      }
    }
  }
  
  function highlightMeasure(x: number, y: number, width: number, height: number) {
    // 현재 재생 중인 마디 하이라이트
    const ctx = context;
    ctx.save();
    ctx.fillStyle = 'rgba(255, 200, 0, 0.2)';
    ctx.fillRect(x, y - 10, width, height);
    ctx.restore();
  }
  
  // 오디오 엔진 초기화
  let sampler: Tone.Sampler;
  let metronome: Tone.MetalSynth;
  
  async function initializeAudio() {
    // 기타 샘플러 초기화
    sampler = new Tone.Sampler({
      urls: {
        'C3': 'C3.mp3',
        'D3': 'D3.mp3',
        'E3': 'E3.mp3',
        'G3': 'G3.mp3',
        'A3': 'A3.mp3',
        'C4': 'C4.mp3',
        'D4': 'D4.mp3',
        'E4': 'E4.mp3',
        'G4': 'G4.mp3',
        'A4': 'A4.mp3'
      },
      baseUrl: `/samples/guitar/${playbackSettings.guitarTone}/`,
      onload: () => {
        console.log('Guitar samples loaded');
      }
    }).toDestination();
    
    // 메트로놈 초기화
    metronome = new Tone.MetalSynth({
      frequency: 800,
      envelope: {
        attack: 0.001,
        decay: 0.1,
        release: 0.01
      },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5
    }).toDestination();
    
    metronome.volume.value = -10;
  }
  
  // 재생 컨트롤
  function play() {
    if (!isPlaying) {
      Tone.Transport.bpm.value = playbackSettings.tempo * playbackSpeed;
      
      if (playbackSettings.countIn) {
        playCountIn();
      } else {
        startPlayback();
      }
    }
  }
  
  function playCountIn() {
    let count = 0;
    const countInLoop = new Tone.Loop((time) => {
      metronome.triggerAttackRelease('C5', '16n', time);
      count++;
      
      if (count >= 4) {
        countInLoop.stop();
        startPlayback();
      }
    }, '4n');
    
    countInLoop.start();
    Tone.Transport.start();
  }
  
  function startPlayback() {
    isPlaying = true;
    
    // 루프 설정
    if (playbackSettings.loop.enabled) {
      Tone.Transport.loop = true;
      Tone.Transport.loopStart = playbackSettings.loop.start;
      Tone.Transport.loopEnd = playbackSettings.loop.end;
    }
    
    // 노트 스케줄링
    scheduleNotes();
    
    // 메트로놈 활성화
    if (playbackSettings.metronome) {
      startMetronome();
    }
    
    Tone.Transport.start();
  }
  
  function scheduleNotes() {
    tabData.measures.forEach((measure, measureIndex) => {
      measure.notes.forEach((note, noteIndex) => {
        const time = `${measureIndex}:${noteIndex}`;
        
        Tone.Transport.schedule((time) => {
          // 노트 재생
          if (!tracks.guitar.muted) {
            const volume = (tracks.guitar.volume / 100) * (playbackSettings.volume / 100);
            sampler.triggerAttackRelease(
              note.pitch || 'C4',
              note.duration || '8n',
              time,
              volume
            );
          }
          
          // UI 업데이트
          Tone.Draw.schedule(() => {
            currentMeasure = measureIndex;
            currentBeat = noteIndex;
            renderTab(); // 하이라이트 업데이트
          }, time);
        }, time);
      });
    });
  }
  
  function startMetronome() {
    const metronomeLoop = new Tone.Loop((time) => {
      metronome.triggerAttackRelease('C6', '32n', time);
    }, '4n');
    
    metronomeLoop.start(0);
  }
  
  function pause() {
    if (isPlaying) {
      Tone.Transport.pause();
      isPlaying = false;
    }
  }
  
  function stop() {
    Tone.Transport.stop();
    Tone.Transport.position = 0;
    isPlaying = false;
    currentMeasure = 0;
    currentBeat = 0;
    renderTab();
  }
  
  function setSpeed(speed: number) {
    playbackSpeed = speed;
    Tone.Transport.bpm.value = playbackSettings.tempo * speed;
  }
  
  function setLoop(start: number, end: number) {
    playbackSettings.loop = {
      enabled: true,
      start: `${start}:0`,
      end: `${end}:0`
    };
  }
  
  function toggleTrack(trackName: keyof typeof tracks) {
    tracks[trackName].muted = !tracks[trackName].muted;
  }
  
  function soloTrack(trackName: keyof typeof tracks) {
    Object.keys(tracks).forEach(track => {
      tracks[track as keyof typeof tracks].muted = track !== trackName;
    });
  }
  
  function setTrackVolume(trackName: keyof typeof tracks, volume: number) {
    tracks[trackName].volume = volume;
  }
  
  // 뷰 모드 변경
  function changeViewMode(mode: typeof viewMode) {
    viewMode = mode;
    renderTab();
  }
  
  // 줌 기능
  let zoomLevel = 1.0;
  
  function zoom(delta: number) {
    zoomLevel = Math.max(0.5, Math.min(2.0, zoomLevel + delta));
    renderer.resize(container.clientWidth * zoomLevel, height * zoomLevel);
    context.scale(zoomLevel, zoomLevel);
    renderTab();
  }
</script>

<div class="tab-viewer">
  <!-- 컨트롤 바 -->
  <div class="controls">
    <div class="playback-controls">
      <button on:click={play} disabled={isPlaying}>
        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M5 4v12l10-6z"/>
        </svg>
      </button>
      <button on:click={pause} disabled={!isPlaying}>
        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M6 4h3v12H6zM11 4h3v12h-3z"/>
        </svg>
      </button>
      <button on:click={stop}>
        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 4h12v12H4z"/>
        </svg>
      </button>
    </div>
    
    <div class="tempo-control">
      <label>
        Tempo: {playbackSettings.tempo}
        <input type="range" min="40" max="200" bind:value={playbackSettings.tempo} />
      </label>
    </div>
    
    <div class="speed-control">
      <label>
        Speed: {Math.round(playbackSpeed * 100)}%
        <input type="range" min="0.25" max="2" step="0.25" bind:value={playbackSpeed} on:change={() => setSpeed(playbackSpeed)} />
      </label>
    </div>
    
    <div class="view-modes">
      <button class:active={viewMode === 'tab'} on:click={() => changeViewMode('tab')}>Tab</button>
      <button class:active={viewMode === 'standard'} on:click={() => changeViewMode('standard')}>Standard</button>
      <button class:active={viewMode === 'combined'} on:click={() => changeViewMode('combined')}>Combined</button>
      <button class:active={viewMode === 'chord'} on:click={() => changeViewMode('chord')}>Chords</button>
    </div>
    
    <div class="zoom-controls">
      <button on:click={() => zoom(-0.1)}>-</button>
      <span>{Math.round(zoomLevel * 100)}%</span>
      <button on:click={() => zoom(0.1)}>+</button>
    </div>
    
    <div class="options">
      <label>
        <input type="checkbox" bind:checked={playbackSettings.metronome} />
        Metronome
      </label>
      <label>
        <input type="checkbox" bind:checked={playbackSettings.countIn} />
        Count-in
      </label>
      <label>
        <input type="checkbox" bind:checked={playbackSettings.loop.enabled} />
        Loop
      </label>
    </div>
    
    <div class="guitar-tone">
      <select bind:value={playbackSettings.guitarTone}>
        {#each Object.entries(guitarTones) as [value, label]}
          <option {value}>{label}</option>
        {/each}
      </select>
    </div>
  </div>
  
  <!-- 트랙 믹서 -->
  <div class="track-mixer">
    {#each Object.entries(tracks) as [trackName, track]}
      <div class="track">
        <span class="track-name">{trackName}</span>
        <button on:click={() => toggleTrack(trackName)} class:muted={track.muted}>
          M
        </button>
        <button on:click={() => soloTrack(trackName)} class:solo={track.solo}>
          S
        </button>
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={track.volume}
          on:input={(e) => setTrackVolume(trackName, e.target.value)}
          disabled={track.muted}
        />
        <span class="volume">{track.volume}%</span>
      </div>
    {/each}
  </div>
  
  <!-- Tab 렌더링 영역 -->
  <div class="tab-container" bind:this={container}></div>
  
  <!-- 진행 바 -->
  <div class="progress-bar">
    <div class="progress" style="width: {(currentMeasure / tabData.measures.length) * 100}%"></div>
  </div>
</div>

<style>
  .tab-viewer {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    padding: 20px;
  }
  
  .controls {
    display: flex;
    gap: 20px;
    align-items: center;
    padding: 15px;
    background: #f5f5f5;
    border-radius: 8px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }
  
  .playback-controls {
    display: flex;
    gap: 10px;
  }
  
  .playback-controls button {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background: #4a5568;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }
  
  .playback-controls button:hover:not(:disabled) {
    background: #2d3748;
  }
  
  .playback-controls button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .tempo-control, .speed-control {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .view-modes {
    display: flex;
    gap: 5px;
  }
  
  .view-modes button {
    padding: 5px 15px;
    border: 1px solid #d1d5db;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .view-modes button.active {
    background: #4a5568;
    color: white;
    border-color: #4a5568;
  }
  
  .zoom-controls {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .zoom-controls button {
    width: 30px;
    height: 30px;
    border: 1px solid #d1d5db;
    background: white;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .options {
    display: flex;
    gap: 15px;
  }
  
  .options label {
    display: flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
  }
  
  .guitar-tone select {
    padding: 5px 10px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    background: white;
  }
  
  .track-mixer {
    display: flex;
    gap: 20px;
    padding: 15px;
    background: #f9fafb;
    border-radius: 8px;
    margin-bottom: 20px;
  }
  
  .track {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .track-name {
    font-weight: 500;
    min-width: 60px;
  }
  
  .track button {
    width: 25px;
    height: 25px;
    border: 1px solid #d1d5db;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
  }
  
  .track button.muted {
    background: #ef4444;
    color: white;
  }
  
  .track button.solo {
    background: #f59e0b;
    color: white;
  }
  
  .track input[type="range"] {
    width: 80px;
  }
  
  .volume {
    font-size: 12px;
    color: #6b7280;
    min-width: 35px;
  }
  
  .tab-container {
    min-height: 400px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 20px;
    overflow-x: auto;
    background: white;
  }
  
  .progress-bar {
    height: 4px;
    background: #e5e7eb;
    border-radius: 2px;
    margin-top: 20px;
    overflow: hidden;
  }
  
  .progress {
    height: 100%;
    background: #10b981;
    transition: width 0.3s;
  }
  
  input[type="range"] {
    cursor: pointer;
  }
  
  label {
    font-size: 14px;
    color: #374151;
  }
</style>