import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsEnum } from 'class-validator';
import { IssueStatus } from '../entities/issue.entity.js';

export class ReorderIssueDto {
  @ApiProperty({
    example: 1000.5,
    description: 'New numeric order rank for board column or backlog positioning',
  })
  @IsNumber()
  order: number;

  @ApiPropertyOptional({
    enum: IssueStatus,
    description: 'Optional target status if card moved across board columns',
  })
  @IsOptional()
  @IsEnum(IssueStatus)
  status?: IssueStatus;
}
