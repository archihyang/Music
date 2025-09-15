<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fade, slide } from 'svelte/transition';
  import { errorHandler, type ErrorInfo } from '$lib/utils/errorHandler';
  
  let errors: ErrorInfo[] = [];
  let showErrors = false;
  
  function handleError(error: ErrorInfo) {
    errors = [...errors, error];
    
    // 자동으로 에러 메시지 제거 (critical이 아닌 경우)
    if (error.severity !== 'critical') {
      setTimeout(() => {
        errors = errors.filter(e => e !== error);
      }, 5000);
    }
  }
  
  function dismissError(error: ErrorInfo) {
    errors = errors.filter(e => e !== error);
  }
  
  function getSeverityColor(severity: ErrorInfo['severity']) {
    switch (severity) {
      case 'low': return 'bg-blue-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
    }
  }
  
  function getSeverityIcon(severity: ErrorInfo['severity']) {
    switch (severity) {
      case 'low': return 'ℹ️';
      case 'medium': return '⚠️';
      case 'high': return '🔶';
      case 'critical': return '🚨';
    }
  }
  
  onMount(() => {
    errorHandler.addErrorListener(handleError);
    
    // 개발 환경에서는 에러 표시를 기본으로 활성화
    if (import.meta.env.DEV) {
      showErrors = true;
    }
  });
  
  onDestroy(() => {
    errorHandler.removeErrorListener(handleError);
  });
</script>

{#if showErrors && errors.length > 0}
  <div class="error-container" transition:fade={{ duration: 200 }}>
    {#each errors as error (error.timestamp)}
      <div 
        class="error-item {getSeverityColor(error.severity)}"
        transition:slide={{ duration: 300 }}
      >
        <div class="error-header">
          <span class="error-icon">{getSeverityIcon(error.severity)}</span>
          <span class="error-severity">{error.severity.toUpperCase()}</span>
          <button 
            class="dismiss-button"
            on:click={() => dismissError(error)}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
        
        <div class="error-message">
          {error.message}
        </div>
        
        {#if error.code}
          <div class="error-code">
            Code: {error.code}
          </div>
        {/if}
        
        {#if import.meta.env.DEV && error.context}
          <details class="error-details">
            <summary>자세히 보기</summary>
            <pre>{JSON.stringify(error.context, null, 2)}</pre>
            {#if error.stack}
              <pre class="error-stack">{error.stack}</pre>
            {/if}
          </details>
        {/if}
        
        <div class="error-time">
          {new Date(error.timestamp).toLocaleTimeString()}
        </div>
      </div>
    {/each}
  </div>
{/if}

<!-- 개발 환경에서 에러 패널 토글 버튼 -->
{#if import.meta.env.DEV}
  <button
    class="error-toggle"
    on:click={() => showErrors = !showErrors}
    aria-label="Toggle error display"
  >
    {#if errors.length > 0}
      <span class="error-count">{errors.length}</span>
    {/if}
    🐛
  </button>
{/if}

<style>
  .error-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    max-width: 400px;
    max-height: 80vh;
    overflow-y: auto;
  }
  
  .error-item {
    margin-bottom: 10px;
    padding: 15px;
    border-radius: 8px;
    color: white;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    animation: slideIn 0.3s ease-out;
  }
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .error-header {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
  }
  
  .error-icon {
    font-size: 1.2em;
    margin-right: 8px;
  }
  
  .error-severity {
    font-weight: bold;
    font-size: 0.85em;
    margin-right: auto;
  }
  
  .dismiss-button {
    background: none;
    border: none;
    color: white;
    font-size: 1.5em;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.8;
    transition: opacity 0.2s;
  }
  
  .dismiss-button:hover {
    opacity: 1;
  }
  
  .error-message {
    margin-bottom: 8px;
    word-wrap: break-word;
  }
  
  .error-code {
    font-size: 0.85em;
    opacity: 0.9;
    font-family: monospace;
    margin-bottom: 8px;
  }
  
  .error-details {
    margin-top: 10px;
    font-size: 0.85em;
  }
  
  .error-details summary {
    cursor: pointer;
    opacity: 0.9;
    margin-bottom: 5px;
  }
  
  .error-details pre {
    background: rgba(0, 0, 0, 0.2);
    padding: 8px;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 0.85em;
    margin-top: 5px;
  }
  
  .error-stack {
    max-height: 150px;
    overflow-y: auto;
  }
  
  .error-time {
    font-size: 0.75em;
    opacity: 0.8;
    text-align: right;
    margin-top: 5px;
  }
  
  .error-toggle {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9998;
    background: #4a5568;
    color: white;
    border: none;
    border-radius: 50%;
    width: 50px;
    height: 50px;
    font-size: 1.5em;
    cursor: pointer;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .error-toggle:hover {
    transform: scale(1.1);
  }
  
  .error-count {
    position: absolute;
    top: -5px;
    right: -5px;
    background: red;
    color: white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    font-size: 0.75em;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
  }
  
  /* 반응형 */
  @media (max-width: 640px) {
    .error-container {
      left: 10px;
      right: 10px;
      max-width: none;
    }
  }
</style>