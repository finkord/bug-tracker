import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CfdDataPointDto {
  @ApiProperty({ example: '2026-09-01' })
  date: string;

  @ApiProperty({ example: 'Day 1' })
  dayLabel: string;

  @ApiProperty({ example: 10 })
  open: number;

  @ApiProperty({ example: 4 })
  inProgress: number;

  @ApiProperty({ example: 2 })
  review: number;

  @ApiProperty({ example: 3 })
  resolved: number;

  @ApiProperty({ example: 1 })
  closed: number;

  @ApiProperty({ example: 20 })
  total: number;
}

export class CycleTimeItemDto {
  @ApiProperty({ example: 101 })
  issueId: number;

  @ApiProperty({ example: 'BT-42' })
  key: string;

  @ApiProperty({ example: 'Add Redis cache layer' })
  title: string;

  @ApiProperty({ example: 'TASK' })
  issueType: string;

  @ApiProperty({ example: 'HIGH' })
  priority: string;

  @ApiProperty({ example: 2.5 })
  cycleTimeDays: number;

  @ApiProperty({ example: 4.1 })
  leadTimeDays: number;

  @ApiPropertyOptional({ example: '2026-09-05T14:30:00.000Z' })
  completedAt: string | null;
}

export class CycleTimeSummaryDto {
  @ApiProperty({ example: 2.8 })
  averageCycleTimeDays: number;

  @ApiProperty({ example: 2.2 })
  p50CycleTimeDays: number;

  @ApiProperty({ example: 4.5 })
  p85CycleTimeDays: number;

  @ApiProperty({ example: 6.0 })
  p95CycleTimeDays: number;

  @ApiProperty({ example: 4.9 })
  averageLeadTimeDays: number;

  @ApiProperty({ type: () => [CycleTimeItemDto] })
  items: CycleTimeItemDto[];
}

export class SprintVelocityItemDto {
  @ApiProperty({ example: 1 })
  sprintId: number;

  @ApiProperty({ example: 'Sprint 1' })
  sprintName: string;

  @ApiProperty({ example: 'COMPLETED' })
  status: string;

  @ApiProperty({ example: 80 })
  committedHours: number;

  @ApiProperty({ example: 74 })
  completedHours: number;

  @ApiProperty({ example: 14 })
  completedIssues: number;

  @ApiProperty({ example: 16 })
  totalIssues: number;
}

export class SprintFlowMetricsResponseDto {
  @ApiProperty({ example: 1 })
  sprintId: number;

  @ApiProperty({ example: 'Sprint 1' })
  sprintName: string;

  @ApiProperty({ type: () => [CfdDataPointDto] })
  cfd: CfdDataPointDto[];

  @ApiProperty({ type: () => CycleTimeSummaryDto })
  cycleTime: CycleTimeSummaryDto;

  @ApiProperty({ type: () => [SprintVelocityItemDto] })
  velocity: SprintVelocityItemDto[];
}
