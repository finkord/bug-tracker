import { IsNotEmpty, IsEnum, IsDefined } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IssueLinkType } from '../entities/issue-link.entity.js';

export class CreateIssueLinkDto {
  @ApiProperty({
    description: 'Target issue numeric ID or Issue Key (e.g., "PROJ-6" or 12)',
    example: 'PROJ-6',
  })
  @IsNotEmpty()
  @IsDefined()
  targetIssueKeyOrId: string | number;

  @ApiProperty({
    description: 'Semantic dependency relationship type',
    enum: IssueLinkType,
    example: IssueLinkType.BLOCKS,
  })
  @IsEnum(IssueLinkType)
  linkType: IssueLinkType;
}
