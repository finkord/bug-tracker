import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class IssueHistoryUserDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Jane Lead' })
  fullName: string;

  @ApiProperty({ example: 'jane@example.com' })
  email: string;

  @ApiPropertyOptional({ example: null })
  avatarUrl?: string | null;
}

export class IssueHistoryItemDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 42 })
  issueId: number;

  @ApiProperty({ example: 'status', description: 'Name of the modified field' })
  field: string;

  @ApiPropertyOptional({ example: 'OPEN', description: 'Previous value before modification' })
  oldValue: string | null;

  @ApiPropertyOptional({ example: 'IN_PROGRESS', description: 'New value after modification' })
  newValue: string | null;

  @ApiPropertyOptional({ type: () => IssueHistoryUserDto })
  user: IssueHistoryUserDto | null;

  @ApiProperty()
  createdAt: Date;
}
