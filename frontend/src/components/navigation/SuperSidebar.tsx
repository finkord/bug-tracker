import React, { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useAuth, useSidebar, useActiveProjectStore, useModalStore } from '../../store';
import { useProjectsQuery } from '../../api/queries';
import { SidebarBrandHeader } from './SidebarBrandHeader';
import { SidebarProjectSwitcher } from './SidebarProjectSwitcher';
import { SidebarNavList } from './SidebarNavList';
import { SidebarBottomActions } from './SidebarBottomActions';
import { SidebarMobileDrawer } from './SidebarMobileDrawer';

interface SuperSidebarProps {}

/**
 * Super-Sidebar root navigation container.
 * Implements the Linear / GitLab Pajamas persistent project navigation architecture.
 */
export const SuperSidebar: React.FC<SuperSidebarProps> = () => {
  const { user } = useAuth();
  const {
    collapsed,
    collapseMode,
    toggleSidebar,
    mobileOpen,
    closeMobile,
    showCollapsedLabels,
  } = useSidebar();
  const location = useLocation();

  const { isCreateIssueOpen, isShortcutsOpen, isQuickSearchOpen } = useModalStore();
  const isAnyModalOpen = isCreateIssueOpen || isShortcutsOpen || isQuickSearchOpen;

  const { data: projects = [] } = useProjectsQuery({ enabled: !!user });

  // Hover peek flyout state for collapsed icon rail
  const [isHovered, setIsHovered] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const enterTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (!collapsed || isAnyModalOpen) return;
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    enterTimerRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 100);
  };

  const handleMouseLeave = () => {
    // Keep flyout open while an internal dropdown menu is active to prevent loop
    if (isMenuOpen) return;
    if (enterTimerRef.current) {
      clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }
    leaveTimerRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 150);
  };

  const handleMenuOpenChange = (open: boolean) => {
    setIsMenuOpen(open);
    if (!open) {
      // When dropdown closes, close flyout after short debounce if mouse is outside
      leaveTimerRef.current = setTimeout(() => {
        setIsHovered(false);
      }, 150);
    }
  };

  // Close flyout immediately whenever route, modal, or persistent collapsed state changes
  useEffect(() => {
    setIsHovered(false);
    setIsMenuOpen(false);
  }, [collapsed, location.pathname, isAnyModalOpen]);

  useEffect(() => {
    return () => {
      if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, []);

  const isFlyout = collapsed && isHovered;
  const effectiveCollapsed = collapseMode === 'rail' && collapsed && !isFlyout;

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

  const urlProjectIdentifier = useMemo(() => {
    const match = location.pathname.match(/\/projects\/([^/]+)/);
    if (!match) return undefined;
    const candidate = match[1];
    if (candidate === 'new' || candidate === 'create') return undefined;
    return candidate;
  }, [location.pathname]);

  const activeProjectFromUrl = useMemo(() => {
    if (!urlProjectIdentifier || !projects.length) return undefined;
    const numId = Number(urlProjectIdentifier);
    if (!Number.isNaN(numId)) {
      return projects.find((p) => p.id === numId);
    }
    return projects.find(
      (p) => p.key?.toUpperCase() === urlProjectIdentifier.toUpperCase(),
    );
  }, [projects, urlProjectIdentifier]);

  // Sync active project to store when URL points to a project
  useEffect(() => {
    if (activeProjectFromUrl) {
      useActiveProjectStore.getState().setActiveProject({
        id: activeProjectFromUrl.id,
        key: activeProjectFromUrl.key || String(activeProjectFromUrl.id),
        name: activeProjectFromUrl.name,
      });
    }
  }, [activeProjectFromUrl]);

  const storedActiveProjectId = useActiveProjectStore((state) => state.activeProjectId);
  const storedActiveProjectKey = useActiveProjectStore((state) => state.activeProjectKey);

  // Derive effective active project (persisting context across /my-issues, /search, etc.)
  const effectiveActiveProject = useMemo(() => {
    if (activeProjectFromUrl) return activeProjectFromUrl;
    if (storedActiveProjectId && projects.length) {
      const match = projects.find((p) => p.id === storedActiveProjectId);
      if (match) return match;
    }
    if (storedActiveProjectKey && projects.length) {
      const match = projects.find(
        (p) => p.key?.toUpperCase() === storedActiveProjectKey.toUpperCase(),
      );
      if (match) return match;
    }
    // Fallback to first available project if none active yet
    return projects.length > 0 ? projects[0] : undefined;
  }, [activeProjectFromUrl, storedActiveProjectId, storedActiveProjectKey, projects]);

  const effectiveActiveProjectId =
    effectiveActiveProject?.id ??
    (urlProjectIdentifier && !Number.isNaN(Number(urlProjectIdentifier))
      ? Number(urlProjectIdentifier)
      : undefined);

  // Close flyout when Escape key is pressed
  useEffect(() => {
    if (!isFlyout) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsHovered(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isFlyout]);

  const handleCloseFlyout = () => {
    setIsHovered(false);
  };

  return (
    <>
      {/* ─── Desktop Super-Sidebar (Layout Flow Placeholder + Floating Flyout) ─── */}
      <div
        className={`hidden md:block shrink-0 relative transition-[width] duration-200 ease-in-out ${
          isFlyout ? '' : 'overflow-hidden'
        } ${
          collapsed
            ? collapseMode === 'hidden'
              ? 'w-0'
              : 'w-[60px]'
            : 'w-60'
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Invisible edge trigger strip and centered indicator pill when collapsed to 0px */}
        {collapsed && collapseMode === 'hidden' && !isAnyModalOpen && !isFlyout && (
          <div
            data-testid="sidebar-hover-trigger"
            className="fixed left-0 top-0 h-screen w-3.5 z-20 cursor-pointer group flex items-center"
            onMouseEnter={handleMouseEnter}
            aria-label="Hover to reveal sidebar"
          >
            {/* Centered Edge Indicator Pill */}
            <div
              data-testid="sidebar-hover-tab"
              className="absolute left-0 top-1/2 -translate-y-1/2 -ml-0.5 w-3.5 h-12 rounded-r-full bg-[var(--md-sys-color-surface-container-high)] group-hover:bg-[var(--md-sys-color-primary-container)] border-y border-r border-[var(--md-sys-color-outline-variant)]/40 shadow-xs flex items-center justify-center transition-all duration-200 group-hover:w-4.5 group-hover:shadow-md"
            >
              <ChevronRight className="w-2.5 h-2.5 text-[var(--md-sys-color-on-surface-variant)] group-hover:text-[var(--md-sys-color-primary)] transition-transform duration-200 group-hover:translate-x-0.5" />
            </div>
          </div>
        )}

        <aside
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`flex flex-col h-screen select-none overflow-hidden transition-[width,box-shadow] duration-200 ease-in-out ${
            isFlyout
              ? 'fixed left-0 top-0 w-60 z-30 shadow-2xl bg-[var(--md-sys-color-surface-container)] border-r border-[var(--md-sys-color-outline-variant)]/40'
              : collapsed
                ? collapseMode === 'hidden'
                  ? 'w-0 pointer-events-none bg-[var(--md-sys-color-surface-container-low)]'
                  : 'w-[60px] bg-[var(--md-sys-color-surface-container-low)]'
                : 'w-60 bg-[var(--md-sys-color-surface-container-low)]'
          }`}
          aria-label="Main Navigation"
        >
          <div
            className={`flex flex-col h-full shrink-0 ${
              collapseMode === 'hidden' ? 'w-60 min-w-[240px]' : 'w-full'
            }`}
          >
            {/* Row 1: Brand Header Logo & Name (44px, matching WorkspaceHeader) */}
            <SidebarBrandHeader
              collapsed={effectiveCollapsed}
              onNavigate={handleCloseFlyout}
            />

            {/* Row 2: Workspace Project Switcher (Separated from Brand Row with 8px spacing) */}
            {user && (
              <div className={`shrink-0 ${effectiveCollapsed ? 'pt-2 pb-1' : 'pt-2.5 pb-1'}`}>
                <SidebarProjectSwitcher
                  projects={projects}
                  activeProject={effectiveActiveProject}
                  collapsed={effectiveCollapsed}
                  onNavigate={handleCloseFlyout}
                  onOpenChange={handleMenuOpenChange}
                />
              </div>
            )}

            <SidebarNavList
              user={user}
              activeProject={effectiveActiveProject}
              projectId={effectiveActiveProjectId}
              collapsed={effectiveCollapsed}
              showCollapsedLabels={showCollapsedLabels}
              onNavigate={handleCloseFlyout}
            />

            <SidebarBottomActions
              collapsed={effectiveCollapsed}
              onNavigate={handleCloseFlyout}
              onOpenChange={handleMenuOpenChange}
            />
          </div>
        </aside>
      </div>

      {/* ─── Mobile Slide-Over Drawer ────────────────────────────────────── */}
      <SidebarMobileDrawer
        open={mobileOpen}
        onClose={closeMobile}
        user={user}
        projects={projects}
        activeProject={effectiveActiveProject}
        projectId={effectiveActiveProjectId}
      />
    </>
  );
};
