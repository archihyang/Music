<script>
  import { onMount } from 'svelte';
  
  let modules = [];
  let loading = true;
  let selectedCategory = '';
  let selectedDifficulty = '';
  
  const categories = [
    { value: '', label: '모든 카테고리', icon: '📚' },
    { value: 'warmup', label: '손풀기', icon: '🤲' },
    { value: 'scale', label: '스케일', icon: '🎹' },
    { value: 'technique', label: '테크닉', icon: '⚡' },
    { value: 'chord', label: '코드', icon: '🎸' },
    { value: 'phrase', label: '프레이즈', icon: '🎵' },
    { value: 'theory', label: '이론', icon: '📖' },
    { value: 'improvisation', label: '즉흥연주', icon: '🎭' }
  ];
  
  const difficulties = [
    { value: '', label: '모든 난이도' },
    { value: '초급', label: '초급' },
    { value: '중급', label: '중급' },
    { value: '고급', label: '고급' },
    { value: '마스터', label: '마스터' }
  ];
  
  async function fetchModules() {
    loading = true;
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedDifficulty) params.append('difficulty', selectedDifficulty);
      params.append('limit', '20');
      
      const response = await fetch(`http://localhost:3000/api/mastery/practice-modules?${params}`);
      const data = await response.json();
      
      if (data.success) {
        modules = data.data;
      }
    } catch (error) {
      console.error('Failed to fetch modules:', error);
    } finally {
      loading = false;
    }
  }
  
  function getCategoryIcon(category) {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.icon : '📚';
  }
  
  function getCategoryLabel(category) {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.label : category;
  }
  
  function getDifficultyColor(difficulty) {
    switch(difficulty) {
      case '초급': return 'difficulty-beginner';
      case '중급': return 'difficulty-intermediate';
      case '고급': return 'difficulty-advanced';
      case '마스터': return 'difficulty-master';
      default: return 'difficulty-default';
    }
  }
  
  function startPractice(module) {
    console.log('Starting practice:', module.name);
    // TODO: 연습 모듈 시작 로직
  }
  
  onMount(fetchModules);
</script>

<div class="practice-modules">
  <div class="header">
    <h2 class="title">🎯 전문 연습 모듈</h2>
    <p class="subtitle">체계적인 커리큘럼으로 실력을 한 단계 업그레이드하세요</p>
  </div>
  
  <div class="categories-nav">
    {#each categories as category}
      <button 
        class="category-btn {selectedCategory === category.value ? 'active' : ''}"
        on:click={() => { selectedCategory = category.value; fetchModules(); }}
      >
        <span class="category-icon">{category.icon}</span>
        <span class="category-label">{category.label}</span>
      </button>
    {/each}
  </div>
  
  <div class="difficulty-filter">
    {#each difficulties as difficulty}
      <button
        class="difficulty-btn {selectedDifficulty === difficulty.value ? 'active' : ''}"
        on:click={() => { selectedDifficulty = difficulty.value; fetchModules(); }}
      >
        {difficulty.label}
      </button>
    {/each}
  </div>
  
  {#if loading}
    <div class="loading">
      <div class="spinner"></div>
      <p>모듈을 불러오는 중...</p>
    </div>
  {:else if modules.length === 0}
    <div class="no-results">
      <p>검색 결과가 없습니다.</p>
    </div>
  {:else}
    <div class="modules-grid">
      {#each modules as module}
        <div class="module-card {getDifficultyColor(module.difficulty)}">
          <div class="module-header">
            <div class="module-category">
              <span class="category-icon">{getCategoryIcon(module.category)}</span>
              <span>{getCategoryLabel(module.category)}</span>
            </div>
            <span class="module-duration">{module.duration}분</span>
          </div>
          
          <h3 class="module-title">{module.name}</h3>
          <p class="module-description">{module.description}</p>
          
          {#if module.goals && module.goals.length > 0}
            <div class="module-goals">
              <h4>학습 목표:</h4>
              <ul>
                {#each module.goals.slice(0, 3) as goal}
                  <li>✓ {goal}</li>
                {/each}
              </ul>
            </div>
          {/if}
          
          {#if module.techniques && module.techniques.length > 0}
            <div class="module-techniques">
              {#each module.techniques as technique}
                <span class="technique-chip">{technique}</span>
              {/each}
            </div>
          {/if}
          
          {#if module.key || module.scale || module.tempo}
            <div class="module-specs">
              {#if module.key}
                <span>🎵 {module.key}</span>
              {/if}
              {#if module.scale}
                <span>🎹 {module.scale}</span>
              {/if}
              {#if module.tempo}
                <span>⏱️ {module.tempo} BPM</span>
              {/if}
            </div>
          {/if}
          
          <div class="module-footer">
            <span class="difficulty-label {getDifficultyColor(module.difficulty)}">
              {module.difficulty}
            </span>
            <button class="practice-btn" on:click={() => startPractice(module)}>
              연습 시작
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .practice-modules {
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
  }
  
  .header {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .title {
    font-size: 2.5rem;
    font-weight: bold;
    color: #1a1a1a;
    margin-bottom: 0.5rem;
    font-family: 'Bebas Neue', sans-serif;
    letter-spacing: 0.05em;
  }
  
  .subtitle {
    font-size: 1.1rem;
    color: #666;
  }
  
  .categories-nav {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }
  
  .category-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: white;
    border: 2px solid #e5e5e5;
    border-radius: 24px;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .category-btn:hover {
    border-color: #ff6b35;
    transform: translateY(-2px);
  }
  
  .category-btn.active {
    background: linear-gradient(135deg, #ff6b35 0%, #f72c00 100%);
    color: white;
    border-color: transparent;
  }
  
  .category-icon {
    font-size: 1.2rem;
  }
  
  .difficulty-filter {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 2rem;
  }
  
  .difficulty-btn {
    padding: 0.5rem 1.5rem;
    background: white;
    border: 2px solid #e5e5e5;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .difficulty-btn:hover {
    border-color: #ff6b35;
  }
  
  .difficulty-btn.active {
    background: #ff6b35;
    color: white;
    border-color: #ff6b35;
  }
  
  .loading {
    text-align: center;
    padding: 3rem;
  }
  
  .spinner {
    width: 50px;
    height: 50px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #ff6b35;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .no-results {
    text-align: center;
    padding: 3rem;
    color: #666;
  }
  
  .modules-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
  }
  
  .module-card {
    background: white;
    border: 2px solid #e5e5e5;
    border-radius: 16px;
    padding: 1.5rem;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }
  
  .module-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #ff6b35, #f72c00);
  }
  
  .module-card.difficulty-beginner::before {
    background: linear-gradient(90deg, #10b981, #059669);
  }
  
  .module-card.difficulty-intermediate::before {
    background: linear-gradient(90deg, #f59e0b, #d97706);
  }
  
  .module-card.difficulty-advanced::before {
    background: linear-gradient(90deg, #ef4444, #dc2626);
  }
  
  .module-card.difficulty-master::before {
    background: linear-gradient(90deg, #8b5cf6, #7c3aed);
  }
  
  .module-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  }
  
  .module-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .module-category {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #666;
    font-size: 0.9rem;
  }
  
  .module-duration {
    padding: 0.25rem 0.75rem;
    background: #f0f0f0;
    border-radius: 12px;
    font-size: 0.875rem;
    color: #666;
  }
  
  .module-title {
    font-size: 1.25rem;
    font-weight: bold;
    color: #1a1a1a;
    margin: 0 0 0.75rem 0;
  }
  
  .module-description {
    color: #666;
    font-size: 0.95rem;
    line-height: 1.5;
    margin-bottom: 1rem;
  }
  
  .module-goals {
    background: #f9f9f9;
    border-radius: 8px;
    padding: 0.75rem;
    margin-bottom: 1rem;
  }
  
  .module-goals h4 {
    font-size: 0.875rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    color: #333;
  }
  
  .module-goals ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  
  .module-goals li {
    font-size: 0.875rem;
    color: #666;
    margin: 0.25rem 0;
  }
  
  .module-techniques {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  
  .technique-chip {
    padding: 0.25rem 0.75rem;
    background: #fff3e0;
    color: #e65100;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 500;
  }
  
  .module-specs {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
    font-size: 0.875rem;
    color: #666;
  }
  
  .module-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e5e5;
  }
  
  .difficulty-label {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 600;
  }
  
  .difficulty-label.difficulty-beginner {
    background: #d1fae5;
    color: #065f46;
  }
  
  .difficulty-label.difficulty-intermediate {
    background: #fed7aa;
    color: #92400e;
  }
  
  .difficulty-label.difficulty-advanced {
    background: #fee2e2;
    color: #991b1b;
  }
  
  .difficulty-label.difficulty-master {
    background: #ede9fe;
    color: #5b21b6;
  }
  
  .practice-btn {
    padding: 0.5rem 1.5rem;
    background: linear-gradient(135deg, #ff6b35 0%, #f72c00 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .practice-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
  }
  
  @media (max-width: 768px) {
    .modules-grid {
      grid-template-columns: 1fr;
    }
    
    .categories-nav {
      overflow-x: auto;
      justify-content: flex-start;
    }
  }
</style>