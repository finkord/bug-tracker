import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsOptional,
  IsArray,
  IsBoolean,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWebhookDto {
  @ApiProperty({ example: 'Slack Notification Bridge', description: 'Descriptive name for the webhook integration' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @ApiProperty({ example: 'https://hooks.slack.com/services/T00/B00/XXXX', description: 'HTTPS/HTTP target delivery URL' })
  @IsUrl({ require_tld: false, require_protocol: true }, { message: 'URL must be a valid HTTP or HTTPS address' })
  @IsNotEmpty()
  url: string;

  @ApiPropertyOptional({ example: 'whsec_a1b2c3d4e5f6', description: 'HMAC signature secret. Auto-generated if omitted.' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  secret?: string;

  @ApiPropertyOptional({
    example: ['issue.created', 'issue.updated', 'status.changed', 'version.released'],
    description: 'Subscribed event topics',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  events?: string[];

  @ApiPropertyOptional({ example: true, description: 'Whether the webhook actively dispatches events', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
