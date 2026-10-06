import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProjectSettingsPage } from './ProjectSettingsPage';

vi.mock('../api/queries', () => ({
  useProjectsQuery: () => ({
    data: [{ id: 1, key: 'BTC', name: 'BugTracker Core' }],
    isLoading: false,
  }),
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
  useTeamsQuery: () => ({
    data: [
      {
        id: 1,
        name: 'Alpha Team',
        description: 'Core platform team',
        sprintCapacityHours: 160,
        leadId: 1,
        lead: { id: 1, fullName: 'Chief Architect' },
        members: [],
      },
    ],
    isLoading: false,
  }),
  useTeamCapacityQuery: () => ({
    data: { totalCapacityHours: 160, members: [] },
    isLoading: false,
  }),
  useProjectComponentsQuery: () => ({
    data: [{ id: 1, name: 'Frontend Engine', description: 'UI and React layer' }],
    isLoading: false,
  }),
  useProjectVersionsQuery: () => ({
    data: [{ id: 1, name: 'v1.0.0', status: 'UNRELEASED', description: 'Initial stable launch' }],
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
    data: { items: [{ id: 1, fullName: 'Chief Architect', email: 'admin@bugtracker.local' }] },
    isLoading: false,
  }),
  useUserDetailQuery: () => ({
    data: { id: 1, fullName: 'Chief Architect', email: 'admin@bugtracker.local' },
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
  useUpdateProjectMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteProjectMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUploadProjectAvatarMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateProjectAvatarMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCreateTeamMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateTeamMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteTeamMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUploadTeamAvatarMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAddTeamMemberMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateTeamMemberMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRemoveTeamMemberMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCreateProjectComponentMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteProjectComponentMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCreateProjectVersionMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateProjectVersionMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useReleaseProjectVersionMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteProjectVersionMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAddActorToProjectRoleMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRemoveActorFromProjectRoleMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAssignPermissionSchemeToProjectMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useProjectWebhooksQuery: () => ({
    data: [
      {
        id: 1,
        name: 'Deployment Ping',
        url: 'https://example.com/wh',
        format: 'generic',
        events: ['*'],
        isActive: true,
        failureCount: 0,
      },
    ],
    isLoading: false,
  }),
  useCreateWebhookMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateWebhookMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteWebhookMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useTestWebhookMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

describe('ProjectSettingsPage', () => {
  it('renders with full width container and all 6 sidebar navigation tabs', () => {
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

    // Sidebar navigation tabs
    expect(screen.getByRole('button', { name: /^General$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Teams & Rosters/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Components/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Releases & Versions/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /People & Permissions/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Webhooks/i })).toBeInTheDocument();

    // Default General tab content
    expect(screen.getByRole('heading', { name: /General Project Settings/i })).toBeInTheDocument();
    expect(screen.getAllByText('BTC').length).toBeGreaterThanOrEqual(1);
  });

  it('navigates to Teams tab and displays team cards', () => {
    render(
      <MemoryRouter initialEntries={['/projects/1/settings?tab=teams']}>
        <Routes>
          <Route path="/projects/:id/settings" element={<ProjectSettingsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /Project Teams/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Team/i })).toBeInTheDocument();
    expect(screen.getByText('Alpha Team')).toBeInTheDocument();
    expect(screen.getByText(/160h \/ sprint/i)).toBeInTheDocument();
  });

  it('navigates to People & Permissions tab and renders permission scheme selector and roles', () => {
    render(
      <MemoryRouter initialEntries={['/projects/1/settings?tab=access']}>
        <Routes>
          <Route path="/projects/:id/settings" element={<ProjectSettingsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /People, Roles & Permission Scheme/i })).toBeInTheDocument();
    expect(screen.getByText(/Active Permission Scheme/i)).toBeInTheDocument();
    expect(screen.getByText('Administrators')).toBeInTheDocument();
  });

  it('renders project header with entity avatar, key badge, and project lead', () => {
    render(
      <MemoryRouter initialEntries={['/projects/1/settings']}>
        <Routes>
          <Route path="/projects/:id/settings" element={<ProjectSettingsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /BugTracker Core/i })).toBeInTheDocument();
    expect(screen.getByText(/Lead: Chief Architect/i)).toBeInTheDocument();
  });

  it('navigates via sub-path URL to webhooks tab', () => {
    render(
      <MemoryRouter initialEntries={['/projects/1/settings/webhooks']}>
        <Routes>
          <Route path="/projects/:id/settings/:tab" element={<ProjectSettingsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /Outbound Webhooks/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /New Webhook/i })).toBeInTheDocument();
  });
});
