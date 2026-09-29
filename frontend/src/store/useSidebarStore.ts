import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SidebarState {
  collapsed: boolean;
  mobileOpen: boolean;
  showCollapsedLabels: boolean;
  toggleSidebar: () => void;
  setCollapsed: (collapsed: boolean) => void;
  toggleMobile: () => void;
  closeMobile: () => void;
  setShowCollapsedLabels: (show: boolean) => void;
  toggleCollapsedLabels: () => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      collapsed: false,
      mobileOpen: false,
      showCollapsedLabels: false,
      toggleSidebar: () => set((state) => ({ collapsed: !state.collapsed })),
      setCollapsed: (collapsed: boolean) => set({ collapsed }),
      toggleMobile: () => set((state) => ({ mobileOpen: !state.mobileOpen })),
      closeMobile: () => set({ mobileOpen: false }),
      setShowCollapsedLabels: (showCollapsedLabels: boolean) => set({ showCollapsedLabels }),
      toggleCollapsedLabels: () =>
        set((state) => ({ showCollapsedLabels: !state.showCollapsedLabels })),
    }),
    {
      name: 'bt_sidebar_store',
      partialize: (state) => ({
        collapsed: state.collapsed,
        showCollapsedLabels: state.showCollapsedLabels,
      }),
    },
  ),
);

/**
 * Drop-in backward-compatible hook selector for existing components.
 */
export const useSidebar = () => useSidebarStore();
