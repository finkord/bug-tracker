import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class Verify2faDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Temporary 2FA challenge token returned from initial login step',
  })
  @IsString()
  @IsNotEmpty({ message: 'Temporary token is required' })
  tempToken: string;

  @ApiProperty({
    example: '123456',
    description: '6-digit time-based one-time passcode from authenticator app (SDSecurity Task 5)',
  })
  @IsString()
  @Matches(/^\d{6}$/, { message: '2FA code must be exactly 6 digits' })
  code: string;
}

export class Enable2faDto {
  @ApiProperty({
    example: '123456',
    description: '6-digit confirmation code from authenticator app to enable 2FA',
  })
  @IsString()
  @Matches(/^\d{6}$/, { message: '2FA code must be exactly 6 digits' })
  code: string;
}
