<script lang="ts">
  export let spacing: 'none' | 'sm' | 'md' | 'lg' | 'xl' = 'md';
  export let background: 'transparent' | 'white' | 'gray' | 'primary' | 'secondary' | 'gradient' = 'transparent';
  export let fullHeight = false;
  export let centerContent = false;
  
  let className = '';
  export { className as class };
  
  const spacingMap = {
    none: '',
    sm: 'py-8',
    md: 'py-12 md:py-16',
    lg: 'py-16 md:py-20 lg:py-24',
    xl: 'py-20 md:py-28 lg:py-32'
  };
  
  const backgroundMap = {
    transparent: '',
    white: 'bg-white dark:bg-neutral-900',
    gray: 'bg-gray-50 dark:bg-neutral-800',
    primary: 'bg-primary-50 dark:bg-primary-900',
    secondary: 'bg-secondary-50 dark:bg-secondary-900',
    gradient: 'bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900'
  };
  
  $: sectionClasses = `
    ${spacingMap[spacing]}
    ${backgroundMap[background]}
    ${fullHeight ? 'min-h-screen' : ''}
    ${centerContent ? 'flex items-center justify-center' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');
</script>

<section class={sectionClasses}>
  <slot />
</section>