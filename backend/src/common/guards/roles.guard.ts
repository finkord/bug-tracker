import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import { SystemRole, User } from '../../modules/users/entities/user.entity.js';
import { UserGroup } from '../../modules/rbac/entities/user-group.entity.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<SystemRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<{ user?: User }>();
    if (!user) {
      throw new ForbiddenException('User authentication required for this operation');
    }

    if (user.systemRole && requiredRoles.includes(user.systemRole)) {
      return true;
    }

    // Check directory group membership for administrator privileges
    if (requiredRoles.includes(SystemRole.ADMIN)) {
      try {
        const isAdmin = await this.dataSource.getRepository(UserGroup)
          .createQueryBuilder('ug')
          .innerJoin('ug.group', 'g')
          .where('ug.userId = :userId', { userId: user.id })
          .andWhere('LOWER(g.name) IN (:...names)', { names: ['administrators', 'admin', 'admins'] })
          .getExists();

        if (isAdmin) {
          return true;
        }
      } catch {
        // Fallback
      }
    }

    throw new ForbiddenException(
      `Insufficient privileges: required role [${requiredRoles.join(', ')}]`,
    );
  }
}
