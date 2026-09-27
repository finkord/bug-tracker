import React from 'react';
import { Modal, Button } from '../ui';
import type { KanbanSettings, BoardViewMode, CardDensity, UnassignedPosition } from '../../types/kanban';
import { DEFAULT_KANBAN_SETTINGS } from '../../types/kanban';
import { Columns3, Users2, LayoutList, AlignLeft, SlidersHorizontal, RotateCcw } from 'lucide-react';

interface KanbanBoardSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: KanbanSettings;
  onUpdateSettings: (newSettings: KanbanSettings) => void;
}

export const KanbanBoardSettingsModal: React.FC<KanbanBoardSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const handleViewModeChange = (mode: BoardViewMode) => {
    onUpdateSettings({ ...settings, viewMode: mode });
  };

  const handleDensityChange = (density: CardDensity) => {
    onUpdateSettings({ ...settings, cardDensity: density });
  };

  const handleUnassignedPosChange = (pos: UnassignedPosition) => {
    onUpdateSettings({ ...settings, unassignedPosition: pos });
  };

  const handleWipLimitChange = (status: 'IN_PROGRESS' | 'REVIEW', val: string) => {
    const num = parseInt(val, 10);
    const newLimits = { ...settings.wipLimits };
    if (isNaN(num) || num <= 0) {
      delete newLimits[status];
    } else {
      newLimits[status] = num;
    }
    onUpdateSettings({ ...settings, wipLimits: newLimits });
  };

  const handleReset = () => {
    onUpdateSettings(DEFAULT_KANBAN_SETTINGS);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Kanban Board Settings" size="md">
      <div className="space-y-6 text-[var(--md-sys-color-on-surface)]">
        {/* 1. Grouping & Layout Mode */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] mb-2">
            Board Layout & Grouping (Swimlanes)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleViewModeChange('flat')}
              className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                settings.viewMode === 'flat'
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
                  All workers tickets presented together in standard status columns.
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleViewModeChange('swimlanes')}
              className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                settings.viewMode === 'swimlanes'
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
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    settings.unassignedPosition === 'top'
                      ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
                      : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                  }`}
                >
                  Top of Board
                </button>
                <button
                  type="button"
                  onClick={() => handleUnassignedPosChange('bottom')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    settings.unassignedPosition === 'bottom'
                      ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
                      : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                  }`}
                >
                  Bottom of Board
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. Column Limits (WIP Limits) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] mb-2">
            Work In Progress (WIP) Limits
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] flex items-center justify-between">
              <div>
                <div className="text-xs font-bold">In Progress Limit</div>
                <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
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

            <div className="p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] flex items-center justify-between">
              <div>
                <div className="text-xs font-bold">Code Review Limit</div>
                <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
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
      </div>
    </Modal>
  );
};
