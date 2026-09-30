import { IsOptional, IsEnum, IsInt, IsString, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IssueStatus, IssuePriority, IssueType } from '../entities/issue.entity.js';

export class ListIssuesQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'Filter by project ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  projectId?: number;

  @ApiPropertyOptional({ enum: IssueStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(IssueStatus)
  status?: IssueStatus;

  @ApiPropertyOptional({ enum: IssuePriority, description: 'Filter by priority' })
  @IsOptional()
  @IsEnum(IssuePriority)
  priority?: IssuePriority;

  @ApiPropertyOptional({ enum: IssueType, description: 'Filter by type' })
  @IsOptional()
  @IsEnum(IssueType)
  issueType?: IssueType;

  @ApiPropertyOptional({ example: 2, description: 'Filter by assignee user ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  assigneeId?: number;

  @ApiPropertyOptional({ example: '1', description: 'Filter by sprint ID or BACKLOG' })
  @IsOptional()
  @IsString()
  sprintId?: string;

  @ApiPropertyOptional({ example: 'memory', description: 'Search term across title and description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'status = "OPEN" AND priority = "CRITICAL"', description: 'JQL search expression' })
  @IsOptional()
  @IsString()
  jql?: string;

  @ApiPropertyOptional({ example: 1, default: 1, description: 'Page number (1-based)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 25, default: 50, description: 'Items per page (max 100)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @ApiPropertyOptional({ example: 'createdAt', description: 'Sort field (createdAt, updatedAt, priority, key, title)' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], description: 'Sort direction' })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';
}
