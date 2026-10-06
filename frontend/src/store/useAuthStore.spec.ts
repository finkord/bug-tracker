import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useThemeStore } from './useThemeStore';
import { useAuthStore } from './useAuthStore';

describe('useThemeStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useThemeStore.setState({ theme: 'dark' });
  });

  it('should initialize with dark theme', () => {
    expect(useThemeStore.getState().theme).toBe('dark');
  });

  it('should toggle theme through three states (dark -> system -> light -> dark)', () => {
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('system');
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('light');
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('dark');
  });

  it('should set explicit theme', () => {
    useThemeStore.getState().setTheme('light');
    expect(useThemeStore.getState().theme).toBe('light');
  });
});

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ user: null, loading: false, sessionExpiredOpen: false });
    vi.restoreAllMocks();
  });

  it('should initialize with user null and loading false', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.sessionExpiredOpen).toBe(false);
  });

  it('should set sessionExpiredOpen', () => {
    useAuthStore.getState().setSessionExpiredOpen(true);
    expect(useAuthStore.getState().sessionExpiredOpen).toBe(true);
  });

  it('should handle logout', async () => {
    localStorage.setItem('accessToken', 'mock-token');
    useAuthStore.setState({ user: { id: 1, email: 'test@example.com', fullName: 'Test User', systemRole: 'ADMIN', isActivated: true, isBlocked: false, twoFactorEnabled: false, createdAt: '' } });
    await useAuthStore.getState().logout();
    expect(useAuthStore.getState().user).toBeNull();
    expect(localStorage.getItem('accessToken')).toBeNull();
  });
});
