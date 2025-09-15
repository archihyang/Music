<script lang="ts">
  import { onMount } from 'svelte';
  import Container from '$lib/components/layout/Container.svelte';
  import Section from '$lib/components/layout/Section.svelte';
  import Grid from '$lib/components/layout/Grid.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import ProfessionalNotationViewer from '$lib/components/ProfessionalNotationViewer.svelte';
  import AlphaTabViewer from '$lib/components/AlphaTabViewer.svelte';
  import { actualTheme } from '$lib/stores/theme';
  
  // Sample music data for demonstration
  const sampleMusicData = {
    title: "Sample Score",
    keySignature: "C",
    timeSignature: "4/4",
    tempo: 120,
    measures: [
      {
        notes: [
          { keys: ['c/4'], duration: 'q' },
          { keys: ['d/4'], duration: 'q' },
          { keys: ['e/4'], duration: 'q' },
          { keys: ['f/4'], duration: 'q' }
        ]
      },
      {
        notes: [
          { keys: ['g/4'], duration: 'h' },
          { keys: ['a/4'], duration: 'h' }
        ]
      }
    ]
  };
  
  const features = [
    {
      icon: '🎼',
      title: 'AI 기반 전사',
      description: 'YouTube 영상이나 오디오 파일을 자동으로 악보와 Tab으로 변환합니다.',
      color: 'primary'
    },
    {
      icon: '🎸',
      title: '전설적인 스타일 분석',
      description: '70-80년대 기타 거장들의 연주 스타일을 AI가 분석하고 학습합니다.',
      color: 'secondary'
    },
    {
      icon: '📚',
      title: '체계적인 학습',
      description: '개인 맞춤형 커리큘럼과 실시간 피드백으로 효과적인 학습을 지원합니다.',
      color: 'success'
    },
    {
      icon: '🎵',
      title: '전문가급 악보',
      description: 'PDF 수준의 고품질 악보 렌더링과 다양한 내보내기 옵션을 제공합니다.',
      color: 'warning'
    }
  ];
  
  const legendaryGuitarists = [
    { name: 'Jimi Hendrix', era: '60s-70s', style: 'Psychedelic Rock' },
    { name: 'Jimmy Page', era: '70s', style: 'Hard Rock' },
    { name: 'Eric Clapton', era: '60s-70s', style: 'Blues Rock' },
    { name: 'David Gilmour', era: '70s-80s', style: 'Progressive Rock' },
    { name: 'Carlos Santana', era: '70s-80s', style: 'Latin Rock' },
    { name: 'Mark Knopfler', era: '70s-80s', style: 'Rock' }
  ];
  
  const stats = [
    { label: '전사 정확도', value: '95%', icon: '🎯' },
    { label: '지원 악기', value: '10+', icon: '🎸' },
    { label: '학습 트랙', value: '1000+', icon: '📖' },
    { label: '활성 사용자', value: '10K+', icon: '👥' }
  ];
  
  let showNotation = false;
  let showTab = false;
  
  onMount(() => {
    // Animation triggers
    setTimeout(() => {
      showNotation = true;
    }, 500);
    
    setTimeout(() => {
      showTab = true;
    }, 1000);
  });
</script>

<svelte:head>
  <title>Genesis Music - AI 기반 전문 기타 학습 플랫폼</title>
  <meta name="description" content="YouTube 영상을 악보로 변환하고 70-80년대 기타 거장들의 스타일을 학습하세요" />
</svelte:head>

<!-- Hero Section -->
<Section spacing="xl" background="gradient" fullHeight centerContent>
  <Container>
    <div class="hero-content">
      <h1 class="hero-title">
        <span class="gradient-text">Genesis Music</span>
      </h1>
      <p class="hero-subtitle">
        AI가 만드는 당신만의 기타 학습 여정
      </p>
      <p class="hero-description">
        YouTube 영상을 즉시 악보로 변환하고, 전설적인 기타리스트들의 스타일을 마스터하세요
      </p>
      
      <div class="hero-actions">
        <Button size="lg" variant="primary" on:click={() => window.location.href = '/upload'}>
          시작하기
        </Button>
        <Button size="lg" variant="ghost" on:click={() => window.location.href = '/demo'}>
          데모 보기
        </Button>
      </div>
      
      <div class="hero-stats">
        {#each stats as stat}
          <div class="stat-item">
            <span class="stat-icon">{stat.icon}</span>
            <span class="stat-value">{stat.value}</span>
            <span class="stat-label">{stat.label}</span>
          </div>
        {/each}
      </div>
    </div>
  </Container>
</Section>

<!-- Features Section -->
<Section spacing="lg" background="white">
  <Container>
    <div class="section-header">
      <h2 class="section-title">핵심 기능</h2>
      <p class="section-subtitle">전문가를 위한 완벽한 기타 학습 도구</p>
    </div>
    
    <Grid cols={{ xs: 1, md: 2, lg: 4 }} gap={6}>
      {#each features as feature}
        <Card 
          variant="elevated" 
          hoverable 
          class="feature-card"
        >
          <div class="feature-icon {feature.color}">
            {feature.icon}
          </div>
          <h3 class="feature-title">{feature.title}</h3>
          <p class="feature-description">{feature.description}</p>
        </Card>
      {/each}
    </Grid>
  </Container>
</Section>

<!-- Notation Demo Section -->
<Section spacing="lg" background="gray">
  <Container>
    <div class="section-header">
      <h2 class="section-title">전문가급 악보 렌더링</h2>
      <p class="section-subtitle">출판 품질의 악보와 Tab을 경험하세요</p>
    </div>
    
    <Grid cols={{ xs: 1, lg: 2 }} gap={8}>
      <div class="demo-card">
        <h3 class="demo-title">🎼 오선 악보 (Standard Notation)</h3>
        {#if showNotation}
          <ProfessionalNotationViewer 
            musicData={sampleMusicData}
            theme={$actualTheme}
            showTab={false}
          />
        {/if}
      </div>
      
      <div class="demo-card">
        <h3 class="demo-title">🎸 기타 Tab (Guitar Tablature)</h3>
        {#if showTab}
          <AlphaTabViewer 
            theme={$actualTheme}
            scoreData={`
              \\title "Sample Tab"
              \\tempo 120
              .
              :4 5.3 7.3 5.3 7.3 | 5.2 7.2 5.2 7.2
            `}
          />
        {/if}
      </div>
    </Grid>
  </Container>
</Section>

<!-- Legendary Guitarists Section -->
<Section spacing="lg" background="white">
  <Container>
    <div class="section-header">
      <h2 class="section-title">전설적인 기타리스트 스타일 분석</h2>
      <p class="section-subtitle">AI가 분석한 거장들의 연주 비법을 배워보세요</p>
    </div>
    
    <Grid cols={{ xs: 1, sm: 2, md: 3 }} gap={6}>
      {#each legendaryGuitarists as guitarist}
        <Card variant="bordered" hoverable class="guitarist-card">
          <div class="guitarist-avatar">
            🎸
          </div>
          <h3 class="guitarist-name">{guitarist.name}</h3>
          <p class="guitarist-era">{guitarist.era}</p>
          <p class="guitarist-style">{guitarist.style}</p>
          <Button size="sm" variant="ghost" fullWidth>
            스타일 분석 보기
          </Button>
        </Card>
      {/each}
    </Grid>
  </Container>
</Section>

<!-- CTA Section -->
<Section spacing="xl" background="gradient">
  <Container>
    <div class="cta-content">
      <h2 class="cta-title">지금 시작하세요</h2>
      <p class="cta-description">
        무료로 가입하고 첫 곡을 악보로 변환해보세요
      </p>
      <div class="cta-actions">
        <Button size="lg" variant="primary">
          무료 가입
        </Button>
        <Button size="lg" variant="secondary">
          더 알아보기
        </Button>
      </div>
    </div>
  </Container>
</Section>

<style>
  /* Hero Section */
  .hero-content {
    text-align: center;
    max-width: 800px;
    margin: 0 auto;
  }
  
  .hero-title {
    font-size: clamp(3rem, 8vw, 5rem);
    font-weight: 800;
    margin-bottom: 1.5rem;
    line-height: 1.1;
  }
  
  .gradient-text {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .hero-subtitle {
    font-size: clamp(1.5rem, 4vw, 2rem);
    color: var(--text-secondary);
    margin-bottom: 1rem;
  }
  
  .hero-description {
    font-size: 1.125rem;
    color: var(--text-tertiary);
    margin-bottom: 2rem;
    line-height: 1.6;
  }
  
  .hero-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-bottom: 3rem;
  }
  
  .hero-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 2rem;
    margin-top: 3rem;
  }
  
  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
  
  .stat-icon {
    font-size: 2rem;
  }
  
  .stat-value {
    font-size: 2rem;
    font-weight: 700;
    color: var(--text-primary);
  }
  
  .stat-label {
    font-size: 0.875rem;
    color: var(--text-tertiary);
  }
  
  /* Section Headers */
  .section-header {
    text-align: center;
    margin-bottom: 3rem;
  }
  
  .section-title {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
    color: var(--text-primary);
  }
  
  .section-subtitle {
    font-size: 1.25rem;
    color: var(--text-secondary);
  }
  
  /* Feature Cards */
  .feature-card {
    text-align: center;
    padding: 2rem;
    transition: transform 0.3s;
  }
  
  :global(.feature-card:hover) {
    transform: translateY(-4px);
  }
  
  .feature-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }
  
  .feature-icon.primary { color: #0ea5e9; }
  .feature-icon.secondary { color: #ea4444; }
  .feature-icon.success { color: #10b981; }
  .feature-icon.warning { color: #f59e0b; }
  
  .feature-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
    color: var(--text-primary);
  }
  
  .feature-description {
    color: var(--text-secondary);
    line-height: 1.5;
  }
  
  /* Demo Section */
  .demo-card {
    background: white;
    border-radius: 0.75rem;
    padding: 1.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  }
  
  .demo-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    color: var(--text-primary);
  }
  
  /* Guitarist Cards */
  .guitarist-card {
    text-align: center;
    padding: 1.5rem;
  }
  
  .guitarist-avatar {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    margin: 0 auto 1rem;
  }
  
  .guitarist-name {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--text-primary);
  }
  
  .guitarist-era {
    font-size: 0.875rem;
    color: var(--text-tertiary);
    margin-bottom: 0.25rem;
  }
  
  .guitarist-style {
    font-size: 1rem;
    color: var(--text-secondary);
    margin-bottom: 1rem;
  }
  
  /* CTA Section */
  .cta-content {
    text-align: center;
    max-width: 600px;
    margin: 0 auto;
  }
  
  .cta-title {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
    color: white;
  }
  
  .cta-description {
    font-size: 1.25rem;
    margin-bottom: 2rem;
    color: rgba(255, 255, 255, 0.9);
  }
  
  .cta-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
  }
  
  /* Dark Mode */
  :global(.dark) .demo-card {
    background: var(--bg-secondary);
  }
  
  :global(.dark) .gradient-text {
    background: linear-gradient(135deg, #7dd3fc 0%, #a78bfa 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    .hero-actions {
      flex-direction: column;
      align-items: center;
    }
    
    .hero-stats {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .cta-actions {
      flex-direction: column;
      align-items: center;
    }
  }
</style>