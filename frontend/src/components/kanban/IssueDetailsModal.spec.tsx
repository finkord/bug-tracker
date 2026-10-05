import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { IssueDetailsModal } from './IssueDetailsModal';

const mockIssue = {
  id: 101,
  key: 'PHX-101',
  title: 'Optimize shader compiler cache',
  description: 'Current cache misses cause pipeline stalls.',
  issueType: 'BUG',
  priority: 'HIGH',
  status: 'IN_PROGRESS',
  estimatedHours: 8,
  loggedHours: 4,
  projectId: 42,
  assignee: {
    id: 2,
    fullName: 'Bob Coder',
    avatarUrl: null,
    systemRole: 'DEVELOPER',
  },
  reporter: {
    id: 1,
    fullName: 'Jane Lead',
    avatarUrl: null,
    systemRole: 'TECH_LEAD',
  },
  sprint: {
    id: 5,
    name: 'Sprint 1',
  },
  createdAt: '2026-01-01',
  updatedAt: '2026-01-02',
};

const mockUpdateIssueMutation = {
  mutateAsync: vi.fn(),
  isPending: false,
};

const mockUpdateStatusMutation = {
  mutateAsync: vi.fn(),
  isPending: false,
};

vi.mock('../../api/modules/issues.api', () => ({
  issuesApi: {
    getPullRequests: vi.fn().mockResolvedValue([]),
    createPullRequest: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../../api/queries', () => ({
  useIssueDetailQuery: () => ({
    data: mockIssue,
    isLoading: false,
    refetch: vi.fn(),
  }),
  useUpdateIssueMutation: () => mockUpdateIssueMutation,
  useUpdateIssueStatusMutation: () => mockUpdateStatusMutation,
  useUpdateIssueSprintMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAssignIssueToMeMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteAttachmentMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCreateIssueMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAddIssueCommentMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteIssueMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAssigneesQuery: () => ({
    data: {
      items: [
        { id: 1, fullName: 'Jane Lead', email: 'jane@example.com' },
        { id: 2, fullName: 'Bob Coder', email: 'bob@example.com' },
      ],
    },
  }),
  useProjectSprintsQuery: () => ({ data: [] }),
  useProjectComponentsQuery: () => ({ data: [], isLoading: false }),
  useProjectVersionsQuery: () => ({ data: [], isLoading: false }),
  useIssueHistoryQuery: () => ({ data: [], isLoading: false }),
  useUserDetailQuery: () => ({ data: null, isLoading: false }),
  useUpdateIssueCommentMutation: () => ({ mutateAsync: vi.fn() }),
  useDeleteIssueCommentMutation: () => ({ mutateAsync: vi.fn() }),
  useDeleteWorklogMutation: () => ({ mutateAsync: vi.fn() }),
  issueKeys: {
    lists: () => ['issues', 'list'],
    details: () => ['issues', 'detail'],
    detail: (id: any) => ['issues', 'detail', id],
  },
}));

vi.mock('../../store', () => ({
  useAuth: () => ({
    user: { id: 1, fullName: 'Jane Lead', email: 'jane@example.com' },
  }),
  useRecentIssuesStore: {
    getState: () => ({
      addRecentIssue: vi.fn(),
      recentIssues: [],
    }),
  },
}));

describe('IssueDetailsModal Inline Editing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateIssueMutation.mutateAsync.mockResolvedValue({
      ...mockIssue,
      title: 'Updated Title',
    });
  });

  it('renders issue details correctly', () => {
    render(
      <MemoryRouter>
        <IssueDetailsModal isOpen={true} issueId={101} onClose={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText('PHX-101')).toBeInTheDocument();
    expect(screen.getByText('Optimize shader compiler cache')).toBeInTheDocument();
    expect(screen.getByText('Current cache misses cause pipeline stalls.')).toBeInTheDocument();
  });

  it('allows editing title inline and saving on Enter', async () => {
    render(
      <MemoryRouter>
        <IssueDetailsModal isOpen={true} issueId={101} onClose={vi.fn()} />
      </MemoryRouter>,
    );

    const titleElement = screen.getByTitle('Click to edit title');
    fireEvent.click(titleElement);

    const input = screen.getByDisplayValue('Optimize shader compiler cache');
    fireEvent.change(input, { target: { value: 'New Shader Optimization Title' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(mockUpdateIssueMutation.mutateAsync).toHaveBeenCalledWith({
        id: 101,
        data: { title: 'New Shader Optimization Title' },
      });
    });
  });

  it('allows editing description inline and saving with Cmd+Enter', async () => {
    render(
      <MemoryRouter>
        <IssueDetailsModal isOpen={true} issueId={101} onClose={vi.fn()} />
      </MemoryRouter>,
    );

    const descElement = screen.getByTitle('Click to edit description');
    fireEvent.click(descElement);

    const textarea = screen.getByPlaceholderText(/Describe the defect/);
    fireEvent.change(textarea, { target: { value: 'Updated detailed description for caching' } });

    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', metaKey: true });

    await waitFor(() => {
      expect(mockUpdateIssueMutation.mutateAsync).toHaveBeenCalledWith({
        id: 101,
        data: { description: 'Updated detailed description for caching' },
      });
    });
  });
});
