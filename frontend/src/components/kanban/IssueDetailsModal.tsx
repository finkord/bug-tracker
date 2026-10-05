import React from 'react';
import type { IssueItem } from '../../api/client';
import { Modal } from '../ui';
import { IssueDetailView } from '../issue-detail/index.js';

export interface IssueDetailsModalProps {
  isOpen: boolean;
  issueId: number | null;
  onClose: () => void;
  onIssueUpdated?: (updatedIssue: IssueItem) => void;
  onIssueDeleted?: (issueId: number) => void;
  onEditClick?: (issue: IssueItem) => void;
}

export const IssueDetailsModal: React.FC<IssueDetailsModalProps> = ({
  isOpen,
  issueId,
  onClose,
  onIssueUpdated,
  onIssueDeleted,
  onEditClick,
}) => {
  if (!isOpen || !issueId) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      className="p-0 overflow-hidden max-h-[92vh] flex flex-col"
    >
      <div className="overflow-y-auto max-h-[calc(92vh-2rem)] p-3 sm:p-5">
        <IssueDetailView
          issueKeyOrId={issueId}
          isModal
          onClose={onClose}
          onIssueUpdated={onIssueUpdated}
          onIssueDeleted={onIssueDeleted}
          onEditClick={onEditClick}
        />
      </div>
    </Modal>
  );
};
