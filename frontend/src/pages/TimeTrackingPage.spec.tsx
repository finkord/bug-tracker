import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TimeTrackingPage } from './TimeTrackingPage';

const mockUseWorklogStatsQuery = vi.fn();
const mockUseTeamTimesheetMatrixQuery = vi.fn();
const mockUseMyWorklogsQuery = vi.fn();
const mockUseIssuesQuery = vi.fn();
const mockDeleteWorklogMutation = vi.fn();

vi.mock('../api/queries', () => ({
  useWorklogStatsQuery: () => mockUseWorklogStatsQuery(),
  useTeamTimesheetMatrixQuery: (startDate?: string, endDate?: string) =>
    mockUseTeamTimesheetMatrixQuery(startDate, endDate),
  useMyWorklogsQuery: (page?: number, limit?: number) =>
    mockUseMyWorklogsQuery(page, limit),
  useIssuesQuery: () => mockUseIssuesQuery(),
  useDeleteWorklogMutation: () => ({ mutateAsync: mockDeleteWorklogMutation }),
  useAssignIssueToMeMutation: () => ({ mutateAsync: vi.fn() }),
  useUpdateIssueStatusMutation: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('../store', () => ({
  useAuth: () => ({
    user: { id: 1, fullName: 'Developer User', email: 'dev@bugtracker.local' },
  }),
}));

describe('TimeTrackingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseWorklogStatsQuery.mockReturnValue({
      data: {
        totalHoursLogged: 42.5,
        hoursLoggedToday: 4.5,
        hoursLoggedThisWeek: 18.0,
        byProject: [{ projectId: 1, projectName: 'Platform Core', projectKey: 'PLAT', totalHours: 42.5 }],
        byUser: [{ userId: 1, fullName: 'Developer User', email: 'dev@bugtracker.local', avatarUrl: null, totalHours: 42.5 }],
      },
      isLoading: false,
      refetch: vi.fn(),
    });

    mockUseTeamTimesheetMatrixQuery.mockReturnValue({
      data: {
        startDate: '2026-09-28',
        endDate: '2026-10-04',
        days: ['2026-09-28', '2026-09-29'],
        members: [
          {
            userId: 1,
            fullName: 'Developer User',
            email: 'dev@bugtracker.local',
            systemRole: 'USER',
            avatarUrl: null,
            dailyHours: { '2026-09-28': 4.5, '2026-09-29': 0 },
            totalPeriodHours: 4.5,
          },
        ],
        dailyTotals: { '2026-09-28': 4.5, '2026-09-29': 0 },
        grandTotal: 4.5,
      },
      isLoading: false,
      refetch: vi.fn(),
    });

    mockUseMyWorklogsQuery.mockReturnValue({
      data: {
        items: [
          {
            id: 1,
            timeSpentHours: 4.5,
            dateLogged: '2026-09-28',
            description: 'Implemented SQL aggregations for worklogs',
            createdAt: '2026-09-28T10:00:00Z',
            issue: {
              id: 10,
              key: 'PLAT-10',
              title: 'Eliminate OOM in worklogs stats',
              status: 'IN_PROGRESS',
              priority: 'HIGH',
              projectName: 'Platform Core',
            },
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
      isLoading: false,
      refetch: vi.fn(),
    });

    mockUseIssuesQuery.mockReturnValue({
      data: {
        items: [
          {
            id: 10,
            key: 'PLAT-10',
            title: 'Eliminate OOM in worklogs stats',
            status: 'IN_PROGRESS',
            priority: 'HIGH',
          },
        ],
      },
      isLoading: false,
      refetch: vi.fn(),
    });
  });

  it('renders time tracking page with summary stats strip from SQL aggregations', () => {
    render(
      <MemoryRouter>
        <TimeTrackingPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Time Tracking/i })).toBeInTheDocument();
    expect(screen.getByText('Today:')).toBeInTheDocument();
    expect(screen.getAllByText('4.5h').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('This Week:')).toBeInTheDocument();
    expect(screen.getByText('18.0h')).toBeInTheDocument();
    expect(screen.getByText('Timesheet Matrix')).toBeInTheDocument();
  });

  it('switches to My Logs tab and renders server-side paginated worklogs', () => {
    render(
      <MemoryRouter>
        <TimeTrackingPage />
      </MemoryRouter>
    );

    const myLogsTab = screen.getByRole('button', { name: /My Logs/i });
    fireEvent.click(myLogsTab);

    expect(screen.getAllByText('Implemented SQL aggregations for worklogs').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('PLAT-10').length).toBeGreaterThanOrEqual(1);
  });
});
