import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VcsPullRequest, VcsProvider, VcsPullRequestStatus } from './entities/vcs-pull-request.entity.js';
import { Issue, IssueStatus } from '../issues/entities/issue.entity.js';
import { IssueHistory } from '../issues/entities/issue-history.entity.js';
import { EventsGateway } from '../events/events.gateway.js';
import { GithubWebhookPayloadDto, GitlabWebhookPayloadDto } from './dto/vcs-webhook.dto.js';

@Injectable()
export class VcsService {
  private readonly logger = new Logger(VcsService.name);

  constructor(
    @InjectRepository(VcsPullRequest)
    private readonly vcsPrRepository: Repository<VcsPullRequest>,
    @InjectRepository(Issue)
    private readonly issueRepository: Repository<Issue>,
    @InjectRepository(IssueHistory)
    private readonly issueHistoryRepository: Repository<IssueHistory>,
    private readonly eventsGateway: EventsGateway,
  ) {}

  /**
   * Extracts distinct uppercase issue keys (e.g. PROJ-123) from text blocks.
   */
  extractIssueKeys(text: string): string[] {
    if (!text) return [];
    const regex = /\b([A-Z][A-Z0-9_]*-\d+)\b/g;
    const matches = text.match(regex);
    if (!matches) return [];
    return Array.from(new Set(matches.map((m) => m.toUpperCase())));
  }

  /**
   * Processes inbound GitHub webhook payloads for pull_request events.
   */
  async processGithubWebhook(payload: GithubWebhookPayloadDto): Promise<{
    processed: boolean;
    reason?: string;
    matchedCount?: number;
    pullRequests?: VcsPullRequest[];
  }> {
    const pr = payload.pull_request;
    if (!pr || !payload.repository) {
      return { processed: false, reason: 'Payload is missing pull_request or repository data' };
    }

    const action = payload.action || 'opened';
    const repository = payload.repository.full_name;
    const prNumber = payload.number || 0;
    const title = pr.title || 'Untitled PR';
    const body = pr.body || '';
    const sourceBranch = pr.head?.ref || '';
    const targetBranch = pr.base?.ref || 'main';
    const url = pr.html_url || '';
    const authorUsername = pr.user?.login || null;
    const isMerged = Boolean(pr.merged);
    const isClosed = pr.state === 'closed';

    let status = VcsPullRequestStatus.OPEN;
    if (isMerged) {
      status = VcsPullRequestStatus.MERGED;
    } else if (isClosed) {
      status = VcsPullRequestStatus.CLOSED;
    }

    const textToSearch = `${title} ${body} ${sourceBranch}`;
    const keys = this.extractIssueKeys(textToSearch);

    if (keys.length === 0) {
      return { processed: true, matchedCount: 0, pullRequests: [] };
    }

    const savedPrs: VcsPullRequest[] = [];

    for (const key of keys) {
      const parts = key.split('-');
      if (parts.length < 2) continue;
      const projectKey = parts[0];
      const issueNum = parseInt(parts[1], 10);
      if (isNaN(issueNum)) continue;

      const issue = await this.issueRepository.findOne({
        where: { project: { key: projectKey }, issueNum },
        relations: { project: true },
      });

      if (!issue) {
        continue;
      }

      // Upsert VcsPullRequest record
      let vcsPr = await this.vcsPrRepository.findOne({
        where: { repository, prNumber },
      });

      if (!vcsPr) {
        vcsPr = this.vcsPrRepository.create({
          issueId: issue.id,
          provider: VcsProvider.GITHUB,
          repository,
          prNumber,
          title,
          sourceBranch,
          targetBranch,
          status,
          url,
          authorUsername,
        });
      } else {
        vcsPr.issueId = issue.id;
        vcsPr.title = title;
        vcsPr.sourceBranch = sourceBranch;
        vcsPr.targetBranch = targetBranch;
        vcsPr.status = status;
        vcsPr.url = url;
        vcsPr.authorUsername = authorUsername;
      }

      const saved = await this.vcsPrRepository.save(vcsPr);
      savedPrs.push(saved);

      // Automated state transitions based on PR lifecycle
      if ((action === 'opened' || action === 'reopened') && (issue.status === IssueStatus.OPEN || issue.status === IssueStatus.IN_PROGRESS)) {
        const oldStatus = issue.status;
        issue.status = IssueStatus.REVIEW;
        await this.issueRepository.save(issue);

        await this.issueHistoryRepository.save(
          this.issueHistoryRepository.create({
            issueId: issue.id,
            userId: null,
            field: 'status',
            oldValue: oldStatus,
            newValue: IssueStatus.REVIEW,
          }),
        );

        await this.eventsGateway.broadcastIssueUpdated(issue);
        this.logger.log(`Auto-transitioned issue ${key} to REVIEW on PR #${prNumber} open`);
      } else if (isMerged && issue.status !== IssueStatus.RESOLVED && issue.status !== IssueStatus.CLOSED) {
        const oldStatus = issue.status;
        issue.status = IssueStatus.RESOLVED;
        await this.issueRepository.save(issue);

        await this.issueHistoryRepository.save(
          this.issueHistoryRepository.create({
            issueId: issue.id,
            userId: null,
            field: 'status',
            oldValue: oldStatus,
            newValue: IssueStatus.RESOLVED,
          }),
        );

        await this.eventsGateway.broadcastIssueUpdated(issue);
        this.logger.log(`Auto-transitioned issue ${key} to RESOLVED on PR #${prNumber} merge`);
      }
    }

    return {
      processed: true,
      matchedCount: savedPrs.length,
      pullRequests: savedPrs,
    };
  }

  /**
   * Processes inbound GitLab webhook payloads for merge_request events.
   */
  async processGitlabWebhook(payload: GitlabWebhookPayloadDto): Promise<{
    processed: boolean;
    reason?: string;
    matchedCount?: number;
    pullRequests?: VcsPullRequest[];
  }> {
    const attr = payload.object_attributes;
    if (!attr || !payload.project) {
      return { processed: false, reason: 'Payload is missing object_attributes or project data' };
    }

    const repository = payload.project.path_with_namespace;
    const prNumber = attr.iid || attr.id;
    const title = attr.title || 'Untitled MR';
    const body = attr.description || '';
    const sourceBranch = attr.source_branch || '';
    const targetBranch = attr.target_branch || 'main';
    const url = attr.url || '';
    const authorUsername = payload.user?.username || null;
    const action = attr.action || 'open';
    const state = attr.state || 'opened';

    let status = VcsPullRequestStatus.OPEN;
    if (state === 'merged' || action === 'merge') {
      status = VcsPullRequestStatus.MERGED;
    } else if (state === 'closed' || action === 'close') {
      status = VcsPullRequestStatus.CLOSED;
    }

    const textToSearch = `${title} ${body} ${sourceBranch}`;
    const keys = this.extractIssueKeys(textToSearch);

    if (keys.length === 0) {
      return { processed: true, matchedCount: 0, pullRequests: [] };
    }

    const savedPrs: VcsPullRequest[] = [];

    for (const key of keys) {
      const parts = key.split('-');
      if (parts.length < 2) continue;
      const projectKey = parts[0];
      const issueNum = parseInt(parts[1], 10);
      if (isNaN(issueNum)) continue;

      const issue = await this.issueRepository.findOne({
        where: { project: { key: projectKey }, issueNum },
        relations: { project: true },
      });

      if (!issue) continue;

      let vcsPr = await this.vcsPrRepository.findOne({
        where: { repository, prNumber },
      });

      if (!vcsPr) {
        vcsPr = this.vcsPrRepository.create({
          issueId: issue.id,
          provider: VcsProvider.GITLAB,
          repository,
          prNumber,
          title,
          sourceBranch,
          targetBranch,
          status,
          url,
          authorUsername,
        });
      } else {
        vcsPr.issueId = issue.id;
        vcsPr.title = title;
        vcsPr.sourceBranch = sourceBranch;
        vcsPr.targetBranch = targetBranch;
        vcsPr.status = status;
        vcsPr.url = url;
        vcsPr.authorUsername = authorUsername;
      }

      const saved = await this.vcsPrRepository.save(vcsPr);
      savedPrs.push(saved);

      if ((action === 'open' || action === 'reopen') && (issue.status === IssueStatus.OPEN || issue.status === IssueStatus.IN_PROGRESS)) {
        const oldStatus = issue.status;
        issue.status = IssueStatus.REVIEW;
        await this.issueRepository.save(issue);

        await this.issueHistoryRepository.save(
          this.issueHistoryRepository.create({
            issueId: issue.id,
            userId: null,
            field: 'status',
            oldValue: oldStatus,
            newValue: IssueStatus.REVIEW,
          }),
        );

        await this.eventsGateway.broadcastIssueUpdated(issue);
        this.logger.log(`Auto-transitioned issue ${key} to REVIEW on GitLab MR #${prNumber} open`);
      } else if (status === VcsPullRequestStatus.MERGED && issue.status !== IssueStatus.RESOLVED && issue.status !== IssueStatus.CLOSED) {
        const oldStatus = issue.status;
        issue.status = IssueStatus.RESOLVED;
        await this.issueRepository.save(issue);

        await this.issueHistoryRepository.save(
          this.issueHistoryRepository.create({
            issueId: issue.id,
            userId: null,
            field: 'status',
            oldValue: oldStatus,
            newValue: IssueStatus.RESOLVED,
          }),
        );

        await this.eventsGateway.broadcastIssueUpdated(issue);
        this.logger.log(`Auto-transitioned issue ${key} to RESOLVED on GitLab MR #${prNumber} merge`);
      }
    }

    return {
      processed: true,
      matchedCount: savedPrs.length,
      pullRequests: savedPrs,
    };
  }

  /**
   * Retrieves all linked pull requests for a given issue.
   */
  async getPullRequestsForIssue(issueId: number): Promise<VcsPullRequest[]> {
    return this.vcsPrRepository.find({
      where: { issueId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }
}
