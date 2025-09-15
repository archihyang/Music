<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import MusicViewer from '$lib/components/MusicViewer.svelte';
  import ProfessionalMusicViewer from '$lib/components/ProfessionalMusicViewer.svelte';
  import { 
    musicData, 
    midiData, 
    analysisResults,
    playbackState 
  } from '$lib/stores/audioStore';
  import { 
    Home, 
    Upload, 
    Settings, 
    Info,
    BarChart3,
    Brain,
    Guitar,
    Clock,
    Target
  } from 'lucide-svelte';
  
  // 악보 표시 옵션
  let showNotation = true;
  let showTabs = true;
  let showLyrics = false;
  let professionalMode = true; // 전문가 모드 기본 활성화
  
  // 분석 결과 표시
  let showAnalysis = false;
  let selectedAnalysisTab = 'pitch';
  
  // 스타일 분석 결과 (70-80년대 기타리스트)
  let styleAnalysis: any = null;
  
  // 실시간 피드백
  let realtimeFeedback: any = null;
  let feedbackSocket: WebSocket | null = null;
  
  onMount(() => {
    // 데이터가 없으면 업로드 페이지로 리다이렉트
    if (!$midiData && !$musicData) {
      goto('/upload');
      return;
    }
    
    // WebSocket 연결 (실시간 피드백용)
    connectFeedbackSocket();
    
    // 스타일 분석 요청
    if ($midiData) {
      requestStyleAnalysis();
    }
  });
  
  onDestroy(() => {
    // WebSocket 정리
    if (feedbackSocket) {
      feedbackSocket.close();
    }
  });
  
  // 실시간 피드백 WebSocket 연결
  function connectFeedbackSocket() {
    feedbackSocket = new WebSocket('ws://localhost:3001/ws/feedback');
    
    feedbackSocket.onopen = () => {
      console.log('Feedback WebSocket connected');
    };
    
    feedbackSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleRealtimeFeedback(data);
    };
    
    feedbackSocket.onerror = (error) => {
      console.error('Feedback WebSocket error:', error);
    };
  }
  
  // 실시간 피드백 처리
  function handleRealtimeFeedback(data: any) {
    realtimeFeedback = data;
    
    // 분석 결과 스토어 업데이트
    $analysisResults = {
      type: 'realtime',
      timestamp: Date.now(),
      data: {
        pitch: data.pitch,
        timing: data.timing,
        technique: data.technique
      },
      confidence: data.confidence || 0
    };
  }
  
  // 스타일 분석 요청
  async function requestStyleAnalysis() {
    if (!$midiData) return;
    
    try {
      // FormData 생성
      const formData = new FormData();
      const midiBlob = new Blob([$midiData], { type: 'audio/midi' });
      formData.append('file', midiBlob, 'transcribed.mid');
      
      // API 호출
      const response = await fetch('/api/v1/analyze/style', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        styleAnalysis = await response.json();
        console.log('Style analysis result:', styleAnalysis);
      }
    } catch (error) {
      console.error('Style analysis failed:', error);
    }
  }
  
  // 분석 탭 변경
  function selectAnalysisTab(tab: string) {
    selectedAnalysisTab = tab;
  }
  
  // 설정 패널 토글
  function toggleSettings() {
    // 설정 모달 표시
    const modal = document.getElementById('settings-modal') as HTMLDialogElement;
    if (modal) {
      modal.showModal();
    }
  }
  
  // 피치 정확도 계산
  function calculatePitchAccuracy(): number {
    if (!realtimeFeedback?.pitch) return 0;
    return realtimeFeedback.pitch.accuracy || 0;
  }
  
  // 타이밍 정확도 계산
  function calculateTimingAccuracy(): number {
    if (!realtimeFeedback?.timing) return 0;
    return realtimeFeedback.timing.accuracy || 0;
  }
</script>

<svelte:head>
  <title>악보 뷰어 - Genesis Music</title>
  <meta name="description" content="AI 변환된 악보와 탭을 확인하고 연습하세요" />
</svelte:head>

<div class="viewer-page">
  <!-- 헤더 툴바 -->
  <div class="header-toolbar">
    <div class="toolbar-left">
      <button 
        class="btn btn-sm btn-ghost"
        on:click={() => goto('/')}
      >
        <Home size={18} />
        홈
      </button>
      
      <button 
        class="btn btn-sm btn-ghost"
        on:click={() => goto('/upload')}
      >
        <Upload size={18} />
        새 파일
      </button>
      
      {#if $musicData}
        <div class="song-info">
          <span class="font-semibold">{$musicData.title || 'Untitled'}</span>
          <span class="text-sm text-base-content/60">by {$musicData.artist || 'Unknown'}</span>
        </div>
      {/if}
    </div>
    
    <div class="toolbar-right">
      <button 
        class="btn btn-sm btn-ghost"
        on:click={toggleSettings}
      >
        <Settings size={18} />
      </button>
      
      <button 
        class="btn btn-sm btn-ghost"
        on:click={() => showAnalysis = !showAnalysis}
        class:btn-active={showAnalysis}
      >
        <BarChart3 size={18} />
        분석
      </button>
    </div>
  </div>
  
  <!-- 메인 콘텐츠 영역 -->
  <div class="main-content">
    <!-- 악보 뷰어 -->
    <div class="viewer-container" class:with-sidebar={showAnalysis}>
      {#if professionalMode}
        <ProfessionalMusicViewer 
          {midiData}
          {musicData}
          {professionalMode}
        />
      {:else}
        <MusicViewer 
          {midiData}
          {musicData}
          bind:showNotation
          bind:showTabs
          bind:showLyrics
        />
      {/if}
    </div>
    
    <!-- 분석 사이드바 -->
    {#if showAnalysis}
      <div class="analysis-sidebar">
        <!-- 탭 선택 -->
        <div class="tabs tabs-boxed">
          <button 
            class="tab"
            class:tab-active={selectedAnalysisTab === 'pitch'}
            on:click={() => selectAnalysisTab('pitch')}
          >
            음정
          </button>
          <button 
            class="tab"
            class:tab-active={selectedAnalysisTab === 'timing'}
            on:click={() => selectAnalysisTab('timing')}
          >
            타이밍
          </button>
          <button 
            class="tab"
            class:tab-active={selectedAnalysisTab === 'style'}
            on:click={() => selectAnalysisTab('style')}
          >
            스타일
          </button>
          <button 
            class="tab"
            class:tab-active={selectedAnalysisTab === 'technique'}
            on:click={() => selectAnalysisTab('technique')}
          >
            테크닉
          </button>
        </div>
        
        <!-- 분석 내용 -->
        <div class="analysis-content">
          {#if selectedAnalysisTab === 'pitch'}
            <div class="analysis-section">
              <h3 class="section-title">
                <Target size={20} />
                음정 정확도
              </h3>
              
              {#if realtimeFeedback?.pitch}
                <div class="accuracy-meter">
                  <div class="radial-progress text-primary" style="--value:{calculatePitchAccuracy()};">
                    {calculatePitchAccuracy()}%
                  </div>
                </div>
                
                <div class="pitch-details">
                  <div class="detail-row">
                    <span>감지된 음:</span>
                    <span class="font-mono">{realtimeFeedback.pitch.detected}Hz</span>
                  </div>
                  <div class="detail-row">
                    <span>목표 음:</span>
                    <span class="font-mono">{realtimeFeedback.pitch.expected}Hz</span>
                  </div>
                  <div class="detail-row">
                    <span>차이:</span>
                    <span class="font-mono">{realtimeFeedback.pitch.cents} cents</span>
                  </div>
                </div>
              {:else}
                <p class="text-sm text-base-content/60">
                  연주를 시작하면 실시간 피드백이 표시됩니다
                </p>
              {/if}
            </div>
          {/if}
          
          {#if selectedAnalysisTab === 'timing'}
            <div class="analysis-section">
              <h3 class="section-title">
                <Clock size={20} />
                타이밍 분석
              </h3>
              
              {#if realtimeFeedback?.timing}
                <div class="accuracy-meter">
                  <div class="radial-progress text-secondary" style="--value:{calculateTimingAccuracy()};">
                    {calculateTimingAccuracy()}%
                  </div>
                </div>
                
                <div class="timing-details">
                  <div class="detail-row">
                    <span>오프셋:</span>
                    <span class="font-mono">{realtimeFeedback.timing.offset}ms</span>
                  </div>
                  <div class="detail-row">
                    <span>상태:</span>
                    <span class="badge badge-sm">
                      {#if realtimeFeedback.timing.classification === 'early'}
                        빠름
                      {:else if realtimeFeedback.timing.classification === 'late'}
                        느림
                      {:else}
                        정확
                      {/if}
                    </span>
                  </div>
                </div>
              {:else}
                <p class="text-sm text-base-content/60">
                  타이밍 분석 대기 중...
                </p>
              {/if}
            </div>
          {/if}
          
          {#if selectedAnalysisTab === 'style'}
            <div class="analysis-section">
              <h3 class="section-title">
                <Brain size={20} />
                스타일 분석
              </h3>
              
              {#if styleAnalysis}
                <div class="style-results">
                  <div class="primary-style">
                    <span class="label">주요 스타일:</span>
                    <span class="value">{styleAnalysis.primaryStyle}</span>
                    <div class="confidence-bar">
                      <div 
                        class="confidence-fill"
                        style="width: {styleAnalysis.confidence}%"
                      ></div>
                    </div>
                  </div>
                  
                  {#if styleAnalysis.matchedLegends}
                    <div class="legends-section">
                      <h4 class="subsection-title">유사한 레전드</h4>
                      {#each styleAnalysis.matchedLegends as legend}
                        <div class="legend-match">
                          <Guitar size={16} />
                          <span>{legend.name}</span>
                          <span class="similarity">{legend.similarity}%</span>
                        </div>
                      {/each}
                    </div>
                  {/if}
                  
                  {#if styleAnalysis.recommendations}
                    <div class="recommendations">
                      <h4 class="subsection-title">추천사항</h4>
                      <ul class="recommendation-list">
                        {#each styleAnalysis.recommendations as rec}
                          <li>{rec}</li>
                        {/each}
                      </ul>
                    </div>
                  {/if}
                </div>
              {:else}
                <p class="text-sm text-base-content/60">
                  스타일 분석 중...
                </p>
              {/if}
            </div>
          {/if}
          
          {#if selectedAnalysisTab === 'technique'}
            <div class="analysis-section">
              <h3 class="section-title">
                <Guitar size={20} />
                테크닉 감지
              </h3>
              
              {#if styleAnalysis?.techniques}
                <div class="techniques-list">
                  {#each styleAnalysis.techniques as technique}
                    <div class="technique-item">
                      <div class="technique-name">{technique.name}</div>
                      <div class="technique-info">
                        <span class="timestamp">{formatTime(technique.timestamp)}</span>
                        <span class="confidence">{technique.confidence}%</span>
                      </div>
                    </div>
                  {/each}
                </div>
              {:else}
                <p class="text-sm text-base-content/60">
                  테크닉 분석 대기 중...
                </p>
              {/if}
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
  
  <!-- 설정 모달 -->
  <dialog id="settings-modal" class="modal">
    <div class="modal-box">
      <h3 class="font-bold text-lg">뷰어 설정</h3>
      
      <div class="py-4 space-y-4">
        <div class="form-control">
          <label class="label cursor-pointer">
            <span class="label-text">표준 악보 표시</span>
            <input type="checkbox" bind:checked={showNotation} class="checkbox checkbox-primary" />
          </label>
        </div>
        
        <div class="form-control">
          <label class="label cursor-pointer">
            <span class="label-text">기타 탭 표시</span>
            <input type="checkbox" bind:checked={showTabs} class="checkbox checkbox-primary" />
          </label>
        </div>
        
        <div class="form-control">
          <label class="label cursor-pointer">
            <span class="label-text">가사 표시</span>
            <input type="checkbox" bind:checked={showLyrics} class="checkbox" />
          </label>
        </div>
        
        <div class="divider">재생 설정</div>
        
        <div class="form-control">
          <label class="label">
            <span class="label-text">메트로놈</span>
            <input type="checkbox" class="toggle toggle-primary" />
          </label>
        </div>
        
        <div class="form-control">
          <label class="label">
            <span class="label-text">카운트인</span>
            <input type="checkbox" class="toggle toggle-primary" />
          </label>
        </div>
        
        <div class="form-control">
          <label class="label">
            <span class="label-text">루프 모드</span>
            <input type="checkbox" class="toggle" />
          </label>
        </div>
      </div>
      
      <div class="modal-action">
        <form method="dialog">
          <button class="btn">닫기</button>
        </form>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
</div>

<style>
  .viewer-page {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: #f3f4f6;
  }
  
  .header-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    background: white;
    border-bottom: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }
  
  .toolbar-left,
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .song-info {
    display: flex;
    flex-direction: column;
    padding: 0 16px;
    border-left: 1px solid #e5e7eb;
    margin-left: 8px;
  }
  
  .main-content {
    flex: 1;
    display: flex;
    overflow: hidden;
    padding: 20px;
    gap: 20px;
  }
  
  .viewer-container {
    flex: 1;
    display: flex;
    transition: margin-right 0.3s ease;
  }
  
  .viewer-container.with-sidebar {
    margin-right: 0;
  }
  
  .analysis-sidebar {
    width: 320px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .tabs {
    padding: 12px;
    background: #f8f9fa;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .analysis-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
  }
  
  .analysis-section {
    margin-bottom: 24px;
  }
  
  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 16px;
    color: #1f2937;
  }
  
  .subsection-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #6b7280;
    margin: 12px 0 8px 0;
  }
  
  .accuracy-meter {
    display: flex;
    justify-content: center;
    margin: 20px 0;
  }
  
  .radial-progress {
    --size: 120px;
    --thickness: 8px;
    width: var(--size);
    height: var(--size);
    border-radius: 50%;
    position: relative;
    display: inline-grid;
    place-content: center;
    font-size: 1.5rem;
    font-weight: bold;
  }
  
  .radial-progress::before {
    content: "";
    position: absolute;
    height: 100%;
    width: 100%;
    background: conic-gradient(
      currentColor calc(var(--value) * 1%),
      transparent 0
    );
    border-radius: 50%;
    mask: radial-gradient(
      farthest-side,
      transparent calc(100% - var(--thickness)),
      black calc(100% - var(--thickness))
    );
    -webkit-mask: radial-gradient(
      farthest-side,
      transparent calc(100% - var(--thickness)),
      black calc(100% - var(--thickness))
    );
  }
  
  .detail-row {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    font-size: 0.875rem;
    border-bottom: 1px solid #f3f4f6;
  }
  
  .detail-row:last-child {
    border-bottom: none;
  }
  
  .confidence-bar {
    height: 8px;
    background: #e5e7eb;
    border-radius: 4px;
    margin-top: 8px;
    overflow: hidden;
  }
  
  .confidence-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
    transition: width 0.3s ease;
  }
  
  .legend-match {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    background: #f8f9fa;
    border-radius: 6px;
    margin-bottom: 8px;
  }
  
  .legend-match .similarity {
    margin-left: auto;
    font-weight: 600;
    color: #3b82f6;
  }
  
  .recommendation-list {
    list-style: none;
    padding: 0;
  }
  
  .recommendation-list li {
    padding: 8px 0;
    padding-left: 20px;
    position: relative;
    font-size: 0.875rem;
    color: #4b5563;
  }
  
  .recommendation-list li::before {
    content: "→";
    position: absolute;
    left: 0;
    color: #3b82f6;
  }
  
  .technique-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    background: #f8f9fa;
    border-radius: 6px;
    margin-bottom: 8px;
  }
  
  .technique-name {
    font-weight: 500;
    color: #1f2937;
  }
  
  .technique-info {
    display: flex;
    gap: 12px;
    font-size: 0.875rem;
  }
  
  .timestamp {
    color: #6b7280;
  }
  
  .confidence {
    color: #3b82f6;
    font-weight: 500;
  }
  
  /* 반응형 디자인 */
  @media (max-width: 1024px) {
    .analysis-sidebar {
      position: fixed;
      right: 0;
      top: 64px;
      height: calc(100vh - 64px);
      z-index: 40;
      transform: translateX(100%);
      transition: transform 0.3s ease;
    }
    
    .analysis-sidebar.show {
      transform: translateX(0);
    }
  }
  
  @media (max-width: 640px) {
    .header-toolbar {
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .song-info {
      width: 100%;
      border-left: none;
      border-top: 1px solid #e5e7eb;
      padding-top: 8px;
      margin-left: 0;
      margin-top: 8px;
    }
    
    .main-content {
      padding: 10px;
    }
    
    .analysis-sidebar {
      width: 100%;
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