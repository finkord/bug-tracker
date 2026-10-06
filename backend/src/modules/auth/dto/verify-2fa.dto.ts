import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class Verify2faDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Temporary 2FA challenge token returned from initial login step',
    required: false,
  })
  @IsString()
  @IsOptional()
  tempToken?: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Alias for tempToken (legacy / mobile client compatibility)',
    required: false,
  })
  @IsString()
  @IsOptional()
  challengeToken?: string;

  @ApiProperty({
    example: '123456',
    description: '6-digit time-based one-time passcode from authenticator app',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Matches(/^\d{6}$/, { message: '2FA code must be exactly 6 digits' })
  code?: string;

  @ApiProperty({
    example: '123456',
    description: 'Alias for code (legacy / mobile client compatibility)',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Matches(/^\d{6}$/, { message: '2FA code must be exactly 6 digits' })
  totpCode?: string;
}

export class Enable2faDto {
  @ApiProperty({
    example: '123456',
    description: '6-digit confirmation code from authenticator app to enable 2FA',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Matches(/^\d{6}$/, { message: '2FA code must be exactly 6 digits' })
  code?: string;

  @ApiProperty({
    example: '123456',
    description: 'Alias for code for legacy clients',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Matches(/^\d{6}$/, { message: '2FA code must be exactly 6 digits' })
  totpCode?: string;

  @ApiProperty({
    example: 'JBSWY3DPEHPK3PXP',
    description: 'TOTP base32 secret if provided during activation',
    required: false,
  })
  @IsString()
  @IsOptional()
  secret?: string;
}
