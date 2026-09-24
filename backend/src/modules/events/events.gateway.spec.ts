import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventsGateway } from './events.gateway.js';

describe('EventsGateway', () => {
  let gateway: EventsGateway;
  let mockServer: any;

  beforeEach(() => {
    gateway = new EventsGateway();
    mockServer = {
      to: vi.fn().mockReturnThis(),
      emit: vi.fn(),
    };
    gateway.server = mockServer;
  });

  it('should broadcast issue:created event', () => {
    const testIssue = { id: 101, projectId: 1, title: 'Test Issue' };
    gateway.broadcastIssueCreated(testIssue);

    expect(mockServer.to).toHaveBeenCalledWith('project_1');
    expect(mockServer.emit).toHaveBeenCalledWith('issue:created', testIssue);
  });

  it('should broadcast issue:updated event to project and issue rooms', () => {
    const testIssue = { id: 102, projectId: 2, title: 'Updated Issue' };
    gateway.broadcastIssueUpdated(testIssue);

    expect(mockServer.to).toHaveBeenCalledWith('project_2');
    expect(mockServer.to).toHaveBeenCalledWith('issue_102');
    expect(mockServer.emit).toHaveBeenCalledWith('issue:updated', testIssue);
  });

  it('should broadcast issue:deleted event', () => {
    gateway.broadcastIssueDeleted(103, 3);

    expect(mockServer.to).toHaveBeenCalledWith('project_3');
    expect(mockServer.to).toHaveBeenCalledWith('issue_103');
    expect(mockServer.emit).toHaveBeenCalledWith('issue:deleted', { issueId: 103, projectId: 3 });
  });

  it('should broadcast worklog:created event', () => {
    const payload = { issueId: 104, projectId: 4, worklog: { id: 1, timeSpentHours: 2 } };
    gateway.broadcastWorklogAdded(payload);

    expect(mockServer.to).toHaveBeenCalledWith('issue_104');
    expect(mockServer.to).toHaveBeenCalledWith('project_4');
    expect(mockServer.emit).toHaveBeenCalledWith('worklog:created', payload);
  });
});
