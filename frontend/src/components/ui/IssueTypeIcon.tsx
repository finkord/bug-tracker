import React from 'react';
import { Bug, CheckSquare, Bookmark, Zap, ListTodo } from 'lucide-react';

export interface IssueTypeIconProps {
  type?: string | null;
  className?: string;
}

export const IssueTypeIcon: React.FC<IssueTypeIconProps> = ({
  type = 'TASK',
  className = 'w-3.5 h-3.5',
}) => {
  switch (type?.toUpperCase()) {
    case 'BUG':
      return <Bug className={`${className} text-[var(--md-sys-color-error)]`} />;
    case 'TASK':
      return <CheckSquare className={`${className} text-[var(--md-sys-color-primary)]`} />;
    case 'STORY':
    case 'FEATURE':
      return <Bookmark className={`${className} text-[var(--md-sys-color-success)]`} />;
    case 'EPIC':
      return <Zap className={`${className} text-[var(--md-sys-color-tertiary)]`} />;
    case 'SUBTASK':
      return <ListTodo className={`${className} text-[var(--md-sys-color-secondary)]`} />;
    default:
      return <CheckSquare className={`${className} text-[var(--md-sys-color-primary)]`} />;
  }
};
