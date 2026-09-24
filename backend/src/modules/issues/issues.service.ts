import { EventsGateway } from '../events/events.gateway.js';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Issue, IssueStatus } from './entities/issue.entity.js';
import { Comment } from './entities/comment.entity.js';
import { Worklog } from './entities/worklog.entity.js';
import { Attachment } from './entities/attachment.entity.js';
import { SeaweedFsService, type UploadedFileInput } from './services/seaweedfs.service.js';
import { Project } from '../projects/entities/project.entity.js';
import { User } from '../users/entities/user.entity.js';
import { CreateIssueDto } from './dto/create-issue.dto.js';
import { ListIssuesQueryDto } from './dto/list-issues-query.dto.js';
import { LogWorkDto } from './dto/log-work.dto.js';

@Injectable()
export class IssuesService {
  constructor(
    @InjectRepository(Issue)
    private readonly issueRepository: Repository<Issue>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Worklog)
    private readonly worklogRepository: Repository<Worklog>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Attachment)
    private readonly attachmentRepository: Repository<Attachment>,
    private readonly seaweedFsService: SeaweedFsService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  /**
   * Retrieves list of issues with comprehensive multi-criteria filtering.
   */
  async findAll(query: ListIssuesQueryDto): Promise<any[]> {
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

    return issues.map((i: any) => ({
      id: i.id,
      key: `${i.project.key}-${i.issueNum}`,
      projectId: i.projectId,
      projectKey: i.project.key,
      projectName: i.project.name,
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
      reporter: {
        id: i.reporter?.id,
        fullName: i.reporter?.fullName,
        email: i.reporter?.email,
        avatarUrl: i.reporter?.avatarUrl || null,
        systemRole: i.reporter?.systemRole,
      },
      assignee: i.assignee
        ? {
            id: i.assignee.id,
            fullName: i.assignee.fullName,
            email: i.assignee.email,
            avatarUrl: i.assignee.avatarUrl || null,
            systemRole: i.assignee.systemRole,
          }
        : null,
      commentsCount: Array.isArray(i.commentIds) ? i.commentIds.length : 0,
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
    }));
  }

  /**
   * Retrieves single issue with relations, full comments thread, and worklog history.
   */
  async findById(id: number): Promise<any> {
    const issue = await this.issueRepository.findOne({
      where: { id },
      relations: {
        project: true,
        reporter: true,
        assignee: true,
        comments: {
          author: true,
        },
        worklogs: {
          user: true,
        },
      },
      order: {
        comments: {
          createdAt: 'ASC',
        },
        worklogs: {
          createdAt: 'DESC',
        },
      },
    });

    if (!issue) {
      throw new NotFoundException(`Issue with ID #${id} not found`);
    }

    const attachments = await this.attachmentRepository.find({
      where: { issueId: id },
      relations: { uploader: true },
      order: { createdAt: 'DESC' },
    });

    return {
      id: issue.id,
      key: `${issue.project.key}-${issue.issueNum}`,
      projectId: issue.projectId,
      projectKey: issue.project.key,
      projectName: issue.project.name,
      issueNum: issue.issueNum,
      title: issue.title,
      description: issue.description,
      issueType: issue.issueType,
      status: issue.status,
      priority: issue.priority,
      severity: issue.severity,
      estimatedHours: issue.estimatedHours || 0,
      loggedHours: issue.loggedHours || 0,
      sprint: issue.sprint || null,
      reporter: {
        id: issue.reporter?.id,
        fullName: issue.reporter?.fullName,
        email: issue.reporter?.email,
        avatarUrl: issue.reporter?.avatarUrl || null,
        systemRole: issue.reporter?.systemRole,
      },
      assignee: issue.assignee
        ? {
            id: issue.assignee.id,
            fullName: issue.assignee.fullName,
            email: issue.assignee.email,
            avatarUrl: issue.assignee.avatarUrl || null,
            systemRole: issue.assignee.systemRole,
          }
        : null,
      comments: (issue.comments || []).map((c) => ({
        id: c.id,
        text: c.text,
        author: {
          id: c.author?.id,
          fullName: c.author?.fullName,
          email: c.author?.email,
          avatarUrl: c.author?.avatarUrl || null,
          systemRole: c.author?.systemRole,
        },
        createdAt: c.createdAt,
      })),
      worklogs: (issue.worklogs || []).map((w) => ({
        id: w.id,
        timeSpentHours: w.timeSpentHours,
        dateLogged: w.dateLogged,
        description: w.description,
        createdAt: w.createdAt,
        user: {
          id: w.user?.id,
          fullName: w.user?.fullName,
          email: w.user?.email,
          avatarUrl: w.user?.avatarUrl || null,
          systemRole: w.user?.systemRole,
        },
      })),
      attachments: (attachments || []).map((a) => ({
        id: a.id,
        filename: a.filename,
        fileSize: a.fileSize,
        mimeType: a.mimeType,
        fid: a.fid,
        url: a.url,
        createdAt: a.createdAt,
        uploader: a.uploader
          ? {
              id: a.uploader.id,
              fullName: a.uploader.fullName,
              email: a.uploader.email,
              avatarUrl: a.uploader.avatarUrl || null,
              systemRole: a.uploader.systemRole,
            }
          : null,
      })),
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
    };
  }

  /**
   * Creates a new issue, auto-incrementing issue_num within the project.
   */
  async create(dto: CreateIssueDto, reporter: User): Promise<any> {
    const project = await this.projectRepository.findOne({
      where: { id: dto.projectId },
    });

    if (!project) {
      throw new BadRequestException(`Project #${dto.projectId} does not exist`);
    }

    // Determine the next sequential issue number for this project
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
   * Updates issue FSM status (e.g. from OPEN to IN_PROGRESS, REVIEW, RESOLVED, CLOSED).
   */
  async updateStatus(id: number, status: IssueStatus): Promise<any> {
    await this.issueRepository.update(id, { status });
    const updated = await this.findById(id);
    this.eventsGateway.broadcastIssueUpdated(updated);
    return updated;
  }

  /**
   * Assigns the issue directly to the currently authenticated user (Self-Assignment).
   */
  async assignToMe(id: number, user: User): Promise<any> {
    const issue = await this.issueRepository.findOne({ where: { id } });
    if (!issue) {
      throw new NotFoundException(`Issue with ID #${id} not found`);
    }

    const attachments = await this.attachmentRepository.find({
      where: { issueId: id },
      relations: { uploader: true },
      order: { createdAt: 'DESC' },
    });

    issue.assigneeId = user.id;
    await this.issueRepository.save(issue);
    const updated = await this.findById(id);
    this.eventsGateway.broadcastIssueUpdated(updated);
    return updated;
  }

  /**
   * Updates sprint assignment for agile planning (e.g. 'Sprint 1', or null for Backlog).
   */
  async updateSprint(id: number, sprint: string | null): Promise<any> {
    const issue = await this.issueRepository.findOne({ where: { id } });
    if (!issue) {
      throw new NotFoundException(`Issue with ID #${id} not found`);
    }

    const attachments = await this.attachmentRepository.find({
      where: { issueId: id },
      relations: { uploader: true },
      order: { createdAt: 'DESC' },
    });

    issue.sprint = sprint ? sprint.trim() : null;
    await this.issueRepository.save(issue);
    const updated = await this.findById(id);
    this.eventsGateway.broadcastIssueUpdated(updated);
    return updated;
  }

  /**
   * Logs hours spent on an issue and increments total logged hours.
   */
  async logWork(issueId: number, user: User, dto: LogWorkDto): Promise<any> {
    const issue = await this.issueRepository.findOne({ where: { id: issueId } });
    if (!issue) {
      throw new NotFoundException(`Issue #${issueId} not found`);
    }

    const worklog = this.worklogRepository.create({
      issueId,
      userId: user.id,
      timeSpentHours: dto.timeSpentHours,
      dateLogged: dto.dateLogged || new Date().toISOString().split('T')[0],
      description: dto.description?.trim() || null,
    });

    await this.worklogRepository.save(worklog);

    // Update issue total logged hours
    const currentLogged = issue.loggedHours || 0;
    issue.loggedHours = Number((currentLogged + dto.timeSpentHours).toFixed(2));
    await this.issueRepository.save(issue);

    const updated = await this.findById(issueId);
    this.eventsGateway.broadcastWorklogAdded({
      issueId,
      projectId: issue.projectId,
      worklog,
    });
    this.eventsGateway.broadcastIssueUpdated(updated);
    return updated;
  }

  /**
   * Retrieves worklogs for a specific issue.
   */
  async getWorklogs(issueId: number): Promise<any[]> {
    const logs = await this.worklogRepository.find({
      where: { issueId },
      order: { createdAt: 'DESC' },
    });

    return logs.map((w) => ({
      id: w.id,
      timeSpentHours: w.timeSpentHours,
      dateLogged: w.dateLogged,
      description: w.description,
      createdAt: w.createdAt,
      user: {
        id: w.user?.id,
        fullName: w.user?.fullName,
        email: w.user?.email,
        avatarUrl: w.user?.avatarUrl || null,
      },
    }));
  }

  /**
   * Retrieves recent worklogs logged by the current user.
   */
  async getMyWorklogs(userId: number, limit = 20): Promise<any[]> {
    const logs = await this.worklogRepository
      .createQueryBuilder('worklog')
      .leftJoinAndSelect('worklog.issue', 'issue')
      .leftJoinAndSelect('issue.project', 'project')
      .where('worklog.userId = :userId', { userId })
      .orderBy('worklog.createdAt', 'DESC')
      .take(limit)
      .getMany();

    return logs.map((w: any) => ({
      id: w.id,
      timeSpentHours: w.timeSpentHours,
      dateLogged: w.dateLogged,
      description: w.description,
      createdAt: w.createdAt,
      issue: w.issue
        ? {
            id: w.issue.id,
            key: `${w.issue.project?.key}-${w.issue.issueNum}`,
            title: w.issue.title,
            status: w.issue.status,
            priority: w.issue.priority,
            projectName: w.issue.project?.name,
          }
        : null,
    }));
  }

  /**
   * Retrieves aggregated time tracking analytics across projects and users.
   */
  
  /**
   * Retrieves a matrix of worklogs for the team across dates (Team Timesheet Matrix).
   */
  async getTeamTimesheetMatrix(startDate?: string, endDate?: string): Promise<{
    startDate: string;
    endDate: string;
    days: string[];
    members: Array<{
      userId: number;
      fullName: string;
      email: string;
      systemRole: string;
      avatarUrl: string | null;
      dailyHours: Record<string, number>;
      totalPeriodHours: number;
    }>;
    dailyTotals: Record<string, number>;
    grandTotal: number;
  }> {
    const now = new Date();
    const end = endDate ? new Date(endDate) : now;
    const start = startDate
      ? new Date(startDate)
      : new Date(end.getTime() - 13 * 24 * 60 * 60 * 1000);

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    const days: string[] = [];
    const curr = new Date(start);
    while (curr <= end) {
      days.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
    }

    const users = await this.userRepository.find({
      where: { isActivated: true, isBlocked: false },
      order: { fullName: 'ASC' },
    });

    const logs = await this.worklogRepository
      .createQueryBuilder('worklog')
      .where('worklog.dateLogged >= :startStr AND worklog.dateLogged <= :endStr', {
        startStr,
        endStr,
      })
      .getMany();

    const dailyTotals: Record<string, number> = {};
    for (const d of days) {
      dailyTotals[d] = 0;
    }
    let grandTotal = 0;

    const userLogsMap: Record<number, Record<string, number>> = {};
    for (const u of users) {
      userLogsMap[u.id] = {};
      for (const d of days) {
        userLogsMap[u.id][d] = 0;
      }
    }

    for (const log of logs) {
      const uId = log.userId;
      const date = log.dateLogged;
      const hours = log.timeSpentHours || 0;

      if (!userLogsMap[uId]) {
        userLogsMap[uId] = {};
        for (const d of days) userLogsMap[uId][d] = 0;
      }

      userLogsMap[uId][date] = Number(((userLogsMap[uId][date] || 0) + hours).toFixed(2));
      dailyTotals[date] = Number(((dailyTotals[date] || 0) + hours).toFixed(2));
      grandTotal += hours;
    }

    const members = users.map((u) => {
      const dHours = userLogsMap[u.id] || {};
      const totalPeriodHours = Object.values(dHours).reduce((a, b) => a + b, 0);
      return {
        userId: u.id,
        fullName: u.fullName,
        email: u.email,
        systemRole: u.systemRole,
        avatarUrl: u.avatarUrl || null,
        dailyHours: dHours,
        totalPeriodHours: Number(totalPeriodHours.toFixed(2)),
      };
    });

    return {
      startDate: startStr,
      endDate: endStr,
      days,
      members,
      dailyTotals,
      grandTotal: Number(grandTotal.toFixed(2)),
    };
  }

  async getWorklogStats(): Promise<{
    totalHoursLogged: number;
    hoursLoggedToday: number;
    hoursLoggedThisWeek: number;
    byProject: Array<{ projectId: number; projectName: string; projectKey: string; totalHours: number }>;
    byUser: Array<{ userId: number; fullName: string; email: string; avatarUrl: string | null; totalHours: number }>;
  }> {
    const allLogs = await this.worklogRepository
      .createQueryBuilder('worklog')
      .leftJoinAndSelect('worklog.issue', 'issue')
      .leftJoinAndSelect('issue.project', 'project')
      .leftJoinAndSelect('worklog.user', 'user')
      .getMany();

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let totalHoursLogged = 0;
    let hoursLoggedToday = 0;
    let hoursLoggedThisWeek = 0;

    const projectMap: Record<number, { projectId: number; projectName: string; projectKey: string; totalHours: number }> = {};
    const userMap: Record<number, { userId: number; fullName: string; email: string; avatarUrl: string | null; totalHours: number }> = {};

    for (const log of allLogs) {
      const hours = log.timeSpentHours || 0;
      totalHoursLogged += hours;

      if (log.dateLogged === todayStr) {
        hoursLoggedToday += hours;
      }
      if (new Date(log.createdAt) >= sevenDaysAgo) {
        hoursLoggedThisWeek += hours;
      }

      // Aggregate by project
      if (log.issue?.project) {
        const p = log.issue.project;
        if (!projectMap[p.id]) {
          projectMap[p.id] = {
            projectId: p.id,
            projectName: p.name,
            projectKey: p.key,
            totalHours: 0,
          };
        }
        projectMap[p.id].totalHours += hours;
      }

      // Aggregate by user
      if (log.user) {
        const u = log.user;
        if (!userMap[u.id]) {
          userMap[u.id] = {
            userId: u.id,
            fullName: u.fullName,
            email: u.email,
            avatarUrl: u.avatarUrl || null,
            totalHours: 0,
          };
        }
        userMap[u.id].totalHours += hours;
      }
    }

    return {
      totalHoursLogged: Number(totalHoursLogged.toFixed(2)),
      hoursLoggedToday: Number(hoursLoggedToday.toFixed(2)),
      hoursLoggedThisWeek: Number(hoursLoggedThisWeek.toFixed(2)),
      byProject: Object.values(projectMap).map((p) => ({
        ...p,
        totalHours: Number(p.totalHours.toFixed(2)),
      })),
      byUser: Object.values(userMap).map((u) => ({
        ...u,
        totalHours: Number(u.totalHours.toFixed(2)),
      })),
    };
  }

  /**
   * Updates issue metadata and assignments.
   */
  async update(id: number, dto: Partial<CreateIssueDto>): Promise<any> {
    const issue = await this.issueRepository.findOne({ where: { id } });
    if (!issue) {
      throw new NotFoundException(`Issue with ID #${id} not found`);
    }

    const attachments = await this.attachmentRepository.find({
      where: { issueId: id },
      relations: { uploader: true },
      order: { createdAt: 'DESC' },
    });

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
   * Deletes an issue by ID.
   */
  async remove(id: number): Promise<{ success: boolean; message: string }> {
    const issue = await this.issueRepository.findOne({
      where: { id },
      relations: { project: true },
    });

    if (!issue) {
      throw new NotFoundException(`Issue with ID #${id} not found`);
    }

    const attachments = await this.attachmentRepository.find({
      where: { issueId: id },
      relations: { uploader: true },
      order: { createdAt: 'DESC' },
    });

    const key = `${issue.project?.key || 'ISSUE'}-${issue.issueNum}`;
    const projectId = issue.projectId;
    await this.issueRepository.remove(issue);
    this.eventsGateway.broadcastIssueDeleted(id, projectId);

    return {
      success: true,
      message: `Issue ${key} deleted successfully`,
    };
  }

  /**
   * Adds a discussion comment to an issue.
   */
  async addComment(issueId: number, text: string, author: User): Promise<any> {
    const issue = await this.issueRepository.findOne({ where: { id: issueId } });
    if (!issue) {
      throw new NotFoundException(`Issue #${issueId} not found`);
    }

    const comment = this.commentRepository.create({
      issueId,
      issue,
      authorId: author.id,
      author,
      text: text.trim(),
    });

    const saved = await this.commentRepository.save(comment);

    const commentPayload = {
      id: saved.id,
      text: saved.text,
      author: {
        id: author.id,
        fullName: author.fullName,
        email: author.email,
        avatarUrl: author.avatarUrl || null,
        systemRole: author.systemRole,
      },
      createdAt: saved.createdAt,
    };
    this.eventsGateway.broadcastCommentAdded({ issueId, comment: commentPayload });
    return commentPayload;
  }

  /**
   * Uploads evidence or file attachment to SeaweedFS and registers it to the issue.
   */
  async uploadAttachment(issueId: number, file: UploadedFileInput, uploader: User): Promise<Attachment> {
    const issue = await this.issueRepository.findOne({ where: { id: issueId } });
    if (!issue) {
      throw new NotFoundException(`Issue with ID #${issueId} not found`);
    }

    const { fid, url } = await this.seaweedFsService.uploadFile(file);

    const attachment = this.attachmentRepository.create({
      issueId,
      filename: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      fid,
      url,
      uploaderId: uploader.id,
      uploader,
    });

    const saved = await this.attachmentRepository.save(attachment);
    this.eventsGateway.broadcastAttachmentUploaded({ issueId, attachment: saved });
    return saved;
  }

  /**
   * Returns list of attachments for an issue.
   */
  async getAttachments(issueId: number): Promise<Attachment[]> {
    return this.attachmentRepository.find({
      where: { issueId },
      relations: { uploader: true },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Deletes an attachment from SeaweedFS and database.
   */
  async deleteAttachment(issueId: number, attachmentId: number, user: User): Promise<{ message: string }> {
    const attachment = await this.attachmentRepository.findOne({
      where: { id: attachmentId, issueId },
    });

    if (!attachment) {
      throw new NotFoundException(`Attachment #${attachmentId} not found`);
    }

    if (attachment.uploaderId !== user.id && user.systemRole !== 'ADMIN') {
      throw new BadRequestException('Only the uploader or system administrators can delete this attachment');
    }

    await this.seaweedFsService.deleteFile(attachment.fid);
    await this.attachmentRepository.delete(attachmentId);

    return { message: 'Attachment deleted successfully' };
  }
}
