import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ValidateJqlDto {
  @ApiProperty({
    description: 'JQL query string to validate',
    example: 'status = "OPEN" AND priority = "HIGH" ORDER BY createdAt DESC',
  })
  @IsString()
  jql: string;
}

export class JqlOrderByDto {
  @ApiProperty({ example: 'createdAt' })
  field: string;

  @ApiProperty({ example: 'DESC', enum: ['ASC', 'DESC'] })
  direction: 'ASC' | 'DESC';
}

export class JqlValidationResponseDto {
  @ApiProperty({ example: true })
  isValid: boolean;

  @ApiPropertyOptional({ example: 'Invalid JQL clause: "status === UNKNOWN"' })
  errorMessage?: string;

  @ApiProperty({ example: 2 })
  conditionsCount: number;

  @ApiPropertyOptional({ type: () => JqlOrderByDto })
  orderBy?: JqlOrderByDto;
}
