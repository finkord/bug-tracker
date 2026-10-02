import { create } from 'zustand';

export interface IssueSelectionState {
  selectedIds: Set<number>;
  lastFocusedId: number | null;

  toggleSelection: (id: number) => void;
  rangeSelect: (targetId: number, orderedIds: number[]) => void;
  selectAll: (ids: number[]) => void;
  clearSelection: () => void;
  isSelected: (id: number) => boolean;
}

export const useIssueSelectionStore = create<IssueSelectionState>((set, get) => ({
  selectedIds: new Set<number>(),
  lastFocusedId: null,

  toggleSelection: (id: number) => {
    const next = new Set(get().selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    set({ selectedIds: next, lastFocusedId: id });
  },

  rangeSelect: (targetId: number, orderedIds: number[]) => {
    const { lastFocusedId, selectedIds } = get();
    if (lastFocusedId === null || !orderedIds.includes(lastFocusedId) || !orderedIds.includes(targetId)) {
      const next = new Set(selectedIds);
      next.add(targetId);
      set({ selectedIds: next, lastFocusedId: targetId });
      return;
    }

    const indexA = orderedIds.indexOf(lastFocusedId);
    const indexB = orderedIds.indexOf(targetId);
    const start = Math.min(indexA, indexB);
    const end = Math.max(indexA, indexB);

    const next = new Set(selectedIds);
    for (let i = start; i <= end; i++) {
      next.add(orderedIds[i]);
    }
    set({ selectedIds: next, lastFocusedId: targetId });
  },

  selectAll: (ids: number[]) => {
    set({ selectedIds: new Set(ids), lastFocusedId: ids.length > 0 ? ids[0] : null });
  },

  clearSelection: () => {
    set({ selectedIds: new Set(), lastFocusedId: null });
  },

  isSelected: (id: number) => get().selectedIds.has(id),
}));
