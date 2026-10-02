import React, { useEffect } from 'react';
import { useSidebar, useTheme } from '../store';
import { useUserPreferencesQuery, useUpdateUserPreferencesMutation } from '../api/queries';
import { Button } from '../components/ui';
import {
  Sliders,
  Moon,
  Sun,
  LayoutDashboard,
  Kanban,
  Layers,
  Sparkles,
  Check,
  Cloud,
  RefreshCw,
  Shield,
} from 'lucide-react';

export const PreferencesPage: React.FC = () => {
  const {
    showCollapsedLabels,
    setShowCollapsedLabels,
    toggleCollapsedLabels,
    collapseMode,
    setCollapseMode,
    brandStyle,
    setBrandStyle,
  } = useSidebar();
  const { theme, setTheme } = useTheme();

  const { data: serverPrefs } = useUserPreferencesQuery();
  const updatePrefsMutation = useUpdateUserPreferencesMutation();

  // Sync initial preferences from PostgreSQL when available
  useEffect(() => {
    if (serverPrefs) {
      if (serverPrefs.theme && (serverPrefs.theme === 'light' || serverPrefs.theme === 'dark') && serverPrefs.theme !== theme) {
        setTheme(serverPrefs.theme);
      }
      if (typeof serverPrefs.showCollapsedLabels === 'boolean' && serverPrefs.showCollapsedLabels !== showCollapsedLabels) {
        setShowCollapsedLabels(serverPrefs.showCollapsedLabels);
      }
    }
  }, [serverPrefs]);

  const handleToggleLabels = () => {
    const nextVal = !showCollapsedLabels;
    toggleCollapsedLabels();
    updatePrefsMutation.mutate({ showCollapsedLabels: nextVal });
  };

  const handleResetLabels = () => {
    setShowCollapsedLabels(false);
    updatePrefsMutation.mutate({ showCollapsedLabels: false });
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    updatePrefsMutation.mutate({ theme: newTheme });
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-5 flex-1 flex flex-col min-w-0 space-y-6 animate-in fade-in duration-200">
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Settings Controls */}
        <div className="lg:col-span-8 space-y-6">

          {/* Setting Card 1: Collapsed Sidebar Labels */}
          <div className="p-6 space-y-5 rounded-3xl border border-[var(--md-sys-color-outline-variant)]/20 bg-[var(--md-sys-color-surface-container-low)] shadow-xs">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                    Collapsed Sidebar Text Labels
                  </h2>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] font-semibold">
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
                onClick={handleToggleLabels}
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

            <div className="pt-3 border-t border-[var(--md-sys-color-surface-container-high)] flex items-center justify-between text-xs">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">
                Status: <strong className="text-[var(--md-sys-color-on-surface)]">{showCollapsedLabels ? 'Labels Enabled' : 'Icons Only (Default)'}</strong>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetLabels}
                disabled={!showCollapsedLabels}
              >
                Reset to Default
              </Button>
            </div>
          </div>

          {/* Setting Card: Sidebar Collapse Behavior (Rail vs Hidden) */}
          <div className="p-6 space-y-5 rounded-3xl border border-[var(--md-sys-color-outline-variant)]/20 bg-[var(--md-sys-color-surface-container-low)] shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                  Sidebar Collapse Behavior
                </h2>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] font-semibold">
                  Layout
                </span>
              </div>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                Choose how the sidebar behaves when collapsed using the shortcut <kbd className="px-1.5 py-0.5 rounded-md bg-[var(--md-sys-color-surface-container-high)] font-mono text-[10px] text-[var(--md-sys-color-on-surface)]">[</kbd> or the collapse button.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: Rail */}
              <button
                type="button"
                onClick={() => setCollapseMode('rail')}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                  collapseMode === 'rail'
                    ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/20 shadow-xs'
                    : 'border-[var(--md-sys-color-outline-variant)]/30 bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                }`}
              >
                <div>
                  <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
                    Navigation Rail (60px)
                  </p>
                  <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-1 leading-relaxed">
                    Shrinks to a compact icon strip. Navigation landmarks and tooltips remain 1-click accessible.
                  </p>
                </div>
                {collapseMode === 'rail' && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-[var(--md-sys-color-primary)]">
                    <Check className="w-3.5 h-3.5" /> Active
                  </span>
                )}
              </button>

              {/* Option 2: Hidden (Linear style) */}
              <button
                type="button"
                onClick={() => setCollapseMode('hidden')}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                  collapseMode === 'hidden'
                    ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/20 shadow-xs'
                    : 'border-[var(--md-sys-color-outline-variant)]/30 bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                }`}
              >
                <div>
                  <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
                    Completely Hidden (0px)
                  </p>
                  <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-1 leading-relaxed">
                    Hides the sidebar entirely to maximize board and issue detail horizontal canvas. Expand via <kbd className="font-mono">[</kbd> or header button.
                  </p>
                </div>
                {collapseMode === 'hidden' && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-[var(--md-sys-color-primary)]">
                    <Check className="w-3.5 h-3.5" /> Active
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Setting Card: Brand Logo Style (Vibrant vs Metallic) */}
          <div className="p-6 space-y-5 rounded-3xl border border-[var(--md-sys-color-outline-variant)]/20 bg-[var(--md-sys-color-surface-container-low)] shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                  Brand Logo Style
                </h2>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] font-semibold">
                  Branding
                </span>
              </div>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                Choose the visual aesthetic for the BugTracker logo and title in the sidebar.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: Vibrant Gradient */}
              <button
                type="button"
                onClick={() => setBrandStyle('vibrant')}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                  brandStyle === 'vibrant'
                    ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/20 shadow-xs'
                    : 'border-[var(--md-sys-color-outline-variant)]/30 bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--md-sys-color-primary)] via-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.35)] shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold bg-gradient-to-r from-[var(--md-sys-color-primary)] via-indigo-500 to-cyan-400 bg-clip-text text-transparent">
                      Vibrant Gradient (Default)
                    </p>
                    <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5 leading-relaxed">
                      Electric primary, indigo, and cyan gradient with an illuminated shield badge.
                    </p>
                  </div>
                </div>
                {brandStyle === 'vibrant' && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-[var(--md-sys-color-primary)]">
                    <Check className="w-3.5 h-3.5" /> Active
                  </span>
                )}
              </button>

              {/* Option 2: Metallic Titanium */}
              <button
                type="button"
                onClick={() => setBrandStyle('metallic')}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                  brandStyle === 'metallic'
                    ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/20 shadow-xs'
                    : 'border-[var(--md-sys-color-outline-variant)]/30 bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-800 via-slate-900 to-black dark:from-slate-700 dark:via-zinc-800 dark:to-zinc-950 text-slate-100 ring-1 ring-white/20 border border-white/10 shadow-xs flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4 text-slate-200" />
                  </div>
                  <div>
                    <p className="text-xs font-bold bg-gradient-to-r from-slate-900 via-slate-600 to-slate-900 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
                      Metallic Titanium
                    </p>
                    <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5 leading-relaxed">
                      High-contrast titanium silver finish with dark glassmorphic badge.
                    </p>
                  </div>
                </div>
                {brandStyle === 'metallic' && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-[var(--md-sys-color-primary)]">
                    <Check className="w-3.5 h-3.5" /> Active
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Setting Card 2: Theme / Appearance */}
          <div className="p-6 space-y-5 rounded-3xl border border-[var(--md-sys-color-outline-variant)]/20 bg-[var(--md-sys-color-surface-container-low)] shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                  Visual Theme
                </h2>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] font-semibold">
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
                onClick={() => handleThemeChange('light')}
                className={`p-4 rounded-2xl border flex flex-col items-center gap-3 transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/20 shadow-xs'
                    : 'border-[var(--md-sys-color-outline-variant)]/30 bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-[var(--md-sys-color-warning-container)] text-[var(--md-sys-color-on-warning-container)] flex items-center justify-center">
                  <Sun className="w-5 h-5 text-[var(--md-sys-color-warning)]" />
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
                onClick={() => handleThemeChange('dark')}
                className={`p-4 rounded-2xl border flex flex-col items-center gap-3 transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/20 shadow-xs'
                    : 'border-[var(--md-sys-color-outline-variant)]/30 bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center">
                  <Moon className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
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
          </div>
        </div>

        {/* Right Column: Live Interactive Preview */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-6">
          <div className="p-6 rounded-3xl border border-[var(--md-sys-color-outline-variant)]/20 bg-[var(--md-sys-color-surface-container-low)] space-y-4 shadow-xs">
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
            <div className="w-[72px] mx-auto py-3 rounded-2xl bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]/30 flex flex-col items-center gap-3 select-none">
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

            <div className="p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-container)]/70 dark:bg-[var(--md-sys-color-surface-container-high)] text-[11px] text-[var(--md-sys-color-on-surface-variant)] space-y-1">
              <span className="font-semibold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
                {updatePrefsMutation.isPending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[var(--md-sys-color-primary)]" />
                    Syncing with account...
                  </>
                ) : (
                  <>
                    <Cloud className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                    Cloud Synchronized
                  </>
                )}
              </span>
              Settings are saved automatically to your user profile and synchronized across all devices.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
