import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IssueModal } from './IssueModal';
import type { IssueItem } from '../../api/client';

const mockProjects = [
  { id: 1, key: 'PROJ', name: 'Project One' },
  { id: 2, key: 'CORE', name: 'Core System' },
];

const mockAssignees = [
  { id: 10, fullName: 'Alice Engineer', email: 'alice@example.com', systemRole: 'DEVELOPER' },
  { id: 20, fullName: 'Bob Architect', email: 'bob@example.com', systemRole: 'ADMIN' },
];

const mockSprints = [
  { id: 101, name: 'Sprint 1', status: 'ACTIVE' },
];

const mockComponents = [
  { id: 201, name: 'Auth Service' },
];

const mockVersions = [
  { id: 301, name: 'v1.0.0', status: 'UNRELEASED' },
];

vi.mock('../../store', () => ({
  useAuth: () => ({
    user: { id: 10, fullName: 'Alice Engineer', email: 'alice@example.com' },
  }),
}));

vi.mock('../../api/queries', () => ({
  useProjectsQuery: () => ({ data: mockProjects }),
  useAssigneesQuery: () => ({ data: { items: mockAssignees } }),
  useProjectSprintsQuery: () => ({ data: mockSprints }),
  useProjectComponentsQuery: () => ({ data: mockComponents }),
  useProjectVersionsQuery: () => ({ data: mockVersions }),
  useIssuesQuery: () => ({ data: { items: [] } }),
}));

vi.mock('../../api/client', () => ({
  api: {
    createIssue: vi.fn(),
    updateIssue: vi.fn(),
  },
}));

describe('IssueModal Progressive Disclosure & UX', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  const renderModal = (props: Partial<React.ComponentProps<typeof IssueModal>> = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <IssueModal
          isOpen={true}
          onClose={vi.fn()}
          onIssueSaved={vi.fn()}
          {...props}
        />
      </QueryClientProvider>,
    );
  };

  it('renders core essential fields and keeps additional fields collapsed by default for new issues', () => {
    renderModal();

    // Core essential fields visible
    expect(screen.getByText('Create New Issue')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Critical memory leak/i)).toBeInTheDocument();
    expect(screen.getByText('Issue Type')).toBeInTheDocument();
    expect(screen.getByText('Priority')).toBeInTheDocument();
    expect(screen.getByText('Assignee')).toBeInTheDocument();
    expect(screen.getByText('Description (Steps to reproduce, environment details)')).toBeInTheDocument();

    // Additional fields button is present, but contents are hidden
    const toggleBtn = screen.getByRole('button', { name: /Additional fields/i });
    expect(toggleBtn).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('e.g. 4.0')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('e.g. backend, security, api')).not.toBeInTheDocument();
  });

  it('expands additional fields when user clicks toggle button', () => {
    renderModal();

    const toggleBtn = screen.getByRole('button', { name: /Additional fields/i });
    fireEvent.click(toggleBtn);

    // Now additional fields are visible
    expect(screen.getByPlaceholderText('e.g. 4.0')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. backend, security, api')).toBeInTheDocument();
    expect(screen.getByText('Sprint')).toBeInTheDocument();
    expect(screen.getByText('Component')).toBeInTheDocument();
    expect(screen.getByText('Fix Version')).toBeInTheDocument();

    // Button label switches to Hide
    expect(screen.getByRole('button', { name: /Hide additional fields/i })).toBeInTheDocument();
  });

  it('auto-expands additional fields when editing an issue that has sprint/components configured', () => {
    const editingIssue: IssueItem = {
      id: 99,
      key: 'PROJ-99',
      issueNum: 99,
      title: 'Fix Redis deadlock',
      description: 'Reproduced in staging',
      status: 'OPEN',
      priority: 'CRITICAL',
      issueType: 'BUG',
      projectId: 1,
      estimatedHours: 4,
      sprintId: 101,
      componentId: 201,
      labels: ['backend', 'performance'],
      reporterId: 10,
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    };

    renderModal({ editingIssue });

    expect(screen.getByText('Edit Issue: PROJ-99')).toBeInTheDocument();
    // Additional fields are already open because issue has sprint & estimate
    expect(screen.getByPlaceholderText('e.g. 4.0')).toBeInTheDocument();
    expect(screen.getByDisplayValue('4')).toBeInTheDocument();
    expect(screen.getByDisplayValue('backend, performance')).toBeInTheDocument();
  });

  it('toggles markdown Write and Preview tabs', () => {
    renderModal();

    const writeTab = screen.getByRole('tab', { name: /Write/i });
    const previewTab = screen.getByRole('tab', { name: /Preview/i });

    expect(writeTab).toBeInTheDocument();
    expect(previewTab).toBeInTheDocument();

    // Click preview tab
    fireEvent.click(previewTab);
    expect(screen.getByText(/Nothing to preview/i)).toBeInTheDocument();

    // Click write tab back
    fireEvent.click(writeTab);
    expect(screen.getByPlaceholderText(/Describe the defect/i)).toBeInTheDocument();
  });
});
