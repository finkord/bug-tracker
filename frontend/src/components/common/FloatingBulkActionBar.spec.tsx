import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FloatingBulkActionBar } from './FloatingBulkActionBar';
import { useIssueSelectionStore } from '../../store/useIssueSelectionStore';

// Mock TanStack query hooks
const mockBulkUpdateMutate = vi.fn();
const mockBulkDeleteMutate = vi.fn();

vi.mock('../../api/queries/useIssuesQuery', () => ({
  useBulkUpdateIssuesMutation: () => ({
    mutate: mockBulkUpdateMutate,
    isPending: false,
  }),
  useBulkDeleteIssuesMutation: () => ({
    mutate: mockBulkDeleteMutate,
    isPending: false,
  }),
}));

vi.mock('../../api/queries/useProjectsQuery', () => ({
  useProjectPeopleQuery: () => ({
    data: [{ id: 1, fullName: 'Alice Dev', email: 'alice@test.com' }],
  }),
}));

vi.mock('../../api/queries/useSprintsQuery', () => ({
  useProjectSprintsQuery: () => ({
    data: [{ id: 10, name: 'Sprint 1', status: 'ACTIVE' }],
  }),
}));

vi.mock('../../api/queries/useUsersQuery', () => ({
  useAssigneesQuery: () => ({
    data: { items: [{ id: 1, fullName: 'Alice Dev', email: 'alice@test.com' }] },
  }),
}));

describe('FloatingBulkActionBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useIssueSelectionStore.getState().clearSelection();
  });

  it('renders nothing when no issues are selected', () => {
    render(<FloatingBulkActionBar projectId={1} />);
    expect(screen.queryByRole('region', { name: /bulk actions toolbar/i })).not.toBeInTheDocument();
  });

  it('renders counter and action buttons when issues are selected', () => {
    useIssueSelectionStore.getState().selectAll([101, 102, 103]);
    render(<FloatingBulkActionBar projectId={1} />);

    expect(screen.getByRole('region', { name: /bulk actions toolbar/i })).toBeInTheDocument();
    expect(screen.getByText('3 selected')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Priority')).toBeInTheDocument();
    expect(screen.getByText('Assignee')).toBeInTheDocument();
    expect(screen.getByText('Sprint')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('clears selection when close button is clicked', () => {
    useIssueSelectionStore.getState().selectAll([101, 102]);
    render(<FloatingBulkActionBar projectId={1} />);

    const clearButton = screen.getByRole('button', { name: /deselect all/i });
    fireEvent.click(clearButton);

    expect(useIssueSelectionStore.getState().selectedIds.size).toBe(0);
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('prompts confirmation when Delete button is clicked', () => {
    useIssueSelectionStore.getState().selectAll([101, 102]);
    render(<FloatingBulkActionBar projectId={1} />);

    const deleteButton = screen.getByRole('button', { name: /^delete$/i });
    fireEvent.click(deleteButton);

    expect(screen.getByText('Confirm Delete (2)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();

    // Clicking confirm triggers delete mutation
    fireEvent.click(screen.getByText('Confirm Delete (2)'));
    expect(mockBulkDeleteMutate).toHaveBeenCalledWith(
      { issueIds: [101, 102] },
      expect.any(Object),
    );
  });

  it('clears selection on Escape key', () => {
    useIssueSelectionStore.getState().selectAll([101]);
    render(<FloatingBulkActionBar projectId={1} />);

    expect(screen.getByText('1 selected')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(useIssueSelectionStore.getState().selectedIds.size).toBe(0);
  });
});
