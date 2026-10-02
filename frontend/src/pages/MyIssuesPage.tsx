import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store';
import { useIssuesQuery, useUpdateIssueStatusMutation, useAssignIssueToMeMutation } from '../api/queries';
import type { IssueItem, IssueStatus, IssuePriority } from '../api/client';
import { IssueContextMenu } from '../components/common/IssueContextMenu';
import { useListKeyboardNavigation } from '../hooks';
import {
  Badge,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../components/ui';
import {
  UserCheck,
  FileCheck2,
  CheckCircle2,
  Clock,
  Search,
  X,
  Sparkles,
} from 'lucide-react';

type MyIssuesTab = 'assigned' | 'reported' | 'done';

export const MyIssuesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<MyIssuesTab>('assigned');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');

  const handleOpenIssue = (issue: { key: string }) => {
    navigate(`/issues/${issue.key}`, { state: { from: '/my-issues', label: 'Back to My Issues' } });
  };

  // Queries for assigned, reported, and completed issues
  const { data: assignedData, isLoading: assignedLoading } = useIssuesQuery(
    user ? { assigneeId: user.id, limit: 100 } : undefined,
  );
  const { data: reportedData, isLoading: reportedLoading } = useIssuesQuery(
    user ? { jql: `reporter = "${user.email}"`, limit: 100 } : undefined,
  );

  const updateStatusMutation = useUpdateIssueStatusMutation();
  const assignMutation = useAssignIssueToMeMutation();

  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [contextMenuIssue, setContextMenuIssue] = useState<IssueItem | null>(null);

  const assignedItems = assignedData?.items;
  const reportedItems = reportedData?.items;

  // Categorize active vs done assigned issues
  const activeAssigned = useMemo(
    () => (assignedItems ?? []).filter((i) => i.status !== 'CLOSED' && i.status !== 'RESOLVED'),
    [assignedItems],
  );
  const doneAssigned = useMemo(
    () => (assignedItems ?? []).filter((i) => i.status === 'CLOSED' || i.status === 'RESOLVED'),
    [assignedItems],
  );
  const reportedIssues = useMemo(
    () => reportedItems ?? [],
    [reportedItems],
  );

  // Pick dataset based on active tab
  const currentDataset = useMemo(() => {
    switch (activeTab) {
      case 'assigned':
        return activeAssigned;
      case 'reported':
        return reportedIssues;
      case 'done':
        return doneAssigned;
      default:
        return activeAssigned;
    }
  }, [activeTab, activeAssigned, reportedIssues, doneAssigned]);

  // Filter by search query and priority
  const filteredIssues = useMemo(() => {
    return currentDataset.filter((issue) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesKey = issue.key.toLowerCase().includes(q);
        const matchesTitle = issue.title.toLowerCase().includes(q);
        if (!matchesKey && !matchesTitle) return false;
      }
      if (selectedPriority !== 'ALL' && issue.priority !== selectedPriority) {
        return false;
      }
      return true;
    });
  }, [currentDataset, searchQuery, selectedPriority]);

  // J/K/Enter/O list keyboard navigation
  useListKeyboardNavigation({
    items: filteredIssues,
    onOpenItem: handleOpenIssue,
    enabled: true,
  });

  const handleStatusChange = async (issueId: number, nextStatus: IssueStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ issueId, status: nextStatus });
    } catch {
      // Ignored
    }
  };

  const handleAssignToMe = async (issueId: number) => {
    try {
      await assignMutation.mutateAsync(issueId);
    } catch {
      // Ignored
    }
  };

  const handleContextMenu = (e: React.MouseEvent, issue: IssueItem) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuIssue(issue);
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  const isLoading = activeTab === 'reported' ? reportedLoading : assignedLoading;

  const priorityBadgeVariant = (
    priority: IssuePriority,
  ): 'critical' | 'high' | 'medium' | 'low' | 'neutral' => {
    switch (priority) {
      case 'CRITICAL':
        return 'critical';
      case 'HIGH':
        return 'high';
      case 'MEDIUM':
        return 'medium';
      case 'LOW':
        return 'low';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-5 flex-1 flex flex-col min-w-0 space-y-5 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--md-sys-color-outline-variant)]/20">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center font-bold">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--md-sys-color-on-surface)] leading-tight">
                My Issues
              </h1>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                Your personal work queue across all projects
              </p>
            </div>
          </div>
        </div>

        {/* Quick metrics pills */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-[var(--md-sys-color-surface-container)] text-xs font-semibold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5 border border-[var(--md-sys-color-outline-variant)]/20">
            <span className="w-2 h-2 rounded-full bg-[var(--md-sys-color-primary)]" />
            <span>Active: {activeAssigned.length}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-[var(--md-sys-color-surface-container)] text-xs font-semibold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5 border border-[var(--md-sys-color-outline-variant)]/20">
            <span className="w-2 h-2 rounded-full bg-[var(--md-sys-color-tertiary)]" />
            <span>Reported: {reportedIssues.length}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-[var(--md-sys-color-surface-container)] text-xs font-semibold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5 border border-[var(--md-sys-color-outline-variant)]/20">
            <span className="w-2 h-2 rounded-full bg-[var(--md-sys-color-outline)]" />
            <span>Done: {doneAssigned.length}</span>
          </div>
        </div>
      </div>

      {/* Tabs and Filter Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* M3 Tabs */}
        <div className="flex items-center gap-1 bg-[var(--md-sys-color-surface-container)] p-1 rounded-2xl border border-[var(--md-sys-color-outline-variant)]/20">
          <button
            type="button"
            onClick={() => setActiveTab('assigned')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'assigned'
                ? 'bg-[var(--md-sys-color-surface-container-lowest)] text-[var(--md-sys-color-on-surface)] shadow-2xs font-bold'
                : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Assigned to Me</span>
            <span className="text-[10px] opacity-70 ml-0.5">({activeAssigned.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reported')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'reported'
                ? 'bg-[var(--md-sys-color-surface-container-lowest)] text-[var(--md-sys-color-on-surface)] shadow-2xs font-bold'
                : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Reported by Me</span>
            <span className="text-[10px] opacity-70 ml-0.5">({reportedIssues.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('done')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'done'
                ? 'bg-[var(--md-sys-color-surface-container-lowest)] text-[var(--md-sys-color-on-surface)] shadow-2xs font-bold'
                : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Done / Closed</span>
            <span className="text-[10px] opacity-70 ml-0.5">({doneAssigned.length})</span>
          </button>
        </div>

        {/* Inline Search and Priority Filter */}
        <div className="flex items-center gap-2">
          {/* Quick search input */}
          <div className="relative w-44 sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter tasks..."
              className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)]/60 focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-outline-variant)]/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Priority filter */}
          <div className="w-32">
            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger size="sm" className="rounded-xl bg-[var(--md-sys-color-surface-container)] text-xs border border-[var(--md-sys-color-outline-variant)]/20">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Priorities</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Issues List Container */}
      <div className="bg-[var(--md-sys-color-surface-container-low)] rounded-3xl p-4 sm:p-5 space-y-2 border border-[var(--md-sys-color-outline-variant)]/15 shadow-xs">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-[var(--md-sys-color-on-surface-variant)] italic">
            Loading your work items...
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Sparkles className="w-6 h-6 mx-auto text-[var(--md-sys-color-primary)]" />
            <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
              No issues found in this view
            </p>
            <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] max-w-sm mx-auto">
              {searchQuery || selectedPriority !== 'ALL'
                ? 'Try adjusting your search query or priority filter.'
                : 'All caught up! You have no open tickets here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {filteredIssues.map((issue) => (
              <div
                key={issue.id}
                onContextMenu={(e) => handleContextMenu(e, issue)}
                onClick={() => handleOpenIssue(issue)}
                className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]/25 hover:border-[var(--md-sys-color-outline-variant)]/60 cursor-pointer transition-all duration-150 group shadow-2xs"
              >
                {/* Left: Issue Key, Type & Title */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <a
                    href={`/issues/${issue.key}`}
                    onClick={(e) => {
                      if (e.button === 1 || e.ctrlKey || e.metaKey) return;
                      e.preventDefault();
                      handleOpenIssue(issue);
                    }}
                    className="font-mono text-[11px] font-bold text-[var(--md-sys-color-primary)] hover:underline shrink-0 bg-[var(--md-sys-color-primary-container)]/50 px-2 py-0.5 rounded-lg"
                  >
                    {issue.key}
                  </a>
                  <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface)] group-hover:text-[var(--md-sys-color-primary)] transition-colors truncate">
                    {issue.title}
                  </span>
                </div>

                {/* Right: Hours, Priority Badge, Status Dropdown */}
                <div className="flex items-center gap-2.5 shrink-0 text-xs">
                  {issue.estimatedHours > 0 && (
                    <span className="font-mono text-[10px] text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[var(--md-sys-color-primary)]" />
                      <span>{issue.loggedHours || 0}h / {issue.estimatedHours}h</span>
                    </span>
                  )}

                  <Badge variant={priorityBadgeVariant(issue.priority)} size="sm">
                    {issue.priority}
                  </Badge>

                  {/* 1-Click Status Select */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={issue.status}
                      onValueChange={(val) => handleStatusChange(issue.id, val as IssueStatus)}
                    >
                      <SelectTrigger
                        size="sm"
                        className="rounded-full bg-[var(--md-sys-color-surface-container-lowest)] text-xs font-semibold h-7 border border-[var(--md-sys-color-outline-variant)]/40"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OPEN">To Do</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="REVIEW">Review</SelectItem>
                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right-Click Context Menu */}
      {contextMenuPos && contextMenuIssue && (
        <IssueContextMenu
          issue={contextMenuIssue}
          position={contextMenuPos}
          onClose={() => {
            setContextMenuPos(null);
            setContextMenuIssue(null);
          }}
          onStatusChange={handleStatusChange}
          onAssignToMe={handleAssignToMe}
          currentUserId={user?.id}
        />
      )}
    </div>
  );
};
