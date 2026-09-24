import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IssueStatus } from '../entities/issue.entity.js';

export class UpdateIssueStatusDto {
  @ApiProperty({ enum: IssueStatus, description: 'Target FSM status' })
  @IsEnum(IssueStatus)
  @IsNotEmpty()
  status: IssueStatus;
}
