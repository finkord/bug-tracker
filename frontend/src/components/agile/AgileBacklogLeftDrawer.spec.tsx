import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgileBacklogLeftDrawer } from './AgileBacklogLeftDrawer';
import type { IssueItem } from '../../api/client';

// Mock Tanstack queries used inside drawer
vi.mock('../../api/queries', () => ({
  useProjectVersionsQuery: () => ({
    data: [
      { id: 1, name: 'v1.0.0', status: 'RELEASED', releaseDate: '2026-03-01' },
      { id: 2, name: 'v2.0.0', status: 'UNRELEASED', releaseDate: '2026-06-01' },
    ],
    isLoading: false,
  }),
  useUpdateIssueMutation: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

const mockIssues: IssueItem[] = [
  {
    id: 1,
    key: 'TEST-1',
    title: 'Core Epic Feature',
    issueType: 'EPIC',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    estimatedHours: 40,
    loggedHours: 10,
    projectId: 1,
    projectKey: 'TEST',
    projectName: 'Test Project',
    issueNum: 1,
    description: null,
    sprintId: null,
    reporter: { id: 1, fullName: 'Alice Lead', email: 'alice@example.com' },
    assignee: null,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 2,
    key: 'TEST-2',
    title: 'Child Task 1',
    issueType: 'TASK',
    status: 'RESOLVED',
    priority: 'MEDIUM',
    estimatedHours: 8,
    loggedHours: 8,
    projectId: 1,
    projectKey: 'TEST',
    projectName: 'Test Project',
    issueNum: 2,
    parentId: 1,
    description: null,
    sprintId: null,
    reporter: { id: 1, fullName: 'Alice Lead', email: 'alice@example.com' },
    assignee: null,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 3,
    key: 'TEST-3',
    title: 'Child Task 2',
    issueType: 'BUG',
    status: 'OPEN',
    priority: 'CRITICAL',
    estimatedHours: 4,
    loggedHours: 0,
    projectId: 1,
    projectKey: 'TEST',
    projectName: 'Test Project',
    issueNum: 3,
    parentId: 1,
    fixVersionId: 1,
    description: null,
    sprintId: null,
    reporter: { id: 1, fullName: 'Alice Lead', email: 'alice@example.com' },
    assignee: null,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
];

describe('AgileBacklogLeftDrawer Component', () => {
  it('renders Epics tab with list of project epics and child progress', () => {
    const onSelectEpic = vi.fn();
    const onSelectVersion = vi.fn();
    const onDrawerTabChange = vi.fn();
    const onClose = vi.fn();
    const onCreateEpic = vi.fn();

    render(
      <AgileBacklogLeftDrawer
        projectId={1}
        projectKey="TEST"
        issues={mockIssues}
        activeDrawerTab="epics"
        onDrawerTabChange={onDrawerTabChange}
        selectedEpicId="ALL"
        onSelectEpic={onSelectEpic}
        selectedVersionId="ALL"
        onSelectVersion={onSelectVersion}
        onClose={onClose}
        onCreateEpic={onCreateEpic}
      />,
    );

    // Title and Epics list
    expect(screen.getByText(/Epics \(/i)).toBeInTheDocument();
    expect(screen.getByText('Core Epic Feature')).toBeInTheDocument();
    expect(screen.getByText('TEST-1')).toBeInTheDocument();

    // 1 of 2 child issues completed (50%)
    expect(screen.getByText(/1\/2 done/i)).toBeInTheDocument();
  });

  it('filters issues when an epic is selected', () => {
    const onSelectEpic = vi.fn();
    const onSelectVersion = vi.fn();
    const onDrawerTabChange = vi.fn();
    const onClose = vi.fn();

    render(
      <AgileBacklogLeftDrawer
        projectId={1}
        projectKey="TEST"
        issues={mockIssues}
        activeDrawerTab="epics"
        onDrawerTabChange={onDrawerTabChange}
        selectedEpicId="ALL"
        onSelectEpic={onSelectEpic}
        selectedVersionId="ALL"
        onSelectVersion={onSelectVersion}
        onClose={onClose}
      />,
    );

    const epicButton = screen.getByText('Core Epic Feature').closest('[role="button"]');
    expect(epicButton).toBeInTheDocument();
    fireEvent.click(epicButton!);

    expect(onSelectEpic).toHaveBeenCalledWith(1);
  });

  it('renders Versions tab with releases list', () => {
    const onSelectEpic = vi.fn();
    const onSelectVersion = vi.fn();
    const onDrawerTabChange = vi.fn();
    const onClose = vi.fn();

    render(
      <AgileBacklogLeftDrawer
        projectId={1}
        projectKey="TEST"
        issues={mockIssues}
        activeDrawerTab="versions"
        onDrawerTabChange={onDrawerTabChange}
        selectedEpicId="ALL"
        onSelectEpic={onSelectEpic}
        selectedVersionId="ALL"
        onSelectVersion={onSelectVersion}
        onClose={onClose}
      />,
    );

    expect(screen.getByText('All Versions')).toBeInTheDocument();
    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
    expect(screen.getByText('v2.0.0')).toBeInTheDocument();

    const versionItem = screen.getByText('v1.0.0').closest('[role="button"]');
    expect(versionItem).toBeInTheDocument();
    fireEvent.click(versionItem!);

    expect(onSelectVersion).toHaveBeenCalledWith(1);
  });

  it('calls onClose when collapse button is clicked', () => {
    const onClose = vi.fn();

    render(
      <AgileBacklogLeftDrawer
        projectId={1}
        projectKey="TEST"
        issues={mockIssues}
        activeDrawerTab="epics"
        onDrawerTabChange={vi.fn()}
        selectedEpicId="ALL"
        onSelectEpic={vi.fn()}
        selectedVersionId="ALL"
        onSelectVersion={vi.fn()}
        onClose={onClose}
      />,
    );

    const closeBtn = screen.getByLabelText(/collapse side panel/i);
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
