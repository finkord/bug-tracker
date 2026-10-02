import { IsArray, ArrayNotEmpty, IsInt, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IssueStatus, IssuePriority } from '../entities/issue.entity.js';

export class BulkUpdateIssuesDto {
  @ApiProperty({ example: [101, 102, 103], description: 'List of issue IDs to update' })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  issueIds: number[];

  @ApiPropertyOptional({ enum: IssueStatus, description: 'New workflow status to apply' })
  @IsOptional()
  @IsEnum(IssueStatus)
  status?: IssueStatus;

  @ApiPropertyOptional({ enum: IssuePriority, description: 'New priority level to apply' })
  @IsOptional()
  @IsEnum(IssuePriority)
  priority?: IssuePriority;

  @ApiPropertyOptional({ example: 5, description: 'Assigned user ID, or null to unassign' })
  @IsOptional()
  @IsInt()
  assigneeId?: number | null;

  @ApiPropertyOptional({ example: 2, description: 'Sprint ID, or null for Backlog' })
  @IsOptional()
  @IsInt()
  sprintId?: number | null;
}

export class BulkDeleteIssuesDto {
  @ApiProperty({ example: [101, 102, 103], description: 'List of issue IDs to delete' })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  issueIds: number[];
}

export interface BulkOperationResultDto {
  success: boolean;
  affectedCount: number;
  message: string;
}
