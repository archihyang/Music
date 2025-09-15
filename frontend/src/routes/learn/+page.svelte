<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { 
    BookOpen, 
    Trophy,
    Target,
    TrendingUp,
    Clock,
    Calendar,
    Award,
    Zap,
    Music,
    Guitar,
    Play,
    CheckCircle,
    Circle,
    Lock,
    Star
  } from 'lucide-svelte';
  
  // 학습 데이터
  let learningProgress = {
    totalPracticeTime: 1234, // 분
    currentStreak: 7, // 일
    longestStreak: 15,
    completedLessons: 24,
    totalLessons: 50,
    level: 5,
    experience: 2450,
    nextLevelExp: 3000
  };
  
  // 코스 데이터
  let courses = [
    {
      id: 'beginner',
      title: '초급 기타 마스터',
      description: '기초 코드와 스트러밍 패턴을 배웁니다',
      progress: 80,
      lessons: 20,
      completedLessons: 16,
      difficulty: 'beginner',
      icon: '🎸',
      locked: false
    },
    {
      id: 'intermediate',
      title: '중급 테크닉',
      description: '핑거스타일과 리드 기타 기초',
      progress: 45,
      lessons: 25,
      completedLessons: 11,
      difficulty: 'intermediate',
      icon: '🎵',
      locked: false
    },
    {
      id: 'advanced',
      title: '고급 솔로잉',
      description: '스케일과 즉흥 연주 마스터',
      progress: 10,
      lessons: 30,
      completedLessons: 3,
      difficulty: 'advanced',
      icon: '🔥',
      locked: false
    },
    {
      id: 'legends',
      title: '레전드 스타일',
      description: '70-80년대 기타 레전드들의 테크닉',
      progress: 0,
      lessons: 20,
      completedLessons: 0,
      difficulty: 'master',
      icon: '👑',
      locked: true,
      unlockLevel: 10
    }
  ];
  
  // 오늘의 연습
  let dailyPractice = [
    {
      id: '1',
      title: 'C 메이저 스케일',
      duration: 10,
      completed: true,
      type: 'scale',
      points: 50
    },
    {
      id: '2',
      title: 'G-C-D 코드 진행',
      duration: 15,
      completed: true,
      type: 'chord',
      points: 75
    },
    {
      id: '3',
      title: '16비트 스트러밍 패턴',
      duration: 20,
      completed: false,
      type: 'rhythm',
      points: 100
    },
    {
      id: '4',
      title: '벤딩 테크닉',
      duration: 15,
      completed: false,
      type: 'technique',
      points: 75
    }
  ];
  
  // 업적
  let achievements = [
    {
      id: 'first_song',
      title: '첫 곡 완주',
      description: '첫 번째 곡을 끝까지 연주했습니다',
      icon: '🎵',
      unlocked: true,
      date: new Date('2024-01-10')
    },
    {
      id: 'week_streak',
      title: '일주일 연속 연습',
      description: '7일 연속으로 연습했습니다',
      icon: '🔥',
      unlocked: true,
      date: new Date('2024-01-15')
    },
    {
      id: 'perfect_score',
      title: '퍼펙트 스코어',
      description: '100% 정확도로 곡을 연주했습니다',
      icon: '⭐',
      unlocked: false,
      progress: 95
    },
    {
      id: 'speed_demon',
      title: '스피드 데몬',
      description: 'BPM 200 이상으로 연주했습니다',
      icon: '⚡',
      unlocked: false,
      progress: 180
    }
  ];
  
  // 추천 레슨
  let recommendedLessons = [
    {
      id: '1',
      title: '파워 코드 마스터하기',
      instructor: 'AI Coach',
      duration: 30,
      difficulty: 'intermediate',
      rating: 4.8,
      students: 1234
    },
    {
      id: '2',
      title: '블루스 스케일 입문',
      instructor: 'AI Coach',
      duration: 25,
      difficulty: 'intermediate',
      rating: 4.9,
      students: 892
    },
    {
      id: '3',
      title: '핑거피킹 기초',
      instructor: 'AI Coach',
      duration: 35,
      difficulty: 'beginner',
      rating: 4.7,
      students: 2341
    }
  ];
  
  // 주간 연습 통계
  let weeklyStats = [
    { day: '월', minutes: 30 },
    { day: '화', minutes: 45 },
    { day: '수', minutes: 20 },
    { day: '목', minutes: 60 },
    { day: '금', minutes: 40 },
    { day: '토', minutes: 55 },
    { day: '일', minutes: 35 }
  ];
  
  // 코스 시작
  function startCourse(course: any) {
    if (course.locked) {
      alert(`레벨 ${course.unlockLevel}에 도달하면 잠금 해제됩니다.`);
      return;
    }
    goto(`/learn/course/${course.id}`);
  }
  
  // 일일 연습 시작
  function startDailyPractice(practice: any) {
    goto(`/learn/practice/${practice.id}`);
  }
  
  // 레슨 시작
  function startLesson(lesson: any) {
    goto(`/learn/lesson/${lesson.id}`);
  }
  
  // 시간 포맷
  function formatPracticeTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}시간 ${mins}분`;
    }
    return `${mins}분`;
  }
  
  // 경험치 퍼센트 계산
  $: expProgress = ((learningProgress.experience - (learningProgress.level - 1) * 500) / 
                    (learningProgress.nextLevelExp - (learningProgress.level - 1) * 500)) * 100;
  
  // 일일 연습 진행률
  $: dailyProgress = (dailyPractice.filter(p => p.completed).length / dailyPractice.length) * 100;
  
  // 최대 주간 연습 시간
  $: maxWeeklyMinutes = Math.max(...weeklyStats.map(s => s.minutes));
  
  onMount(() => {
    // 학습 데이터 로드
    loadLearningData();
  });
  
  async function loadLearningData() {
    // API에서 학습 데이터 로드
    // 구현 예정
  }
</script>

<svelte:head>
  <title>학습 - Genesis Music</title>
  <meta name="description" content="체계적인 기타 학습 프로그램" />
</svelte:head>

<div class="learn-page">
  <!-- 헤더 섹션 -->
  <div class="learn-header">
    <div class="header-content">
      <h1 class="page-title">학습 센터</h1>
      <p class="page-subtitle">AI 코치와 함께 체계적으로 기타를 마스터하세요</p>
    </div>
    
    <div class="user-stats">
      <div class="stat-card">
        <div class="stat-icon">
          <Trophy class="text-warning" />
        </div>
        <div class="stat-content">
          <div class="stat-value">레벨 {learningProgress.level}</div>
          <div class="stat-label">현재 레벨</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <Zap class="text-error" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{learningProgress.currentStreak}일</div>
          <div class="stat-label">연속 연습</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <Clock class="text-info" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{formatPracticeTime(learningProgress.totalPracticeTime)}</div>
          <div class="stat-label">총 연습 시간</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <Award class="text-success" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{learningProgress.completedLessons}/{learningProgress.totalLessons}</div>
          <div class="stat-label">완료 레슨</div>
        </div>
      </div>
    </div>
    
    <!-- 경험치 바 -->
    <div class="exp-bar">
      <div class="exp-info">
        <span>경험치</span>
        <span>{learningProgress.experience} / {learningProgress.nextLevelExp} XP</span>
      </div>
      <progress class="progress progress-primary" value={expProgress} max="100"></progress>
    </div>
  </div>
  
  <div class="learn-content">
    <!-- 왼쪽: 메인 콘텐츠 -->
    <div class="main-section">
      <!-- 코스 목록 -->
      <section class="courses-section">
        <h2 class="section-title">
          <BookOpen size={24} />
          학습 코스
        </h2>
        
        <div class="courses-grid">
          {#each courses as course}
            <div 
              class="course-card"
              class:locked={course.locked}
              on:click={() => startCourse(course)}
            >
              <div class="course-header">
                <span class="course-icon">{course.icon}</span>
                {#if course.locked}
                  <Lock size={20} class="lock-icon" />
                {/if}
              </div>
              
              <h3 class="course-title">{course.title}</h3>
              <p class="course-description">{course.description}</p>
              
              <div class="course-meta">
                <span class="badge badge-sm">{course.difficulty}</span>
                <span class="lesson-count">{course.completedLessons}/{course.lessons} 레슨</span>
              </div>
              
              <div class="course-progress">
                <progress class="progress progress-success" value={course.progress} max="100"></progress>
                <span class="progress-text">{course.progress}%</span>
              </div>
              
              {#if course.locked}
                <div class="unlock-info">
                  레벨 {course.unlockLevel} 필요
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </section>
      
      <!-- 추천 레슨 -->
      <section class="recommended-section">
        <h2 class="section-title">
          <Target size={24} />
          추천 레슨
        </h2>
        
        <div class="lessons-list">
          {#each recommendedLessons as lesson}
            <div class="lesson-card" on:click={() => startLesson(lesson)}>
              <div class="lesson-thumbnail">
                <Guitar size={32} />
              </div>
              
              <div class="lesson-content">
                <h4 class="lesson-title">{lesson.title}</h4>
                <div class="lesson-meta">
                  <span class="instructor">{lesson.instructor}</span>
                  <span class="duration">{lesson.duration}분</span>
                  <span class="badge badge-xs">{lesson.difficulty}</span>
                </div>
                <div class="lesson-stats">
                  <div class="rating">
                    <Star size={14} class="text-warning" fill="currentColor" />
                    <span>{lesson.rating}</span>
                  </div>
                  <span class="students">{lesson.students}명 수강</span>
                </div>
              </div>
              
              <button class="btn btn-primary btn-sm">
                시작하기
              </button>
            </div>
          {/each}
        </div>
      </section>
    </div>
    
    <!-- 오른쪽: 사이드바 -->
    <aside class="sidebar">
      <!-- 오늘의 연습 -->
      <section class="daily-practice">
        <h3 class="sidebar-title">
          <Calendar size={20} />
          오늘의 연습
        </h3>
        
        <div class="progress-circle">
          <div class="radial-progress text-primary" style="--value:{dailyProgress};">
            {Math.round(dailyProgress)}%
          </div>
        </div>
        
        <div class="practice-list">
          {#each dailyPractice as practice}
            <div 
              class="practice-item"
              class:completed={practice.completed}
              on:click={() => startDailyPractice(practice)}
            >
              <div class="practice-check">
                {#if practice.completed}
                  <CheckCircle size={20} class="text-success" />
                {:else}
                  <Circle size={20} />
                {/if}
              </div>
              <div class="practice-content">
                <div class="practice-title">{practice.title}</div>
                <div class="practice-meta">
                  <span>{practice.duration}분</span>
                  <span class="points">+{practice.points} XP</span>
                </div>
              </div>
              {#if !practice.completed}
                <Play size={16} class="play-icon" />
              {/if}
            </div>
          {/each}
        </div>
      </section>
      
      <!-- 주간 활동 -->
      <section class="weekly-activity">
        <h3 class="sidebar-title">
          <TrendingUp size={20} />
          주간 활동
        </h3>
        
        <div class="activity-chart">
          {#each weeklyStats as stat}
            <div class="chart-bar">
              <div 
                class="bar-fill"
                style="height: {(stat.minutes / maxWeeklyMinutes) * 100}%"
                class:active={stat.day === '일'}
              ></div>
              <span class="bar-label">{stat.day}</span>
            </div>
          {/each}
        </div>
        
        <div class="activity-summary">
          <div class="summary-item">
            <span>주간 총 연습:</span>
            <span class="font-semibold">{weeklyStats.reduce((a, b) => a + b.minutes, 0)}분</span>
          </div>
          <div class="summary-item">
            <span>일 평균:</span>
            <span class="font-semibold">{Math.round(weeklyStats.reduce((a, b) => a + b.minutes, 0) / 7)}분</span>
          </div>
        </div>
      </section>
      
      <!-- 업적 -->
      <section class="achievements">
        <h3 class="sidebar-title">
          <Award size={20} />
          최근 업적
        </h3>
        
        <div class="achievement-list">
          {#each achievements.slice(0, 3) as achievement}
            <div class="achievement-item" class:locked={!achievement.unlocked}>
              <div class="achievement-icon">{achievement.icon}</div>
              <div class="achievement-content">
                <div class="achievement-title">{achievement.title}</div>
                {#if achievement.unlocked}
                  <div class="achievement-date">
                    {achievement.date?.toLocaleDateString('ko-KR')}
                  </div>
                {:else}
                  <progress 
                    class="progress progress-xs"
                    value={achievement.progress}
                    max="100"
                  ></progress>
                {/if}
              </div>
            </div>
          {/each}
        </div>
        
        <button class="btn btn-sm btn-ghost w-full">
          모든 업적 보기
        </button>
      </section>
    </aside>
  </div>
</div>

<style>
  .learn-page {
    min-height: calc(100vh - 64px);
    background: #f3f4f6;
  }
  
  .learn-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 40px 20px 20px;
  }
  
  .header-content {
    text-align: center;
    margin-bottom: 32px;
  }
  
  .page-title {
    font-size: 2.5rem;
    font-weight: bold;
    margin-bottom: 8px;
  }
  
  .page-subtitle {
    font-size: 1.125rem;
    opacity: 0.9;
  }
  
  .user-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }
  
  .stat-card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .stat-icon {
    width: 48px;
    height: 48px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .stat-value {
    font-size: 1.5rem;
    font-weight: bold;
  }
  
  .stat-label {
    font-size: 0.875rem;
    opacity: 0.9;
  }
  
  .exp-bar {
    max-width: 800px;
    margin: 0 auto;
  }
  
  .exp-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 0.875rem;
  }
  
  .learn-content {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 24px;
    padding: 24px 20px;
    max-width: 1400px;
    margin: 0 auto;
  }
  
  .main-section {
    display: flex;
    flex-direction: column;
    gap: 32px;
  }
  
  .section-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 20px;
    color: #1f2937;
  }
  
  /* 코스 그리드 */
  .courses-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
  }
  
  .course-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
  }
  
  .course-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  }
  
  .course-card.locked {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  .course-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  
  .course-icon {
    font-size: 2rem;
  }
  
  .lock-icon {
    color: #9ca3af;
  }
  
  .course-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 8px;
  }
  
  .course-description {
    color: #6b7280;
    margin-bottom: 16px;
    font-size: 0.875rem;
  }
  
  .course-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    font-size: 0.875rem;
  }
  
  .course-progress {
    position: relative;
  }
  
  .progress-text {
    position: absolute;
    right: 0;
    top: -20px;
    font-size: 0.75rem;
    color: #6b7280;
  }
  
  .unlock-info {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
  }
  
  /* 레슨 리스트 */
  .lessons-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .lesson-card {
    background: white;
    border-radius: 12px;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .lesson-card:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  .lesson-thumbnail {
    width: 60px;
    height: 60px;
    background: #f3f4f6;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #9ca3af;
  }
  
  .lesson-content {
    flex: 1;
  }
  
  .lesson-title {
    font-weight: 600;
    margin-bottom: 4px;
  }
  
  .lesson-meta {
    display: flex;
    gap: 12px;
    font-size: 0.875rem;
    color: #6b7280;
    margin-bottom: 4px;
  }
  
  .lesson-stats {
    display: flex;
    gap: 16px;
    font-size: 0.875rem;
  }
  
  .rating {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  /* 사이드바 */
  .sidebar {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  
  .sidebar > section {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  .sidebar-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 16px;
    color: #1f2937;
  }
  
  /* 일일 연습 */
  .progress-circle {
    display: flex;
    justify-content: center;
    margin: 20px 0;
  }
  
  .radial-progress {
    --size: 120px;
    --thickness: 10px;
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
      #e5e7eb calc(var(--value) * 1%)
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
  
  .practice-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .practice-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .practice-item:hover {
    background: #e5e7eb;
  }
  
  .practice-item.completed {
    opacity: 0.6;
  }
  
  .practice-content {
    flex: 1;
  }
  
  .practice-title {
    font-weight: 500;
    margin-bottom: 2px;
  }
  
  .practice-meta {
    display: flex;
    gap: 8px;
    font-size: 0.75rem;
    color: #6b7280;
  }
  
  .points {
    color: #3b82f6;
    font-weight: 500;
  }
  
  .play-icon {
    color: #3b82f6;
  }
  
  /* 주간 활동 차트 */
  .activity-chart {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    height: 100px;
    margin: 20px 0;
    padding: 0 8px;
  }
  
  .chart-bar {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  
  .bar-fill {
    width: 24px;
    background: #cbd5e1;
    border-radius: 4px 4px 0 0;
    transition: background 0.2s;
  }
  
  .bar-fill.active {
    background: #3b82f6;
  }
  
  .bar-label {
    font-size: 0.75rem;
    color: #6b7280;
  }
  
  .activity-summary {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-top: 12px;
    border-top: 1px solid #e5e7eb;
    font-size: 0.875rem;
  }
  
  .summary-item {
    display: flex;
    justify-content: space-between;
  }
  
  /* 업적 */
  .achievement-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
  }
  
  .achievement-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 8px;
  }
  
  .achievement-item.locked {
    opacity: 0.6;
  }
  
  .achievement-icon {
    font-size: 1.5rem;
  }
  
  .achievement-content {
    flex: 1;
  }
  
  .achievement-title {
    font-weight: 500;
    margin-bottom: 2px;
  }
  
  .achievement-date {
    font-size: 0.75rem;
    color: #6b7280;
  }
  
  /* 반응형 디자인 */
  @media (max-width: 1024px) {
    .learn-content {
      grid-template-columns: 1fr;
    }
    
    .sidebar {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    }
  }
  
  @media (max-width: 640px) {
    .user-stats {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .courses-grid {
      grid-template-columns: 1fr;
    }
  }
</style>