/**
 * Authentication store
 */
import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import type { User } from '$lib/types';

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

function createAuthStore() {
  // Load initial state from localStorage
  const storedAuth = browser ? localStorage.getItem('auth') : null;
  const initialState: AuthState = storedAuth
    ? JSON.parse(storedAuth)
    : {
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      };

  const { subscribe, set, update } = writable<AuthState>(initialState);

  return {
    subscribe,

    login(user: User, accessToken: string, refreshToken: string) {
      const state: AuthState = {
        user,
        accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
      };
      
      set(state);
      
      if (browser) {
        localStorage.setItem('auth', JSON.stringify(state));
      }
    },

    logout() {
      const state: AuthState = {
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      };
      
      set(state);
      
      if (browser) {
        localStorage.removeItem('auth');
      }
    },

    updateTokens(accessToken: string, refreshToken: string) {
      update(state => {
        const newState = {
          ...state,
          accessToken,
          refreshToken,
        };
        
        if (browser) {
          localStorage.setItem('auth', JSON.stringify(newState));
        }
        
        return newState;
      });
    },

    updateUser(user: User) {
      update(state => {
        const newState = {
          ...state,
          user,
        };
        
        if (browser) {
          localStorage.setItem('auth', JSON.stringify(newState));
        }
        
        return newState;
      });
    },

    setLoading(isLoading: boolean) {
      update(state => ({ ...state, isLoading }));
    },
  };
}

export const authStore = createAuthStore();

// Derived stores
export const isAuthenticated = derived(
  authStore,
  $authStore => $authStore.isAuthenticated
);

export const currentUser = derived(
  authStore,
  $authStore => $authStore.user
);