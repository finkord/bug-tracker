import { IsNotEmpty, IsString, MaxLength, IsOptional, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateComponentDto {
  @ApiProperty({ description: 'Component name', example: 'API Gateway' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Optional description of the component' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Optional lead user ID for this component', example: 1 })
  @IsOptional()
  @IsInt()
  leadId?: number;
}

export class UpdateComponentDto {
  @ApiPropertyOptional({ description: 'Updated component name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Updated lead user ID', type: Number, nullable: true })
  @IsOptional()
  @IsInt()
  leadId?: number | null;
}

export class ComponentResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'API Gateway' })
  name: string;

  @ApiPropertyOptional({ example: 'Handles routing and authentication' })
  description: string | null;

  @ApiProperty({ example: 42 })
  projectId: number;

  @ApiPropertyOptional({ example: 1 })
  leadId: number | null;

  @ApiPropertyOptional()
  lead?: {
    id: number;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
  } | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
