import { create } from 'zustand';

export interface CreateIssueDefaults {
  projectId?: number;
  sprintId?: number | null;
  assigneeId?: number | null;
}

export interface ModalState {
  isCreateIssueOpen: boolean;
  createIssueDefaults?: CreateIssueDefaults;
  openCreateIssue: (defaults?: CreateIssueDefaults) => void;
  closeCreateIssue: () => void;

  isShortcutsOpen: boolean;
  openShortcuts: () => void;
  closeShortcuts: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isCreateIssueOpen: false,
  createIssueDefaults: undefined,
  openCreateIssue: (defaults) => set({ isCreateIssueOpen: true, createIssueDefaults: defaults }),
  closeCreateIssue: () => set({ isCreateIssueOpen: false, createIssueDefaults: undefined }),

  isShortcutsOpen: false,
  openShortcuts: () => set({ isShortcutsOpen: true }),
  closeShortcuts: () => set({ isShortcutsOpen: false }),
}));

export const useModals = () => useModalStore();
