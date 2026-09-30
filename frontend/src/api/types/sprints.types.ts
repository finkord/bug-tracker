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
