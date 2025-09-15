<script lang="ts">
  import { theme } from '$lib/design/theme';
  
  export let title: string = '';
  export let subtitle: string = '';
  export let variant: 'default' | 'bordered' | 'elevated' | 'flat' = 'default';
  export let padding: 'none' | 'sm' | 'md' | 'lg' = 'md';
  export let hoverable = false;
  export let clickable = false;
  
  let className = '';
  export { className as class };
  
  const getVariantClasses = () => {
    const base = 'rounded-xl transition-all duration-200';
    
    switch (variant) {
      case 'bordered':
        return `${base} bg-white border border-neutral-200`;
      case 'elevated':
        return `${base} bg-white shadow-lg`;
      case 'flat':
        return `${base} bg-neutral-50`;
      default:
        return `${base} bg-white shadow-md`;
    }
  };
  
  const getPaddingClasses = () => {
    switch (padding) {
      case 'none': return '';
      case 'sm': return 'p-4';
      case 'md': return 'p-6';
      case 'lg': return 'p-8';
      default: return 'p-6';
    }
  };
  
  $: cardClasses = `
    ${getVariantClasses()}
    ${getPaddingClasses()}
    ${hoverable ? 'hover:shadow-xl hover:-translate-y-0.5' : ''}
    ${clickable ? 'cursor-pointer' : ''}
    ${className}
  `.trim();
</script>

<article 
  class={cardClasses}
  on:click
  on:mouseenter
  on:mouseleave
  role={clickable ? "button" : undefined}
  tabindex={clickable ? 0 : undefined}
>
  {#if title || subtitle || $$slots.header}
    <header class="card-header">
      <slot name="header">
        {#if title}
          <h3 class="text-xl font-semibold text-neutral-900">{title}</h3>
        {/if}
        {#if subtitle}
          <p class="mt-1 text-sm text-neutral-600">{subtitle}</p>
        {/if}
      </slot>
    </header>
  {/if}
  
  <div class="card-content">
    <slot />
  </div>
  
  {#if $$slots.footer}
    <footer class="card-footer">
      <slot name="footer" />
    </footer>
  {/if}
</article>

<style>
  .card-header:not(:last-child) {
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }
  
  .card-footer:not(:first-child) {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
  }
  
  /* Dark mode support */
  :global(.dark) article {
    background-color: #1a1a1a;
    border-color: #333;
  }
  
  :global(.dark) .card-header {
    border-bottom-color: rgba(255, 255, 255, 0.1);
  }
  
  :global(.dark) .card-footer {
    border-top-color: rgba(255, 255, 255, 0.1);
  }
  
  :global(.dark) h3 {
    color: #f5f5f5;
  }
  
  :global(.dark) p {
    color: #a3a3a3;
  }
</style>