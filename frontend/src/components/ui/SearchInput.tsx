import React, { useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  shortcutKey?: string;
  enableShortcut?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onClear,
  placeholder = 'Search...',
  shortcutKey = '/',
  enableShortcut = false,
  size = 'md',
  className,
  inputClassName,
  autoFocus = false,
  disabled = false,
  leftIcon,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!enableShortcut || !shortcutKey) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === shortcutKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const activeEl = document.activeElement;
        const activeTag = activeEl?.tagName?.toLowerCase();
        const isInput =
          activeTag === 'input' ||
          activeTag === 'textarea' ||
          activeTag === 'select' ||
          (activeEl as HTMLElement)?.isContentEditable;

        if (!isInput) {
          e.preventDefault();
          inputRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableShortcut, shortcutKey]);

  const handleClear = () => {
    onChange('');
    onClear?.();
    inputRef.current?.focus();
  };

  const sizeClasses = {
    sm: 'h-7 text-xs pl-7 pr-7',
    md: 'h-8 text-xs pl-8 pr-8',
    lg: 'h-10 text-sm pl-9 pr-9',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5 left-2',
    md: 'w-3.5 h-3.5 left-2.5',
    lg: 'w-4 h-4 left-3',
  };

  return (
    <div className={cn('relative flex items-center min-w-0', className)}>
      <div
        className={cn(
          'absolute top-1/2 -translate-y-1/2 text-[var(--md-sys-color-outline)] pointer-events-none flex items-center justify-center',
          iconSizes[size],
        )}
      >
        {leftIcon || <Search className="w-full h-full" />}
      </div>

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className={cn(
          'w-full rounded-xl bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]',
          'border border-[var(--md-sys-color-outline-variant)]/60 placeholder:text-[var(--md-sys-color-outline)]',
          'focus:outline-none focus:ring-1 focus:ring-[var(--md-sys-color-primary)] focus:border-[var(--md-sys-color-primary)]',
          'transition-all duration-150',
          sizeClasses[size],
          disabled && 'opacity-60 cursor-not-allowed',
          inputClassName,
        )}
      />

      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {value.length > 0 ? (
          <button
            type="button"
            onClick={handleClear}
            className="p-0.5 rounded-md hover:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : enableShortcut && shortcutKey ? (
          <kbd className="hidden sm:inline-flex items-center justify-center h-4.5 min-w-4.5 px-1 text-[10px] font-mono font-medium rounded-md bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-outline)] border border-[var(--md-sys-color-outline-variant)]/40 pointer-events-none select-none">
            {shortcutKey}
          </kbd>
        ) : null}
      </div>
    </div>
  );
};
