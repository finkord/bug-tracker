import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address of the account to receive password reset link (SDSecurity Task 7)',
  })
  @IsEmail({}, { message: 'Invalid email address format' })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    example: 'a1b2c3d4e5f6...',
    description: 'Single-use cryptographic reset token received in email',
  })
  @IsString()
  @IsNotEmpty({ message: 'Reset token is required' })
  token: string;

  @ApiProperty({
    example: 'NewStr0ngP@ss1!',
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
