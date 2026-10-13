import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { IssueCard, type IssueCardProps } from './IssueCard.js';

export interface DraggableKanbanCardProps extends IssueCardProps {
  disabled?: boolean;
}

/**
 * Headless accessible draggable card wrapper for Kanban & Scrum boards powered by @dnd-kit.
 */
const DraggableKanbanCardComponent: React.FC<DraggableKanbanCardProps> = ({
  disabled = false,
  ...props
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `issue-${props.issue.id}`,
    data: {
      type: 'issue',
      issue: props.issue,
    },
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`touch-none select-none ${isDragging ? 'opacity-30 scale-95 pointer-events-none' : ''}`}
    >
      <IssueCard {...props} isDragging={isDragging} />
    </div>
  );
};

export const DraggableKanbanCard = React.memo(DraggableKanbanCardComponent);
