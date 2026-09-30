import { IsNotEmpty, IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSavedFilterDto {
  @ApiProperty({ description: 'Filter name', example: 'Open Critical Bugs' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ description: 'JQL search criteria', example: 'status = "OPEN" AND priority = "CRITICAL"' })
  @IsNotEmpty()
  @IsString()
  criteria!: string;

  @ApiPropertyOptional({ description: 'Filter description', example: 'High priority tickets requiring triage' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({ description: 'Whether the filter is pinned or favorited', default: false })
  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;
}

export class UpdateSavedFilterDto {
  @ApiPropertyOptional({ description: 'Filter name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'JQL search criteria' })
  @IsOptional()
  @IsString()
  criteria?: string;

  @ApiPropertyOptional({ description: 'Filter description' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({ description: 'Whether the filter is pinned or favorited' })
  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;
}
