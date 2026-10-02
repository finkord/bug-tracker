import { describe, it, expect, beforeEach } from 'vitest';
import { useSidebarStore } from './useSidebarStore';

describe('useSidebarStore', () => {
  beforeEach(() => {
    useSidebarStore.setState({
      collapsed: false,
      mobileOpen: false,
      showCollapsedLabels: false,
    });
  });

  it('should initialize with default expanded state', () => {
    const state = useSidebarStore.getState();
    expect(state.collapsed).toBe(false);
    expect(state.mobileOpen).toBe(false);
    expect(state.showCollapsedLabels).toBe(false);
  });

  it('should toggle collapse state correctly', () => {
    useSidebarStore.getState().toggleSidebar();
    expect(useSidebarStore.getState().collapsed).toBe(true);

    useSidebarStore.getState().toggleSidebar();
    expect(useSidebarStore.getState().collapsed).toBe(false);
  });

  it('should set collapse state explicitly', () => {
    useSidebarStore.getState().setCollapsed(true);
    expect(useSidebarStore.getState().collapsed).toBe(true);

    useSidebarStore.getState().setCollapsed(false);
    expect(useSidebarStore.getState().collapsed).toBe(false);
  });

  it('should toggle mobile menu open state', () => {
    useSidebarStore.getState().toggleMobile();
    expect(useSidebarStore.getState().mobileOpen).toBe(true);

    useSidebarStore.getState().toggleMobile();
    expect(useSidebarStore.getState().mobileOpen).toBe(false);
  });

  it('should close mobile menu explicitly', () => {
    useSidebarStore.getState().toggleMobile();
    expect(useSidebarStore.getState().mobileOpen).toBe(true);

    useSidebarStore.getState().closeMobile();
    expect(useSidebarStore.getState().mobileOpen).toBe(false);
  });

  it('should toggle and set showCollapsedLabels', () => {
    useSidebarStore.getState().setShowCollapsedLabels(true);
    expect(useSidebarStore.getState().showCollapsedLabels).toBe(true);

    useSidebarStore.getState().toggleCollapsedLabels();
    expect(useSidebarStore.getState().showCollapsedLabels).toBe(false);
  });

  it('should set collapseMode correctly', () => {
    expect(useSidebarStore.getState().collapseMode).toBe('rail');
    useSidebarStore.getState().setCollapseMode('hidden');
    expect(useSidebarStore.getState().collapseMode).toBe('hidden');
    useSidebarStore.getState().setCollapseMode('rail');
    expect(useSidebarStore.getState().collapseMode).toBe('rail');
  });

  it('should set brandStyle correctly', () => {
    expect(useSidebarStore.getState().brandStyle).toBe('vibrant');
    useSidebarStore.getState().setBrandStyle('metallic');
    expect(useSidebarStore.getState().brandStyle).toBe('metallic');
    useSidebarStore.getState().setBrandStyle('vibrant');
    expect(useSidebarStore.getState().brandStyle).toBe('vibrant');
  });
});
