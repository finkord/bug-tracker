import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminUsersTab } from './AdminUsersTab';
import * as queries from '../../api/queries';

vi.mock('../../api/queries', () => ({
  useUsersQuery: vi.fn(),
  useAdminStatsQuery: vi.fn(),
  useGroupsQuery: vi.fn(),
  useUpdateUserRoleMutation: vi.fn(),
  useBlockUserMutation: vi.fn(),
  useUnblockUserMutation: vi.fn(),
  useAdminActivateUserMutation: vi.fn(),
  useAdminResetUser2FaMutation: vi.fn(),
  useDeleteUserMutation: vi.fn(),
  useAddUserToGroupMutation: vi.fn(),
  useRemoveUserFromGroupMutation: vi.fn(),
  useUserDetailQuery: vi.fn().mockReturnValue({ data: null }),
}));

describe('AdminUsersTab Component', () => {
  const mockUsers = [
    {
      id: 1,
      email: 'admin@bugtracker.local',
      fullName: 'System Administrator',
      systemRole: 'ADMIN',
      jobTitle: 'Chief Architect',
      isBlocked: false,
      isActivated: true,
      twoFactorEnabled: true,
      isRoot: true,
      avatarUrl: null,
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 2,
      email: 'dev@bugtracker.local',
      fullName: 'Alice Developer',
      systemRole: 'USER',
      jobTitle: 'Senior Frontend Engineer',
      isBlocked: false,
      isActivated: true,
      twoFactorEnabled: false,
      isRoot: false,
      avatarUrl: null,
      createdAt: '2026-02-01T00:00:00Z',
    },
  ];

  const mockGroups = [
    {
      id: 10,
      name: 'administrators',
      description: 'Superusers with unrestricted system access',
      isSystem: true,
      userGroups: [{ userId: 1 }],
    },
    {
      id: 20,
      name: 'engineering',
      description: 'Product Engineering Guild',
      isSystem: false,
      userGroups: [{ userId: 2 }],
    },
  ];

  const mockStats = {
    totalUsers: 2,
    activeUsers: 2,
    blockedUsers: 0,
    twoFactorPercentage: 50,
    twoFactorAdoptionCount: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(queries.useUsersQuery).mockReturnValue({
      data: { items: mockUsers, total: 2 },
      isLoading: false,
    } as any);

    vi.mocked(queries.useAdminStatsQuery).mockReturnValue({
      data: mockStats,
      isLoading: false,
    } as any);

    vi.mocked(queries.useGroupsQuery).mockReturnValue({
      data: mockGroups,
      isLoading: false,
    } as any);

    vi.mocked(queries.useUpdateUserRoleMutation).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    } as any);

    vi.mocked(queries.useBlockUserMutation).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    } as any);

    vi.mocked(queries.useUnblockUserMutation).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    } as any);

    vi.mocked(queries.useAdminActivateUserMutation).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    } as any);

    vi.mocked(queries.useAdminResetUser2FaMutation).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    } as any);

    vi.mocked(queries.useDeleteUserMutation).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    } as any);

    vi.mocked(queries.useAddUserToGroupMutation).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    } as any);

    vi.mocked(queries.useRemoveUserFromGroupMutation).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    } as any);

    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('renders user table with Job Title, Directory Groups & Authority, and Reset Password spelled out', () => {
    render(
      <MemoryRouter>
        <AdminUsersTab />
      </MemoryRouter>,
    );

    expect(screen.getByText('System Administrator')).toBeDefined();
    expect(screen.getByText('Alice Developer')).toBeDefined();
    expect(screen.getByText('Job Title')).toBeDefined();
    expect(screen.getByText('Chief Architect')).toBeDefined();
    expect(screen.getByText('Senior Frontend Engineer')).toBeDefined();
    expect(screen.getByText(/Directory Groups & Authority/i)).toBeDefined();
    expect(screen.getByText(/administrators \(Root\)/i)).toBeDefined();
    expect(screen.getByText('engineering')).toBeDefined();

    // Reset Password spelled out (not "Reset Pwd")
    const resetButtons = screen.getAllByRole('button', { name: /Reset Password/i });
    expect(resetButtons.length).toBe(2);
  });

  it('provides copy email functionality with clipboard feedback', async () => {
    render(
      <MemoryRouter>
        <AdminUsersTab />
      </MemoryRouter>,
    );

    const copyButtons = screen.getAllByTitle('Copy email to clipboard');
    expect(copyButtons.length).toBeGreaterThan(0);

    fireEvent.click(copyButtons[0]);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('admin@bugtracker.local');

    await waitFor(() => {
      expect(screen.getByTitle('Copied to clipboard!')).toBeDefined();
    });
  });

  it('renders protected button for Root Administrator accounts', () => {
    render(
      <MemoryRouter>
        <AdminUsersTab />
      </MemoryRouter>,
    );

    const protectedBtn = screen.getByRole('button', { name: /Protected/i });
    expect(protectedBtn).toBeDefined();
    expect(protectedBtn.getAttribute('disabled')).toBeDefined();
  });

  it('opens directory group assignment modal when clicking manage groups button', async () => {
    render(
      <MemoryRouter>
        <AdminUsersTab />
      </MemoryRouter>,
    );

    const manageGroupsButtons = screen.getAllByTitle(/Manage directory groups/i);
    expect(manageGroupsButtons.length).toBe(2);

    fireEvent.click(manageGroupsButtons[1]); // Alice Developer

    await waitFor(() => {
      expect(screen.getByText(/Directory Groups: Alice Developer/i)).toBeDefined();
    });
  });
});
