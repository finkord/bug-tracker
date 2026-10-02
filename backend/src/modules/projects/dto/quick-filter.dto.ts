import { IsNotEmpty, IsString, MaxLength, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateQuickFilterDto {
  @ApiProperty({ example: 'Critical Bugs', description: 'Display name for the quick filter button' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name: string;

  @ApiProperty({
    example: 'type = "BUG" AND priority = "CRITICAL"',
    description: 'JQL query string applied to board issues',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  jqlQuery: string;

  @ApiPropertyOptional({ example: 'High-severity customer-facing defects requiring immediate resolution' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: 0, description: 'Display ordering priority on board toolbar' })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}

export class UpdateQuickFilterDto {
  @ApiPropertyOptional({ example: 'Urgent Defects', description: 'Updated display name' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional({ example: 'type = "BUG" AND priority IN ("CRITICAL", "HIGH")' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  jqlQuery?: string;

  @ApiPropertyOptional({ example: 'Updated filter description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
