import { ApiProperty } from '@nestjs/swagger';

export class PriorityBreakdownDto {
  @ApiProperty({ example: 2 })
  critical: number;

  @ApiProperty({ example: 5 })
  high: number;

  @ApiProperty({ example: 8 })
  medium: number;

  @ApiProperty({ example: 3 })
  low: number;
}

export class ProjectSummaryDto {
  @ApiProperty({ example: 1 })
  projectId: number;

  @ApiProperty({ example: 'CORE' })
  projectKey: string;

  @ApiProperty({ example: 'Core Platform Engine' })
  projectName: string;

  @ApiProperty({ example: 18 })
  totalIssues: number;

  @ApiProperty({ example: 8 })
  resolvedIssues: number;

  @ApiProperty({ example: 4 })
  inProgressIssues: number;

  @ApiProperty({ example: 6 })
  openIssues: number;

  @ApiProperty({ example: 44 })
  completionPercent: number;

  @ApiProperty({ example: 120.0 })
  totalEstimatedHours: number;

  @ApiProperty({ example: 45.5 })
  totalLoggedHours: number;

  @ApiProperty({ type: PriorityBreakdownDto })
  priorityBreakdown: PriorityBreakdownDto;
}
