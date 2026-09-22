import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Registered account email address',
  })
  @IsEmail({}, { message: 'Invalid email address format' })
  email: string;

  @ApiProperty({
    example: 'Str0ngP@ssw0rd!',
    description: 'Account password',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
