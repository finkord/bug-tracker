import type { components } from './api.generated.js';

export interface ProjectItem {
  id: number;
  name: string;
  key: string;
  description: string | null;
  avatarUrl?: string | null;
  leadId: number;
  lead: {
    id: number;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
  } | null;
  totalIssues: number;
  openIssues: number;
  permissionSchemeId?: number | null;
  securitySchemeId?: number | null;
  wipLimits?: Record<string, number> | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateProjectPayload = Omit<components['schemas']['CreateProjectDto'], 'wipLimits' | 'avatarUrl'> & {
  wipLimits?: Record<string, number> | null;
  avatarUrl?: string | null;
};

export type UpdateProjectPayload = Omit<components['schemas']['UpdateProjectDto'], 'wipLimits' | 'avatarUrl'> & {
  wipLimits?: Record<string, number> | null;
  avatarUrl?: string | null;
};

export interface ProjectQuickFilterItem {
  id: number;
  projectId: number;
  name: string;
  jqlQuery: string;
  description: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export type CreateQuickFilterPayload = components['schemas']['CreateQuickFilterDto'];

export type UpdateQuickFilterPayload = components['schemas']['UpdateQuickFilterDto'];

export interface ProjectComponentItem {
  id: number;
  projectId: number;
  name: string;
  description: string | null;
  leadId: number | null;
  lead?: {
    id: number;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateComponentPayload = components['schemas']['CreateComponentDto'];


export type ProjectVersionStatus = 'UNRELEASED' | 'RELEASED' | 'ARCHIVED';

export interface ProjectVersionItem {
  id: number;
  projectId: number;
  name: string;
  description: string | null;
  status: ProjectVersionStatus;
  startDate: string | null;
  releaseDate: string | null;
  totalIssues: number;
  completedIssues: number;
  progressPercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectVersionPayload {
  name: string;
  description?: string;
  startDate?: string;
  releaseDate?: string;
}

export interface UpdateProjectVersionPayload {
  name?: string;
  description?: string;
  status?: ProjectVersionStatus;
  startDate?: string;
  releaseDate?: string;
}

export interface ReleaseVersionPayload {
  moveUnresolvedIssuesToVersionId?: number;
  releaseDate?: string;
}

export interface ReleaseNotesResponse {
  version: string;
  releaseNotes: string;
}
