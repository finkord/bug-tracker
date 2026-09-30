import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminTeamsTab } from './AdminTeamsTab';
import * as teamsQueries from '../../api/queries/useTeamsQuery.js';
import * as projectQueries from '../../api/queries/index.js';
import * as userQueries from '../../api/queries/useUsersQuery.js';

vi.mock('../../api/queries/useTeamsQuery.js', () => ({
  useTeamsQuery: vi.fn(),
  useCreateTeamMutation: vi.fn(),
  useUpdateTeamMutation: vi.fn(),
  useDeleteTeamMutation: vi.fn(),
  useAddTeamMemberMutation: vi.fn(),
  useRemoveTeamMemberMutation: vi.fn(),
}));

vi.mock('../../api/queries/index.js', () => ({
  useProjectsQuery: vi.fn(),
}));

vi.mock('../../api/queries/useUsersQuery.js', () => ({
  useUsersQuery: vi.fn(),
}));

describe('AdminTeamsTab Component', () => {
  const mockTeams = [
    {
      id: 1,
      name: 'Falcon Engine Team',
      description: 'Core backend and query engine performance',
      projectId: 1,
      project: { id: 1, key: 'CORE', name: 'Core Platform' },
      leadId: 10,
      lead: { id: 10, fullName: 'Grace Hopper', email: 'grace@bugtracker.local' },
      sprintCapacityHours: 120,
      members: [
        {
          id: 101,
          teamId: 1,
          userId: 10,
          role: 'SCRUM_MASTER' as const,
          weeklyCapacityHours: 40,
          user: { id: 10, fullName: 'Grace Hopper', email: 'grace@bugtracker.local' },
        },
        {
          id: 102,
          teamId: 1,
          userId: 11,
          role: 'DEVELOPER' as const,
          weeklyCapacityHours: 40,
          user: { id: 11, fullName: 'Linus Torvalds', email: 'linus@bugtracker.local' },
        },
      ],
      createdAt: '2026-09-30T10:00:00Z',
      updatedAt: '2026-09-30T10:00:00Z',
    },
  ];

  const mockProjects = [
    { id: 1, key: 'CORE', name: 'Core Platform' },
    { id: 2, key: 'UI', name: 'Frontend Web' },
  ];

  const mockUsers = [
    { id: 10, fullName: 'Grace Hopper', email: 'grace@bugtracker.local' },
    { id: 11, fullName: 'Linus Torvalds', email: 'linus@bugtracker.local' },
    { id: 12, fullName: 'Ada Lovelace', email: 'ada@bugtracker.local' },
  ];

  const mockCreateMutate = vi.fn().mockResolvedValue({});
  const mockDeleteMutate = vi.fn().mockResolvedValue({});
  const mockAddMemberMutate = vi.fn().mockResolvedValue({});
  const mockRemoveMemberMutate = vi.fn().mockResolvedValue({});

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(teamsQueries.useTeamsQuery).mockReturnValue({
      data: mockTeams,
      isLoading: false,
    } as unknown as ReturnType<typeof teamsQueries.useTeamsQuery>);

    vi.mocked(projectQueries.useProjectsQuery).mockReturnValue({
      data: mockProjects,
      isLoading: false,
    } as unknown as ReturnType<typeof projectQueries.useProjectsQuery>);

    vi.mocked(userQueries.useUsersQuery).mockReturnValue({
      data: { data: mockUsers, total: 3 },
      isLoading: false,
    } as unknown as ReturnType<typeof userQueries.useUsersQuery>);

    vi.mocked(teamsQueries.useCreateTeamMutation).mockReturnValue({
      mutateAsync: mockCreateMutate,
      isPending: false,
    } as unknown as ReturnType<typeof teamsQueries.useCreateTeamMutation>);

    vi.mocked(teamsQueries.useUpdateTeamMutation).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    } as unknown as ReturnType<typeof teamsQueries.useUpdateTeamMutation>);

    vi.mocked(teamsQueries.useDeleteTeamMutation).mockReturnValue({
      mutateAsync: mockDeleteMutate,
      isPending: false,
    } as unknown as ReturnType<typeof teamsQueries.useDeleteTeamMutation>);

    vi.mocked(teamsQueries.useAddTeamMemberMutation).mockReturnValue({
      mutateAsync: mockAddMemberMutate,
      isPending: false,
    } as unknown as ReturnType<typeof teamsQueries.useAddTeamMemberMutation>);

    vi.mocked(teamsQueries.useRemoveTeamMemberMutation).mockReturnValue({
      mutateAsync: mockRemoveMemberMutate,
      isPending: false,
    } as unknown as ReturnType<typeof teamsQueries.useRemoveTeamMemberMutation>);
  });

  it('renders teams KPI statistics and team card content', () => {
    render(
      <MemoryRouter>
        <AdminTeamsTab />
      </MemoryRouter>,
    );

    // KPI verification
    expect(screen.getByText(/Scrum Teams/i)).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // 1 team
    expect(screen.getByText(/Active Member Roster/i)).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // 2 members
    expect(screen.getByText(/^120 hrs$/i)).toBeInTheDocument();

    // Team Card Content
    expect(screen.getByText('Falcon Engine Team')).toBeInTheDocument();
    expect(screen.getAllByText(/Core Platform \(CORE\)/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('120 hrs/sprint')).toBeInTheDocument();
    expect(screen.getAllByText('Grace Hopper').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Linus Torvalds')).toBeInTheDocument();
    expect(screen.getByText('Scrum Master')).toBeInTheDocument();
    expect(screen.getByText('Developer')).toBeInTheDocument();
  });

  it('opens and closes create team modal', () => {
    render(
      <MemoryRouter>
        <AdminTeamsTab />
      </MemoryRouter>,
    );

    const createBtn = screen.getByRole('button', { name: /Create Scrum Team/i });
    fireEvent.click(createBtn);

    expect(screen.getByPlaceholderText(/e\.g\. Core Engine Team/i)).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    expect(screen.queryByPlaceholderText(/e\.g\. Core Engine Team/i)).not.toBeInTheDocument();
  });

  it('toggles add team member panel and executes remove member mutation', () => {
    render(
      <MemoryRouter>
        <AdminTeamsTab />
      </MemoryRouter>,
    );

    // Toggle enroll member panel
    const addMemberBtn = screen.getByRole('button', { name: /Add Team Member/i });
    fireEvent.click(addMemberBtn);

    expect(screen.getByText(/Enroll Team Member/i)).toBeInTheDocument();
    expect(screen.getByText(/Choose coworker/i)).toBeInTheDocument();

    // Remove member
    const removeBtns = screen.getAllByTitle('Remove member from team');
    expect(removeBtns.length).toBe(2);
    fireEvent.click(removeBtns[1]);

    expect(mockRemoveMemberMutate).toHaveBeenCalledWith({
      teamId: 1,
      memberId: 102,
    });
  });
});
