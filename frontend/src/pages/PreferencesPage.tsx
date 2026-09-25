import React from 'react';
import { useSidebar } from '../context/SidebarContext';
import { useTheme } from '../context/ThemeContext';
import { Card, Button } from '../components/ui';
import {
  Sliders,
  Moon,
  Sun,
  LayoutDashboard,
  Kanban,
  Layers,
  Sparkles,
  Check,
} from 'lucide-react';

export const PreferencesPage: React.FC = () => {
  const { showCollapsedLabels, setShowCollapsedLabels, toggleCollapsedLabels } = useSidebar();
  const { theme, setTheme } = useTheme();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center shadow-xs">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--md-sys-color-on-surface)]">
              Preferences
            </h1>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
              Personalize your workspace aesthetics, navigation rail behavior, and interface settings
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Columns: Settings Controls */}
        <div className="md:col-span-2 space-y-6">

          {/* Setting Card 1: Collapsed Sidebar Labels */}
          <Card className="p-6 space-y-5 rounded-2xl border border-[var(--md-sys-color-outline-variant)]/20 bg-[var(--md-sys-color-surface-container-low)]">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                    Collapsed Sidebar Text Labels
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] font-semibold">
                    Navigation
                  </span>
                </div>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                  Choose whether to display compact text labels below icons when the sidebar is collapsed in navigation rail mode.
                </p>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={showCollapsedLabels}
                onClick={toggleCollapsedLabels}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  showCollapsedLabels
                    ? 'bg-[var(--md-sys-color-primary)]'
                    : 'bg-[var(--md-sys-color-surface-container-highest)]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    showCollapsedLabels ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="pt-2 border-t border-[var(--md-sys-color-outline-variant)]/20 flex items-center justify-between text-xs">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">
                Status: <strong className="text-[var(--md-sys-color-on-surface)]">{showCollapsedLabels ? 'Labels Enabled' : 'Icons Only (Default)'}</strong>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCollapsedLabels(false)}
                disabled={!showCollapsedLabels}
              >
                Reset to Default
              </Button>
            </div>
          </Card>

          {/* Setting Card 2: Theme / Appearance */}
          <Card className="p-6 space-y-5 rounded-2xl border border-[var(--md-sys-color-outline-variant)]/20 bg-[var(--md-sys-color-surface-container-low)]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                  Visual Theme
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] font-semibold">
                  Appearance
                </span>
              </div>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                Select your preferred interface color mode.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Light Mode Option */}
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-4 rounded-2xl border flex flex-col items-center gap-3 transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/20 shadow-xs'
                    : 'border-[var(--md-sys-color-outline-variant)]/30 hover:bg-[var(--md-sys-color-surface-container)]'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Sun className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">Light Mode</p>
                  <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                    Clean, high-clarity daylight theme
                  </p>
                </div>
                {theme === 'light' && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-[var(--md-sys-color-primary)]">
                    <Check className="w-3.5 h-3.5" /> Active
                  </span>
                )}
              </button>

              {/* Dark Mode Option */}
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-4 rounded-2xl border flex flex-col items-center gap-3 transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/20 shadow-xs'
                    : 'border-[var(--md-sys-color-outline-variant)]/30 hover:bg-[var(--md-sys-color-surface-container)]'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <Moon className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">Dark Mode</p>
                  <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                    Sleek, low-glare dark palette
                  </p>
                </div>
                {theme === 'dark' && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-[var(--md-sys-color-primary)]">
                    <Check className="w-3.5 h-3.5" /> Active
                  </span>
                )}
              </button>
            </div>
          </Card>
        </div>

        {/* Right 1 Column: Live Interactive Preview */}
        <div className="space-y-4">
          <Card className="p-5 rounded-2xl border border-[var(--md-sys-color-outline-variant)]/20 bg-[var(--md-sys-color-surface-container-low)] space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                Live Rail Preview
              </h3>
            </div>

            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
              Real-time representation of your collapsed navigation rail with current settings:
            </p>

            {/* Mock Navigation Rail */}
            <div className="w-[72px] mx-auto py-3 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/20 flex flex-col items-center gap-3 select-none">
              {/* Active Mock Item */}
              <div className="w-full flex flex-col items-center justify-center gap-1">
                <div className="w-14 h-8 rounded-full bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-primary)] flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5" />
                </div>
                {showCollapsedLabels && (
                  <span className="text-[10px] font-bold text-[var(--md-sys-color-on-surface)] animate-in fade-in">
                    Dash
                  </span>
                )}
              </div>

              {/* Inactive Mock Item */}
              <div className="w-full flex flex-col items-center justify-center gap-1 opacity-70 hover:opacity-100 transition-opacity">
                <div className="w-14 h-8 rounded-full text-[var(--md-sys-color-on-surface-variant)] flex items-center justify-center">
                  <Kanban className="w-5 h-5" />
                </div>
                {showCollapsedLabels && (
                  <span className="text-[10px] font-medium text-[var(--md-sys-color-on-surface-variant)] animate-in fade-in">
                    Kanban
                  </span>
                )}
              </div>

              {/* Inactive Mock Item 2 */}
              <div className="w-full flex flex-col items-center justify-center gap-1 opacity-70 hover:opacity-100 transition-opacity">
                <div className="w-14 h-8 rounded-full text-[var(--md-sys-color-on-surface-variant)] flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                {showCollapsedLabels && (
                  <span className="text-[10px] font-medium text-[var(--md-sys-color-on-surface-variant)] animate-in fade-in">
                    Backlog
                  </span>
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface-container)]/50 text-[11px] text-[var(--md-sys-color-on-surface-variant)] space-y-1">
              <span className="font-semibold text-[var(--md-sys-color-on-surface)] block">
                Instant Persistence
              </span>
              Settings are saved automatically and synchronized across all active browser windows.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
