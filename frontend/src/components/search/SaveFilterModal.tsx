import React, { useState } from 'react';
import { Modal, Button, Input } from '../ui';
import { Star } from 'lucide-react';

interface SaveFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentJql: string;
  onSave: (filter: { name: string; description: string; jql: string; isFavorite: boolean }) => void;
}

export const SaveFilterModal: React.FC<SaveFilterModalProps> = ({
  isOpen,
  onClose,
  currentJql,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a name for this filter.');
      return;
    }

    onSave({
      name: name.trim(),
      description: description.trim(),
      jql: currentJql,
      isFavorite,
    });

    setName('');
    setDescription('');
    setIsFavorite(false);
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Save Current Filter" size="md">
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
            placeholder="e.g. Critical Frontend Bugs"
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
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]/40 focus:border-[var(--md-sys-color-primary)] transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
            JQL Query Definition
          </label>
          <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/60 font-mono text-xs text-[var(--md-sys-color-primary)] break-all">
            {currentJql || 'All issues (no criteria)'}
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={isFavorite}
            onChange={(e) => setIsFavorite(e.target.checked)}
            className="rounded border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-primary)] focus:ring-[var(--md-sys-color-primary)] cursor-pointer"
          />
          <div className="flex items-center gap-1 text-xs font-medium text-[var(--md-sys-color-on-surface)]">
            <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-[var(--md-sys-color-warning)] text-[var(--md-sys-color-warning)]' : 'text-[var(--md-sys-color-on-surface-variant)]'}`} />
            <span>Add to Starred Filters</span>
          </div>
        </label>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="filled" type="submit">
            Save Filter
          </Button>
        </div>
      </form>
    </Modal>
  );
};
