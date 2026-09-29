import React from 'react';
import type { IssueItem, UserProfile } from '../../api/types/index.js';
import { Avatar } from '../common/Avatar.js';
import { Card, Badge, Button } from '../ui/index.js';
import {
  UserCheck,
  Calendar,
  Layers,
  UserPlus,
  Tag,
} from 'lucide-react';

interface IssueSidebarDetailsProps {
  issue: IssueItem;
  currentUser: UserProfile | null;
  onAssignToMe: () => Promise<void>;
  onSprintChange: (sprint: string | null) => Promise<void>;
}

export const IssueSidebarDetails: React.FC<IssueSidebarDetailsProps> = ({
  issue,
  currentUser,
  onAssignToMe,
}) => {
  const getPriorityBadgeVariant = (priority: string): NonNullable<React.ComponentProps<typeof Badge>['variant']> => {
    switch (priority) {
      case 'CRITICAL':
        return 'critical';
      case 'HIGH':
        return 'high';
      case 'MEDIUM':
        return 'medium';
      default:
        return 'low';
    }
  };

  const getSeverityBadgeVariant = (severity: string): NonNullable<React.ComponentProps<typeof Badge>['variant']> => {
    switch (severity) {
      case 'BLOCKER':
        return 'error';
      case 'MAJOR':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  return (
    <Card className="p-4 space-y-4 bg-card/80 border-border/80">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Attributes & Details
      </h3>

      <div className="space-y-3.5 text-xs">
        {/* Assignee */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
            <UserCheck className="w-3.5 h-3.5" />
            Assignee
          </span>
          <div className="flex items-center gap-2">
            {issue.assignee ? (
              <div className="flex items-center gap-1.5">
                <Avatar
                  name={issue.assignee.fullName}
                  avatarUrl={issue.assignee.avatarUrl || undefined}
                  size="sm"
                  className="w-5 h-5 text-[10px]"
                />
                <span className="font-semibold text-foreground">{issue.assignee.fullName}</span>
              </div>
            ) : (
              <span className="text-muted-foreground italic">Unassigned</span>
            )}
            {currentUser && issue.assignee?.id !== currentUser.id && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onAssignToMe}
                className="h-6 px-1.5 text-[11px] text-primary hover:text-primary hover:bg-primary/10"
              >
                <UserPlus className="w-3 h-3 mr-1" />
                Assign to me
              </Button>
            )}
          </div>
        </div>

        {/* Reporter */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground font-medium">Reporter</span>
          <div className="flex items-center gap-1.5">
            <Avatar
              name={issue.reporter.fullName}
              avatarUrl={issue.reporter.avatarUrl || undefined}
              size="sm"
              className="w-5 h-5 text-[10px]"
            />
            <span className="font-semibold text-foreground">{issue.reporter.fullName}</span>
          </div>
        </div>

        {/* Priority */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground font-medium">Priority</span>
          <Badge variant={getPriorityBadgeVariant(issue.priority)} className="text-[11px] px-2 py-0.5">
            {issue.priority}
          </Badge>
        </div>

        {/* Severity */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground font-medium">Severity</span>
          <Badge variant={getSeverityBadgeVariant(issue.severity)} className="text-[11px] px-2 py-0.5">
            {issue.severity}
          </Badge>
        </div>

        {/* Issue Type */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
            <Tag className="w-3.5 h-3.5" />
            Issue Type
          </span>
          <Badge variant="neutral" className="text-[11px] font-mono">
            {issue.issueType}
          </Badge>
        </div>

        {/* Sprint */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
            <Layers className="w-3.5 h-3.5" />
            Sprint
          </span>
          <span className="font-medium text-foreground">
            {issue.sprint || <span className="text-muted-foreground italic">Backlog</span>}
          </span>
        </div>

        <div className="h-px bg-border/60 my-2" />

        {/* Created At */}
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Calendar className="w-3 h-3" />
            Created
          </span>
          <span className="text-muted-foreground font-mono">
            {new Date(issue.createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* Updated At */}
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <span className="text-muted-foreground">Updated</span>
          <span className="text-muted-foreground font-mono">
            {new Date(issue.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </Card>
  );
};
