import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, IsEmail } from 'class-validator';
import { OAuthProvider } from '../../users/entities/user.entity.js';

export class OAuthMockDto {
  @ApiProperty({
    example: OAuthProvider.GITHUB,
    enum: OAuthProvider,
    description: 'OAuth provider (GITHUB, GOOGLE)',
  })
  @IsEnum(OAuthProvider)
  provider: OAuthProvider;

  @ApiProperty({
    example: 'gh-987654321',
    description: 'Unique user ID returned by OAuth identity provider',
  })
  @IsString()
  @IsNotEmpty()
  oauthId: string;

  @ApiProperty({
    example: 'octocat@github.local',
    description: 'Email address returned by OAuth provider',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'The Octocat',
    description: 'Display name from OAuth profile',
  })
  @IsString()
  @IsNotEmpty()
  fullName: string;
}
