import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';

vi.mock('../../api/queries', () => ({
  useAdminStatsQuery: () => ({
    data: {
      totalUsers: 42,
      activeUsers: 38,
      blockedUsers: 4,
      twoFactorAdoptionCount: 30,
      twoFactorPercentage: 71,
      roleBreakdown: { ADMIN: 3, USER: 39 },
    },
    isLoading: false,
  }),
}));

describe('AdminLayout', () => {
  it('renders the horizontal navigation tabs and sub-route outlet', () => {
    render(
      <MemoryRouter initialEntries={['/admin/users']}>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="users" element={<div data-testid="mock-outlet-users">Users Sub-Route</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    // Horizontal navigation tabs
    const nav = screen.getByRole('navigation', { name: /Admin Navigation Tabs/i });
    expect(nav).toBeInTheDocument();

    // Tab links
    expect(screen.getByRole('link', { name: /Users & Identity/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Scrum Teams/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Access Control & RBAC/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Security & Audit Logs/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Projects Governance/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /System Announcements/i })).toBeInTheDocument();

    // Active tab indicator on Users
    const usersTab = screen.getByRole('link', { name: /Users & Identity/i });
    expect(usersTab).toHaveAttribute('id', 'admin-tab-users');

    // Outlet content
    expect(screen.getByTestId('mock-outlet-users')).toBeInTheDocument();
  });

  it('renders sub-route content based on active URL', () => {
    render(
      <MemoryRouter initialEntries={['/admin/announcements']}>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="announcements" element={<div data-testid="mock-outlet-announcements">Announcements Hub</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('mock-outlet-announcements')).toBeInTheDocument();
  });

  it('translates vertical wheel event on tab strip to horizontal scroll', () => {
    render(
      <MemoryRouter initialEntries={['/admin/users']}>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="users" element={<div>Users</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const nav = screen.getByRole('navigation', { name: /Admin Navigation Tabs/i });

    // Mock scrollWidth > clientWidth so tab is scrollable
    Object.defineProperty(nav, 'scrollWidth', { configurable: true, value: 1200 });
    Object.defineProperty(nav, 'clientWidth', { configurable: true, value: 600 });
    Object.defineProperty(nav, 'scrollLeft', { configurable: true, writable: true, value: 0 });

    act(() => {
      fireEvent.wheel(nav, { deltaY: 80, deltaX: 0 });
    });

    expect(nav.scrollLeft).toBeCloseTo(176);
  });
});
