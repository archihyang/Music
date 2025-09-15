/**
 * Genesis Music Design System
 * 전문가급 음악 소프트웨어를 위한 디자인 시스템
 */

export const colors = {
  // Primary Colors - 음악적 영감을 받은 색상
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',  // Main
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49'
  },
  
  // Secondary Colors - 따뜻한 악센트
  secondary: {
    50: '#fef3f2',
    100: '#fee5e2',
    200: '#fcceca',
    300: '#f9a8a5',
    400: '#f37370',
    500: '#ea4444',  // Main
    600: '#d72626',
    700: '#b31c1c',
    800: '#941b1b',
    900: '#7a1e1e',
    950: '#420a0a'
  },
  
  // Neutral Colors - 깔끔한 인터페이스
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a'
  },
  
  // Semantic Colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Music Notation Specific
  notation: {
    staff: '#000000',
    note: '#000000',
    rest: '#666666',
    dynamic: '#333333',
    tempo: '#666666',
    accent: '#0ea5e9',
    highlight: '#fbbf24',
    selection: 'rgba(14, 165, 233, 0.2)'
  }
};

export const typography = {
  // Font Families
  fonts: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    serif: 'Georgia, Cambria, "Times New Roman", Times, serif',
    mono: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", monospace',
    music: '"Bravura", "Maestro", "Opus", serif'  // 악보 전용 폰트
  },
  
  // Font Sizes
  sizes: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem'      // 48px
  },
  
  // Line Heights
  lineHeights: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2'
  },
  
  // Font Weights
  weights: {
    thin: 100,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800
  }
};

export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
};

export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  DEFAULT: '0.25rem', // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px'
};

export const shadows = {
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  DEFAULT: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  '2xl': '0 35px 60px -15px rgba(0, 0, 0, 0.3)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  none: 'none',
  
  // Music specific shadows
  notation: '0 2px 8px rgba(0, 0, 0, 0.15)',
  toolbar: '0 4px 12px rgba(0, 0, 0, 0.1)',
  panel: '0 8px 24px rgba(0, 0, 0, 0.12)'
};

export const transitions = {
  fast: '150ms ease-in-out',
  base: '250ms ease-in-out',
  slow: '350ms ease-in-out',
  
  // Specific transitions
  color: 'color 250ms ease-in-out',
  background: 'background-color 250ms ease-in-out',
  border: 'border-color 250ms ease-in-out',
  shadow: 'box-shadow 250ms ease-in-out',
  transform: 'transform 250ms ease-in-out',
  opacity: 'opacity 250ms ease-in-out',
  all: 'all 250ms ease-in-out'
};

export const breakpoints = {
  xs: '475px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  '3xl': '1920px'
};

export const zIndex = {
  auto: 'auto',
  0: 0,
  10: 10,     // Base elements
  20: 20,     // Floating elements
  30: 30,     // Dropdowns
  40: 40,     // Sticky elements
  50: 50,     // Overlays
  60: 60,     // Modals
  70: 70,     // Popovers
  80: 80,     // Tooltips
  90: 90,     // Notifications
  100: 100,   // Critical UI
  max: 9999   // Maximum
};

// Dark Theme Colors
export const darkColors = {
  primary: colors.primary,
  secondary: colors.secondary,
  
  neutral: {
    50: '#0a0a0a',
    100: '#171717',
    200: '#262626',
    300: '#404040',
    400: '#525252',
    500: '#737373',
    600: '#a3a3a3',
    700: '#d4d4d4',
    800: '#e5e5e5',
    900: '#f5f5f5',
    950: '#fafafa'
  },
  
  notation: {
    staff: '#e5e5e5',
    note: '#ffffff',
    rest: '#a3a3a3',
    dynamic: '#d4d4d4',
    tempo: '#a3a3a3',
    accent: '#38bdf8',
    highlight: '#fbbf24',
    selection: 'rgba(56, 189, 248, 0.3)'
  },
  
  background: {
    primary: '#0a0a0a',
    secondary: '#171717',
    tertiary: '#262626',
    accent: '#404040'
  },
  
  text: {
    primary: '#fafafa',
    secondary: '#d4d4d4',
    tertiary: '#a3a3a3',
    disabled: '#525252'
  }
};

// Component Specific Styles
export const components = {
  button: {
    sizes: {
      sm: {
        padding: `${spacing[2]} ${spacing[3]}`,
        fontSize: typography.sizes.sm,
        borderRadius: borderRadius.md
      },
      md: {
        padding: `${spacing[2.5]} ${spacing[4]}`,
        fontSize: typography.sizes.base,
        borderRadius: borderRadius.md
      },
      lg: {
        padding: `${spacing[3]} ${spacing[5]}`,
        fontSize: typography.sizes.lg,
        borderRadius: borderRadius.lg
      }
    },
    variants: {
      primary: {
        background: colors.primary[500],
        color: '#ffffff',
        hover: colors.primary[600],
        active: colors.primary[700]
      },
      secondary: {
        background: colors.neutral[200],
        color: colors.neutral[800],
        hover: colors.neutral[300],
        active: colors.neutral[400]
      },
      ghost: {
        background: 'transparent',
        color: colors.neutral[700],
        hover: colors.neutral[100],
        active: colors.neutral[200]
      }
    }
  },
  
  input: {
    base: {
      padding: `${spacing[2]} ${spacing[3]}`,
      borderRadius: borderRadius.md,
      borderWidth: '1px',
      borderColor: colors.neutral[300],
      fontSize: typography.sizes.base,
      transition: transitions.all
    },
    focus: {
      borderColor: colors.primary[500],
      outline: 'none',
      boxShadow: `0 0 0 3px ${colors.primary[500]}20`
    }
  },
  
  card: {
    base: {
      padding: spacing[6],
      borderRadius: borderRadius.xl,
      background: '#ffffff',
      boxShadow: shadows.md
    },
    hover: {
      boxShadow: shadows.lg,
      transform: 'translateY(-2px)'
    }
  },
  
  toolbar: {
    height: '48px',
    background: '#ffffff',
    borderBottom: `1px solid ${colors.neutral[200]}`,
    boxShadow: shadows.toolbar,
    padding: `0 ${spacing[4]}`
  },
  
  sidebar: {
    width: '280px',
    background: colors.neutral[50],
    borderRight: `1px solid ${colors.neutral[200]}`
  },
  
  notation: {
    staffHeight: '100px',
    staffSpacing: '20px',
    measureWidth: '200px',
    noteSize: '1rem',
    staffLineWidth: '1px',
    barLineWidth: '2px'
  }
};

// Animations
export const animations = {
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 }
  },
  
  slideInLeft: {
    from: { transform: 'translateX(-100%)', opacity: 0 },
    to: { transform: 'translateX(0)', opacity: 1 }
  },
  
  slideInRight: {
    from: { transform: 'translateX(100%)', opacity: 0 },
    to: { transform: 'translateX(0)', opacity: 1 }
  },
  
  slideInUp: {
    from: { transform: 'translateY(100%)', opacity: 0 },
    to: { transform: 'translateY(0)', opacity: 1 }
  },
  
  slideInDown: {
    from: { transform: 'translateY(-100%)', opacity: 0 },
    to: { transform: 'translateY(0)', opacity: 1 }
  },
  
  scaleIn: {
    from: { transform: 'scale(0.9)', opacity: 0 },
    to: { transform: 'scale(1)', opacity: 1 }
  },
  
  pulse: {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.5 }
  }
};

// Export theme object
export const theme = {
  colors,
  darkColors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  breakpoints,
  zIndex,
  components,
  animations
};

export default theme;