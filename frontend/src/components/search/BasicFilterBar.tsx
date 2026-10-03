import React from 'react';
import type { BasicFilterCriteria } from '../../types/search';
import type { ProjectItem, AssigneeUser } from '../../api/client';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SearchInput,
} from '../ui';
import { Avatar } from '../common/Avatar';
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
import { FilterMultiSelectPopover, type FilterMultiSelectOption } from './FilterMultiSelectPopover';

const TYPE_OPTIONS: FilterMultiSelectOption[] = [
  { value: 'BUG', label: 'Bug', icon: <Bug className="w-3.5 h-3.5 text-[var(--md-sys-color-error)]" /> },
  { value: 'TASK', label: 'Task', icon: <CheckSquare className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" /> },
  { value: 'FEATURE', label: 'Feature', icon: <Sparkles className="w-3.5 h-3.5 text-[var(--md-sys-color-success)]" /> },
  { value: 'IMPROVEMENT', label: 'Improvement', icon: <Zap className="w-3.5 h-3.5 text-[var(--md-sys-color-tertiary)]" /> },
];

const STATUS_OPTIONS: FilterMultiSelectOption[] = [
  { value: 'OPEN', label: 'To Do', colorDot: 'var(--md-sys-color-outline)' },
  { value: 'IN_PROGRESS', label: 'In Progress', colorDot: 'var(--md-sys-color-primary)' },
  { value: 'REVIEW', label: 'In Review', colorDot: 'var(--md-sys-color-tertiary)' },
  { value: 'RESOLVED', label: 'Resolved', colorDot: 'var(--md-sys-color-success)' },
  { value: 'CLOSED', label: 'Closed', colorDot: 'var(--md-sys-color-outline-variant)' },
];

const PRIORITY_OPTIONS: FilterMultiSelectOption[] = [
  { value: 'CRITICAL', label: 'Critical', icon: <Flame className="w-3.5 h-3.5 text-[var(--md-sys-color-priority-critical)]" /> },
  { value: 'HIGH', label: 'High', icon: <AlertCircle className="w-3.5 h-3.5 text-[var(--md-sys-color-priority-high)]" /> },
  { value: 'MEDIUM', label: 'Medium', colorDot: 'var(--md-sys-color-priority-medium)' },
  { value: 'LOW', label: 'Low', colorDot: 'var(--md-sys-color-priority-low)' },
];

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
    <div className="py-1">
      {/* Search Input and Filter Dropdowns Row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Quick Text Search */}
        <SearchInput
          value={searchQuery}
          onChange={onSearchQueryChange}
          placeholder="Search summary, description, or key..."
          enableShortcut
          size="sm"
          className="w-56 sm:w-64 max-w-xs shrink-0"
        />

        {/* Project Selector */}
        <div className="w-32 sm:w-36 shrink-0">
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

        {/* Issue Type Multi-Select Popover */}
        <FilterMultiSelectPopover
          label="Types"
          options={TYPE_OPTIONS}
          selectedValues={filters.issueTypes}
          onSelectionChange={(selected) => handleFieldChange('issueTypes', selected)}
          placeholder="Filter issue types..."
        />

        {/* Status Multi-Select Popover */}
        <FilterMultiSelectPopover
          label="Statuses"
          options={STATUS_OPTIONS}
          selectedValues={filters.statuses}
          onSelectionChange={(selected) => handleFieldChange('statuses', selected)}
          placeholder="Filter statuses..."
        />

        {/* Priority Multi-Select Popover */}
        <FilterMultiSelectPopover
          label="Priorities"
          options={PRIORITY_OPTIONS}
          selectedValues={filters.priorities}
          onSelectionChange={(selected) => handleFieldChange('priorities', selected)}
          placeholder="Filter priorities..."
        />

        {/* Assignee Selector */}
        <div className="w-32 sm:w-36 shrink-0">
          <Select
            value={filters.assignee}
            onValueChange={(val) => handleFieldChange('assignee', val)}
          >
            <SelectTrigger size="sm" className="rounded-full bg-[var(--md-sys-color-surface-container)] text-xs font-semibold border-0">
              {(() => {
                const selUser = users.find((u) => String(u.id) === filters.assignee);
                if (selUser) {
                  return (
                    <span className="flex items-center gap-1.5 truncate">
                      <Avatar name={selUser.fullName} avatarUrl={selUser.avatarUrl} size="xs" showTooltip={false} className="w-4 h-4 text-[9px] shrink-0" />
                      <span className="truncate">{selUser.fullName}</span>
                    </span>
                  );
                }
                return <SelectValue placeholder="All Assignees" />;
              })()}
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
                  <span className="flex items-center gap-1.5 truncate">
                    <Avatar name={u.fullName} avatarUrl={u.avatarUrl} size="xs" showTooltip={false} className="w-4 h-4 text-[9px] shrink-0" />
                    <span className="truncate">{u.fullName}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sprint Selector */}
        <div className="w-28 sm:w-32 shrink-0">
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)]/30 transition cursor-pointer whitespace-nowrap"
            title="Reset all filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
};
