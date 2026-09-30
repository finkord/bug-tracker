import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store';
import {
  useIssuesQuery,
  useUpdateIssueStatusMutation,
  useProjectsQuery,
  useSavedFiltersQuery,
  useDeleteSavedFilterMutation,
  useCreateSavedFilterMutation,
} from '../api/queries';
import type { IssueStatus } from '../api/client';
import { Avatar } from '../components/common/Avatar';
import { IssueDetailsModal } from '../components/kanban/IssueDetailsModal';
import { Button, Badge } from '../components/ui';
import { FolderGit2, Clock } from 'lucide-react';
import { GuestHeroSection } from '../components/home/GuestHeroSection';
import { AssignedIssuesSection } from '../components/home/AssignedIssuesSection';
import { ProjectBoardsSection } from '../components/home/ProjectBoardsSection';
import { SavedFiltersSection } from '../components/home/SavedFiltersSection';

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedIssueId, setSelectedIssueId] = useState<number | null>(null);

  const { data: assignedIssuesData, isLoading: issuesLoading } = useIssuesQuery(
    user ? { assigneeId: user.id } : undefined,
  );
  const assignedIssues = assignedIssuesData?.items ?? [];
  const { data: projects = [], isLoading: projectsLoading } = useProjectsQuery();
  const { data: savedFilters = [], isLoading: filtersLoading } = useSavedFiltersQuery();

  const updateStatusMutation = useUpdateIssueStatusMutation();
  const deleteFilterMutation = useDeleteSavedFilterMutation();
  const createFilterMutation = useCreateSavedFilterMutation();

  const loadingDashboard = issuesLoading || projectsLoading || filtersLoading;

  const handleStatusChange = async (issueId: number, nextStatus: IssueStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ issueId, status: nextStatus });
    } catch {
      // Handled by UI feedback or mutation error state
    }
  };

  const handleDeleteFilter = async (filterId: number) => {
    try {
      await deleteFilterMutation.mutateAsync(filterId);
    } catch {
      // Handled by UI feedback or mutation error state
    }
  };

  const handleCreateFilter = async (name: string) => {
    await createFilterMutation.mutateAsync({
      name,
      criteria: JSON.stringify({ status: 'OPEN', priority: 'HIGH' }),
    });
  };

  const handleApplyFilter = (criteriaStr: string) => {
    try {
      const criteria = JSON.parse(criteriaStr);
      const params = new URLSearchParams();
      if (criteria.query) params.set('q', criteria.query);
      if (criteria.search) params.set('q', criteria.search);
      if (criteria.projectId && criteria.projectId !== 'ALL') params.set('projectId', String(criteria.projectId));
      if (criteria.status && criteria.status !== 'ALL') params.set('status', criteria.status);
      if (criteria.priority && criteria.priority !== 'ALL') params.set('priority', criteria.priority);
      if (criteria.assigneeId && criteria.assigneeId !== 'ALL') params.set('assigneeId', String(criteria.assigneeId));
      if (criteria.sprint && criteria.sprint !== 'ALL') params.set('sprint', criteria.sprint);

      const qs = params.toString();
      navigate(`/search${qs ? `?${qs}` : ''}`);
    } catch {
      navigate('/search');
    }
  };

  // 1. Guest landing page view
  if (!user) {
    return <GuestHeroSection />;
  }

  // 2. Authenticated user dashboard view
  const activeAssigned = assignedIssues.filter((i) => i.status !== 'CLOSED');

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="bg-[var(--md-sys-color-surface-container-low)] rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <Avatar
              name={user.fullName}
              avatarUrl={user.avatarUrl}
              role={user.systemRole}
              size="lg"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[var(--md-sys-color-on-surface)] tracking-tight">
                  Welcome back, {user.fullName}!
                </h1>
                <Badge variant={user.systemRole === 'ADMIN' ? 'primary' : 'neutral'} size="sm">
                  {user.systemRole}
                </Badge>
              </div>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                Personal Engineering Dashboard • {activeAssigned.length} active tasks requiring your attention
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/projects">
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<FolderGit2 className="w-3.5 h-3.5" />}
              >
                All Projects
              </Button>
            </Link>
            <Link to="/time-tracking">
              <Button
                type="button"
                variant="filled"
                size="sm"
                leftIcon={<Clock className="w-3.5 h-3.5" />}
              >
                Time Logs
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <AssignedIssuesSection
            issues={activeAssigned}
            loading={loadingDashboard}
            onSelectIssue={setSelectedIssueId}
            onStatusChange={handleStatusChange}
          />

          <ProjectBoardsSection projects={projects} />
        </div>

        <div className="space-y-6">
          <SavedFiltersSection
            filters={savedFilters}
            onApplyFilter={handleApplyFilter}
            onDeleteFilter={handleDeleteFilter}
            onCreateFilter={handleCreateFilter}
          />
        </div>
      </div>

      {/* Issue Details Modal */}
      <IssueDetailsModal
        isOpen={!!selectedIssueId}
        issueId={selectedIssueId}
        onClose={() => setSelectedIssueId(null)}
      />
    </div>
  );
};
