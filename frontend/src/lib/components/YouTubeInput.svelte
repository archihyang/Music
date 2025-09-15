<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { fade, fly, scale } from 'svelte/transition';
  import { writable } from 'svelte/store';
  
  const dispatch = createEventDispatcher();
  
  // State
  let url = '';
  let isProcessing = false;
  let error = '';
  let progress = 0;
  let statusMessage = '';
  let recentUrls = [];
  let showHistory = false;
  
  // URL validation regex
  const YOUTUBE_URL_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)[\w-]+(&[\w=]*)?$/;
  
  // Load recent URLs from localStorage
  onMount(() => {
    const stored = localStorage.getItem('genesis_recent_urls');
    if (stored) {
      try {
        recentUrls = JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse recent URLs:', e);
      }
    }
  });
  
  // Validate YouTube URL
  function validateUrl(urlStr: string): boolean {
    if (!urlStr) return false;
    return YOUTUBE_URL_REGEX.test(urlStr);
  }
  
  // Extract video ID from URL
  function extractVideoId(urlStr: string): string | null {
    const match = urlStr.match(/(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }
  
  // Get video title from YouTube (simplified - in production use YouTube API)
  async function getVideoTitle(videoId: string): Promise<string> {
    // This would normally call YouTube API
    // For now, return a placeholder
    return `Video ${videoId}`;
  }
  
  // Handle form submission
  async function handleSubmit() {
    // Reset states
    error = '';
    statusMessage = '';
    progress = 0;
    
    // Validate URL
    if (!validateUrl(url)) {
      error = '올바른 YouTube URL을 입력해주세요';
      return;
    }
    
    const videoId = extractVideoId(url);
    if (!videoId) {
      error = 'YouTube 비디오 ID를 추출할 수 없습니다';
      return;
    }
    
    isProcessing = true;
    
    try {
      // Call backend API
      statusMessage = 'YouTube 비디오 정보 확인 중...';
      progress = 10;
      
      const response = await fetch('/api/transcribe/youtube', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url: url,
          videoId: videoId 
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Transcription failed');
      }
      
      const data = await response.json();
      
      // Start polling for progress
      if (data.jobId) {
        await pollJobStatus(data.jobId);
      }
      
      // Save to recent URLs
      const title = await getVideoTitle(videoId);
      addToRecentUrls(url, title);
      
      // Dispatch success event
      dispatch('transcriptionComplete', {
        jobId: data.jobId,
        data: data.result
      });
      
      // Reset form
      url = '';
      statusMessage = '전사 완료!';
      progress = 100;
      
    } catch (err) {
      console.error('Transcription error:', err);
      error = err instanceof Error ? err.message : '전사 중 오류가 발생했습니다';
    } finally {
      isProcessing = false;
      setTimeout(() => {
        progress = 0;
        statusMessage = '';
      }, 3000);
    }
  }
  
  // Poll job status
  async function pollJobStatus(jobId: string) {
    const maxAttempts = 60; // 5 minutes max
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`/api/transcribe/status/${jobId}`);
        const data = await response.json();
        
        if (data.status === 'completed') {
          progress = 100;
          statusMessage = '전사 완료!';
          return data;
        } else if (data.status === 'failed') {
          throw new Error(data.error || 'Transcription failed');
        } else {
          // Update progress
          progress = Math.min(90, data.progress || progress + 5);
          statusMessage = data.message || '처리 중...';
        }
        
        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
        
      } catch (err) {
        console.error('Status check error:', err);
        throw err;
      }
    }
    
    throw new Error('작업 시간이 초과되었습니다');
  }
  
  // Add URL to recent history
  function addToRecentUrls(urlStr, title) {
    const newItem = {
      url: urlStr,
      title: title,
      timestamp: Date.now()
    };
    
    // Remove duplicates and add new item at the beginning
    recentUrls = [
      newItem,
      ...recentUrls.filter(item => item.url !== urlStr)
    ].slice(0, 5); // Keep only 5 most recent
    
    // Save to localStorage
    localStorage.setItem('genesis_recent_urls', JSON.stringify(recentUrls));
  }
  
  // Use URL from history
  function useRecentUrl(urlStr) {
    url = urlStr;
    showHistory = false;
  }
  
  // Clear history
  function clearHistory() {
    recentUrls = [];
    localStorage.removeItem('genesis_recent_urls');
    showHistory = false;
  }
  
  // Format timestamp
  function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return '방금 전';
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString();
  }
</script>

<div class="youtube-input-container">
  <form on:submit|preventDefault={handleSubmit} class="input-form">
    <div class="input-wrapper">
      <div class="input-group">
        <div class="input-icon">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        </div>
        
        <input
          type="url"
          bind:value={url}
          placeholder="YouTube URL을 입력하세요 (예: https://youtube.com/watch?v=...)"
          disabled={isProcessing}
          class="url-input"
          class:error={error}
        />
        
        <button 
          type="button"
          class="history-btn"
          on:click={() => showHistory = !showHistory}
          disabled={isProcessing || recentUrls.length === 0}
          aria-label="최근 URL 보기"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </button>
      </div>
      
      <button 
        type="submit" 
        class="submit-btn btn-master"
        disabled={isProcessing || !url}
      >
        {#if isProcessing}
          <span class="spinner"></span>
          <span>처리 중...</span>
        {:else}
          <span>Tab 변환 시작</span>
          <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
        {/if}
      </button>
    </div>
    
    {#if error}
      <div class="error-message" transition:fade={{ duration: 200 }}>
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>
        <span>{error}</span>
      </div>
    {/if}
    
    {#if isProcessing && statusMessage}
      <div class="status-message" transition:fade={{ duration: 200 }}>
        <div class="status-text">{statusMessage}</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: {progress}%"></div>
        </div>
      </div>
    {/if}
  </form>
  
  {#if showHistory && recentUrls.length > 0}
    <div class="history-dropdown" transition:fly={{ y: -10, duration: 200 }}>
      <div class="history-header">
        <span class="text-sm font-semibold">최근 URL</span>
        <button 
          class="clear-btn"
          on:click={clearHistory}
          aria-label="기록 삭제"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
      </div>
      
      <div class="history-list">
        {#each recentUrls as item}
          <button 
            class="history-item"
            on:click={() => useRecentUrl(item.url)}
            transition:scale={{ duration: 150 }}
          >
            <div class="item-info">
              <div class="item-title">{item.title}</div>
              <div class="item-time">{formatTime(item.timestamp)}</div>
            </div>
            <svg class="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        {/each}
      </div>
    </div>
  {/if}
  
  <!-- Help text -->
  <div class="help-text">
    <p class="text-sm opacity-70">
      YouTube 비디오 URL을 입력하면 AI가 자동으로 기타 탭을 생성합니다.
    </p>
    <p class="text-xs opacity-50 mt-1">
      지원 형식: youtube.com/watch?v=..., youtu.be/..., youtube.com/embed/...
    </p>
  </div>
</div>

<style>
  .youtube-input-container {
    @apply max-w-3xl mx-auto;
  }
  
  .input-form {
    @apply space-y-4;
  }
  
  .input-wrapper {
    @apply space-y-3;
  }
  
  .input-group {
    @apply flex items-center gap-2 p-2 rounded-lg;
    @apply bg-gray-800 border border-gray-700;
    @apply focus-within:border-orange-500 transition-colors;
  }
  
  .input-icon {
    @apply text-red-500 ml-2;
  }
  
  .url-input {
    @apply flex-1 bg-transparent border-none outline-none;
    @apply text-white placeholder-gray-500;
    @apply px-2 py-2;
  }
  
  .url-input.error {
    @apply text-red-400;
  }
  
  .history-btn {
    @apply p-2 rounded hover:bg-gray-700 transition-colors;
    @apply text-gray-400 hover:text-white;
    @apply disabled:opacity-50 disabled:cursor-not-allowed;
  }
  
  .submit-btn {
    @apply w-full flex items-center justify-center gap-2;
    @apply py-3 px-6 rounded-lg font-semibold;
    @apply transition-all duration-200;
    @apply disabled:opacity-50 disabled:cursor-not-allowed;
  }
  
  .error-message {
    @apply flex items-center gap-2 p-3 rounded-lg;
    @apply bg-red-900 bg-opacity-20 border border-red-800;
    @apply text-red-400 text-sm;
  }
  
  .status-message {
    @apply p-4 rounded-lg;
    @apply bg-gray-800 border border-gray-700;
  }
  
  .status-text {
    @apply text-sm text-gray-300 mb-2;
  }
  
  .progress-bar {
    @apply w-full h-2 bg-gray-700 rounded-full overflow-hidden;
  }
  
  .progress-fill {
    @apply h-full bg-gradient-to-r from-orange-500 to-orange-600;
    @apply transition-all duration-500 ease-out;
  }
  
  .history-dropdown {
    @apply absolute z-10 w-full mt-2;
    @apply bg-gray-800 border border-gray-700 rounded-lg shadow-xl;
    @apply max-h-64 overflow-y-auto;
  }
  
  .history-header {
    @apply flex items-center justify-between p-3;
    @apply border-b border-gray-700;
  }
  
  .clear-btn {
    @apply p-1 rounded hover:bg-gray-700 transition-colors;
    @apply text-gray-400 hover:text-red-400;
  }
  
  .history-list {
    @apply py-2;
  }
  
  .history-item {
    @apply w-full flex items-center justify-between;
    @apply px-3 py-2 hover:bg-gray-700 transition-colors;
    @apply text-left;
  }
  
  .item-info {
    @apply flex-1;
  }
  
  .item-title {
    @apply text-sm text-white truncate;
  }
  
  .item-time {
    @apply text-xs text-gray-500;
  }
  
  .help-text {
    @apply mt-4 text-center;
  }
  
  .spinner {
    @apply inline-block w-4 h-4 border-2 border-white;
    @apply border-t-transparent rounded-full animate-spin;
  }
  
  @media (max-width: 640px) {
    .input-group {
      @apply flex-col;
    }
    
    .url-input {
      @apply w-full;
    }
    
    .history-dropdown {
      @apply relative;
    }
  }
</style>