import { IsNotEmpty, IsString, IsEnum, IsOptional, IsInt, MaxLength, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IssueType, IssuePriority, IssueSeverity } from '../entities/issue.entity.js';

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

  @ApiPropertyOptional({ enum: IssueSeverity, default: IssueSeverity.MAJOR })
  @IsOptional()
  @IsEnum(IssueSeverity)
  severity?: IssueSeverity;

  @ApiPropertyOptional({ example: 4.5, description: 'Estimated hours for task completion' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedHours?: number;

  @ApiPropertyOptional({ example: 'Sprint 1', description: 'Sprint designation or null for Backlog' })
  @IsOptional()
  @IsString()
  sprint?: string;

  @ApiPropertyOptional({ example: 2, description: 'Assigned user ID' })
  @IsOptional()
  @IsInt()
  assigneeId?: number;
}
