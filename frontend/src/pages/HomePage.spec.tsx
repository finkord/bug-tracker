import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from './HomePage';

const mockUser = {
  id: 1,
  fullName: 'Alex Engineer',
  email: 'alex@example.com',
  systemRole: 'ADMIN',
  avatarUrl: null,
};

const mockAssignedIssues = [
  {
    id: 101,
    key: 'BT-101',
    title: 'Implement database connection pooler',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    projectKey: 'BT',
    projectId: 1,
    estimatedHours: 8,
    loggedHours: 4,
  },
  {
    id: 102,
    key: 'BT-102',
    title: 'Draft architecture RFC for search',
    priority: 'CRITICAL',
    status: 'OPEN',
    projectKey: 'BT',
    projectId: 1,
    estimatedHours: 6,
    loggedHours: 0,
  },
  {
    id: 103,
    key: 'BT-103',
    title: 'Migrate to NestJS 12',
    priority: 'MEDIUM',
    status: 'RESOLVED',
    projectKey: 'BT',
    projectId: 1,
    estimatedHours: 12,
    loggedHours: 12,
  },
];

const mockProjects = [
  {
    id: 1,
    name: 'BugTracker Core',
    key: 'BT',
    openIssues: 5,
    avatarUrl: null,
  },
];

const mockSprints = [
  {
    id: 201,
    name: 'Sprint 14 - Platform Hardening',
    status: 'ACTIVE',
    goal: 'Zero P0 regressions',
    endDate: '2026-10-15',
    projectId: 1,
  },
];

const mockWorklogs = {
  items: [
    {
      id: 1,
      timeSpentHours: 4,
      dateLogged: new Date().toISOString(),
      issue: {
        id: 104,
        key: 'BT-104',
        title: 'Refactor Redis session storage',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        projectName: 'BugTracker Core',
      },
    },
  ],
  total: 1,
};

const mockOpenCreateIssue = vi.fn();

vi.mock('../store', () => ({
  useAuth: vi.fn(),
  useModalStore: () => ({
    openCreateIssue: mockOpenCreateIssue,
  }),
  useRecentIssuesStore: () => ({
    recentIssues: [
      {
        id: 999,
        key: 'BT-999',
        title: 'Review production audit logs',
        priority: 'LOW',
        status: 'IN_PROGRESS',
        visitedAt: Date.now(),
      },
    ],
  }),
}));

vi.mock('../api/queries', () => ({
  useIssuesQuery: vi.fn(),
  useProjectsQuery: vi.fn(),
  useProjectSprintsQuery: vi.fn(),
  useMyWorklogsQuery: vi.fn(),
  useUpdateIssueStatusMutation: () => ({ mutateAsync: vi.fn() }),
  useIssueDetailQuery: () => ({ data: mockAssignedIssues[0], isLoading: false }),
  useUserDetailQuery: () => ({ data: null, isLoading: false }),
  useAssigneesQuery: () => ({ data: { items: [] }, isLoading: false }),
  useProjectComponentsQuery: () => ({ data: [], isLoading: false }),
  useProjectVersionsQuery: () => ({ data: [], isLoading: false }),
  useIssueHistoryQuery: () => ({ data: [], isLoading: false }),
  useUpdateIssueMutation: () => ({ mutateAsync: vi.fn() }),
  useAddIssueCommentMutation: () => ({ mutateAsync: vi.fn() }),
  useDeleteIssueMutation: () => ({ mutateAsync: vi.fn() }),
  useAssignIssueToMeMutation: () => ({ mutateAsync: vi.fn() }),
  useUpdateIssueSprintMutation: () => ({ mutateAsync: vi.fn() }),
  useDeleteAttachmentMutation: () => ({ mutateAsync: vi.fn() }),
  useUpdateIssueCommentMutation: () => ({ mutateAsync: vi.fn() }),
  useDeleteIssueCommentMutation: () => ({ mutateAsync: vi.fn() }),
  useDeleteWorklogMutation: () => ({ mutateAsync: vi.fn() }),
  issueKeys: {
    lists: () => ['issues', 'list'],
    details: () => ['issues', 'detail'],
    detail: (id: any) => ['issues', 'detail', id],
  },
}));

import { useAuth } from '../store';
import * as queries from '../api/queries';

describe('HomePage (Personal Dashboard)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useAuth).mockReturnValue({
      user: mockUser as any,
    } as any);

    vi.mocked(queries.useIssuesQuery).mockReturnValue({
      data: { items: mockAssignedIssues, total: 3 },
      isLoading: false,
    } as any);

    vi.mocked(queries.useProjectsQuery).mockReturnValue({
      data: mockProjects,
      isLoading: false,
    } as any);

    vi.mocked(queries.useProjectSprintsQuery).mockReturnValue({
      data: mockSprints,
      isLoading: false,
    } as any);

    vi.mocked(queries.useMyWorklogsQuery).mockReturnValue({
      data: mockWorklogs,
      isLoading: false,
    } as any);
  });

  it('renders guest hero view when no user is logged in', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null } as any);

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Developer Issues with/i)).toBeInTheDocument();
    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('renders authenticated dashboard with personal greeting and briefing metrics', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Alex Engineer/i)).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
    expect(screen.getByText('Create Issue')).toBeInTheDocument();
    expect(screen.getByText('Time Logs')).toBeInTheDocument();
    expect(screen.getByText('My Issues')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
  });

  it('renders workflow queue tabs and filters tasks by active tab', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    // Initial tab: In Progress
    expect(screen.getByText('Implement database connection pooler')).toBeInTheDocument();
    expect(screen.queryByText('Draft architecture RFC for search')).not.toBeInTheDocument();

    // Switch to To Do tab
    const todoTab = screen.getByRole('button', { name: /To Do \(1\)/i });
    fireEvent.click(todoTab);

    expect(screen.getByText('Draft architecture RFC for search')).toBeInTheDocument();
    expect(screen.queryByText('Implement database connection pooler')).not.toBeInTheDocument();

    // Switch to Done tab
    const doneTab = screen.getByRole('button', { name: /Done \(1\)/i });
    fireEvent.click(doneTab);

    expect(screen.getByText('Migrate to NestJS 12')).toBeInTheDocument();
  });

  it('renders active sprint context widget and recent projects shortcuts', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Active Sprint Context')).toBeInTheDocument();
    expect(screen.getByText('Sprint 14 - Platform Hardening')).toBeInTheDocument();
    expect(screen.getByText('Goal: Zero P0 regressions')).toBeInTheDocument();

    expect(screen.getByText('Active Projects')).toBeInTheDocument();
    expect(screen.getByText('BugTracker Core')).toBeInTheDocument();

    expect(screen.getByText('Recently Worked On')).toBeInTheDocument();
    expect(screen.getByText('Refactor Redis session storage')).toBeInTheDocument();
  });

  it('triggers create issue action when clicking Create Issue button', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    const createBtn = screen.getByRole('button', { name: /create issue/i });
    fireEvent.click(createBtn);

    expect(mockOpenCreateIssue).toHaveBeenCalledWith({ assigneeId: 1 });
  });

  it('opens issue details modal when clicking on an issue row', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    const issueRow = screen.getByText('Implement database connection pooler');
    fireEvent.click(issueRow);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
