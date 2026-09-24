import { IsNotEmpty, IsString, MaxLength, MinLength, Matches, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ example: 'Core Platform Engine', description: 'Project full name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiProperty({ example: 'CORE', description: 'Unique uppercase mnemonic key (2-10 characters)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(10)
  @Matches(/^[A-Z0-9]+$/, { message: 'Project key must contain only uppercase letters and numbers' })
  key: string;

  @ApiPropertyOptional({ example: 'High-throughput backend processing engine and REST/gRPC microservices.' })
  @IsOptional()
  @IsString()
  description?: string;
}
