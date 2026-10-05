import type { components } from './api.generated.js';
import type { UserProfile } from './auth.types.js';
import type { ProjectItem } from './projects.types.js';

export type TeamMemberRole = components['schemas']['AddTeamMemberDto']['role'];

export interface TeamMemberItem {
  id: number;
  teamId: number;
  userId: number;
  user: UserProfile;
  role: TeamMemberRole;
  weeklyCapacityHours: number;
  createdAt: string;
}

export interface TeamItem {
  id: number;
  name: string;
  description: string | null;
  projectId: number;
  project?: ProjectItem;
  leadId: number | null;
  lead?: UserProfile | null;
  avatarUrl?: string | null;
  sprintCapacityHours: number;
  members: TeamMemberItem[];
  createdAt: string;
  updatedAt: string;
}

export type CreateTeamPayload = components['schemas']['CreateTeamDto'];

export type UpdateTeamPayload = Omit<components['schemas']['UpdateTeamDto'], 'leadId' | 'avatarUrl'> & {
  leadId?: number | null;
  avatarUrl?: string | null;
};

export type AddTeamMemberPayload = components['schemas']['AddTeamMemberDto'];

export type UpdateTeamMemberPayload = components['schemas']['UpdateTeamMemberDto'];

export interface TeamCapacityMemberBreakdown {
  id: number;
  userId: number;
  fullName: string;
  role: string;
  weeklyCapacityHours: number;
  sprintCapacityHours: number;
}

export interface TeamCapacityReport {
  teamId: number;
  teamName: string;
  sprintWeeks: number;
  totalCapacityHours: number;
  members: TeamCapacityMemberBreakdown[];
}
