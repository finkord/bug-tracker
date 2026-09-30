import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Issue, IssueStatus } from '../entities/issue.entity.js';
import { Project } from '../../projects/entities/project.entity.js';
import { User, SystemRole } from '../../users/entities/user.entity.js';
import { Attachment } from '../entities/attachment.entity.js';
import { Sprint } from '../../sprints/entities/sprint.entity.js';
import { EventsGateway } from '../../events/events.gateway.js';
import { CreateIssueDto } from '../dto/create-issue.dto.js';
import { ListIssuesQueryDto } from '../dto/list-issues-query.dto.js';
import { IssueLinksService } from './issue-links.service.js';
import { JqlParserService } from './jql-parser.service.js';
import { PermissionEvaluatorService } from '../../rbac/services/permission-evaluator.service.js';
import type {
  IssueSummaryDto,
  IssueDetailDto,
  UserSummaryDto,
  IssueLinkItemDto,
  PaginatedIssuesResponseDto,
} from '../dto/issue-response.dto.js';

/**
 * Service responsible for core issue lifecycle management, querying, and transitions.
 */
@Injectable()
export class IssueCoreService {
  private readonly backendBaseUrl: string;

  constructor(
    @InjectRepository(Issue)
    private readonly issueRepository: Repository<Issue>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Attachment)
    private readonly attachmentRepository: Repository<Attachment>,
    @InjectRepository(Sprint)
    private readonly sprintRepository: Repository<Sprint>,
    private readonly issueLinksService: IssueLinksService,
    private readonly eventsGateway: EventsGateway,
    private readonly jqlParserService: JqlParserService,
    private readonly permissionEvaluator: PermissionEvaluatorService,
    private readonly configService: ConfigService,
  ) {
    const port = this.configService.get<number>('PORT', 3000);
    const host = this.configService.get<string>('BACKEND_URL', `http://localhost:${port}`);
    this.backendBaseUrl = host.replace(/\/$/, '');
  }

  /**
   * Retrieves paginated list of issues with multi-criteria filtering, JQL search, and RBAC isolation.
   */
  async findAll(query: ListIssuesQueryDto, user?: User): Promise<PaginatedIssuesResponseDto> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 50));

    // 1. Enforce tenant project isolation and row-level security if user is provided
    let accessibleProjectIds: number[] | 'ALL' = 'ALL';
    if (user) {
      accessibleProjectIds = await this.permissionEvaluator.getAccessibleProjectIds(user.id);
      if (accessibleProjectIds !== 'ALL' && accessibleProjectIds.length === 0) {
        return {
          items: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        };
      }
    }

    const qb = this.issueRepository
      .createQueryBuilder('issue')
      .leftJoinAndSelect('issue.project', 'project')
      .leftJoinAndSelect('issue.reporter', 'reporter')
      .leftJoinAndSelect('issue.assignee', 'assignee')
      .leftJoinAndSelect('issue.sprint', 'sprint')
      .loadRelationIdAndMap('issue.commentIds', 'issue.comments');

    if (user) {
      if (accessibleProjectIds !== 'ALL') {
        qb.andWhere('issue.projectId IN (:...accessibleProjectIds)', { accessibleProjectIds });
      }

      if (user.systemRole !== SystemRole.ADMIN) {
        qb.andWhere(
          '(issue.securityLevelId IS NULL OR issue.reporterId = :currentUserId OR issue.assigneeId = :currentUserId)',
          { currentUserId: user.id },
        );
      }
    }

    // 2. Apply JQL search expression if provided
    let hasCustomOrder = false;
    if (query.jql && query.jql.trim()) {
      hasCustomOrder = this.jqlParserService.applyToQueryBuilder(qb, query.jql, user?.id);
    } else {
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
      if (query.sprintId) {
        if (query.sprintId.toUpperCase() === 'BACKLOG' || query.sprintId === '0') {
          qb.andWhere('issue.sprintId IS NULL');
        } else {
          qb.andWhere('issue.sprintId = :sprintId', { sprintId: Number(query.sprintId) });
        }
      }
      if (query.search && query.search.trim()) {
        const rawTerm = query.search.trim();
        const term = `%${rawTerm.toLowerCase()}%`;
        qb.andWhere(
          '(LOWER(issue.title) LIKE :term OR LOWER(issue.description) LIKE :term OR LOWER(project.key) LIKE :term OR to_tsvector(\'english\', coalesce(issue.title, \'\') || \' \' || coalesce(issue.description, \'\')) @@ plainto_tsquery(\'english\', :rawTerm))',
          { term, rawTerm },
        );
      }
    }

    // 3. Apply sorting if not already handled by JQL ORDER BY
    if (!hasCustomOrder) {
      if (query.sortBy) {
        const allowedSortCols: Record<string, string> = {
          createdAt: 'issue.createdAt',
          updatedAt: 'issue.updatedAt',
          priority: 'issue.priority',
          status: 'issue.status',
          title: 'issue.title',
          issueNum: 'issue.issueNum',
        };
        const sortCol = allowedSortCols[query.sortBy] || 'issue.createdAt';
        const sortDirection = (query.sortOrder || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        qb.orderBy(sortCol, sortDirection);
      } else {
        qb.orderBy('issue.createdAt', 'DESC');
      }
    }

    // 4. Server-side pagination
    const skip = (page - 1) * limit;

    qb.skip(skip).take(limit);

    const [issues, total] = await qb.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      items: issues.map((i) =>
        this.mapIssueSummary(i, (i as unknown as { commentIds?: number[] }).commentIds),
      ),
      total,
      page,
      limit,
      totalPages,
    };
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
          sprint: true,
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
          .leftJoinAndSelect('issue.sprint', 'sprint')
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
          sprint: true,
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

    let sprintId: number | null = null;
    if (dto.sprintId) {
      const sprint = await this.sprintRepository.findOne({
        where: { id: dto.sprintId, projectId: dto.projectId },
      });
      if (!sprint) {
        throw new NotFoundException(`Sprint #${dto.sprintId} not found in project #${dto.projectId}`);
      }
      sprintId = sprint.id;
    }

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
      sprintId,
      reporterId: reporter.id,
      reporter,
      assigneeId: dto.assigneeId || null,
    });

    const saved = await this.issueRepository.save(issue);
    const formatted = await this.findById(saved.id);
    await this.eventsGateway.broadcastIssueCreated(formatted);
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
    await this.eventsGateway.broadcastIssueUpdated(updated);
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
    await this.eventsGateway.broadcastIssueUpdated(updated);
    return updated;
  }

  /**
   * Updates relational sprint assignment.
   */
  async updateSprint(id: number, sprintId: number | null): Promise<IssueDetailDto> {
    const issue = await this.issueRepository.findOne({ where: { id } });
    if (!issue) {
      throw new NotFoundException(`Issue with ID #${id} not found`);
    }
    if (sprintId) {
      const sprint = await this.sprintRepository.findOne({
        where: { id: sprintId, projectId: issue.projectId },
      });
      if (!sprint) {
        throw new NotFoundException(`Sprint #${sprintId} not found in project #${issue.projectId}`);
      }
      issue.sprintId = sprint.id;
    } else {
      issue.sprintId = null;
    }
    await this.issueRepository.save(issue);
    const updated = await this.findById(id);
    await this.eventsGateway.broadcastIssueUpdated(updated);
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
    if (dto.sprintId !== undefined) {
      if (dto.sprintId) {
        const sprint = await this.sprintRepository.findOne({
          where: { id: dto.sprintId, projectId: issue.projectId },
        });
        if (!sprint) {
          throw new NotFoundException(`Sprint #${dto.sprintId} not found in project #${issue.projectId}`);
        }
        issue.sprintId = sprint.id;
      } else {
        issue.sprintId = null;
      }
    }
    if (dto.assigneeId !== undefined) issue.assigneeId = dto.assigneeId || null;

    await this.issueRepository.save(issue);
    const updated = await this.findById(id);
    await this.eventsGateway.broadcastIssueUpdated(updated);
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
      sprintId: i.sprintId ?? null,
      sprint: i.sprint
        ? {
            id: i.sprint.id,
            name: i.sprint.name,
            status: i.sprint.status,
          }
        : null,
      reporter: this.mapUserSummary(i.reporter)!,
      assignee: this.mapUserSummary(i.assignee),
      commentsCount: Array.isArray(commentIds) ? commentIds.length : 0,
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
    };
  }

  private mapIssueDetail(issue: Issue, attachments: Attachment[], links: IssueLinkItemDto[]): IssueDetailDto {
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
        url: `${this.backendBaseUrl}/api/v1/issues/attachments/${a.id}/file`,
        createdAt: a.createdAt,
        uploader: this.mapUserSummary(a.uploader),
      })),
      links,
    };
  }
}
