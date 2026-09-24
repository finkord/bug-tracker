import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SystemRole } from '../entities/user.entity.js';

export class UpdateUserRoleDto {
  @ApiProperty({
    enum: SystemRole,
    description: 'Target system-wide role for user access control',
    example: SystemRole.DEVELOPER,
  })
  @IsEnum(SystemRole, { message: 'Role must be one of: ADMIN, PROJECT_MANAGER, DEVELOPER, QA_ENGINEER, DEVOPS_ENGINEER, SECURITY_ENGINEER, USER' })
  role: SystemRole;

  @ApiPropertyOptional({
    description: 'Coworker job title or work role label',
    example: 'DevOps Engineer',
  })
  @IsOptional()
  @IsString()
  jobTitle?: string;
}
