import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUserDetailQuery } from '../api/queries/useUsersQuery.js';
import { useIssuesQuery } from '../api/queries/useIssuesQuery.js';
import { useAuth } from '../store/index.js';
import { Avatar } from '../components/common/Avatar.js';
import { BackButton } from '../components/common/BackButton.js';
import { Card, Badge, Button, Tabs, TabsList, TabsTrigger, StatusBadge, PriorityBadge } from '../components/ui/index.js';
import { IssueDetailsModal } from '../components/kanban/IssueDetailsModal.js';
import {
  Mail,
  Calendar,
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Layers,
  AlertCircle,
  FolderGit2,
} from 'lucide-react';

export const UserProfileViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const numericId = Number(id);

  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'DONE'>('ALL');
  const [selectedIssueId, setSelectedIssueId] = useState<number | null>(null);

  const {
    data: profileUser,
    isLoading: isUserLoading,
    isError: isUserError,
  } = useUserDetailQuery(numericId);

  const {
    data: issuesData,
    isLoading: isIssuesLoading,
  } = useIssuesQuery({
    assigneeId: numericId,
    limit: 100,
  });

  const issues = issuesData?.items || [];
  const isSelf = currentUser?.id === numericId;

  // Filter issues based on active status tab
  const filteredIssues = issues.filter((issue) => {
    if (filterStatus === 'ACTIVE') {
      return issue.status === 'OPEN' || issue.status === 'IN_PROGRESS' || issue.status === 'REVIEW';
    }
    if (filterStatus === 'DONE') {
      return issue.status === 'RESOLVED' || issue.status === 'CLOSED';
    }
    return true;
  });

  const totalAssigned = issues.length;
  const inProgressCount = issues.filter(
    (i) => i.status === 'IN_PROGRESS' || i.status === 'REVIEW',
  ).length;
  const completedCount = issues.filter(
    (i) => i.status === 'RESOLVED' || i.status === 'CLOSED',
  ).length;



  if (isUserLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-pulse">
        <div className="h-8 w-32 bg-[var(--md-sys-color-surface-container-high)] rounded-lg" />
        <div className="h-44 bg-[var(--md-sys-color-surface-container-high)] rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-24 bg-[var(--md-sys-color-surface-container-high)] rounded-2xl" />
          <div className="h-24 bg-[var(--md-sys-color-surface-container-high)] rounded-2xl" />
          <div className="h-24 bg-[var(--md-sys-color-surface-container-high)] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isUserError || !profileUser) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-16 text-center">
        <Card className="p-8 bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-3xl space-y-4">
          <div className="w-12 h-12 rounded-full bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-error)] flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-[var(--md-sys-color-on-surface)]">User Not Found</h2>
          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
            The requested user profile does not exist or may have been removed.
          </p>
          <div className="pt-2">
            <BackButton fallbackPath="/projects" label="Return to Projects" variant="outline" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col min-w-0 space-y-6 animate-in fade-in duration-200">
      {/* Back button and breadcrumb */}
      <div className="flex items-center justify-between">
        <BackButton fallbackPath="/projects" />
        <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-medium">
          Coworker Profile &bull; ID #{profileUser.id}
        </div>
      </div>

      {/* Main Profile Header Card */}
      <Card className="p-6 bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/60 rounded-3xl shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <Avatar
              name={profileUser.fullName}
              avatarUrl={profileUser.avatarUrl}
              size="xl"
              className="w-20 h-20 text-2xl font-bold ring-4 ring-[var(--md-sys-color-surface)] shadow-sm shrink-0"
            />
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-extrabold tracking-tight text-[var(--md-sys-color-on-surface)]">
                  {profileUser.fullName}
                </h1>
                <Badge
                  variant={profileUser.systemRole === 'ADMIN' ? 'primary' : 'neutral'}
                  className="text-[10px] uppercase font-bold tracking-wider"
                >
                  {profileUser.systemRole === 'ADMIN' ? 'Admin' : 'Member'}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-sm text-[var(--md-sys-color-on-surface-variant)]">
                {profileUser.jobTitle ? (
                  <span className="flex items-center gap-1.5 font-medium">
                    <Briefcase className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                    {profileUser.jobTitle}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[var(--md-sys-color-outline)]" />
                    Team Member
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--md-sys-color-on-surface-variant)] pt-1">
                <a
                  href={`mailto:${profileUser.email}`}
                  className="flex items-center gap-1.5 hover:text-[var(--md-sys-color-primary)] transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{profileUser.email}</span>
                </a>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    Joined{' '}
                    {new Date(profileUser.createdAt).toLocaleDateString(undefined, {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Profile Actions */}
          <div className="flex items-center gap-2.5 pt-2 md:pt-0">
            {isSelf ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/profile')}
                className="gap-2 text-xs rounded-xl"
              >
                <span>Edit My Settings</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/search?assigneeId=${profileUser.id}`)}
                className="gap-2 text-xs rounded-xl"
              >
                <Layers className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                <span>Search All Tickets</span>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/40 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
              Assigned Tickets
            </span>
            <div className="text-2xl font-black text-[var(--md-sys-color-on-surface)]">
              {totalAssigned}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[var(--md-sys-color-primary-container)]/30 text-[var(--md-sys-color-primary)] flex items-center justify-center">
            <FolderGit2 className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/40 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
              In Progress / Review
            </span>
            <div className="text-2xl font-black text-[var(--md-sys-color-warning)]">
              {inProgressCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[var(--md-sys-color-warning-container)]/30 text-[var(--md-sys-color-warning)] flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/40 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
              Completed / Closed
            </span>
            <div className="text-2xl font-black text-[var(--md-sys-color-success)]">
              {completedCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[var(--md-sys-color-success-container)]/30 text-[var(--md-sys-color-success)] flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Assigned Issues List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--md-sys-color-outline-variant)]/40 pb-3">
          <div>
            <h2 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
              Assigned Tickets ({filteredIssues.length})
            </h2>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
              Active and historical issues assigned to {profileUser.fullName}
            </p>
          </div>

          <Tabs
            value={filterStatus}
            onValueChange={(val) => setFilterStatus(val as 'ALL' | 'ACTIVE' | 'DONE')}
          >
            <TabsList variant="pills" className="bg-[var(--md-sys-color-surface-container)] p-1 gap-1">
              <TabsTrigger value="ALL" variant="pills" size="sm" className="text-xs font-semibold">
                All ({issues.length})
              </TabsTrigger>
              <TabsTrigger value="ACTIVE" variant="pills" size="sm" className="text-xs font-semibold">
                Active ({issues.filter((i) => i.status !== 'RESOLVED' && i.status !== 'CLOSED').length})
              </TabsTrigger>
              <TabsTrigger value="DONE" variant="pills" size="sm" className="text-xs font-semibold">
                Resolved ({completedCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {isIssuesLoading ? (
          <div className="space-y-2.5 py-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-16 rounded-2xl bg-[var(--md-sys-color-surface-container-high)] animate-pulse"
              />
            ))}
          </div>
        ) : filteredIssues.length === 0 ? (
          <Card className="p-8 text-center bg-[var(--md-sys-color-surface-container-low)] border border-dashed border-[var(--md-sys-color-outline-variant)] rounded-2xl">
            <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
              No tickets found for this filter criteria.
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredIssues.map((issue) => (
              <div
                key={issue.id}
                onClick={() => setSelectedIssueId(issue.id)}
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40 hover:border-[var(--md-sys-color-outline-variant)] transition-all cursor-pointer shadow-2xs gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs font-bold text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/40 px-2 py-0.5 rounded-md shrink-0">
                    {issue.key}
                  </span>
                  <Badge variant="neutral" className="text-[10px] font-mono shrink-0">
                    {issue.issueType}
                  </Badge>
                  <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface)] group-hover:text-[var(--md-sys-color-primary)] transition-colors truncate">
                    {issue.title}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto text-xs">
                  {issue.projectName && (
                    <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      {issue.projectName}
                    </span>
                  )}
                  <PriorityBadge priority={issue.priority} size="sm" />
                  <StatusBadge status={issue.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Issue Details Modal */}
      {selectedIssueId && (
        <IssueDetailsModal
          issueId={selectedIssueId}
          isOpen={true}
          onClose={() => setSelectedIssueId(null)}
        />
      )}
    </div>
  );
};
