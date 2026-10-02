import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { UserProfileViewPage } from './UserProfileViewPage';

const mockUseUserDetailQuery = vi.fn();
const mockUseIssuesQuery = vi.fn();

vi.mock('../store/index.js', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'admin@example.com', fullName: 'Current Admin' },
  }),
}));

vi.mock('../api/queries/useUsersQuery.js', () => ({
  useUserDetailQuery: (id?: number) => mockUseUserDetailQuery(id),
}));

vi.mock('../api/queries/useIssuesQuery.js', () => ({
  useIssuesQuery: (params?: any) => mockUseIssuesQuery(params),
}));

vi.mock('../components/kanban/IssueDetailsModal.js', () => ({
  IssueDetailsModal: ({ issueId, isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="mock-issue-details-modal">
        <span>Modal Issue ID: {issueId}</span>
        <button onClick={onClose}>Close Modal</button>
      </div>
    ) : null,
}));

describe('UserProfileViewPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders not found card when user does not exist', () => {
    mockUseUserDetailQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
    });
    mockUseIssuesQuery.mockReturnValue({
      data: { items: [], total: 0 },
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/users/999']}>
        <Routes>
          <Route path="/users/:id" element={<UserProfileViewPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('User Not Found')).toBeInTheDocument();
  });

  it('renders user details, metrics, and assigned tickets successfully', () => {
    mockUseUserDetailQuery.mockReturnValue({
      data: {
        id: 7,
        fullName: 'Jane Developer',
        email: 'jane@example.com',
        systemRole: 'USER',
        jobTitle: 'Senior Frontend Engineer',
        createdAt: '2023-05-10T00:00:00Z',
      },
      isLoading: false,
      isError: false,
    });

    const sampleIssues = [
      {
        id: 201,
        key: 'PROJ-201',
        title: 'Implement Dark Theme Tokens',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        issueType: 'STORY',
        projectName: 'Design System',
      },
      {
        id: 202,
        key: 'PROJ-202',
        title: 'Fix Race Condition in Auth',
        status: 'RESOLVED',
        priority: 'CRITICAL',
        issueType: 'BUG',
        projectName: 'Core Platform',
      },
    ];

    mockUseIssuesQuery.mockReturnValue({
      data: { items: sampleIssues, total: 2 },
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/users/7']}>
        <Routes>
          <Route path="/users/:id" element={<UserProfileViewPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Jane Developer')).toBeInTheDocument();
    expect(screen.getByText('Senior Frontend Engineer')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('Member')).toBeInTheDocument();

    // Verify metrics cards
    expect(screen.getByText('Assigned Tickets')).toBeInTheDocument();
    expect(screen.getByText('Implement Dark Theme Tokens')).toBeInTheDocument();
    expect(screen.getByText('Fix Race Condition in Auth')).toBeInTheDocument();

    // Open modal on click
    fireEvent.click(screen.getByText('Implement Dark Theme Tokens'));
    expect(screen.getByTestId('mock-issue-details-modal')).toBeInTheDocument();
    expect(screen.getByText('Modal Issue ID: 201')).toBeInTheDocument();
  });
});
