import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateSprintDto } from './create-sprint.dto.js';
import { IsOptional, IsNumber } from 'class-validator';

export class UpdateSprintDto extends PartialType(CreateSprintDto) {}

export class CompleteSprintDto {
  @ApiPropertyOptional({
    example: 2,
    description: 'Target sprint ID to transfer incomplete issues to (null for Backlog)',
  })
  @IsOptional()
  @IsNumber()
  transferSprintId?: number | null;
}
