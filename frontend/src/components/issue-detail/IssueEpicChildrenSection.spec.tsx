import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IssueEpicChildrenSection } from './IssueEpicChildrenSection';
import type { IssueItem } from '../../api/types/index';

const mockMutateStatus = vi.fn();
const mockMutateCreate = vi.fn();

vi.mock('../../api/queries/index.js', () => ({
  useUpdateIssueStatusMutation: () => ({
    mutateAsync: mockMutateStatus,
    isPending: false,
  }),
  useCreateIssueMutation: () => ({
    mutateAsync: mockMutateCreate,
    isPending: false,
  }),
  useIssuesQuery: vi.fn(() => ({
    data: {
      items: [
        {
          id: 101,
          key: 'CORE-2',
          title: 'Implement database migrations',
          issueType: 'STORY',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          assignee: { id: 1, fullName: 'Alice Developer', avatarUrl: null },
        },
        {
          id: 102,
          key: 'CORE-3',
          title: 'Setup Redis cluster client',
          issueType: 'TASK',
          status: 'RESOLVED',
          priority: 'MEDIUM',
          assignee: null,
        },
      ],
    },
    isLoading: false,
  })),
  useUserDetailQuery: () => ({ data: null, isLoading: false }),
}));

const sampleEpic: IssueItem = {
  id: 1,
  key: 'CORE-1',
  projectId: 5,
  projectKey: 'CORE',
  projectName: 'Core Platform',
  issueNum: 1,
  title: 'Database Architecture Redesign',
  description: 'Core epic for DB upgrades',
  issueType: 'EPIC',
  status: 'IN_PROGRESS',
  priority: 'CRITICAL',
  estimatedHours: 40,
  loggedHours: 12,
  sprintId: 10,
  reporter: { id: 1, fullName: 'Admin', email: 'admin@test.com' },
  assignee: null,
  epicColor: '#6554C0',
  createdAt: '2026-10-10T00:00:00Z',
  updatedAt: '2026-10-12T00:00:00Z',
};

describe('IssueEpicChildrenSection Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  const renderComponent = (props: Partial<React.ComponentProps<typeof IssueEpicChildrenSection>> = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <IssueEpicChildrenSection
            issue={sampleEpic}
            onIssuesChanged={vi.fn()}
            {...props}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  it('renders "Issues in this Epic" header and completion metrics', () => {
    renderComponent();

    expect(screen.getByText('Issues in this Epic')).toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    expect(screen.getByText('50% completed')).toBeInTheDocument();
  });

  it('renders child issues list with keys, titles and status badges', () => {
    renderComponent();

    expect(screen.getByText('CORE-2')).toBeInTheDocument();
    expect(screen.getByText('Implement database migrations')).toBeInTheDocument();
    expect(screen.getByText('CORE-3')).toBeInTheDocument();
    expect(screen.getByText('Setup Redis cluster client')).toBeInTheDocument();
  });

  it('allows toggling child issue status between open and done', async () => {
    mockMutateStatus.mockResolvedValue({});
    const onIssuesChanged = vi.fn();
    renderComponent({ onIssuesChanged });

    const checkButtons = screen.getAllByRole('button').filter(
      (btn) => btn.getAttribute('title') === 'Mark as Done' || btn.getAttribute('title') === 'Mark as Open',
    );
    expect(checkButtons.length).toBe(2);

    fireEvent.click(checkButtons[0]);

    await waitFor(() => {
      expect(mockMutateStatus).toHaveBeenCalledWith({
        issueId: 101,
        status: 'RESOLVED',
      });
      expect(onIssuesChanged).toHaveBeenCalled();
    });
  });

  it('allows adding a new child issue under the epic', async () => {
    mockMutateCreate.mockResolvedValue({});
    const onIssuesChanged = vi.fn();
    renderComponent({ onIssuesChanged });

    const input = screen.getByPlaceholderText('What needs to be done in this epic?');
    fireEvent.change(input, { target: { value: 'Write integration test suite' } });

    const addButton = screen.getByRole('button', { name: /Add/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(mockMutateCreate).toHaveBeenCalledWith({
        projectId: 5,
        epicId: 1,
        title: 'Write integration test suite',
        issueType: 'STORY',
        priority: 'MEDIUM',
        sprintId: 10,
      });
      expect(onIssuesChanged).toHaveBeenCalled();
    });
  });
});
