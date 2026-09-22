import { SetMetadata } from '@nestjs/common';
import { SystemRole } from '../../modules/users/entities/user.entity.js';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: SystemRole[]) => SetMetadata(ROLES_KEY, roles);
