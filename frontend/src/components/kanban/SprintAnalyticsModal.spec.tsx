import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SprintAnalyticsModal } from './SprintAnalyticsModal';
import type { IssueItem } from '../../api/client';
import type { SprintDefinition } from '../../types/agile';

vi.mock('../../api/queries', () => ({
  useSprintBurndownQuery: vi.fn().mockReturnValue({
    data: {
      sprintId: 10,
      sprintName: 'Sprint 1',
      totalScopeHours: 40,
      remainingHours: 15,
      completedHours: 25,
      points: [
        { date: '2026-09-01', dayLabel: 'Day 1', idealHours: 40, remainingHours: 40, completedHours: 0, isRecordedSnapshot: true },
        { date: '2026-09-05', dayLabel: 'Day 5', idealHours: 20, remainingHours: 15, completedHours: 25, isRecordedSnapshot: true },
      ],
    },
    isLoading: false,
  }),
  useSprintFlowMetricsQuery: vi.fn().mockReturnValue({
    data: {
      sprintId: 10,
      sprintName: 'Sprint 1',
      averageVelocity: 35.5,
      cfd: [
        { date: '2026-09-01', dayLabel: 'Day 1', open: 5, inProgress: 2, review: 1, resolved: 0, closed: 0, total: 8 },
      ],
      cycleTime: {
        averageCycleTimeDays: 3.2,
        p50CycleTimeDays: 2.5,
        p85CycleTimeDays: 4.0,
        p95CycleTimeDays: 5.5,
        averageLeadTimeDays: 4.8,
        items: [
          { issueId: 101, key: 'CORE-1', title: 'Task 1', issueType: 'TASK', priority: 'HIGH', cycleTimeDays: 2.5, leadTimeDays: 4.0, completedAt: '2026-09-05' },
        ],
      },
      velocity: [
        { sprintId: 9, sprintName: 'Sprint 0', status: 'COMPLETED', committedHours: 35, completedHours: 35, completedIssues: 5, totalIssues: 5 },
        { sprintId: 10, sprintName: 'Sprint 1', status: 'ACTIVE', committedHours: 40, completedHours: 25, completedIssues: 3, totalIssues: 6 },
      ],
    },
    isLoading: false,
  }),
}));

describe('SprintAnalyticsModal', () => {
  let queryClient: QueryClient;
  const mockOnClose = vi.fn();

  const mockSprint: SprintDefinition = {
    id: 10,
    projectId: 1,
    name: 'Sprint 1',
    status: 'ACTIVE',
    startDate: '2026-09-01',
    endDate: '2026-09-14',
    goal: 'Ship MVP deliverables',
  };

  const mockIssues: IssueItem[] = [
    {
      id: 101,
      projectId: 1,
      key: 'CORE-1',
      title: 'Fix Redis session synchronization',
      status: 'RESOLVED',
      priority: 'HIGH',
      issueType: 'BUG',
      estimatedHours: 8,
      loggedHours: 6,
      assignee: { id: 1, fullName: 'Alice Developer', email: 'alice@dev.local' },
    } as unknown as IssueItem,
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  const renderModal = (isOpen = true) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <SprintAnalyticsModal
          isOpen={isOpen}
          onClose={mockOnClose}
          sprint={mockSprint}
          sprintIssues={mockIssues}
          allSprints={{ 'Sprint 1': mockSprint }}
          allIssues={mockIssues}
        />
      </QueryClientProvider>,
    );
  };

  it('does not render when isOpen is false', () => {
    renderModal(false);
    expect(screen.queryByText(/Agile Flow & Analytics/i)).not.toBeInTheDocument();
  });

  it('renders modal with sprint name and default Burndown tab', () => {
    renderModal(true);
    expect(screen.getByText(/Sprint 1 Agile Flow & Analytics/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Scope/i)).toBeInTheDocument();
    expect(screen.getByText(/Work Logged/i)).toBeInTheDocument();
  });

  it('switches to Velocity tab and displays backend average velocity', () => {
    renderModal(true);
    const velocityTabBtn = screen.getByRole('tab', { name: /Velocity/i });
    fireEvent.pointerDown(velocityTabBtn, { button: 0 });
    fireEvent.keyDown(velocityTabBtn, { key: 'Enter' });

    expect(screen.getByText(/Avg. Velocity: 35.5 hrs \/ sprint/i)).toBeInTheDocument();
    expect(screen.getByText('Sprint 0')).toBeInTheDocument();
    expect(screen.getAllByText(/Sprint 1/i).length).toBeGreaterThanOrEqual(1);
  });

  it('switches to Executive Report tab and renders DataTable', () => {
    renderModal(true);
    const reportTabBtn = screen.getByRole('tab', { name: /Executive Report/i });
    fireEvent.pointerDown(reportTabBtn, { button: 0 });
    fireEvent.keyDown(reportTabBtn, { key: 'Enter' });

    expect(screen.getByText(/Stakeholder Agile Sprint Report/i)).toBeInTheDocument();
    expect(screen.getByText('CORE-1')).toBeInTheDocument();
    expect(screen.getByText('Fix Redis session synchronization')).toBeInTheDocument();
  });

  it('switches to Cycle Time & SLE tab and renders percentiles', () => {
    renderModal(true);
    const cycleTimeTabBtn = screen.getByRole('tab', { name: /Cycle Time/i });
    fireEvent.pointerDown(cycleTimeTabBtn, { button: 0 });
    fireEvent.keyDown(cycleTimeTabBtn, { key: 'Enter' });

    expect(screen.getByText(/P50 \(Median Cycle\)/i)).toBeInTheDocument();
    expect(screen.getByText(/P85 Target \(SLE\)/i)).toBeInTheDocument();
    expect(screen.getAllByText(/2\.5/).length).toBeGreaterThanOrEqual(1);
  });
});
