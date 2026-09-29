import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import { SystemRole, User } from '../../modules/users/entities/user.entity.js';
import { UsersService } from '../../modules/users/users.service.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
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

    // Check directory group membership for administrator privileges via clean service encapsulation
    if (requiredRoles.includes(SystemRole.ADMIN)) {
      const isAdmin = await this.usersService.isMemberOfAdminGroup(user.id);
      if (isAdmin) {
        return true;
      }
    }

    throw new ForbiddenException(
      `Insufficient privileges: required role [${requiredRoles.join(', ')}]`,
    );
  }
}

