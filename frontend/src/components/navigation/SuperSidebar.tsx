import React, { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth, useSidebar } from '../../store';
import { useProjectsQuery } from '../../api/queries';
import { SidebarBrandHeader } from './SidebarBrandHeader';
import { SidebarContextSwitcher } from './SidebarContextSwitcher';
import { SidebarNavList } from './SidebarNavList';
import { SidebarBottomActions } from './SidebarBottomActions';
import { SidebarMobileDrawer } from './SidebarMobileDrawer';

interface SuperSidebarProps {
  currentProjectId?: number;
}

/**
 * Super-Sidebar root navigation container.
 * Implements the GitLab Pajamas enterprise navigation architecture.
 */
export const SuperSidebar: React.FC<SuperSidebarProps> = ({ currentProjectId }) => {
  const { user } = useAuth();
  const { collapsed, toggleSidebar, mobileOpen, closeMobile, showCollapsedLabels } = useSidebar();
  const location = useLocation();

  const { data: projects = [] } = useProjectsQuery();

  // Global keyboard shortcut to toggle sidebar collapse ('[' key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid triggering when user is typing in input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === '[' || (e.ctrlKey && e.key.toLowerCase() === 'b')) {
        e.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  const urlProjectId = useMemo(() => {
    const match = location.pathname.match(/\/projects\/(\d+)/);
    return match ? Number(match[1]) : undefined;
  }, [location.pathname]);

  const activeProjectId = currentProjectId || urlProjectId || projects[0]?.id;
  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0];

  if (!user) return null;

  return (
    <>
      {/* ─── Desktop Super-Sidebar (Full-Height 100vh) ────────────────────── */}
      <aside
        className={`hidden md:flex flex-col h-screen sticky top-0 bg-[var(--md-sys-color-surface-container-low)] shrink-0 select-none z-20 overflow-hidden transition-[width] duration-200 ease-in-out ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
        aria-label="Main Navigation"
      >
        <SidebarBrandHeader collapsed={collapsed} />

        <SidebarContextSwitcher
          projects={projects}
          activeProject={activeProject}
          collapsed={collapsed}
        />

        <SidebarNavList
          user={user}
          activeProject={activeProject}
          collapsed={collapsed}
          showCollapsedLabels={showCollapsedLabels}
        />

        <SidebarBottomActions
          collapsed={collapsed}
          onToggleSidebar={toggleSidebar}
        />
      </aside>

      {/* ─── Mobile Slide-Over Drawer ────────────────────────────────────── */}
      <SidebarMobileDrawer
        open={mobileOpen}
        onClose={closeMobile}
        user={user}
        projects={projects}
        activeProject={activeProject}
      />
    </>
  );
};
