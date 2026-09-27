import React, { useMemo } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { parseJql } from '../../utils/jqlParser';

interface JqlEditorBarProps {
  jqlQuery: string;
  onJqlChange: (query: string) => void;
  onSearch: () => void;
  onClear: () => void;
  onSwitchToBasic: () => void;
}

const JQL_TEMPLATES = [
  { label: 'My Open Bugs', jql: 'assignee = currentUser() AND status != "DONE" AND issueType = "BUG"' },
  { label: 'High & Critical', jql: 'priority IN ("HIGH", "CRITICAL") AND status != "DONE"' },
  { label: 'Backlog Items', jql: 'sprint is EMPTY ORDER BY priority DESC' },
  { label: 'Active Sprint', jql: 'sprint is not EMPTY ORDER BY priority DESC' },
  { label: 'Recently Updated', jql: 'status != "DONE" ORDER BY updatedAt DESC' },
];

export const JqlEditorBar: React.FC<JqlEditorBarProps> = ({
  jqlQuery,
  onJqlChange,
  onSearch,
  onClear,
  onSwitchToBasic,
}) => {
  const parsed = useMemo(() => parseJql(jqlQuery), [jqlQuery]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onSearch();
    }
  };

  return (
    <div className="bg-[var(--md-sys-color-surface-container)] rounded-2xl p-4 border border-[var(--md-sys-color-outline-variant)]/40 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)]">
            JQL Query
          </span>
          {jqlQuery.trim() ? (
            parsed.isValid ? (
              <Badge variant="success" className="rounded-full text-[11px] px-2.5 py-0.5">
                Valid Syntax
              </Badge>
            ) : (
              <Badge variant="error" className="rounded-full text-[11px] px-2.5 py-0.5">
                Invalid Syntax
              </Badge>
            )
          ) : (
            <Badge variant="neutral" className="rounded-full text-[11px] px-2.5 py-0.5">
              Empty (All Issues)
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSwitchToBasic}
            className="text-xs font-semibold text-[var(--md-sys-color-primary)] hover:underline cursor-pointer bg-transparent border-0 p-0"
          >
            Switch to Basic Filters
          </button>
        </div>
      </div>

      <div className="relative">
        <textarea
          value={jqlQuery}
          onChange={(e) => onJqlChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='e.g. project = "PROJ" AND status != "DONE" AND assignee = currentUser() ORDER BY priority DESC'
          rows={3}
          className={`w-full font-mono text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border bg-[var(--md-sys-color-surface-container-lowest)] dark:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]/40 transition resize-y ${
            !parsed.isValid && jqlQuery.trim()
              ? 'border-[var(--md-sys-color-error)] focus:border-[var(--md-sys-color-error)]'
              : 'border-[var(--md-sys-color-outline-variant)]/50 focus:border-[var(--md-sys-color-primary)]'
          }`}
        />
      </div>

      {!parsed.isValid && parsed.errorMessage && (
        <div className="text-xs text-[var(--md-sys-color-error)] font-medium flex items-center gap-1.5 px-1">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{parsed.errorMessage}</span>
        </div>
      )}

      {/* Quick templates and action buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[var(--md-sys-color-outline-variant)]/30">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] mr-1">Templates:</span>
          {JQL_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.label}
              type="button"
              onClick={() => onJqlChange(tmpl.jql)}
              className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container-highest)] transition cursor-pointer"
            >
              {tmpl.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {jqlQuery && (
            <Button variant="ghost" size="sm" onClick={onClear}>
              Clear
            </Button>
          )}
          <Button
            variant="filled"
            size="sm"
            onClick={onSearch}
            disabled={!parsed.isValid && jqlQuery.trim().length > 0}
          >
            Run Query
          </Button>
        </div>
      </div>
    </div>
  );
};
