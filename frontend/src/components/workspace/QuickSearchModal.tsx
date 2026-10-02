import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Loader2,
  ArrowRight,
  CornerDownLeft,
  Plus,
  SunMoon,
  PanelLeft,
  HelpCircle,
  Kanban,
  ListTodo,
  Clock,
  FolderGit2,
  FileSearch,
  CheckCircle,
  History,
} from 'lucide-react';
import { useIssuesQuery, useProjectsQuery } from '../../api/queries';
import { Badge } from '../ui';
import type { IssuePriority, IssueStatus } from '../../api/client';
import { useModalStore, useSidebarStore, useThemeStore, useRecentIssuesStore } from '../../store';

export interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectIssue: (issueId: number) => void;
}

interface PaletteItem {
  id: string;
  type: 'action' | 'navigation' | 'project' | 'issue';
  label: string;
  sublabel?: string;
  shortcut?: string;
  icon?: React.ReactNode;
  issueId?: number;
  priority?: IssuePriority;
  status?: IssueStatus;
  key?: string;
  section?: string;
  onExecute: () => void;
}

const mapPriorityVariant = (
  priority?: IssuePriority,
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

const mapStatusVariant = (
  status?: IssueStatus,
): 'open' | 'in-progress' | 'review' | 'resolved' | 'closed' | 'neutral' => {
  switch (status) {
    case 'OPEN':
      return 'open';
    case 'IN_PROGRESS':
      return 'in-progress';
    case 'REVIEW':
      return 'review';
    case 'RESOLVED':
      return 'resolved';
    case 'CLOSED':
      return 'closed';
    default:
      return 'neutral';
  }
};

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectIssue,
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { openCreateIssue, openShortcuts } = useModalStore();
  const toggleSidebar = useSidebarStore((state) => state.toggleSidebar);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const { data: projectsData } = useProjectsQuery({ enabled: isOpen });
  const recentIssues = useRecentIssuesStore((state) => state.recentIssues);

  // Debounce search input by 150ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 150);
    return () => clearTimeout(timer);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Query issues when debouncedQuery is present
  const { data: issuesData, isLoading: isIssuesLoading } = useIssuesQuery(
    debouncedQuery ? { search: debouncedQuery, limit: 8 } : undefined,
  );

  const handleClose = () => {
    setQuery('');
    setDebouncedQuery('');
    setActiveIndex(0);
    onClose();
  };

  // Compile all executable items
  const items = useMemo<PaletteItem[]>(() => {
    const list: PaletteItem[] = [];
    const q = debouncedQuery.toLowerCase();

    // 1. Actions
    const staticActions: PaletteItem[] = [
      {
        id: 'action-create-issue',
        type: 'action',
        label: 'Create new issue',
        shortcut: 'C',
        icon: <Plus className="w-4 h-4" />,
        onExecute: () => {
          handleClose();
          openCreateIssue();
        },
      },
      {
        id: 'action-toggle-theme',
        type: 'action',
        label: 'Toggle dark / light theme',
        icon: <SunMoon className="w-4 h-4" />,
        onExecute: () => {
          toggleTheme();
          handleClose();
        },
      },
      {
        id: 'action-toggle-sidebar',
        type: 'action',
        label: 'Toggle sidebar collapsed',
        shortcut: 'Cmd+B',
        icon: <PanelLeft className="w-4 h-4" />,
        onExecute: () => {
          toggleSidebar();
          handleClose();
        },
      },
      {
        id: 'action-open-shortcuts',
        type: 'action',
        label: 'Keyboard shortcuts cheat sheet',
        shortcut: '?',
        icon: <HelpCircle className="w-4 h-4" />,
        onExecute: () => {
          handleClose();
          openShortcuts();
        },
      },
    ];

    // 2. Navigation
    const staticNav: PaletteItem[] = [
      {
        id: 'nav-board',
        type: 'navigation',
        label: 'Go to Kanban Board',
        icon: <Kanban className="w-4 h-4" />,
        onExecute: () => {
          navigate('/board');
          handleClose();
        },
      },
      {
        id: 'nav-backlog',
        type: 'navigation',
        label: 'Go to Backlog',
        icon: <ListTodo className="w-4 h-4" />,
        onExecute: () => {
          navigate('/backlog');
          handleClose();
        },
      },
      {
        id: 'nav-search',
        type: 'navigation',
        label: 'Go to Advanced Search',
        icon: <FileSearch className="w-4 h-4" />,
        onExecute: () => {
          navigate('/search');
          handleClose();
        },
      },
      {
        id: 'nav-my-issues',
        type: 'navigation',
        label: 'Go to My Issues',
        icon: <CheckCircle className="w-4 h-4" />,
        onExecute: () => {
          navigate('/my-issues');
          handleClose();
        },
      },
      {
        id: 'nav-time-tracking',
        type: 'navigation',
        label: 'Go to Time Tracking',
        icon: <Clock className="w-4 h-4" />,
        onExecute: () => {
          navigate('/time-tracking');
          handleClose();
        },
      },
      {
        id: 'nav-projects',
        type: 'navigation',
        label: 'Go to Projects Overview',
        icon: <FolderGit2 className="w-4 h-4" />,
        onExecute: () => {
          navigate('/projects');
          handleClose();
        },
      },
    ];

    if (!q) {
      // 1. Recently viewed issues (if any)
      if (recentIssues && recentIssues.length > 0) {
        recentIssues.forEach((issue) => {
          list.push({
            id: `recent-${issue.id}`,
            type: 'issue',
            label: issue.title,
            key: issue.key,
            issueId: issue.id,
            priority: issue.priority,
            status: issue.status,
            sublabel: 'Recent',
            section: 'Recently Viewed',
            onExecute: () => {
              onSelectIssue(issue.id);
              handleClose();
            },
          });
        });
      }

      // 2. Actions & Navigation
      staticActions.forEach((act) => list.push({ ...act, section: 'Quick Actions' }));
      staticNav.forEach((nav) => list.push({ ...nav, section: 'Navigation' }));

      if (projectsData && projectsData.length > 0) {
        projectsData.slice(0, 4).forEach((p) => {
          list.push({
            id: `project-${p.id}`,
            type: 'project',
            label: `Switch to ${p.name}`,
            sublabel: p.key,
            section: 'Projects',
            icon: <FolderGit2 className="w-4 h-4" />,
            onExecute: () => {
              navigate(`/projects/${p.key || p.id}/board`);
              handleClose();
            },
          });
        });
      }
    } else {
      // Filter recent issues first
      if (recentIssues && recentIssues.length > 0) {
        recentIssues.forEach((issue) => {
          if (
            issue.title.toLowerCase().includes(q) ||
            issue.key.toLowerCase().includes(q)
          ) {
            list.push({
              id: `recent-${issue.id}`,
              type: 'issue',
              label: issue.title,
              key: issue.key,
              issueId: issue.id,
              priority: issue.priority,
              status: issue.status,
              sublabel: 'Recent',
              section: 'Recent Matches',
              onExecute: () => {
                onSelectIssue(issue.id);
                handleClose();
              },
            });
          }
        });
      }

      // Filter actions and navigation by query
      staticActions.forEach((act) => {
        if (act.label.toLowerCase().includes(q)) {
          list.push({ ...act, section: 'Actions' });
        }
      });
      staticNav.forEach((nav) => {
        if (nav.label.toLowerCase().includes(q)) {
          list.push({ ...nav, section: 'Navigation' });
        }
      });

      // Filter projects
      if (projectsData) {
        projectsData.forEach((p) => {
          if (p.name.toLowerCase().includes(q) || p.key.toLowerCase().includes(q)) {
            list.push({
              id: `project-${p.id}`,
              type: 'project',
              label: `Project: ${p.name}`,
              sublabel: p.key,
              section: 'Projects',
              icon: <FolderGit2 className="w-4 h-4" />,
              onExecute: () => {
                navigate(`/projects/${p.key || p.id}/board`);
                handleClose();
              },
            });
          }
        });
      }

      // Add matching issues from backend
      if (issuesData?.items) {
        const existingIds = new Set(list.map((item) => item.issueId).filter(Boolean));
        issuesData.items.forEach((issue) => {
          if (!existingIds.has(issue.id)) {
            list.push({
              id: `issue-${issue.id}`,
              type: 'issue',
              label: issue.title,
              key: issue.key,
              issueId: issue.id,
              priority: issue.priority,
              status: issue.status,
              section: 'Search Results',
              onExecute: () => {
                onSelectIssue(issue.id);
                handleClose();
              },
            });
          }
        });
      }
    }

    return list;
  }, [
    debouncedQuery,
    recentIssues,
    projectsData,
    issuesData,
    openCreateIssue,
    openShortcuts,
    toggleTheme,
    toggleSidebar,
    navigate,
    onSelectIssue,
    handleClose,
  ]);

  const safeActiveIndex = items.length > 0 ? Math.min(activeIndex, items.length - 1) : 0;

  const handleQueryChange = (val: string) => {
    setQuery(val);
    setActiveIndex(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (items.length > 0) {
        setActiveIndex((prev) => (prev + 1) % items.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (items.length > 0) {
        setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (items.length > 0 && items[safeActiveIndex]) {
        items[safeActiveIndex].onExecute();
      } else if (query.trim()) {
        navigate(`/search?search=${encodeURIComponent(query.trim())}`);
        handleClose();
      }
    }
  };

  const handleOpenFullSearch = () => {
    if (query.trim()) {
      navigate(`/search?search=${encodeURIComponent(query.trim())}`);
    } else {
      navigate('/search');
    }
    handleClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-150 animate-in fade-in" />
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 p-4 pointer-events-none">
          <Dialog.Content
            onKeyDown={handleKeyDown}
            className="w-full max-w-xl pointer-events-auto bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)]/30 rounded-2xl shadow-2xl overflow-hidden focus:outline-none flex flex-col animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Top search input row */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--md-sys-color-outline-variant)]/20 bg-[var(--md-sys-color-surface-container-highest)]/40">
              <Search className="w-5 h-5 text-[var(--md-sys-color-primary)] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Search issues by key, title, or run a command..."
                className="flex-1 bg-transparent border-none text-sm text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)]/60 focus:outline-none"
              />
              {isIssuesLoading ? (
                <Loader2 className="w-4 h-4 text-[var(--md-sys-color-primary)] animate-spin shrink-0" />
              ) : (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] border border-[var(--md-sys-color-outline-variant)]/30 shrink-0">
                  Esc
                </span>
              )}
            </div>

            {/* Results or Action List */}
            <div className="max-h-[380px] overflow-y-auto divide-y divide-[var(--md-sys-color-outline-variant)]/10">
              {debouncedQuery && items.length === 0 && !isIssuesLoading ? (
                <div className="py-8 px-4 text-center text-xs text-[var(--md-sys-color-on-surface-variant)]">
                  <p className="font-semibold text-[var(--md-sys-color-on-surface)]">No results found</p>
                  <p className="mt-1 opacity-70">No issues, commands, or projects match &quot;{debouncedQuery}&quot;.</p>
                </div>
              ) : (
                items.map((item, idx) => {
                  const isSelected = idx === safeActiveIndex;
                  const showSectionHeader = Boolean(
                    item.section && (idx === 0 || items[idx - 1].section !== item.section),
                  );

                  return (
                    <React.Fragment key={item.id}>
                      {showSectionHeader && (
                        <div className="px-4 py-1.5 bg-[var(--md-sys-color-surface-container)]/70 text-[10px] uppercase font-bold tracking-wider text-[var(--md-sys-color-primary)] flex items-center gap-1.5 select-none border-t first:border-t-0 border-[var(--md-sys-color-outline-variant)]/20">
                          {item.section === 'Recently Viewed' ? (
                            <History className="w-3 h-3" />
                          ) : null}
                          <span>{item.section}</span>
                        </div>
                      )}
                      <div
                        onClick={item.onExecute}
                        onMouseEnter={() => setActiveIndex(idx)}
                        className={`flex items-center justify-between gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[var(--md-sys-color-primary-container)]/30 text-[var(--md-sys-color-on-surface)]'
                            : 'hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {item.type === 'issue' && item.key ? (
                            <span className="font-mono text-xs font-bold text-[var(--md-sys-color-primary)] shrink-0 bg-[var(--md-sys-color-primary-container)]/50 px-1.5 py-0.5 rounded">
                              {item.key}
                            </span>
                          ) : item.icon ? (
                            <div className="w-5 h-5 flex items-center justify-center shrink-0 text-[var(--md-sys-color-primary)]">
                              {item.icon}
                            </div>
                          ) : null}

                          <span className="text-xs font-medium text-[var(--md-sys-color-on-surface)] truncate">
                            {item.label}
                          </span>

                          {item.sublabel && (
                            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] shrink-0">
                              {item.sublabel}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.type === 'issue' && item.priority && (
                            <Badge variant={mapPriorityVariant(item.priority)} size="sm">
                              {item.priority}
                            </Badge>
                          )}
                          {item.type === 'issue' && item.status && (
                            <Badge variant={mapStatusVariant(item.status)} size="sm">
                              {item.status}
                            </Badge>
                          )}

                          {item.shortcut && (
                            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] border border-[var(--md-sys-color-outline-variant)]/30">
                              {item.shortcut}
                            </kbd>
                          )}

                          {isSelected && (
                            <CornerDownLeft className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] shrink-0" />
                          )}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              )}
            </div>

            {/* Footer with keyboard hints and full search navigation */}
            <div className="px-4 py-2.5 bg-[var(--md-sys-color-surface-container)] border-t border-[var(--md-sys-color-outline-variant)]/20 flex items-center justify-between text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]/30 font-mono text-[10px]">
                    ↑
                  </kbd>
                  <kbd className="px-1 py-0.5 rounded bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]/30 font-mono text-[10px]">
                    ↓
                  </kbd>
                  <span>navigate</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]/30 font-mono text-[10px]">
                    ↵
                  </kbd>
                  <span>execute</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]/30 font-mono text-[10px]">
                    Cmd+K
                  </kbd>
                </span>
              </div>

              <button
                type="button"
                onClick={handleOpenFullSearch}
                className="flex items-center gap-1 font-semibold text-[var(--md-sys-color-primary)] hover:underline cursor-pointer"
              >
                <span>Full Search</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
