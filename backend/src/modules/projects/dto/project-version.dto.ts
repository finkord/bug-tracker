import { IsNotEmpty, IsString, IsOptional, IsEnum, IsInt } from 'class-validator';
import { ProjectVersionStatus } from '../entities/project-version.entity.js';

export class CreateProjectVersionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  releaseDate?: string;
}

export class UpdateProjectVersionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ProjectVersionStatus)
  status?: ProjectVersionStatus;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  releaseDate?: string;
}

export class ReleaseVersionDto {
  @IsOptional()
  @IsInt()
  moveUnresolvedIssuesToVersionId?: number;
}
