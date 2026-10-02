import React, { useState, useEffect } from 'react';
import type { SavedFilterPreset } from '../../types/search';
import { Modal, Button, Input } from '../ui';
import { Star, Trash2 } from 'lucide-react';

interface EditFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filter: SavedFilterPreset | null;
  onSave: (updated: {
    id: string;
    name: string;
    description: string;
    jql: string;
    isFavorite: boolean;
  }) => void;
  onDelete?: (filterId: string) => void;
}

export const EditFilterModal: React.FC<EditFilterModalProps> = ({
  isOpen,
  onClose,
  filter,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [jql, setJql] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (filter) {
      setName(filter.name || '');
      setDescription(filter.description || '');
      setJql(filter.jql || '');
      setIsFavorite(!!filter.isFavorite);
      setError('');
    }
  }, [filter]);

  if (!filter) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a name for this filter.');
      return;
    }

    onSave({
      id: filter.id,
      name: name.trim(),
      description: description.trim(),
      jql: jql.trim(),
      isFavorite,
    });

    onClose();
  };

  const handleDelete = () => {
    if (onDelete && window.confirm(`Are you sure you want to delete filter "${filter.name}"?`)) {
      onDelete(filter.id);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Saved Filter" size="md">
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        <div>
          <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1.5">
            Filter Name <span className="text-[var(--md-sys-color-error)]">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
            placeholder="Filter title..."
            autoFocus
          />
          {error && (
            <p className="text-xs text-[var(--md-sys-color-error)] mt-1 font-medium">{error}</p>
          )}
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

        <div>
          <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
            JQL Query Definition
          </label>
          <textarea
            value={jql}
            onChange={(e) => setJql(e.target.value)}
            rows={2}
            placeholder="e.g. project = PROJ AND status = IN_PROGRESS"
            className="w-full px-3.5 py-2 font-mono text-xs rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-primary)] focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)]/40 focus:border-[var(--md-sys-color-primary)] transition"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={isFavorite}
            onChange={(e) => setIsFavorite(e.target.checked)}
            className="rounded border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-primary)] focus:ring-[var(--md-sys-color-primary)] cursor-pointer"
          />
          <div className="flex items-center gap-1 text-xs font-medium text-[var(--md-sys-color-on-surface)]">
            <Star
              className={`w-3.5 h-3.5 ${
                isFavorite
                  ? 'fill-[var(--md-sys-color-warning)] text-[var(--md-sys-color-warning)]'
                  : 'text-[var(--md-sys-color-on-surface-variant)]'
              }`}
            />
            <span>Starred / Quick-Access Filter</span>
          </div>
        </label>

        <div className="flex items-center justify-between pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
          <div>
            {onDelete && (
              <Button
                variant="danger-tonal"
                size="sm"
                type="button"
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                onClick={handleDelete}
              >
                Delete
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="filled" type="submit">
              Save Changes
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
