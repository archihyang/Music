<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import RealtimeAudioAnalyzer from '$lib/components/RealtimeAudioAnalyzer.svelte';
  import Interactive3DFretboard from '$lib/components/Interactive3DFretboard.svelte';
  import ProfessionalMusicViewer from '$lib/components/ProfessionalMusicViewer.svelte';
  import { 
    Mic, 
    MicOff,
    Play,
    Pause,
    RotateCcw,
    Settings,
    Volume2,
    Metronome,
    FileMusic,
    Save,
    Share2,
    Award,
    TrendingUp,
    Target,
    Zap,
    Timer,
    Music,
    Guitar
  } from 'lucide-svelte';
  
  // 연습 모드
  type PracticeMode = 'freeplay' | 'guided' | 'challenge' | 'recording';
  let practiceMode: PracticeMode = 'guided';
  
  // 오디오 분석 상태
  let isListening = false;
  let audioEnabled = false;
  let currentNote = '';
  let currentFrequency = 0;
  let pitchAccuracy = 0;
  let rhythmAccuracy = 0;
  
  // 3D 지판 상태
  let selectedScale = 'major';
  let rootNote = 'C';
  let showChords = false;
  let cagedPosition = 1;
  
  // 악보 데이터
  let currentScore: any = null;
  let isPlaying = false;
  let playbackSpeed = 1.0;
  let currentMeasure = 0;
  let totalMeasures = 0;
  
  // 메트로놈
  let metronomeEnabled = false;
  let bpm = 120;
  let timeSignature = '4/4';
  
  // 연습 세션 데이터
  let sessionData = {
    startTime: null as Date | null,
    duration: 0,
    notesPlayed: 0,
    correctNotes: 0,
    averageAccuracy: 0,
    problemAreas: [] as any[],
    improvements: [] as any[]
  };
  
  // 타이머
  let practiceTimer: any;
  let elapsedTime = 0;
  
  // 백킹 트랙
  let backingTracks = [
    { id: 'blues-a', name: 'Blues in A', bpm: 90, key: 'A' },
    { id: 'rock-e', name: 'Rock in E', bpm: 120, key: 'E' },
    { id: 'jazz-c', name: 'Jazz in C', bpm: 100, key: 'C' },
    { id: 'pop-g', name: 'Pop in G', bpm: 110, key: 'G' }
  ];
  let selectedBackingTrack: any = null;
  
  // 챌린지 데이터
  let currentChallenge = {
    id: 'scale-speed',
    name: 'Scale Speed Challenge',
    targetBPM: 140,
    currentBPM: 100,
    progress: 0,
    rewards: {
      xp: 500,
      badge: 'Speed Demon'
    }
  };
  
  // 녹음 상태
  let isRecording = false;
  let recordedAudio: Blob | null = null;
  let recordingDuration = 0;
  
  onMount(() => {
    startPracticeSession();
  });
  
  onDestroy(() => {
    stopPracticeSession();
  });
  
  function startPracticeSession() {
    sessionData.startTime = new Date();
    practiceTimer = setInterval(() => {
      elapsedTime++;
      sessionData.duration = elapsedTime;
    }, 1000);
  }
  
  function stopPracticeSession() {
    if (practiceTimer) {
      clearInterval(practiceTimer);
    }
    savePracticeSession();
  }
  
  function toggleAudioInput() {
    audioEnabled = !audioEnabled;
    if (audioEnabled) {
      isListening = true;
    } else {
      isListening = false;
    }
  }
  
  function handleNoteDetected(event: CustomEvent) {
    const { note, frequency, cents, accuracy } = event.detail;
    currentNote = note;
    currentFrequency = frequency;
    pitchAccuracy = accuracy;
    
    sessionData.notesPlayed++;
    if (accuracy > 90) {
      sessionData.correctNotes++;
    }
    
    updateAccuracy();
  }
  
  function handleRhythmAnalyzed(event: CustomEvent) {
    const { timing, groove, consistency } = event.detail;
    rhythmAccuracy = consistency;
  }
  
  function updateAccuracy() {
    if (sessionData.notesPlayed > 0) {
      sessionData.averageAccuracy = 
        (sessionData.correctNotes / sessionData.notesPlayed) * 100;
    }
  }
  
  function togglePlayback() {
    isPlaying = !isPlaying;
    // TODO: Implement actual playback control
  }
  
  function changePlaybackSpeed(speed: number) {
    playbackSpeed = speed;
    // TODO: Apply speed change to playback
  }
  
  function toggleMetronome() {
    metronomeEnabled = !metronomeEnabled;
    // TODO: Implement metronome
  }
  
  function selectBackingTrack(track: any) {
    selectedBackingTrack = track;
    // TODO: Load and play backing track
  }
  
  function startRecording() {
    isRecording = true;
    recordingDuration = 0;
    // TODO: Implement recording
  }
  
  function stopRecording() {
    isRecording = false;
    // TODO: Stop recording and save audio
  }
  
  function savePracticeSession() {
    const session = {
      ...sessionData,
      endTime: new Date(),
      mode: practiceMode
    };
    
    // TODO: Save to backend
    console.log('Saving practice session:', session);
  }
  
  function shareProgress() {
    // TODO: Implement social sharing
  }
  
  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
</script>

<svelte:head>
  <title>연습 모드 - Genesis Music</title>
  <meta name="description" content="실시간 피드백과 함께하는 전문 기타 연습" />
</svelte:head>

<div class="practice-page">
  <!-- 상단 툴바 -->
  <div class="toolbar">
    <div class="toolbar-section">
      <div class="mode-selector">
        <button 
          class="mode-btn"
          class:active={practiceMode === 'freeplay'}
          on:click={() => practiceMode = 'freeplay'}
        >
          자유 연습
        </button>
        <button 
          class="mode-btn"
          class:active={practiceMode === 'guided'}
          on:click={() => practiceMode = 'guided'}
        >
          가이드 연습
        </button>
        <button 
          class="mode-btn"
          class:active={practiceMode === 'challenge'}
          on:click={() => practiceMode = 'challenge'}
        >
          챌린지
        </button>
        <button 
          class="mode-btn"
          class:active={practiceMode === 'recording'}
          on:click={() => practiceMode = 'recording'}
        >
          녹음
        </button>
      </div>
    </div>
    
    <div class="toolbar-section">
      <div class="practice-stats">
        <div class="stat">
          <Timer size={16} />
          <span>{formatTime(elapsedTime)}</span>
        </div>
        <div class="stat">
          <Target size={16} />
          <span>{sessionData.averageAccuracy.toFixed(1)}%</span>
        </div>
        <div class="stat">
          <Music size={16} />
          <span>{sessionData.notesPlayed} notes</span>
        </div>
      </div>
    </div>
    
    <div class="toolbar-section">
      <button class="btn btn-sm btn-ghost" on:click={shareProgress}>
        <Share2 size={16} />
      </button>
      <button class="btn btn-sm btn-ghost" on:click={savePracticeSession}>
        <Save size={16} />
      </button>
      <button class="btn btn-sm btn-ghost">
        <Settings size={16} />
      </button>
    </div>
  </div>
  
  <!-- 메인 콘텐츠 영역 -->
  <div class="practice-content">
    <!-- 왼쪽: 악보 뷰어 -->
    <div class="notation-panel">
      <div class="panel-header">
        <h3>악보 & 탭</h3>
        <div class="playback-controls">
          <button 
            class="btn btn-sm btn-circle"
            on:click={togglePlayback}
          >
            {#if isPlaying}
              <Pause size={16} />
            {:else}
              <Play size={16} />
            {/if}
          </button>
          
          <div class="speed-control">
            <label>속도:</label>
            <select 
              bind:value={playbackSpeed}
              on:change={(e) => changePlaybackSpeed(Number(e.currentTarget.value))}
            >
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1.0}>1.0x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
            </select>
          </div>
          
          <button 
            class="btn btn-sm"
            class:btn-primary={metronomeEnabled}
            on:click={toggleMetronome}
          >
            <Metronome size={16} />
            {bpm} BPM
          </button>
        </div>
      </div>
      
      <div class="notation-viewer">
        {#if currentScore}
          <ProfessionalMusicViewer 
            midiData={currentScore}
            showTab={true}
            enablePlayback={true}
            highlightCurrentNote={true}
          />
        {:else}
          <div class="empty-state">
            <FileMusic size={48} />
            <p>악보를 선택하거나 업로드하세요</p>
            <button class="btn btn-primary" on:click={() => goto('/upload')}>
              악보 업로드
            </button>
          </div>
        {/if}
      </div>
    </div>
    
    <!-- 중앙: 3D 지판 -->
    <div class="fretboard-panel">
      <div class="panel-header">
        <h3>3D 지판</h3>
        <div class="fretboard-controls">
          <select bind:value={selectedScale}>
            <option value="major">Major</option>
            <option value="minor">Minor</option>
            <option value="pentatonic">Pentatonic</option>
            <option value="blues">Blues</option>
          </select>
          
          <select bind:value={rootNote}>
            <option value="C">C</option>
            <option value="D">D</option>
            <option value="E">E</option>
            <option value="F">F</option>
            <option value="G">G</option>
            <option value="A">A</option>
            <option value="B">B</option>
          </select>
          
          <label class="checkbox-label">
            <input type="checkbox" bind:checked={showChords} />
            코드 표시
          </label>
        </div>
      </div>
      
      <div class="fretboard-viewer">
        <Interactive3DFretboard 
          scale={selectedScale}
          rootNote={rootNote}
          showChords={showChords}
          highlightNotes={[currentNote]}
          cagedPosition={cagedPosition}
        />
      </div>
      
      <!-- CAGED 포지션 선택 -->
      <div class="caged-selector">
        {#each [1, 2, 3, 4, 5] as position}
          <button 
            class="caged-btn"
            class:active={cagedPosition === position}
            on:click={() => cagedPosition = position}
          >
            {position}
          </button>
        {/each}
      </div>
    </div>
    
    <!-- 오른쪽: 실시간 분석 -->
    <div class="analysis-panel">
      <div class="panel-header">
        <h3>실시간 분석</h3>
        <button 
          class="btn btn-sm"
          class:btn-primary={audioEnabled}
          on:click={toggleAudioInput}
        >
          {#if audioEnabled}
            <Mic size={16} />
            ON
          {:else}
            <MicOff size={16} />
            OFF
          {/if}
        </button>
      </div>
      
      <div class="analyzer-container">
        <RealtimeAudioAnalyzer 
          {isListening}
          showVisualizer={true}
          enableRecording={practiceMode === 'recording'}
          on:noteDetected={handleNoteDetected}
          on:rhythmAnalyzed={handleRhythmAnalyzed}
        />
      </div>
      
      <!-- 실시간 피드백 -->
      <div class="feedback-section">
        <div class="current-note">
          <span class="label">현재 음:</span>
          <span class="note-display">{currentNote || '-'}</span>
          <span class="frequency">{currentFrequency.toFixed(1)} Hz</span>
        </div>
        
        <div class="accuracy-meters">
          <div class="meter">
            <span class="meter-label">음정 정확도</span>
            <progress value={pitchAccuracy} max="100"></progress>
            <span class="meter-value">{pitchAccuracy.toFixed(0)}%</span>
          </div>
          
          <div class="meter">
            <span class="meter-label">리듬 정확도</span>
            <progress value={rhythmAccuracy} max="100"></progress>
            <span class="meter-value">{rhythmAccuracy.toFixed(0)}%</span>
          </div>
        </div>
      </div>
      
      <!-- 모드별 컨트롤 -->
      {#if practiceMode === 'guided'}
        <div class="guided-controls">
          <h4>백킹 트랙</h4>
          <div class="backing-tracks">
            {#each backingTracks as track}
              <button 
                class="track-btn"
                class:active={selectedBackingTrack?.id === track.id}
                on:click={() => selectBackingTrack(track)}
              >
                <span>{track.name}</span>
                <span class="track-info">{track.bpm} BPM • {track.key}</span>
              </button>
            {/each}
          </div>
        </div>
      {/if}
      
      {#if practiceMode === 'challenge'}
        <div class="challenge-info">
          <h4>{currentChallenge.name}</h4>
          <div class="challenge-progress">
            <div class="challenge-stat">
              <span>현재 BPM:</span>
              <span>{currentChallenge.currentBPM}</span>
            </div>
            <div class="challenge-stat">
              <span>목표 BPM:</span>
              <span>{currentChallenge.targetBPM}</span>
            </div>
          </div>
          <progress 
            value={currentChallenge.progress} 
            max="100"
            class="progress-bar"
          ></progress>
          <div class="challenge-rewards">
            <Award size={16} />
            <span>{currentChallenge.rewards.xp} XP</span>
            <span>•</span>
            <span>{currentChallenge.rewards.badge}</span>
          </div>
        </div>
      {/if}
      
      {#if practiceMode === 'recording'}
        <div class="recording-controls">
          <h4>세션 녹음</h4>
          {#if !isRecording}
            <button 
              class="btn btn-error btn-block"
              on:click={startRecording}
            >
              <div class="recording-dot"></div>
              녹음 시작
            </button>
          {:else}
            <div class="recording-status">
              <div class="recording-indicator"></div>
              <span>녹음 중... {formatTime(recordingDuration)}</span>
            </div>
            <button 
              class="btn btn-ghost btn-block"
              on:click={stopRecording}
            >
              녹음 중지
            </button>
          {/if}
          
          {#if recordedAudio}
            <div class="recorded-session">
              <audio controls src={URL.createObjectURL(recordedAudio)}></audio>
              <button class="btn btn-sm btn-primary">
                저장하기
              </button>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
  
  <!-- 하단 진행 상황 -->
  <div class="progress-bar-section">
    <div class="progress-info">
      <span>현재 마디: {currentMeasure} / {totalMeasures}</span>
      <span>완료율: {((currentMeasure / Math.max(totalMeasures, 1)) * 100).toFixed(0)}%</span>
    </div>
    <progress 
      value={currentMeasure} 
      max={totalMeasures}
      class="main-progress"
    ></progress>
  </div>
</div>

<style>
  .practice-page {
    height: calc(100vh - 64px);
    display: flex;
    flex-direction: column;
    background: #1a1a1a;
    color: white;
  }
  
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    background: #2a2a2a;
    border-bottom: 1px solid #3a3a3a;
  }
  
  .toolbar-section {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .mode-selector {
    display: flex;
    gap: 4px;
    background: #1a1a1a;
    padding: 4px;
    border-radius: 8px;
  }
  
  .mode-btn {
    padding: 8px 16px;
    background: transparent;
    border: none;
    color: #888;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .mode-btn:hover {
    background: #3a3a3a;
  }
  
  .mode-btn.active {
    background: #3b82f6;
    color: white;
  }
  
  .practice-stats {
    display: flex;
    gap: 20px;
  }
  
  .stat {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #888;
  }
  
  .practice-content {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1.2fr 320px;
    gap: 20px;
    padding: 20px;
    overflow: hidden;
  }
  
  .notation-panel,
  .fretboard-panel,
  .analysis-panel {
    background: #2a2a2a;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid #3a3a3a;
  }
  
  .panel-header h3 {
    font-size: 1.125rem;
    font-weight: 600;
  }
  
  .playback-controls {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .speed-control {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .speed-control select {
    background: #1a1a1a;
    border: 1px solid #3a3a3a;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
  }
  
  .notation-viewer {
    flex: 1;
    overflow: auto;
    padding: 20px;
  }
  
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #666;
    gap: 16px;
  }
  
  .fretboard-controls {
    display: flex;
    gap: 12px;
  }
  
  .fretboard-controls select {
    background: #1a1a1a;
    border: 1px solid #3a3a3a;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
  }
  
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .fretboard-viewer {
    flex: 1;
    position: relative;
  }
  
  .caged-selector {
    display: flex;
    justify-content: center;
    gap: 8px;
    padding: 12px;
    border-top: 1px solid #3a3a3a;
  }
  
  .caged-btn {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: #1a1a1a;
    border: 2px solid #3a3a3a;
    color: white;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .caged-btn:hover {
    border-color: #3b82f6;
  }
  
  .caged-btn.active {
    background: #3b82f6;
    border-color: #3b82f6;
  }
  
  .analyzer-container {
    padding: 16px;
    border-bottom: 1px solid #3a3a3a;
  }
  
  .feedback-section {
    padding: 16px;
    border-bottom: 1px solid #3a3a3a;
  }
  
  .current-note {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: #1a1a1a;
    border-radius: 8px;
    margin-bottom: 16px;
  }
  
  .note-display {
    font-size: 1.5rem;
    font-weight: bold;
    color: #3b82f6;
  }
  
  .frequency {
    color: #666;
    font-size: 0.875rem;
  }
  
  .accuracy-meters {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .meter {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .meter-label {
    font-size: 0.875rem;
    color: #888;
  }
  
  .meter progress {
    width: 100%;
    height: 8px;
  }
  
  .meter-value {
    font-size: 0.875rem;
    color: #3b82f6;
  }
  
  .guided-controls,
  .challenge-info,
  .recording-controls {
    padding: 16px;
  }
  
  .guided-controls h4,
  .challenge-info h4,
  .recording-controls h4 {
    margin-bottom: 12px;
    font-size: 1rem;
  }
  
  .backing-tracks {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .track-btn {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 12px;
    background: #1a1a1a;
    border: 1px solid #3a3a3a;
    border-radius: 8px;
    color: white;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .track-btn:hover {
    border-color: #3b82f6;
  }
  
  .track-btn.active {
    background: #3b82f6;
    border-color: #3b82f6;
  }
  
  .track-info {
    font-size: 0.75rem;
    color: #888;
  }
  
  .challenge-progress {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  
  .challenge-stat {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .challenge-rewards {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    color: #fbbf24;
  }
  
  .recording-indicator {
    width: 12px;
    height: 12px;
    background: #ef4444;
    border-radius: 50%;
    animation: pulse 1s infinite;
  }
  
  .recording-status {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: #1a1a1a;
    border-radius: 8px;
    margin-bottom: 12px;
  }
  
  .recorded-session {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 12px;
  }
  
  .progress-bar-section {
    padding: 16px 20px;
    background: #2a2a2a;
    border-top: 1px solid #3a3a3a;
  }
  
  .progress-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 0.875rem;
    color: #888;
  }
  
  .main-progress {
    width: 100%;
    height: 8px;
  }
  
  @keyframes pulse {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
    100% {
      opacity: 1;
    }
  }
  
  /* 반응형 디자인 */
  @media (max-width: 1280px) {
    .practice-content {
      grid-template-columns: 1fr;
      grid-template-rows: auto auto auto;
    }
  }
</style>