import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGlobalKeyboardShortcuts, isEditingText } from './useGlobalKeyboardShortcuts';
import { useModalStore, useSidebarStore } from '../store';

describe('useGlobalKeyboardShortcuts', () => {
  beforeEach(() => {
    useModalStore.setState({
      isCreateIssueOpen: false,
      isShortcutsOpen: false,
      isQuickSearchOpen: false,
    });
    useSidebarStore.setState({
      collapsed: false,
    });
  });

  it('correctly identifies text editing elements', () => {
    const input = document.createElement('input');
    const textarea = document.createElement('textarea');
    const select = document.createElement('select');
    const div = document.createElement('div');

    expect(isEditingText({ target: input } as unknown as KeyboardEvent)).toBe(true);
    expect(isEditingText({ target: textarea } as unknown as KeyboardEvent)).toBe(true);
    expect(isEditingText({ target: select } as unknown as KeyboardEvent)).toBe(true);
    expect(isEditingText({ target: div } as unknown as KeyboardEvent)).toBe(false);
  });

  it('triggers create issue modal when pressing C outside text inputs', () => {
    renderHook(() => useGlobalKeyboardShortcuts(true));

    expect(useModalStore.getState().isCreateIssueOpen).toBe(false);

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', bubbles: true }));
    });
    expect(useModalStore.getState().isCreateIssueOpen).toBe(true);
  });

  it('triggers shortcuts modal when pressing ?', () => {
    renderHook(() => useGlobalKeyboardShortcuts(true));

    expect(useModalStore.getState().isShortcutsOpen).toBe(false);

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '?', bubbles: true }));
    });
    expect(useModalStore.getState().isShortcutsOpen).toBe(true);
  });

  it('does not trigger C shortcut when typing inside an input element', () => {
    renderHook(() => useGlobalKeyboardShortcuts(true));

    const input = document.createElement('input');
    document.body.appendChild(input);

    const event = new KeyboardEvent('keydown', { key: 'c', bubbles: true });
    Object.defineProperty(event, 'target', { value: input, writable: false });

    act(() => {
      window.dispatchEvent(event);
    });

    expect(useModalStore.getState().isCreateIssueOpen).toBe(false);

    document.body.removeChild(input);
  });

  it('toggles sidebar on Cmd+B / Ctrl+B', () => {
    renderHook(() => useGlobalKeyboardShortcuts(true));

    expect(useSidebarStore.getState().collapsed).toBe(false);

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', metaKey: true, bubbles: true }));
    });
    expect(useSidebarStore.getState().collapsed).toBe(true);

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', ctrlKey: true, bubbles: true }));
    });
    expect(useSidebarStore.getState().collapsed).toBe(false);
  });

  it('triggers quick search / command palette on Cmd+K / Ctrl+K', () => {
    renderHook(() => useGlobalKeyboardShortcuts(true));

    expect(useModalStore.getState().isQuickSearchOpen).toBe(false);

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));
    });
    expect(useModalStore.getState().isQuickSearchOpen).toBe(true);
  });
});
