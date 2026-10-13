import { IsOptional, IsEnum, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LoginAttemptStatus } from '../entities/login-audit-log.entity.js';

export class FindLoginLogsQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 50, minimum: 1, description: 'Items per page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 50;

  @ApiPropertyOptional({ description: 'Search term for email, IP address, or failure reason' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: LoginAttemptStatus, description: 'Filter by login attempt status' })
  @IsOptional()
  @IsEnum(LoginAttemptStatus)
  status?: LoginAttemptStatus;
}
