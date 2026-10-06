import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type BrandStyle =
  | 'vibrant'
  | 'metallic'
  | 'indigo'
  | 'blue'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'purple'
  | 'cyan'
  | 'violet';

export interface SidebarState {
  collapsed: boolean;
  collapseMode: 'rail' | 'hidden';
  mobileOpen: boolean;
  showCollapsedLabels: boolean;
  brandStyle: BrandStyle;
  toggleSidebar: () => void;
  setCollapsed: (collapsed: boolean) => void;
  setCollapseMode: (mode: 'rail' | 'hidden') => void;
  toggleMobile: () => void;
  closeMobile: () => void;
  setShowCollapsedLabels: (show: boolean) => void;
  toggleCollapsedLabels: () => void;
  setBrandStyle: (style: BrandStyle) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      collapsed: false,
      collapseMode: 'hidden',
      mobileOpen: false,
      showCollapsedLabels: false,
      brandStyle: 'vibrant',
      toggleSidebar: () => set((state) => ({ collapsed: !state.collapsed })),
      setCollapsed: (collapsed: boolean) => set({ collapsed }),
      setCollapseMode: (collapseMode: 'rail' | 'hidden') => set({ collapseMode }),
      toggleMobile: () => set((state) => ({ mobileOpen: !state.mobileOpen })),
      closeMobile: () => set({ mobileOpen: false }),
      setShowCollapsedLabels: (showCollapsedLabels: boolean) => set({ showCollapsedLabels }),
      toggleCollapsedLabels: () =>
        set((state) => ({ showCollapsedLabels: !state.showCollapsedLabels })),
      setBrandStyle: (brandStyle: BrandStyle) => set({ brandStyle }),
    }),
    {
      name: 'bt_sidebar_store',
      partialize: (state) => ({
        collapsed: state.collapsed,
        collapseMode: state.collapseMode,
        showCollapsedLabels: state.showCollapsedLabels,
        brandStyle: state.brandStyle,
      }),
    },
  ),
);

/**
 * Drop-in backward-compatible hook selector for existing components.
 */
export const useSidebar = () => useSidebarStore();
