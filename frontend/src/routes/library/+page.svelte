<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { 
    Music, 
    Clock, 
    Calendar,
    Search,
    Filter,
    Grid,
    List,
    Download,
    Play,
    Edit,
    Trash2,
    Star,
    StarOff
  } from 'lucide-svelte';
  
  // 라이브러리 데이터
  let libraryItems: any[] = [];
  let filteredItems: any[] = [];
  let searchQuery = '';
  let viewMode: 'grid' | 'list' = 'grid';
  let sortBy = 'date';
  let filterCategory = 'all';
  
  // 페이지네이션
  let currentPage = 1;
  let itemsPerPage = 12;
  let totalPages = 1;
  
  onMount(() => {
    loadLibraryItems();
  });
  
  // 라이브러리 항목 로드
  async function loadLibraryItems() {
    try {
      const response = await fetch('/api/v1/library');
      if (response.ok) {
        const data = await response.json();
        libraryItems = data.items || [];
        filteredItems = [...libraryItems];
        updatePagination();
      }
    } catch (error) {
      console.error('Failed to load library:', error);
      // 임시 데이터
      libraryItems = generateMockData();
      filteredItems = [...libraryItems];
      updatePagination();
    }
  }
  
  // 임시 데이터 생성
  function generateMockData() {
    return [
      {
        id: '1',
        title: 'Hotel California',
        artist: 'Eagles',
        duration: 391,
        createdAt: new Date('2024-01-15'),
        thumbnail: null,
        category: 'rock',
        difficulty: 'intermediate',
        isFavorite: true,
        playCount: 45,
        lastPlayed: new Date('2024-01-20')
      },
      {
        id: '2',
        title: 'Stairway to Heaven',
        artist: 'Led Zeppelin',
        duration: 482,
        createdAt: new Date('2024-01-10'),
        thumbnail: null,
        category: 'rock',
        difficulty: 'advanced',
        isFavorite: true,
        playCount: 38,
        lastPlayed: new Date('2024-01-19')
      },
      {
        id: '3',
        title: 'Wonderwall',
        artist: 'Oasis',
        duration: 258,
        createdAt: new Date('2024-01-08'),
        thumbnail: null,
        category: 'pop',
        difficulty: 'beginner',
        isFavorite: false,
        playCount: 22,
        lastPlayed: new Date('2024-01-18')
      },
      {
        id: '4',
        title: 'Nothing Else Matters',
        artist: 'Metallica',
        duration: 388,
        createdAt: new Date('2024-01-05'),
        thumbnail: null,
        category: 'metal',
        difficulty: 'intermediate',
        isFavorite: false,
        playCount: 15,
        lastPlayed: new Date('2024-01-17')
      }
    ];
  }
  
  // 검색 필터링
  function handleSearch() {
    if (searchQuery.trim() === '') {
      filteredItems = [...libraryItems];
    } else {
      filteredItems = libraryItems.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.artist.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    currentPage = 1;
    updatePagination();
  }
  
  // 카테고리 필터링
  function filterByCategory(category: string) {
    filterCategory = category;
    if (category === 'all') {
      filteredItems = [...libraryItems];
    } else if (category === 'favorites') {
      filteredItems = libraryItems.filter(item => item.isFavorite);
    } else {
      filteredItems = libraryItems.filter(item => item.category === category);
    }
    currentPage = 1;
    updatePagination();
  }
  
  // 정렬
  function sortItems(criteria: string) {
    sortBy = criteria;
    filteredItems.sort((a, b) => {
      switch (criteria) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'artist':
          return a.artist.localeCompare(b.artist);
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'duration':
          return a.duration - b.duration;
        case 'plays':
          return b.playCount - a.playCount;
        default:
          return 0;
      }
    });
  }
  
  // 페이지네이션 업데이트
  function updatePagination() {
    totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  }
  
  // 페이지 변경
  function changePage(page: number) {
    currentPage = Math.max(1, Math.min(page, totalPages));
  }
  
  // 현재 페이지 아이템
  $: paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // 즐겨찾기 토글
  function toggleFavorite(item: any) {
    item.isFavorite = !item.isFavorite;
    libraryItems = [...libraryItems];
    if (filterCategory === 'favorites') {
      filterByCategory('favorites');
    }
  }
  
  // 아이템 열기
  function openItem(item: any) {
    // 뷰어로 이동
    goto(`/viewer?id=${item.id}`);
  }
  
  // 아이템 삭제
  async function deleteItem(item: any) {
    if (confirm(`"${item.title}"을(를) 삭제하시겠습니까?`)) {
      libraryItems = libraryItems.filter(i => i.id !== item.id);
      filteredItems = filteredItems.filter(i => i.id !== item.id);
      updatePagination();
    }
  }
  
  // 시간 포맷
  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  // 날짜 포맷
  function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }
</script>

<svelte:head>
  <title>라이브러리 - Genesis Music</title>
  <meta name="description" content="저장된 악보와 연습 기록을 관리하세요" />
</svelte:head>

<div class="library-page">
  <!-- 헤더 -->
  <div class="library-header">
    <h1 class="page-title">내 라이브러리</h1>
    
    <div class="header-stats">
      <div class="stat">
        <Music size={20} />
        <span>{libraryItems.length}곡</span>
      </div>
      <div class="stat">
        <Clock size={20} />
        <span>총 {Math.floor(libraryItems.reduce((acc, item) => acc + item.duration, 0) / 60)}분</span>
      </div>
      <div class="stat">
        <Star size={20} />
        <span>{libraryItems.filter(item => item.isFavorite).length} 즐겨찾기</span>
      </div>
    </div>
  </div>
  
  <!-- 툴바 -->
  <div class="toolbar">
    <div class="toolbar-left">
      <!-- 검색 -->
      <div class="search-box">
        <Search size={20} />
        <input 
          type="text"
          bind:value={searchQuery}
          on:input={handleSearch}
          placeholder="곡 제목 또는 아티스트 검색..."
          class="input input-bordered input-sm"
        >
      </div>
      
      <!-- 필터 -->
      <div class="dropdown">
        <label tabindex="0" class="btn btn-sm btn-ghost gap-2">
          <Filter size={18} />
          필터
        </label>
        <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
          <li><button on:click={() => filterByCategory('all')} class:active={filterCategory === 'all'}>전체</button></li>
          <li><button on:click={() => filterByCategory('favorites')} class:active={filterCategory === 'favorites'}>즐겨찾기</button></li>
          <li><button on:click={() => filterByCategory('rock')} class:active={filterCategory === 'rock'}>Rock</button></li>
          <li><button on:click={() => filterByCategory('pop')} class:active={filterCategory === 'pop'}>Pop</button></li>
          <li><button on:click={() => filterByCategory('metal')} class:active={filterCategory === 'metal'}>Metal</button></li>
        </ul>
      </div>
      
      <!-- 정렬 -->
      <div class="dropdown">
        <label tabindex="0" class="btn btn-sm btn-ghost gap-2">
          정렬
        </label>
        <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
          <li><button on:click={() => sortItems('date')} class:active={sortBy === 'date'}>최근 추가순</button></li>
          <li><button on:click={() => sortItems('title')} class:active={sortBy === 'title'}>제목순</button></li>
          <li><button on:click={() => sortItems('artist')} class:active={sortBy === 'artist'}>아티스트순</button></li>
          <li><button on:click={() => sortItems('duration')} class:active={sortBy === 'duration'}>재생시간순</button></li>
          <li><button on:click={() => sortItems('plays')} class:active={sortBy === 'plays'}>재생횟수순</button></li>
        </ul>
      </div>
    </div>
    
    <div class="toolbar-right">
      <!-- 보기 모드 -->
      <div class="btn-group">
        <button 
          class="btn btn-sm"
          class:btn-active={viewMode === 'grid'}
          on:click={() => viewMode = 'grid'}
        >
          <Grid size={18} />
        </button>
        <button 
          class="btn btn-sm"
          class:btn-active={viewMode === 'list'}
          on:click={() => viewMode = 'list'}
        >
          <List size={18} />
        </button>
      </div>
    </div>
  </div>
  
  <!-- 컨텐츠 영역 -->
  <div class="library-content">
    {#if paginatedItems.length === 0}
      <div class="empty-state">
        <Music size={64} class="text-base-content/30" />
        <h3 class="text-xl font-semibold mt-4">라이브러리가 비어있습니다</h3>
        <p class="text-base-content/60 mt-2">새로운 음악을 업로드하여 시작하세요</p>
        <button 
          class="btn btn-primary mt-4"
          on:click={() => goto('/upload')}
        >
          파일 업로드
        </button>
      </div>
    {:else if viewMode === 'grid'}
      <!-- 그리드 뷰 -->
      <div class="grid-view">
        {#each paginatedItems as item}
          <div class="library-card">
            <div class="card-thumbnail" on:click={() => openItem(item)}>
              {#if item.thumbnail}
                <img src={item.thumbnail} alt={item.title} />
              {:else}
                <div class="placeholder-thumbnail">
                  <Music size={48} />
                </div>
              {/if}
              <div class="card-overlay">
                <button class="btn btn-circle btn-primary">
                  <Play size={20} />
                </button>
              </div>
            </div>
            
            <div class="card-content">
              <h3 class="card-title" on:click={() => openItem(item)}>{item.title}</h3>
              <p class="card-artist">{item.artist}</p>
              
              <div class="card-meta">
                <span class="duration">{formatDuration(item.duration)}</span>
                <span class="badge badge-sm">{item.difficulty}</span>
              </div>
              
              <div class="card-actions">
                <button 
                  class="btn btn-ghost btn-sm btn-circle"
                  on:click={() => toggleFavorite(item)}
                >
                  {#if item.isFavorite}
                    <Star size={18} class="text-warning" fill="currentColor" />
                  {:else}
                    <StarOff size={18} />
                  {/if}
                </button>
                
                <button class="btn btn-ghost btn-sm btn-circle">
                  <Download size={18} />
                </button>
                
                <button 
                  class="btn btn-ghost btn-sm btn-circle"
                  on:click={() => deleteItem(item)}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <!-- 리스트 뷰 -->
      <div class="list-view">
        <table class="table table-zebra">
          <thead>
            <tr>
              <th></th>
              <th>제목</th>
              <th>아티스트</th>
              <th>재생시간</th>
              <th>난이도</th>
              <th>추가일</th>
              <th>재생횟수</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {#each paginatedItems as item, idx}
              <tr>
                <td>
                  <button 
                    class="btn btn-ghost btn-sm btn-circle"
                    on:click={() => toggleFavorite(item)}
                  >
                    {#if item.isFavorite}
                      <Star size={18} class="text-warning" fill="currentColor" />
                    {:else}
                      <StarOff size={18} />
                    {/if}
                  </button>
                </td>
                <td>
                  <div class="font-semibold cursor-pointer hover:text-primary" on:click={() => openItem(item)}>
                    {item.title}
                  </div>
                </td>
                <td>{item.artist}</td>
                <td>{formatDuration(item.duration)}</td>
                <td>
                  <span class="badge badge-sm">{item.difficulty}</span>
                </td>
                <td>{formatDate(item.createdAt)}</td>
                <td>{item.playCount}</td>
                <td>
                  <div class="flex gap-1">
                    <button 
                      class="btn btn-ghost btn-xs"
                      on:click={() => openItem(item)}
                    >
                      <Play size={16} />
                    </button>
                    <button class="btn btn-ghost btn-xs">
                      <Download size={16} />
                    </button>
                    <button 
                      class="btn btn-ghost btn-xs"
                      on:click={() => deleteItem(item)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
  
  <!-- 페이지네이션 -->
  {#if totalPages > 1}
    <div class="pagination">
      <div class="join">
        <button 
          class="join-item btn btn-sm"
          on:click={() => changePage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          «
        </button>
        
        {#each Array(totalPages) as _, i}
          <button 
            class="join-item btn btn-sm"
            class:btn-active={currentPage === i + 1}
            on:click={() => changePage(i + 1)}
          >
            {i + 1}
          </button>
        {/each}
        
        <button 
          class="join-item btn btn-sm"
          on:click={() => changePage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          »
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .library-page {
    min-height: calc(100vh - 64px);
    padding: 24px;
    background: #f3f4f6;
  }
  
  .library-header {
    background: white;
    padding: 24px;
    border-radius: 12px;
    margin-bottom: 24px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  .page-title {
    font-size: 2rem;
    font-weight: bold;
    margin-bottom: 16px;
  }
  
  .header-stats {
    display: flex;
    gap: 24px;
  }
  
  .stat {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #6b7280;
  }
  
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: white;
    padding: 16px 24px;
    border-radius: 12px;
    margin-bottom: 24px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  .toolbar-left,
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .search-box {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 12px;
    background: #f3f4f6;
    border-radius: 8px;
  }
  
  .search-box input {
    background: transparent;
    border: none;
    outline: none;
    width: 300px;
  }
  
  .library-content {
    min-height: 400px;
  }
  
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  /* 그리드 뷰 */
  .grid-view {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 24px;
  }
  
  .library-card {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  
  .library-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  }
  
  .card-thumbnail {
    position: relative;
    aspect-ratio: 16/9;
    background: #f3f4f6;
    cursor: pointer;
    overflow: hidden;
  }
  
  .placeholder-thumbnail {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #cbd5e1;
  }
  
  .card-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s;
  }
  
  .card-thumbnail:hover .card-overlay {
    opacity: 1;
  }
  
  .card-content {
    padding: 16px;
  }
  
  .card-title {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 4px;
    cursor: pointer;
    transition: color 0.2s;
  }
  
  .card-title:hover {
    color: var(--fallback-p, oklch(var(--p)));
  }
  
  .card-artist {
    color: #6b7280;
    margin-bottom: 12px;
  }
  
  .card-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    font-size: 0.875rem;
  }
  
  .card-actions {
    display: flex;
    gap: 4px;
  }
  
  /* 리스트 뷰 */
  .list-view {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  .pagination {
    display: flex;
    justify-content: center;
    margin-top: 24px;
  }
  
  /* 반응형 디자인 */
  @media (max-width: 768px) {
    .library-page {
      padding: 12px;
    }
    
    .toolbar {
      flex-direction: column;
      gap: 12px;
    }
    
    .toolbar-left,
    .toolbar-right {
      width: 100%;
      justify-content: space-between;
    }
    
    .search-box {
      flex: 1;
    }
    
    .search-box input {
      width: 100%;
    }
    
    .grid-view {
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 12px;
    }
  }
</style>