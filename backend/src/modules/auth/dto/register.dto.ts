import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the user',
  })
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  @MinLength(2, { message: 'Full name must be at least 2 characters' })
  @MaxLength(100, { message: 'Full name cannot exceed 100 characters' })
  fullName: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Unique valid email address',
  })
  @IsEmail({}, { message: 'Invalid email address format' })
  email: string;

  @ApiProperty({
    example: 'Str0ngP@ssw0rd!',
    description:
      'Password meeting security policy: min 8 characters, uppercase, lowercase, digit, and special symbol (SDSecurity Task 1)',
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
  password: string;

  @ApiProperty({
    example: 'valid-captcha-token',
    description:
      'Bot protection token verified by CaptchaService (SDSecurity Task 2). Use "valid-captcha-token" in dev mode.',
  })
  @IsString()
  @IsNotEmpty({ message: 'CAPTCHA token is required' })
  captchaToken: string;
}
