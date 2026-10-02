import React, { useState } from 'react';
import { Modal, Button, Tabs, TabsList, TabsTrigger } from '../ui';
import type { KanbanSettings, SwimlaneType, CardDensity, UnassignedPosition } from '../../types/kanban';
import { DEFAULT_KANBAN_SETTINGS } from '../../types/kanban';
import {
  Columns3,
  Users2,
  Layers,
  Flame,
  LayoutList,
  AlignLeft,
  SlidersHorizontal,
  RotateCcw,
  Plus,
  Trash2,
  Filter,
} from 'lucide-react';
import {
  useProjectQuickFiltersQuery,
  useCreateQuickFilterMutation,
  useDeleteQuickFilterMutation,
  useUpdateProjectMutation,
} from '../../api/queries';

interface KanbanBoardSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: KanbanSettings;
  onUpdateSettings: (newSettings: KanbanSettings) => void;
  projectId?: number;
  initialTab?: 'layout' | 'quickFilters';
}

export const KanbanBoardSettingsModal: React.FC<KanbanBoardSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  projectId,
  initialTab = 'layout',
}) => {
  const [activeTab, setActiveTab] = useState<'layout' | 'quickFilters'>(initialTab);

  // Quick filter form state
  const [newFilterName, setNewFilterName] = useState('');
  const [newFilterJql, setNewFilterJql] = useState('');
  const [filterError, setFilterError] = useState<string | null>(null);

  const { data: quickFilters = [] } = useProjectQuickFiltersQuery(projectId);
  const createFilterMutation = useCreateQuickFilterMutation();
  const deleteFilterMutation = useDeleteQuickFilterMutation();
  const updateProjectMutation = useUpdateProjectMutation();

  const handleAddQuickFilter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !newFilterName.trim() || !newFilterJql.trim()) return;

    setFilterError(null);
    try {
      await createFilterMutation.mutateAsync({
        projectId,
        data: {
          name: newFilterName.trim(),
          jqlQuery: newFilterJql.trim(),
        },
      });
      setNewFilterName('');
      setNewFilterJql('');
    } catch (err: unknown) {
      setFilterError(err instanceof Error ? err.message : 'Invalid JQL query syntax');
    }
  };

  const handleDeleteQuickFilter = async (filterId: number, filterName: string) => {
    if (!projectId) return;
    if (!window.confirm(`Delete quick filter "${filterName}"?`)) return;

    try {
      await deleteFilterMutation.mutateAsync({ projectId, filterId });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete filter');
    }
  };

  const handleSwimlaneTypeChange = (type: SwimlaneType) => {
    onUpdateSettings({
      ...settings,
      swimlaneType: type,
      viewMode: type === 'none' ? 'flat' : 'swimlanes',
    });
  };

  const handleDensityChange = (density: CardDensity) => {
    onUpdateSettings({ ...settings, cardDensity: density });
  };

  const handleUnassignedPosChange = (pos: UnassignedPosition) => {
    onUpdateSettings({ ...settings, unassignedPosition: pos });
  };

  const handleWipLimitChange = async (status: 'IN_PROGRESS' | 'REVIEW', val: string) => {
    const num = parseInt(val, 10);
    const newLimits = { ...settings.wipLimits };
    if (isNaN(num) || num <= 0) {
      delete newLimits[status];
    } else {
      newLimits[status] = num;
    }
    onUpdateSettings({ ...settings, wipLimits: newLimits });

    if (projectId) {
      try {
        await updateProjectMutation.mutateAsync({
          id: projectId,
          data: { wipLimits: newLimits as Record<string, number> },
        });
      } catch {
        // Silently handled or logged
      }
    }
  };

  const handleReset = () => {
    onUpdateSettings(DEFAULT_KANBAN_SETTINGS);
  };

  const currentSwimlaneType: SwimlaneType =
    settings.swimlaneType || (settings.viewMode === 'swimlanes' ? 'assignee' : 'none');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Kanban Board Settings" size="md">
      <div className="space-y-5 text-[var(--md-sys-color-on-surface)]">
        {projectId && (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'layout' | 'quickFilters')}>
            <TabsList className="w-full grid grid-cols-2 p-1 rounded-xl bg-[var(--md-sys-color-surface-container-high)]">
              <TabsTrigger value="layout" className="text-xs font-semibold py-1.5 flex items-center justify-center gap-1.5">
                <Columns3 className="w-3.5 h-3.5" />
                <span>Layout & WIP</span>
              </TabsTrigger>
              <TabsTrigger value="quickFilters" className="text-xs font-semibold py-1.5 flex items-center justify-center gap-1.5">
                <Filter className="w-3.5 h-3.5" />
                <span>Quick Filters ({quickFilters.length})</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {activeTab === 'layout' && (
          <>
            {/* 1. Grouping & Layout Mode */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] mb-2">
                Board Layout & Grouping (Swimlanes)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleSwimlaneTypeChange('none')}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    currentSwimlaneType === 'none'
                      ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border-[var(--md-sys-color-primary)] ring-2 ring-[var(--md-sys-color-primary)]/30'
                      : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-[var(--md-sys-color-surface-container-highest)] shrink-0">
                    <Columns3 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Flat Board</div>
                    <div className="text-[11px] opacity-80 mt-0.5 leading-tight">
                      All tickets presented together in standard status columns.
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSwimlaneTypeChange('assignee')}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    currentSwimlaneType === 'assignee'
                      ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border-[var(--md-sys-color-primary)] ring-2 ring-[var(--md-sys-color-primary)]/30'
                      : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-[var(--md-sys-color-surface-container-highest)] shrink-0">
                    <Users2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Assignee Swimlanes</div>
                    <div className="text-[11px] opacity-80 mt-0.5 leading-tight">
                      Organized by worker with expandable rows and cross-worker drag & drop.
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSwimlaneTypeChange('epic')}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    currentSwimlaneType === 'epic'
                      ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border-[var(--md-sys-color-primary)] ring-2 ring-[var(--md-sys-color-primary)]/30'
                      : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-[var(--md-sys-color-surface-container-highest)] shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">By Epic / Parent</div>
                    <div className="text-[11px] opacity-80 mt-0.5 leading-tight">
                      Group issues under their parent ticket with standalone issues row.
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSwimlaneTypeChange('expedite')}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    currentSwimlaneType === 'expedite'
                      ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border-[var(--md-sys-color-primary)] ring-2 ring-[var(--md-sys-color-primary)]/30'
                      : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-[var(--md-sys-color-surface-container-highest)] shrink-0">
                    <Flame className="w-5 h-5 text-[var(--md-sys-color-error)]" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Expedite (P0)</div>
                    <div className="text-[11px] opacity-80 mt-0.5 leading-tight">
                      Critical P0 blocker issues placed in top fast-track swimlane.
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* 2. Card Detail Density */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] mb-2">
                Card Detail Density
              </label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {[
                  { id: 'comfortable' as CardDensity, label: 'Comfortable', desc: 'Full details & metrics', icon: LayoutList },
                  { id: 'compact' as CardDensity, label: 'Compact', desc: 'Balanced card size', icon: SlidersHorizontal },
                  { id: 'minimal' as CardDensity, label: 'Minimal', desc: 'Dense single-line list', icon: AlignLeft },
                ].map((d) => {
                  const Icon = d.icon;
                  const active = settings.cardDensity === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => handleDensityChange(d.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        active
                          ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border-[var(--md-sys-color-primary)] font-bold'
                          : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                      }`}
                    >
                      <Icon className="w-4 h-4 mb-1" />
                      <span className="text-xs">{d.label}</span>
                      <span className="text-[10px] opacity-75 mt-0.5">{d.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Swimlane Worker Options */}
            {settings.viewMode === 'swimlanes' && (
              <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/50 space-y-3">
                <div className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
                  Assignee Swimlane Options
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                  <span className="text-[var(--md-sys-color-on-surface-variant)]">Unassigned Tickets Position:</span>
                  <div className="inline-flex rounded-xl bg-[var(--md-sys-color-surface-container)] p-1 border border-[var(--md-sys-color-outline-variant)]/50">
                    <button
                      type="button"
                      onClick={() => handleUnassignedPosChange('top')}
                      className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                        settings.unassignedPosition === 'top'
                          ? 'bg-[var(--md-sys-color-surface-container-lowest)] dark:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-primary)] shadow-xs'
                          : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                      }`}
                    >
                      Top
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUnassignedPosChange('bottom')}
                      className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                        settings.unassignedPosition === 'bottom'
                          ? 'bg-[var(--md-sys-color-surface-container-lowest)] dark:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-primary)] shadow-xs'
                          : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                      }`}
                    >
                      Bottom
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Column WIP Limits */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                  Column WIP Limits
                </label>
                <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">0 = unlimited</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40">
                  <div>
                    <div className="text-xs font-bold">In Progress</div>
                    <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                      Highlight column when exceeded
                    </div>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={settings.wipLimits.IN_PROGRESS ?? ''}
                    placeholder="None"
                    onChange={(e) => handleWipLimitChange('IN_PROGRESS', e.target.value)}
                    className="w-16 px-2.5 py-1 text-center font-bold text-xs rounded-xl bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40">
                  <div>
                    <div className="text-xs font-bold">Code Review</div>
                    <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                      Highlight column when exceeded
                    </div>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={settings.wipLimits.REVIEW ?? ''}
                    placeholder="None"
                    onChange={(e) => handleWipLimitChange('REVIEW', e.target.value)}
                    className="w-16 px-2.5 py-1 text-center font-bold text-xs rounded-xl bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Reset Defaults
              </Button>

              <Button variant="filled" size="sm" onClick={onClose}>
                Done
              </Button>
            </div>
          </>
        )}

        {activeTab === 'quickFilters' && (
          <div className="space-y-4">
            <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
              Board Quick Filters are JQL queries accessible as one-click toggles on the board toolbar. Configured by Tech Leads for all team members.
            </div>

            {/* Create Filter Form */}
            <form onSubmit={handleAddQuickFilter} className="p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/50 space-y-3">
              <div className="text-xs font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                <span>Add Custom Quick Filter</span>
              </div>

              {filterError && (
                <div className="text-xs text-[var(--md-sys-color-error)] bg-[var(--md-sys-color-error-container)]/30 p-2 rounded-xl border border-[var(--md-sys-color-error)]/20">
                  {filterError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                    Button Label
                  </label>
                  <input
                    type="text"
                    value={newFilterName}
                    onChange={(e) => setNewFilterName(e.target.value)}
                    placeholder="e.g. Critical Bugs"
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] focus:outline-none focus:ring-1 focus:ring-[var(--md-sys-color-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                    JQL Query Expression
                  </label>
                  <input
                    type="text"
                    value={newFilterJql}
                    onChange={(e) => setNewFilterJql(e.target.value)}
                    placeholder='type = "BUG" AND priority = "CRITICAL"'
                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded-xl bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] focus:outline-none focus:ring-1 focus:ring-[var(--md-sys-color-primary)]"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newFilterName.trim() || !newFilterJql.trim() || createFilterMutation.isPending}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  {createFilterMutation.isPending ? 'Validating...' : 'Add Filter'}
                </Button>
              </div>
            </form>

            {/* List of Existing Quick Filters */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                Active Project Quick Filters ({quickFilters.length})
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-0.5">
                {quickFilters.length === 0 ? (
                  <div className="text-center py-6 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                    No custom quick filters configured yet.
                  </div>
                ) : (
                  quickFilters.map((qf) => (
                    <div
                      key={qf.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40 text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-[var(--md-sys-color-on-surface)]">{qf.name}</div>
                        <div className="font-mono text-[10px] text-[var(--md-sys-color-on-surface-variant)] truncate mt-0.5">
                          {qf.jqlQuery}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteQuickFilter(qf.id, qf.name)}
                        disabled={deleteFilterMutation.isPending}
                        className="p-1.5 rounded-lg text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)]/30 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                        title="Delete quick filter"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[var(--md-sys-color-outline-variant)]">
              <Button variant="filled" size="sm" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
