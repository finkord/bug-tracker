import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KanbanToolbar } from './KanbanToolbar';
import { DEFAULT_KANBAN_SETTINGS } from '../../types/kanban';

describe('KanbanToolbar Component', () => {
  const defaultProps = {
    activeProject: { id: 1, key: 'PROJ', name: 'Project One' } as any,
    boardMode: 'kanban' as const,
    onBoardModeChange: vi.fn(),
    searchTerm: '',
    onSearchChange: vi.fn(),
    filterType: 'ALL',
    onFilterTypeChange: vi.fn(),
    filterPriority: 'ALL',
    onFilterPriorityChange: vi.fn(),
    projectComponents: [
      { id: 10, name: 'Frontend', projectId: 1, leadId: null, createdAt: '', updatedAt: '' },
    ],
    selectedComponentId: null,
    onSelectComponent: vi.fn(),
    projectVersions: [
      { id: 20, name: 'Release 1.0', projectId: 1, status: 'UNRELEASED', createdAt: '', updatedAt: '' },
    ],
    selectedVersionId: null,
    onSelectVersion: vi.fn(),
    teams: [
      { id: 30, name: 'Alpha Squad', projectId: 1, leadId: null, sprintCapacityHours: 80, members: [], createdAt: '', updatedAt: '' },
    ],
    selectedTeamId: null,
    onSelectTeam: vi.fn(),
    projectQuickFilters: [],
    activeQuickFilterIds: [],
    onToggleQuickFilter: vi.fn(),
    settings: DEFAULT_KANBAN_SETTINGS,
    onUpdateSettings: vi.fn(),
    onOpenSettingsModal: vi.fn(),
    onRefresh: vi.fn(),
    onSaveCurrentFilter: vi.fn(),
    loading: false,
    totalFilteredCount: 12,
  };

  it('renders ticket count badge and search bar', () => {
    render(<KanbanToolbar {...defaultProps} />);
    expect(screen.getByText('12 tickets')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search by title, key, desc/i)).toBeInTheDocument();
  });

  it('toggles board mode between kanban and scrum sprint', () => {
    const onBoardModeChange = vi.fn();
    render(<KanbanToolbar {...defaultProps} onBoardModeChange={onBoardModeChange} />);

    const scrumBtn = screen.getByText('Scrum Sprint').closest('button');
    expect(scrumBtn).toBeInTheDocument();
    fireEvent.click(scrumBtn!);

    expect(onBoardModeChange).toHaveBeenCalledWith('scrum');
  });

  it('allows searching tickets', () => {
    const onSearchChange = vi.fn();
    render(<KanbanToolbar {...defaultProps} onSearchChange={onSearchChange} />);

    const searchInput = screen.getByPlaceholderText(/search by title, key, desc/i);
    fireEvent.change(searchInput, { target: { value: 'compiler' } });

    expect(onSearchChange).toHaveBeenCalledWith('compiler');
  });

  it('shows reset filters button when filter is active and handles reset', () => {
    const onSearchChange = vi.fn();
    const onFilterTypeChange = vi.fn();
    const onFilterPriorityChange = vi.fn();
    const onSelectComponent = vi.fn();
    const onSelectTeam = vi.fn();
    const onSelectVersion = vi.fn();

    render(
      <KanbanToolbar
        {...defaultProps}
        searchTerm="urgent bug"
        onSearchChange={onSearchChange}
        onFilterTypeChange={onFilterTypeChange}
        onFilterPriorityChange={onFilterPriorityChange}
        onSelectComponent={onSelectComponent}
        onSelectTeam={onSelectTeam}
        onSelectVersion={onSelectVersion}
      />,
    );

    const resetBtn = screen.getByText(/reset filters/i);
    expect(resetBtn).toBeInTheDocument();
    fireEvent.click(resetBtn);

    expect(onSearchChange).toHaveBeenCalledWith('');
    expect(onFilterTypeChange).toHaveBeenCalledWith('ALL');
    expect(onFilterPriorityChange).toHaveBeenCalledWith('ALL');
    expect(onSelectComponent).toHaveBeenCalledWith(null);
    expect(onSelectTeam).toHaveBeenCalledWith(null);
    expect(onSelectVersion).toHaveBeenCalledWith(null);
  });
});
