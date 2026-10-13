import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { IssueDetailHeader } from './IssueDetailHeader';
import type { IssueItem, UserProfile } from '../../api/types/index.js';

const mockUseMyProjectPermissionsQuery = vi.fn();

vi.mock('../../api/queries/useProjectsQuery.js', () => ({
  useMyProjectPermissionsQuery: (projectId?: number) =>
    mockUseMyProjectPermissionsQuery(projectId),
}));

const baseIssue: IssueItem = {
  id: 10,
  key: 'PROJ-10',
  title: 'Setup authentication',
  projectId: 1,
  projectKey: 'PROJ',
  projectName: 'Core Platform',
  issueType: 'TASK',
  status: 'OPEN',
  priority: 'HIGH',
  reporterId: 100,
  reporter: {
    id: 100,
    fullName: 'John Reporter',
    email: 'reporter@test.com',
  },
  assignee: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  loggedHours: 0,
};

const adminUser: UserProfile = {
  id: 1,
  fullName: 'Admin User',
  email: 'admin@test.com',
  systemRole: 'ADMIN',
  isAdmin: true,
  isActivated: true,
  isBlocked: false,
  twoFactorEnabled: false,
  oauthProvider: 'LOCAL',
  hasPassword: true,
};

const regularUser: UserProfile = {
  id: 200,
  fullName: 'Alice Dev',
  email: 'alice@test.com',
  systemRole: 'USER',
  isAdmin: false,
  isActivated: true,
  isBlocked: false,
  twoFactorEnabled: false,
  oauthProvider: 'LOCAL',
  hasPassword: true,
};

const reporterUser: UserProfile = {
  id: 100,
  fullName: 'John Reporter',
  email: 'reporter@test.com',
  systemRole: 'USER',
  isAdmin: false,
  isActivated: true,
  isBlocked: false,
  twoFactorEnabled: false,
  oauthProvider: 'LOCAL',
  hasPassword: true,
};

describe('IssueDetailHeader - Permissions & Delete Option', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMyProjectPermissionsQuery.mockReturnValue({ data: {} });
  });

  it('allows system admin to see Delete Issue in the menu', () => {
    render(
      <MemoryRouter>
        <IssueDetailHeader
          issue={baseIssue}
          currentUser={adminUser}
          onStatusChange={vi.fn()}
          onDeleteClick={vi.fn()}
        />
      </MemoryRouter>,
    );

    const menuTrigger = screen.getByLabelText('More issue actions');
    fireEvent.pointerDown(menuTrigger, { button: 0 });

    expect(screen.getByText('Delete Issue')).toBeInTheDocument();
  });

  it('hides Delete Issue from random regular users without project permissions', () => {
    mockUseMyProjectPermissionsQuery.mockReturnValue({ data: { DELETE_ISSUES: false } });

    render(
      <MemoryRouter>
        <IssueDetailHeader
          issue={baseIssue}
          currentUser={regularUser}
          onStatusChange={vi.fn()}
          onDeleteClick={vi.fn()}
        />
      </MemoryRouter>,
    );

    const menuTrigger = screen.getByLabelText('More issue actions');
    fireEvent.pointerDown(menuTrigger, { button: 0 });

    expect(screen.queryByText('Delete Issue')).not.toBeInTheDocument();
  });

  it('shows Delete Issue to project member with DELETE_ISSUES permission', () => {
    mockUseMyProjectPermissionsQuery.mockReturnValue({ data: { DELETE_ISSUES: true } });

    render(
      <MemoryRouter>
        <IssueDetailHeader
          issue={baseIssue}
          currentUser={regularUser}
          onStatusChange={vi.fn()}
          onDeleteClick={vi.fn()}
        />
      </MemoryRouter>,
    );

    const menuTrigger = screen.getByLabelText('More issue actions');
    fireEvent.pointerDown(menuTrigger, { button: 0 });

    expect(screen.getByText('Delete Issue')).toBeInTheDocument();
  });

  it('shows Delete Issue to reporter within 24h grace period for unstarted issue', () => {
    mockUseMyProjectPermissionsQuery.mockReturnValue({ data: {} });

    render(
      <MemoryRouter>
        <IssueDetailHeader
          issue={baseIssue}
          currentUser={reporterUser}
          onStatusChange={vi.fn()}
          onDeleteClick={vi.fn()}
        />
      </MemoryRouter>,
    );

    const menuTrigger = screen.getByLabelText('More issue actions');
    fireEvent.pointerDown(menuTrigger, { button: 0 });

    expect(screen.getByText('Delete Issue')).toBeInTheDocument();
  });

  it('hides Delete Issue from reporter if issue has already been started or worked on', () => {
    mockUseMyProjectPermissionsQuery.mockReturnValue({ data: {} });

    const inProgressIssue: IssueItem = {
      ...baseIssue,
      status: 'IN_PROGRESS',
      loggedHours: 2,
    };

    render(
      <MemoryRouter>
        <IssueDetailHeader
          issue={inProgressIssue}
          currentUser={reporterUser}
          onStatusChange={vi.fn()}
          onDeleteClick={vi.fn()}
        />
      </MemoryRouter>,
    );

    const menuTrigger = screen.getByLabelText('More issue actions');
    fireEvent.pointerDown(menuTrigger, { button: 0 });

    expect(screen.queryByText('Delete Issue')).not.toBeInTheDocument();
  });
});
