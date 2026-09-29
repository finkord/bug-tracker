import React from 'react';
import { Loader2 } from 'lucide-react';

export const PageSkeletonLoader: React.FC = () => {
  return (
    <div className="w-full h-full min-h-[50vh] flex flex-col items-center justify-center p-8 space-y-4 animate-in fade-in duration-200">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-3 border-[var(--md-sys-color-primary-container)] border-t-[var(--md-sys-color-primary)] animate-spin" />
        <Loader2 className="w-5 h-5 text-[var(--md-sys-color-primary)] absolute animate-pulse" />
      </div>
      <div className="space-y-1 text-center">
        <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)] tracking-wide">
          Loading workspace...
        </p>
        <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
          Optimizing resources and fetching layout
        </p>
      </div>
    </div>
  );
};
