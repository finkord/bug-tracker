import { IsOptional, IsInt } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateIssueSprintDto {
  @ApiPropertyOptional({ example: 1, description: 'Target sprint ID or null for Backlog' })
  @IsOptional()
  @IsInt()
  sprintId?: number | null;
}
