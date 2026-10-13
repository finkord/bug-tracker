import React from 'react';
import type {
  ProjectItem,
  ProjectQuickFilterItem,
  ProjectComponentItem,
  ProjectVersionItem,
  TeamItem,
} from '../../api/client';
import type { KanbanSettings } from '../../types/kanban';
import {
  Tooltip,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SearchInput,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
} from '../ui';
import {
  RefreshCw,
  Layers,
  BookmarkPlus,
  Settings,
  Columns3,
  Users2,
  Users,
  Milestone,
  SlidersHorizontal,
  Bug,
  CheckSquare,
  Sparkles,
  Zap,
  Flame,
  AlertCircle,
} from 'lucide-react';

interface KanbanToolbarProps {
  activeProject: ProjectItem | null;
  boardMode?: 'kanban' | 'scrum';
  onBoardModeChange?: (mode: 'kanban' | 'scrum') => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  filterType: string;
  onFilterTypeChange: (val: string) => void;
  filterPriority: string;
  onFilterPriorityChange: (val: string) => void;
  projectComponents?: ProjectComponentItem[];
  selectedComponentId?: number | null;
  onSelectComponent?: (id: number | null) => void;
  projectVersions?: ProjectVersionItem[];
  selectedVersionId?: number | null;
  onSelectVersion?: (id: number | null) => void;
  teams?: TeamItem[];
  selectedTeamId?: number | null;
  onSelectTeam?: (id: number | null) => void;
  projectQuickFilters?: ProjectQuickFilterItem[];
  activeQuickFilterIds?: number[];
  onToggleQuickFilter: (id: number) => void;
  settings: KanbanSettings;
  onUpdateSettings: (newSettings: KanbanSettings) => void;
  onOpenSettingsModal: (initialTab?: 'layout' | 'quickFilters') => void;
  onRefresh: () => void;
  onSaveCurrentFilter: () => void;
  loading: boolean;
  totalFilteredCount: number;
}

export const KanbanToolbar: React.FC<KanbanToolbarProps> = ({
  activeProject: _activeProject,
  boardMode = 'kanban',
  onBoardModeChange,
  searchTerm,
  onSearchChange,
  filterType,
  onFilterTypeChange,
  filterPriority,
  onFilterPriorityChange,
  projectComponents = [],
  selectedComponentId = null,
  onSelectComponent,
  projectVersions = [],
  selectedVersionId = null,
  onSelectVersion,
  teams = [],
  selectedTeamId = null,
  onSelectTeam,
  projectQuickFilters = [],
  activeQuickFilterIds = [],
  onToggleQuickFilter,
  settings,
  onUpdateSettings,
  onOpenSettingsModal,
  onRefresh,
  onSaveCurrentFilter,
  loading,
  totalFilteredCount,
}) => {
  const isFilterActive =
    searchTerm.trim() !== '' ||
    filterType !== 'ALL' ||
    filterPriority !== 'ALL' ||
    selectedComponentId !== null ||
    (selectedTeamId !== null && selectedTeamId !== undefined) ||
    (selectedVersionId !== null && selectedVersionId !== undefined) ||
    activeQuickFilterIds.length > 0;

  return (
    <div className="flex flex-col gap-2.5 pb-2.5 border-b border-[var(--md-sys-color-outline-variant)]/20">
      {/* Primary Row: Ticket Count, Search, Filters, and Layout Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Board Mode Toggle, Ticket Count Badge, Search Bar, Type & Priority Selects */}
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          {onBoardModeChange && (
            <Tabs
              value={boardMode}
              onValueChange={(val) => onBoardModeChange(val as 'kanban' | 'scrum')}
            >
              <TabsList variant="pills" className="rounded-full">
                <TabsTrigger
                  value="kanban"
                  onClick={() => onBoardModeChange('kanban')}
                  variant="pills"
                  size="sm"
                  className="rounded-full gap-1.5 font-semibold"
                >
                  <Columns3 className="w-3.5 h-3.5" />
                  <span>Kanban</span>
                </TabsTrigger>
                <TabsTrigger
                  value="scrum"
                  onClick={() => onBoardModeChange('scrum')}
                  variant="pills"
                  size="sm"
                  className="rounded-full gap-1.5 font-semibold"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Scrum Sprint</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* Ticket Count Badge */}
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] border border-[var(--md-sys-color-outline-variant)]/20 shadow-2xs shrink-0">
            {totalFilteredCount} {totalFilteredCount === 1 ? 'ticket' : 'tickets'}
          </span>

          {/* Search Input */}
          <SearchInput
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Search by title, key, desc..."
            enableShortcut
            size="sm"
            className="flex-1 min-w-[180px] max-w-sm"
          />

          {/* Type Filter Select using UI Component Kit */}
          <div className="w-32 sm:w-36">
            <Select value={filterType} onValueChange={onFilterTypeChange}>
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

          {/* Priority Filter Select using UI Component Kit */}
          <div className="w-36">
            <Select value={filterPriority} onValueChange={onFilterPriorityChange}>
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

          {/* Component Filter Select */}
          {projectComponents && projectComponents.length > 0 && (
            <div className="w-36 sm:w-40">
              <Select
                value={selectedComponentId !== null ? String(selectedComponentId) : 'ALL'}
                onValueChange={(val) => onSelectComponent?.(val === 'ALL' ? null : Number(val))}
              >
                <SelectTrigger size="sm" className="rounded-full bg-[var(--md-sys-color-surface-container)] text-xs border-0">
                  <SelectValue placeholder="All Components" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Components</SelectItem>
                  {projectComponents.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Team Filter Select */}
          {teams && teams.length > 0 && (
            <div className="w-36 sm:w-40">
              <Select
                value={selectedTeamId !== null && selectedTeamId !== undefined ? String(selectedTeamId) : 'ALL'}
                onValueChange={(val) => onSelectTeam?.(val === 'ALL' ? null : Number(val))}
              >
                <SelectTrigger size="sm" className="rounded-full bg-[var(--md-sys-color-surface-container)] text-xs border-0">
                  <div className="flex items-center gap-1.5 truncate">
                    <Users className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] shrink-0" />
                    <SelectValue placeholder="All Teams" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Teams</SelectItem>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Release / Version Filter Select */}
          {projectVersions && projectVersions.length > 0 && (
            <div className="w-36 sm:w-40">
              <Select
                value={selectedVersionId !== null && selectedVersionId !== undefined ? String(selectedVersionId) : 'ALL'}
                onValueChange={(val) => onSelectVersion?.(val === 'ALL' ? null : Number(val))}
              >
                <SelectTrigger size="sm" className="rounded-full bg-[var(--md-sys-color-surface-container)] text-xs border-0">
                  <div className="flex items-center gap-1.5 truncate">
                    <Milestone className="w-3.5 h-3.5 text-[var(--md-sys-color-tertiary)] shrink-0" />
                    <SelectValue placeholder="All Releases" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Releases</SelectItem>
                  {projectVersions.map((v) => (
                    <SelectItem key={v.id} value={String(v.id)}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Right Controls: Grouping View Mode, Settings, Refresh */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* Grouping / Swimlane Selector */}
          <div className="w-36 sm:w-40">
            <Select
              value={settings.viewMode === 'flat' || settings.swimlaneType === 'none' ? 'none' : (settings.swimlaneType || 'none')}
              onValueChange={(val) => {
                if (val === 'none') {
                  onUpdateSettings({ ...settings, viewMode: 'flat', swimlaneType: 'none' });
                } else {
                  onUpdateSettings({ ...settings, viewMode: 'swimlanes', swimlaneType: val as 'none' | 'assignee' | 'epic' | 'expedite' });
                }
              }}
            >
              <SelectTrigger size="sm" className="rounded-full bg-[var(--md-sys-color-surface-container)] text-xs border-0">
                <div className="flex items-center gap-1.5 truncate">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] shrink-0" />
                  <SelectValue placeholder="Grouping" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="flex items-center gap-2">
                    <Columns3 className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] shrink-0" />
                    <span>Flat View</span>
                  </span>
                </SelectItem>
                <SelectItem value="assignee">
                  <span className="flex items-center gap-2">
                    <Users2 className="w-3.5 h-3.5 text-[var(--md-sys-color-tertiary)] shrink-0" />
                    <span>By Assignee</span>
                  </span>
                </SelectItem>
                <SelectItem value="epic">
                  <span className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-[var(--md-sys-color-secondary)] shrink-0" />
                    <span>By Epic</span>
                  </span>
                </SelectItem>
                <SelectItem value="expedite">
                  <span className="flex items-center gap-2">
                    <Flame className="w-3.5 h-3.5 text-[var(--md-sys-color-error)] shrink-0" />
                    <span>Expedite</span>
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Board Settings Modal Trigger */}
          <Tooltip content="Board Settings (Grouping, Density, WIP Limits)">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onOpenSettingsModal('layout')}
              aria-label="Kanban Settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </Tooltip>

          {/* Refresh Button */}
          <Tooltip content="Refresh board tickets">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onRefresh}
              disabled={loading}
              aria-label="Refresh board"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Secondary Row: Dynamic Quick Filters & Actions */}
      {(projectQuickFilters.length > 0 || isFilterActive) && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {projectQuickFilters.map((qf) => {
              const isActive = activeQuickFilterIds.includes(qf.id);
              return (
                <Button
                  key={qf.id}
                  type="button"
                  variant={isActive ? 'tonal' : 'ghost'}
                  size="sm"
                  onClick={() => onToggleQuickFilter(qf.id)}
                  className={isActive ? 'ring-1 ring-[var(--md-sys-color-primary)]' : 'bg-[var(--md-sys-color-surface-container)]'}
                  title={qf.jqlQuery}
                >
                  {qf.name}
                </Button>
              );
            })}

            {/* Manage Quick Filters Shortcut */}
            <Tooltip content="Manage Quick Filters (Tech Lead)">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => onOpenSettingsModal('quickFilters')}
                aria-label="Manage quick filters"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </Button>
            </Tooltip>

            {/* Save Filter Button */}
            {isFilterActive && (
              <Tooltip content="Save current filter to Personal Dashboard">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={onSaveCurrentFilter}
                  aria-label="Save current filter"
                >
                  <BookmarkPlus className="w-4 h-4" />
                </Button>
              </Tooltip>
            )}
          </div>

          {/* Reset Filters button */}
          {isFilterActive && (
            <Button
              type="button"
              variant="text"
              size="sm"
              onClick={() => {
                onSearchChange('');
                onFilterTypeChange('ALL');
                onFilterPriorityChange('ALL');
                onSelectComponent?.(null);
                onSelectTeam?.(null);
                onSelectVersion?.(null);
                activeQuickFilterIds.forEach((id) => onToggleQuickFilter(id));
              }}
              className="text-xs"
            >
              Reset filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
