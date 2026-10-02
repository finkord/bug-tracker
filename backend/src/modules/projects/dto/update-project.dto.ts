import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber } from 'class-validator';
import { CreateProjectDto } from './create-project.dto.js';

export class UpdateProjectDto extends PartialType(CreateProjectDto) {
  @ApiPropertyOptional({ example: 1, description: 'User ID of project lead' })
  @IsOptional()
  @IsNumber()
  leadId?: number;
}
