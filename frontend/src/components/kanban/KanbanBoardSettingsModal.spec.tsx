import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { KanbanBoardSettingsModal } from './KanbanBoardSettingsModal';
import { DEFAULT_KANBAN_SETTINGS } from '../../types/kanban';

const mockCreateQuickFilterMutation = {
  mutateAsync: vi.fn(),
  isPending: false,
};

const mockDeleteQuickFilterMutation = {
  mutateAsync: vi.fn(),
  isPending: false,
};

const mockUpdateProjectMutation = {
  mutateAsync: vi.fn().mockResolvedValue({}),
  isPending: false,
};

vi.mock('../../api/queries', () => ({
  useProjectQuickFiltersQuery: () => ({
    data: [],
    isLoading: false,
  }),
  useCreateQuickFilterMutation: () => mockCreateQuickFilterMutation,
  useDeleteQuickFilterMutation: () => mockDeleteQuickFilterMutation,
  useUpdateProjectMutation: () => mockUpdateProjectMutation,
}));

describe('KanbanBoardSettingsModal', () => {
  const onUpdateSettings = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders settings modal with closed column visibility toggle and controls', () => {
    render(
      <KanbanBoardSettingsModal
        isOpen={true}
        onClose={onClose}
        settings={DEFAULT_KANBAN_SETTINGS}
        onUpdateSettings={onUpdateSettings}
        projectId={1}
      />,
    );

    expect(screen.getByText('Kanban Board Settings')).toBeInTheDocument();
    expect(screen.getByText('Closed Column Visibility')).toBeInTheDocument();
    expect(screen.getByText('Show or hide the Closed column on the board')).toBeInTheDocument();
    expect(screen.getByText('Column WIP Limits')).toBeInTheDocument();
  });

  it('toggles closed column visibility on switch click', () => {
    render(
      <KanbanBoardSettingsModal
        isOpen={true}
        onClose={onClose}
        settings={{ ...DEFAULT_KANBAN_SETTINGS, showClosedColumn: true }}
        onUpdateSettings={onUpdateSettings}
        projectId={1}
      />,
    );

    const switchBtn = screen.getByRole('switch');
    expect(switchBtn).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(switchBtn);

    expect(onUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        showClosedColumn: false,
      }),
    );
  });

  it('updates card density when density options are selected', () => {
    render(
      <KanbanBoardSettingsModal
        isOpen={true}
        onClose={onClose}
        settings={DEFAULT_KANBAN_SETTINGS}
        onUpdateSettings={onUpdateSettings}
        projectId={1}
      />,
    );

    const compactBtn = screen.getByText('Compact');
    fireEvent.click(compactBtn);

    expect(onUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        cardDensity: 'compact',
      }),
    );
  });

  it('updates WIP limits and triggers project mutation', async () => {
    render(
      <KanbanBoardSettingsModal
        isOpen={true}
        onClose={onClose}
        settings={DEFAULT_KANBAN_SETTINGS}
        onUpdateSettings={onUpdateSettings}
        projectId={1}
      />,
    );

    const inputs = screen.getAllByRole('spinbutton');
    const inProgressInput = inputs[0];

    fireEvent.change(inProgressInput, { target: { value: '10' } });

    expect(onUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        wipLimits: expect.objectContaining({
          IN_PROGRESS: 10,
        }),
      }),
    );

    await waitFor(() => {
      expect(mockUpdateProjectMutation.mutateAsync).toHaveBeenCalledWith({
        id: 1,
        data: { wipLimits: { IN_PROGRESS: 10, REVIEW: 4 } },
      });
    });
  });

  it('resets settings to defaults when Reset button is clicked', () => {
    render(
      <KanbanBoardSettingsModal
        isOpen={true}
        onClose={onClose}
        settings={{
          ...DEFAULT_KANBAN_SETTINGS,
          cardDensity: 'compact',
          showClosedColumn: false,
        }}
        onUpdateSettings={onUpdateSettings}
        projectId={1}
      />,
    );

    const resetBtn = screen.getByText('Reset Defaults');
    fireEvent.click(resetBtn);

    expect(onUpdateSettings).toHaveBeenCalledWith(DEFAULT_KANBAN_SETTINGS);
  });
});
