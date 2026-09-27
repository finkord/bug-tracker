import React from 'react';
import { ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';

interface SidebarBottomActionsProps {
  collapsed?: boolean;
  onToggleSidebar: () => void;
  onNavigate?: () => void;
}

/**
 * Bottom action utilities for the Super-Sidebar (Docs link & Collapse trigger).
 */
export const SidebarBottomActions: React.FC<SidebarBottomActionsProps> = ({
  collapsed = false,
  onToggleSidebar,
  onNavigate,
}) => {
  const swaggerLink = (
    <a
      href="http://localhost:3000/api/docs"
      target="_blank"
      rel="noreferrer"
      onClick={onNavigate}
      title="Swagger OpenAPI Documentation"
      className="w-full h-11 flex items-center rounded-xl text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] text-xs font-medium transition-colors overflow-hidden group select-none"
    >
      <div className="w-[72px] shrink-0 flex items-center justify-center">
        <div className="w-14 h-8 rounded-full flex items-center justify-center transition-colors group-hover:bg-[var(--md-sys-color-surface-container-high)]">
          <ExternalLink className="w-5 h-5" />
        </div>
      </div>
      <span
        className={`truncate whitespace-nowrap transition-opacity duration-200 ${
          collapsed ? 'opacity-0 w-0 pointer-events-none' : 'opacity-100 flex-1 text-left pr-3'
        }`}
      >
        Swagger Docs
      </span>
    </a>
  );

  const toggleButton = (
    <button
      type="button"
      onClick={onToggleSidebar}
      title={collapsed ? 'Expand sidebar ([)' : 'Collapse sidebar ([)'}
      aria-label={collapsed ? 'Expand sidebar navigation' : 'Collapse sidebar navigation'}
      className="w-full h-11 flex items-center rounded-xl text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] text-xs font-medium transition-colors cursor-pointer overflow-hidden group select-none"
    >
      <div className="w-[72px] shrink-0 flex items-center justify-center">
        <div className="w-14 h-8 rounded-full flex items-center justify-center transition-colors group-hover:bg-[var(--md-sys-color-surface-container-high)]">
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </div>
      </div>
      <span
        className={`truncate whitespace-nowrap transition-opacity duration-200 ${
          collapsed ? 'opacity-0 w-0 pointer-events-none' : 'opacity-100 flex-1 text-left pr-3'
        }`}
      >
        Collapse sidebar
      </span>
    </button>
  );

  return (
    <div className="shrink-0 pb-3 pt-2 border-t border-[var(--md-sys-color-outline-variant)]/15 flex flex-col gap-1 overflow-hidden">
      {collapsed ? (
        <Tooltip content="Swagger Docs" side="right">
          {swaggerLink}
        </Tooltip>
      ) : (
        swaggerLink
      )}

      {collapsed ? (
        <Tooltip
          content={
            <span>
              Expand sidebar <kbd className="ml-1 text-[10px] opacity-70 font-mono">[</kbd>
            </span>
          }
          side="right"
        >
          {toggleButton}
        </Tooltip>
      ) : (
        toggleButton
      )}
    </div>
  );
};
