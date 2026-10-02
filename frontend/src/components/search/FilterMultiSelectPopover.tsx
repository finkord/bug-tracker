import React, { useState, useMemo } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Check, ChevronDown, Search, X } from 'lucide-react';

export interface FilterMultiSelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  colorDot?: string;
}

interface FilterMultiSelectPopoverProps {
  label: string;
  icon?: React.ReactNode;
  options: FilterMultiSelectOption[];
  selectedValues: string[];
  onSelectionChange: (selected: string[]) => void;
  placeholder?: string;
}

export const FilterMultiSelectPopover: React.FC<FilterMultiSelectPopoverProps> = ({
  label,
  icon,
  options,
  selectedValues,
  onSelectionChange,
  placeholder = 'Search options...',
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [options, searchQuery]);

  const handleToggle = (val: string) => {
    if (selectedValues.includes(val)) {
      onSelectionChange(selectedValues.filter((v) => v !== val));
    } else {
      onSelectionChange([...selectedValues, val]);
    }
  };

  const handleSelectAll = () => {
    onSelectionChange(options.map((o) => o.value));
  };

  const handleClear = () => {
    onSelectionChange([]);
  };

  const isAllSelected = options.length > 0 && selectedValues.length === options.length;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
            selectedValues.length > 0
              ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border-[var(--md-sys-color-primary)] ring-1 ring-[var(--md-sys-color-primary)]/40 shadow-xs'
              : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border-[var(--md-sys-color-outline-variant)]/60 hover:bg-[var(--md-sys-color-surface-container-high)]'
          }`}
          aria-label={`${label} filter, ${selectedValues.length} selected`}
        >
          {icon && <span className="shrink-0">{icon}</span>}
          <span>{label}</span>
          {selectedValues.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]">
              {selectedValues.length}
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className="z-50 w-64 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] shadow-lg p-2.5 space-y-2 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 text-[var(--md-sys-color-on-surface)]"
        >
          {/* Header search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-8 pr-7 py-1 text-xs rounded-xl bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)]/60 border border-[var(--md-sys-color-outline-variant)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--md-sys-color-primary)]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-on-surface)]"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Quick Actions (Select All / Clear) */}
          <div className="flex items-center justify-between px-1 text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)] border-b border-[var(--md-sys-color-outline-variant)]/40 pb-1.5">
            <button
              type="button"
              onClick={handleSelectAll}
              disabled={isAllSelected}
              className="hover:text-[var(--md-sys-color-primary)] cursor-pointer disabled:opacity-40 disabled:hover:text-inherit"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={selectedValues.length === 0}
              className="hover:text-[var(--md-sys-color-error)] cursor-pointer disabled:opacity-40 disabled:hover:text-inherit"
            >
              Clear
            </button>
          </div>

          {/* Options list */}
          <div className="max-h-56 overflow-y-auto space-y-0.5 pr-0.5">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-[var(--md-sys-color-on-surface-variant)] opacity-70">
                No matching options found
              </div>
            ) : (
              filteredOptions.map((option) => {
                const checked = selectedValues.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleToggle(option.value)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                      checked
                        ? 'bg-[var(--md-sys-color-primary-container)]/50 text-[var(--md-sys-color-on-surface)] font-semibold'
                        : 'hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                          checked
                            ? 'bg-[var(--md-sys-color-primary)] border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
                            : 'border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container-low)]'
                        }`}
                      >
                        {checked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>

                      {option.icon && <span className="shrink-0">{option.icon}</span>}
                      {option.colorDot && (
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: option.colorDot }}
                        />
                      )}
                      <span className="truncate">{option.label}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};
