import React, { useState } from 'react';
import type { IssueItem } from '../../api/client';
import { useProjectVersionsQuery, useUpdateIssueMutation } from '../../api/queries';
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

export const AgileBacklogLeftDrawer: React.FC<AgileBacklogLeftDrawerProps> = ({
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
  const updateIssueMutation = useUpdateIssueMutation();

  const [dragOverEpicId, setDragOverEpicId] = useState<number | null>(null);
  const [dragOverVersionId, setDragOverVersionId] = useState<number | null>(null);

  // Extract all Epics in project
  const epics = issues.filter((i) => i.issueType === 'EPIC');

  const handleEpicDrop = async (e: React.DragEvent, epicId: number) => {
    e.preventDefault();
    setDragOverEpicId(null);
    const issueIdStr = e.dataTransfer.getData('text/plain');
    if (!issueIdStr) return;
    const issueId = Number(issueIdStr);
    if (!Number.isNaN(issueId) && issueId !== epicId) {
      await updateIssueMutation.mutateAsync({
        id: issueId,
        data: { parentId: epicId },
      });
    }
  };

  const handleVersionDrop = async (e: React.DragEvent, versionId: number) => {
    e.preventDefault();
    setDragOverVersionId(null);
    const issueIdStr = e.dataTransfer.getData('text/plain');
    if (!issueIdStr) return;
    const issueId = Number(issueIdStr);
    if (!Number.isNaN(issueId)) {
      await updateIssueMutation.mutateAsync({
        id: issueId,
        data: { fixVersionId: versionId },
      });
    }
  };

  return (
    <aside
      aria-label="Backlog Epics and Releases Panel"
      className="w-full md:w-72 lg:w-80 shrink-0 flex flex-col bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/40 rounded-3xl overflow-hidden shadow-2xs transition-all duration-200"
    >
      {/* Drawer Header Tabs & Close Action */}
      <div className="p-3 border-b border-[var(--md-sys-color-outline-variant)]/30 flex items-center justify-between gap-2 bg-[var(--md-sys-color-surface-container)]">
        <Tabs
          value={activeDrawerTab}
          onValueChange={(val) => onDrawerTabChange(val as BacklogDrawerTab)}
        >
          <TabsList variant="pills" className="rounded-full">
            <TabsTrigger
              value="epics"
              variant="pills"
              size="sm"
              className="rounded-full gap-1.5 font-semibold text-xs"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Epics ({epics.length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="versions"
              variant="pills"
              size="sm"
              className="rounded-full gap-1.5 font-semibold text-xs"
            >
              <Milestone className="w-3.5 h-3.5" />
              <span>Versions ({versions.length})</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)] hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
          aria-label="Collapse side panel"
          title="Collapse side panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {activeDrawerTab === 'epics' ? (
          /* ================= Epics Panel ================= */
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                Project Epics
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCreateEpic}
                className="h-6 text-[11px] px-2 gap-1 text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary-container)]/20"
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
                <span>All Epics</span>
              </span>
              <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-mono">
                {issues.length}
              </span>
            </button>

            {/* Issues Without Epic Filter */}
            <button
              type="button"
              onClick={() => onSelectEpic(selectedEpicId === 'NONE' ? 'ALL' : 'NONE')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                selectedEpicId === 'NONE'
                  ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] ring-1 ring-[var(--md-sys-color-primary)]'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)]'
              }`}
            >
              <span>Issues without Epic</span>
              <span className="text-[10px] font-mono">
                {issues.filter((i) => !i.parentId && i.issueType !== 'EPIC').length}
              </span>
            </button>

            <div className="h-px bg-[var(--md-sys-color-outline-variant)]/20 my-1" />

            {/* List of Epics */}
            {epics.length === 0 ? (
              <div className="text-center py-8 px-4 text-xs text-[var(--md-sys-color-on-surface-variant)] space-y-2">
                <p>No epics created yet for this project.</p>
                <Button variant="outline" size="sm" onClick={onCreateEpic} className="text-xs">
                  Create First Epic
                </Button>
              </div>
            ) : (
              epics.map((epic) => {
                const childIssues = issues.filter((i) => i.parentId === epic.id);
                const completedChildCount = childIssues.filter(
                  (i) => i.status === 'RESOLVED' || i.status === 'CLOSED',
                ).length;
                const progressPercent =
                  childIssues.length > 0
                    ? Math.round((completedChildCount / childIssues.length) * 100)
                    : 0;
                const isSelected = selectedEpicId === epic.id;
                const isDragTarget = dragOverEpicId === epic.id;

                return (
                  <div
                    key={epic.id}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectEpic(isSelected ? 'ALL' : epic.id);
                      }
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverEpicId(epic.id);
                    }}
                    onDragLeave={() => setDragOverEpicId(null)}
                    onDrop={(e) => handleEpicDrop(e, epic.id)}
                    onClick={() => onSelectEpic(isSelected ? 'ALL' : epic.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                      isDragTarget
                        ? 'border-[var(--md-sys-color-primary)] ring-2 ring-[var(--md-sys-color-primary)]/50 bg-[var(--md-sys-color-primary-container)]/20'
                        : isSelected
                          ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/15 shadow-xs'
                          : 'border-[var(--md-sys-color-outline-variant)]/30 hover:border-[var(--md-sys-color-outline-variant)]/70 bg-[var(--md-sys-color-surface-container)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-[10px] font-bold text-[var(--md-sys-color-primary)]">
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
                        className="h-full bg-[var(--md-sys-color-primary)] rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
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

            {/* Issues Without Version Filter */}
            <button
              type="button"
              onClick={() => onSelectVersion(selectedVersionId === 'NONE' ? 'ALL' : 'NONE')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                selectedVersionId === 'NONE'
                  ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] ring-1 ring-[var(--md-sys-color-primary)]'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)]'
              }`}
            >
              <span>Issues without Version</span>
              <span className="text-[10px] font-mono">
                {issues.filter((i) => !i.fixVersionId).length}
              </span>
            </button>

            <div className="h-px bg-[var(--md-sys-color-outline-variant)]/20 my-1" />

            {/* List of Project Versions */}
            {versions.length === 0 ? (
              <div className="text-center py-8 px-4 text-xs text-[var(--md-sys-color-on-surface-variant)] space-y-2">
                <p>No release versions configured for this project.</p>
              </div>
            ) : (
              versions.map((ver) => {
                const verIssues = issues.filter((i) => i.fixVersionId === ver.id);
                const completedCount = verIssues.filter(
                  (i) => i.status === 'RESOLVED' || i.status === 'CLOSED',
                ).length;
                const progressPercent =
                  verIssues.length > 0 ? Math.round((completedCount / verIssues.length) * 100) : 0;
                const isSelected = selectedVersionId === ver.id;
                const isDragTarget = dragOverVersionId === ver.id;

                return (
                  <div
                    key={ver.id}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectVersion(isSelected ? 'ALL' : ver.id);
                      }
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverVersionId(ver.id);
                    }}
                    onDragLeave={() => setDragOverVersionId(null)}
                    onDrop={(e) => handleVersionDrop(e, ver.id)}
                    onClick={() => onSelectVersion(isSelected ? 'ALL' : ver.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                      isDragTarget
                        ? 'border-[var(--md-sys-color-primary)] ring-2 ring-[var(--md-sys-color-primary)]/50 bg-[var(--md-sys-color-primary-container)]/20'
                        : isSelected
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
                        className="text-[9px]"
                      >
                        {ver.status}
                      </Badge>
                    </div>

                    {ver.releaseDate && (
                      <div className="flex items-center gap-1 text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-mono">
                        <Calendar className="w-3 h-3 text-[var(--md-sys-color-primary)]" />
                        <span>{ver.releaseDate}</span>
                      </div>
                    )}

                    {/* Progress Bar */}
                    <div className="space-y-1 pt-0.5">
                      <div className="flex items-center justify-between text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-mono">
                        <span>{verIssues.length} tickets</span>
                        <span>{progressPercent}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-[var(--md-sys-color-surface-container-highest)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--md-sys-color-primary)] rounded-full transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
