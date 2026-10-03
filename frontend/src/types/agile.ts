export type SprintStatus = 'ACTIVE' | 'PLANNED' | 'COMPLETED';
export type AgileViewMode = 'backlog' | 'board';

export interface SprintDefinition {
  id?: number;
  projectId?: number;
  teamId?: number;
  team?: {
    id: number;
    name: string;
    sprintCapacityHours: number;
  };
  capacityHours?: number;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: SprintStatus;
}

export interface AgileFilterState {
  searchTerm: string;
  filterType: string;
  filterPriority: string;
  onlyMine: boolean;
  unassignedOnly: boolean;
  highPriorityOnly: boolean;
  teamId?: number | 'ALL';
  epicId?: number | 'ALL' | 'NONE';
  versionId?: number | 'ALL' | 'NONE';
}

export const DEFAULT_AGILE_FILTERS: AgileFilterState = {
  searchTerm: '',
  filterType: 'ALL',
  filterPriority: 'ALL',
  onlyMine: false,
  unassignedOnly: false,
  highPriorityOnly: false,
  teamId: 'ALL',
  epicId: 'ALL',
  versionId: 'ALL',
};
