import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Shield, X } from 'lucide-react';
import { SidebarContextSwitcher } from './SidebarContextSwitcher';
import { SidebarNavList } from './SidebarNavList';
import { SidebarBottomActions } from './SidebarBottomActions';
import type { ProjectItem, UserProfile } from '../../api/client';

interface SidebarMobileDrawerProps {
  open: boolean;
  onClose: () => void;
  user?: UserProfile | null;
  projects: ProjectItem[];
  activeProject?: ProjectItem;
}

/**
 * Mobile off-canvas slide-over drawer for the Super-Sidebar navigation.
 */
export const SidebarMobileDrawer: React.FC<SidebarMobileDrawerProps> = ({
  open,
  onClose,
  user,
  projects,
  activeProject,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div className="relative w-72 max-w-[85vw] bg-[var(--md-sys-color-surface-container-low)] h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200 select-none">
        {/* Mobile Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-[var(--md-sys-color-outline-variant)]/15">
          <NavLink
            to="/"
            onClick={onClose}
            className="flex items-center gap-3 group"
            title="Return to Dashboard"
          >
            <div className="w-10 h-10 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] flex items-center justify-center shadow-xs group-hover:brightness-110 transition-all">
              <Shield className="w-5 h-5" />
            </div>
            <span className="font-bold text-base text-[var(--md-sys-color-on-surface)]">
              BugTracker
            </span>
          </NavLink>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Project Switcher (Authenticated Only) */}
        {user && (
          <div className="px-2">
            <SidebarContextSwitcher
              projects={projects}
              activeProject={activeProject}
              collapsed={false}
              onNavigate={onClose}
            />
          </div>
        )}


        {/* Navigation List */}
        <div className="flex-1 px-2 overflow-y-auto">
          <SidebarNavList
            user={user}
            activeProject={activeProject}
            collapsed={false}
            onNavigate={onClose}
          />
        </div>

        {/* Bottom Actions */}
        <div className="px-2">
          <SidebarBottomActions
            collapsed={false}
            onToggleSidebar={onClose}
            onNavigate={onClose}
          />
        </div>
      </div>
    </div>
  );
};
