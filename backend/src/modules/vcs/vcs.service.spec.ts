import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VcsService } from './vcs.service.js';
import { VcsPullRequestStatus } from './entities/vcs-pull-request.entity.js';
import { IssueStatus } from '../issues/entities/issue.entity.js';

describe('VcsService', () => {
  let service: VcsService;
  let mockVcsPrRepository: any;
  let mockIssueRepository: any;
  let mockIssueHistoryRepository: any;
  let mockEventsGateway: any;

  beforeEach(() => {
    mockVcsPrRepository = {
      findOne: vi.fn(),
      find: vi.fn(),
      create: vi.fn((dto) => ({ id: 1, ...dto })),
      save: vi.fn((entity) => Promise.resolve({ id: 1, ...entity })),
    };

    mockIssueRepository = {
      findOne: vi.fn(),
      save: vi.fn((issue) => Promise.resolve(issue)),
    };

    mockIssueHistoryRepository = {
      create: vi.fn((dto) => dto),
      save: vi.fn((history) => Promise.resolve({ id: 10, ...history })),
    };

    mockEventsGateway = {
      broadcastIssueUpdated: vi.fn(),
    };

    service = new VcsService(
      mockVcsPrRepository,
      mockIssueRepository,
      mockIssueHistoryRepository,
      mockEventsGateway,
    );
  });

  describe('extractIssueKeys', () => {
    it('should extract distinct uppercase issue keys from titles, branches, and bodies', () => {
      const text = 'Fixes PROJ-101 and proj-101 again, also relates to CORE-42 and BUG_TRACK-999';
      const keys = service.extractIssueKeys(text);
      expect(keys).toEqual(['PROJ-101', 'CORE-42', 'BUG_TRACK-999']);
    });

    it('should return an empty array if no issue keys are present', () => {
      const text = 'Refactor utility helpers without any ticket references';
      const keys = service.extractIssueKeys(text);
      expect(keys).toEqual([]);
    });

    it('should return empty array for empty or null string', () => {
      expect(service.extractIssueKeys('')).toEqual([]);
    });
  });

  describe('processGithubWebhook', () => {
    it('should return processed false if pull_request or repository data is missing', async () => {
      const res = await service.processGithubWebhook({});
      expect(res.processed).toBe(false);
      expect(res.reason).toContain('missing');
    });

    it('should return matchedCount 0 if no issue keys found', async () => {
      const payload: any = {
        action: 'opened',
        number: 42,
        repository: { full_name: 'acme/webapp' },
        pull_request: {
          title: 'Update dependencies',
          body: 'Bumping versions',
          head: { ref: 'deps/bump' },
          base: { ref: 'main' },
          html_url: 'https://github.com/acme/webapp/pull/42',
        },
      };

      const res = await service.processGithubWebhook(payload);
      expect(res.processed).toBe(true);
      expect(res.matchedCount).toBe(0);
      expect(mockIssueRepository.findOne).not.toHaveBeenCalled();
    });

    it('should link PR and auto-transition issue to REVIEW on PR opened', async () => {
      const payload: any = {
        action: 'opened',
        number: 55,
        repository: { full_name: 'acme/webapp' },
        pull_request: {
          title: 'PROJ-12: Implement JWT rotation',
          body: 'Fixes PROJ-12 by adding key store',
          head: { ref: 'feature/PROJ-12-jwt' },
          base: { ref: 'main' },
          html_url: 'https://github.com/acme/webapp/pull/55',
          state: 'open',
          merged: false,
          user: { login: 'octocat' },
        },
      };

      const mockIssue = {
        id: 12,
        projectId: 1,
        issueNum: 12,
        status: IssueStatus.IN_PROGRESS,
        project: { key: 'PROJ' },
      };

      mockIssueRepository.findOne.mockResolvedValue(mockIssue);
      mockVcsPrRepository.findOne.mockResolvedValue(null);

      const res = await service.processGithubWebhook(payload);
      expect(res.processed).toBe(true);
      expect(res.matchedCount).toBe(1);
      expect(mockVcsPrRepository.save).toHaveBeenCalled();

      // Issue transitioned to REVIEW
      expect(mockIssue.status).toBe(IssueStatus.REVIEW);
      expect(mockIssueHistoryRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          issueId: 12,
          field: 'status',
          oldValue: IssueStatus.IN_PROGRESS,
          newValue: IssueStatus.REVIEW,
        }),
      );
      expect(mockEventsGateway.broadcastIssueUpdated).toHaveBeenCalledWith(mockIssue);
    });

    it('should link PR and auto-transition issue to RESOLVED on PR merged', async () => {
      const payload: any = {
        action: 'closed',
        number: 55,
        repository: { full_name: 'acme/webapp' },
        pull_request: {
          title: 'PROJ-12: Implement JWT rotation',
          body: 'Fixes PROJ-12',
          head: { ref: 'feature/PROJ-12-jwt' },
          base: { ref: 'main' },
          html_url: 'https://github.com/acme/webapp/pull/55',
          state: 'closed',
          merged: true,
          user: { login: 'octocat' },
        },
      };

      const mockIssue = {
        id: 12,
        projectId: 1,
        issueNum: 12,
        status: IssueStatus.REVIEW,
        project: { key: 'PROJ' },
      };

      mockIssueRepository.findOne.mockResolvedValue(mockIssue);
      mockVcsPrRepository.findOne.mockResolvedValue({
        id: 9,
        issueId: 12,
        status: VcsPullRequestStatus.OPEN,
      });

      const res = await service.processGithubWebhook(payload);
      expect(res.processed).toBe(true);
      expect(mockIssue.status).toBe(IssueStatus.RESOLVED);
      expect(mockIssueHistoryRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          issueId: 12,
          field: 'status',
          oldValue: IssueStatus.REVIEW,
          newValue: IssueStatus.RESOLVED,
        }),
      );
    });
  });

  describe('processGitlabWebhook', () => {
    it('should link GitLab merge request to issue', async () => {
      const payload: any = {
        object_kind: 'merge_request',
        project: { path_with_namespace: 'group/project' },
        user: { username: 'gitlab_user' },
        object_attributes: {
          id: 101,
          iid: 14,
          title: 'PROJ-77: Fix caching TTL',
          description: 'Closes PROJ-77',
          source_branch: 'bugfix/PROJ-77',
          target_branch: 'main',
          state: 'opened',
          action: 'open',
          url: 'https://gitlab.com/group/project/-/merge_requests/14',
        },
      };

      const mockIssue = {
        id: 77,
        projectId: 1,
        issueNum: 77,
        status: IssueStatus.OPEN,
        project: { key: 'PROJ' },
      };

      mockIssueRepository.findOne.mockResolvedValue(mockIssue);
      mockVcsPrRepository.findOne.mockResolvedValue(null);

      const res = await service.processGitlabWebhook(payload);
      expect(res.processed).toBe(true);
      expect(res.matchedCount).toBe(1);
      expect(mockIssue.status).toBe(IssueStatus.REVIEW);
    });
  });

  describe('getPullRequestsForIssue', () => {
    it('should return pull requests bounded and ordered by creation date', async () => {
      const prs = [{ id: 1, prNumber: 42, title: 'Fix bug' }];
      mockVcsPrRepository.find.mockResolvedValue(prs);

      const result = await service.getPullRequestsForIssue(10);
      expect(result).toBe(prs);
      expect(mockVcsPrRepository.find).toHaveBeenCalledWith({
        where: { issueId: 10 },
        order: { createdAt: 'DESC' },
        take: 20,
      });
    });
  });
});
