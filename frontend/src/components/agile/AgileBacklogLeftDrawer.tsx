import React, { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { IssueItem, ProjectVersionItem } from '../../api/types';
import { useProjectVersionsQuery } from '../../api/queries';
import { Badge, Button, Tabs, TabsList, TabsTrigger } from '../ui';
import {
  Layers,
  Milestone,
  Plus,
  X,
  Filter,
  Calendar,
} from 'lucide-react';

export type BacklogDrawerTab = 'epics' | 'versions';

interface AgileBacklogLeftDrawerProps {
  projectId: number;
  projectKey?: string;
  issues: IssueItem[];
  activeDrawerTab: BacklogDrawerTab;
  onDrawerTabChange: (tab: BacklogDrawerTab) => void;
  selectedEpicId?: number | 'ALL' | 'NONE';
  onSelectEpic: (epicId: number | 'ALL' | 'NONE') => void;
  selectedVersionId?: number | 'ALL' | 'NONE';
  onSelectVersion: (versionId: number | 'ALL' | 'NONE') => void;
  onClose: () => void;
  onCreateEpic: () => void;
}

interface EpicDroppableItemProps {
  epic: IssueItem;
  childIssues: IssueItem[];
  completedChildCount: number;
  progressPercent: number;
  isSelected: boolean;
  onSelectEpic: (epicId: number | 'ALL' | 'NONE') => void;
}

const EpicDroppableItem: React.FC<EpicDroppableItemProps> = ({
  epic,
  childIssues,
  completedChildCount,
  progressPercent,
  isSelected,
  onSelectEpic,
}) => {
  const { setNodeRef } = useDroppable({
    id: `drawer-epic-${epic.id}`,
    data: {
      type: 'epic',
      epicId: epic.id,
    },
  });

  return (
    <div
      ref={setNodeRef}
      data-drop-zone="epic"
      data-epic-id={epic.id}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectEpic(isSelected ? 'ALL' : epic.id);
        }
      }}
      onClick={() => onSelectEpic(isSelected ? 'ALL' : epic.id)}
      className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
        isSelected
          ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/15 shadow-xs'
          : 'border-[var(--md-sys-color-outline-variant)]/30 hover:border-[var(--md-sys-color-outline-variant)]/70 bg-[var(--md-sys-color-surface-container)]'
      }`}
    >
      <div className="flex items-center justify-between gap-1">
        <span
          className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider"
          style={{
            backgroundColor: epic.epicColor ? `${epic.epicColor}22` : 'var(--md-sys-color-tertiary-container)',
            color: epic.epicColor || 'var(--md-sys-color-on-tertiary-container)',
          }}
        >
          {epic.key}
        </span>
        <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-mono">
          {completedChildCount}/{childIssues.length} done
        </span>
      </div>

      <div className="text-xs font-semibold text-[var(--md-sys-color-on-surface)] truncate">
        {epic.title}
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-[var(--md-sys-color-surface-container-highest)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${progressPercent}%`,
            backgroundColor: epic.epicColor || 'var(--md-sys-color-primary)',
          }}
        />
      </div>
    </div>
  );
};

interface VersionDroppableItemProps {
  ver: ProjectVersionItem;
  verIssues: IssueItem[];
  completedCount: number;
  progressPercent: number;
  isSelected: boolean;
  onSelectVersion: (versionId: number | 'ALL' | 'NONE') => void;
}

const VersionDroppableItem: React.FC<VersionDroppableItemProps> = ({
  ver,
  verIssues,
  completedCount,
  progressPercent,
  isSelected,
  onSelectVersion,
}) => {
  const { setNodeRef } = useDroppable({
    id: `drawer-version-${ver.id}`,
    data: {
      type: 'version',
      versionId: ver.id,
    },
  });

  return (
    <div
      ref={setNodeRef}
      data-drop-zone="version"
      data-version-id={ver.id}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectVersion(isSelected ? 'ALL' : (ver.id as number));
        }
      }}
      onClick={() => onSelectVersion(isSelected ? 'ALL' : (ver.id as number))}
      className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
        isSelected
          ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/15 shadow-xs'
          : 'border-[var(--md-sys-color-outline-variant)]/30 hover:border-[var(--md-sys-color-outline-variant)]/70 bg-[var(--md-sys-color-surface-container)]'
      }`}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)] truncate">
          {ver.name}
        </span>
        <Badge
          variant={ver.status === 'RELEASED' ? 'resolved' : 'neutral'}
          size="sm"
          className="text-[9px] uppercase font-mono px-1.5"
        >
          {ver.status || 'UNRELEASED'}
        </Badge>
      </div>

      <div className="flex items-center justify-between text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
        <span className="font-mono">
          {completedCount}/{verIssues.length} issues
        </span>
        {ver.releaseDate && (
          <span className="flex items-center gap-1 opacity-70">
            <Calendar className="w-2.5 h-2.5" />
            <span>{new Date(ver.releaseDate).toLocaleDateString()}</span>
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-[var(--md-sys-color-surface-container-highest)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--md-sys-color-primary)] rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};

interface NoEpicDroppableItemProps {
  count: number;
  isSelected: boolean;
  onSelectEpic: (epicId: number | 'ALL' | 'NONE') => void;
}

const NoEpicDroppableItem: React.FC<NoEpicDroppableItemProps> = ({
  count,
  isSelected,
  onSelectEpic,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'drawer-epic-none',
    data: {
      type: 'epic',
      epicId: null,
    },
  });

  return (
    <div
      ref={setNodeRef}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectEpic(isSelected ? 'ALL' : 'NONE');
        }
      }}
      onClick={() => onSelectEpic(isSelected ? 'ALL' : 'NONE')}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer border ${
        isOver
          ? 'border-[var(--md-sys-color-primary)] ring-2 ring-[var(--md-sys-color-primary)]/50 bg-[var(--md-sys-color-primary-container)]/25 shadow-xs'
          : isSelected
            ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] ring-1 ring-[var(--md-sys-color-primary)]'
            : 'border-transparent text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)]'
      }`}
    >
      <span>Issues without Epic</span>
      <span className="text-[10px] font-mono">{count}</span>
    </div>
  );
};

interface NoVersionDroppableItemProps {
  count: number;
  isSelected: boolean;
  onSelectVersion: (versionId: number | 'ALL' | 'NONE') => void;
}

const NoVersionDroppableItem: React.FC<NoVersionDroppableItemProps> = ({
  count,
  isSelected,
  onSelectVersion,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'drawer-version-none',
    data: {
      type: 'version',
      versionId: null,
    },
  });

  return (
    <div
      ref={setNodeRef}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectVersion(isSelected ? 'ALL' : 'NONE');
        }
      }}
      onClick={() => onSelectVersion(isSelected ? 'ALL' : 'NONE')}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer border ${
        isOver
          ? 'border-[var(--md-sys-color-primary)] ring-2 ring-[var(--md-sys-color-primary)]/50 bg-[var(--md-sys-color-primary-container)]/25 shadow-xs'
          : isSelected
            ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] ring-1 ring-[var(--md-sys-color-primary)]'
            : 'border-transparent text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)]'
      }`}
    >
      <span>Issues without Version</span>
      <span className="text-[10px] font-mono">{count}</span>
    </div>
  );
};

const AgileBacklogLeftDrawerComponent: React.FC<AgileBacklogLeftDrawerProps> = ({
  projectId,
  issues,
  activeDrawerTab,
  onDrawerTabChange,
  selectedEpicId = 'ALL',
  onSelectEpic,
  selectedVersionId = 'ALL',
  onSelectVersion,
  onClose,
  onCreateEpic,
}) => {
  const { data: versions = [] } = useProjectVersionsQuery(projectId);

  // Extract all Epics in project (memoized to avoid re-filtering every render)
  const epics = useMemo(() => issues.filter((i) => i.issueType === 'EPIC'), [issues]);

  const issuesByEpicId = useMemo(() => {
    const map = new Map<number, IssueItem[]>();
    for (const i of issues) {
      const targetId = i.epicId || (i.parentId && i.issueType !== 'EPIC' ? i.parentId : null);
      if (targetId) {
        const list = map.get(targetId);
        if (list) {
          list.push(i);
        } else {
          map.set(targetId, [i]);
        }
      }
    }
    return map;
  }, [issues]);

  const issuesByVersionId = useMemo(() => {
    const map = new Map<number, IssueItem[]>();
    for (const i of issues) {
      if (i.fixVersionId) {
        const list = map.get(i.fixVersionId);
        if (list) {
          list.push(i);
        } else {
          map.set(i.fixVersionId, [i]);
        }
      }
    }
    return map;
  }, [issues]);

  const noVersionCount = useMemo(() => issues.filter((i) => !i.fixVersionId).length, [issues]);

  return (
    <aside
      aria-label="Backlog Epics and Releases Drawer"
      className="w-full md:w-80 shrink-0 bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/30 rounded-3xl p-4 flex flex-col space-y-4 shadow-xs"
    >
      {/* Drawer Header with Tabs & Close */}
      <div className="flex items-center justify-between gap-2 border-b border-[var(--md-sys-color-outline-variant)]/20 pb-3">
        <Tabs
          value={activeDrawerTab}
          onValueChange={(v) => onDrawerTabChange(v as BacklogDrawerTab)}
          className="w-full"
        >
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="epics" className="flex items-center gap-1.5 text-xs">
              <Layers className="w-3.5 h-3.5" />
              <span>Epics ({epics.length})</span>
            </TabsTrigger>
            <TabsTrigger value="versions" className="flex items-center gap-1.5 text-xs">
              <Milestone className="w-3.5 h-3.5" />
              <span>Versions ({versions.length})</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer shrink-0"
          aria-label="Collapse side panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-1 space-y-3">
        {activeDrawerTab === 'epics' ? (
          /* ================= Epics Panel ================= */
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                Epics
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCreateEpic}
                className="h-6 px-2 text-[11px] gap-1 text-[var(--md-sys-color-primary)]"
              >
                <Plus className="w-3 h-3" />
                <span>Create Epic</span>
              </Button>
            </div>

            {/* All Epics Filter Reset */}
            <button
              type="button"
              onClick={() => onSelectEpic(selectedEpicId === 'ALL' ? 'ALL' : 'ALL')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                selectedEpicId === 'ALL'
                  ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] ring-1 ring-[var(--md-sys-color-primary)]'
                  : 'text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)]'
              }`}
            >
              <span className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                <span>All Issues</span>
              </span>
              <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-mono">
                {issues.length}
              </span>
            </button>

            {/* Issues Without Epic Droppable Target & Filter */}
            <NoEpicDroppableItem
              count={issues.filter((i) => !i.epicId && !i.parentId && i.issueType !== 'EPIC').length}
              isSelected={selectedEpicId === 'NONE'}
              onSelectEpic={onSelectEpic}
            />

            <div className="h-px bg-[var(--md-sys-color-outline-variant)]/20 my-1" />

            {/* List of Epics */}
            {epics.length === 0 ? (
              <div className="text-center py-8 px-4 text-xs text-[var(--md-sys-color-on-surface-variant)] space-y-2">
                <p>No epics defined yet.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCreateEpic}
                  className="gap-1.5 text-xs mx-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create First Epic</span>
                </Button>
              </div>
            ) : (
              epics.map((epic) => {
                const childIssues = issuesByEpicId.get(epic.id) || [];
                const completedChildCount = childIssues.filter(
                  (i) => i.status === 'RESOLVED' || i.status === 'CLOSED',
                ).length;
                const progressPercent =
                  childIssues.length > 0
                    ? Math.round((completedChildCount / childIssues.length) * 100)
                    : 0;
                const isSelected = selectedEpicId === epic.id;

                return (
                  <EpicDroppableItem
                    key={epic.id}
                    epic={epic}
                    childIssues={childIssues}
                    completedChildCount={completedChildCount}
                    progressPercent={progressPercent}
                    isSelected={isSelected}
                    onSelectEpic={onSelectEpic}
                  />
                );
              })
            )}
          </div>
        ) : (
          /* ================= Versions / Releases Panel ================= */
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                Releases & Versions
              </span>
            </div>

            {/* All Versions Filter Reset */}
            <button
              type="button"
              onClick={() => onSelectVersion(selectedVersionId === 'ALL' ? 'ALL' : 'ALL')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                selectedVersionId === 'ALL'
                  ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] ring-1 ring-[var(--md-sys-color-primary)]'
                  : 'text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)]'
              }`}
            >
              <span className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                <span>All Versions</span>
              </span>
              <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-mono">
                {issues.length}
              </span>
            </button>

            {/* Issues Without Version Droppable Target & Filter */}
            <NoVersionDroppableItem
              count={noVersionCount}
              isSelected={selectedVersionId === 'NONE'}
              onSelectVersion={onSelectVersion}
            />

            <div className="h-px bg-[var(--md-sys-color-outline-variant)]/20 my-1" />

            {/* List of Project Versions */}
            {versions.length === 0 ? (
              <div className="text-center py-8 px-4 text-xs text-[var(--md-sys-color-on-surface-variant)] space-y-2">
                <p>No release versions configured for this project.</p>
              </div>
            ) : (
              versions.map((ver) => {
                const verIssues = issuesByVersionId.get(ver.id) || [];
                const completedCount = verIssues.filter(
                  (i) => i.status === 'RESOLVED' || i.status === 'CLOSED',
                ).length;
                const progressPercent =
                  verIssues.length > 0 ? Math.round((completedCount / verIssues.length) * 100) : 0;
                const isSelected = selectedVersionId === ver.id;

                return (
                  <VersionDroppableItem
                    key={ver.id}
                    ver={ver}
                    verIssues={verIssues}
                    completedCount={completedCount}
                    progressPercent={progressPercent}
                    isSelected={isSelected}
                    onSelectVersion={onSelectVersion}
                  />
                );
              })
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

export const AgileBacklogLeftDrawer = React.memo(AgileBacklogLeftDrawerComponent);
