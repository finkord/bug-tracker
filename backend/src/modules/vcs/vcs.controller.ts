import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VcsService } from './vcs.service.js';
import { GithubWebhookPayloadDto, GitlabWebhookPayloadDto } from './dto/vcs-webhook.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@ApiTags('VCS & DevOps Integration')
@Controller()
export class VcsController {
  constructor(private readonly vcsService: VcsService) {}

  @ApiOperation({ summary: 'Inbound GitHub pull request webhook listener' })
  @HttpCode(HttpStatus.OK)
  @Post('vcs/webhooks/github')
  async handleGithubWebhook(@Body() payload: GithubWebhookPayloadDto) {
    return this.vcsService.processGithubWebhook(payload);
  }

  @ApiOperation({ summary: 'Inbound GitLab merge request webhook listener' })
  @HttpCode(HttpStatus.OK)
  @Post('vcs/webhooks/gitlab')
  async handleGitlabWebhook(@Body() payload: GitlabWebhookPayloadDto) {
    return this.vcsService.processGitlabWebhook(payload);
  }

  @ApiOperation({ summary: 'List all pull requests linked to an issue' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('issues/:issueId/vcs/pull-requests')
  async getIssuePullRequests(@Param('issueId', ParseIntPipe) issueId: number) {
    return this.vcsService.getPullRequestsForIssue(issueId);
  }
}
