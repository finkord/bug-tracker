import { IsNotEmpty, IsString, IsEnum, IsOptional, IsInt, MaxLength, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IssueType, IssuePriority } from '../entities/issue.entity.js';

export class CreateIssueDto {
  @ApiProperty({ example: 1, description: 'Target project ID' })
  @IsInt()
  projectId: number;

  @ApiProperty({ example: 'Memory leak during heavy payload ingestion', description: 'Brief issue title' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ example: 'Steps to reproduce: ...', description: 'Detailed technical description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: IssueType, default: IssueType.BUG })
  @IsOptional()
  @IsEnum(IssueType)
  issueType?: IssueType;

  @ApiPropertyOptional({ enum: IssuePriority, default: IssuePriority.MEDIUM })
  @IsOptional()
  @IsEnum(IssuePriority)
  priority?: IssuePriority;

  @ApiPropertyOptional({ example: 4.5, description: 'Estimated hours for task completion' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedHours?: number;

  @ApiPropertyOptional({ example: 1, description: 'Sprint ID or null for Backlog' })
  @IsOptional()
  @IsInt()
  sprintId?: number | null;

  @ApiPropertyOptional({ example: 2, description: 'Assigned user ID or null' })
  @IsOptional()
  @IsInt()
  assigneeId?: number | null;

  @ApiPropertyOptional({ example: 42, description: 'Parent issue ID for subtasks' })
  @IsOptional()
  @IsInt()
  parentId?: number | null;

  @ApiPropertyOptional({ example: 1, description: 'Component ID or null' })
  @IsOptional()
  @IsInt()
  componentId?: number | null;

  @ApiPropertyOptional({ example: 10, description: 'Fix Version ID or null' })
  @IsOptional()
  @IsInt()
  fixVersionId?: number | null;

  @ApiPropertyOptional({ example: 9, description: 'Affects Version ID or null' })
  @IsOptional()
  @IsInt()
  affectsVersionId?: number | null;

  @ApiPropertyOptional({ example: ['frontend', 'auth'], description: 'List of label tags' })
  @IsOptional()
  @IsString({ each: true })
  labels?: string[];
}
