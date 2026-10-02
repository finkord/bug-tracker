import React, { useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useProjectsQuery } from '../../api/queries';
import { ChevronRight } from 'lucide-react';

export const HeaderBreadcrumbs: React.FC = () => {
  const location = useLocation();
  const { data: projects = [] } = useProjectsQuery();

  const path = location.pathname;

  // Detect project-scoped route: /projects/:param/(board|backlog|settings) or /projects/:param
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

        {currentView ? (
          <>
            <Link
              to={`/projects/${projectKey}`}
              className="font-bold text-[var(--md-sys-color-on-surface)] hover:text-[var(--md-sys-color-primary)] transition-colors truncate max-w-[140px] sm:max-w-xs"
              title={`View ${projectName} Overview`}
            >
              {projectName}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 opacity-40 shrink-0" />
            <span className="font-semibold text-[var(--md-sys-color-primary)] truncate">
              {viewLabel}
            </span>
          </>
        ) : (
          <span
            className="font-bold text-[var(--md-sys-color-on-surface)] truncate max-w-[180px] sm:max-w-xs"
            title={projectName}
          >
            {projectName}
          </span>
        )}
      </nav>
    );
  }

  // Top level workspace views
  let title = 'Dashboard';
  if (path.startsWith('/my-issues')) title = 'My Issues';
  else if (path.startsWith('/search')) title = 'Search';
  else if (path.startsWith('/time-tracking')) title = 'Time Tracking';
  else if (path.startsWith('/projects')) title = 'Projects';
  else if (path.startsWith('/admin')) title = 'Admin Center';
  else if (path.startsWith('/profile')) title = 'Profile';
  else if (path.startsWith('/preferences')) title = 'Preferences';
  else if (path.startsWith('/issues/')) {
    const key = path.split('/')[2];
    return (
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[var(--md-sys-color-on-surface-variant)]">
        <Link to="/search" className="hover:text-[var(--md-sys-color-primary)] transition-colors">
          Issues
        </Link>
        <ChevronRight className="w-3.5 h-3.5 opacity-40 shrink-0" />
        <span className="font-mono font-bold text-[var(--md-sys-color-primary)]">{key}</span>
      </nav>
    );
  }

  return (
    <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)] truncate">
      {title}
    </span>
  );
};

