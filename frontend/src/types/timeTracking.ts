export type TimeTrackingTab = 'matrix' | 'calendar' | 'estimates' | 'worklogs';

export type DateRangeMode = 'week' | 'month';

export type MatrixGroupBy = 'user' | 'issue';

export interface WorklogCellEntry {
  id: number;
  issueId?: number;
  issueKey?: string;
  issueTitle?: string;
  timeSpentHours: number;
  description?: string;
  dateLogged?: string;
  user?: {
    id?: number;
    fullName: string;
    avatarUrl?: string | null;
  };
}

export interface CellBreakdownData {
  title: string;
  subtitle?: string;
  date: string;
  totalHours: number;
  worklogs: WorklogCellEntry[];
  targetIssueId?: number;
  targetUserId?: number;
}
