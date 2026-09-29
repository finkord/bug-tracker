import React, { useState } from 'react';
import type { SavedFilterPreset } from '../../types/search';
import { SYSTEM_FILTER_PRESETS } from '../../types/search';
import { Modal, Button, Badge, Tabs, TabsList, TabsTrigger } from '../ui';
import { Star, Trash2, ArrowRight, Bookmark } from 'lucide-react';

interface ManageFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedFilters: SavedFilterPreset[];
  onApplyFilter: (jql: string) => void;
  onToggleFavorite: (filterId: string) => void;
  onDeleteFilter: (filterId: string) => void;
}

export const ManageFiltersModal: React.FC<ManageFiltersModalProps> = ({
  isOpen,
  onClose,
  savedFilters,
  onApplyFilter,
  onToggleFavorite,
  onDeleteFilter,
}) => {
  const [activeTab, setActiveTab] = useState<'custom' | 'system'>('custom');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Filters" size="lg">
      <div className="space-y-4 pt-1">
        <Tabs
          value={activeTab}
          onValueChange={(tab) => setActiveTab(tab as 'custom' | 'system')}
        >
          <TabsList variant="pills">
            <TabsTrigger value="custom" size="sm">
              Custom Filters ({savedFilters.length})
            </TabsTrigger>
            <TabsTrigger value="system" size="sm">
              System Presets ({SYSTEM_FILTER_PRESETS.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab === 'custom' && (
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {savedFilters.length === 0 ? (
              <div className="p-8 text-center bg-[var(--md-sys-color-surface-container-low)] rounded-xl border border-[var(--md-sys-color-outline-variant)]">
                <Bookmark className="w-8 h-8 text-[var(--md-sys-color-on-surface-variant)] mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">
                  No custom saved filters
                </p>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">
                  You can save your current search query as a reusable filter using the "Save Filter" button on the search page.
                </p>
              </div>
            ) : (
              savedFilters.map((filter) => (
                <div
                  key={filter.id}
                  className="p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[var(--md-sys-color-outline)] transition"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onToggleFavorite(filter.id)}
                        className="p-0.5 rounded text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-warning)] transition cursor-pointer"
                        title={filter.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Star
                          className={`w-4 h-4 ${
                            filter.isFavorite
                              ? 'fill-[var(--md-sys-color-warning)] text-[var(--md-sys-color-warning)]'
                              : 'text-[var(--md-sys-color-on-surface-variant)]/60'
                          }`}
                        />
                      </button>
                      <h4 className="text-sm font-semibold text-[var(--md-sys-color-on-surface)] truncate">
                        {filter.name}
                      </h4>
                    </div>

                    {filter.description && (
                      <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] line-clamp-1 pl-6">
                        {filter.description}
                      </p>
                    )}

                    <div className="pl-6 font-mono text-[11px] text-[var(--md-sys-color-primary)] truncate max-w-md">
                      {filter.jql}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-6 sm:pl-0 shrink-0">
                    <button
                      type="button"
                      onClick={() => onDeleteFilter(filter.id)}
                      className="p-1.5 rounded-lg text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)]/30 transition cursor-pointer"
                      title="Delete filter"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onApplyFilter(filter.jql);
                        onClose();
                      }}
                      className="gap-1 text-xs"
                    >
                      <span>Apply</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {SYSTEM_FILTER_PRESETS.map((preset) => (
              <div
                key={preset.id}
                className="p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="neutral" className="text-[10px] uppercase font-semibold tracking-wider">
                      System
                    </Badge>
                    <h4 className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
                      {preset.name}
                    </h4>
                  </div>
                  <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                    {preset.description}
                  </p>
                  <div className="font-mono text-[11px] text-[var(--md-sys-color-primary)] truncate max-w-md">
                    {preset.jql}
                  </div>
                </div>

                <div className="shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onApplyFilter(preset.jql);
                      onClose();
                    }}
                    className="gap-1 text-xs"
                  >
                    <span>Apply</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-[var(--md-sys-color-outline-variant)]">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
