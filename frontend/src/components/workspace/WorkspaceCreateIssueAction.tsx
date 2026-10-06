import React from 'react';
import { Plus } from 'lucide-react';
import { IssueModal } from '../kanban/IssueModal';
import { Button } from '../ui/Button';
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
      <Button
        type="button"
        variant="primary"
        size="sm"
        onClick={() => openCreateIssue()}
        leftIcon={<Plus className="w-3.5 h-3.5" />}
        className="rounded-full shadow-2xs shrink-0 select-none"
        title="Create new issue (C)"
        aria-label="Create new issue"
      >
        <span className="hidden sm:inline">Create</span>
      </Button>

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
