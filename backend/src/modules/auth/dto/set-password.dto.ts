import { IsString, MinLength, Matches, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SetPasswordDto {
  @ApiPropertyOptional({
    example: 'OldP@ssw0rd123!',
    description: 'Current password. Required only if account already has an active password.',
  })
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @ApiProperty({
    example: 'NewStr0ngP@ssw0rd!',
    description:
      'New password meeting security policy: min 8 characters, uppercase, lowercase, digit, and special symbol',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/(?=.*[a-z])/, {
    message: 'Password must contain at least one lowercase letter',
  })
  @Matches(/(?=.*[A-Z])/, {
    message: 'Password must contain at least one uppercase letter',
  })
  @Matches(/(?=.*\d)/, {
    message: 'Password must contain at least one numeric digit',
  })
  @Matches(/(?=.*[@$!%*?&^#()_+\-=\[\]{};':"\\|,.<>\/])/, {
    message: 'Password must contain at least one special character/symbol',
  })
  newPassword: string;
}
