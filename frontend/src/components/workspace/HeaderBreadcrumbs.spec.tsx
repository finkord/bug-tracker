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

  it('renders top-level standalone view without artificial category crumbs', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <HeaderBreadcrumbs />
      </MemoryRouter>,
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders project breadcrumb path with Overview leaf on project home route', () => {
    render(
      <MemoryRouter initialEntries={['/projects/PHX']}>
        <HeaderBreadcrumbs />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /^projects$/i })).toHaveAttribute('href', '/projects');
    expect(screen.getByRole('link', { name: /phoenix engine/i })).toHaveAttribute('href', '/projects/PHX');
    expect(screen.getByText('Overview')).toBeInTheDocument();
  });

  it('renders project breadcrumb path and view label on subview route', () => {
    render(
      <MemoryRouter initialEntries={['/projects/PHX/board']}>
        <HeaderBreadcrumbs />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /^projects$/i })).toHaveAttribute('href', '/projects');
    expect(screen.getByRole('link', { name: /phoenix engine/i })).toHaveAttribute('href', '/projects/PHX');
    expect(screen.getByText('Kanban Board')).toBeInTheDocument();
  });

  it('renders issue detail breadcrumb connected to parent project', () => {
    render(
      <MemoryRouter initialEntries={['/issues/PHX-101']}>
        <HeaderBreadcrumbs />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /^projects$/i })).toHaveAttribute('href', '/projects');
    expect(screen.getByRole('link', { name: /phoenix engine/i })).toHaveAttribute('href', '/projects/PHX');
    expect(screen.getByText('PHX-101')).toBeInTheDocument();
  });

  it('renders two-level breadcrumb for admin console subpages', () => {
    render(
      <MemoryRouter initialEntries={['/admin/teams']}>
        <HeaderBreadcrumbs />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /admin center/i })).toHaveAttribute('href', '/admin/users');
    expect(screen.getByText('Scrum Teams')).toBeInTheDocument();
  });

  it('renders two-level breadcrumb for user account pages', () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/preferences']}>
        <HeaderBreadcrumbs />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /^account$/i })).toHaveAttribute('href', '/profile');
    expect(screen.getByText('Preferences')).toBeInTheDocument();

    unmount();

    render(
      <MemoryRouter initialEntries={['/profile']}>
        <HeaderBreadcrumbs />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /^account$/i })).toHaveAttribute('href', '/profile');
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('renders Access Denied breadcrumb for /forbidden path', () => {
    render(
      <MemoryRouter initialEntries={['/forbidden']}>
        <HeaderBreadcrumbs />
      </MemoryRouter>,
    );

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });

  it('renders Page Not Found breadcrumb for unmatched routes', () => {
    render(
      <MemoryRouter initialEntries={['/some/unknown/route']}>
        <HeaderBreadcrumbs />
      </MemoryRouter>,
    );

    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
  });
});
