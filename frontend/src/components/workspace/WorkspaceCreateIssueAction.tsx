import React from 'react';
import { Plus } from 'lucide-react';
import { IssueModal } from '../kanban/IssueModal';
import { useModalStore } from '../../store';

/**
 * Quick create issue action button and modal dialog launcher.
 * Synchronized with the global 'C' keyboard shortcut.
 */
export const WorkspaceCreateIssueAction: React.FC = () => {
  const {
    isCreateIssueOpen,
    createIssueDefaults,
    openCreateIssue,
    closeCreateIssue,
  } = useModalStore();

  return (
    <>
      <button
        type="button"
        onClick={() => openCreateIssue()}
        className="h-8 px-2.5 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-semibold flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-2xs shrink-0 select-none"
        title="Create new issue (C)"
        aria-label="Create new issue"
      >
        <Plus className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Create</span>
      </button>

      {isCreateIssueOpen && (
        <IssueModal
          isOpen={isCreateIssueOpen}
          onClose={closeCreateIssue}
          onIssueSaved={() => closeCreateIssue()}
          defaultProjectId={createIssueDefaults?.projectId}
          defaultSprintId={createIssueDefaults?.sprintId}
          defaultAssigneeId={createIssueDefaults?.assigneeId}
        />
      )}
    </>
  );
};
