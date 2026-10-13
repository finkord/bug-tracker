import React from 'react';
import type { ProjectItem } from '../../api/client';
import type { AgileViewMode, AgileFilterState } from '../../types/agile';
import { useTeamsQuery } from '../../api/queries/useTeamsQuery.js';
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
  SearchInput,
} from '../ui';
import {
  Layers,
  Kanban,
  RefreshCw,
  Plus,
  TrendingDown,
  User,
  UserX,
  AlertTriangle,
  Bug,
  CheckSquare,
  Sparkles,
  Zap,
  Flame,
  AlertCircle,
  Milestone,
  Users,
} from 'lucide-react';

interface AgileToolbarProps {
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
  isDrawerOpen?: boolean;
  drawerTab?: 'epics' | 'versions';
  onToggleDrawer?: (tab: 'epics' | 'versions') => void;
}

const AgileToolbarComponent: React.FC<AgileToolbarProps> = ({
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
  isDrawerOpen = false,
  drawerTab = 'epics',
  onToggleDrawer,
}) => {
  const { data: teams = [] } = useTeamsQuery(activeProject?.id);

  const handleToggleQuickFilter = (key: 'onlyMine' | 'unassignedOnly' | 'highPriorityOnly') => {
    onFiltersChange({
      ...filters,
      [key]: !filters[key],
    });
  };

  return (
    <div className="flex flex-col gap-2.5 pb-2.5 border-b border-[var(--md-sys-color-outline-variant)]/20">
      {/* Top Row: Ticket Count, View Mode Switcher, Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Ticket Count Badge & View Mode Toggle */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Ticket Count Badge */}
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] border border-[var(--md-sys-color-outline-variant)]/20 shadow-2xs shrink-0">
            {totalIssuesCount} {totalIssuesCount === 1 ? 'ticket' : 'tickets'}
          </span>

          {/* View Mode Toggle */}
          <Tabs
            value={viewMode}
            onValueChange={(val) => onViewModeChange(val as AgileViewMode)}
          >
            <TabsList variant="pills" className="rounded-full">
              <TabsTrigger
                value="backlog"
                onClick={() => onViewModeChange('backlog')}
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
                onClick={() => onViewModeChange('board')}
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

          {/* Epics and Versions Drawer Toggles (When in Backlog planning mode) */}
          {viewMode === 'backlog' && onToggleDrawer && (
            <div className="flex items-center gap-1.5 ml-1">
              <Button
                type="button"
                variant={isDrawerOpen && drawerTab === 'epics' ? 'tonal' : 'ghost'}
                size="sm"
                onClick={() => onToggleDrawer('epics')}
                leftIcon={<Layers className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />}
                className={isDrawerOpen && drawerTab === 'epics' ? 'ring-1 ring-[var(--md-sys-color-primary)]' : 'bg-[var(--md-sys-color-surface-container)]'}
                title="Toggle Epics side panel"
              >
                Epics
              </Button>

              <Button
                type="button"
                variant={isDrawerOpen && drawerTab === 'versions' ? 'tonal' : 'ghost'}
                size="sm"
                onClick={() => onToggleDrawer('versions')}
                leftIcon={<Milestone className="w-3.5 h-3.5 text-[var(--md-sys-color-tertiary)]" />}
                className={isDrawerOpen && drawerTab === 'versions' ? 'ring-1 ring-[var(--md-sys-color-primary)]' : 'bg-[var(--md-sys-color-surface-container)]'}
                title="Toggle Releases / Versions side panel"
              >
                Versions
              </Button>
            </div>
          )}
        </div>

        {/* Right Controls: View Switcher (Backlog Planning vs Active Sprint), Actions */}
        <div className="flex items-center gap-2 flex-wrap">
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
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onRefresh}
              disabled={loading}
              aria-label="Refresh issues"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Bottom Row: Search, Type & Priority Selects, Team Filter, Quick Filters */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
          {/* Search Input */}
          <SearchInput
            value={filters.searchTerm}
            onChange={(val) => onFiltersChange({ ...filters, searchTerm: val })}
            placeholder="Search by title, key..."
            enableShortcut
            size="sm"
            className="flex-1 min-w-[180px] max-w-sm"
          />

          {/* Team Filter Select (if teams exist) */}
          {teams.length > 0 && (
            <div className="w-36">
              <Select
                value={String(filters.teamId || 'ALL')}
                onValueChange={(val) =>
                  onFiltersChange({
                    ...filters,
                    teamId: val === 'ALL' ? 'ALL' : Number(val),
                  })
                }
              >
                <SelectTrigger size="sm" className="rounded-full bg-[var(--md-sys-color-surface-container)] text-xs border-0">
                  <SelectValue placeholder="All Teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Teams</SelectItem>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] shrink-0" />
                        <span className="truncate">{t.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
          <Button
            type="button"
            variant={filters.onlyMine ? 'tonal' : 'ghost'}
            size="sm"
            onClick={() => handleToggleQuickFilter('onlyMine')}
            leftIcon={<User className="w-3 h-3" />}
            className={filters.onlyMine ? 'ring-1 ring-[var(--md-sys-color-primary)]' : 'bg-[var(--md-sys-color-surface-container)]'}
          >
            Only My Issues
          </Button>

          <Button
            type="button"
            variant={filters.unassignedOnly ? 'tonal' : 'ghost'}
            size="sm"
            onClick={() => handleToggleQuickFilter('unassignedOnly')}
            leftIcon={<UserX className="w-3 h-3" />}
            className={filters.unassignedOnly ? 'ring-1 ring-[var(--md-sys-color-primary)]' : 'bg-[var(--md-sys-color-surface-container)]'}
          >
            Unassigned
          </Button>

          <Button
            type="button"
            variant={filters.highPriorityOnly ? 'danger-tonal' : 'ghost'}
            size="sm"
            onClick={() => handleToggleQuickFilter('highPriorityOnly')}
            leftIcon={<AlertTriangle className="w-3 h-3" />}
            className={filters.highPriorityOnly ? 'ring-1 ring-[var(--md-sys-color-error)]' : 'bg-[var(--md-sys-color-surface-container)]'}
          >
            Crit / High
          </Button>
        </div>
      </div>
    </div>
  );
};

export const AgileToolbar = React.memo(AgileToolbarComponent);
