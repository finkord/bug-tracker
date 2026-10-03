import { SetMetadata } from '@nestjs/common';
import { ProjectPermission } from '../entities/permission-grant.entity.js';

export const REQUIRE_PROJECT_PERMISSION_KEY = 'require_project_permission';

export const RequireProjectPermission = (...permissions: ProjectPermission[]) =>
  SetMetadata(
    REQUIRE_PROJECT_PERMISSION_KEY,
    permissions.length === 1 ? permissions[0] : permissions,
  );
