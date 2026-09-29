import React from 'react';
import type { BasicFilterCriteria } from '../../types/search';
import type { ProjectItem, AssigneeUser } from '../../api/client';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Badge,
} from '../ui';
import {
  FolderGit2,
  Bug,
  CheckSquare,
  Sparkles,
  Zap,
  Flame,
  AlertCircle,
  User,
  UserCheck,
  UserX,
  Layers,
  Search,
  X,
  RotateCcw,
} from 'lucide-react';

interface BasicFilterBarProps {
  projects: ProjectItem[];
  users: AssigneeUser[];
  filters: BasicFilterCriteria;
  searchQuery: string;
  onFiltersChange: (filters: BasicFilterCriteria) => void;
  onSearchQueryChange: (query: string) => void;
  onClearFilters: () => void;
  onSwitchToJql: () => void;
}

export const BasicFilterBar: React.FC<BasicFilterBarProps> = ({
  projects,
  users,
  filters,
  searchQuery,
  onFiltersChange,
  onSearchQueryChange,
  onClearFilters,
  onSwitchToJql,
}) => {
  const handleFieldChange = <K extends keyof BasicFilterCriteria>(field: K, value: BasicFilterCriteria[K]) => {
    onFiltersChange({
      ...filters,
      [field]: value,
    });
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    filters.projectKey !== 'ALL' ||
    filters.issueTypes.length > 0 ||
    filters.statuses.length > 0 ||
    filters.priorities.length > 0 ||
    filters.assignee !== 'ALL' ||
    filters.sprint !== 'ALL';

  return (
    <div className="flex flex-col gap-2.5 py-2">
      {/* Search Input and Filter Dropdowns Row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Quick Text Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Search summary, description, or key..."
            className="w-full pl-8 pr-7 py-1.5 text-xs rounded-full bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]/40 transition border-0"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchQueryChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Project Selector */}
        <div className="w-36 sm:w-44">
          <Select
            value={filters.projectKey}
            onValueChange={(val) => handleFieldChange('projectKey', val)}
          >
            <SelectTrigger size="sm" className="rounded-full bg-[var(--md-sys-color-surface-container)] text-xs font-semibold border-0">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">
                <span className="flex items-center gap-1.5 font-medium">
                  <FolderGit2 className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                  <span>All Projects</span>
                </span>
              </SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.key}>
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="font-mono text-[10px] font-bold text-[var(--md-sys-color-primary)]">
                      [{p.key}]
                    </span>
                    <span className="truncate">{p.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Issue Type Selector */}
        <div className="w-32 sm:w-36">
          <Select
            value={filters.issueTypes.length === 1 ? filters.issueTypes[0] : 'ALL'}
            onValueChange={(val) => handleFieldChange('issueTypes', val === 'ALL' ? [] : [val])}
          >
            <SelectTrigger size="sm" className="rounded-full bg-[var(--md-sys-color-surface-container)] text-xs font-semibold border-0">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="BUG">
                <span className="flex items-center gap-1.5">
                  <Bug className="w-3.5 h-3.5 text-[var(--md-sys-color-error)]" />
                  <span>Bug</span>
                </span>
              </SelectItem>
              <SelectItem value="TASK">
                <span className="flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                  <span>Task</span>
                </span>
              </SelectItem>
              <SelectItem value="FEATURE">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[var(--md-sys-color-success)]" />
                  <span>Feature</span>
                </span>
              </SelectItem>
              <SelectItem value="IMPROVEMENT">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[var(--md-sys-color-tertiary)]" />
                  <span>Improvement</span>
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Selector */}
        <div className="w-32 sm:w-36">
          <Select
            value={filters.statuses.length === 1 ? filters.statuses[0] : 'ALL'}
            onValueChange={(val) => handleFieldChange('statuses', val === 'ALL' ? [] : [val])}
          >
            <SelectTrigger size="sm" className="rounded-full bg-[var(--md-sys-color-surface-container)] text-xs font-semibold border-0">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="OPEN">To Do</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="REVIEW">In Review</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Priority Selector */}
        <div className="w-32 sm:w-36">
          <Select
            value={filters.priorities.length === 1 ? filters.priorities[0] : 'ALL'}
            onValueChange={(val) => handleFieldChange('priorities', val === 'ALL' ? [] : [val])}
          >
            <SelectTrigger size="sm" className="rounded-full bg-[var(--md-sys-color-surface-container)] text-xs font-semibold border-0">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Priorities</SelectItem>
              <SelectItem value="CRITICAL">
                <span className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-[var(--md-sys-color-priority-critical)]" />
                  <span>Critical</span>
                </span>
              </SelectItem>
              <SelectItem value="HIGH">
                <span className="flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-[var(--md-sys-color-priority-high)]" />
                  <span>High</span>
                </span>
              </SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Assignee Selector */}
        <div className="w-36 sm:w-40">
          <Select
            value={filters.assignee}
            onValueChange={(val) => handleFieldChange('assignee', val)}
          >
            <SelectTrigger size="sm" className="rounded-full bg-[var(--md-sys-color-surface-container)] text-xs font-semibold border-0">
              <SelectValue placeholder="All Assignees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>All Assignees</span>
                </span>
              </SelectItem>
              <SelectItem value="ME">
                <span className="flex items-center gap-1.5 font-medium text-[var(--md-sys-color-primary)]">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Assigned to me</span>
                </span>
              </SelectItem>
              <SelectItem value="UNASSIGNED">
                <span className="flex items-center gap-1.5">
                  <UserX className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)]" />
                  <span>Unassigned</span>
                </span>
              </SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={String(u.id)}>
                  <span className="truncate">{u.fullName}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sprint Selector */}
        <div className="w-32 sm:w-36">
          <Select
            value={filters.sprint}
            onValueChange={(val) => handleFieldChange('sprint', val)}
          >
            <SelectTrigger size="sm" className="rounded-full bg-[var(--md-sys-color-surface-container)] text-xs font-semibold border-0">
              <SelectValue placeholder="All Sprints" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>All Sprints</span>
                </span>
              </SelectItem>
              <SelectItem value="ACTIVE">Active Sprint</SelectItem>
              <SelectItem value="BACKLOG">Backlog (No Sprint)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reset Filter Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="p-1.5 rounded-full text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)]/30 transition cursor-pointer"
            title="Reset all filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Active Filter Chips & Switch to JQL Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {hasActiveFilters ? (
            <>
              <span className="text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)] mr-1">Active filters:</span>
              {searchQuery && (
                <Badge variant="neutral" className="gap-1 text-[11px] rounded-full px-2.5 py-0.5">
                  <span>Text: "{searchQuery}"</span>
                  <button
                    type="button"
                    onClick={() => onSearchQueryChange('')}
                    className="hover:text-[var(--md-sys-color-error)] cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {filters.projectKey !== 'ALL' && (
                <Badge variant="primary" className="gap-1 text-[11px] rounded-full px-2.5 py-0.5">
                  <span>Project: {filters.projectKey}</span>
                  <button
                    type="button"
                    onClick={() => handleFieldChange('projectKey', 'ALL')}
                    className="hover:text-[var(--md-sys-color-error)] cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {filters.issueTypes.length > 0 && (
                <Badge variant="neutral" className="gap-1 text-[11px] rounded-full px-2.5 py-0.5">
                  <span>Type: {filters.issueTypes.join(', ')}</span>
                  <button
                    type="button"
                    onClick={() => handleFieldChange('issueTypes', [])}
                    className="hover:text-[var(--md-sys-color-error)] cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {filters.statuses.length > 0 && (
                <Badge variant="neutral" className="gap-1 text-[11px] rounded-full px-2.5 py-0.5">
                  <span>Status: {filters.statuses.join(', ')}</span>
                  <button
                    type="button"
                    onClick={() => handleFieldChange('statuses', [])}
                    className="hover:text-[var(--md-sys-color-error)] cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {filters.priorities.length > 0 && (
                <Badge variant="warning" className="gap-1 text-[11px] rounded-full px-2.5 py-0.5">
                  <span>Priority: {filters.priorities.join(', ')}</span>
                  <button
                    type="button"
                    onClick={() => handleFieldChange('priorities', [])}
                    className="hover:text-[var(--md-sys-color-error)] cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {filters.assignee !== 'ALL' && (
                <Badge variant="neutral" className="gap-1 text-[11px] rounded-full px-2.5 py-0.5">
                  <span>Assignee: {filters.assignee === 'ME' ? 'Me' : filters.assignee}</span>
                  <button
                    type="button"
                    onClick={() => handleFieldChange('assignee', 'ALL')}
                    className="hover:text-[var(--md-sys-color-error)] cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {filters.sprint !== 'ALL' && (
                <Badge variant="primary" className="gap-1 text-[11px] rounded-full px-2.5 py-0.5">
                  <span>Sprint: {filters.sprint}</span>
                  <button
                    type="button"
                    onClick={() => handleFieldChange('sprint', 'ALL')}
                    className="hover:text-[var(--md-sys-color-error)] cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
            </>
          ) : (
            <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]/60">
              Showing all issues (no filters applied)
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onSwitchToJql}
          className="text-xs font-semibold text-[var(--md-sys-color-primary)] hover:underline cursor-pointer bg-transparent border-0 p-0 ml-auto"
        >
          Switch to JQL Editor
        </button>
      </div>
    </div>
  );
};
