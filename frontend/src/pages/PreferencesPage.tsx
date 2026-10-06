import React, { useEffect } from 'react';
import { useSidebar, useTheme, type BrandStyle } from '../store';
import { useUserPreferencesQuery, useUpdateUserPreferencesMutation } from '../api/queries';
import { Card, Button, Badge } from '../components/ui/index.js';
import {
  Sun,
  Moon,
  Laptop,
  Check,
  Shield,
  Cloud,
  RefreshCw,
} from 'lucide-react';

const BRAND_PALETTE: Array<{ id: BrandStyle; label: string; bg: string }> = [
  { id: 'vibrant', label: 'Vibrant', bg: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500' },
  { id: 'metallic', label: 'Metallic', bg: 'bg-gradient-to-r from-slate-700 to-zinc-900' },
  { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-600' },
  { id: 'blue', label: 'Blue', bg: 'bg-blue-600' },
  { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-600' },
  { id: 'amber', label: 'Amber', bg: 'bg-amber-600' },
  { id: 'rose', label: 'Rose', bg: 'bg-rose-600' },
  { id: 'purple', label: 'Purple', bg: 'bg-purple-600' },
  { id: 'cyan', label: 'Cyan', bg: 'bg-cyan-600' },
  { id: 'violet', label: 'Violet', bg: 'bg-violet-600' },
];

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

  const hasSyncedServerThemeRef = React.useRef(false);

  // Sync initial preferences from backend when available
  useEffect(() => {
    if (serverPrefs) {
      if (!hasSyncedServerThemeRef.current) {
        hasSyncedServerThemeRef.current = true;
        const hasStoredLocal = typeof window !== 'undefined' && !!localStorage.getItem('theme');
        if (!hasStoredLocal && serverPrefs.theme && ['light', 'dark', 'system'].includes(serverPrefs.theme as string)) {
          setTheme(serverPrefs.theme as 'light' | 'dark' | 'system');
        } else if (hasStoredLocal && serverPrefs.theme && serverPrefs.theme !== theme) {
          updatePrefsMutation.mutate({ theme });
        }
      }
      if (typeof serverPrefs.showCollapsedLabels === 'boolean' && serverPrefs.showCollapsedLabels !== showCollapsedLabels) {
        setShowCollapsedLabels(serverPrefs.showCollapsedLabels);
      }
      if (typeof serverPrefs.collapseMode === 'string' && serverPrefs.collapseMode !== collapseMode) {
        setCollapseMode(serverPrefs.collapseMode as 'rail' | 'hidden');
      }
      if (typeof serverPrefs.brandStyle === 'string' && serverPrefs.brandStyle !== brandStyle) {
        setBrandStyle(serverPrefs.brandStyle as BrandStyle);
      }
    }
  }, [serverPrefs]);

  const handleToggleLabels = () => {
    const nextVal = !showCollapsedLabels;
    toggleCollapsedLabels();
    updatePrefsMutation.mutate({ showCollapsedLabels: nextVal });
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    updatePrefsMutation.mutate({ theme: newTheme });
  };

  const handleCollapseModeChange = (mode: 'rail' | 'hidden') => {
    setCollapseMode(mode);
    updatePrefsMutation.mutate({ collapseMode: mode });
  };

  const handleBrandStyleChange = (style: BrandStyle) => {
    setBrandStyle(style);
    updatePrefsMutation.mutate({ brandStyle: style });
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-5 flex-1 flex flex-col min-w-0 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Clean Header without redundant huge icon */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--md-sys-color-on-surface)]">
          Preferences
        </h1>
        <p className="text-xs sm:text-sm text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
          Personalize your workspace aesthetics, navigation rail behavior, and interface defaults.
        </p>
      </div>

      {/* Settings Cards Container */}
      <div className="space-y-5">
        {/* 1. Visual Theme (Light, Dark, System Auto) */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                  Visual Theme
                </h2>
                <Badge variant="neutral" size="sm" className="font-mono text-[10px]">
                  Appearance
                </Badge>
              </div>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                Choose light mode, dark mode, or follow your operating system settings.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* System / Auto */}
            <button
              type="button"
              onClick={() => handleThemeChange('system')}
              className={`p-4 rounded-2xl border text-left flex flex-col items-center justify-center gap-2.5 transition-all cursor-pointer ${
                theme === 'system'
                  ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/20 shadow-xs'
                  : 'border-[var(--md-sys-color-outline-variant)]/30 bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)]'
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)] flex items-center justify-center">
                <Laptop className="w-4 h-4" />
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">System (Auto)</p>
                <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Match device theme</p>
              </div>
              {theme === 'system' && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-[var(--md-sys-color-primary)]">
                  <Check className="w-3.5 h-3.5" /> Active
                </span>
              )}
            </button>

            {/* Light Mode */}
            <button
              type="button"
              onClick={() => handleThemeChange('light')}
              className={`p-4 rounded-2xl border text-left flex flex-col items-center justify-center gap-2.5 transition-all cursor-pointer ${
                theme === 'light'
                  ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/20 shadow-xs'
                  : 'border-[var(--md-sys-color-outline-variant)]/30 bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)]'
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-[var(--md-sys-color-warning-container)] text-[var(--md-sys-color-on-warning-container)] flex items-center justify-center">
                <Sun className="w-4 h-4 text-[var(--md-sys-color-warning)]" />
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">Light Mode</p>
                <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">High clarity daylight</p>
              </div>
              {theme === 'light' && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-[var(--md-sys-color-primary)]">
                  <Check className="w-3.5 h-3.5" /> Active
                </span>
              )}
            </button>

            {/* Dark Mode */}
            <button
              type="button"
              onClick={() => handleThemeChange('dark')}
              className={`p-4 rounded-2xl border text-left flex flex-col items-center justify-center gap-2.5 transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/20 shadow-xs'
                  : 'border-[var(--md-sys-color-outline-variant)]/30 bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)]'
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center">
                <Moon className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">Dark Mode</p>
                <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Low glare night mode</p>
              </div>
              {theme === 'dark' && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-[var(--md-sys-color-primary)]">
                  <Check className="w-3.5 h-3.5" /> Active
                </span>
              )}
            </button>
          </div>
        </Card>

        {/* 2. Sidebar Collapse Behavior (Default 0px Hidden vs 60px Rail) */}
        <Card className="p-6 space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                Sidebar Collapse Behavior
              </h2>
              <Badge variant="neutral" size="sm" className="font-mono text-[10px]">
                Layout
              </Badge>
            </div>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
              Choose how the sidebar behaves when collapsed using the <kbd className="px-1.5 py-0.5 rounded-md bg-[var(--md-sys-color-surface-container-high)] font-mono text-[10px] text-[var(--md-sys-color-on-surface)]">[</kbd> shortcut.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Option 1: Hidden (0px) - Default */}
            <button
              type="button"
              onClick={() => handleCollapseModeChange('hidden')}
              className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                collapseMode === 'hidden'
                  ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/20 shadow-xs'
                  : 'border-[var(--md-sys-color-outline-variant)]/30 bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)]'
              }`}
            >
              <div>
                <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
                  Completely Hidden (0px) - Default
                </p>
                <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-1 leading-relaxed">
                  Maximizes workspace canvas for kanban boards and issue details. Expand anytime via hover rail or keyboard shortcut.
                </p>
              </div>
              {collapseMode === 'hidden' && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-[var(--md-sys-color-primary)]">
                  <Check className="w-3.5 h-3.5" /> Active
                </span>
              )}
            </button>

            {/* Option 2: Rail (60px) */}
            <button
              type="button"
              onClick={() => handleCollapseModeChange('rail')}
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
                  Shrinks to an icon strip with 1-click access to navigation items and tooltips.
                </p>
              </div>
              {collapseMode === 'rail' && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-[var(--md-sys-color-primary)]">
                  <Check className="w-3.5 h-3.5" /> Active
                </span>
              )}
            </button>
          </div>
        </Card>

        {/* 3. Collapsed Sidebar Text Labels (Disabled by default) */}
        <Card className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                  Collapsed Sidebar Text Labels
                </h2>
                <Badge variant="neutral" size="sm" className="font-mono text-[10px]">
                  Navigation
                </Badge>
              </div>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                Display tiny labels below icons in rail mode. Disabled by default for maximum compactness.
              </p>
            </div>

            {/* Unified Toggle Switch */}
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

          <div className="pt-2 border-t border-[var(--md-sys-color-outline-variant)]/15 flex items-center justify-between text-xs">
            <span className="text-[var(--md-sys-color-on-surface-variant)]">
              Status: <strong className="text-[var(--md-sys-color-on-surface)]">{showCollapsedLabels ? 'Labels Enabled' : 'Disabled (Default)'}</strong>
            </span>
            {showCollapsedLabels && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCollapsedLabels(false);
                  updatePrefsMutation.mutate({ showCollapsedLabels: false });
                }}
              >
                Reset to Default
              </Button>
            )}
          </div>
        </Card>

        {/* 4. Brand Logo Color Palette */}
        <Card className="p-6 space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                Brand Logo Color & Style
              </h2>
              <Badge variant="neutral" size="sm" className="font-mono text-[10px]">
                Branding
              </Badge>
            </div>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
              Choose the visual color aesthetic for the BugTracker logo in the header and sidebar.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
            {BRAND_PALETTE.map((item) => {
              const isSelected = brandStyle === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleBrandStyleChange(item.id)}
                  className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/20 shadow-xs'
                      : 'border-[var(--md-sys-color-outline-variant)]/30 bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-white shadow-xs ${item.bg}`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface)]">
                    {item.label}
                  </span>
                  {isSelected && (
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-[var(--md-sys-color-primary)]">
                      <Check className="w-3 h-3" /> Active
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Cloud Sync Status Strip */}
        <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 flex items-center justify-between text-xs text-[var(--md-sys-color-on-surface-variant)]">
          <div className="flex items-center gap-2">
            {updatePrefsMutation.isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin text-[var(--md-sys-color-primary)]" />
            ) : (
              <Cloud className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
            )}
            <span>
              {updatePrefsMutation.isPending
                ? 'Syncing changes to your profile...'
                : 'All preferences are automatically synchronized across all your devices.'}
            </span>
          </div>

          <Badge variant="neutral" size="sm" className="font-mono text-[10px]">
            Auto-save
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default PreferencesPage;
