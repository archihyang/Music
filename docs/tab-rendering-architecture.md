# Advanced Tab Rendering & Playback Architecture

## 🎸 벤치마킹: Guitar Pro & Ultimate Guitar 핵심 기능 분석

### Guitar Pro 핵심 기능
1. **Realistic Sound Engine (RSE)**
   - 실제 악기 샘플 기반 사운드
   - 다양한 기타 톤 (Clean, Overdrive, Distortion)
   - 앰프/이펙터 시뮬레이션

2. **악보 표시 시스템**
   - Tab + 오선보 동시 표시
   - 다양한 뷰 모드 (Tab only, Standard only, Combined)
   - 페이지/스크롤 뷰 옵션

3. **연주 보조 기능**
   - Speed Trainer (속도 점진적 증가)
   - Loop 기능 (구간 반복)
   - 메트로놈 동기화
   - Count-in (연주 시작 카운트)

4. **멀티트랙 시스템**
   - 각 악기별 트랙 분리
   - Solo/Mute 기능
   - 볼륨/팬 조절

### Ultimate Guitar 핵심 기능
1. **Interactive Tab Player**
   - 자동 스크롤
   - 하이라이트 현재 재생 위치
   - 모바일 최적화

2. **Practice Mode**
   - 난이도별 속도 조절
   - 특정 구간 반복
   - 코드 다이어그램 표시

3. **커뮤니티 기능**
   - 사용자 제작 Tab
   - 평점/리뷰 시스템
   - 버전 관리

## 🎼 Genesis Music Tab Rendering System

### 1. 핵심 아키텍처

```typescript
// Tab Rendering Engine 구조
interface TabRenderingEngine {
  // 렌더링 모드
  viewMode: 'tab' | 'standard' | 'combined' | 'chord';
  
  // 표시 옵션
  displayOptions: {
    showTabNumbers: boolean;
    showStandardNotation: boolean;
    showLyrics: boolean;
    showChordDiagrams: boolean;
    showFingering: boolean;
    showTechniques: boolean; // H, P, /, \, ~, etc.
  };
  
  // 레이아웃
  layout: {
    mode: 'page' | 'horizontal_scroll' | 'vertical_scroll';
    zoom: number; // 50-200%
    measuresPerLine: number;
    spacing: 'comfortable' | 'compact' | 'wide';
  };
  
  // 동기화
  synchronization: {
    currentPosition: number; // measure.beat.tick
    playheadVisible: boolean;
    autoScroll: boolean;
    smoothScroll: boolean;
  };
}
```

### 2. VexFlow 통합 구현

```javascript
// frontend/src/lib/TabRenderer.js
import Vex from 'vexflow';

class TabRenderer {
  constructor(containerId) {
    this.VF = Vex.Flow;
    this.container = document.getElementById(containerId);
    this.renderer = new this.VF.Renderer(
      this.container,
      this.VF.Renderer.Backends.SVG
    );
    
    this.context = this.renderer.getContext();
    this.staveWidth = 400;
    this.staveHeight = 150;
  }
  
  renderCombinedView(measures) {
    // 오선보 + Tab 동시 렌더링
    measures.forEach((measure, index) => {
      const x = 10 + (index * this.staveWidth);
      
      // 오선보 (위)
      const trebleStave = new this.VF.Stave(x, 10, this.staveWidth);
      if (index === 0) {
        trebleStave.addClef('treble');
        trebleStave.addTimeSignature('4/4');
      }
      
      // Tab 보 (아래)
      const tabStave = new this.VF.TabStave(x, 100, this.staveWidth);
      if (index === 0) {
        tabStave.addClef('tab');
      }
      
      // 연결선
      const connector = new this.VF.StaveConnector(trebleStave, tabStave);
      connector.setType(this.VF.StaveConnector.type.SINGLE);
      
      // 렌더링
      trebleStave.setContext(this.context).draw();
      tabStave.setContext(this.context).draw();
      connector.setContext(this.context).draw();
      
      // 노트 렌더링
      this.renderNotes(measure, trebleStave, tabStave);
    });
  }
  
  renderNotes(measure, trebleStave, tabStave) {
    // 오선보 노트
    const standardNotes = measure.notes.map(note => {
      const vexNote = new this.VF.StaveNote({
        keys: [note.pitch],
        duration: note.duration
      });
      
      // 아티큘레이션 추가
      if (note.technique) {
        this.addArticulation(vexNote, note.technique);
      }
      
      return vexNote;
    });
    
    // Tab 노트
    const tabNotes = measure.notes.map(note => {
      const tabNote = new this.VF.TabNote({
        positions: [{
          str: note.string,
          fret: note.fret
        }],
        duration: note.duration
      });
      
      // 테크닉 표시
      if (note.technique === 'bend') {
        tabNote.addModifier(new this.VF.Bend('Full'), 0);
      } else if (note.technique === 'vibrato') {
        tabNote.addModifier(new this.VF.Vibrato(), 0);
      }
      
      return tabNote;
    });
    
    // Voice 생성 및 포맷팅
    const standardVoice = new this.VF.Voice({
      num_beats: 4,
      beat_value: 4
    }).addTickables(standardNotes);
    
    const tabVoice = new this.VF.Voice({
      num_beats: 4,
      beat_value: 4
    }).addTickables(tabNotes);
    
    // 포맷터로 정렬
    const formatter = new this.VF.Formatter();
    formatter.joinVoices([standardVoice, tabVoice]);
    formatter.format([standardVoice, tabVoice], this.staveWidth - 50);
    
    // 렌더링
    standardVoice.draw(this.context, trebleStave);
    tabVoice.draw(this.context, tabStave);
  }
  
  addArticulation(note, technique) {
    const articulations = {
      'hammer_on': 'H',
      'pull_off': 'P',
      'slide_up': '/',
      'slide_down': '\\',
      'palm_mute': 'P.M.',
      'harmonic': 'Harm.',
      'tap': 'T'
    };
    
    if (articulations[technique]) {
      note.addAnnotation(0, new this.VF.Annotation(articulations[technique]));
    }
  }
  
  highlightCurrentPosition(measureIndex, beatIndex) {
    // 현재 재생 위치 하이라이트
    const element = document.querySelector(
      `#measure-${measureIndex}-beat-${beatIndex}`
    );
    
    if (element) {
      element.classList.add('playing');
      
      // 자동 스크롤
      if (this.autoScroll) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }
}
```

## 🎵 고품질 기타 사운드 엔진

### 1. Tone.js 기반 Guitar Sound Engine

```javascript
// frontend/src/lib/GuitarSoundEngine.js
import * as Tone from 'tone';

class GuitarSoundEngine {
  constructor() {
    this.guitars = this.initializeGuitars();
    this.effects = this.initializeEffects();
    this.currentGuitar = 'clean';
    this.isLoaded = false;
  }
  
  async initializeGuitars() {
    // 다양한 기타 톤 샘플러
    const guitars = {
      clean: new Tone.Sampler({
        urls: {
          'C3': 'C3.mp3',
          'E3': 'E3.mp3',
          'G3': 'G3.mp3',
          'C4': 'C4.mp3',
          'E4': 'E4.mp3',
          'G4': 'G4.mp3',
          'C5': 'C5.mp3'
        },
        baseUrl: '/samples/guitar/clean/',
        onload: () => {
          console.log('Clean guitar loaded');
        }
      }),
      
      overdrive: new Tone.Sampler({
        urls: {
          'C3': 'C3.mp3',
          'E3': 'E3.mp3',
          'G3': 'G3.mp3',
          'C4': 'C4.mp3',
          'E4': 'E4.mp3'
        },
        baseUrl: '/samples/guitar/overdrive/'
      }),
      
      distortion: new Tone.Sampler({
        urls: {
          'C3': 'C3.mp3',
          'D3': 'D3.mp3',
          'E3': 'E3.mp3',
          'G3': 'G3.mp3',
          'A3': 'A3.mp3'
        },
        baseUrl: '/samples/guitar/distortion/'
      }),
      
      acoustic: new Tone.Sampler({
        urls: {
          'C3': 'C3.mp3',
          'E3': 'E3.mp3',
          'G3': 'G3.mp3',
          'B3': 'B3.mp3',
          'D4': 'D4.mp3',
          'G4': 'G4.mp3'
        },
        baseUrl: '/samples/guitar/acoustic/'
      })
    };
    
    // 모든 샘플러를 이펙트 체인에 연결
    Object.values(guitars).forEach(guitar => {
      guitar.toDestination();
    });
    
    return guitars;
  }
  
  initializeEffects() {
    // 기타 이펙트 체인
    return {
      reverb: new Tone.Reverb({
        decay: 2.5,
        preDelay: 0.01,
        wet: 0.3
      }),
      
      delay: new Tone.FeedbackDelay({
        delayTime: '8n',
        feedback: 0.3,
        wet: 0.2
      }),
      
      chorus: new Tone.Chorus({
        frequency: 4,
        delayTime: 2.5,
        depth: 0.5,
        wet: 0.3
      }),
      
      distortion: new Tone.Distortion({
        distortion: 0.8,
        oversample: '4x',
        wet: 1
      }),
      
      compressor: new Tone.Compressor({
        threshold: -20,
        ratio: 8,
        attack: 0.003,
        release: 0.1
      }),
      
      wah: new Tone.AutoWah({
        baseFrequency: 100,
        octaves: 6,
        sensitivity: 0,
        Q: 2,
        gain: 2,
        wet: 1
      })
    };
  }
  
  setGuitarTone(tone) {
    this.currentGuitar = tone;
    
    // 톤에 따른 이펙트 프리셋
    const presets = {
      clean: {
        reverb: 0.2,
        delay: 0.1,
        chorus: 0.3,
        distortion: 0
      },
      overdrive: {
        reverb: 0.15,
        delay: 0.2,
        chorus: 0,
        distortion: 0.4
      },
      distortion: {
        reverb: 0.3,
        delay: 0.25,
        chorus: 0,
        distortion: 0.8
      },
      acoustic: {
        reverb: 0.4,
        delay: 0,
        chorus: 0.1,
        distortion: 0
      }
    };
    
    // 이펙트 적용
    const preset = presets[tone];
    if (preset) {
      this.effects.reverb.wet.value = preset.reverb;
      this.effects.delay.wet.value = preset.delay;
      this.effects.chorus.wet.value = preset.chorus;
      this.effects.distortion.wet.value = preset.distortion;
    }
  }
  
  playNote(note, duration, time, technique) {
    const guitar = this.guitars[this.currentGuitar];
    
    // 테크닉에 따른 사운드 조정
    let attackTime = 0.005;
    let releaseTime = 0.5;
    let pitch = note;
    
    switch(technique) {
      case 'palm_mute':
        attackTime = 0.001;
        releaseTime = 0.05;
        break;
      case 'bend':
        // 벤딩 효과 (피치 상승)
        pitch = Tone.Frequency(note).transpose(2); // 전음 벤딩
        break;
      case 'vibrato':
        // 비브라토 효과
        this.applyVibrato(guitar, note, duration, time);
        return;
      case 'harmonic':
        // 하모닉스 (옥타브 위)
        pitch = Tone.Frequency(note).transpose(12);
        break;
      case 'slide':
        // 슬라이드 효과
        this.applySlide(guitar, note, duration, time);
        return;
    }
    
    // 노트 재생
    guitar.triggerAttackRelease(
      pitch,
      duration,
      time,
      0.8 // velocity
    );
  }
  
  applyVibrato(guitar, note, duration, time) {
    // 비브라토 LFO
    const vibrato = new Tone.LFO(5, -10, 10).start(time);
    vibrato.connect(guitar.detune);
    
    guitar.triggerAttackRelease(note, duration, time, 0.8);
    
    // 비브라토 종료
    setTimeout(() => {
      vibrato.stop();
      vibrato.dispose();
    }, duration * 1000);
  }
  
  applySlide(guitar, fromNote, toNote, duration, time) {
    // 슬라이드 효과 (피치 램프)
    const rampTime = duration * 0.8;
    
    guitar.triggerAttack(fromNote, time, 0.8);
    guitar.frequency.rampTo(toNote, rampTime, time);
    guitar.triggerRelease(time + duration);
  }
  
  // 코드 스트럼
  strumChord(notes, direction = 'down', spacing = 0.01) {
    const now = Tone.now();
    
    notes.forEach((note, index) => {
      const delay = direction === 'down' ? 
        index * spacing : 
        (notes.length - index - 1) * spacing;
      
      this.playNote(note, '2n', now + delay);
    });
  }
  
  // 아르페지오
  playArpeggio(notes, pattern = 'up', duration = '8n') {
    const patterns = {
      up: [0, 1, 2, 3, 4, 5],
      down: [5, 4, 3, 2, 1, 0],
      upDown: [0, 1, 2, 3, 4, 5, 4, 3, 2, 1],
      alternate: [0, 2, 1, 3, 2, 4, 3, 5]
    };
    
    const sequence = patterns[pattern] || patterns.up;
    const now = Tone.now();
    
    sequence.forEach((noteIndex, seqIndex) => {
      if (notes[noteIndex]) {
        const time = now + (seqIndex * Tone.Time(duration).toSeconds());
        this.playNote(notes[noteIndex], duration, time);
      }
    });
  }
}
```

## 🎮 Play-Along Mode (따라하기 모드)

### 1. 실시간 동기화 시스템

```javascript
// frontend/src/lib/PlayAlongMode.js
class PlayAlongMode {
  constructor(tabRenderer, soundEngine) {
    this.tabRenderer = tabRenderer;
    this.soundEngine = soundEngine;
    this.transport = Tone.Transport;
    
    this.score = null;
    this.currentMeasure = 0;
    this.currentBeat = 0;
    this.isPlaying = false;
    
    this.settings = {
      tempo: 120,
      countIn: true,
      metronome: true,
      loop: {
        enabled: false,
        start: 0,
        end: 0
      },
      speed: 1.0, // 0.25x - 2.0x
      waitForInput: false // 입력 대기 모드
    };
    
    this.tracks = {
      guitar: { volume: 100, muted: false, solo: false },
      bass: { volume: 80, muted: false, solo: false },
      drums: { volume: 90, muted: false, solo: false },
      backing: { volume: 70, muted: false, solo: false }
    };
  }
  
  loadScore(musicXML) {
    // MusicXML 또는 Guitar Pro 파일 로드
    this.score = this.parseMusicXML(musicXML);
    this.setupPlayback();
  }
  
  setupPlayback() {
    // Transport 설정
    this.transport.bpm.value = this.settings.tempo * this.settings.speed;
    this.transport.loop = this.settings.loop.enabled;
    this.transport.loopStart = this.settings.loop.start;
    this.transport.loopEnd = this.settings.loop.end;
    
    // 각 트랙 스케줄링
    this.scheduleTrack('guitar', this.score.tracks.guitar);
    this.scheduleTrack('bass', this.score.tracks.bass);
    this.scheduleTrack('drums', this.score.tracks.drums);
  }
  
  scheduleTrack(trackName, trackData) {
    const track = this.tracks[trackName];
    
    if (track.muted && !track.solo) return;
    
    trackData.notes.forEach(note => {
      this.transport.schedule((time) => {
        // 노트 재생
        if (trackName === 'guitar') {
          this.soundEngine.playNote(
            note.pitch,
            note.duration,
            time,
            note.technique
          );
        }
        
        // 시각적 피드백
        Tone.Draw.schedule(() => {
          this.tabRenderer.highlightCurrentPosition(
            note.measure,
            note.beat
          );
        }, time);
      }, note.time);
    });
  }
  
  play() {
    if (this.settings.countIn) {
      this.playCountIn(() => {
        this.transport.start();
        this.isPlaying = true;
      });
    } else {
      this.transport.start();
      this.isPlaying = true;
    }
  }
  
  playCountIn(callback) {
    const metronome = new Tone.MetalSynth().toDestination();
    let count = 0;
    
    const counter = new Tone.Loop((time) => {
      metronome.triggerAttackRelease('C5', '16n', time);
      count++;
      
      // UI 업데이트
      Tone.Draw.schedule(() => {
        this.updateCountInDisplay(count);
      }, time);
      
      if (count >= 4) {
        counter.stop();
        callback();
      }
    }, '4n');
    
    counter.start();
  }
  
  pause() {
    this.transport.pause();
    this.isPlaying = false;
  }
  
  stop() {
    this.transport.stop();
    this.transport.position = 0;
    this.isPlaying = false;
    this.currentMeasure = 0;
    this.currentBeat = 0;
  }
  
  setSpeed(speed) {
    this.settings.speed = speed;
    this.transport.bpm.value = this.settings.tempo * speed;
  }
  
  setLoop(start, end) {
    this.settings.loop = {
      enabled: true,
      start: start,
      end: end
    };
    
    this.transport.loop = true;
    this.transport.loopStart = start;
    this.transport.loopEnd = end;
  }
  
  // Speed Trainer - 점진적 속도 증가
  startSpeedTrainer(startSpeed = 0.5, endSpeed = 1.0, increment = 0.1) {
    let currentSpeed = startSpeed;
    
    this.speedTrainerInterval = setInterval(() => {
      if (currentSpeed < endSpeed) {
        currentSpeed += increment;
        this.setSpeed(currentSpeed);
        
        console.log(`Speed: ${Math.round(currentSpeed * 100)}%`);
      } else {
        clearInterval(this.speedTrainerInterval);
        console.log('Speed training complete!');
      }
    }, 30000); // 30초마다 속도 증가
  }
  
  // 입력 대기 모드 - 사용자가 올바른 노트를 연주할 때까지 대기
  enableWaitMode() {
    this.settings.waitForInput = true;
    
    // MIDI 또는 오디오 입력 리스너
    this.inputListener = (inputNote) => {
      const expectedNote = this.getCurrentExpectedNote();
      
      if (this.compareNotes(inputNote, expectedNote)) {
        // 올바른 노트 - 다음으로 진행
        this.advanceToNextNote();
      } else {
        // 잘못된 노트 - 피드백 제공
        this.showIncorrectNoteFeedback(inputNote, expectedNote);
      }
    };
  }
  
  // 멀티트랙 믹서 컨트롤
  setTrackVolume(trackName, volume) {
    this.tracks[trackName].volume = volume;
    // 실제 볼륨 적용
    const gain = new Tone.Gain(volume / 100).toDestination();
  }
  
  muteTrack(trackName) {
    this.tracks[trackName].muted = true;
  }
  
  soloTrack(trackName) {
    // 다른 모든 트랙 뮤트
    Object.keys(this.tracks).forEach(track => {
      this.tracks[track].muted = track !== trackName;
    });
    this.tracks[trackName].solo = true;
  }
}
```

## 🎼 Advanced Features

### 1. AI 자동 편곡 시스템

```javascript
class AutoArranger {
  constructor() {
    this.styles = ['rock', 'jazz', 'blues', 'metal', 'acoustic'];
  }
  
  arrangeForStyle(melody, style) {
    switch(style) {
      case 'rock':
        return this.rockArrangement(melody);
      case 'jazz':
        return this.jazzArrangement(melody);
      case 'metal':
        return this.metalArrangement(melody);
      default:
        return this.basicArrangement(melody);
    }
  }
  
  rockArrangement(melody) {
    return {
      guitar: this.addPowerChords(melody),
      bass: this.createBassLine(melody, 'root-fifth'),
      drums: this.createDrumPattern('rock-beat')
    };
  }
  
  jazzArrangement(melody) {
    return {
      guitar: this.addJazzChords(melody),
      bass: this.createWalkingBass(melody),
      drums: this.createDrumPattern('jazz-swing')
    };
  }
}
```

### 2. 실시간 피드백 시스템

```javascript
class RealTimeFeedback {
  constructor() {
    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.pitchDetector = new PitchDetector();
  }
  
  async startListening() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = this.audioContext.createMediaStreamSource(stream);
    source.connect(this.analyser);
    
    this.analyse();
  }
  
  analyse() {
    requestAnimationFrame(() => this.analyse());
    
    const pitch = this.pitchDetector.detect(this.analyser);
    const expectedPitch = this.getCurrentExpectedPitch();
    
    const accuracy = this.calculateAccuracy(pitch, expectedPitch);
    this.updateFeedbackUI(accuracy);
    
    if (accuracy > 0.9) {
      this.showPositiveFeedback();
    } else if (accuracy < 0.5) {
      this.showCorrectionHints();
    }
  }
}
```

## 🚀 구현 우선순위

### Phase 1 (즉시 구현)
1. VexFlow 기본 Tab/악보 렌더링
2. Tone.js 기타 사운드 재생
3. 기본 Play/Pause/Stop 컨트롤

### Phase 2 (1-2주)
1. 멀티트랙 재생 시스템
2. 속도 조절 및 구간 반복
3. 자동 스크롤 및 하이라이트

### Phase 3 (3-4주)
1. 고품질 기타 샘플 라이브러리
2. 이펙트 체인 (앰프/이펙터)
3. 실시간 피드백 시스템

### Phase 4 (추가 기능)
1. MIDI 입력 지원
2. 오디오 입력 분석
3. AI 자동 편곡

---

## 💡 핵심 차별화 포인트

1. **고품질 사운드**: 실제 기타 샘플 기반, 다양한 톤
2. **완벽한 동기화**: 악보와 사운드의 정확한 동기화
3. **교육적 기능**: 속도 조절, 구간 반복, 실시간 피드백
4. **전문가 수준 UI**: Guitar Pro 수준의 악보 표시

이제 Guitar Pro와 Ultimate Guitar의 장점을 결합한 **차세대 기타 학습 플랫폼**이 될 준비가 되었습니다!