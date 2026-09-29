export type SprintStatus = 'ACTIVE' | 'PLANNED' | 'COMPLETED';

export interface SprintItem {
  id: number;
  projectId: number;
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
}

export interface UpdateSprintPayload {
  name?: string;
  goal?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: SprintStatus;
}

export interface CompleteSprintPayload {
  transferSprintId?: number | null;
}
