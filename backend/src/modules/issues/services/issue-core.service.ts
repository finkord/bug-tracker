import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Issue, IssueStatus } from '../entities/issue.entity.js';
import { Project } from '../../projects/entities/project.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { Attachment } from '../entities/attachment.entity.js';
import { EventsGateway } from '../../events/events.gateway.js';
import { CreateIssueDto } from '../dto/create-issue.dto.js';
import { ListIssuesQueryDto } from '../dto/list-issues-query.dto.js';
import { IssueLinksService } from './issue-links.service.js';
import type {
  IssueSummaryDto,
  IssueDetailDto,
  UserSummaryDto,
} from '../dto/issue-response.dto.js';

/**
 * Service responsible for core issue lifecycle management, querying, and transitions.
 */
@Injectable()
export class IssueCoreService {
  constructor(
    @InjectRepository(Issue)
    private readonly issueRepository: Repository<Issue>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Attachment)
    private readonly attachmentRepository: Repository<Attachment>,
    private readonly issueLinksService: IssueLinksService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  /**
   * Retrieves list of issues with multi-criteria filtering.
   */
  async findAll(query: ListIssuesQueryDto): Promise<IssueSummaryDto[]> {
    const qb = this.issueRepository
      .createQueryBuilder('issue')
      .leftJoinAndSelect('issue.project', 'project')
      .leftJoinAndSelect('issue.reporter', 'reporter')
      .leftJoinAndSelect('issue.assignee', 'assignee')
      .loadRelationIdAndMap('issue.commentIds', 'issue.comments');

    if (query.projectId) {
      qb.andWhere('issue.projectId = :projectId', { projectId: query.projectId });
    }
    if (query.status) {
      qb.andWhere('issue.status = :status', { status: query.status });
    }
    if (query.priority) {
      qb.andWhere('issue.priority = :priority', { priority: query.priority });
    }
    if (query.issueType) {
      qb.andWhere('issue.issueType = :issueType', { issueType: query.issueType });
    }
    if (query.assigneeId) {
      qb.andWhere('issue.assigneeId = :assigneeId', { assigneeId: query.assigneeId });
    }
    if (query.sprint) {
      if (query.sprint.toUpperCase() === 'BACKLOG') {
        qb.andWhere('(issue.sprint IS NULL OR issue.sprint = \'\')');
      } else {
        qb.andWhere('issue.sprint = :sprint', { sprint: query.sprint });
      }
    }
    if (query.search && query.search.trim()) {
      const rawTerm = query.search.trim();
      const term = `%${rawTerm.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(issue.title) LIKE :term OR LOWER(issue.description) LIKE :term OR LOWER(project.key) LIKE :term OR to_tsvector(\'simple\', coalesce(issue.title, \'\') || \' \' || coalesce(issue.description, \'\')) @@ plainto_tsquery(\'simple\', :rawTerm))',
        { term, rawTerm },
      );
    }

    qb.orderBy('issue.createdAt', 'DESC');
    const issues = await qb.getMany();

    return issues.map((i) => this.mapIssueSummary(i, (i as unknown as { commentIds?: number[] }).commentIds));
  }

  /**
   * Retrieves single issue with relations, comments, worklogs, attachments, and links.
   */
  async findByKeyOrId(keyOrId: string | number): Promise<IssueDetailDto> {
    const raw = String(keyOrId).trim();
    let issue: Issue | null = null;
    const keyMatch = raw.match(/^([a-zA-Z0-9_-]+)-(\d+)$/);

    if (keyMatch) {
      const [, projectKey, issueNumStr] = keyMatch;
      const issueNum = parseInt(issueNumStr, 10);
      issue = await this.issueRepository.findOne({
        where: {
          issueNum,
          project: { key: projectKey.toUpperCase() },
        },
        relations: {
          project: true,
          reporter: true,
          assignee: true,
          comments: { author: true },
          worklogs: { user: true },
        },
        order: {
          comments: { createdAt: 'ASC' },
          worklogs: { createdAt: 'DESC' },
        },
      });

      if (!issue) {
        issue = await this.issueRepository
          .createQueryBuilder('issue')
          .leftJoinAndSelect('issue.project', 'project')
          .leftJoinAndSelect('issue.reporter', 'reporter')
          .leftJoinAndSelect('issue.assignee', 'assignee')
          .leftJoinAndSelect('issue.comments', 'comments')
          .leftJoinAndSelect('comments.author', 'commentAuthor')
          .leftJoinAndSelect('issue.worklogs', 'worklogs')
          .leftJoinAndSelect('worklogs.user', 'worklogUser')
          .where('LOWER(project.key) = LOWER(:projectKey)', { projectKey })
          .andWhere('issue.issueNum = :issueNum', { issueNum })
          .orderBy('comments.createdAt', 'ASC')
          .addOrderBy('worklogs.createdAt', 'DESC')
          .getOne();
      }
    }

    if (!issue && /^\d+$/.test(raw)) {
      const numId = parseInt(raw, 10);
      issue = await this.issueRepository.findOne({
        where: { id: numId },
        relations: {
          project: true,
          reporter: true,
          assignee: true,
          comments: { author: true },
          worklogs: { user: true },
        },
        order: {
          comments: { createdAt: 'ASC' },
          worklogs: { createdAt: 'DESC' },
        },
      });
    }

    if (!issue) {
      throw new NotFoundException(`Issue "${raw}" not found`);
    }

    const attachments = await this.attachmentRepository.find({
      where: { issueId: issue.id },
      relations: { uploader: true },
      order: { createdAt: 'DESC' },
    });
    const links = await this.issueLinksService.getIssueLinks(issue.id);

    return this.mapIssueDetail(issue, attachments, links);
  }

  /**
   * Retrieves single issue by numeric primary key ID.
   */
  async findById(id: number): Promise<IssueDetailDto> {
    return this.findByKeyOrId(id);
  }

  /**
   * Creates a new issue with sequential numbering within project.
   */
  async create(dto: CreateIssueDto, reporter: User): Promise<IssueDetailDto> {
    const project = await this.projectRepository.findOne({
      where: { id: dto.projectId },
    });
    if (!project) {
      throw new BadRequestException(`Project #${dto.projectId} does not exist`);
    }

    const maxResult = await this.issueRepository
      .createQueryBuilder('issue')
      .select('MAX(issue.issueNum)', 'maxNum')
      .where('issue.projectId = :projectId', { projectId: dto.projectId })
      .getRawOne();
    const nextIssueNum = (maxResult?.maxNum ? Number(maxResult.maxNum) : 0) + 1;

    const issue = this.issueRepository.create({
      projectId: dto.projectId,
      project,
      issueNum: nextIssueNum,
      title: dto.title.trim(),
      description: dto.description?.trim() || null,
      issueType: dto.issueType,
      priority: dto.priority,
      severity: dto.severity,
      estimatedHours: dto.estimatedHours || 0,
      sprint: dto.sprint?.trim() || null,
      reporterId: reporter.id,
      reporter,
      assigneeId: dto.assigneeId || null,
    });

    const saved = await this.issueRepository.save(issue);
    const formatted = await this.findById(saved.id);
    this.eventsGateway.broadcastIssueCreated(formatted);
    return formatted;
  }

  /**
   * Updates issue status and broadcasts change.
   */
  async updateStatus(id: number, status: IssueStatus): Promise<IssueDetailDto> {
    const issue = await this.issueRepository.findOne({ where: { id } });
    if (!issue) {
      throw new NotFoundException(`Issue with ID #${id} not found`);
    }
    await this.issueRepository.update(id, { status });
    const updated = await this.findById(id);
    this.eventsGateway.broadcastIssueUpdated(updated);
    return updated;
  }

  /**
   * Assigns issue to currently authenticated user.
   */
  async assignToMe(id: number, user: User): Promise<IssueDetailDto> {
    const issue = await this.issueRepository.findOne({ where: { id } });
    if (!issue) {
      throw new NotFoundException(`Issue with ID #${id} not found`);
    }
    issue.assigneeId = user.id;
    await this.issueRepository.save(issue);
    const updated = await this.findById(id);
    this.eventsGateway.broadcastIssueUpdated(updated);
    return updated;
  }

  /**
   * Updates sprint assignment.
   */
  async updateSprint(id: number, sprint: string | null): Promise<IssueDetailDto> {
    const issue = await this.issueRepository.findOne({ where: { id } });
    if (!issue) {
      throw new NotFoundException(`Issue with ID #${id} not found`);
    }
    issue.sprint = sprint ? sprint.trim() : null;
    await this.issueRepository.save(issue);
    const updated = await this.findById(id);
    this.eventsGateway.broadcastIssueUpdated(updated);
    return updated;
  }

  /**
   * Updates issue metadata and assignments.
   */
  async update(id: number, dto: Partial<CreateIssueDto>): Promise<IssueDetailDto> {
    const issue = await this.issueRepository.findOne({ where: { id } });
    if (!issue) {
      throw new NotFoundException(`Issue with ID #${id} not found`);
    }
    if (dto.title) issue.title = dto.title.trim();
    if (dto.description !== undefined) issue.description = dto.description?.trim() || null;
    if (dto.issueType) issue.issueType = dto.issueType;
    if (dto.priority) issue.priority = dto.priority;
    if (dto.severity) issue.severity = dto.severity;
    if (dto.estimatedHours !== undefined) issue.estimatedHours = dto.estimatedHours;
    if (dto.sprint !== undefined) issue.sprint = dto.sprint?.trim() || null;
    if (dto.assigneeId !== undefined) issue.assigneeId = dto.assigneeId || null;

    await this.issueRepository.save(issue);
    const updated = await this.findById(id);
    this.eventsGateway.broadcastIssueUpdated(updated);
    return updated;
  }

  /**
   * Deletes an issue by ID and broadcasts event.
   */
  async remove(id: number): Promise<{ success: boolean; message: string }> {
    const issue = await this.issueRepository.findOne({
      where: { id },
      relations: { project: true },
    });
    if (!issue) {
      throw new NotFoundException(`Issue with ID #${id} not found`);
    }
    const key = `${issue.project?.key || 'ISSUE'}-${issue.issueNum}`;
    const projectId = issue.projectId;
    await this.issueRepository.remove(issue);
    this.eventsGateway.broadcastIssueDeleted(id, projectId);
    return {
      success: true,
      message: `Issue ${key} deleted successfully`,
    };
  }

  private mapUserSummary(user?: User | null): UserSummaryDto | null {
    if (!user) return null;
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      avatarUrl: user.avatarUrl || null,
      systemRole: user.systemRole,
    };
  }

  private mapIssueSummary(i: Issue, commentIds?: number[]): IssueSummaryDto {
    return {
      id: i.id,
      key: `${i.project?.key || 'ISSUE'}-${i.issueNum}`,
      projectId: i.projectId,
      projectKey: i.project?.key || '',
      projectName: i.project?.name || '',
      issueNum: i.issueNum,
      title: i.title,
      description: i.description,
      issueType: i.issueType,
      status: i.status,
      priority: i.priority,
      severity: i.severity,
      estimatedHours: i.estimatedHours || 0,
      loggedHours: i.loggedHours || 0,
      sprint: i.sprint || null,
      reporter: this.mapUserSummary(i.reporter)!,
      assignee: this.mapUserSummary(i.assignee),
      commentsCount: Array.isArray(commentIds) ? commentIds.length : 0,
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
    };
  }

  private mapIssueDetail(issue: Issue, attachments: Attachment[], links: any[]): IssueDetailDto {
    return {
      ...this.mapIssueSummary(issue),
      comments: (issue.comments || []).map((c) => ({
        id: c.id,
        text: c.text,
        author: this.mapUserSummary(c.author)!,
        createdAt: c.createdAt,
      })),
      worklogs: (issue.worklogs || []).map((w) => ({
        id: w.id,
        timeSpentHours: w.timeSpentHours,
        dateLogged: w.dateLogged,
        description: w.description,
        createdAt: w.createdAt,
        user: this.mapUserSummary(w.user)!,
      })),
      attachments: (attachments || []).map((a) => ({
        id: a.id,
        filename: a.filename,
        fileSize: a.fileSize,
        mimeType: a.mimeType,
        fid: a.fid,
        url: `http://localhost:3000/api/v1/issues/attachments/${a.id}/file`,
        createdAt: a.createdAt,
        uploader: this.mapUserSummary(a.uploader),
      })),
      links,
    };
  }
}
