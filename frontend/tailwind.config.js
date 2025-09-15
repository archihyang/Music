/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{html,js,svelte,ts}',
    './index.html'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF6B35',
          dark: '#E55525',
          light: '#FF8555'
        },
        secondary: {
          DEFAULT: '#004E89',
          dark: '#003A6B',
          light: '#0066B3'
        },
        accent: {
          DEFAULT: '#A8DADC',
          dark: '#7BC4C7',
          light: '#C5E7E9'
        },
        dark: {
          DEFAULT: '#1D3557',
          light: '#2A4570',
          lighter: '#3D5A8C'
        },
        surface: {
          DEFAULT: '#F1FAEE',
          dark: '#1A1A1A'
        }
      },
      fontFamily: {
        'heading': ['Bebas Neue', 'sans-serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace']
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out'
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        }
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ]
}