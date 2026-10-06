import React, { useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useProjectsQuery } from '../../api/queries';
import { ChevronRight } from 'lucide-react';

export const HeaderBreadcrumbs: React.FC = () => {
  const location = useLocation();
  const { data: projects = [] } = useProjectsQuery();

  const path = location.pathname;

  // 1. Detect project-scoped route: /projects/:param/(board|backlog|settings) or /projects/:param
  const projectMatch = useMemo(() => {
    return path.match(/\/projects\/([^/]+)(?:\/(board|backlog|settings))?/);
  }, [path]);

  const param = projectMatch?.[1];
  const currentView = projectMatch?.[2];

  const foundProject = useMemo(() => {
    if (!param) return undefined;
    const num = Number(param);
    if (!Number.isNaN(num)) {
      return projects.find((p) => p.id === num);
    }
    return projects.find((p) => p.key?.toUpperCase() === param.toUpperCase());
  }, [param, projects]);

  const projectName = foundProject?.name || param;
  const projectKey = foundProject?.key || param;

  if (projectMatch && projectKey && param !== 'new' && param !== 'create') {
    let viewLabel = 'Overview';
    if (currentView === 'board') viewLabel = 'Kanban Board';
    else if (currentView === 'backlog') viewLabel = 'Backlog & Sprints';
    else if (currentView === 'settings') viewLabel = 'Project Settings';

    return (
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[var(--md-sys-color-on-surface-variant)] min-w-0">
        <Link
          to="/projects"
          className="hover:text-[var(--md-sys-color-primary)] transition-colors flex items-center gap-1 font-medium truncate shrink-0"
        >
          <span>Projects</span>
        </Link>

        <ChevronRight className="w-3.5 h-3.5 opacity-40 shrink-0" />

        <Link
          to={`/projects/${projectKey}`}
          className="font-medium text-[var(--md-sys-color-on-surface)] hover:text-[var(--md-sys-color-primary)] transition-colors truncate max-w-[140px] sm:max-w-xs"
          title={`View ${projectName} Overview`}
        >
          {projectName}
        </Link>

        <ChevronRight className="w-3.5 h-3.5 opacity-40 shrink-0" />

        <span className="font-semibold text-[var(--md-sys-color-primary)] truncate">
          {viewLabel}
        </span>
      </nav>
    );
  }

  // 2. Issue detail view: Projects > [Project Name] > [Issue Key]
  if (path.startsWith('/issues/')) {
    const issueKey = path.split('/')[2];
    const projectPrefix = issueKey?.includes('-') ? issueKey.split('-')[0] : null;
    const foundIssueProj = projectPrefix
      ? projects.find((p) => p.key?.toUpperCase() === projectPrefix.toUpperCase())
      : null;

    const projName = foundIssueProj?.name || projectPrefix;
    const projKey = foundIssueProj?.key || projectPrefix;

    return (
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[var(--md-sys-color-on-surface-variant)] min-w-0">
        <Link
          to="/projects"
          className="hover:text-[var(--md-sys-color-primary)] transition-colors flex items-center gap-1 font-medium truncate shrink-0"
        >
          <span>Projects</span>
        </Link>

        {projKey && (
          <>
            <ChevronRight className="w-3.5 h-3.5 opacity-40 shrink-0" />
            <Link
              to={`/projects/${projKey}`}
              className="hover:text-[var(--md-sys-color-primary)] transition-colors font-medium truncate max-w-[140px] sm:max-w-xs"
              title={`View ${projName} Overview`}
            >
              {projName}
            </Link>
          </>
        )}

        <ChevronRight className="w-3.5 h-3.5 opacity-40 shrink-0" />

        <span className="font-mono font-bold text-[var(--md-sys-color-primary)] truncate">
          {issueKey}
        </span>
      </nav>
    );
  }

  // 3. Admin Center subpages: Admin Center > [Section]
  if (path.startsWith('/admin')) {
    let sectionTitle = 'User Directory';
    if (path.startsWith('/admin/teams')) sectionTitle = 'Scrum Teams';
    else if (path.startsWith('/admin/rbac')) sectionTitle = 'Roles & Permissions';
    else if (path.startsWith('/admin/security')) sectionTitle = 'Audit & Security Logs';
    else if (path.startsWith('/admin/projects')) sectionTitle = 'Workspace Projects';
    else if (path.startsWith('/admin/announcements')) sectionTitle = 'DevOps Announcements';

    return (
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[var(--md-sys-color-on-surface-variant)] min-w-0">
        <Link
          to="/admin/users"
          className="hover:text-[var(--md-sys-color-primary)] transition-colors font-medium truncate shrink-0"
        >
          <span>Admin Center</span>
        </Link>

        <ChevronRight className="w-3.5 h-3.5 opacity-40 shrink-0" />

        <span className="font-semibold text-[var(--md-sys-color-primary)] truncate">
          {sectionTitle}
        </span>
      </nav>
    );
  }

  // 4. User Account views: Account > [Profile / Preferences]
  if (path.startsWith('/profile') || path.startsWith('/preferences')) {
    const isProfile = path.startsWith('/profile');
    return (
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[var(--md-sys-color-on-surface-variant)] min-w-0">
        <Link
          to="/profile"
          className="hover:text-[var(--md-sys-color-primary)] transition-colors font-medium truncate shrink-0"
        >
          <span>Account</span>
        </Link>

        <ChevronRight className="w-3.5 h-3.5 opacity-40 shrink-0" />

        <span className="font-semibold text-[var(--md-sys-color-primary)] truncate">
          {isProfile ? 'Profile Settings' : 'Preferences'}
        </span>
      </nav>
    );
  }

  // 5. Access Denied route
  if (path === '/forbidden') {
    return (
      <nav aria-label="Breadcrumb" className="flex items-center text-xs min-w-0">
        <span className="font-bold text-[var(--md-sys-color-error)] truncate">
          Access Denied
        </span>
      </nav>
    );
  }

  // 6. Standalone top-level workspace views (True Resource Hierarchy)
  let title = 'Dashboard';
  if (path.startsWith('/my-issues')) title = 'My Issues';
  else if (path.startsWith('/search')) title = 'Advanced Search';
  else if (path.startsWith('/time-tracking')) title = 'Time Tracking';
  else if (path.startsWith('/projects')) title = 'Projects Directory';
  else if (path.startsWith('/users/')) title = 'User Profile';
  else if (path === '/' || path.startsWith('/dashboard')) title = 'Dashboard';
  else title = 'Page Not Found';

  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-xs min-w-0">
      <span className="font-bold text-[var(--md-sys-color-on-surface)] truncate">
        {title}
      </span>
    </nav>
  );
};

