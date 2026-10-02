import { describe, it, expect, beforeEach } from 'vitest';
import { useModalStore } from './useModalStore';

describe('useModalStore', () => {
  beforeEach(() => {
    useModalStore.setState({
      isCreateIssueOpen: false,
      createIssueDefaults: undefined,
      isShortcutsOpen: false,
      isQuickSearchOpen: false,
    });
  });

  it('manages create issue modal state and defaults', () => {
    expect(useModalStore.getState().isCreateIssueOpen).toBe(false);

    useModalStore.getState().openCreateIssue({ projectId: 42, sprintId: 10 });
    expect(useModalStore.getState().isCreateIssueOpen).toBe(true);
    expect(useModalStore.getState().createIssueDefaults).toEqual({ projectId: 42, sprintId: 10 });

    useModalStore.getState().closeCreateIssue();
    expect(useModalStore.getState().isCreateIssueOpen).toBe(false);
    expect(useModalStore.getState().createIssueDefaults).toBeUndefined();
  });

  it('manages keyboard shortcuts cheat sheet modal state', () => {
    expect(useModalStore.getState().isShortcutsOpen).toBe(false);

    useModalStore.getState().openShortcuts();
    expect(useModalStore.getState().isShortcutsOpen).toBe(true);

    useModalStore.getState().closeShortcuts();
    expect(useModalStore.getState().isShortcutsOpen).toBe(false);
  });

  it('manages quick search palette state', () => {
    expect(useModalStore.getState().isQuickSearchOpen).toBe(false);

    useModalStore.getState().openQuickSearch();
    expect(useModalStore.getState().isQuickSearchOpen).toBe(true);

    useModalStore.getState().closeQuickSearch();
    expect(useModalStore.getState().isQuickSearchOpen).toBe(false);
  });
});
