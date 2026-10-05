import { ApiProperty } from '@nestjs/swagger';
import { IssueStatus } from '../entities/issue.entity.js';

export class WorkflowTransitionDto {
  @ApiProperty({ example: 'start_progress', description: 'Transition machine identifier' })
  id: string;

  @ApiProperty({ example: 'Start Progress', description: 'Human-readable action name' })
  name: string;

  @ApiProperty({ enum: IssueStatus, example: IssueStatus.IN_PROGRESS, description: 'Target FSM status' })
  toStatus: IssueStatus;
}

export const WORKFLOW_TRANSITIONS: Record<
  IssueStatus,
  Array<{ id: string; name: string; toStatus: IssueStatus }>
> = {
  [IssueStatus.OPEN]: [
    { id: 'start_progress', name: 'Start Progress', toStatus: IssueStatus.IN_PROGRESS },
    { id: 'resolve', name: 'Resolve Issue', toStatus: IssueStatus.RESOLVED },
    { id: 'close', name: 'Close Issue', toStatus: IssueStatus.CLOSED },
  ],
  [IssueStatus.IN_PROGRESS]: [
    { id: 'submit_review', name: 'Submit for Review', toStatus: IssueStatus.REVIEW },
    { id: 'resolve', name: 'Resolve Issue', toStatus: IssueStatus.RESOLVED },
    { id: 'stop_progress', name: 'Stop Progress', toStatus: IssueStatus.OPEN },
  ],
  [IssueStatus.REVIEW]: [
    { id: 'approve_review', name: 'Approve & Resolve', toStatus: IssueStatus.RESOLVED },
    { id: 'reject_review', name: 'Request Changes', toStatus: IssueStatus.IN_PROGRESS },
  ],
  [IssueStatus.RESOLVED]: [
    { id: 'close', name: 'Close Issue', toStatus: IssueStatus.CLOSED },
    { id: 'reopen', name: 'Reopen Issue', toStatus: IssueStatus.OPEN },
    { id: 'reopen_progress', name: 'Reopen to In Progress', toStatus: IssueStatus.IN_PROGRESS },
  ],
  [IssueStatus.CLOSED]: [
    { id: 'reopen', name: 'Reopen Issue', toStatus: IssueStatus.OPEN },
  ],
};
