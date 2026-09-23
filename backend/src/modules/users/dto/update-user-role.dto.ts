import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SystemRole } from '../entities/user.entity.js';

export class UpdateUserRoleDto {
  @ApiProperty({
    enum: SystemRole,
    description: 'Target system-wide role for user access control (PPofSE Tier 1 RBAC)',
    example: SystemRole.ADMIN,
  })
  @IsEnum(SystemRole, { message: 'Role must be either ADMIN or USER' })
  role: SystemRole;
}
