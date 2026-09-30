import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProjectSettingsPage } from './ProjectSettingsPage';

vi.mock('../api/queries', () => ({
  useProjectDetailQuery: () => ({
    data: {
      id: 1,
      name: 'BugTracker Core',
      key: 'BTC',
      description: 'Main project repo',
      leadId: 1,
      lead: { id: 1, fullName: 'Chief Architect' },
      permissionSchemeId: 1,
    },
    isLoading: false,
  }),
  useProjectPeopleQuery: () => ({
    data: [
      {
        roleId: 1,
        roleName: 'Administrators',
        description: 'Full administrative access',
        users: [
          {
            actorId: 1,
            user: {
              id: 1,
              fullName: 'Chief Architect',
              email: 'admin@bugtracker.local',
              systemRole: 'ADMIN',
            },
          },
        ],
        groups: [],
      },
    ],
    isLoading: false,
  }),
  useUsersQuery: () => ({
    data: { items: [{ id: 1, fullName: 'Chief Architect' }] },
    isLoading: false,
  }),
  useGroupsQuery: () => ({
    data: [],
    isLoading: false,
  }),
  usePermissionSchemesQuery: () => ({
    data: [{ id: 1, name: 'Default Scheme', isDefault: true }],
    isLoading: false,
  }),
  useMyProjectPermissionsQuery: () => ({
    data: { BROWSE_PROJECTS: true, ADMINISTER_PROJECTS: true },
    isLoading: false,
  }),
  useAddActorToProjectRoleMutation: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useRemoveActorFromProjectRoleMutation: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useAssignPermissionSchemeToProjectMutation: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

describe('ProjectSettingsPage', () => {
  it('renders with full width container class and no max-w restriction', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/projects/1/settings']}>
        <Routes>
          <Route path="/projects/:id/settings" element={<ProjectSettingsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const rootDiv = container.firstElementChild as HTMLElement;
    expect(rootDiv).toBeInTheDocument();
    expect(rootDiv.className).toContain('w-full');
    expect(rootDiv.className).not.toContain('max-w-6xl');
  });

  it('renders project header, active permission scheme selector, and role members', () => {
    render(
      <MemoryRouter initialEntries={['/projects/1/settings']}>
        <Routes>
          <Route path="/projects/:id/settings" element={<ProjectSettingsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /People & Permissions/i })).toBeInTheDocument();
    expect(screen.getByText(/Active Permission Scheme/i)).toBeInTheDocument();
    expect(screen.getByText(/Project Roles & Members/i)).toBeInTheDocument();
    expect(screen.getByText('BTC')).toBeInTheDocument();
  });
});
