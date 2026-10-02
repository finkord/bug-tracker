import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdvancedSearchPage } from './AdvancedSearchPage';

const mockUseIssuesQuery = vi.fn();
const mockUseProjectsQuery = vi.fn();
const mockUseUsersQuery = vi.fn();
const mockUseSavedFiltersQuery = vi.fn();
const mockCreateFilterMutation = vi.fn();
const mockUpdateFilterMutation = vi.fn();
const mockDeleteFilterMutation = vi.fn();
const mockUpdateIssueStatusMutation = vi.fn();

vi.mock('../api/queries', () => ({
  useIssuesQuery: (params: any) => mockUseIssuesQuery(params),
  useProjectsQuery: () => mockUseProjectsQuery(),
  useUsersQuery: (params: any) => mockUseUsersQuery(params),
  useSavedFiltersQuery: () => mockUseSavedFiltersQuery(),
  useIssueDetailQuery: () => ({ data: null, isLoading: false }),
  useCreateSavedFilterMutation: () => ({ mutateAsync: mockCreateFilterMutation }),
  useUpdateSavedFilterMutation: () => ({ mutateAsync: mockUpdateFilterMutation }),
  useDeleteSavedFilterMutation: () => ({ mutateAsync: mockDeleteFilterMutation }),
  useUpdateIssueStatusMutation: () => ({ mutateAsync: mockUpdateIssueStatusMutation }),
  useAssignIssueToMeMutation: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('../components/kanban/IssueDetailsModal', () => ({
  IssueDetailsModal: () => null,
}));

vi.mock('../store', () => ({
  useAuth: () => ({
    user: { id: 1, fullName: 'Test Architect', email: 'architect@bugtracker.local' },
  }),
}));

describe('AdvancedSearchPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseIssuesQuery.mockReturnValue({
      data: {
        items: [
          {
            id: 101,
            key: 'PROJ-1',
            projectId: 1,
            projectKey: 'PROJ',
            projectName: 'Platform',
            issueNum: 1,
            title: 'GIN text index testing issue',
            issueType: 'BUG',
            status: 'OPEN',
            priority: 'HIGH',
            estimatedHours: 4,
            loggedHours: 0,
            sprintId: null,
            reporter: { id: 1, fullName: 'Reporter User', email: 'rep@test.com' },
            assignee: { id: 2, fullName: 'Developer User', email: 'dev@test.com' },
            createdAt: '2026-09-30T12:00:00Z',
            updatedAt: '2026-09-30T12:00:00Z',
          },
        ],
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
      },
      isLoading: false,
      refetch: vi.fn(),
    });

    mockUseProjectsQuery.mockReturnValue({
      data: [{ id: 1, key: 'PROJ', name: 'Platform' }],
      isLoading: false,
      refetch: vi.fn(),
    });

    mockUseUsersQuery.mockReturnValue({
      data: { items: [{ id: 1, fullName: 'Reporter User' }] },
      isLoading: false,
      refetch: vi.fn(),
    });

    mockUseSavedFiltersQuery.mockReturnValue({
      data: [
        {
          id: 5,
          userId: 1,
          name: 'Critical Bugs Queue',
          criteria: 'priority = "CRITICAL" AND status = "OPEN"',
          description: 'Top priority tickets',
          isFavorite: true,
          createdAt: '2026-09-30T10:00:00Z',
        },
      ],
      isLoading: false,
      refetch: vi.fn(),
    });
  });

  it('renders search page with server-side paginated issues', () => {
    render(
      <MemoryRouter>
        <AdvancedSearchPage />
      </MemoryRouter>,
    );

    // Verify issue row rendered
    expect(screen.getByText('GIN text index testing issue')).toBeInTheDocument();
    expect(screen.getByText('PROJ-1')).toBeInTheDocument();

    // Verify useIssuesQuery was invoked with server-side pagination parameters
    expect(mockUseIssuesQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        limit: 50,
      }),
    );
  });

  it('does not touch localStorage for saved filter persistence', () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    render(
      <MemoryRouter>
        <AdvancedSearchPage />
      </MemoryRouter>,
    );

    // Verify localStorage key is not accessed
    expect(getItemSpy).not.toHaveBeenCalledWith('bugtracker_saved_filters');
    expect(setItemSpy).not.toHaveBeenCalledWith('bugtracker_saved_filters', expect.anything());

    // Verify backend saved filters query was used instead
    expect(mockUseSavedFiltersQuery).toHaveBeenCalled();
  });

  it('renders Linear-style quick-access pills for favorite saved filters', () => {
    render(
      <MemoryRouter>
        <AdvancedSearchPage />
      </MemoryRouter>,
    );

    // Verify 'All Issues' default pill is present
    expect(screen.getByText('All Issues')).toBeInTheDocument();

    // Verify favorite saved filter 'Critical Bugs Queue' is rendered directly as a quick-access pill
    expect(screen.getByText('Critical Bugs Queue')).toBeInTheDocument();

    // Verify 'More' dropdown trigger is present
    expect(screen.getByText('More')).toBeInTheDocument();
  });
});
