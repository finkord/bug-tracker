export interface ProjectItem {
  id: number;
  name: string;
  key: string;
  description: string | null;
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
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectPayload {
  name: string;
  key: string;
  description?: string;
}
