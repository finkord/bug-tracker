import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SidebarProjectSwitcher } from './SidebarProjectSwitcher';
import { useActiveProjectStore } from '../../store/useActiveProjectStore';
import type { ProjectItem } from '../../api/client';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('SidebarProjectSwitcher Component', () => {
  const mockProjects: ProjectItem[] = [
    {
      id: 1,
      name: 'Alpha Project',
      key: 'ALPHA',
      description: 'Alpha description',
      ownerId: 1,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
    {
      id: 2,
      name: 'Beta Platform',
      key: 'BETA',
      description: 'Beta description',
      ownerId: 1,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    useActiveProjectStore.setState({
      activeProjectId: null,
      activeProjectKey: null,
      activeProjectName: null,
      recentProjects: [],
    });
  });

  it('renders active project info when project is provided', () => {
    render(
      <MemoryRouter>
        <SidebarProjectSwitcher
          projects={mockProjects}
          activeProject={mockProjects[0]}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Alpha Project')).toBeInTheDocument();
    expect(screen.getByText('ALPHA')).toBeInTheDocument();
  });

  it('renders fallback label when no active project is provided', () => {
    render(
      <MemoryRouter>
        <SidebarProjectSwitcher projects={mockProjects} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Select Project')).toBeInTheDocument();
    expect(screen.getByText('Workspace')).toBeInTheDocument();
  });

  it('opens dropdown and displays list of projects when clicked', () => {
    render(
      <MemoryRouter>
        <SidebarProjectSwitcher
          projects={mockProjects}
          activeProject={mockProjects[0]}
        />
      </MemoryRouter>,
    );

    const triggerButton = screen.getByRole('button', { name: /switch active project/i });
    fireEvent.pointerDown(triggerButton, { button: 0 });
    fireEvent.keyDown(triggerButton, { key: 'ArrowDown' });

    expect(screen.getByPlaceholderText('Find project...')).toBeInTheDocument();
    expect(screen.getByText('Beta Platform')).toBeInTheDocument();
  });

  it('navigates to selected project board and updates active project store', () => {
    const onNavigateMock = vi.fn();

    render(
      <MemoryRouter>
        <SidebarProjectSwitcher
          projects={mockProjects}
          activeProject={mockProjects[0]}
          onNavigate={onNavigateMock}
        />
      </MemoryRouter>,
    );

    const triggerButton = screen.getByRole('button', { name: /switch active project/i });
    fireEvent.pointerDown(triggerButton, { button: 0 });
    fireEvent.keyDown(triggerButton, { key: 'ArrowDown' });

    const betaItem = screen.getByText('Beta Platform');
    fireEvent.click(betaItem);

    expect(mockNavigate).toHaveBeenCalledWith('/projects/BETA/board');
    expect(onNavigateMock).toHaveBeenCalled();
    expect(useActiveProjectStore.getState().activeProjectId).toBe(2);
    expect(useActiveProjectStore.getState().activeProjectKey).toBe('BETA');
  });

  it('filters project list by search term', () => {
    render(
      <MemoryRouter>
        <SidebarProjectSwitcher
          projects={mockProjects}
          activeProject={mockProjects[0]}
        />
      </MemoryRouter>,
    );

    const triggerButton = screen.getByRole('button', { name: /switch active project/i });
    fireEvent.pointerDown(triggerButton, { button: 0 });
    fireEvent.keyDown(triggerButton, { key: 'ArrowDown' });

    const searchInput = screen.getByPlaceholderText('Find project...');
    fireEvent.change(searchInput, { target: { value: 'Beta' } });

    expect(screen.getByRole('menuitem', { name: /beta platform/i })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /alpha project/i })).not.toBeInTheDocument();
  });
});
