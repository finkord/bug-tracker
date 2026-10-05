import type { components } from './api.generated.js';

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

export type CreateSprintPayload = Omit<components['schemas']['CreateSprintDto'], 'teamId' | 'goal' | 'startDate' | 'endDate' | 'capacityHours'> & {
  teamId?: number | null;
  goal?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  capacityHours?: number | null;
  status?: SprintStatus;
};

export type UpdateSprintPayload = Omit<components['schemas']['UpdateSprintDto'], 'teamId' | 'goal' | 'startDate' | 'endDate' | 'capacityHours'> & {
  teamId?: number | null;
  goal?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  capacityHours?: number | null;
  status?: SprintStatus;
};

export type CompleteSprintPayload = Omit<components['schemas']['CompleteSprintDto'], 'transferSprintId'> & {
  transferSprintId?: number | null;
};

export type SprintBurndownPoint = components['schemas']['SprintBurndownPointDto'] & {
  idealRemainingHours?: number;
  actualRemainingHours?: number | null;
  scopeHours?: number;
};

export type SprintBurndownResponse = Omit<components['schemas']['SprintBurndownResponseDto'], 'points'> & {
  totalCapacityHours?: number;
  points: SprintBurndownPoint[];
};

export type CfdDataPoint = components['schemas']['CfdDataPointDto'];
export type CycleTimeItem = components['schemas']['CycleTimeItemDto'];
export type CycleTimeSummary = components['schemas']['CycleTimeSummaryDto'];
export type SprintVelocityItem = components['schemas']['SprintVelocityItemDto'];
export type SprintFlowMetricsResponse = components['schemas']['SprintFlowMetricsResponseDto'];

