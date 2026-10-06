import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { IssueSubtasksSection } from './IssueSubtasksSection';
import type { IssueItem } from '../../api/types/index.js';

const mockMutateStatus = vi.fn();
const mockMutateCreate = vi.fn();

vi.mock('../../api/queries/index.js', () => ({
  useUpdateIssueStatusMutation: () => ({
    mutateAsync: mockMutateStatus,
    isPending: false,
  }),
  useCreateIssueMutation: () => ({
    mutateAsync: mockMutateCreate,
    isPending: false,
  }),
  useUserDetailQuery: () => ({
    data: null,
    isLoading: false,
  }),
}));

const mockIssueWithSubtasks: IssueItem = {
  id: 10,
  key: 'PROJ-10',
  projectId: 1,
  projectKey: 'PROJ',
  projectName: 'Core Platform',
  issueNum: 10,
  title: 'Implement Authentication Pipeline',
  description: 'Setup JWT and sessions',
  issueType: 'FEATURE',
  status: 'IN_PROGRESS',
  priority: 'HIGH',
  estimatedHours: 12,
  loggedHours: 4,
  sprintId: 2,
  reporter: { id: 1, fullName: 'Alice Lead', email: 'alice@example.com' },
  assignee: { id: 2, fullName: 'Bob Dev', email: 'bob@example.com' },
  createdAt: '2026-01-01',
  updatedAt: '2026-01-02',
  subtasks: [
    {
      id: 11,
      key: 'PROJ-11',
      projectId: 1,
      projectKey: 'PROJ',
      projectName: 'Core Platform',
      issueNum: 11,
      title: 'Configure Argon2 hashing',
      description: null,
      issueType: 'SUBTASK',
      status: 'RESOLVED',
      priority: 'HIGH',
          estimatedHours: 2,
      loggedHours: 2,
      sprintId: 2,
      reporter: { id: 1, fullName: 'Alice Lead', email: 'alice@example.com' },
      assignee: { id: 2, fullName: 'Bob Dev', email: 'bob@example.com' },
      createdAt: '2026-01-01',
      updatedAt: '2026-01-02',
    },
    {
      id: 12,
      key: 'PROJ-12',
      projectId: 1,
      projectKey: 'PROJ',
      projectName: 'Core Platform',
      issueNum: 12,
      title: 'Setup Redis token blacklist',
      description: null,
      issueType: 'SUBTASK',
      status: 'OPEN',
      priority: 'HIGH',
          estimatedHours: 4,
      loggedHours: 0,
      sprintId: 2,
      reporter: { id: 1, fullName: 'Alice Lead', email: 'alice@example.com' },
      assignee: null,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-02',
    },
  ],
};

const mockChildSubtask: IssueItem = {
  id: 11,
  key: 'PROJ-11',
  projectId: 1,
  projectKey: 'PROJ',
  projectName: 'Core Platform',
  issueNum: 11,
  title: 'Configure Argon2 hashing',
  description: null,
  issueType: 'SUBTASK',
  status: 'RESOLVED',
  priority: 'HIGH',
  estimatedHours: 2,
  loggedHours: 2,
  sprintId: 2,
  parentId: 10,
  parent: mockIssueWithSubtasks,
  reporter: { id: 1, fullName: 'Alice Lead', email: 'alice@example.com' },
  assignee: { id: 2, fullName: 'Bob Dev', email: 'bob@example.com' },
  createdAt: '2026-01-01',
  updatedAt: '2026-01-02',
};

describe('IssueSubtasksSection', () => {
  const onSubtasksChanged = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders subtask list with progress and counter', () => {
    render(
      <MemoryRouter>
        <IssueSubtasksSection issue={mockIssueWithSubtasks} onSubtasksChanged={onSubtasksChanged} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Subtasks')).toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    expect(screen.getByText('50% completed')).toBeInTheDocument();
    expect(screen.getByText('Configure Argon2 hashing')).toBeInTheDocument();
    expect(screen.getByText('Setup Redis token blacklist')).toBeInTheDocument();
  });

  it('toggles subtask status when checkbox clicked', async () => {
    render(
      <MemoryRouter>
        <IssueSubtasksSection issue={mockIssueWithSubtasks} onSubtasksChanged={onSubtasksChanged} />
      </MemoryRouter>,
    );

    const markDoneBtn = screen.getByTitle('Mark as Done');
    fireEvent.click(markDoneBtn);

    await waitFor(() => {
      expect(mockMutateStatus).toHaveBeenCalledWith({
        issueId: 12,
        status: 'RESOLVED',
      });
      expect(onSubtasksChanged).toHaveBeenCalled();
    });
  });

  it('creates new subtask from inline form', async () => {
    render(
      <MemoryRouter>
        <IssueSubtasksSection issue={mockIssueWithSubtasks} onSubtasksChanged={onSubtasksChanged} />
      </MemoryRouter>,
    );

    const input = screen.getByPlaceholderText('Add a subtask...');
    const addBtn = screen.getByRole('button', { name: /add/i });

    fireEvent.change(input, { target: { value: 'Write unit tests' } });
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(mockMutateCreate).toHaveBeenCalledWith({
        projectId: 1,
        title: 'Write unit tests',
        parentId: 10,
        issueType: 'SUBTASK',
        priority: 'HIGH',
        sprintId: 2,
      });
      expect(onSubtasksChanged).toHaveBeenCalled();
    });
  });

  it('renders parent link banner when issue is a subtask', () => {
    render(
      <MemoryRouter>
        <IssueSubtasksSection issue={mockChildSubtask} onSubtasksChanged={onSubtasksChanged} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Subtask of:')).toBeInTheDocument();
    expect(screen.getByText('PROJ-10')).toBeInTheDocument();
    expect(screen.getByText('Implement Authentication Pipeline')).toBeInTheDocument();
  });
});
