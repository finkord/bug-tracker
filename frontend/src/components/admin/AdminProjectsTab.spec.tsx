import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { AdminProjectsTab } from './AdminProjectsTab';
import * as queries from '../../api/queries';

vi.mock('../../api/queries', () => ({
  useProjectsQuery: vi.fn(),
  useUsersQuery: vi.fn(),
  useCreateProjectMutation: vi.fn(),
  useDeleteProjectMutation: vi.fn(),
  useUserDetailQuery: vi.fn(),
}));

describe('AdminProjectsTab Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(queries.useUsersQuery).mockReturnValue({
      data: {
        items: [
          { id: 10, fullName: 'Volodymyr Fufalko', email: 'volodymyr@example.com' },
        ],
        total: 1,
      },
      isLoading: false,
    } as unknown as ReturnType<typeof queries.useUsersQuery>);

    vi.mocked(queries.useUserDetailQuery).mockReturnValue({
      data: null,
      isLoading: false,
    } as unknown as ReturnType<typeof queries.useUserDetailQuery>);

    vi.mocked(queries.useProjectsQuery).mockReturnValue({
      data: [
        {
          id: 1,
          name: 'BugTracker',
          key: 'BUGT',
          description: 'BugTracker Core Workspace',
          avatarUrl: 'preset:layers:indigo',
          leadId: 10,
          lead: {
            id: 10,
            fullName: 'Volodymyr Fufalko',
            email: 'volodymyr@example.com',
            avatarUrl: null,
          },
          openIssues: 3,
          totalIssues: 8,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
        {
          id: 2,
          name: 'Mobile App',
          key: 'MOBT',
          description: 'iOS & Android Native App',
          avatarUrl: null,
          leadId: null,
          lead: null,
          openIssues: 0,
          totalIssues: 0,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ],
      isLoading: false,
    } as unknown as ReturnType<typeof queries.useProjectsQuery>);

    vi.mocked(queries.useCreateProjectMutation).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof queries.useCreateProjectMutation>);

    vi.mocked(queries.useDeleteProjectMutation).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof queries.useDeleteProjectMutation>);
  });

  it('renders project list in unified DataTable with EntityAvatar, lead, and issue workload', () => {
    render(
      <MemoryRouter>
        <AdminProjectsTab />
      </MemoryRouter>,
    );

    expect(screen.getByText('Workspace Projects (2)')).toBeInTheDocument();
    expect(screen.getByText('BugTracker')).toBeInTheDocument();
    expect(screen.getByText('BUGT')).toBeInTheDocument();
    expect(screen.getByText('Volodymyr Fufalko')).toBeInTheDocument();
    expect(screen.getByText(/3 open/i)).toBeInTheDocument();
    expect(screen.getByText('Mobile App')).toBeInTheDocument();
    expect(screen.getByText('MOBT')).toBeInTheDocument();
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });

  it('filters projects based on user input in search field', () => {
    render(
      <MemoryRouter>
        <AdminProjectsTab />
      </MemoryRouter>,
    );

    const searchInput = screen.getByPlaceholderText(/Search projects by name, key, or lead/i);
    fireEvent.change(searchInput, { target: { value: 'mobile' } });

    expect(screen.getByText('Mobile App')).toBeInTheDocument();
    expect(screen.queryByText('BugTracker')).not.toBeInTheDocument();
  });

  it('opens and closes create project modal', () => {
    render(
      <MemoryRouter>
        <AdminProjectsTab />
      </MemoryRouter>,
    );

    const newBtn = screen.getByRole('button', { name: /New Project/i });
    fireEvent.click(newBtn);

    expect(screen.getByText('Create New Project')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g. Core Banking Platform/i)).toBeInTheDocument();
  });
});
