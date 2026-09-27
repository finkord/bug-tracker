import React from 'react';
import { Link } from 'react-router-dom';
import type { ProjectItem } from '../../api/client';
import type { AgileViewMode, AgileFilterState } from '../../types/agile';
import {
  Button,
  Tooltip,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Tabs,
  TabsList,
  TabsTrigger,
} from '../ui';
import {
  Layers,
  Kanban,
  Search,
  RefreshCw,
  Plus,
  TrendingDown,
  X,
  User,
  UserX,
  AlertTriangle,
  Bug,
  CheckSquare,
  Sparkles,
  Zap,
  Flame,
  AlertCircle,
} from 'lucide-react';

interface AgileToolbarProps {
  projects: ProjectItem[];
  selectedProjectId: number;
  onSelectProject: (id: number) => void;
  activeProject: ProjectItem | null;
  viewMode: AgileViewMode;
  onViewModeChange: (mode: AgileViewMode) => void;
  filters: AgileFilterState;
  onFiltersChange: (newFilters: AgileFilterState) => void;
  onOpenCreateSprint: () => void;
  onOpenAnalytics: () => void;
  onRefresh: () => void;
  loading: boolean;
  totalIssuesCount: number;
  activeSprintName?: string;
}

export const AgileToolbar: React.FC<AgileToolbarProps> = ({
  projects,
  selectedProjectId,
  onSelectProject,
  activeProject,
  viewMode,
  onViewModeChange,
  filters,
  onFiltersChange,
  onOpenCreateSprint,
  onOpenAnalytics,
  onRefresh,
  loading,
  totalIssuesCount,
  activeSprintName,
}) => {
  const handleToggleQuickFilter = (key: 'onlyMine' | 'unassignedOnly' | 'highPriorityOnly') => {
    onFiltersChange({
      ...filters,
      [key]: !filters[key],
    });
  };

  return (
    <div className="flex flex-col gap-3 pb-3 border-b border-[var(--md-sys-color-outline-variant)]">
      {/* Top Row: Workspace Selector, View Mode Switcher, Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Title & Workspace Selector */}
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-[var(--md-sys-color-on-surface)] leading-tight">
                Backlog & Sprints
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]">
                {totalIssuesCount} {totalIssuesCount === 1 ? 'ticket' : 'tickets'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-1">
              <div className="w-48 sm:w-56">
                <Select
                  value={String(selectedProjectId)}
                  onValueChange={(val) => onSelectProject(Number(val))}
                >
                  <SelectTrigger size="sm" className="rounded-full bg-[var(--md-sys-color-surface-container)] text-xs font-semibold border-0">
                    <SelectValue placeholder="Select Workspace" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        [{p.key}] {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {activeProject && (
                <Link
                  to={`/projects/${activeProject.id}/board`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--md-sys-color-primary-container)]/40 text-[11px] font-semibold text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary-container)]/80 transition-colors"
                >
                  <Kanban className="w-3.5 h-3.5" />
                  <span>Kanban Board</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Right Controls: View Switcher (Backlog Planning vs Active Sprint), Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle */}
          <Tabs
            value={viewMode}
            onValueChange={(val) => onViewModeChange(val as AgileViewMode)}
          >
            <TabsList variant="pills" className="rounded-full">
              <TabsTrigger
                value="backlog"
                variant="pills"
                size="sm"
                className="rounded-full gap-1.5 font-semibold"
                title="Backlog Planning (Sprints & Backlog Containers)"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Backlog</span>
              </TabsTrigger>

              <TabsTrigger
                value="board"
                variant="pills"
                size="sm"
                className="rounded-full gap-1.5 font-semibold"
                title="Active Sprint Board (Execution)"
              >
                <Kanban className="w-3.5 h-3.5" />
                <span className="flex items-center gap-1">
                  <span>Active Sprint</span>
                  {activeSprintName && (
                    <span className="w-2 h-2 rounded-full bg-[var(--md-sys-color-success)]" />
                  )}
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Velocity & Analytics Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenAnalytics}
            leftIcon={<TrendingDown className="w-3.5 h-3.5" />}
          >
            <span className="hidden sm:inline">Velocity & Analytics</span>
            <span className="sm:hidden">Analytics</span>
          </Button>

          {/* Create Sprint Action */}
          <Button
            variant="tonal"
            size="sm"
            onClick={onOpenCreateSprint}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Create Sprint
          </Button>

          {/* Refresh Button */}
          <Tooltip content="Refresh backlog issues">
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="p-2 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors cursor-pointer disabled:opacity-50"
              aria-label="Refresh issues"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Bottom Row: Search, Type & Priority Selects, Quick Filters */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)]" />
            <input
              type="text"
              placeholder="Search by title, key..."
              value={filters.searchTerm}
              onChange={(e) => onFiltersChange({ ...filters, searchTerm: e.target.value })}
              className="w-full pl-8.5 pr-8 py-1.5 rounded-full bg-[var(--md-sys-color-surface-container)] focus:bg-[var(--md-sys-color-surface-container-high)] text-xs text-[var(--md-sys-color-on-surface)] border-0 focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)] transition-all font-medium"
            />
            {filters.searchTerm && (
              <button
                type="button"
                onClick={() => onFiltersChange({ ...filters, searchTerm: '' })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Type Filter Select */}
          <div className="w-36">
            <Select
              value={filters.filterType}
              onValueChange={(val) => onFiltersChange({ ...filters, filterType: val })}
            >
              <SelectTrigger size="sm" className="rounded-full bg-[var(--md-sys-color-surface-container)] text-xs border-0">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="BUG">
                  <span className="flex items-center gap-2">
                    <Bug className="w-3.5 h-3.5 text-[var(--md-sys-color-error)] shrink-0" />
                    <span>Bug</span>
                  </span>
                </SelectItem>
                <SelectItem value="TASK">
                  <span className="flex items-center gap-2">
                    <CheckSquare className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] shrink-0" />
                    <span>Task</span>
                  </span>
                </SelectItem>
                <SelectItem value="FEATURE">
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[var(--md-sys-color-success)] shrink-0" />
                    <span>Feature</span>
                  </span>
                </SelectItem>
                <SelectItem value="IMPROVEMENT">
                  <span className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-[var(--md-sys-color-tertiary)] shrink-0" />
                    <span>Improvement</span>
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority Filter Select */}
          <div className="w-36">
            <Select
              value={filters.filterPriority}
              onValueChange={(val) => onFiltersChange({ ...filters, filterPriority: val })}
            >
              <SelectTrigger size="sm" className="rounded-full bg-[var(--md-sys-color-surface-container)] text-xs border-0">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Priorities</SelectItem>
                <SelectItem value="CRITICAL">
                  <span className="flex items-center gap-2">
                    <Flame className="w-3.5 h-3.5 text-[var(--md-sys-color-priority-critical)] shrink-0" />
                    <span>Critical</span>
                  </span>
                </SelectItem>
                <SelectItem value="HIGH">
                  <span className="flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-[var(--md-sys-color-priority-high)] shrink-0" />
                    <span>High</span>
                  </span>
                </SelectItem>
                <SelectItem value="MEDIUM">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--md-sys-color-priority-medium)] shrink-0" />
                    <span>Medium</span>
                  </span>
                </SelectItem>
                <SelectItem value="LOW">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--md-sys-color-priority-low)] shrink-0" />
                    <span>Low</span>
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => handleToggleQuickFilter('onlyMine')}
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              filters.onlyMine
                ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] ring-1 ring-[var(--md-sys-color-primary)]'
                : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
            }`}
          >
            <User className="w-3 h-3" />
            <span>Only My Issues</span>
          </button>

          <button
            type="button"
            onClick={() => handleToggleQuickFilter('unassignedOnly')}
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              filters.unassignedOnly
                ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] ring-1 ring-[var(--md-sys-color-primary)]'
                : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
            }`}
          >
            <UserX className="w-3 h-3" />
            <span>Unassigned</span>
          </button>

          <button
            type="button"
            onClick={() => handleToggleQuickFilter('highPriorityOnly')}
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              filters.highPriorityOnly
                ? 'bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] ring-1 ring-[var(--md-sys-color-error)]'
                : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Crit / High</span>
          </button>
        </div>
      </div>
    </div>
  );
};
