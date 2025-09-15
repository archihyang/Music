/**
 * Genesis Music Professional Design System
 * 30년 경력 UI/UX 전문가 설계
 * 
 * Golden Ratio, Musical Proportions, Gestalt Principles
 */

// ============================================
// COLOR SYSTEM - Musical Context Aware
// ============================================

export const colors = {
  // Brand Identity
  brand: {
    primary: '#1A1A2E',      // Deep Professional Blue (Authority)
    secondary: '#16213E',    // Darker Blue (Depth)
    accent: '#F39C12',       // Gold (Achievement, Success)
    light: '#FAFAFA',        // Pure White (Clarity)
    dark: '#0F0F0F'          // True Black (Power)
  },

  // Musical Semantics
  musical: {
    sharp: '#E74C3C',        // Red (Tension, Sharp Notes)
    flat: '#3498DB',         // Blue (Resolution, Flat Notes)
    natural: '#2C3E50',      // Gray (Neutral, Natural Notes)
    
    major: '#27AE60',        // Green (Happy, Major)
    minor: '#8E44AD',        // Purple (Sad, Minor)
    diminished: '#95A5A6',   // Gray (Unstable)
    augmented: '#E67E22',    // Orange (Tension)
    
    tonic: '#2ECC71',        // Bright Green (Home)
    dominant: '#F1C40F',     // Yellow (Tension)
    subdominant: '#3498DB',  // Blue (Movement)
    
    // Performance Feedback
    perfect: '#00FF00',      // Pure Green
    good: '#27AE60',         // Forest Green
    okay: '#F39C12',         // Orange
    poor: '#E74C3C',         // Red
    missed: '#C0392B'        // Dark Red
  },

  // Track Colors (Industry Standard)
  tracks: {
    guitar: '#E67E22',       // Orange
    bass: '#8E44AD',         // Purple
    drums: '#2ECC71',        // Green
    keys: '#3498DB',         // Blue
    vocals: '#E74C3C',      // Red
    strings: '#F39C12',      // Gold
    brass: '#D68910',        // Bronze
    woodwinds: '#7DCEA0',    // Mint
    percussion: '#EC7063',   // Coral
    synth: '#BB8FCE'         // Lavender
  },

  // UI States
  states: {
    hover: 'rgba(243, 156, 18, 0.1)',
    active: 'rgba(243, 156, 18, 0.2)',
    focus: 'rgba(52, 152, 219, 0.3)',
    disabled: 'rgba(149, 165, 166, 0.3)',
    error: 'rgba(231, 76, 60, 0.1)',
    success: 'rgba(39, 174, 96, 0.1)',
    warning: 'rgba(241, 196, 15, 0.1)'
  },

  // Gradients (Premium Feel)
  gradients: {
    premium: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    gold: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    sunset: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    ocean: 'linear-gradient(135deg, #667eea 0%, #66a6ff 100%)',
    fire: 'linear-gradient(135deg, #ff6a00 0%, #ee0979 100%)'
  }
} as const;

// ============================================
// TYPOGRAPHY - Professional Music Notation
// ============================================

export const typography = {
  // Font Families
  fonts: {
    notation: '"Maestro", "Sonora", "Bravura", serif',
    interface: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: '"JetBrains Mono", "Fira Code", "SF Mono", monospace',
    display: '"Bebas Neue", "Impact", sans-serif'
  },

  // Golden Ratio Scale (1.618)
  sizes: {
    // Base: 16px
    xxs: '0.618rem',    // 9.9px
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    md: '1.125rem',     // 18px
    lg: '1.25rem',      // 20px
    xl: '1.618rem',     // 25.9px
    xxl: '2.618rem',    // 41.9px
    xxxl: '4.236rem',   // 67.8px
    display: '6.854rem' // 109.7px
  },

  // Line Heights (Vertical Rhythm)
  lineHeights: {
    tight: 1.2,
    snug: 1.375,
    normal: 1.618,   // Golden ratio
    relaxed: 1.75,
    loose: 2
  },

  // Font Weights
  weights: {
    thin: 100,
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 900
  },

  // Letter Spacing (Tracking)
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em'
  }
} as const;

// ============================================
// SPACING - Musical Proportions
// ============================================

export const spacing = {
  // Based on musical intervals
  unison: '0',           // 0px
  semitone: '0.125rem',  // 2px
  tone: '0.25rem',       // 4px
  second: '0.5rem',      // 8px
  third: '0.75rem',      // 12px
  fourth: '1rem',        // 16px
  tritone: '1.5rem',     // 24px
  fifth: '2rem',         // 32px
  sixth: '2.5rem',       // 40px
  seventh: '3rem',       // 48px
  octave: '4rem',        // 64px
  ninth: '5rem',         // 80px
  tenth: '6rem',         // 96px
  eleventh: '8rem',      // 128px
  twelfth: '10rem'       // 160px
} as const;

// ============================================
// ANIMATION - Tempo-based Timing
// ============================================

export const animation = {
  // Musical tempo-based durations
  durations: {
    instant: '0ms',
    presto: '100ms',      // Very fast
    vivace: '150ms',      // Fast and lively
    allegro: '200ms',     // Fast
    moderato: '300ms',    // Moderate
    andante: '500ms',     // Walking pace
    adagio: '700ms',      // Slow
    largo: '1000ms',      // Very slow
    grave: '1500ms'       // Extremely slow
  },

  // Easing functions (Bezier curves)
  easings: {
    // Natural motion
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    
    // Musical feels
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    elastic: 'cubic-bezier(0.68, -0.75, 0.265, 1.75)',
    smooth: 'cubic-bezier(0.215, 0.610, 0.355, 1)',
    sharp: 'cubic-bezier(0.755, 0.050, 0.855, 0.060)',
    
    // Professional
    material: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    ios: 'cubic-bezier(0.42, 0, 0.58, 1)',
    swift: 'cubic-bezier(0.4, 0, 0.6, 1)'
  },

  // Spring physics
  springs: {
    gentle: { stiffness: 120, damping: 14 },
    medium: { stiffness: 180, damping: 20 },
    strong: { stiffness: 260, damping: 26 },
    bouncy: { stiffness: 300, damping: 10 }
  }
} as const;

// ============================================
// SHADOWS - Depth & Hierarchy
// ============================================

export const shadows = {
  // Elevation levels (Material Design inspired)
  elevation: {
    0: 'none',
    1: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
    2: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
    3: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
    4: '0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)',
    5: '0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22)'
  },

  // Colored shadows (for buttons)
  colored: {
    primary: '0 4px 14px 0 rgba(26, 26, 46, 0.4)',
    accent: '0 4px 14px 0 rgba(243, 156, 18, 0.4)',
    success: '0 4px 14px 0 rgba(39, 174, 96, 0.4)',
    danger: '0 4px 14px 0 rgba(231, 76, 60, 0.4)'
  },

  // Inset shadows (for inputs)
  inset: {
    light: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    medium: 'inset 0 2px 8px 0 rgba(0, 0, 0, 0.1)',
    strong: 'inset 0 2px 12px 0 rgba(0, 0, 0, 0.15)'
  }
} as const;

// ============================================
// BORDERS & RADII
// ============================================

export const borders = {
  // Border widths
  widths: {
    none: '0',
    hairline: '0.5px',
    thin: '1px',
    medium: '2px',
    thick: '3px',
    heavy: '4px'
  },

  // Border radii (following golden ratio)
  radii: {
    none: '0',
    sm: '0.125rem',    // 2px
    md: '0.25rem',     // 4px
    lg: '0.5rem',      // 8px
    xl: '1rem',        // 16px
    xxl: '1.618rem',   // 26px (golden ratio)
    full: '9999px',    // Pill shape
    circle: '50%'      // Perfect circle
  },

  // Border styles
  styles: {
    solid: 'solid',
    dashed: 'dashed',
    dotted: 'dotted',
    double: 'double'
  }
} as const;

// ============================================
// BREAKPOINTS - Responsive Design
// ============================================

export const breakpoints = {
  // Mobile-first breakpoints
  xs: '320px',   // Small phones
  sm: '640px',   // Large phones
  md: '768px',   // Tablets
  lg: '1024px',  // Small desktops
  xl: '1280px',  // Desktops
  xxl: '1536px', // Large desktops
  xxxl: '1920px' // 4K displays
} as const;

// ============================================
// Z-INDEX - Layering System
// ============================================

export const zIndex = {
  // Semantic z-index scale
  behind: -1,
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  header: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  tooltip: 1600,
  notification: 1700,
  maximum: 9999
} as const;

// ============================================
// GRID SYSTEM - Professional Layout
// ============================================

export const grid = {
  // 12-column grid system
  columns: 12,
  
  // Gutters
  gutters: {
    xs: spacing.second,  // 8px
    sm: spacing.third,   // 12px
    md: spacing.fourth,  // 16px
    lg: spacing.tritone, // 24px
    xl: spacing.fifth    // 32px
  },

  // Container widths
  containers: {
    xs: '100%',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    xxl: '1536px'
  }
} as const;

// ============================================
// EFFECTS - Professional Polish
// ============================================

export const effects = {
  // Glassmorphism
  glass: {
    light: 'backdrop-filter: blur(10px); background: rgba(255, 255, 255, 0.7);',
    dark: 'backdrop-filter: blur(10px); background: rgba(0, 0, 0, 0.7);'
  },

  // Gradients
  gradients: {
    radial: 'radial-gradient(circle at center, var(--color-start), var(--color-end))',
    conic: 'conic-gradient(from 180deg at center, var(--color-start), var(--color-end))',
    mesh: 'background-image: url("data:image/svg+xml...")'  // Complex mesh gradient
  },

  // Filters
  filters: {
    blur: 'blur(8px)',
    brightness: 'brightness(1.1)',
    contrast: 'contrast(1.1)',
    grayscale: 'grayscale(100%)',
    sepia: 'sepia(100%)'
  }
} as const;

// ============================================
// COMPONENT VARIANTS - Atomic Design
// ============================================

export const components = {
  // Button variants
  button: {
    sizes: {
      xs: { height: '24px', padding: '0 8px', fontSize: typography.sizes.xs },
      sm: { height: '32px', padding: '0 12px', fontSize: typography.sizes.sm },
      md: { height: '40px', padding: '0 16px', fontSize: typography.sizes.base },
      lg: { height: '48px', padding: '0 24px', fontSize: typography.sizes.lg },
      xl: { height: '56px', padding: '0 32px', fontSize: typography.sizes.xl }
    },
    
    variants: {
      primary: {
        background: colors.brand.primary,
        color: colors.brand.light,
        border: 'none'
      },
      secondary: {
        background: 'transparent',
        color: colors.brand.primary,
        border: `1px solid ${colors.brand.primary}`
      },
      ghost: {
        background: 'transparent',
        color: colors.brand.primary,
        border: 'none'
      },
      danger: {
        background: colors.musical.sharp,
        color: colors.brand.light,
        border: 'none'
      },
      success: {
        background: colors.musical.major,
        color: colors.brand.light,
        border: 'none'
      }
    }
  },

  // Input variants
  input: {
    sizes: {
      sm: { height: '32px', fontSize: typography.sizes.sm },
      md: { height: '40px', fontSize: typography.sizes.base },
      lg: { height: '48px', fontSize: typography.sizes.lg }
    }
  }
} as const;

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Convert pixel values to rem
 */
export const pxToRem = (px: number): string => `${px / 16}rem`;

/**
 * Generate responsive value
 */
export const responsive = (values: Record<string, string>): string => {
  return Object.entries(values)
    .map(([breakpoint, value]) => `@media (min-width: ${breakpoints[breakpoint as keyof typeof breakpoints]}) { ${value} }`)
    .join(' ');
};

/**
 * Create CSS variable
 */
export const cssVar = (name: string, value: string): string => `--${name}: ${value};`;

/**
 * Apply theme
 */
export const applyTheme = (theme: 'light' | 'dark'): void => {
  const root = document.documentElement;
  
  if (theme === 'dark') {
    root.style.setProperty('--color-background', colors.brand.dark);
    root.style.setProperty('--color-text', colors.brand.light);
  } else {
    root.style.setProperty('--color-background', colors.brand.light);
    root.style.setProperty('--color-text', colors.brand.dark);
  }
};

// Export everything as a unified system
export const designSystem = {
  colors,
  typography,
  spacing,
  animation,
  shadows,
  borders,
  breakpoints,
  zIndex,
  grid,
  effects,
  components,
  // Utility functions
  utils: {
    pxToRem,
    responsive,
    cssVar,
    applyTheme
  }
} as const;

export type DesignSystem = typeof designSystem;
export default designSystem;