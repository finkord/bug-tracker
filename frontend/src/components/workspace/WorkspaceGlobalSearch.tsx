import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { QuickSearchModal } from './QuickSearchModal';
import { IssueDetailsModal } from '../kanban/IssueDetailsModal';

interface WorkspaceGlobalSearchProps {
  isMobileOpen?: boolean;
  onMobileToggle?: (open: boolean) => void;
}

/**
 * Modern header search icon button that opens the in-place Quick Search palette modal
 * with '/' keyboard shortcut.
 */
export const WorkspaceGlobalSearch: React.FC<WorkspaceGlobalSearchProps> = () => {
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const [inspectedIssueId, setInspectedIssueId] = useState<number | null>(null);

  // Global 'Cmd+K' and '/' shortcuts to trigger quick search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        (e.key === 'k' && (e.metaKey || e.ctrlKey)) ||
        (e.key === '/' &&
          target.tagName !== 'INPUT' &&
          target.tagName !== 'TEXTAREA' &&
          !target.isContentEditable)
      ) {
        e.preventDefault();
        setIsQuickSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectIssue = (issueId: number) => {
    setIsQuickSearchOpen(false);
    setInspectedIssueId(issueId);
  };

  return (
    <>
      {/* Desktop Centered Quick Search Command Pill */}
      <button
        type="button"
        onClick={() => setIsQuickSearchOpen(true)}
        className="w-48 sm:w-60 md:w-72 h-[30px] px-2.5 rounded-lg bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] transition-all cursor-pointer select-none flex items-center justify-between border border-[var(--md-sys-color-outline-variant)]/30 text-xs shadow-2xs group"
        title="Quick Search... (Ctrl+K or /)"
        aria-label="Quick Search"
      >
        <div className="flex items-center gap-2 truncate">
          <Search className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
          <span className="truncate text-xs opacity-70 group-hover:opacity-100 font-medium">Quick Search...</span>
        </div>
        <kbd className="hidden sm:inline-flex items-center text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--md-sys-color-surface-container-highest)]/60 text-[var(--md-sys-color-on-surface-variant)]/80">
          Ctrl+K
        </kbd>
      </button>

      {/* Quick Search Palette Modal */}
      <QuickSearchModal
        isOpen={isQuickSearchOpen}
        onClose={() => setIsQuickSearchOpen(false)}
        onSelectIssue={handleSelectIssue}
      />

      {/* In-place ticket details modal if an issue is selected from quick search */}
      {inspectedIssueId !== null && (
        <IssueDetailsModal
          isOpen={true}
          issueId={inspectedIssueId}
          onClose={() => setInspectedIssueId(null)}
        />
      )}
    </>
  );
};

