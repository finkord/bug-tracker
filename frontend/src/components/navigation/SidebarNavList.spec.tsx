import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SidebarNavList } from './SidebarNavList';

const mockUseSavedFiltersQuery = vi.fn();

vi.mock('../../api/queries', () => ({
  useSavedFiltersQuery: () => mockUseSavedFiltersQuery(),
}));

describe('SidebarNavList Component (Zero-Jump Personal & Workspace Navigation)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSavedFiltersQuery.mockReturnValue({ data: [] });
  });

  it('renders guest public navigation items when user is null', () => {
    render(
      <MemoryRouter>
        <SidebarNavList user={null} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('navigation', { name: /guest navigation/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument();

    expect(screen.queryByRole('link', { name: /kanban board/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /backlog/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /admin center/i })).not.toBeInTheDocument();
  });

  const createMockUser = () => ({
    id: 1,
    email: 'user@example.com',
    fullName: 'Regular User',
    systemRole: 'USER' as const,
    isAdmin: false,
    isActive: true,
    isBlocked: false,
    isActivated: true,
    twoFactorEnabled: false,
    createdAt: '2026-01-01',
    roles: [],
    groups: [],
  });

  it('renders personal and utilities navigation when user is authenticated with no project selected', () => {
    const mockUser = createMockUser();

    render(
      <MemoryRouter>
        <SidebarNavList user={mockUser} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
    expect(screen.getByText(/^personal$/i)).toBeInTheDocument();
    expect(screen.getByText(/^utilities$/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    const myIssuesLink = screen.getByRole('link', { name: /my issues/i });
    expect(myIssuesLink).toBeInTheDocument();
    expect(myIssuesLink).toHaveAttribute('href', '/my-issues');
    expect(screen.getByRole('link', { name: /advanced search/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /time tracking/i })).toBeInTheDocument();

    expect(screen.queryByRole('link', { name: /kanban board/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /backlog/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /admin center/i })).not.toBeInTheDocument();
  });

  it('renders active project views at the top while preserving personal and utilities navigation', () => {
    const mockUser = createMockUser();

    const mockProject = {
      id: 42,
      name: 'Phoenix Engine',
      key: 'PHX',
      description: 'Core engine',
      leadId: 1,
      lead: null,
      totalIssues: 10,
      openIssues: 5,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };

    render(
      <MemoryRouter>
        <SidebarNavList user={mockUser} activeProject={mockProject} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();

    // Project views must be present and link using the project key (PHX)
    const overviewLink = screen.getByRole('link', { name: /^overview$/i });
    expect(overviewLink).toBeInTheDocument();
    expect(overviewLink).toHaveAttribute('href', '/projects/PHX');

    const boardLink = screen.getByRole('link', { name: /kanban board/i });
    expect(boardLink).toBeInTheDocument();
    expect(boardLink).toHaveAttribute('href', '/projects/PHX/board');

    const backlogLink = screen.getByRole('link', { name: /backlog & sprints/i });
    expect(backlogLink).toBeInTheDocument();
    expect(backlogLink).toHaveAttribute('href', '/projects/PHX/backlog');

    const settingsLink = screen.getByRole('link', { name: /project settings/i });
    expect(settingsLink).toBeInTheDocument();
    expect(settingsLink).toHaveAttribute('href', '/projects/PHX/settings');

    // Personal navigation must remain permanently accessible
    expect(screen.getByText(/^personal$/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    const myIssuesLink = screen.getByRole('link', { name: /my issues/i });
    expect(myIssuesLink).toBeInTheDocument();
    expect(myIssuesLink).toHaveAttribute('href', '/my-issues');
    expect(screen.getByRole('link', { name: /advanced search/i })).toBeInTheDocument();

    // Utilities section must remain anchored
    expect(screen.getByText(/^utilities$/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /time tracking/i })).toBeInTheDocument();
  });

  it('renders project navigation using numeric ID fallback when only projectId is provided during loading', () => {
    const mockUser = createMockUser();

    render(
      <MemoryRouter>
        <SidebarNavList user={mockUser} projectId={99} />
      </MemoryRouter>,
    );

    const overviewLink = screen.getByRole('link', { name: /^overview$/i });
    expect(overviewLink).toBeInTheDocument();
    expect(overviewLink).toHaveAttribute('href', '/projects/99');

    const boardLink = screen.getByRole('link', { name: /kanban board/i });
    expect(boardLink).toBeInTheDocument();
    expect(boardLink).toHaveAttribute('href', '/projects/99/board');

    const backlogLink = screen.getByRole('link', { name: /backlog & sprints/i });
    expect(backlogLink).toBeInTheDocument();
    expect(backlogLink).toHaveAttribute('href', '/projects/99/backlog');

    // Personal navigation is preserved
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
  });

  it('does not render saved filters in the sidebar navigation', () => {
    const mockUser = createMockUser();

    render(
      <MemoryRouter>
        <SidebarNavList user={mockUser} />
      </MemoryRouter>,
    );

    expect(screen.queryByText(/saved filters/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/no pinned filters/i)).not.toBeInTheDocument();
  });
});
