import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { IssueContextMenu } from './IssueContextMenu';
import type { IssueItem } from '../../api/client';

const mockIssue: IssueItem = {
  id: 101,
  key: 'MOBT-101',
  title: 'Test right click context menu issue',
  status: 'OPEN',
  priority: 'HIGH',
  issueType: 'BUG',
  projectId: 1,
  reporterId: 1,
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
};

describe('IssueContextMenu', () => {
  const onClose = vi.fn();
  const onStatusChange = vi.fn();
  const onAssignToMe = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when position is null', () => {
    const { container } = render(
      <MemoryRouter>
        <IssueContextMenu
          issue={mockIssue}
          position={null}
          onClose={onClose}
        />
      </MemoryRouter>,
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders all primary actions when open at position', () => {
    render(
      <MemoryRouter>
        <IssueContextMenu
          issue={mockIssue}
          position={{ x: 100, y: 150 }}
          onClose={onClose}
          onStatusChange={onStatusChange}
          onAssignToMe={onAssignToMe}
          currentUserId={2}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('MOBT-101')).toBeInTheDocument();
    expect(screen.getByText('Open in new tab')).toBeInTheDocument();
    expect(screen.getByText('Open issue details')).toBeInTheDocument();
    expect(screen.getByText('Copy link')).toBeInTheDocument();
    expect(screen.getByText('Copy issue key')).toBeInTheDocument();
    expect(screen.getByText('Assign to me')).toBeInTheDocument();
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Code Review')).toBeInTheDocument();
    expect(screen.getByText('Resolved')).toBeInTheDocument();
    expect(screen.getByText('Closed')).toBeInTheDocument();
  });

  it('triggers window.open when "Open in new tab" is clicked', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(
      <MemoryRouter>
        <IssueContextMenu
          issue={mockIssue}
          position={{ x: 100, y: 150 }}
          onClose={onClose}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText('Open in new tab'));
    expect(openSpy).toHaveBeenCalledWith('/issues/MOBT-101', '_blank');
    expect(onClose).toHaveBeenCalled();
  });

  it('triggers onStatusChange when a transition is clicked', () => {
    render(
      <MemoryRouter>
        <IssueContextMenu
          issue={mockIssue}
          position={{ x: 100, y: 150 }}
          onClose={onClose}
          onStatusChange={onStatusChange}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText('In Progress'));
    expect(onStatusChange).toHaveBeenCalledWith(101, 'IN_PROGRESS');
    expect(onClose).toHaveBeenCalled();
  });

  it('triggers onAssignToMe when clicked', () => {
    render(
      <MemoryRouter>
        <IssueContextMenu
          issue={mockIssue}
          position={{ x: 100, y: 150 }}
          onClose={onClose}
          onAssignToMe={onAssignToMe}
          currentUserId={2}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText('Assign to me'));
    expect(onAssignToMe).toHaveBeenCalledWith(101);
    expect(onClose).toHaveBeenCalled();
  });

  it('closes when Escape key is pressed', () => {
    render(
      <MemoryRouter>
        <IssueContextMenu
          issue={mockIssue}
          position={{ x: 100, y: 150 }}
          onClose={onClose}
        />
      </MemoryRouter>,
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
