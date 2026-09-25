import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  api,
  type IssueLinkItem,
  type IssueLinkType,
  type IssueItem,
  type IssueStatus,
  type IssuePriority,
} from '../../api/client';
import { Card, Button, Modal, Tooltip, Badge } from '../ui';
import {
  Link2,
  Plus,
  Trash2,
  ShieldAlert,
  GitBranch,
  Copy,
  AlertTriangle,
  Search,
  Loader2,
  ExternalLink,
} from 'lucide-react';

interface IssueLinksSectionProps {
  issueId: number;
  currentIssueKey: string;
  projectId: number;
  links?: IssueLinkItem[];
  onLinksChanged: () => void;
}

const statusBadgeConfig: Record<IssueStatus, { label: string; className: string }> = {
  OPEN: {
    label: 'Open',
    className: 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    className: 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]',
  },
  REVIEW: {
    label: 'Review',
    className: 'bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)]',
  },
  RESOLVED: {
    label: 'Resolved',
    className: 'bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)] line-through',
  },
  CLOSED: {
    label: 'Closed',
    className: 'bg-black/10 dark:bg-white/10 text-[var(--md-sys-color-on-surface-variant)] line-through',
  },
};

const priorityDot: Record<IssuePriority, string> = {
  CRITICAL: 'bg-red-500',
  HIGH: 'bg-orange-500',
  MEDIUM: 'bg-amber-500',
  LOW: 'bg-blue-500',
};

export const IssueLinksSection: React.FC<IssueLinksSectionProps> = ({
  issueId,
  currentIssueKey,
  projectId,
  links = [],
  onLinksChanged,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');
  const [targetQuery, setTargetQuery] = useState('');
  const [linkType, setLinkType] = useState<IssueLinkType>('RELATES_TO');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Quick project issue suggestion search
  const [projectIssues, setProjectIssues] = useState<IssueItem[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    if (isModalOpen) {
      setError(null);
      setTargetQuery('');
      setLoadingSuggestions(true);
      api
        .getIssues({ projectId })
        .then((items) => {
          // Filter out current issue
          setProjectIssues(items.filter((i) => i.id !== issueId));
        })
        .catch(() => {})
        .finally(() => setLoadingSuggestions(false));
    }
  }, [isModalOpen, projectId, issueId]);

  const filteredSuggestions = useMemo(() => {
    if (!targetQuery.trim()) {
      return projectIssues.slice(0, 5);
    }
    const q = targetQuery.toLowerCase();
    return projectIssues
      .filter(
        (i) =>
          i.key.toLowerCase().includes(q) ||
          i.title.toLowerCase().includes(q) ||
          String(i.issueNum).includes(q),
      )
      .slice(0, 6);
  }, [projectIssues, targetQuery]);

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetQuery.trim()) {
      setError('Please select or specify a target issue');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await api.createIssueLink(issueId, {
        targetIssueKeyOrId: targetQuery.trim(),
        linkType,
      });
      setIsModalOpen(false);
      onLinksChanged();
    } catch (err: any) {
      setError(err.message || 'Failed to create issue link');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLink = async (linkId: number) => {
    if (!window.confirm('Remove this issue relationship?')) return;
    setDeletingId(linkId);
    try {
      await api.deleteIssueLink(linkId);
      onLinksChanged();
    } catch (err: any) {
      alert(err.message || 'Failed to remove link');
    } finally {
      setDeletingId(null);
    }
  };

  // Group links for dependency tree visualization
  const blockers = useMemo(
    () => links.filter((l) => l.label === 'is blocked by'),
    [links],
  );
  const blocks = useMemo(
    () => links.filter((l) => l.label === 'blocks'),
    [links],
  );
  const related = useMemo(
    () => links.filter((l) => l.label === 'relates to' || l.label === 'duplicates' || l.label === 'is duplicated by'),
    [links],
  );

  const getLinkBadgeStyle = (label: string) => {
    if (label === 'blocks') {
      return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30';
    }
    if (label === 'is blocked by') {
      return 'bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] border border-[var(--md-sys-color-error)]/25';
    }
    if (label.includes('duplicate')) {
      return 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30';
    }
    return 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border border-[var(--md-sys-color-primary)]/20';
  };

  const getLinkIcon = (label: string) => {
    if (label === 'blocks') return <ShieldAlert className="w-3.5 h-3.5" />;
    if (label === 'is blocked by') return <AlertTriangle className="w-3.5 h-3.5" />;
    if (label.includes('duplicate')) return <Copy className="w-3.5 h-3.5" />;
    return <Link2 className="w-3.5 h-3.5" />;
  };

  return (
    <Card variant="filled" padding="md" rounded="xl" className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--md-sys-color-outline-variant)]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center">
            <GitBranch className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                Linked Issues & Dependencies
              </h3>
              {links.length > 0 && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]">
                  {links.length}
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
              Lab 3/5 Directed Semantic Dependency Model
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {links.length > 0 && (
            <div className="flex items-center p-0.5 rounded-lg bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] shadow-xs'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                List Chips
              </button>
              <button
                type="button"
                onClick={() => setViewMode('tree')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  viewMode === 'tree'
                    ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] shadow-xs'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                Graph Hierarchy
              </button>
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Link Issue
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      {links.length === 0 ? (
        <div className="text-center py-6 px-4 rounded-xl border border-dashed border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]/50 space-y-2">
          <div className="w-9 h-9 rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] mx-auto flex items-center justify-center">
            <Link2 className="w-4.5 h-4.5 opacity-60" />
          </div>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
            No dependencies or linked issues attached yet.
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="text-xs text-[var(--md-sys-color-primary)]"
          >
            Add blocker, duplicate, or related issue
          </Button>
        </div>
      ) : viewMode === 'list' ? (
        /* List / Chip Mode */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {links.map((link) => {
            const target = link.linkedIssue;
            if (!target) return null;
            const statusConfig = statusBadgeConfig[target.status] || statusBadgeConfig.OPEN;

            return (
              <div
                key={link.id}
                className="group relative flex items-center justify-between gap-3 p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:border-[var(--md-sys-color-primary)]/40 hover:shadow-xs transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {/* Semantic badge */}
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap shrink-0 ${getLinkBadgeStyle(
                      link.label,
                    )}`}
                  >
                    {getLinkIcon(link.label)}
                    <span className="capitalize">{link.label}</span>
                  </span>

                  {/* Issue link & key */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${priorityDot[target.priority]}`} />
                      <Link
                        to={`/issues/${target.key}`}
                        className="font-mono font-bold text-xs text-[var(--md-sys-color-primary)] hover:underline truncate"
                      >
                        {target.key}
                      </Link>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded shrink-0 ${statusConfig.className}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--md-sys-color-on-surface)] truncate" title={target.title}>
                      {target.title}
                    </p>
                  </div>
                </div>

                {/* Remove button */}
                <div className="flex items-center gap-1 shrink-0">
                  <Tooltip content="Open linked issue">
                    <Link
                      to={`/issues/${target.key}`}
                      className="p-1 rounded-md text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </Tooltip>
                  <Tooltip content="Unlink issue">
                    <button
                      type="button"
                      disabled={deletingId === link.id}
                      onClick={() => handleDeleteLink(link.id)}
                      className="p-1 rounded-md text-[var(--md-sys-color-on-surface-variant)] hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                      aria-label="Remove issue link"
                    >
                      {deletingId === link.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </Tooltip>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Directed Graph / Hierarchy Mode */
        <div className="space-y-4 p-4 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
          {/* 1. Upstream Blockers */}
          {blockers.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--md-sys-color-error)]">
                <AlertTriangle className="w-4 h-4" />
                <span>Upstream Blockers (Must be resolved first)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-4 border-l-2 border-[var(--md-sys-color-error)]/40">
                {blockers.map((b) => (
                  <Link
                    key={b.id}
                    to={`/issues/${b.linkedIssue.key}`}
                    className="p-2 rounded-lg bg-[var(--md-sys-color-error-container)]/30 border border-[var(--md-sys-color-error)]/20 hover:border-[var(--md-sys-color-error)] text-xs flex items-center justify-between gap-2"
                  >
                    <span className="font-mono font-bold text-[var(--md-sys-color-primary)]">
                      {b.linkedIssue.key}
                    </span>
                    <span className="truncate flex-1 text-[var(--md-sys-color-on-surface)]">
                      {b.linkedIssue.title}
                    </span>
                    <Badge variant={b.linkedIssue.status === 'RESOLVED' || b.linkedIssue.status === 'CLOSED' ? 'success' : 'warning'} size="sm">
                      {b.linkedIssue.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Current Node */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--md-sys-color-primary-container)]/30 border-2 border-[var(--md-sys-color-primary)]">
            <div className="w-8 h-8 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] flex items-center justify-center font-bold text-xs">
              This
            </div>
            <div>
              <span className="font-mono font-bold text-sm text-[var(--md-sys-color-primary)]">
                {currentIssueKey}
              </span>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                Current active issue node
              </p>
            </div>
          </div>

          {/* 2. Downstream Blocked */}
          {blocks.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                <ShieldAlert className="w-4 h-4" />
                <span>Downstream Blocked Issues (Waiting on this issue)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-4 border-l-2 border-amber-500/40">
                {blocks.map((b) => (
                  <Link
                    key={b.id}
                    to={`/issues/${b.linkedIssue.key}`}
                    className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:border-amber-500 text-xs flex items-center justify-between gap-2"
                  >
                    <span className="font-mono font-bold text-[var(--md-sys-color-primary)]">
                      {b.linkedIssue.key}
                    </span>
                    <span className="truncate flex-1 text-[var(--md-sys-color-on-surface)]">
                      {b.linkedIssue.title}
                    </span>
                    <Badge variant="neutral" size="sm">
                      {b.linkedIssue.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 3. Related & Duplicates */}
          {related.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--md-sys-color-on-surface-variant)]">
                <Link2 className="w-4 h-4" />
                <span>Related & Duplicate Issues</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-4 border-l-2 border-[var(--md-sys-color-outline-variant)]">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    to={`/issues/${r.linkedIssue.key}`}
                    className="p-2 rounded-lg bg-[var(--md-sys-color-surface-container-high)]/40 border border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)] text-xs flex items-center justify-between gap-2"
                  >
                    <span className="font-mono font-bold text-[var(--md-sys-color-primary)]">
                      {r.linkedIssue.key}
                    </span>
                    <span className="truncate flex-1 text-[var(--md-sys-color-on-surface)]">
                      {r.linkedIssue.title}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-[var(--md-sys-color-on-surface-variant)]">
                      {r.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Link Issue Modal Dialog */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center">
              <GitBranch className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                Link Issue
              </span>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-normal">
                Establish dependency relationship from {currentIssueKey}
              </p>
            </div>
          </div>
        }
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="filled"
              size="sm"
              isLoading={submitting}
              onClick={handleCreateLink}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Relationship
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateLink} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-[var(--md-sys-color-error-container)] border border-[var(--md-sys-color-error)]/25 text-[var(--md-sys-color-on-error-container)] text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Relationship Type Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
              This issue ({currentIssueKey})
            </label>
            <select
              value={linkType}
              onChange={(e) => setLinkType(e.target.value as IssueLinkType)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] focus:border-[var(--md-sys-color-primary)] focus:ring-1 focus:ring-[var(--md-sys-color-primary)] outline-hidden transition-all"
            >
              <option value="BLOCKS">Blocks</option>
              <option value="IS_BLOCKED_BY">Is blocked by</option>
              <option value="DUPLICATES">Duplicates</option>
              <option value="RELATES_TO">Relates to</option>
            </select>
          </div>

          {/* Target Issue Search / Key Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
              Target Issue (Key or Title)
            </label>
            <div className="relative">
              <input
                type="text"
                value={targetQuery}
                onChange={(e) => setTargetQuery(e.target.value)}
                placeholder="e.g. BT-2, PROJ-10, or search title..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)]/60 focus:border-[var(--md-sys-color-primary)] focus:ring-1 focus:ring-[var(--md-sys-color-primary)] outline-hidden transition-all font-mono"
              />
              <Search className="w-4 h-4 text-[var(--md-sys-color-on-surface-variant)] absolute left-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Suggestions Quick Select List */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)]">
              Quick Select from Project Issues:
            </span>
            {loadingSuggestions ? (
              <div className="flex items-center justify-center py-4 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Loading issues...
              </div>
            ) : filteredSuggestions.length === 0 ? (
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] italic py-2">
                No matching project issues found. You can enter any custom issue key above.
              </p>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                {filteredSuggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTargetQuery(item.key)}
                    className={`w-full text-left p-2 rounded-lg border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                      targetQuery === item.key
                        ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/30'
                        : 'border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono font-bold text-xs text-[var(--md-sys-color-primary)]">
                        {item.key}
                      </span>
                      <span className="text-xs text-[var(--md-sys-color-on-surface)] truncate">
                        {item.title}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-[var(--md-sys-color-on-surface-variant)] shrink-0">
                      {item.status}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </form>
      </Modal>
    </Card>
  );
};
