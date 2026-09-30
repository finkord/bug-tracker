import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TeamMemberRole } from '../entities/team-member.entity.js';

export class CreateTeamDto {
  @ApiProperty({ description: 'Name of the Scrum Team', example: 'Core Platform Alpha' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Purpose or domain of this team', example: 'Responsible for backend infrastructure' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Project / Board ID to which this team is bound', example: 1 })
  @IsNumber()
  projectId: number;

  @ApiPropertyOptional({ description: 'User ID of the Team Lead / Scrum Master', example: 2 })
  @IsOptional()
  @IsNumber()
  leadId?: number;

  @ApiPropertyOptional({ description: 'Default team sprint capacity in hours', example: 160.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000)
  sprintCapacityHours?: number;
}

export class UpdateTeamDto {
  @ApiPropertyOptional({ description: 'Name of the Scrum Team', example: 'Core Platform Alpha' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'Purpose or domain of this team' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Project ID to which this team is bound' })
  @IsOptional()
  @IsNumber()
  projectId?: number;

  @ApiPropertyOptional({ description: 'User ID of the Team Lead / Scrum Master' })
  @IsOptional()
  @IsNumber()
  leadId?: number;

  @ApiPropertyOptional({ description: 'Default team sprint capacity in hours' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000)
  sprintCapacityHours?: number;
}

export class AddTeamMemberDto {
  @ApiProperty({ description: 'User ID to add to the team', example: 5 })
  @IsNumber()
  userId: number;

  @ApiProperty({
    description: 'Scrum role inside the team',
    enum: TeamMemberRole,
    example: TeamMemberRole.DEVELOPER,
  })
  @IsEnum(TeamMemberRole)
  role: TeamMemberRole;

  @ApiPropertyOptional({ description: 'Weekly engineering capacity in hours', example: 40.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(168)
  weeklyCapacityHours?: number;
}

export class UpdateTeamMemberDto {
  @ApiPropertyOptional({
    description: 'Scrum role inside the team',
    enum: TeamMemberRole,
    example: TeamMemberRole.SCRUM_MASTER,
  })
  @IsOptional()
  @IsEnum(TeamMemberRole)
  role?: TeamMemberRole;

  @ApiPropertyOptional({ description: 'Weekly engineering capacity in hours', example: 35.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(168)
  weeklyCapacityHours?: number;
}
