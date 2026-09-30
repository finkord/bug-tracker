import { authApi } from './modules/auth.api.js';
import { usersApi } from './modules/users.api.js';
import { projectsApi } from './modules/projects.api.js';
import { issuesApi } from './modules/issues.api.js';
import { worklogsApi } from './modules/worklogs.api.js';
import { rbacApi } from './modules/rbac.api.js';
import { sprintsApi } from './modules/sprints.api.js';
import { teamsApi } from './modules/teams.api.js';
import { systemApi } from './modules/system.api.js';

export * from './types/index.js';
export * from './http.js';
export * from './modules/index.js';

/**
 * Unified API facade aggregating all domain clients for convenient centralized access.
 */
export const api = {
  ...authApi,
  ...usersApi,
  ...projectsApi,
  ...issuesApi,
  ...worklogsApi,
  ...rbacApi,
  ...sprintsApi,
  ...teamsApi,
  ...systemApi,
};
