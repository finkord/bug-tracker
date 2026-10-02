import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WebhookResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 10 })
  projectId: number;

  @ApiProperty({ example: 'Slack Alerts' })
  name: string;

  @ApiProperty({ example: 'https://example.com/webhook' })
  url: string;

  @ApiProperty({ example: 'whsec_••••••••••••' })
  maskedSecret: string;

  @ApiPropertyOptional({ example: 'whsec_abcdef1234567890' })
  secret?: string;

  @ApiProperty({ example: ['issue.created', 'issue.updated'] })
  events: string[];

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiPropertyOptional({ example: '2026-10-02T10:00:00Z' })
  lastTriggeredAt: Date | null;

  @ApiProperty({ example: 0 })
  failureCount: number;

  @ApiPropertyOptional({ example: 'Connection timeout after 5000ms' })
  lastFailureReason: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class WebhookTestResultDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiPropertyOptional({ example: 200 })
  statusCode?: number;

  @ApiProperty({ example: 142 })
  responseTimeMs: number;

  @ApiProperty({ example: 'Webhook endpoint returned 200 OK' })
  message: string;
}
