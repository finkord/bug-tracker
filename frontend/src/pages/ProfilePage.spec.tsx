import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProfilePage } from './ProfilePage';

vi.mock('../store', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      email: 'admin@bugtracker.local',
      fullName: 'Chief Architect',
      systemRole: 'ADMIN',
      jobTitle: 'Lead Security Engineer',
    },
    refreshUser: vi.fn(),
  }),
}));

vi.mock('../components/profile', () => ({
  ProfileOverviewHeader: () => <div data-testid="mock-profile-header">Profile Overview</div>,
  ProfileSecurityCard: () => <div data-testid="mock-security-card">Security Card</div>,
  ProfileTwoFactorCard: () => <div data-testid="mock-2fa-card">2FA Card</div>,
  ProfileSessionsCard: () => <div data-testid="mock-sessions-card">Sessions Card</div>,
  ProfileTimeTab: () => <div data-testid="mock-time-tab">Time Tab</div>,
}));

describe('ProfilePage', () => {
  it('renders with full width container class and no max-w restriction', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/profile']}>
        <ProfilePage />
      </MemoryRouter>,
    );

    const rootDiv = container.firstElementChild as HTMLElement;
    expect(rootDiv).toBeInTheDocument();
    expect(rootDiv.className).toContain('w-full');
    expect(rootDiv.className).not.toContain('max-w-4xl');
  });

  it('renders overview header and default security tab content', () => {
    render(
      <MemoryRouter initialEntries={['/profile']}>
        <ProfilePage />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('mock-profile-header')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Security & Account/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Time & Effort/i })).toBeInTheDocument();
    expect(screen.getByTestId('mock-security-card')).toBeInTheDocument();
  });

  it('renders time tab when activeTab is time', () => {
    render(
      <MemoryRouter initialEntries={['/profile?tab=time']}>
        <ProfilePage />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('mock-time-tab')).toBeInTheDocument();
  });
});
