import { useEffect } from 'react';
import { useModalStore, useSidebarStore } from '../store';

/**
 * Checks if the event target is an active text input, textarea, or contentEditable element.
 */
export const isEditingText = (e: KeyboardEvent): boolean => {
  const target = e.target as HTMLElement | null;
  if (!target) return false;
  const tagName = target.tagName?.toLowerCase();
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    target.isContentEditable ||
    Boolean(target.closest?.('[contenteditable="true"]'))
  );
};

/**
 * Global keyboard shortcuts listener for fast app navigation and issue actions.
 * - 'C': Create new issue
 * - '?': Open keyboard shortcuts cheat sheet
 * - '/': Open quick search palette
 * - 'Cmd+B' / 'Ctrl+B': Toggle sidebar collapsed state
 */
export const useGlobalKeyboardShortcuts = (enabled: boolean = true) => {
  const {
    isCreateIssueOpen,
    openCreateIssue,
    isShortcutsOpen,
    openShortcuts,
    closeShortcuts,
    isQuickSearchOpen,
    openQuickSearch,
    closeQuickSearch,
  } = useModalStore();

  const toggleSidebar = useSidebarStore((state) => state.toggleSidebar);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow Escape to close open modal palettes
      if (e.key === 'Escape') {
        if (isShortcutsOpen) {
          e.preventDefault();
          closeShortcuts();
          return;
        }
        if (isQuickSearchOpen) {
          e.preventDefault();
          closeQuickSearch();
          return;
        }
      }

      // Sidebar toggle shortcut: Cmd+B / Ctrl+B
      if ((e.metaKey || e.ctrlKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // Universal Command Palette shortcut: Cmd+K / Ctrl+K
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        openQuickSearch();
        return;
      }

      // Remaining single-key shortcuts require that the user is NOT typing in an input
      if (isEditingText(e)) {
        return;
      }

      // Avoid triggering single keys if modifier keys are held
      if (e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      // Don't open new modals if one is already open
      if (isCreateIssueOpen || isShortcutsOpen) {
        return;
      }

      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        openCreateIssue();
        return;
      }

      if (e.key === '?') {
        e.preventDefault();
        openShortcuts();
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        openQuickSearch();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    enabled,
    isCreateIssueOpen,
    isShortcutsOpen,
    isQuickSearchOpen,
    openCreateIssue,
    openShortcuts,
    closeShortcuts,
    openQuickSearch,
    closeQuickSearch,
    toggleSidebar,
  ]);
};
