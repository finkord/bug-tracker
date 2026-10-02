import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { WorkspaceHeader } from './WorkspaceHeader';
import { useSidebarStore } from '../../store/useSidebarStore';

vi.mock('../../store', async () => {
  const actual = await vi.importActual('../../store');
  return {
    ...actual,
    useAuth: () => ({
      user: { id: 1, fullName: 'Admin User', email: 'admin@bugtracker.local' },
    }),
  };
});

vi.mock('./HeaderBreadcrumbs', () => ({
  HeaderBreadcrumbs: () => <div data-testid="mock-breadcrumbs">Breadcrumbs</div>,
}));

vi.mock('./WorkspaceGlobalSearch', () => ({
  WorkspaceGlobalSearch: () => <div data-testid="mock-search">Search</div>,
}));

vi.mock('./WorkspaceBroadcastBanner', () => ({
  WorkspaceBroadcastBanner: () => null,
}));

vi.mock('./WorkspaceCreateIssueAction', () => ({
  WorkspaceCreateIssueAction: () => <button>+ Create</button>,
}));

vi.mock('../notifications/NotificationBell', () => ({
  NotificationBell: () => <button>Bell</button>,
}));

describe('WorkspaceHeader Component', () => {
  beforeEach(() => {
    useSidebarStore.setState({
      collapsed: false,
      mobileOpen: false,
    });
  });

  it('renders permanent desktop sidebar toggle button when sidebar is expanded', () => {
    render(
      <MemoryRouter>
        <WorkspaceHeader />
      </MemoryRouter>,
    );

    const toggleButton = screen.getByRole('button', { name: /collapse sidebar navigation/i });
    expect(toggleButton).toBeInTheDocument();

    fireEvent.click(toggleButton);
    expect(useSidebarStore.getState().collapsed).toBe(true);
  });

  it('renders permanent desktop sidebar toggle button in same position when sidebar is collapsed', () => {
    useSidebarStore.setState({ collapsed: true });

    render(
      <MemoryRouter>
        <WorkspaceHeader />
      </MemoryRouter>,
    );

    const toggleButton = screen.getByRole('button', { name: /expand sidebar navigation/i });
    expect(toggleButton).toBeInTheDocument();

    fireEvent.click(toggleButton);
    expect(useSidebarStore.getState().collapsed).toBe(false);
  });
});
