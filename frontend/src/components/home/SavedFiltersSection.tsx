import React, { useState } from 'react';
import type { SavedFilterItem } from '../../api/client';
import { Button } from '../ui';
import { Filter, PlusCircle, Trash2 } from 'lucide-react';

interface SavedFiltersSectionProps {
  filters: SavedFilterItem[];
  onApplyFilter: (criteriaStr: string) => void;
  onDeleteFilter: (filterId: number) => void;
  onCreateFilter: (name: string) => Promise<void>;
}

export const SavedFiltersSection: React.FC<SavedFiltersSectionProps> = ({
  filters,
  onApplyFilter,
  onDeleteFilter,
  onCreateFilter,
}) => {
  const [newFilterName, setNewFilterName] = useState('');
  const [showNewFilterInput, setShowNewFilterInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFilterName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onCreateFilter(newFilterName.trim());
      setNewFilterName('');
      setShowNewFilterInput(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--md-sys-color-surface-container-high)]">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
          <h3 className="font-bold text-xs text-[var(--md-sys-color-on-surface)]">
            My Saved Filters ({filters.length})
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setShowNewFilterInput(!showNewFilterInput)}
          className="p-1 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] transition-colors cursor-pointer"
          title="Create saved filter"
        >
          <PlusCircle className="w-4 h-4" />
        </button>
      </div>

      <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
        One-click queries for the Kanban board and advanced search.
      </p>

      {/* Quick create filter form */}
      {showNewFilterInput && (
        <form
          onSubmit={handleSubmit}
          className="flex gap-2 p-1.5 rounded-full bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40"
        >
          <input
            type="text"
            required
            placeholder="Filter name (e.g. Critical)"
            value={newFilterName}
            onChange={(e) => setNewFilterName(e.target.value)}
            className="flex-1 text-xs px-3 py-1 bg-transparent text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
          />
          <Button type="submit" variant="filled" size="xs" isLoading={isSubmitting}>
            Save
          </Button>
        </form>
      )}

      {/* Saved Filters List */}
      {filters.length === 0 ? (
        <div className="p-6 rounded-2xl bg-[var(--md-sys-color-surface-container)] text-center text-xs text-[var(--md-sys-color-on-surface-variant)] italic">
          No saved search filters yet.
        </div>
      ) : (
        <div className="space-y-1.5">
          {filters.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]/30 hover:bg-[var(--md-sys-color-surface-container-high)] dark:hover:bg-[var(--md-sys-color-surface-container-highest)] transition-colors"
            >
              <button
                type="button"
                onClick={() => onApplyFilter(f.criteria)}
                className="text-left text-xs font-semibold text-[var(--md-sys-color-on-surface)] hover:text-[var(--md-sys-color-primary)] transition-colors truncate flex-1 flex items-center gap-1.5 cursor-pointer"
              >
                <Filter className="w-3 h-3 text-[var(--md-sys-color-primary)] shrink-0" />
                <span className="truncate">{f.name}</span>
              </button>

              <button
                type="button"
                onClick={() => onDeleteFilter(f.id)}
                className="p-1 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-error)] transition-colors cursor-pointer"
                title="Delete filter"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
