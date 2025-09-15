<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as Tone from 'tone';
  import WaveSurfer from 'wavesurfer.js';
  import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions';
  
  export let audioUrl: string | null = null;
  export let audioBuffer: AudioBuffer | null = null;
  export let onBeatChange: (beat: number) => void = () => {};
  export let tempo: number = 120;
  
  let container: HTMLDivElement;
  let wavesurfer: WaveSurfer | null = null;
  let player: Tone.Player | null = null;
  let regions: any = null;
  let loopRegion: any = null;
  
  // 재생 상태
  let isPlaying = false;
  let currentTime = 0;
  let duration = 0;
  let playbackRate = 1.0;
  
  // 루프 설정
  let loopEnabled = false;
  let loopStart = 0;
  let loopEnd = 0;
  
  // 메트로놈
  let metronomeEnabled = false;
  let metronome: Tone.Loop | null = null;
  let clickSound: Tone.Synth | null = null;
  
  // 속도 프리셋
  const speedPresets = [
    { label: '50%', value: 0.5 },
    { label: '75%', value: 0.75 },
    { label: '90%', value: 0.9 },
    { label: '100%', value: 1.0 },
    { label: '110%', value: 1.1 },
    { label: '125%', value: 1.25 }
  ];
  
  onMount(async () => {
    if (!container) return;
    
    // Tone.js 초기화
    await Tone.start();
    
    // WaveSurfer 초기화
    wavesurfer = WaveSurfer.create({
      container: container,
      waveColor: '#6b7280',
      progressColor: '#3b82f6',
      cursorColor: '#ef4444',
      barWidth: 2,
      barRadius: 2,
      responsive: true,
      height: 100,
      normalize: true,
      backend: 'WebAudio',
      plugins: []
    });
    
    // Regions 플러그인 초기화
    regions = wavesurfer.registerPlugin(RegionsPlugin.create());
    
    // 오디오 로드
    if (audioUrl) {
      await loadAudio(audioUrl);
    } else if (audioBuffer) {
      await loadAudioBuffer(audioBuffer);
    }
    
    // 이벤트 리스너
    wavesurfer.on('ready', () => {
      duration = wavesurfer!.getDuration();
      setupPlayer();
    });
    
    wavesurfer.on('audioprocess', (time) => {
      currentTime = time;
      updateBeatPosition(time);
    });
    
    wavesurfer.on('interaction', () => {
      currentTime = wavesurfer!.getCurrentTime();
    });
    
    // 메트로놈 설정
    setupMetronome();
  });
  
  onDestroy(() => {
    if (wavesurfer) {
      wavesurfer.destroy();
    }
    if (player) {
      player.dispose();
    }
    if (metronome) {
      metronome.dispose();
    }
    if (clickSound) {
      clickSound.dispose();
    }
  });
  
  async function loadAudio(url: string) {
    if (wavesurfer) {
      await wavesurfer.load(url);
    }
  }
  
  async function loadAudioBuffer(buffer: AudioBuffer) {
    if (wavesurfer) {
      // AudioBuffer를 Blob으로 변환
      const arrayBuffer = audioBufferToArrayBuffer(buffer);
      const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      await wavesurfer.load(url);
      URL.revokeObjectURL(url);
    }
  }
  
  function audioBufferToArrayBuffer(buffer: AudioBuffer): ArrayBuffer {
    // 간단한 WAV 헤더 생성
    const length = buffer.length * buffer.numberOfChannels * 2;
    const arrayBuffer = new ArrayBuffer(44 + length);
    const view = new DataView(arrayBuffer);
    
    // WAV 헤더 작성
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, buffer.numberOfChannels, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * 2 * buffer.numberOfChannels, true);
    view.setUint16(32, buffer.numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length, true);
    
    // 오디오 데이터 작성
    const offset = 44;
    const channels = [];
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }
    
    let index = offset;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, channels[channel][i]));
        view.setInt16(index, sample * 0x7FFF, true);
        index += 2;
      }
    }
    
    return arrayBuffer;
  }
  
  function setupPlayer() {
    if (!wavesurfer) return;
    
    // Tone.js Player 설정
    player = new Tone.Player({
      url: audioUrl!,
      playbackRate: playbackRate,
      loop: loopEnabled,
      loopStart: loopStart,
      loopEnd: loopEnd
    }).toDestination();
  }
  
  function setupMetronome() {
    // 클릭 사운드 생성
    clickSound = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 0.1,
        sustain: 0,
        release: 0.1
      }
    }).toDestination();
    
    // 메트로놈 루프
    const interval = 60 / tempo;
    metronome = new Tone.Loop((time) => {
      if (metronomeEnabled && isPlaying) {
        clickSound!.triggerAttackRelease('C5', '8n', time);
      }
    }, interval).start(0);
    
    Tone.Transport.start();
  }
  
  function updateBeatPosition(time: number) {
    // 현재 시간을 비트 단위로 변환
    const beat = (time / 60) * tempo;
    onBeatChange(beat);
  }
  
  // 재생 제어
  function togglePlayback() {
    if (!wavesurfer) return;
    
    if (isPlaying) {
      wavesurfer.pause();
      Tone.Transport.pause();
    } else {
      wavesurfer.play();
      Tone.Transport.start();
    }
    isPlaying = !isPlaying;
  }
  
  function stop() {
    if (wavesurfer) {
      wavesurfer.stop();
      Tone.Transport.stop();
      isPlaying = false;
      currentTime = 0;
    }
  }
  
  // 속도 조절
  function setPlaybackRate(rate: number) {
    playbackRate = rate;
    if (wavesurfer) {
      wavesurfer.setPlaybackRate(rate);
    }
    if (player) {
      player.playbackRate = rate;
    }
  }
  
  // 루프 설정
  function setLoop() {
    if (!wavesurfer || !regions) return;
    
    if (loopRegion) {
      loopRegion.remove();
    }
    
    // 현재 선택 영역을 루프로 설정
    const selection = wavesurfer.getCurrentTime();
    loopStart = Math.max(0, selection - 2); // 2초 전
    loopEnd = Math.min(duration, selection + 2); // 2초 후
    
    loopRegion = regions.addRegion({
      start: loopStart,
      end: loopEnd,
      color: 'rgba(59, 130, 246, 0.3)',
      drag: true,
      resize: true
    });
    
    loopRegion.on('update', () => {
      loopStart = loopRegion.start;
      loopEnd = loopRegion.end;
    });
    
    loopEnabled = true;
  }
  
  function toggleLoop() {
    loopEnabled = !loopEnabled;
    
    if (!loopEnabled && loopRegion) {
      loopRegion.remove();
      loopRegion = null;
    }
  }
  
  // 시간 포맷팅
  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  // 키보드 단축키
  function handleKeydown(e: KeyboardEvent) {
    switch(e.key) {
      case ' ':
        e.preventDefault();
        togglePlayback();
        break;
      case 'l':
        setLoop();
        break;
      case 'm':
        metronomeEnabled = !metronomeEnabled;
        break;
      case 'ArrowLeft':
        if (wavesurfer) {
          wavesurfer.skip(-5);
        }
        break;
      case 'ArrowRight':
        if (wavesurfer) {
          wavesurfer.skip(5);
        }
        break;
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="advanced-player">
  <!-- 파형 디스플레이 -->
  <div class="waveform-container" bind:this={container}></div>
  
  <!-- 시간 정보 -->
  <div class="time-info">
    <span class="current-time">{formatTime(currentTime)}</span>
    <div class="time-bar">
      <div 
        class="time-progress" 
        style="width: {(currentTime / duration) * 100}%"
      ></div>
    </div>
    <span class="total-time">{formatTime(duration)}</span>
  </div>
  
  <!-- 주요 컨트롤 -->
  <div class="main-controls">
    <button on:click={stop} class="control-btn" title="정지">
      <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M6 6h12v12H6z"/>
      </svg>
    </button>
    
    <button on:click={togglePlayback} class="play-btn" title="{isPlaying ? '일시정지' : '재생'}">
      {#if isPlaying}
        <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
        </svg>
      {:else}
        <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z"/>
        </svg>
      {/if}
    </button>
    
    <!-- 속도 조절 -->
    <div class="speed-control">
      <label>속도</label>
      <select 
        value={playbackRate} 
        on:change={(e) => setPlaybackRate(Number(e.target.value))}
        class="speed-select"
      >
        {#each speedPresets as preset}
          <option value={preset.value}>{preset.label}</option>
        {/each}
      </select>
    </div>
  </div>
  
  <!-- 보조 컨트롤 -->
  <div class="secondary-controls">
    <!-- 루프 -->
    <div class="control-group">
      <button 
        on:click={toggleLoop} 
        class="toggle-btn"
        class:active={loopEnabled}
        title="루프 {loopEnabled ? '끄기' : '켜기'} (L)"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        루프
      </button>
      
      {#if loopEnabled}
        <button on:click={setLoop} class="action-btn" title="루프 구간 설정">
          설정
        </button>
      {/if}
    </div>
    
    <!-- 메트로놈 -->
    <div class="control-group">
      <button 
        on:click={() => metronomeEnabled = !metronomeEnabled}
        class="toggle-btn"
        class:active={metronomeEnabled}
        title="메트로놈 {metronomeEnabled ? '끄기' : '켜기'} (M)"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L6 7v10c0 3.3 2.7 6 6 6s6-2.7 6-6V7l-6-5zm0 2.5L16 8v9c0 2.2-1.8 4-4 4s-4-1.8-4-4V8l4-3.5z"/>
        </svg>
        메트로놈
      </button>
      
      {#if metronomeEnabled}
        <input 
          type="number" 
          bind:value={tempo}
          min="40" 
          max="240" 
          class="tempo-input"
          title="BPM"
        />
        <span class="tempo-label">BPM</span>
      {/if}
    </div>
    
    <!-- 구간 점프 -->
    <div class="control-group">
      <button on:click={() => wavesurfer?.skip(-5)} class="skip-btn" title="5초 뒤로">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 8V4l-6 6 6 6v-4c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
        </svg>
        -5s
      </button>
      
      <button on:click={() => wavesurfer?.skip(5)} class="skip-btn" title="5초 앞으로">
        +5s
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 8V4l6 6-6 6v-4c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/>
        </svg>
      </button>
    </div>
  </div>
  
  <!-- 단축키 안내 -->
  <div class="shortcuts">
    <span class="shortcut">Space: 재생/일시정지</span>
    <span class="shortcut">L: 루프 설정</span>
    <span class="shortcut">M: 메트로놈</span>
    <span class="shortcut">←/→: 5초 이동</span>
  </div>
</div>

<style>
  .advanced-player {
    background-color: #1f2937;
    border-radius: 0.5rem;
    padding: 1.5rem;
  }
  
  .waveform-container {
    background-color: #111827;
    border-radius: 0.375rem;
    padding: 1rem;
    margin-bottom: 1rem;
    min-height: 100px;
  }
  
  .time-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  .time-bar {
    flex: 1;
    height: 4px;
    background-color: #374151;
    border-radius: 2px;
    overflow: hidden;
  }
  
  .time-progress {
    height: 100%;
    background-color: #3b82f6;
    transition: width 0.1s;
  }
  
  .current-time,
  .total-time {
    font-family: monospace;
    font-size: 0.875rem;
    min-width: 3rem;
  }
  
  .main-controls {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  .control-btn,
  .play-btn {
    width: 3rem;
    height: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #374151;
    border-radius: 50%;
    transition: all 0.2s;
  }
  
  .play-btn {
    width: 4rem;
    height: 4rem;
    background-color: #3b82f6;
  }
  
  .control-btn:hover,
  .play-btn:hover {
    transform: scale(1.05);
    background-color: #4b5563;
  }
  
  .play-btn:hover {
    background-color: #2563eb;
  }
  
  .speed-control {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .speed-control label {
    font-size: 0.875rem;
    color: #9ca3af;
  }
  
  .speed-select {
    background-color: #374151;
    border: 1px solid #4b5563;
    border-radius: 0.375rem;
    padding: 0.5rem;
    color: white;
  }
  
  .secondary-controls {
    display: flex;
    gap: 2rem;
    margin-bottom: 1rem;
  }
  
  .control-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .toggle-btn,
  .action-btn,
  .skip-btn {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem 1rem;
    background-color: #374151;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    transition: all 0.2s;
  }
  
  .toggle-btn:hover,
  .action-btn:hover,
  .skip-btn:hover {
    background-color: #4b5563;
  }
  
  .toggle-btn.active {
    background-color: #3b82f6;
  }
  
  .tempo-input {
    width: 4rem;
    padding: 0.25rem;
    background-color: #374151;
    border: 1px solid #4b5563;
    border-radius: 0.25rem;
    text-align: center;
    color: white;
  }
  
  .tempo-label {
    font-size: 0.75rem;
    color: #9ca3af;
  }
  
  .shortcuts {
    display: flex;
    gap: 2rem;
    padding-top: 1rem;
    border-top: 1px solid #374151;
    font-size: 0.75rem;
    color: #6b7280;
  }
  
  .shortcut {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  
  /* WaveSurfer 커스텀 스타일 */
  :global(.advanced-player wave) {
    overflow: visible !important;
  }
  
  :global(.advanced-player .wavesurfer-region) {
    z-index: 3 !important;
  }
  
  :global(.advanced-player .wavesurfer-handle) {
    background-color: #3b82f6 !important;
    width: 4px !important;
  }
</style>
