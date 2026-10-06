import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
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
  useUserDetailQuery: () => ({
    data: null,
  }),
}));

const mockGroup: GroupItem = {
  id: 1,
  name: 'administrators',
  description: 'System administrators with global access',
  isSystem: true,
  createdAt: '2026-01-01',
  userGroups: [
    {
      id: 101,
      userId: 1,
      user: {
        id: 1,
        fullName: 'System Administrator',
        email: 'admin@bugtracker.local',
        systemRole: 'ADMIN',
        isActivated: true,
        isBlocked: false,
        twoFactorEnabled: false,
        createdAt: '2026-01-01',
      },
    },
    {
      id: 102,
      userId: 2,
      user: {
        id: 2,
        fullName: 'Volodymyr Fufalko',
        email: 'devfinkord@gmail.com',
        systemRole: 'ADMIN',
        isActivated: true,
        isBlocked: false,
        twoFactorEnabled: false,
        createdAt: '2026-01-01',
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
    isActivated: true,
    isBlocked: false,
    twoFactorEnabled: false,
    createdAt: '2026-01-01',
  },
  {
    id: 2,
    fullName: 'Volodymyr Fufalko',
    email: 'devfinkord@gmail.com',
    systemRole: 'ADMIN',
    isActivated: true,
    isBlocked: false,
    twoFactorEnabled: false,
    createdAt: '2026-01-01',
  },
];

describe('GroupsManagerTab', () => {
  it('renders members in a unified DataTable with member search and live count badge', () => {
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
    expect(screen.getByText('Group Members')).toBeInTheDocument();
    expect(screen.getByText('2 members')).toBeInTheDocument();

    // Verify member search input
    expect(screen.getByPlaceholderText(/Filter members by name or email/i)).toBeInTheDocument();

    // Table headers
    expect(screen.getByText('Member')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('System Authority')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();

    // Table rows
    expect(screen.getByText('System Administrator')).toBeInTheDocument();
    expect(screen.getByText('Volodymyr Fufalko')).toBeInTheDocument();
  });

  it('filters members when typing in search input', () => {
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

    const searchInput = screen.getByPlaceholderText(/Filter members by name or email/i);
    fireEvent.change(searchInput, { target: { value: 'Volodymyr' } });

    expect(screen.getByText('Volodymyr Fufalko')).toBeInTheDocument();
    expect(screen.queryByText('System Administrator')).not.toBeInTheDocument();
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

  it('renders Delete Group button for custom groups and opens ConfirmDialog', () => {
    const customGroup: GroupItem = {
      id: 5,
      name: 'contractors',
      description: 'External contractors',
      isSystem: false,
      createdAt: '2026-01-01',
      userGroups: [],
    };
    const onDeleteGroup = vi.fn();

    render(
      <GroupsManagerTab
        groups={[customGroup]}
        allUsers={mockAllUsers}
        selectedGroup={customGroup}
        onSelectGroup={vi.fn()}
        onCreateGroup={vi.fn()}
        onAddUserToGroup={vi.fn()}
        onRemoveUserFromGroup={vi.fn()}
        onDeleteGroup={onDeleteGroup}
      />,
    );

    const deleteBtn = screen.getByRole('button', { name: /Delete Group/i });
    expect(deleteBtn).toBeInTheDocument();

    fireEvent.click(deleteBtn);
    expect(screen.getByText(/Are you sure you want to delete directory group "contractors"/i)).toBeInTheDocument();
  });
});
