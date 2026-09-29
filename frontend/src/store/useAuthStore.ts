import { create } from 'zustand';
import { api, type UserProfile, type AuthTokens } from '../api/client';

export interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  sessionExpiredOpen: boolean;
  setSessionExpiredOpen: (open: boolean) => void;
  setUser: (user: UserProfile | null) => void;
  login: (tokens: AuthTokens) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

import { queryClient } from '../api/queryClient.js';

let isLoggingOut = false;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  sessionExpiredOpen: false,

  setSessionExpiredOpen: (open: boolean) => set({ sessionExpiredOpen: open }),

  setUser: (user: UserProfile | null) => set({ user }),

  refreshUser: async () => {
    try {
      const profile = await api.getProfile();
      set({ user: profile, loading: false });
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({ user: null, loading: false });
    }
  },

  login: async (tokens: AuthTokens) => {
    if (tokens.accessToken) {
      localStorage.setItem('accessToken', tokens.accessToken);
    }
    if (tokens.refreshToken) {
      localStorage.setItem('refreshToken', tokens.refreshToken);
    }
    if (tokens.user) {
      set({
        user: {
          ...tokens.user,
          oauthProvider: tokens.user.oauthProvider || 'LOCAL',
        },
        loading: false,
      });
    } else {
      set({ loading: true });
    }
    await get().refreshUser();
  },

  logout: async () => {
    isLoggingOut = true;
    set({ sessionExpiredOpen: false });
    queryClient.clear();
    try {
      await api.logout();
    } catch {
      // Proceed with client logout even if backend token is already expired
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      set({ user: null, loading: false, sessionExpiredOpen: false });
      setTimeout(() => {
        isLoggingOut = false;
      }, 500);
    }
  },
}));

if (typeof window !== 'undefined') {
  // Listen to unauthorized event dispatched on token expiration
  window.addEventListener('bt:unauthorized', () => {
    // Only open sessionExpired modal if the user was actively authenticated and is not intentionally logging out
    if (!isLoggingOut && useAuthStore.getState().user !== null) {
      useAuthStore.setState({ user: null, sessionExpiredOpen: true, loading: false });
      queryClient.clear();
    } else {
      useAuthStore.setState({ user: null, sessionExpiredOpen: false, loading: false });
    }
  });

  // Automatically refresh user on initial load if tokens exist
  if (localStorage.getItem('accessToken')) {
    useAuthStore.getState().refreshUser();
  } else {
    useAuthStore.setState({ loading: false });
  }
}

/**
 * Drop-in hook selector for components.
 */
export const useAuth = () => useAuthStore();
