import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminRbacTab } from './AdminRbacTab';
import * as queries from '../../api/queries';

vi.mock('../../api/queries', () => ({
  useGroupsQuery: vi.fn(),
  useProjectRolesQuery: vi.fn(),
  usePermissionSchemesQuery: vi.fn(),
  useSecuritySchemesQuery: vi.fn(),
  useUsersQuery: vi.fn(),
  useCreateGroupMutation: vi.fn(),
  useAddUserToGroupMutation: vi.fn(),
  useRemoveUserFromGroupMutation: vi.fn(),
  useCreateProjectRoleMutation: vi.fn(),
  useCreatePermissionSchemeMutation: vi.fn(),
  useAddPermissionGrantMutation: vi.fn(),
  useRemovePermissionGrantMutation: vi.fn(),
}));

describe('AdminRbacTab Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(queries.useGroupsQuery).mockReturnValue({
      data: [
        {
          id: 1,
          name: 'Core Administrators',
          description: 'Full workspace governance',
          isSystem: true,
          userGroups: [{ id: 101, userId: 1, user: { id: 1, fullName: 'Admin User', email: 'admin@bugtracker.local' } }],
        },
      ],
      isLoading: false,
    } as unknown as ReturnType<typeof queries.useGroupsQuery>);

    vi.mocked(queries.useProjectRolesQuery).mockReturnValue({
      data: [
        { id: 1, name: 'Administrators', description: 'Project Admin', isDefault: false },
        { id: 2, name: 'Developers', description: 'Core Developers', isDefault: true },
      ],
      isLoading: false,
    } as unknown as ReturnType<typeof queries.useProjectRolesQuery>);

    vi.mocked(queries.usePermissionSchemesQuery).mockReturnValue({
      data: [
        { id: 1, name: 'Default Software Scheme', description: 'Standard matrix', isDefault: true, grants: [] },
      ],
      isLoading: false,
    } as unknown as ReturnType<typeof queries.usePermissionSchemesQuery>);

    vi.mocked(queries.useSecuritySchemesQuery).mockReturnValue({
      data: [
        { id: 1, name: 'Default Issue Security', description: 'Classification levels', defaultLevelId: 1, levels: [] },
      ],
      isLoading: false,
    } as unknown as ReturnType<typeof queries.useSecuritySchemesQuery>);

    vi.mocked(queries.useUsersQuery).mockReturnValue({
      data: { items: [], total: 0, page: 1, limit: 100 },
      isLoading: false,
    } as unknown as ReturnType<typeof queries.useUsersQuery>);

    vi.mocked(queries.useCreateGroupMutation).mockReturnValue({
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof queries.useCreateGroupMutation>);
    vi.mocked(queries.useAddUserToGroupMutation).mockReturnValue({
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof queries.useAddUserToGroupMutation>);
    vi.mocked(queries.useRemoveUserFromGroupMutation).mockReturnValue({
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof queries.useRemoveUserFromGroupMutation>);
    vi.mocked(queries.useCreateProjectRoleMutation).mockReturnValue({
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof queries.useCreateProjectRoleMutation>);
  });

  it('renders directly with sub-pills without any duplicate page h1 header banner', () => {
    render(
      <MemoryRouter initialEntries={['/admin?tab=rbac']}>
        <AdminRbacTab />
      </MemoryRouter>,
    );

    // Should NOT contain a duplicate h1 page header
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();

    // Secondary sub-pills should be rendered with counts
    expect(screen.getByRole('tab', { name: /Directory Groups/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Project Roles/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Permission Schemes/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Issue Security Schemes/i })).toBeInTheDocument();

    // Default subtab is groups
    expect(screen.getAllByText('Core Administrators').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('admin@bugtracker.local')).toBeInTheDocument();
  });

  it('renders specific subtab from subtab query param', () => {
    render(
      <MemoryRouter initialEntries={['/admin?tab=rbac&subtab=roles']}>
        <AdminRbacTab />
      </MemoryRouter>,
    );

    expect(screen.getByText('Globally Defined Project Roles')).toBeInTheDocument();
    expect(screen.getByText('Developers')).toBeInTheDocument();
  });

  it('switches subtab content when user navigates using sub-pills', () => {
    render(
      <MemoryRouter initialEntries={['/admin?tab=rbac']}>
        <AdminRbacTab />
      </MemoryRouter>,
    );

    const rolesTab = screen.getByRole('tab', { name: /Project Roles/i });
    fireEvent.keyDown(rolesTab, { key: 'Enter', code: 'Enter' });

    expect(screen.getByText('Globally Defined Project Roles')).toBeInTheDocument();

    const schemesTab = screen.getByRole('tab', { name: /Permission Schemes/i });
    fireEvent.keyDown(schemesTab, { key: 'Enter', code: 'Enter' });

    expect(screen.getByText('Reusable Permission Schemes')).toBeInTheDocument();
  });
});
