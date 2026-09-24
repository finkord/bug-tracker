import { IsOptional, IsEnum, IsInt, IsString } from 'class-validator';
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

  @ApiPropertyOptional({ example: 'Sprint 1', description: 'Filter by sprint name or BACKLOG' })
  @IsOptional()
  @IsString()
  sprint?: string;

  @ApiPropertyOptional({ example: 'memory', description: 'Search term across title and description' })
  @IsOptional()
  @IsString()
  search?: string;
}
