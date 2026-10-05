import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEnum, IsInt } from 'class-validator';
import { ProjectVersionStatus } from '../entities/project-version.entity.js';

export class CreateProjectVersionDto {
  @ApiProperty({ example: 'v1.0.0' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Initial production milestone' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '2026-09-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-10-01' })
  @IsOptional()
  @IsString()
  releaseDate?: string;
}

export class UpdateProjectVersionDto {
  @ApiPropertyOptional({ example: 'v1.0.0' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated milestone description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ProjectVersionStatus })
  @IsOptional()
  @IsEnum(ProjectVersionStatus)
  status?: ProjectVersionStatus;

  @ApiPropertyOptional({ example: '2026-09-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-10-01' })
  @IsOptional()
  @IsString()
  releaseDate?: string;
}

export class ReleaseVersionDto {
  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  moveUnresolvedIssuesToVersionId?: number;

  @ApiPropertyOptional({ example: '2026-10-01' })
  @IsOptional()
  @IsString()
  releaseDate?: string;
}
