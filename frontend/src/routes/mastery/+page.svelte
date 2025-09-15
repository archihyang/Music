<script>
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import SongRecommendations from '../../components/SongRecommendations.svelte';
  import PracticeModules from '../../components/PracticeModules.svelte';
  
  let activeTab = 'songs';
  let userStats = {
    totalPracticeTime: 0,
    songsCompleted: 0,
    currentStreak: 0,
    level: '초급'
  };
  
  async function loadUserStats() {
    // TODO: 실제 사용자 통계 로드
    userStats = {
      totalPracticeTime: 1240,
      songsCompleted: 12,
      currentStreak: 5,
      level: '중급'
    };
  }
  
  onMount(loadUserStats);
</script>

<svelte:head>
  <title>Genesis Music - Guitar Mastery System</title>
</svelte:head>

<main class="mastery-page">
  <!-- Hero Section -->
  <section class="hero-section" in:fade>
    <div class="hero-content">
      <h1 class="hero-title">
        <span class="title-line1">Guitar Mastery</span>
        <span class="title-line2">System</span>
      </h1>
      <p class="hero-subtitle">
        70-80년대 전설의 기타리스트들처럼 연주하세요
      </p>
      
      <!-- User Stats -->
      <div class="user-stats">
        <div class="stat-item">
          <span class="stat-value">{userStats.totalPracticeTime}</span>
          <span class="stat-label">연습 시간(분)</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{userStats.songsCompleted}</span>
          <span class="stat-label">완료한 곡</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{userStats.currentStreak}</span>
          <span class="stat-label">연속 연습(일)</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{userStats.level}</span>
          <span class="stat-label">현재 레벨</span>
        </div>
      </div>
    </div>
    
    <div class="hero-visual">
      <div class="guitar-icon">🎸</div>
    </div>
  </section>
  
  <!-- Navigation Tabs -->
  <nav class="tabs-nav">
    <button 
      class="tab-btn {activeTab === 'songs' ? 'active' : ''}"
      on:click={() => activeTab = 'songs'}
    >
      <span class="tab-icon">🎵</span>
      <span>곡 추천</span>
    </button>
    <button 
      class="tab-btn {activeTab === 'practice' ? 'active' : ''}"
      on:click={() => activeTab = 'practice'}
    >
      <span class="tab-icon">🎯</span>
      <span>연습 모듈</span>
    </button>
    <button 
      class="tab-btn {activeTab === 'progress' ? 'active' : ''}"
      on:click={() => activeTab = 'progress'}
    >
      <span class="tab-icon">📊</span>
      <span>학습 경로</span>
    </button>
    <button 
      class="tab-btn {activeTab === 'community' ? 'active' : ''}"
      on:click={() => activeTab = 'community'}
    >
      <span class="tab-icon">👥</span>
      <span>커뮤니티</span>
    </button>
  </nav>
  
  <!-- Tab Content -->
  <div class="tab-content">
    {#if activeTab === 'songs'}
      <div in:fly={{ y: 20, duration: 300 }}>
        <SongRecommendations />
      </div>
    {:else if activeTab === 'practice'}
      <div in:fly={{ y: 20, duration: 300 }}>
        <PracticeModules />
      </div>
    {:else if activeTab === 'progress'}
      <div class="learning-paths" in:fly={{ y: 20, duration: 300 }}>
        <h2 class="section-title">🎯 학습 경로</h2>
        <div class="paths-grid">
          <div class="path-card">
            <h3>🎸 클래식 록 입문</h3>
            <p>60일 과정 • 초급</p>
            <div class="path-progress">
              <div class="progress-bar">
                <div class="progress-fill" style="width: 35%"></div>
              </div>
              <span>35% 완료</span>
            </div>
            <button class="continue-btn">계속하기</button>
          </div>
          
          <div class="path-card">
            <h3>🔥 Led Zeppelin 완전정복</h3>
            <p>120일 과정 • 고급</p>
            <div class="path-progress">
              <div class="progress-bar">
                <div class="progress-fill" style="width: 0%"></div>
              </div>
              <span>시작하기</span>
            </div>
            <button class="start-btn">시작하기</button>
          </div>
          
          <div class="path-card">
            <h3>💙 Blues Rock 솔로잉</h3>
            <p>90일 과정 • 중급</p>
            <div class="path-progress">
              <div class="progress-bar">
                <div class="progress-fill" style="width: 60%"></div>
              </div>
              <span>60% 완료</span>
            </div>
            <button class="continue-btn">계속하기</button>
          </div>
        </div>
      </div>
    {:else if activeTab === 'community'}
      <div class="community-section" in:fly={{ y: 20, duration: 300 }}>
        <h2 class="section-title">👥 커뮤니티</h2>
        <div class="community-features">
          <div class="feature-card">
            <h3>🏆 이번 주 챌린지</h3>
            <p>Stairway to Heaven - Intro 마스터하기</p>
            <button class="join-btn">참가하기</button>
          </div>
          <div class="feature-card">
            <h3>📹 연주 공유</h3>
            <p>다른 사용자들의 연주를 보고 피드백을 나누세요</p>
            <button class="browse-btn">둘러보기</button>
          </div>
          <div class="feature-card">
            <h3>💬 포럼</h3>
            <p>기타 테크닉과 장비에 대해 토론하세요</p>
            <button class="forum-btn">포럼 가기</button>
          </div>
        </div>
      </div>
    {/if}
  </div>
</main>

<style>
  .mastery-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
  }
  
  .hero-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4rem 2rem;
    max-width: 1400px;
    margin: 0 auto;
  }
  
  .hero-content {
    flex: 1;
  }
  
  .hero-title {
    font-family: 'Bebas Neue', sans-serif;
    margin-bottom: 1rem;
  }
  
  .title-line1 {
    display: block;
    font-size: 3rem;
    color: #ff6b35;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
  
  .title-line2 {
    display: block;
    font-size: 5rem;
    color: white;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    text-shadow: 0 4px 8px rgba(0,0,0,0.3);
  }
  
  .hero-subtitle {
    font-size: 1.25rem;
    color: #aaa;
    margin-bottom: 2rem;
  }
  
  .user-stats {
    display: flex;
    gap: 2rem;
    padding: 1.5rem;
    background: rgba(255,255,255,0.05);
    border-radius: 12px;
    backdrop-filter: blur(10px);
  }
  
  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .stat-value {
    font-size: 1.75rem;
    font-weight: bold;
    color: #ff6b35;
  }
  
  .stat-label {
    font-size: 0.875rem;
    color: #999;
    margin-top: 0.25rem;
  }
  
  .hero-visual {
    flex: 0 0 300px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .guitar-icon {
    font-size: 10rem;
    animation: float 3s ease-in-out infinite;
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  
  .tabs-nav {
    display: flex;
    justify-content: center;
    gap: 1rem;
    padding: 0 2rem;
    margin-bottom: 2rem;
  }
  
  .tab-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: rgba(255,255,255,0.05);
    border: 2px solid transparent;
    border-radius: 12px;
    color: #999;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .tab-btn:hover {
    background: rgba(255,255,255,0.1);
    color: white;
  }
  
  .tab-btn.active {
    background: linear-gradient(135deg, #ff6b35 0%, #f72c00 100%);
    color: white;
    border-color: transparent;
  }
  
  .tab-icon {
    font-size: 1.25rem;
  }
  
  .tab-content {
    min-height: 60vh;
    background: white;
    border-radius: 24px 24px 0 0;
    padding: 2rem 0;
  }
  
  .section-title {
    font-size: 2rem;
    font-weight: bold;
    text-align: center;
    margin-bottom: 2rem;
    color: #1a1a1a;
  }
  
  .learning-paths {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .paths-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
  }
  
  .path-card {
    background: white;
    border: 2px solid #e5e5e5;
    border-radius: 12px;
    padding: 1.5rem;
    transition: all 0.3s ease;
  }
  
  .path-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0,0,0,0.1);
  }
  
  .path-card h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
  }
  
  .path-card p {
    color: #666;
    margin-bottom: 1rem;
  }
  
  .path-progress {
    margin-bottom: 1rem;
  }
  
  .progress-bar {
    height: 8px;
    background: #f0f0f0;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #ff6b35, #f72c00);
    transition: width 0.3s ease;
  }
  
  .continue-btn, .start-btn {
    width: 100%;
    padding: 0.75rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .continue-btn {
    background: linear-gradient(135deg, #ff6b35 0%, #f72c00 100%);
    color: white;
  }
  
  .start-btn {
    background: #f0f0f0;
    color: #333;
  }
  
  .continue-btn:hover, .start-btn:hover {
    transform: scale(1.02);
  }
  
  .community-section {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .community-features {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }
  
  .feature-card {
    background: white;
    border: 2px solid #e5e5e5;
    border-radius: 12px;
    padding: 1.5rem;
    text-align: center;
  }
  
  .feature-card h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
  }
  
  .feature-card p {
    color: #666;
    margin-bottom: 1rem;
  }
  
  .join-btn, .browse-btn, .forum-btn {
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #ff6b35 0%, #f72c00 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .join-btn:hover, .browse-btn:hover, .forum-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
  }
  
  @media (max-width: 768px) {
    .hero-section {
      flex-direction: column;
      text-align: center;
    }
    
    .title-line1 {
      font-size: 2rem;
    }
    
    .title-line2 {
      font-size: 3rem;
    }
    
    .user-stats {
      flex-wrap: wrap;
      justify-content: center;
    }
    
    .tabs-nav {
      overflow-x: auto;
    }
    
    .paths-grid,
    .community-features {
      grid-template-columns: 1fr;
    }
  }
</style>