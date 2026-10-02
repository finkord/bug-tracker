import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  useIssuesQuery,
  useProjectsQuery,
  useUsersQuery,
  useSavedFiltersQuery,
  useCreateSavedFilterMutation,
  useUpdateSavedFilterMutation,
  useDeleteSavedFilterMutation,
  useUpdateIssueStatusMutation,
} from '../api/queries';
import type { IssueItem, IssueStatus } from '../api/client';
import { SearchToolbar } from '../components/search/SearchToolbar';
import { BasicFilterBar } from '../components/search/BasicFilterBar';
import { JqlEditorBar } from '../components/search/JqlEditorBar';
import { SearchResultsTable } from '../components/search/SearchResultsTable';
import { SearchSplitView } from '../components/search/SearchSplitView';
import { SaveFilterModal } from '../components/search/SaveFilterModal';
import { ManageFiltersModal } from '../components/search/ManageFiltersModal';
import { EditFilterModal } from '../components/search/EditFilterModal';
import type {
  SearchMode,
  ViewLayout,
  BasicFilterCriteria,
  SavedFilterPreset,
} from '../types/search';
import { buildJqlFromFilters } from '../utils/jqlParser';

export const AdvancedSearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

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

  // Server-side Pagination
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(50);

  // Selected Issue for Split View
  const [selectedIssueId, setSelectedIssueId] = useState<number | null>(null);

  // Modals
  const [saveModalOpen, setSaveModalOpen] = useState<boolean>(false);
  const [manageFiltersOpen, setManageFiltersOpen] = useState<boolean>(false);
  const [activeFilterId, setActiveFilterId] = useState<string | null>(null);
  const [editingFilter, setEditingFilter] = useState<SavedFilterPreset | null>(null);

  // Saved Filters from backend database
  const { data: savedFiltersData = [], isLoading: filtersLoading, refetch: refetchSavedFilters } = useSavedFiltersQuery();
  const createFilterMutation = useCreateSavedFilterMutation();
  const updateFilterMutation = useUpdateSavedFilterMutation();
  const deleteFilterMutation = useDeleteSavedFilterMutation();
  const updateStatusMutation = useUpdateIssueStatusMutation();

  const savedFilters: SavedFilterPreset[] = useMemo(() => {
    return (savedFiltersData || []).map((f) => ({
      id: String(f.id),
      name: f.name,
      description: f.description || '',
      jql: f.criteria,
      isFavorite: Boolean(f.isFavorite),
      createdAt: f.createdAt,
    }));
  }, [savedFiltersData]);

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

  const activeSavedFilter = useMemo(
    () => savedFilters.find((f) => String(f.id) === String(activeFilterId)),
    [savedFilters, activeFilterId]
  );

  const isFilterDirty = useMemo(() => {
    if (!activeSavedFilter) return false;
    return effectiveJql.trim() !== (activeSavedFilter.jql || '').trim();
  }, [activeSavedFilter, effectiveJql]);

  // TanStack Query Hooks for core server data with server-side JQL execution & pagination
  const {
    data: issuesData,
    isLoading: issuesLoading,
    refetch: refetchIssues,
  } = useIssuesQuery({
    jql: effectiveJql.trim() || undefined,
    page,
    limit,
    sortBy,
    sortOrder: sortOrder.toUpperCase() as 'ASC' | 'DESC',
  });

  const { data: projects = [], isLoading: projectsLoading, refetch: refetchProjects } = useProjectsQuery();
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useUsersQuery({ page: 1, limit: 100 });
  const users = usersData?.items || [];

  const issues = issuesData?.items || [];
  const totalResults = issuesData?.total || 0;
  const totalPages = issuesData?.totalPages || 1;

  const loading = issuesLoading || projectsLoading || usersLoading || filtersLoading;

  // Reset page to 1 whenever search criteria change
  useEffect(() => {
    setPage(1);
  }, [effectiveJql]);

  const handleRefresh = async () => {
    await Promise.all([refetchIssues(), refetchProjects(), refetchUsers(), refetchSavedFilters()]);
  };

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
    setPage(1);
  };

  // Handle Saved Filter selection (accepts SavedFilterPreset, filter object, or raw jql string)
  const handleSelectSavedFilter = (
    filterOrJql: SavedFilterPreset | { jql: string; id?: string } | string,
  ) => {
    if (typeof filterOrJql === 'string') {
      setJqlQuery(filterOrJql);
      setMode('jql');
      const matched = savedFilters.find((f) => f.jql.trim() === filterOrJql.trim());
      setActiveFilterId(matched ? matched.id : null);
    } else {
      setJqlQuery(filterOrJql.jql);
      setMode('jql');
      setActiveFilterId(filterOrJql.id || null);
    }
    setPage(1);
  };

  // Clear active filter selection and reset filters
  const handleClearActiveFilter = () => {
    setActiveFilterId(null);
    handleClearFilters();
  };

  // Direct save/update criteria for the active saved filter
  const handleUpdateActiveFilter = async () => {
    if (!activeSavedFilter) return;
    try {
      await updateFilterMutation.mutateAsync({
        id: Number(activeSavedFilter.id),
        criteria: effectiveJql,
      });
    } catch (err) {
      console.error('Failed to update filter criteria:', err);
    }
  };

  // Revert criteria to the active filter's saved JQL
  const handleRevertActiveFilter = () => {
    if (!activeSavedFilter) return;
    setJqlQuery(activeSavedFilter.jql);
    setMode('jql');
  };

  // Save changes from EditFilterModal
  const handleSaveEditedFilter = async (updated: {
    id: string;
    name: string;
    description: string;
    jql: string;
    isFavorite: boolean;
  }) => {
    try {
      await updateFilterMutation.mutateAsync({
        id: Number(updated.id),
        name: updated.name,
        description: updated.description,
        criteria: updated.jql,
        isFavorite: updated.isFavorite,
      });
      setEditingFilter(null);
      if (activeFilterId === updated.id) {
        setJqlQuery(updated.jql);
      }
    } catch (err) {
      console.error('Failed to update filter details:', err);
    }
  };

  // Handle Saving Filter to backend
  const handleSaveFilter = async (newFilter: {
    name: string;
    description: string;
    jql: string;
    isFavorite: boolean;
  }) => {
    try {
      await createFilterMutation.mutateAsync({
        name: newFilter.name,
        criteria: newFilter.jql,
        description: newFilter.description,
        isFavorite: newFilter.isFavorite,
      });
      setSaveModalOpen(false);
    } catch (err) {
      console.error('Failed to save filter to backend:', err);
    }
  };

  // Handle Toggle Star via backend API
  const handleToggleFavorite = async (filterId: string) => {
    const target = savedFilters.find((f) => String(f.id) === String(filterId));
    if (target) {
      try {
        await updateFilterMutation.mutateAsync({
          id: Number(filterId),
          isFavorite: !target.isFavorite,
        });
      } catch (err) {
        console.error('Failed to update filter favorite state:', err);
      }
    }
  };

  // Handle Delete Filter via backend API
  const handleDeleteFilter = async (filterId: string) => {
    try {
      await deleteFilterMutation.mutateAsync(Number(filterId));
    } catch (err) {
      console.error('Failed to delete filter:', err);
    }
  };

  // Inline status update
  const handleUpdateStatus = async (issueId: number, status: IssueStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ issueId, status });
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
    setPage(1);
  };

  // CSV Export
  const handleExportCsv = () => {
    if (issues.length === 0) return;
    const headers = ['Key', 'Title', 'Type', 'Status', 'Priority', 'Sprint', 'Assignee', 'Created', 'Updated'];
    const rows = issues.map((issue) => [
      issue.key,
      `"${(issue.title || '').replace(/"/g, '""')}"`,
      issue.issueType,
      issue.status,
      issue.priority,
      issue.sprint?.name || '',
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
    if (issues.length === 0) return;
    const blob = new Blob([JSON.stringify(issues, null, 2)], {
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
    <div className="w-full px-4 sm:px-6 lg:px-8 py-5 flex-1 flex flex-col min-w-0 animate-in fade-in duration-200">
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
        activeFilterId={activeFilterId}
        isFilterDirty={isFilterDirty}
        onSelectSavedFilter={handleSelectSavedFilter}
        onUpdateActiveFilter={handleUpdateActiveFilter}
        onRevertActiveFilter={handleRevertActiveFilter}
        onEditFilter={(filter) => setEditingFilter(filter)}
        onClearActiveFilter={handleClearActiveFilter}
        onSaveCurrentFilter={() => setSaveModalOpen(true)}
        onManageFilters={() => setManageFiltersOpen(true)}
        viewLayout={viewLayout}
        onViewLayoutChange={setViewLayout}
        onExportCsv={handleExportCsv}
        onExportJson={handleExportJson}
        onRefresh={handleRefresh}
        loading={loading}
        totalResults={totalResults}
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

      {/* Main Results View */}
      <div className={`flex-1 min-h-0 flex flex-col mt-2 ${viewLayout === 'detail' ? 'h-[calc(100vh-215px)] min-h-[480px]' : ''}`}>
        {viewLayout === 'list' ? (
          <SearchResultsTable
            issues={issues}
            total={totalResults}
            page={page}
            limit={limit}
            totalPages={totalPages}
            onPageChange={setPage}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
            selectedIssueId={selectedIssueId}
            onSelectIssue={(issue) => navigate(`/issues/${issue.key}`, { state: { from: 'search', label: 'Back to Search' } })}
            onUpdateStatus={handleUpdateStatus}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
          />
        ) : (
          <SearchSplitView
            issues={issues}
            total={totalResults}
            page={page}
            limit={limit}
            totalPages={totalPages}
            onPageChange={setPage}
            selectedIssueId={selectedIssueId}
            onSelectIssue={(issue) => setSelectedIssueId(issue.id)}
            onUpdateStatus={handleUpdateStatus}
          />
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
        onEditFilter={(filter) => {
          setManageFiltersOpen(false);
          setEditingFilter(filter);
        }}
      />

      {/* Edit Filter Modal */}
      <EditFilterModal
        isOpen={!!editingFilter}
        onClose={() => setEditingFilter(null)}
        filter={editingFilter}
        onSave={handleSaveEditedFilter}
        onDelete={handleDeleteFilter}
      />
    </div>
  );
};
