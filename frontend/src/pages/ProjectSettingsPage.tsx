import React, { useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Settings,
  Users2,
  Layers,
  Tag,
  Shield,
  Webhook,
} from 'lucide-react';
import {
  useProjectsQuery,
  useProjectDetailQuery,
  useUsersQuery,
  useTeamsQuery,
  useProjectComponentsQuery,
  useProjectVersionsQuery,
} from '../api/queries';
import { Badge, EntityAvatar, ScrollableTabsContainer } from '../components/ui/index.js';
import { ProjectGeneralTab } from '../components/projects/ProjectGeneralTab';
import { ProjectTeamsTab } from '../components/projects/ProjectTeamsTab';
import { ProjectComponentsTab } from '../components/projects/ProjectComponentsTab';
import { ProjectVersionsTab } from '../components/projects/ProjectVersionsTab';
import { ProjectPermissionsTab } from '../components/projects/ProjectPermissionsTab';
import { ProjectWebhooksTab } from '../components/projects/ProjectWebhooksTab';
import { NotFoundPage } from './NotFoundPage';
import { ForbiddenPage } from './ForbiddenPage';
import { cn } from '../utils/cn.js';

export type SettingsTab = 'general' | 'teams' | 'components' | 'versions' | 'access' | 'webhooks';

export const ProjectSettingsPage: React.FC = () => {
  const { id, projectId: paramProjectId, tab: paramTab } = useParams<{
    id?: string;
    projectId?: string;
    tab?: string;
  }>();
  const rawIdentifier = paramProjectId || id;
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const queryTab = searchParams.get('tab') as SettingsTab | null;

  const validTabs: SettingsTab[] = ['general', 'teams', 'components', 'versions', 'access', 'webhooks'];
  const activeTab: SettingsTab =
    paramTab && validTabs.includes(paramTab as SettingsTab)
      ? (paramTab as SettingsTab)
      : queryTab && validTabs.includes(queryTab)
      ? queryTab
      : 'general';

  const { data: projects = [] } = useProjectsQuery();

  const projectId = useMemo(() => {
    if (!rawIdentifier) return 0;
    const num = parseInt(rawIdentifier, 10);
    if (!Number.isNaN(num)) return num;
    const found = projects.find(
      (p) => p.key?.toUpperCase() === rawIdentifier.toUpperCase(),
    );
    return found ? found.id : 0;
  }, [rawIdentifier, projects]);

  const { data: project = null, isLoading: projectLoading, error: projectError } = useProjectDetailQuery(projectId);
  const { data: usersData, isLoading: usersLoading } = useUsersQuery({ page: 1, limit: 100 });
  const allUsers = usersData?.items || [];

  const { data: teams = [] } = useTeamsQuery(projectId);
  const { data: components = [] } = useProjectComponentsQuery(projectId);
  const { data: versions = [] } = useProjectVersionsQuery(projectId);

  const handleTabChange = (tab: SettingsTab) => {
    const projectKeyOrId = project?.key || rawIdentifier;
    navigate(`/projects/${projectKeyOrId}/settings/${tab}`);
  };

  if (projectLoading || usersLoading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-16 text-center text-xs text-[var(--md-sys-color-on-surface-variant)] animate-pulse">
        Loading project configuration...
      </div>
    );
  }

  if (!project) {
    const isForbidden =
      (projectError as any)?.message?.toLowerCase()?.includes('forbidden') ||
      (projectError as any)?.message?.toLowerCase()?.includes('permission') ||
      (projectError as any)?.status === 403;

    if (isForbidden) {
      return (
        <ForbiddenPage
          title="Project Access Denied"
          message={`You do not have administrative permissions to view or edit settings for project "${rawIdentifier || 'unknown'}".`}
          resourceType="Project"
          resourceId={rawIdentifier}
        />
      );
    }

    return (
      <NotFoundPage
        title="Project Workspace Not Found"
        description={`We could not find a project workspace matching "${rawIdentifier}". It may have been deleted, archived, or you may not have access.`}
        resourceType="Project"
        resourceId={rawIdentifier}
      />
    );
  }

  const navItems = [
    {
      id: 'general' as const,
      label: 'General',
      Icon: Settings,
    },
    {
      id: 'teams' as const,
      label: 'Teams & Rosters',
      Icon: Users2,
      count: teams.length,
    },
    {
      id: 'components' as const,
      label: 'Components',
      Icon: Layers,
      count: components.length,
    },
    {
      id: 'versions' as const,
      label: 'Releases & Versions',
      Icon: Tag,
      count: versions.length,
    },
    {
      id: 'access' as const,
      label: 'People & Permissions',
      Icon: Shield,
    },
    {
      id: 'webhooks' as const,
      label: 'Webhooks',
      Icon: Webhook,
    },
  ];

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-5 flex-1 flex flex-col min-w-0 space-y-4 animate-in fade-in duration-200">
      {/* ── Project Header Strip ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-3.5">
          <EntityAvatar
            name={project.name}
            projectKey={project.key}
            avatarUrl={project.avatarUrl}
            size="lg"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[var(--md-sys-color-on-surface)] tracking-tight">
                {project.name}
              </h1>
              <Badge variant="neutral" size="sm" className="font-mono uppercase tracking-wide">
                {project.key}
              </Badge>
            </div>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
              Project administration hub for configuration, scrum teams, components, releases, permissions, and webhooks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="primary" size="md">
            Lead: {project.lead?.fullName || `User #${project.leadId}`}
          </Badge>
        </div>
      </div>

      {/* ── Top Horizontal Underline Navigation Tabs Bar ── */}
      <ScrollableTabsContainer
        as="nav"
        aria-label="Project Settings Navigation Tabs"
        className="border-b border-[var(--md-sys-color-outline-variant)]/20 w-full"
        railClassName="gap-1 sm:gap-2"
      >
        {navItems.map((item) => {
          const active = activeTab === item.id;
          const Icon = item.Icon;

          return (
            <button
              key={item.id}
              type="button"
              id={`project-settings-tab-${item.id}`}
              onClick={() => handleTabChange(item.id)}
              className={cn(
                'group relative flex items-center gap-2 py-3 px-3.5 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-150 border-b-2 -mb-px outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] rounded-t-lg select-none cursor-pointer',
                active
                  ? 'text-[var(--md-sys-color-primary)] border-[var(--md-sys-color-primary)] font-bold'
                  : 'text-[var(--md-sys-color-on-surface-variant)] border-transparent hover:text-[var(--md-sys-color-on-surface)] hover:border-[var(--md-sys-color-outline-variant)]/40 hover:bg-[var(--md-sys-color-surface-container-highest)]/30',
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 shrink-0 transition-colors',
                  active
                    ? 'text-[var(--md-sys-color-primary)]'
                    : 'text-[var(--md-sys-color-on-surface-variant)] group-hover:text-[var(--md-sys-color-on-surface)]',
                )}
              />
              <span>{item.label}</span>

              {item.count !== undefined && item.count > 0 && (
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1 shrink-0',
                    active
                      ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]'
                      : 'bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)]',
                  )}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </ScrollableTabsContainer>

      {/* ── Active Tab Content (Full-Width Canvas) ── */}
      <main className="flex-1 min-w-0 w-full p-4 sm:p-6 rounded-3xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/30 shadow-2xs">
        {activeTab === 'general' && (
          <ProjectGeneralTab project={project} allUsers={allUsers} />
        )}

        {activeTab === 'teams' && (
          <ProjectTeamsTab projectId={projectId} allUsers={allUsers} />
        )}

        {activeTab === 'components' && (
          <ProjectComponentsTab projectId={projectId} allUsers={allUsers} />
        )}

        {activeTab === 'versions' && (
          <ProjectVersionsTab projectId={projectId} />
        )}

        {activeTab === 'access' && (
          <ProjectPermissionsTab
            projectId={projectId}
            project={project}
            allUsers={allUsers}
          />
        )}

        {activeTab === 'webhooks' && (
          <ProjectWebhooksTab projectId={projectId} />
        )}
      </main>
    </div>
  );
};
