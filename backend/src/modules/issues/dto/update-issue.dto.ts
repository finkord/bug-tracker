import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsInt, IsOptional } from 'class-validator';
import { CreateIssueDto } from './create-issue.dto.js';

export class UpdateIssueDto extends PartialType(CreateIssueDto) {
  @ApiPropertyOptional({ example: 1, description: 'Reporter user ID' })
  @IsOptional()
  @IsInt()
  reporterId?: number;
}
