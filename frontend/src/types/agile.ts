export type SprintStatus = 'ACTIVE' | 'PLANNED' | 'COMPLETED';
export type AgileViewMode = 'backlog' | 'board';

export interface SprintDefinition {
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
}

export const DEFAULT_AGILE_FILTERS: AgileFilterState = {
  searchTerm: '',
  filterType: 'ALL',
  filterPriority: 'ALL',
  onlyMine: false,
  unassignedOnly: false,
  highPriorityOnly: false,
};
