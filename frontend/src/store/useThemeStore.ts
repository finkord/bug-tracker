import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark';

export interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const applyThemeToDocument = (theme: Theme): void => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
    root.style.colorScheme = 'light';
  }
  const meta = document.querySelector('meta[name="color-scheme"]');
  if (meta) {
    meta.setAttribute('content', theme);
  }
};

const getStoredTheme = (): Theme => {
  if (typeof window === 'undefined') return 'dark';
  try {
    const raw = localStorage.getItem('theme');
    if (!raw) return 'dark';
    if (raw === 'dark' || raw === 'light') return raw;
    const parsed = JSON.parse(raw);
    if (parsed?.state?.theme === 'light' || parsed?.state?.theme === 'dark') {
      return parsed.state.theme;
    }
  } catch {
    // fallback to dark
  }
  return 'dark';
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: getStoredTheme(),
      toggleTheme: () =>
        set((state) => {
          const next = state.theme === 'dark' ? 'light' : 'dark';
          applyThemeToDocument(next);
          return { theme: next };
        }),
      setTheme: (theme: Theme) => {
        applyThemeToDocument(theme);
        set({ theme });
      },
    }),
    {
      name: 'theme',
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          applyThemeToDocument(state.theme);
        }
      },
    },
  ),
);

// Apply initial theme on module execution if available in browser
if (typeof window !== 'undefined') {
  applyThemeToDocument(getStoredTheme());
}

/**
 * Drop-in hook selector for components.
 */
export const useTheme = () => useThemeStore();
