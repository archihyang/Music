<script lang="ts">
  import { theme } from '$lib/design/theme';
  import type { HTMLButtonAttributes } from 'svelte/elements';
  
  interface $$Props extends HTMLButtonAttributes {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    loading?: boolean;
    icon?: boolean;
    disabled?: boolean;
  }
  
  export let variant: $$Props['variant'] = 'primary';
  export let size: $$Props['size'] = 'md';
  export let fullWidth = false;
  export let loading = false;
  export let icon = false;
  export let disabled = false;
  
  let className = '';
  export { className as class };
  
  $: isDisabled = disabled || loading;
  
  const getVariantClasses = () => {
    const base = 'font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    switch (variant) {
      case 'primary':
        return `${base} bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 focus:ring-primary-500`;
      case 'secondary':
        return `${base} bg-neutral-200 text-neutral-800 hover:bg-neutral-300 active:bg-neutral-400 focus:ring-neutral-500`;
      case 'ghost':
        return `${base} bg-transparent text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200 focus:ring-neutral-500`;
      case 'danger':
        return `${base} bg-red-500 text-white hover:bg-red-600 active:bg-red-700 focus:ring-red-500`;
      case 'success':
        return `${base} bg-green-500 text-white hover:bg-green-600 active:bg-green-700 focus:ring-green-500`;
      default:
        return base;
    }
  };
  
  const getSizeClasses = () => {
    if (icon) {
      switch (size) {
        case 'sm': return 'p-1.5';
        case 'md': return 'p-2';
        case 'lg': return 'p-2.5';
        default: return 'p-2';
      }
    }
    
    switch (size) {
      case 'sm': return 'px-3 py-1.5 text-sm';
      case 'md': return 'px-4 py-2 text-base';
      case 'lg': return 'px-5 py-2.5 text-lg';
      default: return 'px-4 py-2 text-base';
    }
  };
  
  $: buttonClasses = `
    ${getVariantClasses()}
    ${getSizeClasses()}
    ${fullWidth ? 'w-full' : ''}
    ${icon ? 'rounded-lg' : 'rounded-md'}
    ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${className}
  `.trim();
</script>

<button
  class={buttonClasses}
  disabled={isDisabled}
  on:click
  on:mouseenter
  on:mouseleave
  on:focus
  on:blur
  {...$$restProps}
>
  {#if loading}
    <span class="inline-flex items-center">
      <svg 
        class="animate-spin -ml-1 mr-2 h-4 w-4" 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24"
      >
        <circle 
          class="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          stroke-width="4"
        />
        <path 
          class="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <slot />
    </span>
  {:else}
    <slot />
  {/if}
</button>

<style>
  /* Custom animations */
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  
  /* Ensure proper focus styles */
  button:focus-visible {
    outline: 2px solid transparent;
    outline-offset: 2px;
  }
  
  /* Smooth transitions */
  button {
    transition: all 200ms ease-in-out;
  }
  
  button:active:not(:disabled) {
    transform: scale(0.98);
  }
</style>