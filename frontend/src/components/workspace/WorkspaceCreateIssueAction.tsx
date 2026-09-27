import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { IssueModal } from '../kanban/IssueModal';

/**
 * Quick create issue action button and modal dialog launcher.
 */
export const WorkspaceCreateIssueAction: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="h-9 px-3 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-semibold flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-xs shrink-0 select-none"
        title="Create new issue (C)"
        aria-label="Create new issue"
      >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">Create</span>
      </button>

      {isOpen && (
        <IssueModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onIssueSaved={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
