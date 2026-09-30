import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GroupsManagerTab } from './GroupsManagerTab';
import type { GroupItem, UserProfile } from '../../../api/client';

vi.mock('../../../api/queries', () => ({
  useUsersQuery: () => ({
    data: {
      items: [
        { id: 1, fullName: 'System Administrator', email: 'admin@bugtracker.local', systemRole: 'ADMIN' },
        { id: 2, fullName: 'Volodymyr Fufalko', email: 'devfinkord@gmail.com', systemRole: 'ADMIN' },
      ],
      total: 2,
    },
    isLoading: false,
  }),
}));

const mockGroup: GroupItem = {
  id: 1,
  name: 'administrators',
  description: 'System administrators with global access',
  isSystem: true,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  userGroups: [
    {
      id: 101,
      userId: 1,
      groupId: 1,
      createdAt: '2026-01-01',
      user: {
        id: 1,
        fullName: 'System Administrator',
        email: 'admin@bugtracker.local',
        systemRole: 'ADMIN',
      },
    },
    {
      id: 102,
      userId: 2,
      groupId: 1,
      createdAt: '2026-01-01',
      user: {
        id: 2,
        fullName: 'Volodymyr Fufalko',
        email: 'devfinkord@gmail.com',
        systemRole: 'ADMIN',
      },
    },
  ],
};

const mockAllUsers: UserProfile[] = [
  {
    id: 1,
    fullName: 'System Administrator',
    email: 'admin@bugtracker.local',
    systemRole: 'ADMIN',
  },
  {
    id: 2,
    fullName: 'Volodymyr Fufalko',
    email: 'devfinkord@gmail.com',
    systemRole: 'ADMIN',
  },
];

describe('GroupsManagerTab', () => {
  it('displays All Users Enrolled indicator and disabled select when all users are already members', () => {
    render(
      <GroupsManagerTab
        groups={[mockGroup]}
        allUsers={mockAllUsers}
        selectedGroup={mockGroup}
        onSelectGroup={vi.fn()}
        onCreateGroup={vi.fn()}
        onAddUserToGroup={vi.fn()}
        onRemoveUserFromGroup={vi.fn()}
      />,
    );

    // Verify group header and members
    expect(screen.getByRole('heading', { name: 'administrators' })).toBeInTheDocument();
    expect(screen.getByText('Group Members (2)')).toBeInTheDocument();

    // Verify clear explanation that all users are already members
    expect(screen.getByText(/All Users Enrolled/i)).toBeInTheDocument();
    expect(screen.getByText(/All users already in group/i)).toBeInTheDocument();
  });

  it('renders Add Members button and opens the AddGroupMembersModal when clicked', () => {
    render(
      <GroupsManagerTab
        groups={[mockGroup]}
        allUsers={mockAllUsers}
        selectedGroup={mockGroup}
        onSelectGroup={vi.fn()}
        onCreateGroup={vi.fn()}
        onAddUserToGroup={vi.fn()}
        onRemoveUserFromGroup={vi.fn()}
      />,
    );

    const addMembersBtn = screen.getByRole('button', { name: /Add Members/i });
    expect(addMembersBtn).toBeInTheDocument();

    fireEvent.click(addMembersBtn);

    // Dialog opens with title
    expect(screen.getByRole('heading', { name: /Add Members to administrators/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search by name or email/i)).toBeInTheDocument();
  });
});
