import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

export interface ThemeState {
  theme: Theme;
  effectiveTheme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

const resolveEffectiveTheme = (theme: Theme): 'light' | 'dark' => {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
};

const applyThemeToDocument = (theme: Theme): void => {
  if (typeof document === 'undefined') return;
  const effective = resolveEffectiveTheme(theme);
  const root = document.documentElement;

  if (effective === 'dark') {
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
    meta.setAttribute('content', effective);
  }
};

const getStoredTheme = (): Theme => {
  if (typeof window === 'undefined') return 'system';
  try {
    const raw = localStorage.getItem('theme');
    if (!raw) return 'system';
    if (raw === 'dark' || raw === 'light' || raw === 'system') return raw;
    const parsed = JSON.parse(raw);
    if (parsed?.state?.theme) {
      return parsed.state.theme;
    }
  } catch {
    // fallback
  }
  return 'system';
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: getStoredTheme(),
      effectiveTheme: resolveEffectiveTheme(getStoredTheme()),
      toggleTheme: () =>
        set((state) => {
          // Cycle: system -> light -> dark -> system
          let next: Theme = 'light';
          if (state.theme === 'light') next = 'dark';
          else if (state.theme === 'dark') next = 'system';
          else next = 'light';

          applyThemeToDocument(next);
          return { theme: next, effectiveTheme: resolveEffectiveTheme(next) };
        }),
      setTheme: (theme: Theme) => {
        applyThemeToDocument(theme);
        set({ theme, effectiveTheme: resolveEffectiveTheme(theme) });
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

// Apply initial theme on module execution and bind OS listener
if (typeof window !== 'undefined') {
  const initial = getStoredTheme();
  applyThemeToDocument(initial);

  if (window.matchMedia) {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', () => {
      const current = useThemeStore.getState().theme;
      if (current === 'system') {
        applyThemeToDocument('system');
        useThemeStore.setState({ effectiveTheme: getSystemTheme() });
      }
    });
  }
}

/**
 * Drop-in hook selector for components.
 */
export const useTheme = () => useThemeStore();
