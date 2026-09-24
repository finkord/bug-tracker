import { IsNotEmpty, IsNumber, Min, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LogWorkDto {
  @ApiProperty({ example: 2.5, description: 'Number of hours spent working on the issue' })
  @IsNumber()
  @Min(0.01, { message: 'Logged work must be at least 0.01 hours (approx 1 minute)' })
  timeSpentHours: number;

  @ApiPropertyOptional({ example: '2026-09-24', description: 'Date of logged work (defaults to current date)' })
  @IsOptional()
  @IsString()
  dateLogged?: string;

  @ApiPropertyOptional({ example: 'Implemented JWT token rotation and tested unit test cases', description: 'Work description' })
  @IsOptional()
  @IsString()
  description?: string;
}
