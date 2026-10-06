import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProjectOverviewPage } from './ProjectOverviewPage';

const mockProject = {
  id: 42,
  name: 'Phoenix Engine',
  key: 'PHX',
  description: 'Next-gen distributed graphics pipeline',
  leadId: 1,
  lead: {
    id: 1,
    fullName: 'Jane Lead',
    email: 'jane@example.com',
  },
  totalIssues: 2,
  openIssues: 1,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

const mockIssues = [
  {
    id: 101,
    key: 'PHX-101',
    title: 'Optimize shader compiler cache',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    estimatedHours: 8,
    loggedHours: 4,
  },
  {
    id: 102,
    key: 'PHX-102',
    title: 'Fix memory leak in texture upload',
    priority: 'CRITICAL',
    status: 'RESOLVED',
    estimatedHours: 4,
    loggedHours: 4,
  },
];

const mockSprints = [
  {
    id: 5,
    name: 'Sprint 1 - Core Architecture',
    status: 'ACTIVE',
    goal: 'Deliver stable compiler pipeline',
    startDate: '2026-01-01',
    endDate: '2026-01-14',
    projectId: 42,
  },
];

vi.mock('../api/queries', () => ({
  useProjectsQuery: () => ({ data: [mockProject], isLoading: false }),
  useIssuesQuery: () => ({ data: { items: mockIssues, total: 2 }, isLoading: false }),
  useProjectSprintsQuery: () => ({ data: mockSprints, isLoading: false }),
  useTeamsQuery: () => ({ data: [], isLoading: false }),
  useIssueDetailQuery: () => ({ data: mockIssues[0], isLoading: false }),
  useUpdateIssueStatusMutation: () => ({ mutateAsync: vi.fn() }),
  useUpdateIssueMutation: () => ({ mutateAsync: vi.fn() }),
  useAddIssueCommentMutation: () => ({ mutateAsync: vi.fn() }),
  useDeleteIssueMutation: () => ({ mutateAsync: vi.fn() }),
  useCreateIssueMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAssigneesQuery: () => ({ data: { items: [] }, isLoading: false }),
  useProjectComponentsQuery: () => ({ data: [], isLoading: false }),
  useProjectVersionsQuery: () => ({ data: [], isLoading: false }),
  useCreateProjectVersionMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateProjectVersionMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteProjectVersionMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useReleaseProjectVersionMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useIssueHistoryQuery: () => ({ data: [], isLoading: false }),
  useAssignIssueToMeMutation: () => ({ mutateAsync: vi.fn() }),
  useUpdateIssueSprintMutation: () => ({ mutateAsync: vi.fn() }),
  useDeleteAttachmentMutation: () => ({ mutateAsync: vi.fn() }),
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

vi.mock('../store', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'jane@example.com', fullName: 'Jane Lead' },
  }),
  useRecentIssuesStore: {
    getState: () => ({
      addRecentIssue: vi.fn(),
      recentIssues: [],
    }),
  },
}));

describe('ProjectOverviewPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (path = '/projects/PHX') => {
    return render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/projects/:projectId" element={<ProjectOverviewPage />} />
        </Routes>
      </MemoryRouter>,
    );
  };

  it('renders project hero header with name, key, lead, and description', () => {
    renderComponent();

    expect(screen.getByText('Phoenix Engine')).toBeInTheDocument();
    expect(screen.getAllByText('PHX').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Next-gen distributed graphics pipeline')).toBeInTheDocument();
    expect(screen.getAllByText('Jane Lead').length).toBeGreaterThanOrEqual(1);
  });

  it('computes completion rate, hours, and priority breakdown', () => {
    renderComponent();

    // 1 of 2 resolved = 50%
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText(/1 of 2 completed/i)).toBeInTheDocument();
    expect(screen.getByText(/8h \/ 12h/i)).toBeInTheDocument();
    expect(screen.getByText('Crit')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('renders active sprint card with goal and dates', () => {
    renderComponent();

    expect(screen.getByText('Active Sprint')).toBeInTheDocument();
    expect(screen.getByText('Sprint 1 - Core Architecture')).toBeInTheDocument();
    expect(screen.getByText(/Goal: Deliver stable compiler pipeline/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open active board/i })).toHaveAttribute('href', '/projects/PHX/board');
  });

  it('renders recent issues and opens modal on click', () => {
    renderComponent();

    expect(screen.getByText('Optimize shader compiler cache')).toBeInTheDocument();
    expect(screen.getByText('Fix memory leak in texture upload')).toBeInTheDocument();

    const row = screen.getByText('Optimize shader compiler cache');
    fireEvent.click(row);

    // IssueDetailsModal should be invoked
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders leadership and workspace directory navigation links', () => {
    renderComponent();

    expect(screen.getByText('Leadership & Directory')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /scrum teams/i })).toHaveAttribute('href', '/projects/PHX/settings/teams');
    expect(screen.getByRole('link', { name: /components/i })).toHaveAttribute('href', '/projects/PHX/settings/components');
    expect(screen.getByRole('link', { name: /releases/i })).toHaveAttribute('href', '/projects/PHX/settings/versions');
  });
});
