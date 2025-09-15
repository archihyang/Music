<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { writable } from 'svelte/store';
  import { 
    Mic, 
    MicOff, 
    Activity,
    Target,
    TrendingUp,
    AlertCircle,
    CheckCircle,
    XCircle,
    Gauge,
    Music,
    Volume2
  } from 'lucide-svelte';
  
  // 오디오 분석 상태
  interface AudioAnalysisState {
    isListening: boolean;
    currentPitch: number;
    currentNote: string;
    targetNote: string;
    cents: number;
    accuracy: number;
    volume: number;
    clarity: number;
    timing: {
      offset: number;
      classification: 'early' | 'onTime' | 'late';
    };
    technique: {
      detected: string;
      confidence: number;
    };
  }
  
  // Props
  export let targetNotes: string[] = [];
  export let tempo: number = 120;
  export let enableVisualFeedback = true;
  export let enableHapticFeedback = false;
  export let sensitivity = 0.5;
  
  // 상태
  let audioContext: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let microphone: MediaStreamAudioSourceNode | null = null;
  let stream: MediaStream | null = null;
  let pitchDetector: any = null;
  let animationFrame: number;
  
  let state: AudioAnalysisState = {
    isListening: false,
    currentPitch: 0,
    currentNote: '',
    targetNote: '',
    cents: 0,
    accuracy: 0,
    volume: 0,
    clarity: 0,
    timing: {
      offset: 0,
      classification: 'onTime'
    },
    technique: {
      detected: '',
      confidence: 0
    }
  };
  
  // 음계 주파수 매핑
  const noteFrequencies: { [key: string]: number } = {
    'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41, 'F2': 87.31,
    'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
    'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61,
    'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
    'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23,
    'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
    'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46,
    'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
    'C6': 1046.50
  };
  
  // 오디오 컨텍스트 초기화
  async function initializeAudio() {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // 마이크 접근 권한 요청
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });
      
      // 오디오 노드 설정
      microphone = audioContext.createMediaStreamSource(stream);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0.8;
      
      // 연결
      microphone.connect(analyser);
      
      // Pitch Detection 라이브러리 초기화 (ML5.js 또는 Aubio.js)
      await initializePitchDetection();
      
      state.isListening = true;
      startAnalysis();
      
    } catch (error) {
      console.error('Audio initialization failed:', error);
      state.isListening = false;
    }
  }
  
  // 피치 감지 초기화
  async function initializePitchDetection() {
    // Autocorrelation 기반 피치 감지 구현
    // 또는 ML5.js pitch detection 사용
    pitchDetector = {
      detect: (buffer: Float32Array) => {
        return autocorrelate(buffer, audioContext!.sampleRate);
      }
    };
  }
  
  // Autocorrelation 알고리즘
  function autocorrelate(buffer: Float32Array, sampleRate: number): number {
    const SIZE = buffer.length;
    const MAX_SAMPLES = Math.floor(SIZE / 2);
    let best_offset = -1;
    let best_correlation = 0;
    let rms = 0;
    
    // RMS 계산
    for (let i = 0; i < SIZE; i++) {
      const val = buffer[i];
      rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);
    
    // 무음 감지
    if (rms < 0.01) return -1;
    
    // Autocorrelation
    let lastCorrelation = 1;
    for (let offset = 0; offset < MAX_SAMPLES; offset++) {
      let correlation = 0;
      
      for (let i = 0; i < MAX_SAMPLES; i++) {
        correlation += Math.abs((buffer[i]) - (buffer[i + offset]));
      }
      
      correlation = 1 - (correlation / MAX_SAMPLES);
      
      if (correlation > 0.9 && correlation > lastCorrelation) {
        let shift = 0;
        if (offset + 1 < SIZE) {
          const s0 = correlation;
          const s1 = 1 - (Math.abs(buffer[0] - buffer[offset + 1]) / MAX_SAMPLES);
          const s2 = offset > 0 ? 1 - (Math.abs(buffer[0] - buffer[offset - 1]) / MAX_SAMPLES) : 0;
          shift = (s2 - s1) / (s2 - 2 * s0 + s1);
        }
        
        best_offset = offset + shift;
        best_correlation = correlation;
        break;
      }
      
      lastCorrelation = correlation;
    }
    
    if (best_correlation > 0.01) {
      return sampleRate / best_offset;
    }
    
    return -1;
  }
  
  // 주파수를 음계로 변환
  function frequencyToNote(frequency: number): { note: string, cents: number } {
    if (frequency <= 0) return { note: '', cents: 0 };
    
    const A4 = 440;
    const semitones = 12 * Math.log2(frequency / A4);
    const nearestSemitone = Math.round(semitones);
    const cents = (semitones - nearestSemitone) * 100;
    
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor((nearestSemitone + 57) / 12);
    const noteName = noteNames[(nearestSemitone + 69) % 12];
    
    return {
      note: noteName + octave,
      cents: Math.round(cents)
    };
  }
  
  // 정확도 계산
  function calculateAccuracy(currentFreq: number, targetNote: string): number {
    if (!targetNote || !noteFrequencies[targetNote]) return 0;
    
    const targetFreq = noteFrequencies[targetNote];
    const centsDiff = 1200 * Math.log2(currentFreq / targetFreq);
    
    // ±50 cents 범위에서 정확도 계산
    const accuracy = Math.max(0, 100 - Math.abs(centsDiff) * 2);
    return Math.round(accuracy);
  }
  
  // 테크닉 감지
  function detectTechnique(buffer: Float32Array): { technique: string, confidence: number } {
    // 간단한 테크닉 감지 로직
    // 실제로는 머신러닝 모델 사용 권장
    
    const energy = buffer.reduce((sum, val) => sum + Math.abs(val), 0) / buffer.length;
    const variance = buffer.reduce((sum, val) => sum + Math.pow(val - energy, 2), 0) / buffer.length;
    
    if (variance > 0.1) {
      return { technique: 'vibrato', confidence: 70 };
    } else if (energy > 0.5) {
      return { technique: 'bend', confidence: 60 };
    } else {
      return { technique: 'normal', confidence: 90 };
    }
  }
  
  // 실시간 분석 시작
  function startAnalysis() {
    if (!analyser || !audioContext) return;
    
    const bufferLength = analyser.fftSize;
    const dataArray = new Float32Array(bufferLength);
    const volumeArray = new Uint8Array(analyser.frequencyBinCount);
    
    function analyze() {
      if (!state.isListening) return;
      
      animationFrame = requestAnimationFrame(analyze);
      
      // 시간 도메인 데이터 가져오기
      analyser!.getFloatTimeDomainData(dataArray);
      analyser!.getByteFrequencyData(volumeArray);
      
      // 볼륨 계산
      const volume = volumeArray.reduce((sum, val) => sum + val, 0) / volumeArray.length;
      state.volume = Math.round(volume / 255 * 100);
      
      // 피치 감지
      const pitch = pitchDetector.detect(dataArray);
      
      if (pitch > 0) {
        state.currentPitch = pitch;
        const noteInfo = frequencyToNote(pitch);
        state.currentNote = noteInfo.note;
        state.cents = noteInfo.cents;
        
        // 타겟 노트와 비교
        if (targetNotes.length > 0) {
          const currentTargetIndex = Math.floor(Date.now() / (60000 / tempo)) % targetNotes.length;
          state.targetNote = targetNotes[currentTargetIndex];
          state.accuracy = calculateAccuracy(pitch, state.targetNote);
        }
        
        // 테크닉 감지
        const technique = detectTechnique(dataArray);
        state.technique = technique;
        
        // 명료도 계산 (신호 대 잡음비)
        state.clarity = Math.min(100, state.volume * 1.5);
        
        // 시각적 피드백
        if (enableVisualFeedback) {
          updateVisualFeedback();
        }
        
        // 햅틱 피드백 (모바일)
        if (enableHapticFeedback && state.accuracy > 90) {
          navigator.vibrate?.(50);
        }
      }
    }
    
    analyze();
  }
  
  // 시각적 피드백 업데이트
  function updateVisualFeedback() {
    // CSS 변수 업데이트로 시각적 피드백
    document.documentElement.style.setProperty('--pitch-accuracy', `${state.accuracy}%`);
    document.documentElement.style.setProperty('--pitch-cents', `${state.cents}deg`);
  }
  
  // 오디오 중지
  function stopAudio() {
    state.isListening = false;
    
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    if (audioContext) {
      audioContext.close();
    }
    
    microphone = null;
    analyser = null;
    audioContext = null;
  }
  
  // 토글 리스닝
  function toggleListening() {
    if (state.isListening) {
      stopAudio();
    } else {
      initializeAudio();
    }
  }
  
  // 캘리브레이션
  function calibrate() {
    // 노이즈 플로어 측정
    // 감도 자동 조정
    console.log('Calibrating...');
  }
  
  onMount(() => {
    // 자동 시작 옵션
    if (targetNotes.length > 0) {
      initializeAudio();
    }
  });
  
  onDestroy(() => {
    stopAudio();
  });
  
  // 반응형 업데이트
  $: if (targetNotes.length > 0 && !state.isListening) {
    initializeAudio();
  }
</script>

<div class="realtime-audio-analyzer">
  <!-- 헤더 -->
  <div class="analyzer-header">
    <h3 class="analyzer-title">
      <Activity size={20} />
      실시간 오디오 분석
    </h3>
    
    <div class="controls">
      <button 
        class="btn btn-sm"
        class:btn-primary={state.isListening}
        on:click={toggleListening}
      >
        {#if state.isListening}
          <Mic size={16} />
          듣는 중...
        {:else}
          <MicOff size={16} />
          시작하기
        {/if}
      </button>
      
      <button 
        class="btn btn-sm btn-ghost"
        on:click={calibrate}
        disabled={!state.isListening}
      >
        캘리브레이션
      </button>
    </div>
  </div>
  
  <!-- 메인 디스플레이 -->
  <div class="main-display">
    <!-- 피치 미터 -->
    <div class="pitch-meter">
      <div class="pitch-dial">
        <svg viewBox="0 0 200 200" class="dial-svg">
          <!-- 배경 원 -->
          <circle cx="100" cy="100" r="90" fill="none" stroke="#e0e0e0" stroke-width="2"/>
          
          <!-- 정확도 표시 원호 -->
          <circle 
            cx="100" 
            cy="100" 
            r="90" 
            fill="none" 
            stroke="url(#accuracyGradient)" 
            stroke-width="8"
            stroke-dasharray={`${state.accuracy * 5.65} 565`}
            stroke-dashoffset="0"
            transform="rotate(-90 100 100)"
            class="accuracy-arc"
          />
          
          <!-- 센트 표시 바늘 -->
          <line 
            x1="100" 
            y1="100" 
            x2="100" 
            y2="20"
            stroke="#333"
            stroke-width="3"
            transform={`rotate(${state.cents * 1.8} 100 100)`}
            class="cents-needle"
          />
          
          <!-- 중앙 점 -->
          <circle cx="100" cy="100" r="5" fill="#333"/>
          
          <!-- 그라디언트 정의 -->
          <defs>
            <linearGradient id="accuracyGradient">
              <stop offset="0%" style="stop-color:#ef4444" />
              <stop offset="50%" style="stop-color:#eab308" />
              <stop offset="100%" style="stop-color:#22c55e" />
            </linearGradient>
          </defs>
        </svg>
        
        <!-- 중앙 정보 -->
        <div class="pitch-info">
          <div class="current-note">{state.currentNote || '-'}</div>
          <div class="pitch-frequency">{state.currentPitch.toFixed(1)} Hz</div>
          <div class="cents-display">{state.cents > 0 ? '+' : ''}{state.cents} cents</div>
        </div>
      </div>
      
      <!-- 타겟 노트 -->
      {#if state.targetNote}
        <div class="target-note">
          <span class="label">목표:</span>
          <span class="note">{state.targetNote}</span>
        </div>
      {/if}
    </div>
    
    <!-- 정확도 표시 -->
    <div class="accuracy-display">
      <div class="accuracy-meter">
        <div class="accuracy-label">정확도</div>
        <div class="accuracy-value">{state.accuracy}%</div>
        <div class="accuracy-bar">
          <div 
            class="accuracy-fill"
            style="width: {state.accuracy}%; background: {state.accuracy > 80 ? '#22c55e' : state.accuracy > 50 ? '#eab308' : '#ef4444'}"
          ></div>
        </div>
      </div>
      
      <!-- 피드백 아이콘 -->
      <div class="feedback-icon">
        {#if state.accuracy > 80}
          <CheckCircle size={48} class="text-green-500" />
        {:else if state.accuracy > 50}
          <AlertCircle size={48} class="text-yellow-500" />
        {:else}
          <XCircle size={48} class="text-red-500" />
        {/if}
      </div>
    </div>
  </div>
  
  <!-- 상세 정보 -->
  <div class="detail-grid">
    <!-- 볼륨 -->
    <div class="detail-card">
      <div class="detail-header">
        <Volume2 size={16} />
        <span>볼륨</span>
      </div>
      <div class="detail-value">{state.volume}%</div>
      <div class="detail-bar">
        <div class="bar-fill" style="width: {state.volume}%"></div>
      </div>
    </div>
    
    <!-- 명료도 -->
    <div class="detail-card">
      <div class="detail-header">
        <Target size={16} />
        <span>명료도</span>
      </div>
      <div class="detail-value">{state.clarity}%</div>
      <div class="detail-bar">
        <div class="bar-fill" style="width: {state.clarity}%"></div>
      </div>
    </div>
    
    <!-- 테크닉 -->
    <div class="detail-card">
      <div class="detail-header">
        <Music size={16} />
        <span>테크닉</span>
      </div>
      <div class="detail-value">{state.technique.detected || 'Normal'}</div>
      <div class="detail-confidence">
        신뢰도: {state.technique.confidence}%
      </div>
    </div>
    
    <!-- 타이밍 -->
    <div class="detail-card">
      <div class="detail-header">
        <Gauge size={16} />
        <span>타이밍</span>
      </div>
      <div class="detail-value">
        {#if state.timing.classification === 'early'}
          빠름
        {:else if state.timing.classification === 'late'}
          느림
        {:else}
          정확
        {/if}
      </div>
      <div class="timing-indicator">
        <span class="indicator-dot" class:early={state.timing.classification === 'early'}></span>
        <span class="indicator-dot" class:onTime={state.timing.classification === 'onTime'}></span>
        <span class="indicator-dot" class:late={state.timing.classification === 'late'}></span>
      </div>
    </div>
  </div>
  
  <!-- 웨이브폼 디스플레이 -->
  <div class="waveform-display">
    <canvas id="waveform-canvas"></canvas>
  </div>
  
  <!-- 설정 패널 -->
  <div class="settings-panel">
    <div class="setting-item">
      <label>감도</label>
      <input 
        type="range"
        bind:value={sensitivity}
        min="0"
        max="1"
        step="0.1"
        class="range range-sm"
      >
      <span>{sensitivity}</span>
    </div>
    
    <div class="setting-item">
      <label class="label cursor-pointer">
        <span>시각 피드백</span>
        <input 
          type="checkbox"
          bind:checked={enableVisualFeedback}
          class="checkbox checkbox-sm"
        >
      </label>
    </div>
    
    <div class="setting-item">
      <label class="label cursor-pointer">
        <span>햅틱 피드백</span>
        <input 
          type="checkbox"
          bind:checked={enableHapticFeedback}
          class="checkbox checkbox-sm"
        >
      </label>
    </div>
  </div>
</div>

<style>
  .realtime-audio-analyzer {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
  
  .analyzer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e0e0e0;
  }
  
  .analyzer-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  }
  
  .controls {
    display: flex;
    gap: 8px;
  }
  
  /* 메인 디스플레이 */
  .main-display {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 24px;
  }
  
  .pitch-meter {
    position: relative;
  }
  
  .pitch-dial {
    position: relative;
    width: 200px;
    height: 200px;
    margin: 0 auto;
  }
  
  .dial-svg {
    width: 100%;
    height: 100%;
  }
  
  .accuracy-arc {
    transition: stroke-dasharray 0.3s ease;
  }
  
  .cents-needle {
    transition: transform 0.1s ease;
  }
  
  .pitch-info {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
  }
  
  .current-note {
    font-size: 36px;
    font-weight: bold;
    color: #333;
  }
  
  .pitch-frequency {
    font-size: 14px;
    color: #666;
    margin-top: 4px;
  }
  
  .cents-display {
    font-size: 12px;
    color: #999;
    margin-top: 2px;
  }
  
  .target-note {
    text-align: center;
    margin-top: 16px;
    padding: 8px;
    background: #f5f5f5;
    border-radius: 8px;
  }
  
  .target-note .label {
    font-size: 12px;
    color: #666;
  }
  
  .target-note .note {
    font-size: 20px;
    font-weight: bold;
    color: #1976d2;
    margin-left: 8px;
  }
  
  /* 정확도 디스플레이 */
  .accuracy-display {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 16px;
  }
  
  .accuracy-meter {
    width: 100%;
    max-width: 200px;
  }
  
  .accuracy-label {
    font-size: 14px;
    color: #666;
    margin-bottom: 4px;
  }
  
  .accuracy-value {
    font-size: 48px;
    font-weight: bold;
    text-align: center;
  }
  
  .accuracy-bar {
    height: 8px;
    background: #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
    margin-top: 8px;
  }
  
  .accuracy-fill {
    height: 100%;
    transition: width 0.3s ease, background 0.3s ease;
  }
  
  .feedback-icon {
    display: flex;
    justify-content: center;
  }
  
  /* 상세 정보 그리드 */
  .detail-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }
  
  .detail-card {
    padding: 12px;
    background: #f8f9fa;
    border-radius: 8px;
  }
  
  .detail-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #666;
    margin-bottom: 8px;
  }
  
  .detail-value {
    font-size: 20px;
    font-weight: 600;
    color: #333;
    margin-bottom: 8px;
  }
  
  .detail-bar {
    height: 4px;
    background: #e0e0e0;
    border-radius: 2px;
    overflow: hidden;
  }
  
  .bar-fill {
    height: 100%;
    background: #1976d2;
    transition: width 0.3s ease;
  }
  
  .detail-confidence {
    font-size: 11px;
    color: #999;
    margin-top: 4px;
  }
  
  .timing-indicator {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }
  
  .indicator-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #e0e0e0;
  }
  
  .indicator-dot.early {
    background: #ef4444;
  }
  
  .indicator-dot.onTime {
    background: #22c55e;
  }
  
  .indicator-dot.late {
    background: #eab308;
  }
  
  /* 웨이브폼 디스플레이 */
  .waveform-display {
    height: 100px;
    background: #f8f9fa;
    border-radius: 8px;
    margin-bottom: 16px;
    overflow: hidden;
  }
  
  #waveform-canvas {
    width: 100%;
    height: 100%;
  }
  
  /* 설정 패널 */
  .settings-panel {
    display: flex;
    gap: 24px;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 8px;
  }
  
  .setting-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .setting-item label {
    font-size: 14px;
    color: #666;
  }
  
  /* 반응형 */
  @media (max-width: 768px) {
    .main-display {
      grid-template-columns: 1fr;
    }
    
    .detail-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .settings-panel {
      flex-direction: column;
    }
  }
  
  /* CSS 변수 애니메이션 */
  :root {
    --pitch-accuracy: 0%;
    --pitch-cents: 0deg;
  }
  
  /* 다크 모드 */
  :global(.dark) .realtime-audio-analyzer {
    background: #2d2d2d;
  }
  
  :global(.dark) .analyzer-header {
    border-color: #444;
  }
  
  :global(.dark) .detail-card {
    background: #1a1a1a;
  }
  
  :global(.dark) .current-note,
  :global(.dark) .detail-value {
    color: #e0e0e0;
  }
</style>