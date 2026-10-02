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

export interface CreateProjectPayload {
  name: string;
  key: string;
  description?: string;
  avatarUrl?: string | null;
  wipLimits?: Record<string, number> | null;
}

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

export interface CreateQuickFilterPayload {
  name: string;
  jqlQuery: string;
  description?: string;
  position?: number;
}

export interface UpdateQuickFilterPayload {
  name?: string;
  jqlQuery?: string;
  description?: string;
  position?: number;
}

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

export interface CreateComponentPayload {
  name: string;
  description?: string;
  leadId?: number;
}

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
}

export interface ReleaseNotesResponse {
  version: string;
  releaseNotes: string;
}
