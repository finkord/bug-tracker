export interface ProjectWebhookItem {
  id: number;
  projectId: number;
  name: string;
  url: string;
  secret?: string;
  maskedSecret?: string;
  events: string[];
  isActive: boolean;
  lastTriggeredAt: string | null;
  failureCount: number;
  lastFailureReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWebhookPayload {
  name: string;
  url: string;
  secret?: string;
  events?: string[];
  isActive?: boolean;
}

export interface UpdateWebhookPayload {
  name?: string;
  url?: string;
  secret?: string;
  events?: string[];
  isActive?: boolean;
}

export interface TestWebhookResult {
  success: boolean;
  statusCode?: number;
  responseTimeMs: number;
  message: string;
}
