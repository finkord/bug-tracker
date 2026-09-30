import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[var(--md-sys-color-surface-container-low)] border-t border-[var(--md-sys-color-outline-variant)]/15 transition-colors duration-200 mt-auto rounded-b-xl sm:rounded-b-2xl md:rounded-b-3xl">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--md-sys-color-on-surface-variant)]">
        {/* Left: Brand Identity & Concise Description */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link to="/" className="flex items-center gap-2 group" title="BugTracker Home">
            <div className="w-6 h-6 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] flex items-center justify-center shadow-2xs transition-transform group-hover:scale-105">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-xs tracking-tight text-[var(--md-sys-color-on-surface)]">
              BugTracker
            </span>
          </Link>
          <span className="opacity-30 select-none hidden sm:inline">•</span>
          <p className="text-[11px] sm:text-xs text-[var(--md-sys-color-on-surface-variant)]">
            High-performance developer issue tracking with zero-trust security and agile workflows.
          </p>
        </div>

        {/* Right: Copyright Notice */}
        <p className="text-[11px] sm:text-xs shrink-0 opacity-80">
          © {new Date().getFullYear()} BugTracker Platform. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

