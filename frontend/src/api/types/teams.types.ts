import type { UserProfile } from './auth.types.js';
import type { ProjectItem } from './projects.types.js';

export type TeamMemberRole =
  | 'SCRUM_MASTER'
  | 'PRODUCT_OWNER'
  | 'DEVELOPER'
  | 'QA_ENGINEER'
  | 'DESIGNER';

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

export interface CreateTeamPayload {
  name: string;
  description?: string;
  projectId: number;
  leadId?: number;
  avatarUrl?: string;
  sprintCapacityHours?: number;
}

export interface UpdateTeamPayload {
  name?: string;
  description?: string;
  projectId?: number;
  leadId?: number | null;
  avatarUrl?: string | null;
  sprintCapacityHours?: number;
}

export interface AddTeamMemberPayload {
  userId: number;
  role: TeamMemberRole;
  weeklyCapacityHours?: number;
}

export interface UpdateTeamMemberPayload {
  role?: TeamMemberRole;
  weeklyCapacityHours?: number;
}

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
