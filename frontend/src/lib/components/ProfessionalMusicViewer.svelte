<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte';
  import { Renderer, Stave, StaveNote, Voice, Formatter, Beam, Tuplet, Annotation, TabStave, TabNote, StaveConnector, System, Factory, EasyScore, Articulation, Ornament } from 'vexflow';
  import * as Tone from 'tone';
  import { Midi } from '@tonejs/midi';
  import { 
    Play, 
    Pause, 
    Square,
    SkipBack, 
    SkipForward,
    Repeat,
    Volume2,
    Download,
    ZoomIn,
    ZoomOut,
    Maximize2,
    Settings,
    Music,
    FileText,
    Image,
    Sliders,
    Eye,
    EyeOff,
    ChevronLeft,
    ChevronRight,
    Loader2,
    AlertCircle
  } from 'lucide-svelte';
  
  export let midiData: ArrayBuffer | null = null;
  export let musicData: any = null;
  export let professionalMode = true;
  
  // 렌더링 옵션 (전문가 수준)
  let renderOptions = {
    // 표시 옵션
    showNotation: true,
    showTabs: true,
    showLyrics: false,
    showChords: true,
    showFingering: true,
    showDynamics: true,
    showArticulations: true,
    
    // 레이아웃 옵션
    scale: 1.0,
    staffSpacing: 120,
    systemSpacing: 150,
    measuresPerSystem: 4,
    systemsPerPage: 4,
    pageOrientation: 'portrait',
    
    // 스타일 옵션
    noteHeadStyle: 'normal', // normal, cross, diamond, triangle
    stemDirection: 'auto', // auto, up, down
    beamSlope: 'auto',
    slurStyle: 'solid', // solid, dashed, dotted
    
    // 탭 옵션
    tabStringCount: 6,
    tabTuning: ['E', 'A', 'D', 'G', 'B', 'E'],
    tabShowRhythm: true,
    tabNumbersOnly: false,
    
    // 색상 테마
    colorTheme: 'classic', // classic, dark, sepia, highContrast
    noteColor: '#000000',
    staffLineColor: '#000000',
    backgroundColor: '#FFFFFF',
    highlightColor: '#FFD700',
    
    // 품질 설정
    renderQuality: 'professional', // draft, standard, professional, print
    antiAliasing: true,
    staffLineThickness: 1.5,
    barLineThickness: 1.0,
    ledgerLineThickness: 1.5
  };
  
  // 재생 상태
  let isPlaying = false;
  let isLoading = false;
  let currentBeat = 0;
  let currentMeasure = 0;
  let totalMeasures = 0;
  let tempo = 120;
  let volume = 75;
  let playbackSpeed = 1.0;
  let loopEnabled = false;
  let loopStart = 0;
  let loopEnd = 0;
  let metronomeEnabled = false;
  let countInEnabled = false;
  
  // 렌더링 요소
  let container: HTMLDivElement;
  let renderer: any = null;
  let vf: any = null;
  let system: any = null;
  let pages: any[] = [];
  let currentPage = 0;
  
  // Tone.js 요소
  let synth: Tone.PolySynth | null = null;
  let part: Tone.Part | null = null;
  let metronome: Tone.Synth | null = null;
  
  // 전문가 렌더링 초기화
  async function initializeProfessionalRenderer() {
    if (!container) return;
    
    isLoading = true;
    
    try {
      // 기존 렌더러 정리
      if (renderer) {
        container.innerHTML = '';
      }
      
      // VexFlow Factory 사용 (더 정교한 렌더링)
      renderer = new Renderer(container, Renderer.Backends.SVG);
      
      // 전문가 수준 크기 설정
      const width = container.clientWidth * renderOptions.scale;
      const height = calculateOptimalHeight();
      renderer.resize(width, height);
      
      vf = new Factory({
        renderer: { elementId: null, width, height }
      });
      
      const context = renderer.getContext();
      
      // 고품질 렌더링 설정
      if (renderOptions.antiAliasing) {
        context.setRenderingHints({
          antiAlias: true,
          strokeAdjust: true,
          fontSmoothing: 'antialiased'
        });
      }
      
      // 색상 테마 적용
      applyColorTheme(context);
      
      // 폰트 설정 (전문 악보 폰트)
      context.setFont('Bravura', 10); // 또는 'Petaluma', 'Leland'
      
    } catch (error) {
      console.error('Failed to initialize professional renderer:', error);
    } finally {
      isLoading = false;
    }
  }
  
  // 최적 높이 계산
  function calculateOptimalHeight(): number {
    const baseHeight = 200; // 한 시스템 기본 높이
    const systemCount = renderOptions.systemsPerPage;
    const spacing = renderOptions.systemSpacing;
    const margins = 100;
    
    return baseHeight * systemCount + spacing * (systemCount - 1) + margins;
  }
  
  // 색상 테마 적용
  function applyColorTheme(context: any) {
    const themes = {
      classic: {
        note: '#000000',
        staff: '#000000',
        background: '#FFFFFF',
        highlight: '#FFD700'
      },
      dark: {
        note: '#FFFFFF',
        staff: '#CCCCCC',
        background: '#1A1A1A',
        highlight: '#4A9EFF'
      },
      sepia: {
        note: '#3C2415',
        staff: '#5C4033',
        background: '#F4E8D0',
        highlight: '#D2691E'
      },
      highContrast: {
        note: '#000000',
        staff: '#000000',
        background: '#FFFFFF',
        highlight: '#FF0000'
      }
    };
    
    const theme = themes[renderOptions.colorTheme] || themes.classic;
    
    context.setStrokeStyle(theme.staff);
    context.setFillStyle(theme.note);
    context.setBackgroundFillStyle(theme.background);
    
    // 컨테이너 배경색 설정
    if (container) {
      container.style.backgroundColor = theme.background;
    }
  }
  
  // 전문가 수준 악보 렌더링
  async function renderProfessionalNotation() {
    if (!renderer || !midiData) return;
    
    isLoading = true;
    
    try {
      // MIDI 파싱
      const midi = new Midi(midiData);
      const track = midi.tracks[0];
      if (!track) return;
      
      // 템포 설정
      if (midi.header.tempos.length > 0) {
        tempo = Math.round(midi.header.tempos[0].bpm);
      }
      
      // 페이지별 시스템 생성
      pages = [];
      let currentPage = createNewPage();
      let systemCount = 0;
      
      // 마디 그룹화
      const measures = groupNotesIntoMeasures(track.notes);
      totalMeasures = measures.length;
      
      // 시스템별로 렌더링
      for (let i = 0; i < measures.length; i += renderOptions.measuresPerSystem) {
        const systemMeasures = measures.slice(i, i + renderOptions.measuresPerSystem);
        
        // 새 페이지 필요 여부 확인
        if (systemCount >= renderOptions.systemsPerPage && systemCount > 0) {
          pages.push(currentPage);
          currentPage = createNewPage();
          systemCount = 0;
        }
        
        // 시스템 렌더링
        const system = renderSystem(
          currentPage.context,
          systemMeasures,
          systemCount,
          i === 0 // 첫 시스템 여부
        );
        
        currentPage.systems.push(system);
        systemCount++;
      }
      
      // 마지막 페이지 추가
      if (currentPage.systems.length > 0) {
        pages.push(currentPage);
      }
      
      // 첫 페이지 표시
      displayPage(0);
      
      // 재생 시퀀스 생성
      await createPlaybackSequence(track);
      
    } catch (error) {
      console.error('Professional rendering failed:', error);
    } finally {
      isLoading = false;
    }
  }
  
  // 새 페이지 생성
  function createNewPage() {
    const pageContainer = document.createElement('div');
    pageContainer.className = 'notation-page';
    
    const pageRenderer = new Renderer(pageContainer, Renderer.Backends.SVG);
    const width = container.clientWidth * renderOptions.scale;
    const height = calculateOptimalHeight();
    pageRenderer.resize(width, height);
    
    const context = pageRenderer.getContext();
    applyColorTheme(context);
    
    return {
      container: pageContainer,
      renderer: pageRenderer,
      context: context,
      systems: []
    };
  }
  
  // 시스템 렌더링 (오선보 + 탭)
  function renderSystem(context: any, measures: any[], systemIndex: number, isFirst: boolean) {
    const x = 50;
    const y = 100 + (systemIndex * renderOptions.systemSpacing);
    const width = context.width - 100;
    
    // 표준 오선보 생성
    let notationStave = null;
    if (renderOptions.showNotation) {
      notationStave = new Stave(x, y, width);
      
      // 첫 시스템에 조표, 박자표 추가
      if (isFirst) {
        notationStave.addClef('treble');
        notationStave.addTimeSignature('4/4');
        notationStave.addKeySignature('C');
        
        // 템포 표시
        notationStave.setTempo({ duration: 'q', dots: 0, bpm: tempo }, 0);
      }
      
      notationStave.setContext(context).draw();
      
      // 마디 렌더링
      measures.forEach((measure, idx) => {
        renderMeasure(context, notationStave, measure, idx);
      });
    }
    
    // 탭 악보 생성
    let tabStave = null;
    if (renderOptions.showTabs) {
      const tabY = renderOptions.showNotation ? y + 100 : y;
      tabStave = new TabStave(x, tabY, width);
      
      if (isFirst) {
        tabStave.addClef('tab');
        tabStave.setNumLines(renderOptions.tabStringCount);
      }
      
      tabStave.setContext(context).draw();
      
      // 탭 마디 렌더링
      measures.forEach((measure, idx) => {
        renderTabMeasure(context, tabStave, measure, idx);
      });
    }
    
    // 시스템 연결선 (브레이스)
    if (notationStave && tabStave) {
      const connector = new StaveConnector(notationStave, tabStave);
      connector.setType(StaveConnector.type.BRACE);
      connector.setContext(context).draw();
      
      // 시작 바라인
      const startBar = new StaveConnector(notationStave, tabStave);
      startBar.setType(StaveConnector.type.SINGLE_LEFT);
      startBar.setContext(context).draw();
      
      // 끝 바라인
      const endBar = new StaveConnector(notationStave, tabStave);
      endBar.setType(StaveConnector.type.SINGLE_RIGHT);
      endBar.setContext(context).draw();
    }
    
    return {
      notation: notationStave,
      tab: tabStave,
      measures: measures
    };
  }
  
  // 마디 렌더링 (전문가 수준)
  function renderMeasure(context: any, stave: any, measure: any, measureIndex: number) {
    if (!measure.notes || measure.notes.length === 0) return;
    
    const notes = measure.notes.map(note => {
      const staveNote = new StaveNote({
        keys: [midiToPitch(note.midi)],
        duration: noteDurationToVexFlow(note.duration),
        auto_stem: renderOptions.stemDirection === 'auto'
      });
      
      // 다이나믹 표시
      if (renderOptions.showDynamics && note.velocity) {
        const dynamic = velocityToDynamic(note.velocity);
        if (dynamic) {
          staveNote.addModifier(new Annotation(dynamic).setPosition(3));
        }
      }
      
      // 아티큘레이션 추가
      if (renderOptions.showArticulations) {
        if (note.staccato) {
          staveNote.addModifier(new Articulation('a.').setPosition(3));
        }
        if (note.accent) {
          staveNote.addModifier(new Articulation('a>').setPosition(3));
        }
        if (note.tenuto) {
          staveNote.addModifier(new Articulation('a-').setPosition(3));
        }
      }
      
      // 장식음 추가
      if (note.ornament) {
        staveNote.addModifier(new Ornament(note.ornament));
      }
      
      // 운지법 표시
      if (renderOptions.showFingering && note.fingering) {
        staveNote.addModifier(
          new Annotation(note.fingering)
            .setPosition(Annotation.Position.BOTTOM)
            .setFont('Arial', 8)
        );
      }
      
      return staveNote;
    });
    
    // Voice 생성
    const voice = new Voice({ num_beats: 4, beat_value: 4 });
    voice.addTickables(notes);
    
    // 포맷팅
    new Formatter().joinVoices([voice]).format([voice], stave.getWidth() - 60);
    voice.draw(context, stave);
    
    // 빔 연결 (자동)
    const beams = Beam.generateBeams(notes, {
      groups: [new Fraction(2, 8)],
      stem_direction: renderOptions.stemDirection === 'auto' ? undefined : 
                     renderOptions.stemDirection === 'up' ? 1 : -1
    });
    
    beams.forEach(beam => {
      beam.setContext(context).draw();
    });
    
    // 슬러/타이 추가
    if (measure.slurs) {
      measure.slurs.forEach(slur => {
        // StaveTie 또는 StaveCurve 사용
      });
    }
    
    // 코드 심볼 추가
    if (renderOptions.showChords && measure.chord) {
      const chord = new ChordSymbol()
        .addText(measure.chord)
        .setPosition(stave.getX() + 10, stave.getY() - 20);
      chord.setContext(context).draw();
    }
  }
  
  // 탭 마디 렌더링
  function renderTabMeasure(context: any, stave: any, measure: any, measureIndex: number) {
    if (!measure.notes || measure.notes.length === 0) return;
    
    const tabNotes = measure.notes.map(note => {
      const { string, fret } = midiToTab(note.midi);
      
      const tabNote = new TabNote({
        positions: [{ str: string, fret }],
        duration: renderOptions.tabShowRhythm ? 
                  noteDurationToVexFlow(note.duration) : 'q'
      });
      
      // 테크닉 표시
      if (note.technique) {
        switch (note.technique) {
          case 'bend':
            tabNote.addModifier(new Bend('1/2'));
            break;
          case 'vibrato':
            tabNote.addModifier(new Vibrato());
            break;
          case 'hammer':
            tabNote.addModifier(new Annotation('H'));
            break;
          case 'pull':
            tabNote.addModifier(new Annotation('P'));
            break;
          case 'slide':
            tabNote.addModifier(new Annotation('/'));
            break;
        }
      }
      
      return tabNote;
    });
    
    // Voice 생성
    const voice = new Voice({ num_beats: 4, beat_value: 4 });
    voice.addTickables(tabNotes);
    
    // 포맷팅
    new Formatter().joinVoices([voice]).format([voice], stave.getWidth() - 60);
    voice.draw(context, stave);
  }
  
  // 노트 그룹화
  function groupNotesIntoMeasures(notes: any[]): any[][] {
    const measures = [];
    let currentMeasure = [];
    let currentBeatCount = 0;
    const beatsPerMeasure = 4;
    
    notes.forEach(note => {
      currentMeasure.push(note);
      currentBeatCount += note.duration;
      
      if (currentBeatCount >= beatsPerMeasure) {
        measures.push(currentMeasure);
        currentMeasure = [];
        currentBeatCount = 0;
      }
    });
    
    if (currentMeasure.length > 0) {
      measures.push(currentMeasure);
    }
    
    return measures;
  }
  
  // MIDI to Pitch 변환
  function midiToPitch(midi: number): string {
    const noteNames = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];
    const octave = Math.floor(midi / 12) - 1;
    const noteIndex = midi % 12;
    return `${noteNames[noteIndex]}/${octave}`;
  }
  
  // MIDI to Tab 변환
  function midiToTab(midi: number): { string: number, fret: number } {
    const tuning = [40, 45, 50, 55, 59, 64]; // Standard tuning
    
    // 최적 포지션 찾기
    let bestString = 1;
    let bestFret = 0;
    let minMovement = Infinity;
    
    for (let s = 0; s < 6; s++) {
      const fret = midi - tuning[s];
      if (fret >= 0 && fret <= 24) {
        // 포지션 이동 최소화
        const movement = Math.abs(fret - 5); // 5프렛 근처 선호
        if (movement < minMovement) {
          minMovement = movement;
          bestString = s + 1;
          bestFret = fret;
        }
      }
    }
    
    return { string: bestString, fret: bestFret };
  }
  
  // Duration 변환
  function noteDurationToVexFlow(duration: number): string {
    const durationMap = [
      { min: 3.5, vex: 'w' },      // whole
      { min: 1.75, vex: 'h' },     // half
      { min: 0.875, vex: 'q' },    // quarter
      { min: 0.4375, vex: '8' },   // eighth
      { min: 0.21875, vex: '16' }, // sixteenth
      { min: 0, vex: '32' }         // thirty-second
    ];
    
    for (const mapping of durationMap) {
      if (duration >= mapping.min) {
        return mapping.vex;
      }
    }
    return 'q';
  }
  
  // Velocity to Dynamic 변환
  function velocityToDynamic(velocity: number): string {
    if (velocity < 16) return 'ppp';
    if (velocity < 32) return 'pp';
    if (velocity < 48) return 'p';
    if (velocity < 64) return 'mp';
    if (velocity < 80) return 'mf';
    if (velocity < 96) return 'f';
    if (velocity < 112) return 'ff';
    return 'fff';
  }
  
  // 페이지 표시
  function displayPage(pageIndex: number) {
    if (!pages[pageIndex]) return;
    
    currentPage = pageIndex;
    container.innerHTML = '';
    container.appendChild(pages[pageIndex].container);
    
    // 현재 재생 위치 하이라이트
    if (isPlaying) {
      highlightCurrentPosition();
    }
  }
  
  // 현재 위치 하이라이트
  function highlightCurrentPosition() {
    // SVG 요소에서 현재 마디 찾기
    const measureElements = container.querySelectorAll('.vf-measure');
    if (measureElements[currentMeasure]) {
      measureElements[currentMeasure].classList.add('playing');
    }
  }
  
  // 재생 시퀀스 생성
  async function createPlaybackSequence(track: any) {
    if (!track.notes || track.notes.length === 0) return;
    
    // 신스 초기화
    synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.3,
        release: 0.8
      }
    }).toDestination();
    
    // 볼륨 설정
    synth.volume.value = -20 + (volume / 5);
    
    // 메트로놈 초기화
    if (metronomeEnabled) {
      metronome = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 }
      }).toDestination();
      metronome.volume.value = -10;
    }
    
    // Part 생성
    const events = track.notes.map(note => ({
      time: note.time * playbackSpeed,
      note: Tone.Frequency(note.midi, 'midi').toNote(),
      duration: note.duration * playbackSpeed,
      velocity: note.velocity || 0.8
    }));
    
    part = new Tone.Part((time, event) => {
      synth?.triggerAttackRelease(
        event.note,
        event.duration,
        time,
        event.velocity
      );
      
      // 시각적 피드백
      Tone.Draw.schedule(() => {
        updatePlaybackPosition();
      }, time);
    }, events);
    
    part.loop = loopEnabled;
    if (loopEnabled) {
      part.loopStart = loopStart;
      part.loopEnd = loopEnd;
    }
    
    part.start(0);
  }
  
  // 재생 위치 업데이트
  function updatePlaybackPosition() {
    const progress = Tone.Transport.progress;
    currentMeasure = Math.floor(progress * totalMeasures);
    currentBeat = Math.floor((progress * totalMeasures * 4) % 4);
    
    // 페이지 자동 넘김
    const measuresPerPage = renderOptions.measuresPerSystem * renderOptions.systemsPerPage;
    const targetPage = Math.floor(currentMeasure / measuresPerPage);
    
    if (targetPage !== currentPage && targetPage < pages.length) {
      displayPage(targetPage);
    }
    
    highlightCurrentPosition();
  }
  
  // 재생 제어
  async function togglePlayback() {
    if (!part || !synth) return;
    
    if (isPlaying) {
      Tone.Transport.pause();
      isPlaying = false;
    } else {
      await Tone.start();
      
      // 카운트인
      if (countInEnabled) {
        // 4비트 카운트인
        for (let i = 0; i < 4; i++) {
          setTimeout(() => {
            metronome?.triggerAttackRelease('C5', '8n');
          }, i * (60000 / tempo));
        }
        
        setTimeout(() => {
          Tone.Transport.start();
        }, 4 * (60000 / tempo));
      } else {
        Tone.Transport.start();
      }
      
      isPlaying = true;
    }
  }
  
  // 정지
  function stopPlayback() {
    Tone.Transport.stop();
    Tone.Transport.position = 0;
    currentMeasure = 0;
    currentBeat = 0;
    isPlaying = false;
    displayPage(0);
  }
  
  // PDF 내보내기
  async function exportToPDF() {
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({
      orientation: renderOptions.pageOrientation,
      unit: 'mm',
      format: 'a4'
    });
    
    for (let i = 0; i < pages.length; i++) {
      if (i > 0) pdf.addPage();
      
      // SVG to PDF 변환
      const svg = pages[i].container.querySelector('svg');
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const img = new Image();
        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
        
        await new Promise(resolve => {
          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            
            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', 10, 10, 190, 277);
            resolve(null);
          };
        });
      }
    }
    
    pdf.save(`score_${Date.now()}.pdf`);
  }
  
  // MusicXML 내보내기
  async function exportToMusicXML() {
    // VexFlow to MusicXML conversion
    // 구현 예정
    console.log('Exporting to MusicXML...');
  }
  
  // PNG 내보내기
  async function exportToPNG() {
    const svg = container.querySelector('svg');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const img = new Image();
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    
    img.onload = () => {
      canvas.width = img.width * 2; // 고해상도
      canvas.height = img.height * 2;
      ctx?.scale(2, 2);
      ctx?.drawImage(img, 0, 0);
      
      canvas.toBlob(blob => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `score_${Date.now()}.png`;
          a.click();
        }
      });
    };
  }
  
  onMount(() => {
    initializeProfessionalRenderer();
    
    if (midiData) {
      renderProfessionalNotation();
    }
  });
  
  onDestroy(() => {
    if (part) part.dispose();
    if (synth) synth.dispose();
    if (metronome) metronome.dispose();
    Tone.Transport.stop();
    Tone.Transport.cancel();
  });
  
  // 반응형 업데이트
  $: if (midiData && renderer) {
    renderProfessionalNotation();
  }
</script>

<div class="professional-music-viewer">
  <!-- 상단 툴바 -->
  <div class="toolbar-top">
    <div class="toolbar-section">
      <h3 class="viewer-title">
        <Music size={20} />
        {musicData?.title || 'Untitled Score'}
      </h3>
      <span class="composer">{musicData?.composer || ''}</span>
    </div>
    
    <div class="toolbar-section">
      <!-- 보기 옵션 -->
      <div class="view-controls">
        <button 
          class="btn btn-sm"
          class:btn-primary={renderOptions.showNotation}
          on:click={() => renderOptions.showNotation = !renderOptions.showNotation}
          title="표준 악보"
        >
          <Music size={16} />
        </button>
        
        <button 
          class="btn btn-sm"
          class:btn-primary={renderOptions.showTabs}
          on:click={() => renderOptions.showTabs = !renderOptions.showTabs}
          title="기타 탭"
        >
          <FileText size={16} />
        </button>
        
        <button 
          class="btn btn-sm"
          class:btn-primary={renderOptions.showChords}
          on:click={() => renderOptions.showChords = !renderOptions.showChords}
          title="코드"
        >
          C
        </button>
        
        <button 
          class="btn btn-sm"
          class:btn-primary={renderOptions.showFingering}
          on:click={() => renderOptions.showFingering = !renderOptions.showFingering}
          title="운지법"
        >
          F
        </button>
      </div>
      
      <div class="divider-vertical"></div>
      
      <!-- 줌 컨트롤 -->
      <div class="zoom-controls">
        <button 
          class="btn btn-sm btn-ghost"
          on:click={() => renderOptions.scale = Math.max(0.5, renderOptions.scale - 0.1)}
        >
          <ZoomOut size={16} />
        </button>
        <span class="zoom-level">{Math.round(renderOptions.scale * 100)}%</span>
        <button 
          class="btn btn-sm btn-ghost"
          on:click={() => renderOptions.scale = Math.min(2, renderOptions.scale + 0.1)}
        >
          <ZoomIn size={16} />
        </button>
        <button 
          class="btn btn-sm btn-ghost"
          on:click={() => renderOptions.scale = 1}
        >
          <Maximize2 size={16} />
        </button>
      </div>
      
      <div class="divider-vertical"></div>
      
      <!-- 내보내기 -->
      <div class="dropdown dropdown-end">
        <button class="btn btn-sm">
          <Download size={16} />
          Export
        </button>
        <ul class="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-52">
          <li><button on:click={exportToPDF}>
            <FileText size={16} /> PDF (인쇄용)
          </button></li>
          <li><button on:click={exportToMusicXML}>
            <Music size={16} /> MusicXML
          </button></li>
          <li><button on:click={exportToPNG}>
            <Image size={16} /> PNG (고해상도)
          </button></li>
          <li><button>
            <FileText size={16} /> Guitar Pro
          </button></li>
        </ul>
      </div>
      
      <!-- 설정 -->
      <button class="btn btn-sm btn-ghost">
        <Settings size={16} />
      </button>
    </div>
  </div>
  
  <!-- 재생 컨트롤 -->
  <div class="playback-controls">
    <div class="transport-section">
      <!-- 재생 버튼 -->
      <button 
        class="btn btn-circle btn-primary"
        on:click={togglePlayback}
        disabled={!midiData}
      >
        {#if isPlaying}
          <Pause size={20} />
        {:else}
          <Play size={20} />
        {/if}
      </button>
      
      <button 
        class="btn btn-circle btn-ghost"
        on:click={stopPlayback}
      >
        <Square size={20} />
      </button>
      
      <div class="divider-vertical"></div>
      
      <!-- 네비게이션 -->
      <button class="btn btn-sm btn-ghost" disabled>
        <SkipBack size={16} />
      </button>
      
      <div class="measure-display">
        <span class="measure-current">{currentMeasure + 1}</span>
        <span class="measure-separator">/</span>
        <span class="measure-total">{totalMeasures}</span>
      </div>
      
      <button class="btn btn-sm btn-ghost" disabled>
        <SkipForward size={16} />
      </button>
      
      <div class="divider-vertical"></div>
      
      <!-- 템포 -->
      <div class="tempo-control">
        <label>Tempo</label>
        <input 
          type="number"
          bind:value={tempo}
          min="40"
          max="240"
          class="input input-sm input-bordered w-16"
        >
        <span class="bpm">BPM</span>
      </div>
      
      <!-- 속도 -->
      <div class="speed-control">
        <label>Speed</label>
        <select 
          bind:value={playbackSpeed}
          class="select select-sm select-bordered"
        >
          <option value={0.5}>0.5x</option>
          <option value={0.75}>0.75x</option>
          <option value={1}>1x</option>
          <option value={1.25}>1.25x</option>
          <option value={1.5}>1.5x</option>
        </select>
      </div>
      
      <!-- 볼륨 -->
      <div class="volume-control">
        <Volume2 size={16} />
        <input 
          type="range"
          bind:value={volume}
          min="0"
          max="100"
          class="range range-sm range-primary w-24"
        >
        <span class="volume-value">{volume}%</span>
      </div>
      
      <div class="divider-vertical"></div>
      
      <!-- 추가 옵션 -->
      <button 
        class="btn btn-sm"
        class:btn-primary={loopEnabled}
        on:click={() => loopEnabled = !loopEnabled}
      >
        <Repeat size={16} />
        Loop
      </button>
      
      <button 
        class="btn btn-sm"
        class:btn-primary={metronomeEnabled}
        on:click={() => metronomeEnabled = !metronomeEnabled}
      >
        <Music size={16} />
        Metro
      </button>
      
      <button 
        class="btn btn-sm"
        class:btn-primary={countInEnabled}
        on:click={() => countInEnabled = !countInEnabled}
      >
        Count
      </button>
    </div>
    
    <!-- 진행률 바 -->
    <div class="progress-bar">
      <span class="time-current">0:00</span>
      <progress 
        class="progress progress-primary"
        value={currentMeasure}
        max={totalMeasures}
      ></progress>
      <span class="time-total">3:45</span>
    </div>
  </div>
  
  <!-- 악보 표시 영역 -->
  <div class="notation-viewport">
    {#if isLoading}
      <div class="loading-overlay">
        <Loader2 size={48} class="animate-spin" />
        <p>악보를 렌더링하고 있습니다...</p>
      </div>
    {:else if !midiData && !musicData}
      <div class="empty-state">
        <Music size={64} />
        <h3>악보가 없습니다</h3>
        <p>파일을 업로드하거나 선택해주세요</p>
      </div>
    {:else}
      <div bind:this={container} class="notation-container"></div>
    {/if}
    
    <!-- 페이지 네비게이션 -->
    {#if pages.length > 1}
      <div class="page-navigation">
        <button 
          class="btn btn-circle btn-sm"
          on:click={() => displayPage(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0}
        >
          <ChevronLeft size={16} />
        </button>
        
        <span class="page-info">
          Page {currentPage + 1} / {pages.length}
        </span>
        
        <button 
          class="btn btn-circle btn-sm"
          on:click={() => displayPage(Math.min(pages.length - 1, currentPage + 1))}
          disabled={currentPage === pages.length - 1}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    {/if}
  </div>
  
  <!-- 하단 정보 바 -->
  <div class="status-bar">
    <div class="status-section">
      <span class="status-label">Key:</span>
      <span class="status-value">{musicData?.key || 'C Major'}</span>
    </div>
    <div class="status-section">
      <span class="status-label">Time:</span>
      <span class="status-value">{musicData?.timeSignature || '4/4'}</span>
    </div>
    <div class="status-section">
      <span class="status-label">Measures:</span>
      <span class="status-value">{totalMeasures}</span>
    </div>
    <div class="status-section">
      <span class="status-label">Duration:</span>
      <span class="status-value">{musicData?.duration || '0:00'}</span>
    </div>
    {#if currentBeat > 0}
      <div class="status-section">
        <span class="status-label">Beat:</span>
        <span class="status-value">{currentBeat}/4</span>
      </div>
    {/if}
  </div>
</div>

<style>
  .professional-music-viewer {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: #FAFAFA;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  /* 상단 툴바 */
  .toolbar-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    background: white;
    border-bottom: 1px solid #E0E0E0;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  }
  
  .toolbar-section {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .viewer-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  }
  
  .composer {
    color: #666;
    font-style: italic;
  }
  
  .view-controls {
    display: flex;
    gap: 4px;
  }
  
  .zoom-controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .zoom-level {
    min-width: 45px;
    text-align: center;
    font-size: 14px;
    font-weight: 500;
  }
  
  .divider-vertical {
    width: 1px;
    height: 24px;
    background: #E0E0E0;
  }
  
  /* 재생 컨트롤 */
  .playback-controls {
    padding: 16px 20px;
    background: white;
    border-bottom: 1px solid #E0E0E0;
  }
  
  .transport-section {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }
  
  .measure-display {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 12px;
    background: #F5F5F5;
    border-radius: 6px;
    font-weight: 500;
  }
  
  .measure-current {
    color: #1976D2;
  }
  
  .measure-separator {
    color: #999;
  }
  
  .tempo-control,
  .speed-control,
  .volume-control {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .tempo-control label,
  .speed-control label {
    font-size: 13px;
    color: #666;
    font-weight: 500;
  }
  
  .volume-value {
    min-width: 35px;
    font-size: 13px;
    color: #666;
  }
  
  .progress-bar {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .progress-bar progress {
    flex: 1;
    height: 6px;
  }
  
  .time-current,
  .time-total {
    font-size: 13px;
    color: #666;
    min-width: 40px;
  }
  
  /* 악보 표시 영역 */
  .notation-viewport {
    flex: 1;
    position: relative;
    overflow: auto;
    background: white;
    margin: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }
  
  .notation-container {
    padding: 40px;
    min-height: 100%;
  }
  
  .loading-overlay,
  .empty-state {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    color: #999;
  }
  
  .loading-overlay p,
  .empty-state p {
    margin-top: 16px;
    color: #666;
  }
  
  .empty-state h3 {
    margin: 16px 0 8px;
    font-size: 20px;
    color: #333;
  }
  
  /* 페이지 네비게이션 */
  .page-navigation {
    position: absolute;
    bottom: 20px;
    right: 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 16px;
    background: white;
    border-radius: 24px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }
  
  .page-info {
    font-size: 14px;
    font-weight: 500;
    color: #333;
  }
  
  /* 하단 상태 바 */
  .status-bar {
    display: flex;
    gap: 24px;
    padding: 8px 20px;
    background: #F5F5F5;
    border-top: 1px solid #E0E0E0;
    font-size: 13px;
  }
  
  .status-section {
    display: flex;
    gap: 6px;
  }
  
  .status-label {
    color: #666;
  }
  
  .status-value {
    font-weight: 500;
    color: #333;
  }
  
  /* 악보 스타일 */
  :global(.notation-container svg) {
    width: 100%;
    height: auto;
  }
  
  :global(.vf-measure.playing) {
    background: rgba(255, 215, 0, 0.2);
    border-radius: 4px;
  }
  
  /* 인쇄 스타일 */
  @media print {
    .toolbar-top,
    .playback-controls,
    .page-navigation,
    .status-bar {
      display: none;
    }
    
    .notation-viewport {
      margin: 0;
      box-shadow: none;
    }
    
    .notation-container {
      padding: 0;
    }
  }
  
  /* 다크 테마 */
  :global(.dark) .professional-music-viewer {
    background: #1A1A1A;
  }
  
  :global(.dark) .toolbar-top,
  :global(.dark) .playback-controls,
  :global(.dark) .notation-viewport {
    background: #2D2D2D;
    border-color: #444;
  }
  
  :global(.dark) .status-bar {
    background: #252525;
    border-color: #444;
  }
  
  :global(.dark) .viewer-title,
  :global(.dark) .status-value {
    color: #E0E0E0;
  }
  
  :global(.dark) .composer,
  :global(.dark) .status-label {
    color: #999;
  }
</style>