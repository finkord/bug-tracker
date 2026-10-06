import React from 'react';
import { Menu, PanelLeft } from 'lucide-react';
import { useAuth, useSidebar } from '../../store';
import { HeaderBreadcrumbs } from './HeaderBreadcrumbs';
import { WorkspaceGlobalSearch } from './WorkspaceGlobalSearch';
import { WorkspaceCreateIssueAction } from './WorkspaceCreateIssueAction';
import { NotificationBell } from '../notifications/NotificationBell';
import { Tooltip } from '../ui/Tooltip';

/**
 * Slim Workspace Header (44px) for authenticated application sessions.
 * Provides clean breadcrumbs, fast search chip, creation trigger, and notifications
 * while maximizing vertical canvas space for Kanban boards and backlogs.
 */
export const WorkspaceHeader: React.FC = () => {
  const { user } = useAuth();
  const { toggleMobile, collapsed, toggleSidebar } = useSidebar();

  if (!user) return null;

  return (
    <header className="relative w-full h-11 flex items-center px-3 sm:px-4 justify-between gap-3 shrink-0 select-none z-30 border-b border-[var(--md-sys-color-outline-variant)]/15 bg-[var(--md-sys-color-surface-container-low)] transition-colors duration-200">
      {/* Left Column: Mobile Drawer Toggle + Desktop Expand Toggle + Breadcrumbs (flex-1, left-aligned) */}
      <div className="flex-1 min-w-0 flex items-center justify-start gap-2">
        <button
          type="button"
          onClick={toggleMobile}
          className="md:hidden w-8 h-8 rounded-lg bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] flex items-center justify-center cursor-pointer shrink-0 transition-colors border border-[var(--md-sys-color-outline-variant)]/20 shadow-2xs"
          aria-label="Open sidebar navigation"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Desktop Sidebar Toggle (Permanent Static Placement) */}
        <Tooltip
          content={
            <span>
              {collapsed ? 'Expand sidebar' : 'Collapse sidebar'}{' '}
              <kbd className="ml-1 text-[10px] opacity-70 font-mono">[</kbd>
            </span>
          }
          side="bottom"
        >
          <button
            type="button"
            onClick={toggleSidebar}
            className="hidden md:flex w-7 h-7 rounded-lg hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] items-center justify-center cursor-pointer shrink-0 transition-colors"
            aria-label={collapsed ? 'Expand sidebar navigation' : 'Collapse sidebar navigation'}
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        </Tooltip>

        <HeaderBreadcrumbs />
      </div>

      {/* Center Column: Quick Search Command Pill (shrink-0, centered) */}
      <div className="hidden sm:flex shrink-0 items-center justify-center px-2">
        <WorkspaceGlobalSearch />
      </div>

      {/* Right Column: Actions (flex-1, right-aligned) */}
      <div className="flex-1 min-w-0 flex items-center justify-end gap-1.5 sm:gap-2">
        <WorkspaceCreateIssueAction />
        <NotificationBell />
      </div>
    </header>
  );
};
