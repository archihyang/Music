<script lang="ts">
  export let size: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | 'fluid' = 'xl';
  export let padding: boolean | { x?: number | string; y?: number | string } = true;
  export let center = true;
  
  let className = '';
  export { className as class };
  
  const sizeMap = {
    sm: 'max-w-screen-sm',    // 640px
    md: 'max-w-screen-md',    // 768px
    lg: 'max-w-screen-lg',    // 1024px
    xl: 'max-w-screen-xl',    // 1280px
    '2xl': 'max-w-screen-2xl', // 1536px
    full: 'max-w-full',
    fluid: 'w-full'
  };
  
  function getPaddingClass() {
    if (!padding) return '';
    
    if (typeof padding === 'boolean') {
      return 'px-4 sm:px-6 lg:px-8';
    }
    
    let classes = [];
    if (padding.x) {
      const xPadding = typeof padding.x === 'number' ? `px-${padding.x}` : padding.x;
      classes.push(xPadding);
    }
    if (padding.y) {
      const yPadding = typeof padding.y === 'number' ? `py-${padding.y}` : padding.y;
      classes.push(yPadding);
    }
    
    return classes.join(' ');
  }
  
  $: containerClasses = `
    ${size !== 'fluid' ? sizeMap[size] : sizeMap.fluid}
    ${center && size !== 'fluid' ? 'mx-auto' : ''}
    ${getPaddingClass()}
    ${className}
  `.trim().replace(/\s+/g, ' ');
</script>

<div class={containerClasses}>
  <slot />
</div>