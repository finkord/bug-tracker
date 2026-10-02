import React, { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
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
import { Badge } from '../components/ui';
import { BackButton } from '../components/common/BackButton';
import { ProjectAvatar } from '../components/projects/ProjectAvatar';
import { ProjectGeneralTab } from '../components/projects/ProjectGeneralTab';
import { ProjectTeamsTab } from '../components/projects/ProjectTeamsTab';
import { ProjectComponentsTab } from '../components/projects/ProjectComponentsTab';
import { ProjectVersionsTab } from '../components/projects/ProjectVersionsTab';
import { ProjectPermissionsTab } from '../components/projects/ProjectPermissionsTab';
import { ProjectWebhooksTab } from '../components/projects/ProjectWebhooksTab';

export type SettingsTab = 'general' | 'teams' | 'components' | 'versions' | 'access' | 'webhooks';

export const ProjectSettingsPage: React.FC = () => {
  const { id, projectId: paramProjectId } = useParams<{ id?: string; projectId?: string }>();
  const rawIdentifier = paramProjectId || id;

  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab') as SettingsTab | null;
  const activeTab: SettingsTab = rawTab && ['general', 'teams', 'components', 'versions', 'access', 'webhooks'].includes(rawTab)
    ? rawTab
    : 'general';

  const setActiveTab = (tab: SettingsTab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    });
  };

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

  const { data: project = null, isLoading: projectLoading } = useProjectDetailQuery(projectId);
  const { data: usersData, isLoading: usersLoading } = useUsersQuery({ page: 1, limit: 100 });
  const allUsers = usersData?.items || [];

  const { data: teams = [] } = useTeamsQuery(projectId);
  const { data: components = [] } = useProjectComponentsQuery(projectId);
  const { data: versions = [] } = useProjectVersionsQuery(projectId);

  if (projectLoading || usersLoading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-16 text-center text-xs text-[var(--md-sys-color-on-surface-variant)] animate-pulse">
        Loading project configuration...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-16 text-center text-xs text-[var(--md-sys-color-error)]">
        Project workspace not found.
      </div>
    );
  }

  const navItems = [
    {
      id: 'general' as const,
      label: 'General',
      description: 'Details & Ownership',
      Icon: Settings,
    },
    {
      id: 'teams' as const,
      label: 'Teams & Rosters',
      description: 'Scrum teams & capacities',
      Icon: Users2,
      count: teams.length,
    },
    {
      id: 'components' as const,
      label: 'Components',
      description: 'Subsystems & modules',
      Icon: Layers,
      count: components.length,
    },
    {
      id: 'versions' as const,
      label: 'Releases & Versions',
      description: 'Milestones & changelogs',
      Icon: Tag,
      count: versions.length,
    },
    {
      id: 'access' as const,
      label: 'People & Permissions',
      description: 'Roles & security scheme',
      Icon: Shield,
    },
    {
      id: 'webhooks' as const,
      label: 'Webhooks',
      description: 'Automation & events',
      Icon: Webhook,
    },
  ];

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-5 flex-1 flex flex-col min-w-0 space-y-6 animate-in fade-in duration-200">
      {/* Back button & Header Strip */}
      <div className="space-y-4 border-b border-[var(--md-sys-color-outline-variant)]/20 pb-5">
        <div className="flex items-center justify-between">
          <BackButton
            fallbackPath={`/projects/${project.key}`}
            label={`Back to ${project.key}`}
          />
          <Badge variant="primary" size="md">
            Lead: {project.lead?.fullName || `User #${project.leadId}`}
          </Badge>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <ProjectAvatar
              name={project.name}
              projectKey={project.key}
              avatarUrl={project.avatarUrl}
              size="lg"
            />
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[var(--md-sys-color-on-surface)] tracking-tight">
                {project.name} — Project Settings
              </h1>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                Centralized project administration hub for teams, components, releases, permissions, and automation.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Responsive Settings Layout */}
      <div className="flex flex-col md:flex-row gap-6 items-start flex-1 min-w-0">
        {/* Left Navigation Sidebar */}
        <aside className="w-full md:w-60 lg:w-64 shrink-0">
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 p-1.5 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/30">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              const Icon = item.Icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer shrink-0 md:shrink select-none ${
                    active
                      ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-2xs'
                      : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1.5 shrink-0 ${
                        active
                          ? 'bg-[var(--md-sys-color-on-primary)]/20 text-[var(--md-sys-color-on-primary)]'
                          : 'bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)]'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Right Active Panel */}
        <main className="flex-1 min-w-0 w-full p-6 rounded-3xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/30 shadow-2xs">
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
    </div>
  );
};
