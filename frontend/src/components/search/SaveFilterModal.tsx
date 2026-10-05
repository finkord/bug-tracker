import React, { useState, useEffect } from 'react';
import { FormModal, Input } from '../ui';
import { Star } from 'lucide-react';

export interface SavedFilterPayload {
  name: string;
  description: string;
  jql: string;
  isFavorite: boolean;
}

export interface SaveFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentJql?: string;
  defaultFilterName?: string;
  onSave: (filter: SavedFilterPayload) => Promise<void> | void;
}

export const SaveFilterModal: React.FC<SaveFilterModalProps> = ({
  isOpen,
  onClose,
  currentJql,
  defaultFilterName = '',
  onSave,
}) => {
  const [name, setName] = useState(defaultFilterName);
  const [description, setDescription] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(defaultFilterName);
      setDescription('');
      setIsFavorite(false);
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, defaultFilterName]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Please provide a name for this filter.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave({
        name: name.trim(),
        description: description.trim(),
        jql: currentJql || '',
        isFavorite,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save filter');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Save Custom Filter"
      description="Save current search criteria and filters for fast workspace access."
      size="md"
      onSubmit={handleSubmit}
      error={error}
      isSubmitting={isSubmitting}
      submitLabel="Save Filter"
      submittingLabel="Saving..."
    >
      <div>
        <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1.5">
          Filter Name <span className="text-[var(--md-sys-color-error)]">*</span>
        </label>
        <Input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(null);
          }}
          placeholder="e.g. Critical Frontend Bugs"
          autoFocus
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1.5">
          Description <span className="text-[var(--md-sys-color-on-surface-variant)] text-[10px]">(Optional)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Explain the purpose of this filter..."
          className="w-full px-3.5 py-2 text-sm rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)]/40 focus:border-[var(--md-sys-color-primary)] transition"
        />
      </div>

      {currentJql !== undefined && (
        <div>
          <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
            JQL Query Definition
          </label>
          <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/60 font-mono text-xs text-[var(--md-sys-color-primary)] break-all">
            {currentJql || 'All issues (no criteria)'}
          </div>
        </div>
      )}

      <label className="flex items-center gap-2 cursor-pointer pt-1">
        <input
          type="checkbox"
          checked={isFavorite}
          onChange={(e) => setIsFavorite(e.target.checked)}
          className="rounded border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-primary)] focus:ring-[var(--md-sys-color-primary)] cursor-pointer"
        />
        <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--md-sys-color-on-surface)]">
          <Star
            className={`w-3.5 h-3.5 ${
              isFavorite
                ? 'fill-[var(--md-sys-color-warning)] text-[var(--md-sys-color-warning)]'
                : 'text-[var(--md-sys-color-on-surface-variant)]'
            }`}
          />
          <span>Add to Starred Filters</span>
        </div>
      </label>
    </FormModal>
  );
};
