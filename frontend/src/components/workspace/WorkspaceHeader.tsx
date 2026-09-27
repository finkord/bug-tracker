import React, { useState } from 'react';
import { Menu, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSidebar } from '../../context/SidebarContext';
import { WorkspaceGlobalSearch } from './WorkspaceGlobalSearch';
import { WorkspaceBroadcastBanner } from './WorkspaceBroadcastBanner';
import { WorkspaceQuickFiltersMenu } from './WorkspaceQuickFiltersMenu';
import { WorkspaceCreateIssueAction } from './WorkspaceCreateIssueAction';
import { WorkspaceUserMenu } from './WorkspaceUserMenu';

/**
 * Workspace top control strip for authenticated application sessions.
 * Coordinates global search, announcements, quick filters, creation, and user controls.
 */
export const WorkspaceHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toggleMobile } = useSidebar();
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  if (!user) return null;

  return (
    <header className="w-full h-14 sm:h-16 flex items-center px-2.5 sm:px-4 gap-2 sm:gap-3 shrink-0 select-none z-10 transition-colors duration-200 relative">
      {/* Search Bar / Mobile Search Overlay */}
      <WorkspaceGlobalSearch
        isMobileOpen={isMobileSearchOpen}
        onMobileToggle={setIsMobileSearchOpen}
      />

      {!isMobileSearchOpen && (
        <>
          {/* Left: Mobile Drawer Toggle + Announcement Banner */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
            <button
              type="button"
              onClick={toggleMobile}
              className="md:hidden w-9 h-9 rounded-xl bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] flex items-center justify-center cursor-pointer shrink-0 transition-colors border border-[var(--md-sys-color-outline-variant)]/20 shadow-2xs"
              aria-label="Open sidebar navigation"
            >
              <Menu className="w-4 h-4" />
            </button>

            <WorkspaceBroadcastBanner />
          </div>

          {/* Right Controls: Quick Filters, Create Action, Theme Toggle, User Avatar Menu */}
          <div className="shrink-0 flex items-center gap-1.5 sm:gap-2">
            <WorkspaceQuickFiltersMenu />

            <WorkspaceCreateIssueAction />

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              aria-label="Toggle theme"
              className="w-9 h-9 rounded-xl bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] flex items-center justify-center transition-colors cursor-pointer border border-[var(--md-sys-color-outline-variant)]/30 shadow-2xs shrink-0 active:scale-95"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-500" />
              )}
            </button>

            <WorkspaceUserMenu user={user} onLogout={logout} />
          </div>
        </>
      )}
    </header>
  );
};
