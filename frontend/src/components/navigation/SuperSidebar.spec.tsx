import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SuperSidebar } from './SuperSidebar';
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

vi.mock('../../api/queries', () => ({
  useProjectsQuery: () => ({
    data: [
      { id: 1, key: 'ALPHA', name: 'Alpha Project' },
    ],
  }),
  useSavedFiltersQuery: () => ({
    data: [],
  }),
}));

describe('SuperSidebar Flyout Overlay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useSidebarStore.setState({
      collapsed: true,
      collapseMode: 'rail',
      mobileOpen: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders static sidebar without vertical border delimiter', () => {
    useSidebarStore.setState({
      collapsed: false,
    });

    const { container } = render(
      <MemoryRouter>
        <SuperSidebar />
      </MemoryRouter>,
    );

    const aside = container.querySelector('aside')!;
    expect(aside).toHaveClass('w-60');
    // Ensure no right border is rendered on static sidebar to avoid delimiting header
    expect(aside.className).not.toContain('border-r');
  });

  it('renders collapsed rail and expands to flyout on hover', () => {
    const { container } = render(
      <MemoryRouter>
        <SuperSidebar />
      </MemoryRouter>,
    );

    const aside = container.querySelector('aside')!;
    expect(aside).toHaveClass('w-[60px]');

    // Hover over container
    const sidebarWrapper = aside.parentElement!;
    fireEvent.mouseEnter(sidebarWrapper);

    // Fast-forward past 100ms enter delay
    act(() => {
      vi.advanceTimersByTime(110);
    });

    expect(aside).toHaveClass('fixed');
    expect(aside).toHaveClass('w-60');
    expect(aside).toHaveClass('shadow-2xl');

    // Mouse leave container
    fireEvent.mouseLeave(sidebarWrapper);

    // Fast-forward past 150ms leave delay
    act(() => {
      vi.advanceTimersByTime(160);
    });

    expect(aside).not.toHaveClass('fixed');
    expect(aside).toHaveClass('w-[60px]');
  });

  it('allows opening on hover when collapsed to 0px (hidden mode)', () => {
    useSidebarStore.setState({
      collapsed: true,
      collapseMode: 'hidden',
    });

    const { container } = render(
      <MemoryRouter>
        <SuperSidebar />
      </MemoryRouter>,
    );

    const aside = container.querySelector('aside')!;
    expect(aside).toHaveClass('w-0');

    // Find the invisible hover trigger strip along the left edge
    const trigger = screen.getByTestId('sidebar-hover-trigger');
    expect(trigger).toBeInTheDocument();

    // Hover over the left-edge trigger strip
    fireEvent.mouseEnter(trigger);

    // Fast-forward past 100ms enter delay
    act(() => {
      vi.advanceTimersByTime(110);
    });

    expect(aside).toHaveClass('fixed');
    expect(aside).toHaveClass('w-60');
    expect(aside).toHaveClass('shadow-2xl');

    // Mouse leaves the flyout
    fireEvent.mouseLeave(aside);

    // Fast-forward past 150ms leave delay
    act(() => {
      vi.advanceTimersByTime(160);
    });

    expect(aside).not.toHaveClass('fixed');
    expect(aside).toHaveClass('w-0');
  });

  it('renders brand logo row and workspace project switcher as separate rows', () => {
    useSidebarStore.setState({
      collapsed: false,
    });

    render(
      <MemoryRouter>
        <SuperSidebar />
      </MemoryRouter>,
    );

    // Brand logo row
    expect(screen.getByText('BugTracker')).toBeInTheDocument();
    // Project switcher row
    expect(screen.getByRole('button', { name: /switch active project/i })).toHaveTextContent('Alpha Project');
  });

  it('renders centered hover tab indicator in 0px collapsed state', () => {
    useSidebarStore.setState({
      collapsed: true,
      collapseMode: 'hidden',
    });

    render(
      <MemoryRouter>
        <SuperSidebar />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('sidebar-hover-tab')).toBeInTheDocument();
  });

  it('dismisses flyout immediately when Escape key is pressed', () => {
    const { container } = render(
      <MemoryRouter>
        <SuperSidebar />
      </MemoryRouter>,
    );

    const aside = container.querySelector('aside')!;
    const sidebarWrapper = aside.parentElement!;

    // Hover to open flyout
    fireEvent.mouseEnter(sidebarWrapper);
    act(() => {
      vi.advanceTimersByTime(110);
    });
    expect(aside).toHaveClass('fixed');

    // Press Escape
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(aside).not.toHaveClass('fixed');
    expect(aside).toHaveClass('w-[60px]');
  });
});
