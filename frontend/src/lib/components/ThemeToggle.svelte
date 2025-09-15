<script lang="ts">
  import { themeStore, actualTheme } from '$lib/stores/theme';
  import Button from './ui/Button.svelte';
  
  export let showLabel = false;
  export let size: 'sm' | 'md' | 'lg' = 'md';
  
  function getIcon(theme: 'light' | 'dark' | 'system') {
    switch (theme) {
      case 'light': return '☀️';
      case 'dark': return '🌙';
      case 'system': return '💻';
    }
  }
  
  function getLabel(theme: 'light' | 'dark' | 'system') {
    switch (theme) {
      case 'light': return '라이트 모드';
      case 'dark': return '다크 모드';
      case 'system': return '시스템 설정';
    }
  }
</script>

<div class="theme-toggle">
  <Button
    variant="ghost"
    {size}
    icon={!showLabel}
    on:click={() => themeStore.toggle()}
    aria-label="테마 변경"
    title="테마 변경 (현재: {getLabel($themeStore)})"
  >
    <span class="theme-icon">{getIcon($themeStore)}</span>
    {#if showLabel}
      <span class="theme-label">{getLabel($themeStore)}</span>
    {/if}
  </Button>
  
  {#if $themeStore === 'system'}
    <span class="system-indicator" title="시스템 테마: {$actualTheme === 'dark' ? '다크' : '라이트'}">
      ({$actualTheme === 'dark' ? '🌙' : '☀️'})
    </span>
  {/if}
</div>

<style>
  .theme-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .theme-icon {
    font-size: 1.25em;
    display: inline-flex;
    align-items: center;
    transition: transform 0.3s ease;
  }
  
  .theme-label {
    margin-left: 0.5rem;
    font-size: 0.875rem;
  }
  
  .system-indicator {
    font-size: 0.75rem;
    opacity: 0.7;
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 0.7; }
    50% { opacity: 0.4; }
  }
  
  /* Hover effect */
  :global(.theme-toggle button:hover) .theme-icon {
    transform: rotate(180deg);
  }
  
  /* Dark mode styles */
  :global(.dark) .theme-label {
    color: var(--text-secondary);
  }
  
  :global(.dark) .system-indicator {
    color: var(--text-tertiary);
  }
</style>