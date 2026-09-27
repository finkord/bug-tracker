import type { IssueStatus } from '../api/client';

export type BoardViewMode = 'flat' | 'swimlanes';
export type CardDensity = 'comfortable' | 'compact' | 'minimal';
export type UnassignedPosition = 'top' | 'bottom';

export interface KanbanSettings {
  viewMode: BoardViewMode;
  cardDensity: CardDensity;
  unassignedPosition: UnassignedPosition;
  showClosedColumn: boolean;
  wipLimits: Partial<Record<IssueStatus, number>>;
}

export interface QuickFilterState {
  onlyMine: boolean;
  unassignedOnly: boolean;
  highPriorityOnly: boolean;
}

export interface KanbanColumnDef {
  status: IssueStatus;
  title: string;
  badgeVariant: 'open' | 'in-progress' | 'review' | 'resolved' | 'closed';
  shortTitle: string;
}

export const KANBAN_COLUMNS: KanbanColumnDef[] = [
  { status: 'OPEN', title: 'To Do', badgeVariant: 'open', shortTitle: 'To Do' },
  { status: 'IN_PROGRESS', title: 'In Progress', badgeVariant: 'in-progress', shortTitle: 'Progress' },
  { status: 'REVIEW', title: 'Code Review', badgeVariant: 'review', shortTitle: 'Review' },
  { status: 'RESOLVED', title: 'Resolved', badgeVariant: 'resolved', shortTitle: 'Resolved' },
  { status: 'CLOSED', title: 'Closed', badgeVariant: 'closed', shortTitle: 'Closed' },
];

export const DEFAULT_KANBAN_SETTINGS: KanbanSettings = {
  viewMode: 'flat',
  cardDensity: 'comfortable',
  unassignedPosition: 'bottom',
  showClosedColumn: true,
  wipLimits: {
    IN_PROGRESS: 5,
    REVIEW: 4,
  },
};
