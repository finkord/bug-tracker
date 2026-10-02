import { describe, it, expect, beforeEach } from 'vitest';
import { useIssueSelectionStore } from './useIssueSelectionStore';

describe('useIssueSelectionStore', () => {
  beforeEach(() => {
    useIssueSelectionStore.getState().clearSelection();
  });

  it('starts with an empty selection', () => {
    const state = useIssueSelectionStore.getState();
    expect(state.selectedIds.size).toBe(0);
    expect(state.lastFocusedId).toBeNull();
  });

  it('toggles selection of an issue ID', () => {
    const store = useIssueSelectionStore.getState();
    store.toggleSelection(101);
    expect(useIssueSelectionStore.getState().isSelected(101)).toBe(true);
    expect(useIssueSelectionStore.getState().lastFocusedId).toBe(101);

    useIssueSelectionStore.getState().toggleSelection(101);
    expect(useIssueSelectionStore.getState().isSelected(101)).toBe(false);
  });

  it('selects all specified IDs', () => {
    useIssueSelectionStore.getState().selectAll([1, 2, 3, 4]);
    const state = useIssueSelectionStore.getState();
    expect(state.selectedIds.size).toBe(4);
    expect(state.isSelected(1)).toBe(true);
    expect(state.isSelected(4)).toBe(true);
    expect(state.isSelected(99)).toBe(false);
  });

  it('clears all selected IDs', () => {
    useIssueSelectionStore.getState().selectAll([1, 2, 3]);
    useIssueSelectionStore.getState().clearSelection();
    const state = useIssueSelectionStore.getState();
    expect(state.selectedIds.size).toBe(0);
    expect(state.lastFocusedId).toBeNull();
  });

  it('handles rangeSelect from previous focused item', () => {
    const orderedIds = [10, 20, 30, 40, 50];

    // First click on 20
    useIssueSelectionStore.getState().toggleSelection(20);
    expect(useIssueSelectionStore.getState().lastFocusedId).toBe(20);

    // Shift click on 40
    useIssueSelectionStore.getState().rangeSelect(40, orderedIds);

    const state = useIssueSelectionStore.getState();
    expect(state.isSelected(20)).toBe(true);
    expect(state.isSelected(30)).toBe(true);
    expect(state.isSelected(40)).toBe(true);
    expect(state.isSelected(10)).toBe(false);
    expect(state.isSelected(50)).toBe(false);
  });

  it('handles rangeSelect when no previous focused item exists', () => {
    const orderedIds = [10, 20, 30];
    useIssueSelectionStore.getState().rangeSelect(20, orderedIds);

    const state = useIssueSelectionStore.getState();
    expect(state.selectedIds.size).toBe(1);
    expect(state.isSelected(20)).toBe(true);
    expect(state.lastFocusedId).toBe(20);
  });
});
