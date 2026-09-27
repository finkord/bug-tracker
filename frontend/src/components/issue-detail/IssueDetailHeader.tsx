import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { IssueItem, IssueStatus } from '../../api/types/index.js';
import { Avatar } from '../common/Avatar.js';
import {
  Button,
  Badge,
  Tooltip,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../ui/index.js';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Layers,
  Radio,
} from 'lucide-react';

interface IssueDetailHeaderProps {
  issue: IssueItem;
  activeViewers: Array<{ id: number; fullName: string; avatarUrl?: string }>;
  deleting: boolean;
  onStatusChange: (status: IssueStatus) => Promise<void>;
  onEditClick: () => void;
  onDeleteClick: () => void;
}

export const IssueDetailHeader: React.FC<IssueDetailHeaderProps> = ({
  issue,
  activeViewers,
  deleting,
  onStatusChange,
  onEditClick,
  onDeleteClick,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <div className="h-4 w-px bg-border/80" />

        <Link
          to={`/projects/${issue.projectId}/board`}
          className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
        >
          <Layers className="w-4 h-4 text-primary" />
          {issue.projectName}
        </Link>

        <span className="text-muted-foreground">/</span>

        <Badge variant="neutral" className="font-mono text-xs px-2.5 py-0.5 font-bold tracking-wide">
          {issue.key}
        </Badge>

        <div className="w-36">
          <Select value={issue.status} onValueChange={(val) => onStatusChange(val as IssueStatus)}>
            <SelectTrigger className="h-8 text-xs font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="REVIEW">In Review</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {activeViewers.length > 0 && (
          <div className="flex items-center gap-1.5 bg-primary/5 px-2.5 py-1 rounded-full border border-primary/20 mr-1">
            <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
            <span className="text-xs text-muted-foreground mr-1">Viewing:</span>
            <div className="flex -space-x-1.5 overflow-hidden">
              {activeViewers.map((viewer) => (
                <Tooltip key={viewer.id} content={viewer.fullName}>
                  <div className="inline-block ring-2 ring-background rounded-full">
                    <Avatar
                      name={viewer.fullName}
                      avatarUrl={viewer.avatarUrl || undefined}
                      size="sm"
                      className="w-5 h-5 text-[10px]"
                    />
                  </div>
                </Tooltip>
              ))}
            </div>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={onEditClick}
          className="gap-1.5 text-xs font-medium"
        >
          <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
          Edit
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onDeleteClick}
          disabled={deleting}
          className="gap-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </Button>
      </div>
    </div>
  );
};
