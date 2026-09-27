import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';

interface WorkspaceGlobalSearchProps {
  isMobileOpen: boolean;
  onMobileToggle: (open: boolean) => void;
}

/**
 * Global search input with '/' keyboard shortcut and mobile search overlay.
 */
export const WorkspaceGlobalSearch: React.FC<WorkspaceGlobalSearchProps> = ({
  isMobileOpen,
  onMobileToggle,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  // Global '/' shortcut to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        e.key === '/' &&
        target.tagName !== 'INPUT' &&
        target.tagName !== 'TEXTAREA' &&
        !target.isContentEditable
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-focus mobile search input when opened
  useEffect(() => {
    if (isMobileOpen) {
      mobileInputRef.current?.focus();
    }
  }, [isMobileOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/search');
    }
    onMobileToggle(false);
  };

  if (isMobileOpen) {
    return (
      <div className="absolute inset-0 z-20 px-2.5 flex items-center bg-[var(--md-sys-color-surface-container-low)] animate-in fade-in duration-150 gap-2">
        <form onSubmit={handleSubmit} className="flex-1 flex items-center relative">
          <Search className="w-4 h-4 absolute left-3 text-[var(--md-sys-color-on-surface-variant)] pointer-events-none" />
          <input
            ref={mobileInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search issues, keys, summaries..."
            className="w-full h-10 pl-9 pr-8 text-xs rounded-xl bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)] focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-outline-variant)]/30"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 p-1 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>
        <button
          type="button"
          onClick={() => onMobileToggle(false)}
          className="px-3 h-10 rounded-xl bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] text-xs font-semibold hover:bg-[var(--md-sys-color-surface-container-high)] cursor-pointer"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Search Button */}
      <button
        type="button"
        onClick={() => onMobileToggle(true)}
        className="md:hidden w-9 h-9 rounded-xl bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] flex items-center justify-center transition-colors cursor-pointer border border-[var(--md-sys-color-outline-variant)]/30 shadow-2xs shrink-0"
        title="Search issues"
        aria-label="Search issues"
      >
        <Search className="w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
      </button>

      {/* Desktop Inline Search Bar */}
      <form onSubmit={handleSubmit} className="hidden md:flex items-center relative w-60 lg:w-72">
        <Search className="w-3.5 h-3.5 absolute left-3 text-[var(--md-sys-color-on-surface-variant)] pointer-events-none" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search... (Press '/' to focus)"
          className="w-full h-9 pl-8.5 pr-7 text-xs rounded-xl bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)] focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-outline-variant)]/25 transition-all"
        />
        {searchQuery ? (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2 p-0.5 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        ) : (
          <kbd className="absolute right-2.5 px-1.5 py-0.5 text-[9px] font-mono text-[var(--md-sys-color-on-surface-variant)] bg-[var(--md-sys-color-surface-container-high)] rounded-md pointer-events-none opacity-80">
            /
          </kbd>
        )}
      </form>
    </>
  );
};
