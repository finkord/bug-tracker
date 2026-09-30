import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Worklog } from '../entities/worklog.entity.js';
import { Issue } from '../entities/issue.entity.js';
import { User, SystemRole } from '../../users/entities/user.entity.js';
import { EventsGateway } from '../../events/events.gateway.js';
import { PermissionEvaluatorService } from '../../rbac/services/permission-evaluator.service.js';
import { ProjectPermission } from '../../rbac/entities/permission-grant.entity.js';
import { LogWorkDto } from '../dto/log-work.dto.js';
import type {
  WorklogItemDto,
  MyWorklogItemDto,
  PaginatedWorklogsResponseDto,
  TimesheetMatrixResponseDto,
  WorklogStatsResponseDto,
  TimesheetMemberDto,
  TimesheetMemberWorklogDto,
} from '../dto/issue-response.dto.js';

/**
 * Service responsible for work logging, atomic time tracking, timesheet matrices, and analytics.
 */
@Injectable()
export class IssueWorklogService {
  constructor(
    @InjectRepository(Issue)
    private readonly issueRepository: Repository<Issue>,
    @InjectRepository(Worklog)
    private readonly worklogRepository: Repository<Worklog>,
    private readonly dataSource: DataSource,
    private readonly eventsGateway: EventsGateway,
    private readonly permissionEvaluator: PermissionEvaluatorService,
  ) {}

  /**
   * Logs hours spent on an issue and increments the issue's total logged hours atomically.
   */
  async logWork(issueId: number, user: User, dto: LogWorkDto): Promise<Worklog> {
    return await this.dataSource.transaction(async (manager) => {
      const issue = await manager.findOne(Issue, { where: { id: issueId } });
      if (!issue) {
        throw new NotFoundException(`Issue #${issueId} not found`);
      }

      const hasPermission = await this.permissionEvaluator.hasPermission({
        userId: user.id,
        projectId: issue.projectId,
        permission: ProjectPermission.LOG_WORK,
      });
      if (!hasPermission) {
        throw new ForbiddenException('You do not have permission to log work on this project');
      }

      const hours = Number(Number(dto.timeSpentHours).toFixed(2));
      const dateLogged = dto.dateLogged || new Date().toISOString().split('T')[0];

      const worklog = manager.create(Worklog, {
        issueId,
        userId: user.id,
        timeSpentHours: hours,
        dateLogged,
        description: dto.description?.trim() || null,
      });
      const savedWorklog = await manager.save(worklog);

      // Atomic database update preventing race conditions
      await manager
        .createQueryBuilder()
        .update(Issue)
        .set({
          loggedHours: () => `ROUND((COALESCE(logged_hours, 0) + ${hours})::numeric, 2)`,
        })
        .where('id = :issueId', { issueId })
        .execute();

      this.eventsGateway.broadcastWorklogAdded({
        issueId,
        projectId: issue.projectId,
        worklog: savedWorklog,
      });

      return savedWorklog;
    });
  }

  /**
   * Deletes a worklog and decrements the issue's total logged hours atomically.
   */
  async deleteWorklog(
    issueId: number,
    worklogId: number,
    user: User,
  ): Promise<{ success: boolean; issueId: number; projectId: number }> {
    return await this.dataSource.transaction(async (manager) => {
      const worklog = await manager.findOne(Worklog, { where: { id: worklogId, issueId } });
      if (!worklog) {
        throw new NotFoundException(`Worklog #${worklogId} for Issue #${issueId} not found`);
      }

      const issue = await manager.findOne(Issue, { where: { id: issueId } });
      if (!issue) {
        throw new NotFoundException(`Issue #${issueId} not found`);
      }

      const isAuthor = worklog.userId === user.id;
      const isSystemAdmin = user.systemRole === SystemRole.ADMIN;
      const hasAdminPermission = await this.permissionEvaluator.hasPermission({
        userId: user.id,
        projectId: issue.projectId,
        permission: ProjectPermission.ADMINISTER_PROJECTS,
      });

      if (!isAuthor && !isSystemAdmin && !hasAdminPermission) {
        throw new ForbiddenException('You do not have permission to delete this worklog');
      }

      const hours = Number(Number(worklog.timeSpentHours).toFixed(2));
      await manager.remove(worklog);

      // Atomic database decrement preventing race conditions and keeping >= 0
      await manager
        .createQueryBuilder()
        .update(Issue)
        .set({
          loggedHours: () => `GREATEST(ROUND((COALESCE(logged_hours, 0) - ${hours})::numeric, 2), 0)`,
        })
        .where('id = :issueId', { issueId })
        .execute();

      return { success: true, issueId: issue.id, projectId: issue.projectId };
    });
  }

  /**
   * Retrieves all worklogs for a given issue ID.
   */
  async getWorklogs(issueId: number): Promise<WorklogItemDto[]> {
    const logs = await this.worklogRepository.find({
      where: { issueId },
      relations: { user: true },
      order: { createdAt: 'DESC' },
      take: 200,
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
        systemRole: w.user?.systemRole,
      },
    }));
  }

  /**
   * Retrieves recent worklogs logged by the current user with server-side pagination.
   */
  async getMyWorklogs(userId: number, page = 1, limit = 20): Promise<PaginatedWorklogsResponseDto> {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    const [logs, total] = await this.worklogRepository
      .createQueryBuilder('worklog')
      .leftJoinAndSelect('worklog.issue', 'issue')
      .leftJoinAndSelect('issue.project', 'project')
      .where('worklog.userId = :userId', { userId })
      .orderBy('worklog.dateLogged', 'DESC')
      .addOrderBy('worklog.createdAt', 'DESC')
      .skip(offset)
      .take(limitNum)
      .getManyAndCount();

    const items: MyWorklogItemDto[] = logs.map((w) => ({
      id: w.id,
      timeSpentHours: w.timeSpentHours,
      dateLogged: w.dateLogged,
      description: w.description,
      createdAt: w.createdAt,
      issue: w.issue
        ? {
            id: w.issue.id,
            key: `${w.issue.project?.key || 'ISSUE'}-${w.issue.issueNum}`,
            title: w.issue.title,
            status: w.issue.status,
            priority: w.issue.priority,
            projectName: w.issue.project?.name,
          }
        : null,
    }));

    return {
      items,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    };
  }

  /**
   * Generates team timesheet matrix across dates with clamped bounds and project scoping.
   */
  async getTeamTimesheetMatrix(
    user: User,
    startDate?: string,
    endDate?: string,
    projectId?: number,
    userId?: number,
  ): Promise<TimesheetMatrixResponseDto> {
    const { startStr, endStr, days } = this.calculateDateRange(startDate, endDate);
    const accessibleProjectIds = await this.permissionEvaluator.getAccessibleProjectIds(user.id);

    if (accessibleProjectIds !== 'ALL' && accessibleProjectIds.length === 0) {
      return {
        startDate: startStr,
        endDate: endStr,
        days,
        members: [],
        dailyTotals: {},
        grandTotal: 0,
      };
    }

    if (projectId) {
      if (accessibleProjectIds !== 'ALL' && !accessibleProjectIds.includes(projectId)) {
        return {
          startDate: startStr,
          endDate: endStr,
          days,
          members: [],
          dailyTotals: {},
          grandTotal: 0,
        };
      }
    }

    const qb = this.worklogRepository
      .createQueryBuilder('worklog')
      .innerJoin('worklog.issue', 'issue')
      .leftJoin('issue.project', 'project')
      .leftJoinAndSelect('worklog.user', 'user')
      .select([
        'worklog.id',
        'worklog.userId',
        'worklog.issueId',
        'worklog.timeSpentHours',
        'worklog.dateLogged',
        'worklog.description',
        'issue.id',
        'issue.issueNum',
        'issue.title',
        'project.key',
        'user.id',
        'user.fullName',
        'user.email',
        'user.systemRole',
        'user.avatarUrl',
      ])
      .where('worklog.dateLogged >= :startStr AND worklog.dateLogged <= :endStr', {
        startStr,
        endStr,
      });

    if (projectId) {
      qb.andWhere('issue.projectId = :projectId', { projectId });
    } else if (accessibleProjectIds !== 'ALL') {
      qb.andWhere('issue.projectId IN (:...accessibleProjectIds)', { accessibleProjectIds });
    }

    if (userId) {
      qb.andWhere('worklog.userId = :userId', { userId });
    }

    const logs = await qb.getMany();

    // Derive unique users from the period's worklogs (zero unbounded SELECT from users table)
    const userMap = new Map<number, User>();
    for (const log of logs) {
      if (log.user && !userMap.has(log.userId)) {
        userMap.set(log.userId, log.user);
      }
    }
    const users = [...userMap.values()].sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));

    const dailyTotals: Record<string, number> = {};
    for (const d of days) dailyTotals[d] = 0;
    let grandTotal = 0;

    const userLogsMap: Record<number, Record<string, number>> = {};
    const userWorklogsMap: Record<number, Record<string, TimesheetMemberWorklogDto[]>> = {};

    for (const u of users) {
      userLogsMap[u.id] = {};
      userWorklogsMap[u.id] = {};
      for (const d of days) {
        userLogsMap[u.id][d] = 0;
        userWorklogsMap[u.id][d] = [];
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
      if (!userWorklogsMap[uId]) {
        userWorklogsMap[uId] = {};
        for (const d of days) userWorklogsMap[uId][d] = [];
      }
      if (!userWorklogsMap[uId][date]) {
        userWorklogsMap[uId][date] = [];
      }
      const issueKey = log.issue
        ? `${log.issue.project?.key || 'ISSUE'}-${log.issue.issueNum}`
        : undefined;
      userLogsMap[uId][date] = Number(((userLogsMap[uId][date] || 0) + hours).toFixed(2));
      userWorklogsMap[uId][date].push({
        id: log.id,
        issueId: log.issueId,
        issueKey,
        issueTitle: log.issue?.title,
        timeSpentHours: log.timeSpentHours,
        description: log.description || undefined,
      });
      dailyTotals[date] = Number(((dailyTotals[date] || 0) + hours).toFixed(2));
      grandTotal += hours;
    }

    const members: TimesheetMemberDto[] = users.map((u) => {
      const dHours = userLogsMap[u.id] || {};
      const dWorklogs = userWorklogsMap[u.id] || {};
      const totalPeriodHours = Object.values(dHours).reduce((a, b) => a + b, 0);
      return {
        userId: u.id,
        fullName: u.fullName,
        email: u.email,
        systemRole: u.systemRole,
        avatarUrl: u.avatarUrl || null,
        dailyHours: dHours,
        dailyWorklogs: dWorklogs,
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

  /**
   * Retrieves aggregated time tracking analytics across projects and users via native PostgreSQL SQL aggregations.
   * Completely avoids loading worklogs into Node.js heap memory (OOM prevention).
   */
  async getWorklogStats(user: User): Promise<WorklogStatsResponseDto> {
    const accessibleProjectIds = await this.permissionEvaluator.getAccessibleProjectIds(user.id);
    if (accessibleProjectIds !== 'ALL' && accessibleProjectIds.length === 0) {
      return {
        totalHoursLogged: 0,
        hoursLoggedToday: 0,
        hoursLoggedThisWeek: 0,
        byProject: [],
        byUser: [],
      };
    }

    // 1. Scalar totals via SQL aggregation
    const scalarQuery = this.worklogRepository
      .createQueryBuilder('worklog')
      .innerJoin('worklog.issue', 'issue')
      .select([
        'COALESCE(ROUND(SUM(worklog.timeSpentHours)::numeric, 2), 0)::float AS "totalHoursLogged"',
        'COALESCE(ROUND(SUM(CASE WHEN worklog.dateLogged = CURRENT_DATE THEN worklog.timeSpentHours ELSE 0 END)::numeric, 2), 0)::float AS "hoursLoggedToday"',
        'COALESCE(ROUND(SUM(CASE WHEN worklog.createdAt >= NOW() - INTERVAL \'7 days\' THEN worklog.timeSpentHours ELSE 0 END)::numeric, 2), 0)::float AS "hoursLoggedThisWeek"',
      ]);

    if (accessibleProjectIds !== 'ALL') {
      scalarQuery.where('issue.projectId IN (:...projectIds)', { projectIds: accessibleProjectIds });
    }

    const scalarResult = await scalarQuery.getRawOne();

    // 2. Project breakdown via SQL GROUP BY
    const projectQuery = this.worklogRepository
      .createQueryBuilder('worklog')
      .innerJoin('worklog.issue', 'issue')
      .innerJoin('issue.project', 'project')
      .select([
        'project.id AS "projectId"',
        'project.name AS "projectName"',
        'project.key AS "projectKey"',
        'ROUND(SUM(worklog.timeSpentHours)::numeric, 2)::float AS "totalHours"',
      ]);

    if (accessibleProjectIds !== 'ALL') {
      projectQuery.where('issue.projectId IN (:...projectIds)', { projectIds: accessibleProjectIds });
    }

    projectQuery
      .groupBy('project.id')
      .addGroupBy('project.name')
      .addGroupBy('project.key')
      .orderBy('"totalHours"', 'DESC')
      .limit(50);

    const projectResult = await projectQuery.getRawMany();

    // 3. User breakdown via SQL GROUP BY
    const userQuery = this.worklogRepository
      .createQueryBuilder('worklog')
      .innerJoin('worklog.issue', 'issue')
      .innerJoin('worklog.user', 'user')
      .select([
        'user.id AS "userId"',
        'user.fullName AS "fullName"',
        'user.email AS "email"',
        'user.avatarUrl AS "avatarUrl"',
        'ROUND(SUM(worklog.timeSpentHours)::numeric, 2)::float AS "totalHours"',
      ]);

    if (accessibleProjectIds !== 'ALL') {
      userQuery.where('issue.projectId IN (:...projectIds)', { projectIds: accessibleProjectIds });
    }

    userQuery
      .groupBy('user.id')
      .addGroupBy('user.fullName')
      .addGroupBy('user.email')
      .addGroupBy('user.avatarUrl')
      .orderBy('"totalHours"', 'DESC')
      .limit(50);

    const userResult = await userQuery.getRawMany();

    return {
      totalHoursLogged: Number(scalarResult?.totalHoursLogged || 0),
      hoursLoggedToday: Number(scalarResult?.hoursLoggedToday || 0),
      hoursLoggedThisWeek: Number(scalarResult?.hoursLoggedThisWeek || 0),
      byProject: projectResult.map((p) => ({
        projectId: Number(p.projectId),
        projectName: p.projectName,
        projectKey: p.projectKey,
        totalHours: Number(p.totalHours || 0),
      })),
      byUser: userResult.map((u) => ({
        userId: Number(u.userId),
        fullName: u.fullName,
        email: u.email,
        avatarUrl: u.avatarUrl || null,
        totalHours: Number(u.totalHours || 0),
      })),
    };
  }

  /**
   * Calculates date range clamped to a maximum of 62 days (2 months) to avoid DoS attacks.
   */
  private calculateDateRange(startDate?: string, endDate?: string): { startStr: string; endStr: string; days: string[] } {
    const now = new Date();
    const defaultEndStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const endStr = endDate || defaultEndStr;
    let startStr = startDate;
    if (!startStr) {
      const [eY, eM, eD] = endStr.split('-').map(Number);
      const sDate = new Date(eY, eM - 1, eD);
      sDate.setDate(sDate.getDate() - 13);
      startStr = `${sDate.getFullYear()}-${String(sDate.getMonth() + 1).padStart(2, '0')}-${String(sDate.getDate()).padStart(2, '0')}`;
    }

    const [sY, sM, sD] = startStr.split('-').map(Number);
    const [eY, eM, eD] = endStr.split('-').map(Number);
    let sDateObj = new Date(sY, sM - 1, sD);
    const eDateObj = new Date(eY, eM - 1, eD);
    const maxDiffMs = 62 * 24 * 60 * 60 * 1000;
    if (eDateObj.getTime() - sDateObj.getTime() > maxDiffMs) {
      sDateObj = new Date(eDateObj.getTime() - maxDiffMs);
      startStr = `${sDateObj.getFullYear()}-${String(sDateObj.getMonth() + 1).padStart(2, '0')}-${String(sDateObj.getDate()).padStart(2, '0')}`;
    }

    const days: string[] = [];
    const curr = new Date(sDateObj);
    while (curr <= eDateObj) {
      const y = curr.getFullYear();
      const m = String(curr.getMonth() + 1).padStart(2, '0');
      const d = String(curr.getDate()).padStart(2, '0');
      days.push(`${y}-${m}-${d}`);
      curr.setDate(curr.getDate() + 1);
    }
    return { startStr, endStr, days };
  }
}
