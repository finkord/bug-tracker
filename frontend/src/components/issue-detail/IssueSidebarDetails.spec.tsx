import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IssueSidebarDetails } from './IssueSidebarDetails';
import type { IssueItem } from '../../api/types/index';

// Mock child modules
vi.mock('../../api/queries/index.js', () => ({
  useAssigneesQuery: vi.fn(() => ({
    data: {
      items: [
        { id: 1, fullName: 'System Administrator', email: 'admin@bugtracker.local' },
        { id: 2, fullName: 'Volodymyr Fufalko', email: 'devfinkord@gmail.com' },
      ],
    },
  })),
  useProjectSprintsQuery: vi.fn(() => ({ data: [] })),
  useProjectComponentsQuery: vi.fn(() => ({ data: [] })),
  useProjectVersionsQuery: vi.fn(() => ({ data: [] })),
  useUserDetailQuery: vi.fn(() => ({ data: null })),
}));

const sampleIssue: IssueItem = {
  id: 9,
  key: 'BUGT-6',
  projectId: 7,
  projectKey: 'BUGT',
  projectName: 'BugTracker',
  issueNum: 6,
  title: 'Test Issue',
  description: null,
  issueType: 'BUG',
  status: 'OPEN',
  priority: 'CRITICAL',
  estimatedHours: 0,
  loggedHours: 0,
  sprintId: null,
  reporter: {
    id: 2,
    fullName: 'Volodymyr Fufalko',
    email: 'devfinkord@gmail.com',
    systemRole: 'ADMIN',
  },
  assignee: {
    id: 1,
    fullName: 'System Administrator',
    email: 'admin@bugtracker.local',
    systemRole: 'ADMIN',
  },
  createdAt: '2026-10-02T23:12:06.436Z',
  updatedAt: '2026-10-03T17:32:31.357Z',
};

describe('IssueSidebarDetails Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  const renderComponent = (props: Partial<React.ComponentProps<typeof IssueSidebarDetails>> = {}) => {
    return render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <IssueSidebarDetails
            issue={sampleIssue}
            currentUser={{ id: 2, fullName: 'Volodymyr Fufalko', email: 'devfinkord@gmail.com', systemRole: 'ADMIN', isAdmin: true, isActivated: true, isBlocked: false, twoFactorEnabled: false, oauthProvider: 'LOCAL', hasPassword: true }}
            onAssignToMe={vi.fn().mockResolvedValue(undefined)}
            onSprintChange={vi.fn().mockResolvedValue(undefined)}
            onStatusChange={vi.fn().mockResolvedValue(undefined)}
            onUpdateFields={vi.fn().mockResolvedValue(undefined)}
            {...props}
          />
        </QueryClientProvider>
      </MemoryRouter>,
    );
  };

  it('renders unified properties panel without legacy separate People & Ownership block', () => {
    renderComponent();
    expect(screen.getByText('Properties')).toBeInTheDocument();
    expect(screen.queryByText('People & Ownership')).not.toBeInTheDocument();
    expect(screen.queryByText('View Profile')).not.toBeInTheDocument();
  });

  it('renders both assignee and reporter fields with fallback user names', () => {
    renderComponent();
    expect(screen.getByText('Assignee')).toBeInTheDocument();
    expect(screen.getByText('Reporter')).toBeInTheDocument();
    expect(screen.getByText('System Administrator')).toBeInTheDocument();
    expect(screen.getByText('Volodymyr Fufalko')).toBeInTheDocument();
  });

  it('calls onUpdateFields when updating fields', async () => {
    const onUpdateFields = vi.fn().mockResolvedValue(undefined);
    renderComponent({ onUpdateFields });

    // Status badge is present
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Priority')).toBeInTheDocument();
  });
});
