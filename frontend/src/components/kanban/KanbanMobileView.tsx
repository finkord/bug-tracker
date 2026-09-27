import React, { useState } from 'react';
import type { IssueItem, IssueStatus } from '../../api/client';
import type { KanbanSettings } from '../../types/kanban';
import { KANBAN_COLUMNS } from '../../types/kanban';
import { IssueCard } from './IssueCard';
import { Badge, Tabs, TabsList, TabsTrigger } from '../ui';
import { Loader2, Plus, Sparkles, Inbox } from 'lucide-react';

interface KanbanMobileViewProps {
  issues: IssueItem[];
  loading: boolean;
  settings: KanbanSettings;
  onSelectIssue: (issue: IssueItem) => void;
  onStatusChange: (issueId: number, nextStatus: IssueStatus) => void;
  onAssignToMe: (issueId: number) => void;
  onQuickAddInStatus?: (status: IssueStatus) => void;
  currentUserId?: number;
}

export const KanbanMobileView: React.FC<KanbanMobileViewProps> = ({
  issues,
  loading,
  settings,
  onSelectIssue,
  onStatusChange,
  onAssignToMe,
  onQuickAddInStatus,
  currentUserId,
}) => {
  const [activeTab, setActiveTab] = useState<IssueStatus>('OPEN');

  const activeColumnDef = KANBAN_COLUMNS.find((c) => c.status === activeTab) || KANBAN_COLUMNS[0];
  const activeIssues = issues.filter((i) => i.status === activeTab);

  return (
    <div className="w-full flex flex-col pt-2 pb-6 space-y-3">
      {/* Scrollable Status Tabs Strip */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as IssueStatus)}
      >
        <TabsList variant="pills" className="w-full justify-start overflow-x-auto gap-1.5 p-1 rounded-2xl">
          {KANBAN_COLUMNS.map((col) => {
            const count = issues.filter((i) => i.status === col.status).length;
            const isActive = activeTab === col.status;

            return (
              <TabsTrigger
                key={col.status}
                value={col.status}
                variant="pills"
                size="sm"
                className="flex items-center gap-1.5 font-bold rounded-xl shrink-0"
              >
                <span>{col.shortTitle}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive
                      ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
                      : 'bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)]'
                  }`}
                >
                  {count}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* Active Column Card Header */}
      <div className="flex items-center justify-between px-3 py-2.5 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface)]">
            {activeColumnDef.title}
          </h2>
          <Badge variant={activeColumnDef.badgeVariant} size="sm">
            {activeIssues.length} {activeIssues.length === 1 ? 'ticket' : 'tickets'}
          </Badge>
        </div>

        {onQuickAddInStatus && (
          <button
            type="button"
            onClick={() => onQuickAddInStatus(activeTab)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        )}
      </div>

      {/* Active Column Issue Cards List (natural page vertical flow) */}
      <div className="space-y-2.5 pr-0.5 min-h-[200px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--md-sys-color-primary)]" />
            <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Loading tickets...</span>
          </div>
        ) : activeIssues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 rounded-3xl border border-dashed border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] text-center">
            <Inbox className="w-10 h-10 text-[var(--md-sys-color-outline)] mb-2" />
            <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
              No tickets in {activeColumnDef.title}
            </h3>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1 max-w-xs">
              Tap the "+ Add" button above to create a ticket directly in this column.
            </p>
          </div>
        ) : (
          activeIssues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onClick={onSelectIssue}
              onStatusChange={onStatusChange}
              onAssignToMe={onAssignToMe}
              currentUserId={currentUserId}
              density={settings.cardDensity}
            />
          ))
        )}
      </div>

      {/* Mobile Footer Tip */}
      <div className="flex items-center justify-center gap-1 text-[11px] text-[var(--md-sys-color-on-surface-variant)] pt-1">
        <Sparkles className="w-3 h-3 text-[var(--md-sys-color-primary)]" />
        <span>Tap any card to open details or use the 3-dot menu to transition status</span>
      </div>
    </div>
  );
};
