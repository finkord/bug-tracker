import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SprintBurndownPointDto {
  @ApiProperty({ example: '2026-01-01' })
  date: string;

  @ApiProperty({ example: 'Day 1' })
  dayLabel: string;

  @ApiProperty({ example: 40 })
  idealHours: number;

  @ApiPropertyOptional({ type: Number, nullable: true, example: 38 })
  remainingHours: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true, example: 2 })
  completedHours: number | null;

  @ApiProperty({ example: 40 })
  totalScopeHours: number;

  @ApiProperty({ example: true })
  isRecordedSnapshot: boolean;
}

export class SprintBurndownResponseDto {
  @ApiProperty({ example: 5 })
  sprintId: number;

  @ApiProperty({ example: 'Sprint 1 - Core Architecture' })
  sprintName: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: '2026-01-01' })
  startDate: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: '2026-01-14' })
  endDate: string | null;

  @ApiProperty({ example: 40 })
  totalScopeHours: number;

  @ApiProperty({ example: 12 })
  remainingHours: number;

  @ApiProperty({ example: 28 })
  completedHours: number;

  @ApiProperty({ type: () => [SprintBurndownPointDto] })
  points: SprintBurndownPointDto[];
}
