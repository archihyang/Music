import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'light' | 'dark' | 'system';

// 로컬 스토리지 키
const THEME_STORAGE_KEY = 'genesis-music-theme';

// 시스템 테마 감지
function getSystemTheme(): 'light' | 'dark' {
  if (!browser) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// 저장된 테마 가져오기
function getStoredTheme(): Theme {
  if (!browser) return 'system';
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'system';
}

// 테마 스토어 생성
function createThemeStore() {
  const { subscribe, set, update } = writable<Theme>(getStoredTheme());
  
  return {
    subscribe,
    set: (theme: Theme) => {
      if (browser) {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
      }
      set(theme);
    },
    toggle: () => {
      update(current => {
        const next = current === 'light' ? 'dark' : 
                     current === 'dark' ? 'system' : 'light';
        if (browser) {
          localStorage.setItem(THEME_STORAGE_KEY, next);
        }
        return next;
      });
    },
    reset: () => {
      if (browser) {
        localStorage.removeItem(THEME_STORAGE_KEY);
      }
      set('system');
    }
  };
}

// 메인 테마 스토어
export const themeStore = createThemeStore();

// 실제 적용될 테마 (system 설정 고려)
export const actualTheme = derived(
  themeStore,
  $theme => {
    if ($theme === 'system') {
      return getSystemTheme();
    }
    return $theme;
  }
);

// 테마 적용 함수
export function applyTheme(theme: 'light' | 'dark') {
  if (!browser) return;
  
  const root = document.documentElement;
  
  if (theme === 'dark') {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
    
    // CSS 변수 업데이트
    root.style.setProperty('--bg-primary', '#0a0a0a');
    root.style.setProperty('--bg-secondary', '#171717');
    root.style.setProperty('--bg-tertiary', '#262626');
    root.style.setProperty('--text-primary', '#fafafa');
    root.style.setProperty('--text-secondary', '#d4d4d4');
    root.style.setProperty('--text-tertiary', '#a3a3a3');
    root.style.setProperty('--border-color', '#404040');
    root.style.setProperty('--notation-staff', '#e5e5e5');
    root.style.setProperty('--notation-note', '#ffffff');
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
    
    // CSS 변수 업데이트
    root.style.setProperty('--bg-primary', '#ffffff');
    root.style.setProperty('--bg-secondary', '#fafafa');
    root.style.setProperty('--bg-tertiary', '#f5f5f5');
    root.style.setProperty('--text-primary', '#171717');
    root.style.setProperty('--text-secondary', '#525252');
    root.style.setProperty('--text-tertiary', '#737373');
    root.style.setProperty('--border-color', '#e5e5e5');
    root.style.setProperty('--notation-staff', '#000000');
    root.style.setProperty('--notation-note', '#000000');
  }
}

// 시스템 테마 변경 감지
if (browser) {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  mediaQuery.addEventListener('change', (e) => {
    themeStore.subscribe(theme => {
      if (theme === 'system') {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    })();
  });
  
  // 초기 테마 적용
  actualTheme.subscribe(theme => {
    applyTheme(theme);
  });
}

// 테마 관련 유틸리티 함수들
export const themeUtils = {
  /**
   * 현재 테마가 다크 모드인지 확인
   */
  isDark: () => {
    let isDark = false;
    actualTheme.subscribe(theme => {
      isDark = theme === 'dark';
    })();
    return isDark;
  },
  
  /**
   * 테마별 색상 가져오기
   */
  getColor: (lightColor: string, darkColor: string) => {
    return themeUtils.isDark() ? darkColor : lightColor;
  },
  
  /**
   * 테마별 클래스 생성
   */
  getThemeClass: (baseClass: string) => {
    return `${baseClass} ${themeUtils.isDark() ? `${baseClass}--dark` : `${baseClass}--light`}`;
  }
};