import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IssueDetailPage } from './IssueDetailPage';

const mockIssue = {
  id: 101,
  key: 'BUGT-101',
  issueNum: 101,
  title: 'Critical Login Bug',
  description: 'Cannot login with OAuth credentials',
  status: 'OPEN',
  priority: 'HIGH',
  issueType: 'BUG',
  projectId: 1,
  projectKey: 'BUGT',
  reporterId: 1,
  reporter: { id: 1, fullName: 'Admin User', email: 'admin@example.com' },
  assigneeId: null,
  assignee: null,
  subtasks: [],
  links: [],
  attachments: [],
  comments: [],
  worklogs: [],
  createdAt: '2026-10-01T10:00:00Z',
  updatedAt: '2026-10-01T10:00:00Z',
};

const mockUseIssueDetailQuery = vi.fn();

vi.mock('../store', () => ({
  useAuth: () => ({
    user: { id: 2, fullName: 'Test Developer', email: 'dev@example.com' },
  }),
}));

vi.mock('../api/queries', () => ({
  useIssueDetailQuery: () => mockUseIssueDetailQuery(),
  useCreateIssueMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateIssueStatusMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateIssueSprintMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAssignIssueToMeMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateIssueMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAddIssueCommentMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteAttachmentMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteIssueMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAssigneesQuery: () => ({
    data: { items: [{ id: 2, fullName: 'Test Developer', email: 'dev@example.com' }] },
  }),
  useProjectSprintsQuery: () => ({ data: [] }),
  useProjectComponentsQuery: () => ({ data: [] }),
  useProjectVersionsQuery: () => ({ data: [] }),
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

vi.mock('../api/client', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    api: {
      ...actual.api,
      getIssuePullRequests: vi.fn().mockResolvedValue([]),
    },
  };
});

vi.mock('../api/socket', () => ({
  realtimeSocket: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    joinIssue: vi.fn(),
    leaveIssue: vi.fn(),
    onIssueUpdated: vi.fn().mockReturnValue(vi.fn()),
    onCommentCreated: vi.fn().mockReturnValue(vi.fn()),
    onAttachmentUploaded: vi.fn().mockReturnValue(vi.fn()),
    onPresenceViewing: vi.fn().mockReturnValue(vi.fn()),
  },
}));

describe('IssueDetailPage Linear/Jira Layout', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it('renders clean layout with quick action buttons and directly visible activity tabs when empty', () => {
    mockUseIssueDetailQuery.mockReturnValue({
      data: mockIssue,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/issues/BUGT-101']}>
          <Routes>
            <Route path="/issues/:key" element={<IssueDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    // Assert description is rendered
    expect(screen.getByText('Critical Login Bug')).toBeInTheDocument();
    expect(screen.getByText('Cannot login with OAuth credentials')).toBeInTheDocument();

    // Assert lazy anchor bar is NOT rendered
    expect(screen.queryByText('Instant Access to Description and Comments')).not.toBeInTheDocument();

    // Assert sleek Linear-style inline quick-add toolbar is rendered
    expect(screen.getByRole('button', { name: /Add subtask/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Link issue/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Attach files/i })).toBeInTheDocument();

    // Assert Subtasks, Links, Attachments sections are hidden when empty
    expect(screen.queryByText(/No subtasks yet/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/No links attached/i)).not.toBeInTheDocument();

    // Assert Comments tab is immediately present
    expect(screen.getByRole('tab', { name: /Comments/i })).toBeInTheDocument();
  });

  it('expands Subtasks section when user clicks Add subtask button', () => {
    mockUseIssueDetailQuery.mockReturnValue({
      data: mockIssue,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/issues/BUGT-101']}>
          <Routes>
            <Route path="/issues/:key" element={<IssueDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const addSubtaskBtn = screen.getByRole('button', { name: /Add subtask/i });
    fireEvent.click(addSubtaskBtn);

    // Subtasks section now expands
    expect(screen.getByText(/No subtasks yet/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Add a subtask/i)).toBeInTheDocument();
  });
});
