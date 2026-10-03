import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Issue, IssueStatus, IssueType } from '../entities/issue.entity.js';
import { IssueHistory } from '../entities/issue-history.entity.js';
import { Project } from '../../projects/entities/project.entity.js';
import { User, SystemRole } from '../../users/entities/user.entity.js';
import { Attachment } from '../entities/attachment.entity.js';
import { Sprint } from '../../sprints/entities/sprint.entity.js';
import { ProjectComponent } from '../../projects/entities/project-component.entity.js';
import { EventsGateway } from '../../events/events.gateway.js';
import { CreateIssueDto } from '../dto/create-issue.dto.js';
import { UpdateIssueDto } from '../dto/update-issue.dto.js';
import { ListIssuesQueryDto } from '../dto/list-issues-query.dto.js';
import { BulkUpdateIssuesDto, BulkDeleteIssuesDto, type BulkOperationResultDto } from '../dto/bulk-issue.dto.js';
import { IssueLinksService } from './issue-links.service.js';
import { JqlParserService } from './jql-parser.service.js';
import { PermissionEvaluatorService } from '../../rbac/services/permission-evaluator.service.js';
import { ProjectPermission } from '../../rbac/entities/permission-grant.entity.js';
import { NotificationsService } from '../../notifications/notifications.service.js';
import { NotificationType } from '../../notifications/entities/notification.entity.js';
import { WebhooksService } from '../../webhooks/webhooks.service.js';
import type { IssueHistoryItemDto } from '../dto/issue-history.dto.js';
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
    @InjectRepository(IssueHistory)
    private readonly historyRepository: Repository<IssueHistory>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Attachment)
    private readonly attachmentRepository: Repository<Attachment>,
    @InjectRepository(Sprint)
    private readonly sprintRepository: Repository<Sprint>,
    @InjectRepository(ProjectComponent)
    private readonly componentRepository: Repository<ProjectComponent>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly issueLinksService: IssueLinksService,
    private readonly eventsGateway: EventsGateway,
    private readonly jqlParserService: JqlParserService,
    private readonly permissionEvaluator: PermissionEvaluatorService,
    private readonly configService: ConfigService,
    @Optional()
    private readonly notificationsService?: NotificationsService,
    @Optional()
    private readonly webhooksService?: WebhooksService,
  ) {
    const port = this.configService.get<number>('PORT', 3000);
    const host = this.configService.get<string>('BACKEND_URL', `http://localhost:${port}`);
    this.backendBaseUrl = host.replace(/\/$/, '');
  }

  private async logHistory(
    issueId: number,
    field: string,
    oldValue: any,
    newValue: any,
    userId?: number | null,
  ): Promise<void> {
    if (String(oldValue ?? '') === String(newValue ?? '')) return;
    try {
      const entry = this.historyRepository.create({
        issueId,
        field,
        oldValue: oldValue === null || oldValue === undefined ? null : String(oldValue),
        newValue: newValue === null || newValue === undefined ? null : String(newValue),
        userId: userId || null,
      });
      await this.historyRepository.save(entry);
    } catch {
      // Non-blocking for audit logs
    }
  }

  /**
   * Automatically transitions parent issue to RESOLVED if all sibling subtasks are completed.
   */
  async checkAndAutoTransitionParent(parentId: number | null | undefined, user?: User): Promise<void> {
    if (!parentId) return;

    try {
      const parent = await this.issueRepository.findOne({
        where: { id: parentId },
      });

      if (!parent || parent.status === IssueStatus.RESOLVED || parent.status === IssueStatus.CLOSED) {
        return;
      }

      const subtasks = await this.issueRepository.find({
        where: { parentId },
        select: { id: true, status: true },
      });

      if (subtasks.length === 0) return;

      const allCompleted = subtasks.every(
        (st) => st.status === IssueStatus.RESOLVED || st.status === IssueStatus.CLOSED,
      );

      if (allCompleted) {
        const oldStatus = parent.status;
        await this.issueRepository.update(parent.id, { status: IssueStatus.RESOLVED });
        await this.logHistory(
          parent.id,
          'status',
          oldStatus,
          IssueStatus.RESOLVED,
          user?.id,
        );

        const updatedParent = await this.findById(parent.id);
        await this.eventsGateway.broadcastIssueUpdated(updatedParent);

        if (this.webhooksService) {
          await this.webhooksService.dispatch(parent.projectId, 'status.changed', {
            issueId: parent.id,
            previousStatus: oldStatus,
            newStatus: IssueStatus.RESOLVED,
            reason: 'auto_transition_subtasks_completed',
          });
          await this.webhooksService.dispatch(parent.projectId, 'issue.updated', {
            issue: updatedParent,
          });
        }
      }
    } catch {
      // Non-blocking for auto-transition
    }
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

    const subtasks = await this.issueRepository.find({
      where: { parentId: issue.id },
      relations: {
        project: true,
        reporter: true,
        assignee: true,
        sprint: true,
      },
      order: { id: 'ASC' },
    });

    let parentIssue: Issue | null = null;
    if (issue.parentId) {
      parentIssue = await this.issueRepository.findOne({
        where: { id: issue.parentId },
        relations: {
          project: true,
          reporter: true,
          assignee: true,
          sprint: true,
        },
      });
    }

    return this.mapIssueDetail(issue, attachments, links, subtasks, parentIssue);
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

    let parentId: number | null = null;
    if (dto.parentId) {
      const parent = await this.issueRepository.findOne({
        where: { id: dto.parentId },
        relations: { project: true },
      });
      if (!parent) {
        throw new NotFoundException(`Parent issue #${dto.parentId} not found`);
      }
      if (parent.parentId) {
        throw new BadRequestException('Subtasks cannot have nested subtasks');
      }
      if (parent.projectId !== dto.projectId) {
        throw new BadRequestException(`Parent issue #${dto.parentId} belongs to a different project`);
      }
      parentId = parent.id;
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

    const issueType = dto.issueType || (parentId ? IssueType.SUBTASK : IssueType.BUG);

    let assigneeId: number | null = dto.assigneeId || null;
    if (!assigneeId && dto.componentId) {
      const component = await this.componentRepository.findOne({
        where: { id: dto.componentId, projectId: dto.projectId },
      });
      if (component?.leadId) {
        assigneeId = component.leadId;
      }
    }

    const issue = this.issueRepository.create({
      projectId: dto.projectId,
      project,
      issueNum: nextIssueNum,
      title: dto.title.trim(),
      description: dto.description?.trim() || null,
      issueType,
      priority: dto.priority,
      estimatedHours: dto.estimatedHours || 0,
      sprintId,
      parentId,
      componentId: dto.componentId || null,
      fixVersionId: dto.fixVersionId || null,
      affectsVersionId: dto.affectsVersionId || null,
      labels: dto.labels || [],
      reporterId: reporter.id,
      reporter,
      assigneeId,
    });

    const saved = await this.issueRepository.save(issue);
    await this.logHistory(saved.id, 'status', null, saved.status, reporter.id);

    if (saved.assigneeId && saved.assigneeId !== reporter.id && this.notificationsService) {
      await this.notificationsService.createNotification({
        userId: saved.assigneeId,
        actorId: reporter.id,
        issueId: saved.id,
        type: NotificationType.ASSIGNED,
        title: `Assigned: ${project.key}-${saved.issueNum}`,
        message: `${reporter.fullName} assigned ${saved.title} to you`,
      });
    }

    const formatted = await this.findById(saved.id);
    await this.eventsGateway.broadcastIssueCreated(formatted);

    if (this.webhooksService) {
      await this.webhooksService.dispatch(saved.projectId, 'issue.created', {
        issue: formatted,
      });
    }

    return formatted;
  }

  /**
   * Updates issue status and broadcasts change.
   */
  async updateStatus(id: number, status: IssueStatus, user?: User): Promise<IssueDetailDto> {
    const issue = await this.issueRepository.findOne({ where: { id } });
    if (!issue) {
      throw new NotFoundException(`Issue with ID #${id} not found`);
    }
    const previousStatus = issue.status;
    await this.issueRepository.update(id, { status });
    await this.logHistory(id, 'status', previousStatus, status, user?.id);

    if (user && this.notificationsService) {
      const targetUserId =
        issue.assigneeId && issue.assigneeId !== user.id
          ? issue.assigneeId
          : issue.reporterId && issue.reporterId !== user.id
            ? issue.reporterId
            : null;

      if (targetUserId) {
        await this.notificationsService.createNotification({
          userId: targetUserId,
          actorId: user.id,
          issueId: id,
          type: NotificationType.STATUS_CHANGED,
          title: `Status changed: ${issue.title}`,
          message: `${user.fullName} updated status to ${status}`,
        });
      }
    }

    const updated = await this.findById(id);
    await this.eventsGateway.broadcastIssueUpdated(updated);

    if (
      (status === IssueStatus.RESOLVED || status === IssueStatus.CLOSED) &&
      issue.parentId
    ) {
      await this.checkAndAutoTransitionParent(issue.parentId, user);
    }

    if (this.webhooksService) {
      await this.webhooksService.dispatch(issue.projectId, 'status.changed', {
        issueId: issue.id,
        previousStatus,
        newStatus: status,
      });
      await this.webhooksService.dispatch(issue.projectId, 'issue.updated', {
        issue: updated,
      });
    }

    return updated;
  }

  /**
   * Assigns issue to currently authenticated user.
   */
  async assignToMe(id: number, user: User): Promise<IssueDetailDto> {
    const issue = await this.issueRepository.findOne({ where: { id }, relations: { assignee: true } });
    if (!issue) {
      throw new NotFoundException(`Issue with ID #${id} not found`);
    }
    const previousAssignee = issue.assignee?.fullName || (issue.assigneeId ? `User #${issue.assigneeId}` : 'Unassigned');
    issue.assigneeId = user.id;
    issue.assignee = user;
    await this.issueRepository.save(issue);
    await this.logHistory(id, 'assignee', previousAssignee, user.fullName, user.id);
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
  async update(id: number, dto: UpdateIssueDto, user?: User): Promise<IssueDetailDto> {
    const issue = await this.issueRepository.findOne({
      where: { id },
      relations: { sprint: true, component: true, assignee: true, reporter: true },
    });
    if (!issue) {
      throw new NotFoundException(`Issue with ID #${id} not found`);
    }
    if (dto.title && dto.title.trim() !== issue.title) {
      await this.logHistory(id, 'title', issue.title, dto.title.trim(), user?.id);
      issue.title = dto.title.trim();
    }
    if (dto.description !== undefined && dto.description?.trim() !== issue.description) {
      await this.logHistory(id, 'description', issue.description, dto.description?.trim() || null, user?.id);
      issue.description = dto.description?.trim() || null;
    }
    if (dto.issueType && dto.issueType !== issue.issueType) {
      await this.logHistory(id, 'issueType', issue.issueType, dto.issueType, user?.id);
      issue.issueType = dto.issueType;
    }
    if (dto.priority && dto.priority !== issue.priority) {
      await this.logHistory(id, 'priority', issue.priority, dto.priority, user?.id);
      issue.priority = dto.priority;
    }
    if (dto.estimatedHours !== undefined && dto.estimatedHours !== issue.estimatedHours) {
      await this.logHistory(id, 'estimatedHours', issue.estimatedHours, dto.estimatedHours, user?.id);
      issue.estimatedHours = dto.estimatedHours;
    }
    if (dto.sprintId !== undefined) {
      const prevSprint = issue.sprint?.name || 'Backlog';
      if (dto.sprintId) {
        const sprint = await this.sprintRepository.findOne({
          where: { id: dto.sprintId, projectId: issue.projectId },
        });
        if (!sprint) {
          throw new NotFoundException(`Sprint #${dto.sprintId} not found in project #${issue.projectId}`);
        }
        await this.logHistory(id, 'sprint', prevSprint, sprint.name, user?.id);
        issue.sprintId = sprint.id;
        issue.sprint = sprint;
      } else {
        await this.logHistory(id, 'sprint', prevSprint, 'Backlog', user?.id);
        issue.sprintId = null;
        issue.sprint = null;
      }
    }
    if (dto.assigneeId !== undefined && dto.assigneeId !== issue.assigneeId) {
      let assigneeUser: User | null = null;
      if (dto.assigneeId) {
        assigneeUser = await this.userRepository.findOne({ where: { id: dto.assigneeId } });
        if (!assigneeUser) {
          throw new NotFoundException(`Assignee user #${dto.assigneeId} not found`);
        }
      }
      const prevAssignee = issue.assignee?.fullName || (issue.assigneeId ? `User #${issue.assigneeId}` : 'Unassigned');
      const newAssignee = assigneeUser ? assigneeUser.fullName : 'Unassigned';
      await this.logHistory(id, 'assignee', prevAssignee, newAssignee, user?.id);
      issue.assigneeId = assigneeUser ? assigneeUser.id : null;
      issue.assignee = assigneeUser;

      if (dto.assigneeId && dto.assigneeId !== user?.id && this.notificationsService) {
        await this.notificationsService.createNotification({
          userId: dto.assigneeId,
          actorId: user?.id,
          issueId: issue.id,
          type: NotificationType.ASSIGNED,
          title: `Assigned: ${issue.title}`,
          message: `You were assigned to this issue by ${user?.fullName || 'a team member'}`,
        });
      }
    }
    if (dto.reporterId !== undefined && dto.reporterId !== issue.reporterId) {
      const reporterUser = await this.userRepository.findOne({ where: { id: dto.reporterId } });
      if (!reporterUser) {
        throw new NotFoundException(`Reporter user #${dto.reporterId} not found`);
      }
      const prevReporter = issue.reporter?.fullName || (issue.reporterId ? `User #${issue.reporterId}` : 'Unknown');
      await this.logHistory(id, 'reporter', prevReporter, reporterUser.fullName, user?.id);
      issue.reporterId = reporterUser.id;
      issue.reporter = reporterUser;
    }
    if (dto.fixVersionId !== undefined) {
      issue.fixVersionId = dto.fixVersionId || null;
    }
    if (dto.affectsVersionId !== undefined) {
      issue.affectsVersionId = dto.affectsVersionId || null;
    }
    if (dto.componentId !== undefined && dto.componentId !== issue.componentId) {
      let comp: ProjectComponent | null = null;
      if (dto.componentId) {
        comp = await this.componentRepository.findOne({
          where: { id: dto.componentId, projectId: issue.projectId },
        });
        if (!comp) {
          throw new NotFoundException(`Component #${dto.componentId} not found in project #${issue.projectId}`);
        }
      }
      const prevComp = issue.component?.name || 'None';
      await this.logHistory(id, 'component', prevComp, comp ? comp.name : 'None', user?.id);
      issue.componentId = comp ? comp.id : null;
      issue.component = comp;
    }
    if (dto.labels !== undefined) {
      const prevLabels = (issue.labels || []).join(', ');
      const newLabels = (dto.labels || []).join(', ');
      if (prevLabels !== newLabels) {
        await this.logHistory(id, 'labels', prevLabels || 'None', newLabels || 'None', user?.id);
        issue.labels = dto.labels;
      }
    }

    await this.issueRepository.save(issue);
    const updated = await this.findById(id);
    await this.eventsGateway.broadcastIssueUpdated(updated);

    if (this.webhooksService) {
      await this.webhooksService.dispatch(issue.projectId, 'issue.updated', {
        issue: updated,
      });
    }

    return updated;
  }

  /**
   * Deletes an issue by ID and broadcasts event.
   * Enforces project permissions and reporter grace period (24 hours on unstarted issues with zero worklogs).
   */
  async remove(id: number, user?: User): Promise<{ success: boolean; message: string }> {
    const issue = await this.issueRepository.findOne({
      where: { id },
      relations: { project: true },
    });
    if (!issue) {
      throw new NotFoundException(`Issue with ID #${id} not found`);
    }

    if (user && user.systemRole !== SystemRole.ADMIN) {
      const hasAdminPermission = await this.permissionEvaluator.hasPermission({
        userId: user.id,
        projectId: issue.projectId,
        permission: ProjectPermission.ADMINISTER_PROJECTS,
      });

      if (!hasAdminPermission) {
        const hasDeletePermission = await this.permissionEvaluator.hasPermission({
          userId: user.id,
          projectId: issue.projectId,
          permission: ProjectPermission.DELETE_ISSUES,
          issueId: issue.id,
        });

        if (!hasDeletePermission) {
          throw new ForbiddenException('You do not have permission to delete this issue');
        }

        // If granted via REPORTER status, enforce grace period constraints
        const isReporter = issue.reporterId === user.id;
        if (isReporter) {
          const isUnstarted = issue.status === IssueStatus.OPEN;
          const hasZeroWorklogs = !issue.loggedHours || Number(issue.loggedHours) === 0;
          const createdAtTime = new Date(issue.createdAt).getTime();
          const isWithin24Hours = Date.now() - createdAtTime <= 24 * 60 * 60 * 1000;

          if (!isUnstarted || !hasZeroWorklogs || !isWithin24Hours) {
            throw new ForbiddenException(
              'Reporters can only delete unstarted issues within 24 hours of creation and with 0 logged hours.',
            );
          }
        }
      }
    }

    const key = `${issue.project?.key || 'ISSUE'}-${issue.issueNum}`;
    const projectId = issue.projectId;
    await this.issueRepository.remove(issue);
    this.eventsGateway.broadcastIssueDeleted(id, projectId);

    if (this.webhooksService) {
      await this.webhooksService.dispatch(projectId, 'issue.deleted', {
        issueId: id,
        key,
      });
    }

    return {
      success: true,
      message: `Issue ${key} deleted successfully`,
    };
  }

  /**
   * Performs atomic bulk updates on issues (status, priority, assignee, sprint).
   */
  async bulkUpdate(dto: BulkUpdateIssuesDto, user: User): Promise<BulkOperationResultDto> {
    if (!dto.issueIds || dto.issueIds.length === 0) {
      throw new BadRequestException('At least one issue ID must be provided');
    }

    const uniqueIds = Array.from(new Set(dto.issueIds));
    const issues = await this.issueRepository.find({
      where: { id: In(uniqueIds) },
      relations: { project: true, sprint: true },
    });

    if (issues.length === 0) {
      throw new NotFoundException('No matching issues found for the provided IDs');
    }

    // Permission checks across all affected projects
    if (user.systemRole !== SystemRole.ADMIN) {
      const projectIds = Array.from(new Set(issues.map((i) => i.projectId)));
      for (const pId of projectIds) {
        const canEdit = await this.permissionEvaluator.hasPermission({
          userId: user.id,
          projectId: pId,
          permission: ProjectPermission.EDIT_ISSUES,
        });
        if (!canEdit) {
          throw new ForbiddenException(`You do not have permission to edit issues in project #${pId}`);
        }
      }
    }

    // Validate sprint if moving to sprint
    if (dto.sprintId !== undefined && dto.sprintId !== null) {
      const sprint = await this.sprintRepository.findOne({
        where: { id: dto.sprintId },
      });
      if (!sprint) {
        throw new NotFoundException(`Sprint #${dto.sprintId} not found`);
      }
      const invalidProjectIssue = issues.find((i) => i.projectId !== sprint.projectId);
      if (invalidProjectIssue) {
        throw new BadRequestException(
          `Issue #${invalidProjectIssue.id} does not belong to the sprint's project #${sprint.projectId}`,
        );
      }
    }

    const updatePayload: Partial<Issue> = {};
    if (dto.status !== undefined) updatePayload.status = dto.status;
    if (dto.priority !== undefined) updatePayload.priority = dto.priority;
    if (dto.assigneeId !== undefined) updatePayload.assigneeId = dto.assigneeId;
    if (dto.sprintId !== undefined) updatePayload.sprintId = dto.sprintId;

    if (Object.keys(updatePayload).length > 0) {
      await this.issueRepository.update({ id: In(issues.map((i) => i.id)) }, updatePayload);
    }

    for (const issue of issues) {
      const refreshed = await this.findById(issue.id);
      await this.eventsGateway.broadcastIssueUpdated(refreshed);

      if (this.webhooksService) {
        await this.webhooksService.dispatch(issue.projectId, 'issue.updated', {
          issue: refreshed,
        });
      }
    }

    if (dto.status === IssueStatus.RESOLVED || dto.status === IssueStatus.CLOSED) {
      const parentIds = Array.from(
        new Set(issues.filter((i) => i.parentId).map((i) => i.parentId!)),
      );
      for (const parentId of parentIds) {
        await this.checkAndAutoTransitionParent(parentId, user);
      }
    }

    return {
      success: true,
      affectedCount: issues.length,
      message: `Successfully updated ${issues.length} issue(s)`,
    };
  }

  /**
   * Performs atomic bulk deletion of issues.
   */
  async bulkDelete(dto: BulkDeleteIssuesDto, user: User): Promise<BulkOperationResultDto> {
    if (!dto.issueIds || dto.issueIds.length === 0) {
      throw new BadRequestException('At least one issue ID must be provided');
    }

    const uniqueIds = Array.from(new Set(dto.issueIds));
    const issues = await this.issueRepository.find({
      where: { id: In(uniqueIds) },
      relations: { project: true },
    });

    if (issues.length === 0) {
      throw new NotFoundException('No matching issues found for the provided IDs');
    }

    // Permission checks across all affected projects
    if (user.systemRole !== SystemRole.ADMIN) {
      const projectIds = Array.from(new Set(issues.map((i) => i.projectId)));
      for (const pId of projectIds) {
        const canDelete = await this.permissionEvaluator.hasPermission({
          userId: user.id,
          projectId: pId,
          permission: ProjectPermission.DELETE_ISSUES,
        });
        if (!canDelete) {
          throw new ForbiddenException(`You do not have permission to delete issues in project #${pId}`);
        }
      }
    }

    await this.issueRepository.remove(issues);

    for (const issue of issues) {
      this.eventsGateway.broadcastIssueDeleted(issue.id, issue.projectId);
    }

    return {
      success: true,
      affectedCount: issues.length,
      message: `Successfully deleted ${issues.length} issue(s)`,
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
      parentId: i.parentId ?? null,
      subtasksCount: Array.isArray(i.subtasks) ? i.subtasks.length : undefined,
      componentId: i.componentId ?? null,
      component: i.component
        ? {
            id: i.component.id,
            name: i.component.name,
            description: i.component.description,
          }
        : null,
      fixVersionId: i.fixVersionId ?? null,
      fixVersion: i.fixVersion
        ? {
            id: i.fixVersion.id,
            name: i.fixVersion.name,
            status: i.fixVersion.status,
          }
        : null,
      labels: i.labels || [],
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
    };
  }

  private mapIssueDetail(
    issue: Issue,
    attachments: Attachment[],
    links: IssueLinkItemDto[],
    subtasks: Issue[] = [],
    parent: Issue | null = null,
  ): IssueDetailDto {
    return {
      ...this.mapIssueSummary(issue),
      parent: parent ? this.mapIssueSummary(parent) : null,
      subtasks: subtasks.map((s) => this.mapIssueSummary(s)),
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

  /**
   * Retrieves change audit log history for an issue.
   */
  async getIssueHistory(issueId: number): Promise<IssueHistoryItemDto[]> {
    const history = await this.historyRepository.find({
      where: { issueId },
      order: { createdAt: 'DESC' },
      relations: { user: true },
    });
    return history.map((h) => ({
      id: h.id,
      issueId: h.issueId,
      field: h.field,
      oldValue: h.oldValue,
      newValue: h.newValue,
      user: h.user
        ? {
            id: h.user.id,
            fullName: h.user.fullName,
            email: h.user.email,
            avatarUrl: h.user.avatarUrl,
          }
        : null,
      createdAt: h.createdAt,
    }));
  }
}
