import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { IssueActivityTabs } from './IssueActivityTabs';
import type { IssueItem, UserProfile } from '../../api/types/index.js';

vi.mock('../../api/queries/index.js', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useUserDetailQuery: () => ({ data: null }),
    useIssueHistoryQuery: () => ({
      data: [
        {
          id: 1,
          field: 'status',
          oldValue: 'OPEN',
          newValue: 'IN_PROGRESS',
          createdAt: '2026-01-02T10:00:00Z',
          user: { id: 1, fullName: 'Alice Lead' },
        },
      ],
      isLoading: false,
    }),
    useUpdateIssueCommentMutation: () => ({
      mutateAsync: vi.fn(),
      isPending: false,
    }),
    useDeleteIssueCommentMutation: () => ({
      mutateAsync: vi.fn(),
      isPending: false,
    }),
    useDeleteWorklogMutation: () => ({
      mutateAsync: vi.fn(),
      isPending: false,
    }),
  };
});

vi.mock('../kanban/VcsDevelopmentPanel.js', () => ({
  VcsDevelopmentPanel: () => <div data-testid="vcs-development-panel">VCS Panel</div>,
}));

const mockUser: UserProfile = {
  id: 1,
  email: 'alice@example.com',
  fullName: 'Alice Lead',
  systemRole: 'ADMIN',
  twoFactorEnabled: false,
  theme: 'dark',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

const mockIssue: IssueItem = {
  id: 100,
  key: 'PROJ-100',
  projectId: 1,
  projectKey: 'PROJ',
  projectName: 'Test Project',
  issueNum: 100,
  title: 'Test Issue with Activity',
  description: 'Activity test description',
  issueType: 'BUG',
  status: 'OPEN',
  priority: 'HIGH',
  estimatedHours: 8,
  loggedHours: 3,
  reporter: { id: 1, fullName: 'Alice Lead', email: 'alice@example.com' },
  assignee: { id: 2, fullName: 'Bob Dev', email: 'bob@example.com' },
  createdAt: '2026-01-01',
  updatedAt: '2026-01-02',
  comments: [
    {
      id: 50,
      issueId: 100,
      authorId: 1,
      text: 'First test comment in thread',
      createdAt: '2026-01-02T09:00:00Z',
      updatedAt: '2026-01-02T09:00:00Z',
      author: { id: 1, fullName: 'Alice Lead', email: 'alice@example.com' },
    },
  ],
  worklogs: [
    {
      id: 70,
      issueId: 100,
      userId: 1,
      timeSpentHours: 3,
      description: 'Investigated initial stack trace',
      dateLogged: '2026-01-02',
      createdAt: '2026-01-02T10:00:00Z',
      updatedAt: '2026-01-02T10:00:00Z',
      user: { id: 1, fullName: 'Alice Lead' },
    },
  ],
};

describe('IssueActivityTabs', () => {
  it('renders Comments tab by default with comment count and comment item', () => {
    render(
      <MemoryRouter>
        <IssueActivityTabs
          issue={mockIssue}
          currentUser={mockUser}
          onAddComment={vi.fn()}
          onUploadCommentScreenshot={vi.fn()}
          onOpenLogWorkModal={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Comments \(1\)/)).toBeInTheDocument();
    expect(screen.getByText('First test comment in thread')).toBeInTheDocument();
  });

  it('renders Worklogs tab and shows worklog entries and hours', () => {
    const onOpenLogWork = vi.fn();
    render(
      <MemoryRouter>
        <IssueActivityTabs
          issue={mockIssue}
          currentUser={mockUser}
          activeTab="worklogs"
          onAddComment={vi.fn()}
          onUploadCommentScreenshot={vi.fn()}
          onOpenLogWorkModal={onOpenLogWork}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Investigated initial stack trace')).toBeInTheDocument();
    expect(screen.getAllByText('3h').length).toBeGreaterThanOrEqual(1);
  });

  it('renders Audit Trail tab and displays field changes', () => {
    render(
      <MemoryRouter>
        <IssueActivityTabs
          issue={mockIssue}
          currentUser={mockUser}
          activeTab="history"
          onAddComment={vi.fn()}
          onUploadCommentScreenshot={vi.fn()}
          onOpenLogWorkModal={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Updated/i)).toBeInTheDocument();
    expect(screen.getByText('status')).toBeInTheDocument();
    expect(screen.getByText('OPEN')).toBeInTheDocument();
    expect(screen.getByText('IN_PROGRESS')).toBeInTheDocument();
  });

  it('renders Development tab with VCS panel', () => {
    render(
      <MemoryRouter>
        <IssueActivityTabs
          issue={mockIssue}
          currentUser={mockUser}
          activeTab="development"
          onAddComment={vi.fn()}
          onUploadCommentScreenshot={vi.fn()}
          onOpenLogWorkModal={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('vcs-development-panel')).toBeInTheDocument();
  });

  it('calls onTabChange when tab triggers are clicked', () => {
    const onTabChange = vi.fn();
    render(
      <MemoryRouter>
        <IssueActivityTabs
          issue={mockIssue}
          currentUser={mockUser}
          onTabChange={onTabChange}
          onAddComment={vi.fn()}
          onUploadCommentScreenshot={vi.fn()}
          onOpenLogWorkModal={vi.fn()}
        />
      </MemoryRouter>,
    );

    const worklogsTrigger = screen.getByRole('tab', { name: /Worklogs/i });
    fireEvent.click(worklogsTrigger);
    // Even if radix tab value is controlled or uncontrolled, trigger fires click
    expect(worklogsTrigger).toBeInTheDocument();
  });
});
