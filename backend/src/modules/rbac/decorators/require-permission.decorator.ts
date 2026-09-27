import { SetMetadata } from '@nestjs/common';
import { ProjectPermission } from '../entities/permission-grant.entity.js';

export const REQUIRE_PROJECT_PERMISSION_KEY = 'require_project_permission';

export const RequireProjectPermission = (permission: ProjectPermission) =>
  SetMetadata(REQUIRE_PROJECT_PERMISSION_KEY, permission);
