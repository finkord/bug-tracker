import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminDashboardPage } from './AdminDashboardPage';

vi.mock('../components/admin/index.js', () => ({
  AdminUsersTab: () => <div data-testid="mock-users-tab">Users Tab Content</div>,
  AdminRbacTab: () => <div data-testid="mock-rbac-tab">RBAC Tab Content</div>,
  AdminSecurityLogsTab: () => <div data-testid="mock-security-tab">Security Tab Content</div>,
  AdminProjectsTab: () => <div data-testid="mock-projects-tab">Projects Tab Content</div>,
  AdminTeamsTab: () => <div data-testid="mock-teams-tab">Teams Tab Content</div>,
  AdminBroadcastBannerCard: () => <div data-testid="mock-banner-card">Banner Control Content</div>,
}));

describe('AdminDashboardPage', () => {
  it('renders the header and navigation tab triggers', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminDashboardPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: /Administration & System Center/i }),
    ).toBeInTheDocument();

    expect(screen.getByRole('tab', { name: /Users & Identity/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Access Control & RBAC/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Scrum Teams/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Security Audit Logs/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Projects Governance/i })).toBeInTheDocument();

    // Default tab is users
    expect(screen.getByTestId('mock-users-tab')).toBeInTheDocument();
  });

  it('renders the tab specified by initial query parameter', () => {
    render(
      <MemoryRouter initialEntries={['/admin?tab=security']}>
        <AdminDashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('mock-security-tab')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-users-tab')).not.toBeInTheDocument();
  });

  it('switches rendered content when another tab trigger is clicked', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminDashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('mock-users-tab')).toBeInTheDocument();

    const rbacTab = screen.getByRole('tab', { name: /Access Control & RBAC/i });
    fireEvent.keyDown(rbacTab, { key: 'Enter', code: 'Enter' });

    expect(screen.getByTestId('mock-rbac-tab')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-users-tab')).not.toBeInTheDocument();

    const teamsTab = screen.getByRole('tab', { name: /Scrum Teams/i });
    fireEvent.keyDown(teamsTab, { key: 'Enter', code: 'Enter' });

    expect(screen.getByTestId('mock-teams-tab')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-users-tab')).not.toBeInTheDocument();

    const projectsTab = screen.getByRole('tab', { name: /Projects Governance/i });
    fireEvent.keyDown(projectsTab, { key: 'Enter', code: 'Enter' });

    expect(screen.getByTestId('mock-projects-tab')).toBeInTheDocument();
  });
});

