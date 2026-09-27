import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  api,
  type IssueItem,
  type ProjectItem,
  type UserProfile,
  type IssueStatus,
} from '../api/client';
import { useAuth } from '../context/AuthContext';
import { SearchToolbar } from '../components/search/SearchToolbar';
import { BasicFilterBar } from '../components/search/BasicFilterBar';
import { JqlEditorBar } from '../components/search/JqlEditorBar';
import { SearchResultsTable } from '../components/search/SearchResultsTable';
import { SearchSplitView } from '../components/search/SearchSplitView';
import { SaveFilterModal } from '../components/search/SaveFilterModal';
import { ManageFiltersModal } from '../components/search/ManageFiltersModal';
import { IssueDetailsModal } from '../components/kanban/IssueDetailsModal';
import type {
  SearchMode,
  ViewLayout,
  BasicFilterCriteria,
  SavedFilterPreset,
} from '../types/search';
import {
  parseJql,
  evaluateJql,
  buildJqlFromFilters,
} from '../utils/jqlParser';
import { Loader2 } from 'lucide-react';

const SAVED_FILTERS_STORAGE_KEY = 'bugtracker_saved_filters';

export const AdvancedSearchPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Core Data
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search Mode & Layout View
  const [mode, setMode] = useState<SearchMode>(() => {
    const m = searchParams.get('mode');
    return m === 'jql' ? 'jql' : 'basic';
  });
  const [viewLayout, setViewLayout] = useState<ViewLayout>(() => {
    const l = searchParams.get('layout');
    return l === 'detail' ? 'detail' : 'list';
  });

  // Query and Filters state
  const [searchQuery, setSearchQuery] = useState<string>(() => searchParams.get('q') || '');
  const [jqlQuery, setJqlQuery] = useState<string>(() => searchParams.get('jql') || '');

  const [basicFilters, setBasicFilters] = useState<BasicFilterCriteria>(() => ({
    projectKey: searchParams.get('project') || 'ALL',
    issueTypes: searchParams.get('type') ? searchParams.get('type')!.split(',') : [],
    statuses: searchParams.get('status') ? searchParams.get('status')!.split(',') : [],
    priorities: searchParams.get('priority') ? searchParams.get('priority')!.split(',') : [],
    assignee: searchParams.get('assignee') || 'ALL',
    sprint: searchParams.get('sprint') || 'ALL',
  }));

  // Sorting
  const [sortBy, setSortBy] = useState<string>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Selected Issue for Split View / Details Modal
  const [selectedIssueId, setSelectedIssueId] = useState<number | null>(null);
  const [detailsModalIssue, setDetailsModalIssue] = useState<IssueItem | null>(null);

  // Saved Filters
  const [savedFilters, setSavedFilters] = useState<SavedFilterPreset[]>(() => {
    try {
      const stored = localStorage.getItem(SAVED_FILTERS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Modals
  const [saveModalOpen, setSaveModalOpen] = useState<boolean>(false);
  const [manageFiltersOpen, setManageFiltersOpen] = useState<boolean>(false);

  // Sync Saved Filters to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SAVED_FILTERS_STORAGE_KEY, JSON.stringify(savedFilters));
    } catch (e) {
      console.error('Failed to persist saved filters:', e);
    }
  }, [savedFilters]);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [issuesRes, projectsRes, usersRes] = await Promise.all([
        api.getIssues(),
        api.getProjects(),
        api.getUsers(1, 100),
      ]);
      setIssues(issuesRes);
      setProjects(projectsRes);
      setUsers(usersRes.items || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load search data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sync URL search parameters
  const updateUrlParams = useCallback(() => {
    const params = new URLSearchParams();
    if (mode === 'jql') {
      params.set('mode', 'jql');
      if (jqlQuery.trim()) params.set('jql', jqlQuery);
    } else {
      if (searchQuery.trim()) params.set('q', searchQuery);
      if (basicFilters.projectKey && basicFilters.projectKey !== 'ALL') {
        params.set('project', basicFilters.projectKey);
      }
      if (basicFilters.issueTypes.length > 0) {
        params.set('type', basicFilters.issueTypes.join(','));
      }
      if (basicFilters.statuses.length > 0) {
        params.set('status', basicFilters.statuses.join(','));
      }
      if (basicFilters.priorities.length > 0) {
        params.set('priority', basicFilters.priorities.join(','));
      }
      if (basicFilters.assignee && basicFilters.assignee !== 'ALL') {
        params.set('assignee', basicFilters.assignee);
      }
      if (basicFilters.sprint && basicFilters.sprint !== 'ALL') {
        params.set('sprint', basicFilters.sprint);
      }
    }
    if (viewLayout !== 'list') {
      params.set('layout', viewLayout);
    }
    setSearchParams(params, { replace: true });
  }, [mode, jqlQuery, searchQuery, basicFilters, viewLayout, setSearchParams]);

  useEffect(() => {
    updateUrlParams();
  }, [updateUrlParams]);

  // Compute effective JQL representation
  const effectiveJql = useMemo(() => {
    if (mode === 'jql') return jqlQuery;
    return buildJqlFromFilters({
      query: searchQuery,
      projectKey: basicFilters.projectKey,
      statuses: basicFilters.statuses,
      priorities: basicFilters.priorities,
      issueTypes: basicFilters.issueTypes,
      assignee: basicFilters.assignee,
      sprint: basicFilters.sprint,
      sortBy,
      sortOrder,
    });
  }, [mode, jqlQuery, searchQuery, basicFilters, sortBy, sortOrder]);

  // Compute filtered issues
  const filteredIssues = useMemo(() => {
    const parsed = parseJql(effectiveJql);
    return evaluateJql(issues, parsed, user?.id);
  }, [issues, effectiveJql, user?.id]);

  // Handle Switch to JQL
  const handleSwitchToJql = () => {
    const generated = buildJqlFromFilters({
      query: searchQuery,
      projectKey: basicFilters.projectKey,
      statuses: basicFilters.statuses,
      priorities: basicFilters.priorities,
      issueTypes: basicFilters.issueTypes,
      assignee: basicFilters.assignee,
      sprint: basicFilters.sprint,
      sortBy,
      sortOrder,
    });
    setJqlQuery(generated);
    setMode('jql');
  };

  // Handle Switch to Basic
  const handleSwitchToBasic = () => {
    setMode('basic');
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setBasicFilters({
      projectKey: 'ALL',
      issueTypes: [],
      statuses: [],
      priorities: [],
      assignee: 'ALL',
      sprint: 'ALL',
    });
    setJqlQuery('');
  };

  // Handle Saved Filter selection
  const handleSelectSavedFilter = (jql: string) => {
    setJqlQuery(jql);
    setMode('jql');
  };

  // Handle Saving Filter
  const handleSaveFilter = (newFilter: {
    name: string;
    description: string;
    jql: string;
    isFavorite: boolean;
  }) => {
    const created: SavedFilterPreset = {
      id: `filter_${Date.now()}`,
      ...newFilter,
      createdAt: new Date().toISOString(),
    };
    setSavedFilters((prev) => [created, ...prev]);
  };

  // Handle Toggle Star
  const handleToggleFavorite = (filterId: string) => {
    setSavedFilters((prev) =>
      prev.map((f) => (f.id === filterId ? { ...f, isFavorite: !f.isFavorite } : f)),
    );
  };

  // Handle Delete Filter
  const handleDeleteFilter = (filterId: string) => {
    setSavedFilters((prev) => prev.filter((f) => f.id !== filterId));
  };

  // Inline status update
  const handleUpdateStatus = async (issueId: number, status: IssueStatus) => {
    try {
      const updated = await api.updateIssueStatus(issueId, status);
      setIssues((prev) => prev.map((i) => (i.id === issueId ? updated : i)));
    } catch (err) {
      console.error('Failed to update issue status:', err);
    }
  };

  // Sort handling
  const handleSortChange = (column: string) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // CSV Export
  const handleExportCsv = () => {
    if (filteredIssues.length === 0) return;
    const headers = ['Key', 'Title', 'Type', 'Status', 'Priority', 'Sprint', 'Assignee', 'Created', 'Updated'];
    const rows = filteredIssues.map((issue) => [
      issue.key,
      `"${(issue.title || '').replace(/"/g, '""')}"`,
      issue.issueType,
      issue.status,
      issue.priority,
      issue.sprint || '',
      issue.assignee?.fullName || 'Unassigned',
      issue.createdAt,
      issue.updatedAt,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `issues_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // JSON Export
  const handleExportJson = () => {
    if (filteredIssues.length === 0) return;
    const blob = new Blob([JSON.stringify(filteredIssues, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `issues_export_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full min-h-full flex flex-col px-3 sm:px-5 py-4 animate-in fade-in duration-200">
      {/* Top Search & Filter Toolbar */}
      <SearchToolbar
        mode={mode}
        onModeChange={(newMode) => {
          if (newMode === 'jql' && mode === 'basic') {
            handleSwitchToJql();
          } else {
            setMode(newMode);
          }
        }}
        savedFilters={savedFilters}
        onSelectSavedFilter={handleSelectSavedFilter}
        onSaveCurrentFilter={() => setSaveModalOpen(true)}
        onManageFilters={() => setManageFiltersOpen(true)}
        viewLayout={viewLayout}
        onViewLayoutChange={setViewLayout}
        onExportCsv={handleExportCsv}
        onExportJson={handleExportJson}
        onRefresh={fetchData}
        loading={loading}
        totalResults={filteredIssues.length}
      />

      {/* Basic Filters or JQL Editor based on active search mode */}
      <div className="w-full mt-2">
        {mode === 'basic' ? (
          <BasicFilterBar
            projects={projects}
            users={users}
            filters={basicFilters}
            searchQuery={searchQuery}
            onFiltersChange={setBasicFilters}
            onSearchQueryChange={setSearchQuery}
            onClearFilters={handleClearFilters}
            onSwitchToJql={handleSwitchToJql}
          />
        ) : (
          <JqlEditorBar
            jqlQuery={jqlQuery}
            onJqlChange={setJqlQuery}
            onSearch={updateUrlParams}
            onClear={() => setJqlQuery('')}
            onSwitchToBasic={handleSwitchToBasic}
          />
        )}
      </div>

      {/* Main Results Section */}
      <div className="flex-1 flex flex-col w-full min-w-0 mt-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-[var(--md-sys-color-primary)]" />
            <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-semibold">
              Searching issues...
            </span>
          </div>
        ) : error ? (
          <div className="p-3.5 rounded-2xl bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] text-xs flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="font-bold underline ml-2 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        ) : (
          /* Search Results: Table Layout vs Split Detail View */
          <div className="flex-1 flex flex-col w-full min-w-0">
            {viewLayout === 'list' ? (
              <SearchResultsTable
                issues={filteredIssues}
                selectedIssueId={selectedIssueId}
                onSelectIssue={(issue) => setSelectedIssueId(issue.id)}
                onOpenDetailsModal={(issue) => setDetailsModalIssue(issue)}
                onUpdateStatus={handleUpdateStatus}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={handleSortChange}
              />
            ) : (
              <SearchSplitView
                issues={filteredIssues}
                selectedIssueId={selectedIssueId}
                onSelectIssue={(issue) => setSelectedIssueId(issue.id)}
                onOpenDetailsModal={(issue) => setDetailsModalIssue(issue)}
                onUpdateStatus={handleUpdateStatus}
                onIssueUpdated={(updated) => {
                  setIssues((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Save Filter Modal */}
      <SaveFilterModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        currentJql={effectiveJql}
        onSave={handleSaveFilter}
      />

      {/* Manage Filters Modal */}
      <ManageFiltersModal
        isOpen={manageFiltersOpen}
        onClose={() => setManageFiltersOpen(false)}
        savedFilters={savedFilters}
        onApplyFilter={handleSelectSavedFilter}
        onToggleFavorite={handleToggleFavorite}
        onDeleteFilter={handleDeleteFilter}
      />

      {/* Issue Details Modal */}
      {detailsModalIssue && (
        <IssueDetailsModal
          isOpen={!!detailsModalIssue}
          issueId={detailsModalIssue.id}
          onClose={() => setDetailsModalIssue(null)}
          onIssueUpdated={(updated) => {
            setIssues((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
            setDetailsModalIssue(updated);
          }}
          onIssueDeleted={(deletedId) => {
            setIssues((prev) => prev.filter((i) => i.id !== deletedId));
            setDetailsModalIssue(null);
            if (selectedIssueId === deletedId) setSelectedIssueId(null);
          }}
        />
      )}
    </div>
  );
};

export default AdvancedSearchPage;
