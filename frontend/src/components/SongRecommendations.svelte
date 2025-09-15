<script>
  import { onMount } from 'svelte';
  
  let songs = [];
  let loading = true;
  let selectedGenre = '';
  let selectedDifficulty = '';
  let selectedGuitarist = '';
  
  const genres = [
    { value: '', label: '모든 장르' },
    { value: 'Classic Rock', label: '클래식 록' },
    { value: 'Progressive Rock', label: '프로그레시브 록' },
    { value: 'Hard Rock', label: '하드 록' },
    { value: 'Blues Rock', label: '블루스 록' },
    { value: 'Heavy Metal', label: '헤비 메탈' }
  ];
  
  const difficulties = [
    { value: '', label: '모든 난이도' },
    { value: '초급', label: '초급' },
    { value: '중급', label: '중급' },
    { value: '고급', label: '고급' },
    { value: '마스터', label: '마스터' }
  ];
  
  const guitarists = [
    { value: '', label: '모든 기타리스트' },
    { value: 'Jimmy Page', label: 'Jimmy Page' },
    { value: 'David Gilmour', label: 'David Gilmour' },
    { value: 'Eric Clapton', label: 'Eric Clapton' },
    { value: 'Brian May', label: 'Brian May' },
    { value: 'Ritchie Blackmore', label: 'Ritchie Blackmore' },
    { value: 'Tony Iommi', label: 'Tony Iommi' },
    { value: 'Angus Young', label: 'Angus Young' }
  ];
  
  async function fetchSongs() {
    loading = true;
    try {
      const params = new URLSearchParams();
      if (selectedGenre) params.append('genre', selectedGenre);
      if (selectedDifficulty) params.append('difficulty', selectedDifficulty);
      if (selectedGuitarist) params.append('guitarist', selectedGuitarist);
      params.append('limit', '12');
      
      const response = await fetch(`http://localhost:3000/api/mastery/songs/recommendations?${params}`);
      const data = await response.json();
      
      if (data.success) {
        songs = data.data;
      }
    } catch (error) {
      console.error('Failed to fetch songs:', error);
    } finally {
      loading = false;
    }
  }
  
  function getDifficultyColor(difficulty) {
    switch(difficulty) {
      case '초급': return 'bg-green-100 text-green-800';
      case '중급': return 'bg-yellow-100 text-yellow-800';
      case '고급': return 'bg-red-100 text-red-800';
      case '마스터': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
  
  function startLearning(song) {
    // TODO: 학습 시작 로직
    console.log('Starting to learn:', song.title);
    window.open(song.youtubeUrl, '_blank');
  }
  
  onMount(fetchSongs);
</script>

<div class="song-recommendations">
  <div class="header">
    <h2 class="title">🎸 전문가 추천 기타 연주곡</h2>
    <p class="subtitle">70-80년대 클래식 록의 전설적인 곡들을 마스터하세요</p>
  </div>
  
  <div class="filters">
    <select bind:value={selectedGenre} on:change={fetchSongs} class="filter-select">
      {#each genres as genre}
        <option value={genre.value}>{genre.label}</option>
      {/each}
    </select>
    
    <select bind:value={selectedDifficulty} on:change={fetchSongs} class="filter-select">
      {#each difficulties as difficulty}
        <option value={difficulty.value}>{difficulty.label}</option>
      {/each}
    </select>
    
    <select bind:value={selectedGuitarist} on:change={fetchSongs} class="filter-select">
      {#each guitarists as guitarist}
        <option value={guitarist.value}>{guitarist.label}</option>
      {/each}
    </select>
  </div>
  
  {#if loading}
    <div class="loading">
      <div class="spinner"></div>
      <p>곡을 불러오는 중...</p>
    </div>
  {:else if songs.length === 0}
    <div class="no-results">
      <p>검색 결과가 없습니다.</p>
    </div>
  {:else}
    <div class="songs-grid">
      {#each songs as song}
        <div class="song-card">
          <div class="song-header">
            <h3 class="song-title">{song.title}</h3>
            <span class="difficulty-badge {getDifficultyColor(song.difficulty)}">
              {song.difficulty}
            </span>
          </div>
          
          <div class="song-info">
            <p class="artist">🎤 {song.artist}</p>
            {#if song.guitarist}
              <p class="guitarist">🎸 {song.guitarist}</p>
            {/if}
            <p class="year-genre">📅 {song.year} • {song.genre}</p>
            {#if song.tempo && song.key}
              <p class="musical-info">🎵 {song.key} • {song.tempo} BPM</p>
            {/if}
          </div>
          
          {#if song.techniques && song.techniques.length > 0}
            <div class="techniques">
              {#each song.techniques.slice(0, 3) as technique}
                <span class="technique-tag">{technique}</span>
              {/each}
            </div>
          {/if}
          
          <button class="learn-button" on:click={() => startLearning(song)}>
            연습 시작
          </button>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .song-recommendations {
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
  
  .filters {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .filter-select {
    padding: 0.75rem 1.5rem;
    border: 2px solid #e5e5e5;
    border-radius: 8px;
    font-size: 1rem;
    background: white;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .filter-select:hover {
    border-color: #ff6b35;
  }
  
  .filter-select:focus {
    outline: none;
    border-color: #ff6b35;
    box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
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
  
  .songs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
  }
  
  .song-card {
    background: white;
    border: 2px solid #e5e5e5;
    border-radius: 12px;
    padding: 1.5rem;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  }
  
  .song-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0,0,0,0.1);
    border-color: #ff6b35;
  }
  
  .song-header {
    display: flex;
    justify-content: space-between;
    align-items: start;
    margin-bottom: 1rem;
  }
  
  .song-title {
    font-size: 1.25rem;
    font-weight: bold;
    color: #1a1a1a;
    margin: 0;
    flex: 1;
  }
  
  .difficulty-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 600;
    white-space: nowrap;
  }
  
  .song-info {
    margin-bottom: 1rem;
  }
  
  .song-info p {
    margin: 0.25rem 0;
    color: #666;
    font-size: 0.95rem;
  }
  
  .artist {
    font-weight: 600;
    color: #333;
  }
  
  .guitarist {
    color: #ff6b35;
  }
  
  .techniques {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  
  .technique-tag {
    padding: 0.25rem 0.75rem;
    background: #f0f0f0;
    border-radius: 16px;
    font-size: 0.85rem;
    color: #666;
  }
  
  .learn-button {
    width: 100%;
    padding: 0.75rem;
    background: linear-gradient(135deg, #ff6b35 0%, #f72c00 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .learn-button:hover {
    transform: scale(1.02);
    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
  }
  
  @media (max-width: 768px) {
    .songs-grid {
      grid-template-columns: 1fr;
    }
    
    .filters {
      flex-direction: column;
    }
    
    .filter-select {
      width: 100%;
    }
  }
</style>