import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  api,
  type IssueItem,
  type ProjectItem,
  type AssigneeUser,
  type SavedFilterItem,
  type IssueStatus,
  type IssuePriority,
  type IssueType,
} from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/common/Avatar';
import { MarkdownContent } from '../components/common/MarkdownContent';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Tooltip } from '../components/ui/Tooltip';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../components/ui/Dropdown';
import {
  parseJql,
  evaluateJql,
  buildJqlFromFilters,
  type JqlQuery,
} from '../utils/jqlParser';
import {
  Search,
  Filter,
  Save,
  RotateCcw,
  Download,
  Layers,
  Loader2,
  Bookmark,
  BookmarkPlus,
  CheckCircle2,
  Trash2,
  SlidersHorizontal,
  FolderGit2,
  Code2,
  Sparkles,
  Star,
  LayoutList,
  Columns2,
  ExternalLink,
  Clock,
  UserCheck,
  FileCheck2,
  X,
  Share2,
  Send,
  Image as ImageIcon,
  AlertTriangle,
  MessageSquare,
  ChevronDown,
  Tag,
  Check,
} from 'lucide-react';

type SearchMode = 'BASIC' | 'JQL';
type ViewLayout = 'LIST' | 'DETAIL';

interface SystemFilterPreset {
  id: string;
  name: string;
  icon: React.FC<{ className?: string }>;
  description: string;
  jql: string;
}

export const AdvancedSearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  // Search Mode & Layout State
  const [mode, setMode] = useState<SearchMode>(() => (searchParams.get('jql') ? 'JQL' : 'BASIC'));
  const [layout, setLayout] = useState<ViewLayout>(() => (searchParams.get('layout') as ViewLayout) || 'LIST');
  const [selectedIssueKey, setSelectedIssueKey] = useState<string | null>(searchParams.get('issue') || null);

  // Basic Filter Criteria
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedProjectKeys, setSelectedProjectKeys] = useState<string[]>(() => {
    const p = searchParams.get('projects');
    return p ? p.split(',') : [];
  });
  const [selectedTypes, setSelectedTypes] = useState<string[]>(() => {
    const t = searchParams.get('types');
    return t ? t.split(',') : [];
  });
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(() => {
    const s = searchParams.get('statuses');
    return s ? s.split(',') : [];
  });
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>(() => {
    const pr = searchParams.get('priorities');
    return pr ? pr.split(',') : [];
  });
  const [selectedAssignee, setSelectedAssignee] = useState<string>(searchParams.get('assignee') || 'ALL');
  const [selectedSprint, setSelectedSprint] = useState<string>(searchParams.get('sprint') || 'ALL');

  // JQL Query State
  const [jqlInput, setJqlInput] = useState<string>(() => searchParams.get('jql') || '');
  const [activeJql, setActiveJql] = useState<string>(() => searchParams.get('jql') || '');

  // Sorting
  const [sortBy, setSortBy] = useState<'createdAt' | 'priority' | 'updatedAt' | 'key' | 'title'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Data State
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [assignees, setAssignees] = useState<AssigneeUser[]>([]);
  const [savedFilters, setSavedFilters] = useState<SavedFilterItem[]>([]);
  const [starredFilterIds, setStarredFilterIds] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('bt_starred_filters') || '[]');
    } catch {
      return [];
    }
  });
  const [activeSavedFilterId, setActiveSavedFilterId] = useState<number | null>(null);
  const [activeSystemFilterId, setActiveSystemFilterId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Detail View Full Issue State
  const [detailedIssue, setDetailedIssue] = useState<IssueItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailCommentText, setDetailCommentText] = useState('');
  const [submittingDetailComment, setSubmittingDetailComment] = useState(false);
  const [uploadingDetailScreenshot, setUploadingDetailScreenshot] = useState(false);
  const detailFileInputRef = useRef<HTMLInputElement>(null);

  // Modals & Notifications
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [manageFiltersModalOpen, setManageFiltersModalOpen] = useState(false);
  const [filterToDelete, setFilterToDelete] = useState<SavedFilterItem | null>(null);
  const [newFilterName, setNewFilterName] = useState('');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // Lightbox modal for previewing screenshots
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewImageTitle, setPreviewImageTitle] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const jqlInputRef = useRef<HTMLTextAreaElement>(null);

  // Focus search input on '/' keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        if (mode === 'BASIC') {
          searchInputRef.current?.focus();
        } else {
          jqlInputRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode]);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Predefined Jira System Filters
  const systemFilters: SystemFilterPreset[] = [
    {
      id: 'my-open',
      name: 'My open issues',
      icon: UserCheck,
      description: 'Issues assigned to you that are not resolved or closed',
      jql: 'assignee = currentUser() AND status NOT IN ("RESOLVED", "CLOSED") ORDER BY priority DESC',
    },
    {
      id: 'reported-by-me',
      name: 'Reported by me',
      icon: FileCheck2,
      description: 'Issues created by you across all projects',
      jql: 'reporter = currentUser() ORDER BY createdAt DESC',
    },
    {
      id: 'critical-blockers',
      name: 'Critical & High',
      icon: Sparkles,
      description: 'Critical and high priority issues requiring urgent attention',
      jql: 'priority IN ("CRITICAL", "HIGH") AND status NOT IN ("CLOSED") ORDER BY priority DESC',
    },
    {
      id: 'recently-updated',
      name: 'Recently updated',
      icon: Clock,
      description: 'Issues modified most recently in the system',
      jql: 'ORDER BY updatedAt DESC',
    },
    {
      id: 'done-issues',
      name: 'Done issues',
      icon: CheckCircle2,
      description: 'Resolved and closed issues',
      jql: 'status IN ("RESOLVED", "CLOSED") ORDER BY updatedAt DESC',
    },
    {
      id: 'all-issues',
      name: 'All issues',
      icon: Filter,
      description: 'Full issue repository backlog',
      jql: 'ORDER BY createdAt DESC',
    },
  ];

  // Load initial dataset
  const loadData = async () => {
    setLoading(true);
    try {
      const [issuesData, projectsData, assigneesData, filtersData] = await Promise.all([
        api.getIssues(),
        api.getProjects().catch(() => []),
        api.getAssignees().catch(() => []),
        api.getSavedFilters().catch(() => []),
      ]);
      setIssues(issuesData);
      setProjects(projectsData);
      setAssignees(assigneesData);
      setSavedFilters(filtersData);
    } catch {
      // Error handling fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync state changes with URL Search Params
  const syncUrl = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (!v || v === 'ALL' || v === '') {
        next.delete(k);
      } else {
        next.set(k, v);
      }
    });
    setSearchParams(next, { replace: true });
  };

  // Toggle star favorite on custom saved filter
  const toggleStarFilter = (filterId: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setStarredFilterIds((prev) => {
      const next = prev.includes(filterId) ? prev.filter((id) => id !== filterId) : [...prev, filterId];
      localStorage.setItem('bt_starred_filters', JSON.stringify(next));
      return next;
    });
  };

  // Available sprints computed from loaded issues
  const allSprints = useMemo(() => {
    const sprints = new Set<string>();
    issues.forEach((i) => {
      if (i.sprint) sprints.add(i.sprint);
    });
    return Array.from(sprints).sort();
  }, [issues]);

  // Current compiled JQL query object
  const currentJqlString = useMemo(() => {
    if (mode === 'JQL') {
      return activeJql;
    }
    return buildJqlFromFilters({
      query,
      projectKey: selectedProjectKeys.length === 1 ? selectedProjectKeys[0] : undefined,
      statuses: selectedStatuses,
      priorities: selectedPriorities,
      issueTypes: selectedTypes,
      assignee: selectedAssignee,
      sprint: selectedSprint,
      sortBy,
      sortOrder,
    });
  }, [
    mode,
    activeJql,
    query,
    selectedProjectKeys,
    selectedStatuses,
    selectedPriorities,
    selectedTypes,
    selectedAssignee,
    selectedSprint,
    sortBy,
    sortOrder,
  ]);

  const parsedJqlQuery = useMemo<JqlQuery>(() => {
    return parseJql(currentJqlString);
  }, [currentJqlString]);

  // Filter and evaluate issues using the JQL engine
  const filteredIssues = useMemo(() => {
    return evaluateJql(issues, parsedJqlQuery, user?.id);
  }, [issues, parsedJqlQuery, user?.id]);

  // Selected issue key fallback
  const activeSelectedKey = useMemo(() => {
    if (selectedIssueKey) return selectedIssueKey;
    return filteredIssues[0]?.key || null;
  }, [selectedIssueKey, filteredIssues]);

  // Fetch full detailed issue with all comments & relations for Detail View
  useEffect(() => {
    if (layout === 'DETAIL' && activeSelectedKey) {
      setLoadingDetail(true);
      api.getIssue(activeSelectedKey)
        .then((data) => {
          setDetailedIssue(data);
        })
        .catch(() => {
          setDetailedIssue(null);
        })
        .finally(() => {
          setLoadingDetail(false);
        });
    }
  }, [layout, activeSelectedKey]);

  // Add Comment in Detail View
  const handleAddDetailComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailedIssue || !detailCommentText.trim()) return;

    setSubmittingDetailComment(true);
    try {
      const newComment = await api.addIssueComment(detailedIssue.id, detailCommentText.trim());
      setDetailedIssue((prev) => {
        if (!prev) return prev;
        const currentComments = prev.comments || [];
        if (currentComments.some((c) => c.id === newComment.id)) return prev;
        return {
          ...prev,
          comments: [...currentComments, newComment],
        };
      });
      setDetailCommentText('');
      showToast('Comment posted');
    } catch (err: any) {
      showToast(err.message || 'Failed to post comment', 'info');
    } finally {
      setSubmittingDetailComment(false);
    }
  };

  // Paste screenshot directly into comment box in Detail View
  const handleDetailCommentPaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items || !detailedIssue) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const blob = item.getAsFile();
        if (!blob) continue;

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `screenshot_${timestamp}.png`;
        const file = new File([blob], filename, { type: blob.type || 'image/png' });

        setUploadingDetailScreenshot(true);
        const placeholder = `\n![Uploading ${filename}...]()\n`;
        setDetailCommentText((prev) => prev + placeholder);

        try {
          const uploaded = await api.uploadAttachment(detailedIssue.id, file);
          setDetailCommentText((prev) =>
            prev.replace(placeholder, `\n![${filename}](${uploaded.url})\n`),
          );
          showToast('Screenshot uploaded to comment');
        } catch (err: any) {
          showToast(err.message || 'Failed to upload pasted screenshot', 'info');
          setDetailCommentText((prev) => prev.replace(placeholder, ''));
        } finally {
          setUploadingDetailScreenshot(false);
        }
        break;
      }
    }
  };

  // Upload screenshot via file picker in Detail View
  const handleDetailScreenshotSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !detailedIssue) return;

    setUploadingDetailScreenshot(true);
    const placeholder = `\n![Uploading ${file.name}...]()\n`;
    setDetailCommentText((prev) => prev + placeholder);

    try {
      const uploaded = await api.uploadAttachment(detailedIssue.id, file);
      setDetailCommentText((prev) =>
        prev.replace(placeholder, `\n![${file.name}](${uploaded.url})\n`),
      );
      showToast('Screenshot attached');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload screenshot', 'info');
      setDetailCommentText((prev) => prev.replace(placeholder, ''));
    } finally {
      setUploadingDetailScreenshot(false);
      if (detailFileInputRef.current) detailFileInputRef.current.value = '';
    }
  };

  // Handle switching to a Predefined System Filter
  const handleApplySystemFilter = (preset: SystemFilterPreset) => {
    setActiveSystemFilterId(preset.id);
    setActiveSavedFilterId(null);
    setMode('JQL');
    setJqlInput(preset.jql);
    setActiveJql(preset.jql);
    syncUrl({ jql: preset.jql, q: null, projects: null, statuses: null, priorities: null, types: null, assignee: null, sprint: null });
    showToast(`Loaded filter: ${preset.name}`, 'info');
  };

  // Handle applying a User's Saved Filter
  const handleApplySavedFilter = (filter: SavedFilterItem) => {
    setActiveSavedFilterId(filter.id);
    setActiveSystemFilterId(null);
    try {
      const criteria = JSON.parse(filter.criteria);
      if (criteria.jql) {
        setMode('JQL');
        setJqlInput(criteria.jql);
        setActiveJql(criteria.jql);
        syncUrl({ jql: criteria.jql });
      } else {
        setMode('BASIC');
        if (criteria.query !== undefined) setQuery(criteria.query);
        if (criteria.projectKeys !== undefined) setSelectedProjectKeys(criteria.projectKeys);
        if (criteria.statuses !== undefined) setSelectedStatuses(criteria.statuses);
        if (criteria.priorities !== undefined) setSelectedPriorities(criteria.priorities);
        if (criteria.types !== undefined) setSelectedTypes(criteria.types);
        if (criteria.assignee !== undefined) setSelectedAssignee(criteria.assignee);
        if (criteria.sprint !== undefined) setSelectedSprint(criteria.sprint);

        syncUrl({
          q: criteria.query || null,
          projects: criteria.projectKeys?.join(',') || null,
          statuses: criteria.statuses?.join(',') || null,
          priorities: criteria.priorities?.join(',') || null,
          types: criteria.types?.join(',') || null,
          assignee: criteria.assignee || null,
          sprint: criteria.sprint || null,
          jql: null,
        });
      }
      showToast(`Loaded saved filter: ${filter.name}`);
    } catch {
      // Fallback
    }
  };

  // Save Current Filter Preset
  const handleSaveFilter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFilterName.trim()) return;

    try {
      const criteriaPayload =
        mode === 'JQL'
          ? { jql: activeJql || jqlInput }
          : {
              query,
              projectKeys: selectedProjectKeys,
              statuses: selectedStatuses,
              priorities: selectedPriorities,
              types: selectedTypes,
              assignee: selectedAssignee,
              sprint: selectedSprint,
            };

      const created = await api.createSavedFilter(newFilterName.trim(), JSON.stringify(criteriaPayload));
      setSavedFilters((prev) => [created, ...prev]);
      setActiveSavedFilterId(created.id);
      setSaveModalOpen(false);
      setNewFilterName('');
      showToast(`Filter "${created.name}" saved successfully!`);
    } catch (err: any) {
      showToast(err.message || 'Failed to save filter', 'info');
    }
  };

  // Confirm and Execute Deletion of Saved Filter
  const handleConfirmDeleteFilter = async () => {
    if (!filterToDelete) return;
    try {
      await api.deleteSavedFilter(filterToDelete.id);
      setSavedFilters((prev) => prev.filter((f) => f.id !== filterToDelete.id));
      if (activeSavedFilterId === filterToDelete.id) {
        setActiveSavedFilterId(null);
      }
      showToast(`Filter "${filterToDelete.name}" deleted successfully`);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete filter', 'info');
    } finally {
      setFilterToDelete(null);
    }
  };

  // Reset all filters to default
  const handleResetFilters = () => {
    setQuery('');
    setSelectedProjectKeys([]);
    setSelectedTypes([]);
    setSelectedStatuses([]);
    setSelectedPriorities([]);
    setSelectedAssignee('ALL');
    setSelectedSprint('ALL');
    setJqlInput('');
    setActiveJql('');
    setActiveSavedFilterId(null);
    setActiveSystemFilterId(null);
    setSearchParams(new URLSearchParams());
    showToast('Filters cleared', 'info');
  };

  // Unified search execution handler for both Basic and JQL modes
  const handleExecuteSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (mode === 'JQL') {
      const trimmed = jqlInput.trim();
      setActiveJql(trimmed);
      syncUrl({ jql: trimmed || null });
      showToast('Executed JQL search', 'info');
    } else {
      syncUrl({
        q: query || null,
        projects: selectedProjectKeys.length > 0 ? selectedProjectKeys.join(',') : null,
        types: selectedTypes.length > 0 ? selectedTypes.join(',') : null,
        statuses: selectedStatuses.length > 0 ? selectedStatuses.join(',') : null,
        priorities: selectedPriorities.length > 0 ? selectedPriorities.join(',') : null,
        assignee: selectedAssignee !== 'ALL' ? selectedAssignee : null,
        sprint: selectedSprint !== 'ALL' ? selectedSprint : null,
      });
      showToast(`Applied search filters (${filteredIssues.length} issues)`, 'info');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Key',
      'Title',
      'Project',
      'Type',
      'Status',
      'Priority',
      'Sprint',
      'Assignee',
      'Reporter',
      'Logged Hours',
      'Estimated Hours',
      'Created At',
    ];
    const rows = filteredIssues.map((i) => [
      i.key,
      `"${i.title.replace(/"/g, '""')}"`,
      i.projectName || i.projectKey || 'CORE',
      i.issueType || 'BUG',
      i.status,
      i.priority,
      i.sprint || 'Backlog',
      i.assignee?.fullName || 'Unassigned',
      i.reporter?.fullName || 'Anonymous',
      i.loggedHours || 0,
      i.estimatedHours || 0,
      new Date(i.createdAt).toISOString().split('T')[0],
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `jira-search-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV export downloaded');
  };

  // Share / Copy current search URL
  const handleShareSearchUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('Search link copied to clipboard!');
  };

  // 1-Click Multi-select toggle helpers
  const toggleArrayItem = (list: string[], item: string, setter: (val: string[]) => void, paramName: string) => {
    const next = list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
    setter(next);
    syncUrl({ [paramName]: next.length > 0 ? next.join(',') : null });
  };

  const handleSortToggle = (column: 'createdAt' | 'priority' | 'updatedAt' | 'key' | 'title') => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const activeFiltersCount =
    (query ? 1 : 0) +
    selectedProjectKeys.length +
    selectedTypes.length +
    selectedStatuses.length +
    selectedPriorities.length +
    (selectedAssignee !== 'ALL' ? 1 : 0) +
    (selectedSprint !== 'ALL' ? 1 : 0);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'open' as const;
      case 'IN_PROGRESS':
        return 'in-progress' as const;
      case 'REVIEW':
        return 'review' as const;
      case 'RESOLVED':
        return 'resolved' as const;
      case 'CLOSED':
        return 'closed' as const;
      default:
        return 'neutral' as const;
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'critical' as const;
      case 'HIGH':
        return 'high' as const;
      case 'MEDIUM':
        return 'medium' as const;
      case 'LOW':
        return 'low' as const;
      default:
        return 'neutral' as const;
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-5 space-y-4 animate-in fade-in duration-200">
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 p-3.5 rounded-2xl bg-[var(--md-sys-color-inverse-surface)] text-[var(--md-sys-color-inverse-on-surface)] shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header: Title & Layout Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[var(--md-sys-color-primary)] uppercase tracking-wider bg-[var(--md-sys-color-primary-container)] px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3" />
              <span>Search System</span>
            </span>
            {activeSavedFilterId && (
              <span className="text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1 bg-[var(--md-sys-color-surface-container-low)] px-2.5 py-0.5 rounded-full">
                <Bookmark className="w-3 h-3 text-[var(--md-sys-color-primary)]" />
                <span>Preset: {savedFilters.find((f) => f.id === activeSavedFilterId)?.name}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-xl sm:text-2xl font-black text-[var(--md-sys-color-on-surface)] tracking-tight">
              Search & Filters
            </h1>
            <Badge variant="primary" size="md" className="rounded-full font-bold px-3 py-0.5">
              {filteredIssues.length} {filteredIssues.length === 1 ? 'issue' : 'issues'}
            </Badge>
          </div>
        </div>

        {/* Action Controls & Layout Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Switcher (List vs Detail Split-View) */}
          <div className="inline-flex rounded-full p-1 bg-[var(--md-sys-color-surface-container-low)]">
            <Tooltip content="Table List View">
              <button
                type="button"
                onClick={() => {
                  setLayout('LIST');
                  syncUrl({ layout: 'LIST' });
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  layout === 'LIST'
                    ? 'bg-[var(--md-sys-color-surface-container-lowest)] text-[var(--md-sys-color-primary)] shadow-xs font-bold'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">List</span>
              </button>
            </Tooltip>
            <Tooltip content="Jira 2-Pane Detail View">
              <button
                type="button"
                onClick={() => {
                  setLayout('DETAIL');
                  syncUrl({ layout: 'DETAIL' });
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  layout === 'DETAIL'
                    ? 'bg-[var(--md-sys-color-surface-container-lowest)] text-[var(--md-sys-color-primary)] shadow-xs font-bold'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                <Columns2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Detail</span>
              </button>
            </Tooltip>
          </div>

          <Tooltip content="Share search link">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleShareSearchUrl}
              leftIcon={<Share2 className="w-3.5 h-3.5" />}
            >
              Share
            </Button>
          </Tooltip>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={filteredIssues.length === 0}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export
          </Button>

          <Button
            type="button"
            variant="filled"
            size="sm"
            onClick={() => setSaveModalOpen(true)}
            leftIcon={<BookmarkPlus className="w-3.5 h-3.5" />}
          >
            Save Filter
          </Button>
        </div>
      </div>

      {/* Prominent Jira Quick System & Starred Presets Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[var(--md-sys-color-primary)]" />
          <span>Quick:</span>
        </span>

        {systemFilters.map((preset) => {
          const Icon = preset.icon;
          const isActive = activeSystemFilterId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleApplySystemFilter(preset)}
              className={`px-3.5 py-1.5 rounded-full font-medium shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
                isActive
                  ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shadow-xs font-semibold'
                  : 'bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)]'
              }`}
              title={preset.description}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{preset.name}</span>
            </button>
          );
        })}

        {/* User Starred Filters */}
        {savedFilters
          .filter((f) => starredFilterIds.includes(f.id))
          .map((f) => {
            const isActive = activeSavedFilterId === f.id;
            return (
              <button
                key={`starred-${f.id}`}
                type="button"
                onClick={() => handleApplySavedFilter(f)}
                className={`px-3.5 py-1.5 rounded-full font-medium shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-semibold shadow-xs'
                    : 'bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)]'
                }`}
              >
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{f.name}</span>
              </button>
            );
          })}

        {savedFilters.length > 0 && (
          <button
            type="button"
            onClick={() => setManageFiltersModalOpen(true)}
            className="px-3 py-1.5 rounded-full text-[11px] font-semibold text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary-container)]/30 bg-[var(--md-sys-color-surface-container-low)] shrink-0 ml-1 cursor-pointer transition-colors"
          >
            Manage Filters ({savedFilters.length})
          </button>
        )}
      </div>

      {/* Directly Accessible Consolidated Interactive Search & Filter Panel (M3 Tonal Surface) */}
      <form
        onSubmit={handleExecuteSearch}
        className="bg-[var(--md-sys-color-surface-container-low)] rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-xs"
      >
        {/* Top Row: Search Input / JQL Input + Mode Switcher + Single Search Button + Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {mode === 'BASIC' ? (
            <div className="flex-1 min-w-[240px] relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  syncUrl({ q: e.target.value });
                }}
                placeholder="Search issues by summary, description, comments, or key (Press '/' to focus)..."
                className="w-full text-xs sm:text-sm pl-10 pr-16 py-2.5 rounded-full bg-[var(--md-sys-color-surface-container)] focus:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border-0 focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)] font-medium transition-all"
              />
              <div className="absolute right-3.5 top-2.5 flex items-center gap-1.5">
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      syncUrl({ q: null });
                    }}
                    className="text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] p-0.5 cursor-pointer"
                    title="Clear search text"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-medium text-[var(--md-sys-color-on-surface-variant)] bg-[var(--md-sys-color-surface-container-high)] rounded border border-[var(--md-sys-color-outline-variant)]">
                  /
                </kbd>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-w-[240px] relative">
              <textarea
                ref={jqlInputRef}
                rows={2}
                value={jqlInput}
                onChange={(e) => setJqlInput(e.target.value)}
                placeholder='e.g. project IN ("CORE", "BT") AND status = "OPEN" AND assignee = currentUser() ORDER BY priority DESC (Press "/" to focus)'
                className="w-full font-mono text-xs p-3 pr-16 rounded-2xl bg-[var(--md-sys-color-surface-container)] focus:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border-0 focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)] transition-all resize-none"
              />
              <div className="absolute right-3.5 top-3 flex items-center gap-1.5">
                {jqlInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setJqlInput('');
                      setActiveJql('');
                      syncUrl({ jql: null });
                    }}
                    className="text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] p-0.5 cursor-pointer"
                    title="Clear JQL query"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-medium text-[var(--md-sys-color-on-surface-variant)] bg-[var(--md-sys-color-surface-container-high)] rounded border border-[var(--md-sys-color-outline-variant)]">
                  /
                </kbd>
              </div>
            </div>
          )}

          {/* Unified Controls & The Single Search Button */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-between sm:justify-end">
            {/* Mode Switcher Pill */}
            <div className="inline-flex rounded-full p-1 bg-[var(--md-sys-color-surface-container)]">
              <button
                type="button"
                onClick={() => {
                  setMode('BASIC');
                  syncUrl({ jql: null });
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  mode === 'BASIC'
                    ? 'bg-[var(--md-sys-color-surface-container-lowest)] text-[var(--md-sys-color-primary)] shadow-xs'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                Basic Filters
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('JQL');
                  if (!jqlInput) {
                    const generated = buildJqlFromFilters({
                      query,
                      projectKey: selectedProjectKeys.length === 1 ? selectedProjectKeys[0] : undefined,
                      statuses: selectedStatuses,
                      priorities: selectedPriorities,
                      issueTypes: selectedTypes,
                      assignee: selectedAssignee,
                      sprint: selectedSprint,
                      sortBy,
                      sortOrder,
                    });
                    setJqlInput(generated);
                    setActiveJql(generated);
                    syncUrl({ jql: generated });
                  }
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  mode === 'JQL'
                    ? 'bg-[var(--md-sys-color-surface-container-lowest)] text-[var(--md-sys-color-primary)] shadow-xs'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>JQL Advanced</span>
              </button>
            </div>

            {/* The One Unified Search Button */}
            <Button
              type="submit"
              variant="filled"
              size="sm"
              className="rounded-full px-4 font-semibold shadow-xs shrink-0"
              leftIcon={<Search className="w-3.5 h-3.5" />}
            >
              Search
            </Button>

            {/* Reset All Filters Button */}
            {(activeFiltersCount > 0 || mode === 'JQL' || query) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-error)] flex items-center gap-1 transition-colors cursor-pointer px-2.5 py-1.5 rounded-full hover:bg-[var(--md-sys-color-surface-container-high)]"
                title="Reset all search filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Second Row: 1-Click Dropdowns (Basic Mode) OR Helper Chips & Status (JQL Mode) */}
        {mode === 'BASIC' ? (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--md-sys-color-surface-container-high)]/50">
            {/* Projects Multi-Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                    selectedProjectKeys.length > 0
                      ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-semibold shadow-xs'
                      : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                  }`}
                >
                  <FolderGit2 className="w-3.5 h-3.5 opacity-70" />
                  <span>
                    Project: {selectedProjectKeys.length === 0 ? 'All' : selectedProjectKeys.join(', ')}
                  </span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 p-1.5">
                <div className="px-2 py-1 text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
                  Select Projects
                </div>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedProjectKeys([]);
                    syncUrl({ projects: null });
                  }}
                  className="flex items-center justify-between text-xs cursor-pointer"
                >
                  <span>All Projects</span>
                  {selectedProjectKeys.length === 0 && <Check className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {projects.map((p) => {
                  const isChecked = selectedProjectKeys.includes(p.key);
                  return (
                    <DropdownMenuItem
                      key={p.id}
                      onSelect={(e) => {
                        e.preventDefault();
                      }}
                      onClick={() => {
                        toggleArrayItem(selectedProjectKeys, p.key, setSelectedProjectKeys, 'projects');
                      }}
                      className="flex items-center justify-between text-xs cursor-pointer"
                    >
                      <span className="truncate">
                        {p.name} <span className="font-mono opacity-60 font-bold">({p.key})</span>
                      </span>
                      {isChecked && <Check className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Issue Type Multi-Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                    selectedTypes.length > 0
                      ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-semibold shadow-xs'
                      : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5 opacity-70" />
                  <span>Type: {selectedTypes.length === 0 ? 'All' : selectedTypes.join(', ')}</span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 p-1.5">
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedTypes([]);
                    syncUrl({ types: null });
                  }}
                  className="flex items-center justify-between text-xs cursor-pointer"
                >
                  <span>All Types</span>
                  {selectedTypes.length === 0 && <Check className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {(['BUG', 'TASK', 'FEATURE', 'IMPROVEMENT'] as IssueType[]).map((t) => {
                  const isChecked = selectedTypes.includes(t);
                  return (
                    <DropdownMenuItem
                      key={t}
                      onSelect={(e) => {
                        e.preventDefault();
                      }}
                      onClick={() => {
                        toggleArrayItem(selectedTypes, t, setSelectedTypes, 'types');
                      }}
                      className="flex items-center justify-between text-xs cursor-pointer"
                    >
                      <span>{t}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Status Multi-Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                    selectedStatuses.length > 0
                      ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-semibold shadow-xs'
                      : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                  }`}
                >
                  <span>Status: {selectedStatuses.length === 0 ? 'All' : selectedStatuses.join(', ')}</span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52 p-1.5">
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedStatuses([]);
                    syncUrl({ statuses: null });
                  }}
                  className="flex items-center justify-between text-xs cursor-pointer"
                >
                  <span>All Statuses</span>
                  {selectedStatuses.length === 0 && <Check className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {(['OPEN', 'IN_PROGRESS', 'REVIEW', 'RESOLVED', 'CLOSED'] as IssueStatus[]).map((st) => {
                  const isChecked = selectedStatuses.includes(st);
                  return (
                    <DropdownMenuItem
                      key={st}
                      onSelect={(e) => {
                        e.preventDefault();
                      }}
                      onClick={() => {
                        toggleArrayItem(selectedStatuses, st, setSelectedStatuses, 'statuses');
                      }}
                      className="flex items-center justify-between text-xs cursor-pointer"
                    >
                      <Badge variant={getStatusBadgeVariant(st)} size="sm">
                        {st}
                      </Badge>
                      {isChecked && <Check className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Priority Multi-Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                    selectedPriorities.length > 0
                      ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-semibold shadow-xs'
                      : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                  }`}
                >
                  <span>
                    Priority: {selectedPriorities.length === 0 ? 'All' : selectedPriorities.join(', ')}
                  </span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 p-1.5">
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedPriorities([]);
                    syncUrl({ priorities: null });
                  }}
                  className="flex items-center justify-between text-xs cursor-pointer"
                >
                  <span>All Priorities</span>
                  {selectedPriorities.length === 0 && (
                    <Check className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as IssuePriority[]).map((pr) => {
                  const isChecked = selectedPriorities.includes(pr);
                  return (
                    <DropdownMenuItem
                      key={pr}
                      onSelect={(e) => {
                        e.preventDefault();
                      }}
                      onClick={() => {
                        toggleArrayItem(selectedPriorities, pr, setSelectedPriorities, 'priorities');
                      }}
                      className="flex items-center justify-between text-xs cursor-pointer"
                    >
                      <Badge variant={getPriorityBadgeVariant(pr)} size="sm">
                        {pr}
                      </Badge>
                      {isChecked && <Check className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Assignee Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                    selectedAssignee !== 'ALL'
                      ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-semibold shadow-xs'
                      : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                  }`}
                >
                  <span>
                    Assignee:{' '}
                    {selectedAssignee === 'ALL'
                      ? 'All'
                      : selectedAssignee === 'ME'
                      ? 'Current User (Me)'
                      : selectedAssignee === 'UNASSIGNED'
                      ? 'Unassigned'
                      : assignees.find((a) => String(a.id) === selectedAssignee)?.fullName || selectedAssignee}
                  </span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 p-1.5 max-h-64 overflow-y-auto">
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedAssignee('ALL');
                    syncUrl({ assignee: null });
                  }}
                  className="flex items-center justify-between text-xs cursor-pointer"
                >
                  <span>All Assignees</span>
                  {selectedAssignee === 'ALL' && <Check className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedAssignee('ME');
                    syncUrl({ assignee: 'ME' });
                  }}
                  className="flex items-center justify-between text-xs font-semibold cursor-pointer"
                >
                  <span>Current User (Me)</span>
                  {selectedAssignee === 'ME' && <Check className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedAssignee('UNASSIGNED');
                    syncUrl({ assignee: 'UNASSIGNED' });
                  }}
                  className="flex items-center justify-between text-xs cursor-pointer text-[var(--md-sys-color-on-surface-variant)]"
                >
                  <span>Unassigned</span>
                  {selectedAssignee === 'UNASSIGNED' && (
                    <Check className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {assignees.map((u) => (
                  <DropdownMenuItem
                    key={u.id}
                    onClick={() => {
                      setSelectedAssignee(String(u.id));
                      syncUrl({ assignee: String(u.id) });
                    }}
                    className="flex items-center justify-between text-xs cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <Avatar name={u.fullName} avatarUrl={u.avatarUrl} size="xs" />
                      <span className="truncate">{u.fullName}</span>
                    </div>
                    {selectedAssignee === String(u.id) && (
                      <Check className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sprint Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                    selectedSprint !== 'ALL'
                      ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-semibold shadow-xs'
                      : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 opacity-70" />
                  <span>Sprint: {selectedSprint === 'ALL' ? 'All' : selectedSprint}</span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52 p-1.5">
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedSprint('ALL');
                    syncUrl({ sprint: null });
                  }}
                  className="flex items-center justify-between text-xs cursor-pointer"
                >
                  <span>All Sprints</span>
                  {selectedSprint === 'ALL' && <Check className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedSprint('BACKLOG');
                    syncUrl({ sprint: 'BACKLOG' });
                  }}
                  className="flex items-center justify-between text-xs cursor-pointer"
                >
                  <span>Backlog (No Sprint)</span>
                  {selectedSprint === 'BACKLOG' && (
                    <Check className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {allSprints.map((s) => (
                  <DropdownMenuItem
                    key={s}
                    onClick={() => {
                      setSelectedSprint(s);
                      syncUrl({ sprint: s });
                    }}
                    className="flex items-center justify-between text-xs cursor-pointer"
                  >
                    <span>{s}</span>
                    {selectedSprint === s && <Check className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          /* JQL Helper Chips & Syntax Validation */
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--md-sys-color-surface-container-high)]/50 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
                Insert:
              </span>
              {[
                'project = "CORE"',
                'status = "OPEN"',
                'assignee = currentUser()',
                'priority = "CRITICAL"',
                'sprint is EMPTY',
                'ORDER BY createdAt DESC',
              ].map((token) => (
                <button
                  key={token}
                  type="button"
                  onClick={() => setJqlInput((prev) => (prev ? `${prev} AND ${token}` : token))}
                  className="px-2.5 py-1 rounded-full bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] font-mono text-[11px] text-[var(--md-sys-color-primary)] cursor-pointer transition-colors"
                >
                  +{token}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {parsedJqlQuery.isValid ? (
                <span className="text-[11px] font-semibold text-emerald-500 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Valid JQL</span>
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-rose-500 flex items-center gap-1">
                  <X className="w-3.5 h-3.5" />
                  <span>{parsedJqlQuery.errorMessage || 'Invalid JQL'}</span>
                </span>
              )}
            </div>
          </div>
        )}
      </form>

      {/* Main Content Area: Loading / Empty / List View / Detail 2-Pane View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--md-sys-color-primary)]" />
          <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">
            Loading issue index & query results...
          </span>
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="bg-[var(--md-sys-color-surface-container-low)] rounded-3xl p-8 sm:p-12 text-center space-y-3">
          <Filter className="w-10 h-10 mx-auto text-[var(--md-sys-color-on-surface-variant)] opacity-40" />
          <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
            No matching issues found
          </h3>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] max-w-sm mx-auto">
            Try adjusting your search criteria, clearing specific filters, or executing a broader JQL query.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetFilters}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Clear Filters
          </Button>
        </div>
      ) : layout === 'LIST' ? (
        /* 1. Full-Width Table List View */
        <div className="bg-[var(--md-sys-color-surface-container-low)] rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse table-auto">
              <thead>
                <tr className="bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider text-[10px]">
                  <th
                    className="py-3 px-4 font-bold cursor-pointer hover:text-[var(--md-sys-color-primary)] transition-colors"
                    onClick={() => handleSortToggle('key')}
                  >
                    Key {sortBy === 'key' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th
                    className="py-3 px-4 font-bold cursor-pointer hover:text-[var(--md-sys-color-primary)] transition-colors"
                    onClick={() => handleSortToggle('title')}
                  >
                    Summary {sortBy === 'title' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="py-3 px-4 font-bold">Project</th>
                  <th className="py-3 px-4 font-bold">Type</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th
                    className="py-3 px-4 font-bold cursor-pointer hover:text-[var(--md-sys-color-primary)] transition-colors"
                    onClick={() => handleSortToggle('priority')}
                  >
                    Priority {sortBy === 'priority' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="py-3 px-4 font-bold">Sprint</th>
                  <th className="py-3 px-4 font-bold">Assignee</th>
                  <th className="py-3 px-4 font-bold text-right">Logged / Est</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--md-sys-color-surface-container-high)]">
                {filteredIssues.map((issue) => (
                  <tr
                    key={issue.id}
                    className="hover:bg-[var(--md-sys-color-surface-container)]/70 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-[var(--md-sys-color-primary)] whitespace-nowrap">
                      <Link
                        to={`/issues/${issue.key || issue.id}`}
                        className="hover:underline flex items-center gap-1"
                      >
                        {issue.key}
                      </Link>
                    </td>

                    <td className="py-3 px-4 max-w-md">
                      <Link
                        to={`/issues/${issue.key || issue.id}`}
                        className="font-semibold text-[var(--md-sys-color-on-surface)] hover:text-[var(--md-sys-color-primary)] transition-colors block truncate"
                        title={issue.title}
                      >
                        {issue.title}
                      </Link>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1">
                        <FolderGit2 className="w-3 h-3 opacity-60" />
                        {issue.projectName || issue.projectKey || 'CORE'}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)]">
                        {issue.issueType || 'BUG'}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge variant={getStatusBadgeVariant(issue.status)} size="sm">
                        {issue.status}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge variant={getPriorityBadgeVariant(issue.priority)} size="sm">
                        {issue.priority}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {issue.sprint ? (
                        <span className="text-[11px] font-semibold text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/60 px-2.5 py-0.5 rounded-full flex items-center gap-1 w-max">
                          <Layers className="w-3 h-3" />
                          <span>{issue.sprint}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] opacity-60">
                          Backlog
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {issue.assignee ? (
                        <div className="flex items-center gap-1.5">
                          <Avatar
                            name={issue.assignee.fullName}
                            avatarUrl={issue.assignee.avatarUrl}
                            role={issue.assignee.systemRole}
                            size="xs"
                          />
                          <span className="truncate max-w-[120px] font-medium text-[var(--md-sys-color-on-surface)] text-xs">
                            {issue.assignee.fullName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] italic opacity-60">
                          Unassigned
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-right whitespace-nowrap text-xs">
                      <span className="text-[var(--md-sys-color-success)] font-bold">
                        {issue.loggedHours || 0}h
                      </span>
                      <span className="text-[var(--md-sys-color-on-surface-variant)] opacity-50 mx-1">/</span>
                      <span className="text-[var(--md-sys-color-on-surface-variant)]">
                        {issue.estimatedHours || 0}h
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* 2. Jira 2-Pane Split / Detail View */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left Pane (35% width / 4 cols) - Scrollable list of matched issues */}
          <div className="lg:col-span-4 space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
            {filteredIssues.map((issue) => {
              const isSelected = activeSelectedKey?.toLowerCase() === issue.key.toLowerCase();
              return (
                <div
                  key={issue.id}
                  onClick={() => {
                    setSelectedIssueKey(issue.key);
                    syncUrl({ issue: issue.key });
                  }}
                  className={`p-3.5 rounded-2xl transition-all cursor-pointer text-xs space-y-2 ${
                    isSelected
                      ? 'bg-[var(--md-sys-color-primary-container)]/30 ring-2 ring-[var(--md-sys-color-primary)] shadow-xs'
                      : 'bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="font-mono font-bold text-[var(--md-sys-color-primary)]">
                      {issue.key}
                    </span>
                    <Badge variant={getStatusBadgeVariant(issue.status)} size="sm">
                      {issue.status}
                    </Badge>
                  </div>
                  <h4 className="font-semibold text-[var(--md-sys-color-on-surface)] line-clamp-2 leading-snug">
                    {issue.title}
                  </h4>
                  <div className="flex items-center justify-between pt-1 border-t border-[var(--md-sys-color-surface-container-high)] text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                    <Badge variant={getPriorityBadgeVariant(issue.priority)} size="sm">
                      {issue.priority}
                    </Badge>
                    <span>{issue.assignee?.fullName || 'Unassigned'}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Pane (65% width / 8 cols) - Full Interactive Issue Inspector with Comments */}
          <div className="lg:col-span-8">
            {loadingDetail ? (
              <div className="flex flex-col items-center justify-center p-12 bg-[var(--md-sys-color-surface-container-low)] rounded-3xl gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--md-sys-color-primary)]" />
                <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                  Loading full ticket details & comments...
                </span>
              </div>
            ) : detailedIssue ? (
              <div className="bg-[var(--md-sys-color-surface-container-low)] rounded-3xl p-5 sm:p-6 space-y-5 shadow-xs">
                {/* Header & Full Page Link */}
                <div className="flex items-start justify-between gap-4 border-b border-[var(--md-sys-color-surface-container-high)] pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-sm text-[var(--md-sys-color-primary)]">
                        {detailedIssue.key}
                      </span>
                      <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
                        • {detailedIssue.projectName || detailedIssue.projectKey}
                      </span>
                      <Badge variant={getStatusBadgeVariant(detailedIssue.status)} size="sm">
                        {detailedIssue.status}
                      </Badge>
                    </div>
                    <h2 className="text-lg font-bold text-[var(--md-sys-color-on-surface)]">
                      {detailedIssue.title}
                    </h2>
                  </div>

                  <Link
                    to={`/issues/${detailedIssue.key}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-xs font-semibold text-[var(--md-sys-color-primary)] shrink-0 transition-colors"
                  >
                    <span>Full Page</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Attributes Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider block">
                      Assignee
                    </span>
                    <span className="font-semibold text-[var(--md-sys-color-on-surface)] mt-0.5 block truncate">
                      {detailedIssue.assignee?.fullName || 'Unassigned'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider block">
                      Priority
                    </span>
                    <span className="font-semibold text-[var(--md-sys-color-on-surface)] mt-0.5 block">
                      {detailedIssue.priority}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider block">
                      Sprint
                    </span>
                    <span className="font-semibold text-[var(--md-sys-color-on-surface)] mt-0.5 block">
                      {detailedIssue.sprint || 'Backlog'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider block">
                      Time Logged
                    </span>
                    <span className="font-mono font-semibold text-[var(--md-sys-color-success)] mt-0.5 block">
                      {detailedIssue.loggedHours || 0}h / {detailedIssue.estimatedHours || 0}h
                    </span>
                  </div>
                </div>

                {/* Description with Markdown & Screenshot Rendering */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
                    Description
                  </h3>
                  <div className="p-4.5 rounded-2xl bg-[var(--md-sys-color-surface-container-lowest)] text-xs">
                    <MarkdownContent
                      content={detailedIssue.description}
                      onImageClick={(url, title) => {
                        setPreviewImageUrl(url);
                        setPreviewImageTitle(title || detailedIssue.title);
                      }}
                    />
                  </div>
                </div>

                {/* Complete Discussion Comments Thread & Inline Post Box */}
                <div className="space-y-3 pt-2 border-t border-[var(--md-sys-color-surface-container-high)]">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                      <span>Discussion & Activity ({detailedIssue.comments?.length || 0})</span>
                    </h3>
                  </div>

                  {/* Inline Comment Post Form with Screenshot Paste */}
                  <form onSubmit={handleAddDetailComment} className="space-y-2">
                    <div className="rounded-2xl bg-[var(--md-sys-color-surface-container)] focus-within:bg-[var(--md-sys-color-surface-container-lowest)] focus-within:ring-2 focus-within:ring-[var(--md-sys-color-primary)] transition-all overflow-hidden">
                      <textarea
                        rows={2}
                        value={detailCommentText}
                        onChange={(e) => setDetailCommentText(e.target.value)}
                        onPaste={handleDetailCommentPaste}
                        placeholder="Add a comment or paste screenshot (Ctrl+V)..."
                        className="w-full p-3.5 bg-transparent text-[var(--md-sys-color-on-surface)] text-xs resize-y min-h-[60px] outline-hidden placeholder:text-[var(--md-sys-color-on-surface-variant)]/60 font-sans leading-relaxed"
                      />
                      <div className="flex items-center justify-between px-3.5 py-2 bg-[var(--md-sys-color-surface-container-high)]/50">
                        <div className="flex items-center gap-2">
                          <input
                            ref={detailFileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleDetailScreenshotSelect}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => detailFileInputRef.current?.click()}
                            disabled={uploadingDetailScreenshot}
                            className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>{uploadingDetailScreenshot ? 'Uploading...' : 'Attach Image'}</span>
                          </button>
                        </div>
                        <Button
                          type="submit"
                          variant="filled"
                          size="sm"
                          disabled={!detailCommentText.trim() || uploadingDetailScreenshot}
                          isLoading={submittingDetailComment}
                          rightIcon={<Send className="w-3 h-3" />}
                        >
                          Send
                        </Button>
                      </div>
                    </div>
                  </form>

                  {/* Comments List */}
                  <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                    {(!detailedIssue.comments || detailedIssue.comments.length === 0) ? (
                      <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] italic text-center py-4">
                        No comments on this issue yet.
                      </p>
                    ) : (
                      detailedIssue.comments.map((c) => (
                        <div
                          key={c.id}
                          className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] text-xs space-y-2"
                        >
                          <div className="flex items-center justify-between pb-1 border-b border-[var(--md-sys-color-surface-container-high)]">
                            <div className="flex items-center gap-2">
                              <Avatar
                                name={c.author.fullName}
                                avatarUrl={c.author.avatarUrl}
                                role={c.author.systemRole}
                                size="xs"
                              />
                              <span className="font-semibold text-[var(--md-sys-color-on-surface)]">
                                {c.author.fullName}
                              </span>
                            </div>
                            <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                              {new Date(c.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="pl-6 pt-0.5">
                            <MarkdownContent
                              content={c.text}
                              onImageClick={(url, title) => {
                                setPreviewImageUrl(url);
                                setPreviewImageTitle(title || `Screenshot by ${c.author.fullName}`);
                              }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Save Filter Modal */}
      <Modal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        title="Save Search Filter Preset"
        description="Pin this custom filter query to your quick bar and saved filters library."
        size="sm"
      >
        <form onSubmit={handleSaveFilter} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
              Filter Name *
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Critical Backend Bugs, Sprint 1 Open"
              value={newFilterName}
              onChange={(e) => setNewFilterName(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)] font-medium"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSaveModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="filled"
              size="sm"
              leftIcon={<Save className="w-3.5 h-3.5" />}
            >
              Save Preset
            </Button>
          </div>
        </form>
      </Modal>

      {/* Manage Filters Modal */}
      <Modal
        isOpen={manageFiltersModalOpen}
        onClose={() => setManageFiltersModalOpen(false)}
        title="Manage Saved Filters"
        description="Review, favorite, or remove your saved search presets."
        size="lg"
      >
        <div className="space-y-3 pt-2">
          {savedFilters.length === 0 ? (
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] italic text-center py-6">
              You have no saved filters yet. Save your current search using the "Save Filter" button.
            </p>
          ) : (
            <div className="divide-y divide-[var(--md-sys-color-outline-variant)]">
              {savedFilters.map((f) => {
                const isStarred = starredFilterIds.includes(f.id);
                return (
                  <div
                    key={f.id}
                    className="py-3 flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={(e) => toggleStarFilter(f.id, e)}
                        className="p-1 rounded-md hover:bg-[var(--md-sys-color-surface-container-high)] cursor-pointer"
                        title={isStarred ? 'Unfavorite' : 'Favorite (Pin to Quick Bar)'}
                      >
                        <Star
                          className={`w-4 h-4 ${
                            isStarred
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-[var(--md-sys-color-on-surface-variant)] opacity-40 hover:opacity-100'
                          }`}
                        />
                      </button>
                      <div>
                        <h4 className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
                          {f.name}
                        </h4>
                        <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                          Created {new Date(f.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleApplySavedFilter(f);
                          setManageFiltersModalOpen(false);
                        }}
                      >
                        Apply Filter
                      </Button>
                      <Tooltip content="Delete filter preset">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFilterToDelete(f);
                          }}
                          className="p-1.5 rounded-lg text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)]/40 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Popup Modal */}
      <Modal
        isOpen={!!filterToDelete}
        onClose={() => setFilterToDelete(null)}
        title="Delete Saved Filter"
        size="sm"
      >
        <div className="space-y-4 pt-1 text-xs">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--md-sys-color-error-container)]/30 border border-[var(--md-sys-color-error)]/30 text-[var(--md-sys-color-on-error-container)]">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-500">
                Are you sure you want to delete this filter?
              </p>
              <p className="mt-1 opacity-90 leading-relaxed">
                Filter preset <strong className="font-bold">"{filterToDelete?.name}"</strong> will be permanently removed from your dashboard and saved filters list.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFilterToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="filled"
              size="sm"
              onClick={handleConfirmDeleteFilter}
              className="bg-[var(--md-sys-color-error)] text-[var(--md-sys-color-on-error)] hover:bg-[var(--md-sys-color-error)]/90"
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Delete Filter
            </Button>
          </div>
        </div>
      </Modal>

      {/* Image Lightbox Preview Modal */}
      <Modal
        isOpen={!!previewImageUrl}
        onClose={() => {
          setPreviewImageUrl(null);
          setPreviewImageTitle(null);
        }}
        size="2xl"
        title={previewImageTitle || 'Screenshot Preview'}
        footer={
          previewImageUrl ? (
            <a
              href={previewImageUrl}
              download={previewImageTitle || 'screenshot.png'}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-semibold hover:brightness-105"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download High-Res</span>
            </a>
          ) : null
        }
      >
        {previewImageUrl && (
          <div className="flex flex-col items-center justify-center p-3 bg-black/5 dark:bg-black/20 rounded-xl overflow-hidden min-h-[220px]">
            <img
              src={previewImageUrl}
              alt={previewImageTitle || 'Preview'}
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-md"
            />
          </div>
        )}
      </Modal>
    </div>
  );
};
