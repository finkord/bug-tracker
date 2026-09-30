import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { SprintStatus } from '../entities/sprint.entity.js';

export class CreateSprintDto {
  @ApiProperty({
    example: 'Sprint 1',
    description: 'Name of the sprint',
  })
  @IsString()
  @IsNotEmpty({ message: 'Sprint name is required' })
  @MaxLength(150, { message: 'Sprint name cannot exceed 150 characters' })
  name: string;

  @ApiPropertyOptional({
    example: 'Core architecture and auth deliverables',
    description: 'Goal of the sprint',
  })
  @IsOptional()
  @IsString()
  goal?: string;

  @ApiPropertyOptional({
    example: '2026-09-28',
    description: 'Sprint start date (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-10-12',
    description: 'Sprint end date (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({
    enum: SprintStatus,
    default: SprintStatus.PLANNED,
    description: 'Initial sprint lifecycle status',
  })
  @IsOptional()
  @IsEnum(SprintStatus)
  status?: SprintStatus;

  @ApiPropertyOptional({
    example: 1,
    description: 'Associated Scrum team ID',
  })
  @IsOptional()
  teamId?: number | null;

  @ApiPropertyOptional({
    example: 80,
    description: 'Sprint capacity in hours',
  })
  @IsOptional()
  capacityHours?: number | null;
}
