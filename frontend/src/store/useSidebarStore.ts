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
  brandStyle: BrandStyle;
  toggleSidebar: () => void;
  setCollapsed: (collapsed: boolean) => void;
  setCollapseMode: (mode: 'rail' | 'hidden') => void;
  toggleMobile: () => void;
  closeMobile: () => void;
  setBrandStyle: (style: BrandStyle) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      collapsed: false,
      collapseMode: 'hidden',
      mobileOpen: false,
      brandStyle: 'vibrant',
      toggleSidebar: () => set((state) => ({ collapsed: !state.collapsed })),
      setCollapsed: (collapsed: boolean) => set({ collapsed }),
      setCollapseMode: (collapseMode: 'rail' | 'hidden') => set({ collapseMode }),
      toggleMobile: () => set((state) => ({ mobileOpen: !state.mobileOpen })),
      closeMobile: () => set({ mobileOpen: false }),
      setBrandStyle: (brandStyle: BrandStyle) => set({ brandStyle }),
    }),
    {
      name: 'bt_sidebar_store',
      partialize: (state) => ({
        collapsed: state.collapsed,
        collapseMode: state.collapseMode,
        brandStyle: state.brandStyle,
      }),
    },
  ),
);

/**
 * Drop-in backward-compatible hook selector for existing components.
 */
export function useSidebar(): SidebarState;
export function useSidebar<T>(selector: (state: SidebarState) => T): T;
export function useSidebar<T>(selector?: (state: SidebarState) => T): SidebarState | T {
  return selector ? useSidebarStore(selector) : useSidebarStore();
}
