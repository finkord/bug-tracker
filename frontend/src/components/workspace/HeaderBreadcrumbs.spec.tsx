import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HeaderBreadcrumbs } from './HeaderBreadcrumbs';

const mockProjects = [
  {
    id: 10,
    name: 'Phoenix Engine',
    key: 'PHX',
    leadId: 1,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 20,
    name: 'DevOps Infra',
    key: 'OPS',
    leadId: 1,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
];

vi.mock('../../api/queries', () => ({
  useProjectsQuery: () => ({ data: mockProjects }),
}));

describe('HeaderBreadcrumbs Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders top-level page title when not on a project route', () => {
    render(
      <MemoryRouter initialEntries={['/my-issues']}>
        <HeaderBreadcrumbs />
      </MemoryRouter>,
    );

    expect(screen.getByText('My Issues')).toBeInTheDocument();
  });

  it('renders project breadcrumb path and view label on project route', () => {
    render(
      <MemoryRouter initialEntries={['/projects/PHX/board']}>
        <HeaderBreadcrumbs />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /^projects$/i })).toHaveAttribute('href', '/projects');
    expect(screen.getByRole('link', { name: /phoenix engine/i })).toBeInTheDocument();
    expect(screen.getByText('Kanban Board')).toBeInTheDocument();
  });

  it('renders project name as link to overview when on a subview route', () => {
    render(
      <MemoryRouter initialEntries={['/projects/PHX/board']}>
        <HeaderBreadcrumbs />
      </MemoryRouter>,
    );

    const projectLink = screen.getByRole('link', { name: /phoenix engine/i });
    expect(projectLink).toHaveAttribute('href', '/projects/PHX');
  });

  it('renders project name as current page when on the project overview route', () => {
    render(
      <MemoryRouter initialEntries={['/projects/PHX']}>
        <HeaderBreadcrumbs />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /^projects$/i })).toHaveAttribute('href', '/projects');
    expect(screen.getByText('Phoenix Engine')).toBeInTheDocument();
    expect(screen.queryByText('Kanban Board')).not.toBeInTheDocument();
  });
});
