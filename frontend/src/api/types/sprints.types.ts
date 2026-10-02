export type SprintStatus = 'ACTIVE' | 'PLANNED' | 'COMPLETED';

export interface SprintItem {
  id: number;
  projectId: number;
  teamId?: number | null;
  team?: {
    id: number;
    name: string;
    sprintCapacityHours: number;
  } | null;
  capacityHours?: number | null;
  name: string;
  goal: string | null;
  startDate: string | null;
  endDate: string | null;
  status: SprintStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSprintPayload {
  name: string;
  goal?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: SprintStatus;
  teamId?: number | null;
  capacityHours?: number | null;
}

export interface UpdateSprintPayload {
  name?: string;
  goal?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: SprintStatus;
  teamId?: number | null;
  capacityHours?: number | null;
}

export interface CompleteSprintPayload {
  transferSprintId?: number | null;
}

export interface SprintBurndownPoint {
  date: string;
  idealRemainingHours: number;
  actualRemainingHours: number | null;
  completedHours: number;
  scopeHours: number;
}

export interface SprintBurndownResponse {
  sprintId: number;
  sprintName: string;
  startDate: string | null;
  endDate: string | null;
  totalCapacityHours: number;
  points: SprintBurndownPoint[];
}

export interface CfdDataPoint {
  date: string;
  dayLabel: string;
  open: number;
  inProgress: number;
  review: number;
  resolved: number;
  closed: number;
  total: number;
}

export interface CycleTimeItem {
  issueId: number;
  key: string;
  title: string;
  issueType: string;
  priority: string;
  cycleTimeDays: number;
  leadTimeDays: number;
  completedAt: string | null;
}

export interface CycleTimeSummary {
  averageCycleTimeDays: number;
  p50CycleTimeDays: number;
  p85CycleTimeDays: number;
  p95CycleTimeDays: number;
  averageLeadTimeDays: number;
  items: CycleTimeItem[];
}

export interface SprintVelocityItem {
  sprintId: number;
  sprintName: string;
  status: string;
  committedHours: number;
  completedHours: number;
  completedIssues: number;
  totalIssues: number;
}

export interface SprintFlowMetricsResponse {
  sprintId: number;
  sprintName: string;
  cfd: CfdDataPoint[];
  cycleTime: CycleTimeSummary;
  velocity: SprintVelocityItem[];
}

