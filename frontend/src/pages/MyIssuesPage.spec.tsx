import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MyIssuesPage } from './MyIssuesPage';

const mockUseIssuesQuery = vi.fn();
const mockUpdateStatusMutation = vi.fn();
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../store', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'john@example.com', fullName: 'John Doe' },
  }),
}));

vi.mock('../api/queries', () => ({
  useIssuesQuery: (params?: any) => mockUseIssuesQuery(params),
  useUpdateIssueStatusMutation: () => ({
    mutateAsync: mockUpdateStatusMutation,
  }),
  useAssignIssueToMeMutation: () => ({
    mutateAsync: vi.fn(),
  }),
}));

describe('MyIssuesPage Component', () => {
  const sampleIssues = [
    {
      id: 101,
      key: 'HPSD-101',
      title: 'Fix authentication cookie issue',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      estimatedHours: 4,
      loggedHours: 2,
    },
    {
      id: 102,
      key: 'MONOPS-42',
      title: 'Alert on memory usage threshold',
      status: 'OPEN',
      priority: 'CRITICAL',
      estimatedHours: 2,
      loggedHours: 0,
    },
    {
      id: 103,
      key: 'OPSINF-12',
      title: 'Setup LDAP group permissions',
      status: 'CLOSED',
      priority: 'LOW',
      estimatedHours: 1,
      loggedHours: 1,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseIssuesQuery.mockReturnValue({
      data: { items: sampleIssues },
      isLoading: false,
    });
  });

  it('renders My Issues header and tab navigation', () => {
    render(
      <MemoryRouter>
        <MyIssuesPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1, name: /my issues/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /assigned to me/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reported by me/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /done \/ closed/i })).toBeInTheDocument();
  });

  it('displays active assigned issues by default', () => {
    render(
      <MemoryRouter>
        <MyIssuesPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('HPSD-101')).toBeInTheDocument();
    expect(screen.getByText('Fix authentication cookie issue')).toBeInTheDocument();
    expect(screen.getByText('MONOPS-42')).toBeInTheDocument();
    // CLOSED issue is excluded from active assigned
    expect(screen.queryByText('OPSINF-12')).not.toBeInTheDocument();
  });

  it('switches to Done tab and displays completed issues', () => {
    render(
      <MemoryRouter>
        <MyIssuesPage />
      </MemoryRouter>,
    );

    const doneTab = screen.getByRole('button', { name: /done \/ closed/i });
    fireEvent.click(doneTab);

    expect(screen.getByText('OPSINF-12')).toBeInTheDocument();
    expect(screen.getByText('Setup LDAP group permissions')).toBeInTheDocument();
    expect(screen.queryByText('HPSD-101')).not.toBeInTheDocument();
  });

  it('navigates to issue detail page with return state when an issue row is clicked', () => {
    render(
      <MemoryRouter>
        <MyIssuesPage />
      </MemoryRouter>,
    );

    const issueRow = screen.getByText('Fix authentication cookie issue');
    fireEvent.click(issueRow);

    expect(mockNavigate).toHaveBeenCalledWith('/issues/HPSD-101', {
      state: { from: '/my-issues', label: 'Back to My Issues' },
    });
  });
});
