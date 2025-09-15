// Smart Backing Track Generator
// AI 기반 백킹 트랙 생성 및 관리 시스템

import * as Tone from 'tone';

export interface BackingTrack {
  id: string;
  name: string;
  genre: Genre;
  key: string;
  mode: 'major' | 'minor' | 'dorian' | 'mixolydian' | 'blues';
  tempo: number;
  timeSignature: string;
  duration: number; // seconds
  
  // 트랙 구성
  tracks: {
    drums: DrumPattern;
    bass: BassPattern;
    chords: ChordPattern;
    melody?: MelodyPattern;
  };
  
  // 섹션 구조
  structure: SongSection[];
  
  // 다이나믹 설정
  dynamics: {
    intensity: number; // 0-100
    complexity: number; // 0-100
    swing: number; // 0-100
    humanize: number; // 0-100
  };
}

export type Genre = 
  | 'blues' 
  | 'rock' 
  | 'jazz' 
  | 'pop' 
  | 'funk' 
  | 'metal' 
  | 'country' 
  | 'folk' 
  | 'latin' 
  | 'reggae';

export interface DrumPattern {
  kick: number[][];  // [time, velocity]
  snare: number[][];
  hihat: number[][];
  crash?: number[][];
  ride?: number[][];
  toms?: number[][];
}

export interface BassPattern {
  notes: Array<{
    time: number;
    note: string;
    duration: string;
    velocity: number;
  }>;
  style: 'walking' | 'root' | 'groove' | 'melodic';
}

export interface ChordPattern {
  progression: string[]; // ['C', 'Am', 'F', 'G']
  voicing: 'triads' | 'sevenths' | 'extended' | 'power';
  rhythm: 'whole' | 'half' | 'quarter' | 'eighth' | 'syncopated';
  inversions: boolean;
}

export interface MelodyPattern {
  scale: string;
  motif: number[]; // scale degrees
  rhythm: string[];
  variations: boolean;
}

export interface SongSection {
  name: 'intro' | 'verse' | 'chorus' | 'bridge' | 'solo' | 'outro';
  measures: number;
  repeat: number;
  intensity: number;
}

// 코드 진행 템플릿
const CHORD_PROGRESSIONS: { [key in Genre]: { [mood: string]: string[][] } } = {
  blues: {
    standard: [['I7', 'I7', 'I7', 'I7'], ['IV7', 'IV7', 'I7', 'I7'], ['V7', 'IV7', 'I7', 'V7']],
    minor: [['i7', 'i7', 'i7', 'i7'], ['iv7', 'iv7', 'i7', 'i7'], ['V7', 'iv7', 'i7', 'V7']],
    jazz: [['IM7', 'I7', 'IV7', 'IVm7'], ['I7', 'VI7', 'ii7', 'V7'], ['IM7', 'VI7', 'ii7', 'V7']]
  },
  rock: {
    power: [['I', 'IV', 'V', 'IV']],
    classic: [['I', 'V', 'vi', 'IV']],
    hard: [['i', 'bVII', 'IV', 'i']],
    progressive: [['I', 'bVII', 'IV', 'I'], ['vi', 'IV', 'I', 'V']]
  },
  jazz: {
    standard: [['IM7', 'vi7', 'ii7', 'V7']],
    modal: [['im7', 'im7', 'im7', 'im7']],
    bebop: [['IM7', 'biiidim7', 'ii7', 'V7'], ['iii7', 'VI7', 'ii7', 'V7']]
  },
  pop: {
    catchy: [['I', 'V', 'vi', 'IV']],
    emotional: [['vi', 'IV', 'I', 'V']],
    uplifting: [['I', 'IV', 'vi', 'V']]
  },
  funk: {
    groove: [['i7', 'i7', 'i7', 'i7']],
    classic: [['I7', 'I7', 'IV7', 'I7']],
    modern: [['i9', 'i9', 'iv9', 'i9']]
  },
  metal: {
    heavy: [['i', 'bII', 'i', 'bVII']],
    thrash: [['i', 'i', 'bVI', 'bVII']],
    progressive: [['i', 'bVII', 'bVI', 'V'], ['i', 'iv', 'bVII', 'i']]
  },
  country: {
    traditional: [['I', 'IV', 'I', 'V']],
    modern: [['I', 'IV', 'vi', 'V']],
    outlaw: [['I', 'bVII', 'IV', 'I']]
  },
  folk: {
    traditional: [['I', 'IV', 'I', 'V']],
    modern: [['I', 'vi', 'IV', 'V']],
    celtic: [['I', 'bVII', 'I', 'IV']]
  },
  latin: {
    salsa: [['i', 'iv', 'V7', 'i']],
    bossa: [['IM7', 'ii7', 'V7', 'IM7']],
    rumba: [['I', 'IV', 'V', 'I']]
  },
  reggae: {
    roots: [['I', 'V', 'vi', 'IV']],
    dub: [['i', 'i', 'iv', 'v']],
    modern: [['I', 'iii', 'vi', 'V']]
  }
};

// 드럼 패턴 템플릿
const DRUM_PATTERNS: { [key in Genre]: DrumPattern } = {
  blues: {
    kick: [[0, 0.8], [2, 0.8]],
    snare: [[1, 0.7], [3, 0.7]],
    hihat: [[0, 0.5], [0.5, 0.3], [1, 0.5], [1.5, 0.3], [2, 0.5], [2.5, 0.3], [3, 0.5], [3.5, 0.3]]
  },
  rock: {
    kick: [[0, 0.9], [2, 0.9]],
    snare: [[1, 0.8], [3, 0.8]],
    hihat: [[0, 0.6], [0.5, 0.6], [1, 0.6], [1.5, 0.6], [2, 0.6], [2.5, 0.6], [3, 0.6], [3.5, 0.6]],
    crash: [[0, 0.7]]
  },
  jazz: {
    kick: [[0, 0.6]],
    snare: [[2, 0.4]],
    hihat: [],
    ride: [[0, 0.5], [1, 0.4], [2, 0.5], [3, 0.4]]
  },
  pop: {
    kick: [[0, 0.8], [2, 0.8]],
    snare: [[1, 0.7], [3, 0.7]],
    hihat: [[0.5, 0.4], [1.5, 0.4], [2.5, 0.4], [3.5, 0.4]]
  },
  funk: {
    kick: [[0, 0.9], [1.75, 0.6], [2, 0.8]],
    snare: [[1, 0.8], [3, 0.8], [3.5, 0.4]],
    hihat: [[0, 0.6], [0.25, 0.4], [0.5, 0.6], [0.75, 0.4], [1, 0.6], [1.25, 0.4], [1.5, 0.6], [1.75, 0.4],
             [2, 0.6], [2.25, 0.4], [2.5, 0.6], [2.75, 0.4], [3, 0.6], [3.25, 0.4], [3.5, 0.6], [3.75, 0.4]]
  },
  metal: {
    kick: [[0, 1], [0.5, 0.9], [2, 1], [2.5, 0.9]],
    snare: [[1, 0.9], [3, 0.9]],
    hihat: [],
    crash: [[0, 0.8]],
    ride: [[0, 0.7], [0.25, 0.7], [0.5, 0.7], [0.75, 0.7]]
  },
  country: {
    kick: [[0, 0.8], [2, 0.8]],
    snare: [[1, 0.6], [3, 0.6]],
    hihat: [[0, 0.5], [1, 0.5], [2, 0.5], [3, 0.5]]
  },
  folk: {
    kick: [[0, 0.7]],
    snare: [[2, 0.5]],
    hihat: [[0, 0.4], [1, 0.4], [2, 0.4], [3, 0.4]]
  },
  latin: {
    kick: [[0, 0.8], [1.5, 0.6], [2.5, 0.8]],
    snare: [[1, 0.6], [2, 0.7], [3, 0.6]],
    hihat: [[0, 0.5], [0.5, 0.5], [1, 0.5], [1.5, 0.5], [2, 0.5], [2.5, 0.5], [3, 0.5], [3.5, 0.5]]
  },
  reggae: {
    kick: [[0, 0.9], [2.5, 0.9]],
    snare: [[2, 0.8]],
    hihat: [[1, 0.6], [3, 0.6]]
  }
};

class BackingTrackGenerator {
  private synths: {
    drums: Tone.Sampler | null;
    bass: Tone.Synth | null;
    chords: Tone.PolySynth | null;
    melody: Tone.Synth | null;
  } = {
    drums: null,
    bass: null,
    chords: null,
    melody: null
  };
  
  private transport: typeof Tone.Transport;
  private currentTrack: BackingTrack | null = null;
  private isPlaying = false;
  
  constructor() {
    this.transport = Tone.Transport;
    this.initializeSynths();
  }
  
  private async initializeSynths() {
    // 드럼 샘플러
    this.synths.drums = new Tone.Sampler({
      urls: {
        C1: 'kick.wav',
        D1: 'snare.wav',
        F1: 'hihat.wav',
        G1: 'crash.wav',
        A1: 'ride.wav'
      },
      baseUrl: '/samples/drums/',
      onload: () => console.log('Drums loaded')
    }).toDestination();
    
    // 베이스 신스
    this.synths.bass = new Tone.Synth({
      oscillator: { type: 'sawtooth' },
      envelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.3,
        release: 0.5
      }
    }).toDestination();
    
    // 코드 신스 (폴리포닉)
    this.synths.chords = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.3,
        release: 0.9
      }
    }).toDestination();
    
    // 멜로디 신스
    this.synths.melody = new Tone.Synth({
      oscillator: { type: 'square' },
      envelope: {
        attack: 0.005,
        decay: 0.1,
        sustain: 0.3,
        release: 0.1
      }
    }).toDestination();
    
    // 이펙트 체인 설정
    this.setupEffects();
  }
  
  private setupEffects() {
    // 리버브
    const reverb = new Tone.Reverb(2).toDestination();
    reverb.wet.value = 0.2;
    
    // 딜레이
    const delay = new Tone.FeedbackDelay('8n', 0.3).toDestination();
    delay.wet.value = 0.1;
    
    // 컴프레서
    const compressor = new Tone.Compressor(-30, 3).toDestination();
    
    // 연결
    if (this.synths.chords) this.synths.chords.connect(reverb);
    if (this.synths.melody) this.synths.melody.connect(delay);
  }
  
  // 백킹 트랙 생성
  async generateTrack(params: {
    genre: Genre;
    key: string;
    tempo: number;
    mood?: string;
    duration?: number;
    complexity?: number;
  }): Promise<BackingTrack> {
    const {
      genre,
      key,
      tempo,
      mood = 'standard',
      duration = 120,
      complexity = 50
    } = params;
    
    // 기본 트랙 구조 생성
    const track: BackingTrack = {
      id: this.generateTrackId(),
      name: `${genre} in ${key}`,
      genre,
      key,
      mode: this.detectMode(key),
      tempo,
      timeSignature: '4/4',
      duration,
      tracks: {
        drums: this.generateDrumPattern(genre, complexity),
        bass: this.generateBassPattern(genre, key, complexity),
        chords: this.generateChordPattern(genre, key, mood, complexity)
      },
      structure: this.generateSongStructure(duration, genre),
      dynamics: {
        intensity: 50 + (complexity / 2),
        complexity,
        swing: genre === 'jazz' ? 65 : 0,
        humanize: 20
      }
    };
    
    // 멜로디 추가 (옵션)
    if (complexity > 70) {
      track.tracks.melody = this.generateMelodyPattern(key, genre);
    }
    
    this.currentTrack = track;
    return track;
  }
  
  // 드럼 패턴 생성
  private generateDrumPattern(genre: Genre, complexity: number): DrumPattern {
    const basePattern = DRUM_PATTERNS[genre];
    
    if (complexity <= 30) {
      // 간단한 패턴
      return {
        kick: basePattern.kick.filter((_, i) => i % 2 === 0),
        snare: basePattern.snare,
        hihat: basePattern.hihat.filter((_, i) => i % 2 === 0)
      };
    } else if (complexity >= 70) {
      // 복잡한 패턴 (변형 추가)
      return {
        ...basePattern,
        kick: this.addVariations(basePattern.kick, 0.2),
        snare: this.addGhostNotes(basePattern.snare),
        hihat: this.addHihatVariations(basePattern.hihat)
      };
    }
    
    return basePattern;
  }
  
  // 베이스 패턴 생성
  private generateBassPattern(genre: Genre, key: string, complexity: number): BassPattern {
    const style = this.getBassStyle(genre);
    const notes: BassPattern['notes'] = [];
    
    // 루트-5도 패턴 (간단)
    if (complexity <= 30) {
      notes.push(
        { time: 0, note: key + '2', duration: '4n', velocity: 0.8 },
        { time: 2, note: this.getInterval(key, 5) + '2', duration: '4n', velocity: 0.7 }
      );
    } 
    // 워킹 베이스 (복잡)
    else if (style === 'walking' || complexity >= 70) {
      const scale = this.getScale(key, genre);
      for (let i = 0; i < 4; i++) {
        notes.push({
          time: i,
          note: scale[Math.floor(Math.random() * scale.length)] + '2',
          duration: '4n',
          velocity: 0.6 + Math.random() * 0.2
        });
      }
    }
    // 그루브 베이스 (중간)
    else {
      notes.push(
        { time: 0, note: key + '2', duration: '8n', velocity: 0.8 },
        { time: 0.5, note: key + '2', duration: '8n', velocity: 0.6 },
        { time: 1.5, note: this.getInterval(key, 5) + '2', duration: '8n', velocity: 0.7 },
        { time: 2, note: key + '2', duration: '4n', velocity: 0.8 },
        { time: 3, note: this.getInterval(key, 3) + '2', duration: '8n', velocity: 0.6 },
        { time: 3.5, note: this.getInterval(key, 5) + '2', duration: '8n', velocity: 0.7 }
      );
    }
    
    return { notes, style };
  }
  
  // 코드 패턴 생성
  private generateChordPattern(genre: Genre, key: string, mood: string, complexity: number): ChordPattern {
    const progressions = CHORD_PROGRESSIONS[genre];
    const progression = progressions[mood] || progressions['standard'] || [['I', 'IV', 'V', 'I']];
    
    // 코드 진행을 실제 코드로 변환
    const chords = progression[0].map(degree => this.degreeToChord(degree, key));
    
    return {
      progression: chords,
      voicing: complexity > 60 ? 'extended' : complexity > 30 ? 'sevenths' : 'triads',
      rhythm: complexity > 70 ? 'syncopated' : complexity > 40 ? 'eighth' : 'quarter',
      inversions: complexity > 50
    };
  }
  
  // 멜로디 패턴 생성
  private generateMelodyPattern(key: string, genre: Genre): MelodyPattern {
    const scale = this.getScale(key, genre);
    const motif = this.generateMotif(genre);
    
    return {
      scale: scale.join(' '),
      motif,
      rhythm: ['8n', '8n', '4n', '8n', '8n', '2n'],
      variations: true
    };
  }
  
  // 곡 구조 생성
  private generateSongStructure(duration: number, genre: Genre): SongSection[] {
    const measuresPerMinute = 30; // approximate
    const totalMeasures = Math.floor((duration / 60) * measuresPerMinute);
    
    const structure: SongSection[] = [
      { name: 'intro', measures: 4, repeat: 1, intensity: 30 },
      { name: 'verse', measures: 8, repeat: 2, intensity: 50 },
      { name: 'chorus', measures: 8, repeat: 2, intensity: 80 },
      { name: 'verse', measures: 8, repeat: 1, intensity: 60 },
      { name: 'chorus', measures: 8, repeat: 2, intensity: 90 },
      { name: 'bridge', measures: 4, repeat: 1, intensity: 40 },
      { name: 'solo', measures: 8, repeat: 1, intensity: 100 },
      { name: 'chorus', measures: 8, repeat: 2, intensity: 95 },
      { name: 'outro', measures: 4, repeat: 1, intensity: 20 }
    ];
    
    // 길이에 맞게 조정
    const currentMeasures = structure.reduce((sum, s) => sum + s.measures * s.repeat, 0);
    if (currentMeasures > totalMeasures) {
      // 섹션 줄이기
      return structure.slice(0, 5);
    }
    
    return structure;
  }
  
  // 재생 제어
  async play() {
    if (!this.currentTrack) return;
    
    await Tone.start();
    
    // BPM 설정
    this.transport.bpm.value = this.currentTrack.tempo;
    
    // 트랙 스케줄링
    this.scheduleDrums();
    this.scheduleBass();
    this.scheduleChords();
    if (this.currentTrack.tracks.melody) {
      this.scheduleMelody();
    }
    
    // 재생 시작
    this.transport.start();
    this.isPlaying = true;
  }
  
  stop() {
    this.transport.stop();
    this.transport.cancel();
    this.isPlaying = false;
  }
  
  pause() {
    this.transport.pause();
    this.isPlaying = false;
  }
  
  resume() {
    this.transport.start();
    this.isPlaying = true;
  }
  
  // 템포 조절
  setTempo(bpm: number) {
    this.transport.bpm.value = bpm;
    if (this.currentTrack) {
      this.currentTrack.tempo = bpm;
    }
  }
  
  // 키 변경
  async transpose(semitones: number) {
    if (!this.currentTrack) return;
    
    // 현재 재생 중이면 정지
    const wasPlaying = this.isPlaying;
    if (wasPlaying) this.stop();
    
    // 키 변경
    this.currentTrack.key = this.transposeNote(this.currentTrack.key, semitones);
    
    // 패턴 재생성
    this.currentTrack.tracks.bass = this.generateBassPattern(
      this.currentTrack.genre,
      this.currentTrack.key,
      this.currentTrack.dynamics.complexity
    );
    
    this.currentTrack.tracks.chords = this.generateChordPattern(
      this.currentTrack.genre,
      this.currentTrack.key,
      'standard',
      this.currentTrack.dynamics.complexity
    );
    
    // 재생 재개
    if (wasPlaying) await this.play();
  }
  
  // 믹싱 조절
  setTrackVolume(track: 'drums' | 'bass' | 'chords' | 'melody', volume: number) {
    const synth = this.synths[track];
    if (synth && 'volume' in synth) {
      synth.volume.value = volume;
    }
  }
  
  // 트랙 뮤트/언뮤트
  toggleTrack(track: 'drums' | 'bass' | 'chords' | 'melody') {
    const synth = this.synths[track];
    if (synth && 'mute' in synth) {
      synth.mute = !synth.mute;
    }
  }
  
  // 스케줄링 함수들
  private scheduleDrums() {
    if (!this.currentTrack || !this.synths.drums) return;
    
    const pattern = this.currentTrack.tracks.drums;
    const loopLength = '1m';
    
    // 킥 드럼
    pattern.kick.forEach(([time, velocity]) => {
      this.transport.scheduleRepeat((t) => {
        this.synths.drums?.triggerAttackRelease('C1', '8n', t, velocity);
      }, loopLength, time);
    });
    
    // 스네어
    pattern.snare.forEach(([time, velocity]) => {
      this.transport.scheduleRepeat((t) => {
        this.synths.drums?.triggerAttackRelease('D1', '8n', t, velocity);
      }, loopLength, time);
    });
    
    // 하이햇
    pattern.hihat.forEach(([time, velocity]) => {
      this.transport.scheduleRepeat((t) => {
        this.synths.drums?.triggerAttackRelease('F1', '16n', t, velocity);
      }, loopLength, time);
    });
  }
  
  private scheduleBass() {
    if (!this.currentTrack || !this.synths.bass) return;
    
    const pattern = this.currentTrack.tracks.bass;
    
    pattern.notes.forEach(note => {
      this.transport.scheduleRepeat((t) => {
        this.synths.bass?.triggerAttackRelease(
          note.note,
          note.duration,
          t,
          note.velocity
        );
      }, '1m', note.time);
    });
  }
  
  private scheduleChords() {
    if (!this.currentTrack || !this.synths.chords) return;
    
    const pattern = this.currentTrack.tracks.chords;
    const chordNotes = pattern.progression.map(chord => this.chordToNotes(chord));
    
    chordNotes.forEach((notes, i) => {
      const time = i; // 각 코드는 1박자
      this.transport.scheduleRepeat((t) => {
        this.synths.chords?.triggerAttackRelease(
          notes,
          pattern.rhythm,
          t,
          0.5
        );
      }, '1m', time);
    });
  }
  
  private scheduleMelody() {
    if (!this.currentTrack || !this.synths.melody) return;
    
    const pattern = this.currentTrack.tracks.melody!;
    const scale = pattern.scale.split(' ');
    
    pattern.motif.forEach((degree, i) => {
      const note = scale[degree % scale.length] + '4';
      const time = i * 0.5; // 8분음표 간격
      
      this.transport.scheduleRepeat((t) => {
        this.synths.melody?.triggerAttackRelease(
          note,
          pattern.rhythm[i % pattern.rhythm.length],
          t,
          0.6
        );
      }, '2m', time);
    });
  }
  
  // Helper 함수들
  private generateTrackId(): string {
    return `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private detectMode(key: string): BackingTrack['mode'] {
    // 간단한 모드 감지 (확장 가능)
    return key.includes('m') ? 'minor' : 'major';
  }
  
  private getBassStyle(genre: Genre): BassPattern['style'] {
    const styles: { [key in Genre]: BassPattern['style'] } = {
      blues: 'walking',
      rock: 'root',
      jazz: 'walking',
      pop: 'groove',
      funk: 'groove',
      metal: 'root',
      country: 'root',
      folk: 'root',
      latin: 'groove',
      reggae: 'groove'
    };
    return styles[genre];
  }
  
  private getScale(key: string, genre: Genre): string[] {
    // 장르별 스케일 선택
    const scales: { [key: string]: string[] } = {
      major: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
      minor: ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb'],
      blues: ['C', 'Eb', 'F', 'Gb', 'G', 'Bb'],
      pentatonic: ['C', 'D', 'E', 'G', 'A']
    };
    
    let scaleType = 'major';
    if (genre === 'blues') scaleType = 'blues';
    else if (genre === 'jazz') scaleType = 'minor';
    else if (key.includes('m')) scaleType = 'minor';
    
    // 키에 맞게 전조
    return this.transposeScale(scales[scaleType], key);
  }
  
  private transposeScale(scale: string[], targetKey: string): string[] {
    // 간단한 전조 로직 (확장 필요)
    const keyMap: { [key: string]: number } = {
      'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11
    };
    
    const baseKey = targetKey.replace(/[#bm]/g, '');
    const offset = keyMap[baseKey] || 0;
    
    return scale.map(note => this.transposeNote(note, offset));
  }
  
  private transposeNote(note: string, semitones: number): string {
    // 음 전조 로직
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = note.match(/\d+/)?.[0] || '';
    const noteName = note.replace(/\d+/, '');
    
    let index = notes.indexOf(noteName);
    if (index === -1) return note;
    
    index = (index + semitones + 12) % 12;
    return notes[index] + octave;
  }
  
  private getInterval(root: string, interval: number): string {
    const semitones = {
      1: 0, 2: 2, 3: 4, 4: 5, 5: 7, 6: 9, 7: 11, 8: 12
    }[interval] || 0;
    
    return this.transposeNote(root, semitones);
  }
  
  private degreeToChord(degree: string, key: string): string {
    // 로마 숫자를 실제 코드로 변환
    const degreeMap: { [key: string]: number } = {
      'I': 0, 'II': 2, 'III': 4, 'IV': 5, 'V': 7, 'VI': 9, 'VII': 11,
      'i': 0, 'ii': 2, 'iii': 4, 'iv': 5, 'v': 7, 'vi': 9, 'vii': 11
    };
    
    const isMinor = degree[0] === degree[0].toLowerCase();
    const romanNumeral = degree.replace(/[^IVXivi]/g, '').toUpperCase();
    const modifier = degree.replace(/[IVXivi]/g, '');
    
    const semitones = degreeMap[romanNumeral] || 0;
    const chordRoot = this.transposeNote(key, semitones);
    
    return chordRoot + (isMinor ? 'm' : '') + modifier;
  }
  
  private chordToNotes(chord: string): string[] {
    // 코드를 구성 음으로 변환
    const root = chord.match(/[A-G][#b]?/)?.[0] || 'C';
    const quality = chord.includes('m') ? 'minor' : 'major';
    const extension = chord.match(/\d+/)?.[0];
    
    const notes = [root + '3'];
    
    // 3도
    notes.push(this.getInterval(root, quality === 'major' ? 3 : 3));
    
    // 5도
    notes.push(this.getInterval(root, 5) + '3');
    
    // 7도 (있으면)
    if (extension === '7') {
      notes.push(this.getInterval(root, 7) + '3');
    }
    
    return notes;
  }
  
  private generateMotif(genre: Genre): number[] {
    // 장르별 모티프 생성
    const motifs: { [key in Genre]: number[] } = {
      blues: [0, 2, 3, 4, 3, 2, 0],
      rock: [0, 0, 4, 4, 5, 5, 4],
      jazz: [0, 2, 4, 5, 7, 5, 4, 2],
      pop: [0, 2, 4, 2, 0, 4, 2, 0],
      funk: [0, 0, 3, 0, 5, 0, 3, 0],
      metal: [0, 1, 0, 3, 0, 1, 0],
      country: [0, 2, 4, 5, 4, 2, 0],
      folk: [0, 2, 4, 2, 0],
      latin: [0, 2, 3, 5, 3, 2, 0],
      reggae: [0, 3, 5, 3, 0]
    };
    
    return motifs[genre] || motifs.pop;
  }
  
  private addVariations(pattern: number[][], probability: number): number[][] {
    return pattern.map(([time, velocity]) => {
      if (Math.random() < probability) {
        // 약간의 타이밍 변화
        time += (Math.random() - 0.5) * 0.1;
        // 약간의 벨로시티 변화
        velocity *= (0.8 + Math.random() * 0.4);
      }
      return [time, velocity];
    });
  }
  
  private addGhostNotes(pattern: number[][]): number[][] {
    const ghost: number[][] = [];
    pattern.forEach(([time, velocity]) => {
      ghost.push([time, velocity]);
      // 고스트 노트 추가
      if (Math.random() < 0.3) {
        ghost.push([time - 0.125, velocity * 0.3]);
      }
    });
    return ghost;
  }
  
  private addHihatVariations(pattern: number[][]): number[][] {
    return pattern.map(([time, velocity], i) => {
      // 오픈 하이햇 변형
      if (i % 8 === 7 && Math.random() < 0.5) {
        velocity *= 1.2;
      }
      return [time, velocity];
    });
  }
  
  // 트랙 내보내기
  async exportTrack(format: 'wav' | 'mp3' = 'wav'): Promise<Blob> {
    if (!this.currentTrack) throw new Error('No track to export');
    
    // Tone.js Recorder 사용
    const recorder = new Tone.Recorder();
    
    // 모든 신스를 레코더에 연결
    Object.values(this.synths).forEach(synth => {
      if (synth) synth.connect(recorder);
    });
    
    // 녹음 시작
    recorder.start();
    await this.play();
    
    // 트랙 길이만큼 대기
    await new Promise(resolve => 
      setTimeout(resolve, this.currentTrack!.duration * 1000)
    );
    
    // 녹음 중지
    this.stop();
    const recording = await recorder.stop();
    
    // Blob 반환
    return recording as Blob;
  }
  
  // 트랙 저장
  saveTrack(track: BackingTrack): void {
    const tracks = this.getSavedTracks();
    tracks.push(track);
    localStorage.setItem('backing_tracks', JSON.stringify(tracks));
  }
  
  // 저장된 트랙 불러오기
  getSavedTracks(): BackingTrack[] {
    const stored = localStorage.getItem('backing_tracks');
    return stored ? JSON.parse(stored) : [];
  }
  
  // 트랙 로드
  loadTrack(trackId: string): BackingTrack | null {
    const tracks = this.getSavedTracks();
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      this.currentTrack = track;
    }
    return track;
  }
}

// Export singleton instance
export const backingTrackGenerator = new BackingTrackGenerator();

// Export for use in components
export default backingTrackGenerator;