import React, { useState, useEffect, useRef } from 'react';
import { Bookmark, X } from 'lucide-react';

interface SaveFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (filterName: string) => Promise<void> | void;
  defaultFilterName: string;
}

export const SaveFilterModal: React.FC<SaveFilterModalProps> = ({
  isOpen,
  onClose,
  onSave,
  defaultFilterName,
}) => {
  const [filterName, setFilterName] = useState(defaultFilterName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFilterName(defaultFilterName);
      setIsSubmitting(false);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, defaultFilterName]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filterName.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSave(filterName.trim());
      onClose();
    } catch {
      // Handled by caller
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-filter-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="relative w-full max-w-md bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-[28px] p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center shrink-0">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h3 id="save-filter-dialog-title" className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                Save Custom Filter
              </h3>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                Save current search and filter settings for quick access
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="filter-name-input"
              className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]"
            >
              Filter Name
            </label>
            <input
              id="filter-name-input"
              ref={inputRef}
              type="text"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              placeholder="e.g., Critical Frontend Bugs"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] focus:outline-none focus:border-[var(--md-sys-color-primary)] focus:ring-2 focus:ring-[var(--md-sys-color-primary)]/20 text-xs font-medium transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!filterName.trim() || isSubmitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-semibold text-xs shadow-xs hover:opacity-90 active:scale-98 transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Save Filter</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
