import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Sun, Moon, Laptop } from 'lucide-react';
import { useTheme } from '../../store';

/**
 * Public navigation header for guest/unauthenticated pages.
 * Features brand identity, theme switcher, and direct authentication actions.
 */
export const PublicNavbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 w-full h-14 sm:h-16 flex items-center justify-between px-4 sm:px-6 transition-colors duration-200 backdrop-blur-md border-b border-[var(--md-sys-color-outline-variant)]/15 bg-[var(--md-sys-color-surface-container-low)]/90 select-none">
      {/* Brand Logo & Title */}
      <Link to="/" className="flex items-center gap-2.5 group shrink-0" title="BugTracker">
        <div className="w-9 h-9 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] flex items-center justify-center shadow-xs transition-all duration-150 group-hover:brightness-110">
          <Shield className="w-4 h-4" />
        </div>
        <span className="font-bold text-base tracking-tight text-[var(--md-sys-color-on-surface)] leading-none hidden sm:inline-block">
          BugTracker
        </span>
      </Link>

      {/* Action Controls: Theme Switcher + Sign In / Register */}
      <div className="shrink-0 flex items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          title={
            theme === 'system'
              ? 'Theme: System (Auto) — click for Light'
              : theme === 'light'
                ? 'Theme: Light — click for Dark'
                : 'Theme: Dark — click for System'
          }
          aria-label={`Toggle theme (currently ${theme})`}
          className="w-9 h-9 rounded-xl bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
        >
          {theme === 'system' ? (
            <Laptop className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
          ) : theme === 'dark' ? (
            <Moon className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
          ) : (
            <Sun className="w-4 h-4 text-[var(--md-sys-color-warning)]" />
          )}
        </button>

        <Link
          to="/login"
          className="h-9 px-3.5 rounded-xl text-xs font-semibold text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-all flex items-center justify-center active:scale-95"
        >
          Sign In
        </Link>

        <Link
          to="/register"
          className="h-9 px-3.5 rounded-xl text-xs font-semibold bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center shadow-xs"
        >
          Create Account
        </Link>
      </div>
    </header>
  );
};
