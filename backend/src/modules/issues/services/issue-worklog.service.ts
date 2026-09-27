import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Worklog } from '../entities/worklog.entity.js';
import { Issue } from '../entities/issue.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { EventsGateway } from '../../events/events.gateway.js';
import { LogWorkDto } from '../dto/log-work.dto.js';
import type {
  WorklogItemDto,
  MyWorklogItemDto,
  TimesheetMatrixResponseDto,
  WorklogStatsResponseDto,
  TimesheetMemberDto,
  TimesheetMemberWorklogDto,
} from '../dto/issue-response.dto.js';

/**
 * Service responsible for work logging, time tracking, timesheet matrices, and analytics.
 */
@Injectable()
export class IssueWorklogService {
  constructor(
    @InjectRepository(Issue)
    private readonly issueRepository: Repository<Issue>,
    @InjectRepository(Worklog)
    private readonly worklogRepository: Repository<Worklog>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly eventsGateway: EventsGateway,
  ) {}

  /**
   * Logs hours spent on an issue and increments the issue's total logged hours.
   */
  async logWork(issueId: number, user: User, dto: LogWorkDto): Promise<Worklog> {
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
    const currentLogged = issue.loggedHours || 0;
    issue.loggedHours = Number((currentLogged + dto.timeSpentHours).toFixed(2));
    await this.issueRepository.save(issue);
    this.eventsGateway.broadcastWorklogAdded({
      issueId,
      projectId: issue.projectId,
      worklog,
    });
    return worklog;
  }

  /**
   * Retrieves all worklogs for a given issue ID.
   */
  async getWorklogs(issueId: number): Promise<WorklogItemDto[]> {
    const logs = await this.worklogRepository.find({
      where: { issueId },
      relations: { user: true },
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
        systemRole: w.user?.systemRole,
      },
    }));
  }

  /**
   * Retrieves recent worklogs logged by the current user.
   */
  async getMyWorklogs(userId: number, limit = 20): Promise<MyWorklogItemDto[]> {
    const logs = await this.worklogRepository
      .createQueryBuilder('worklog')
      .leftJoinAndSelect('worklog.issue', 'issue')
      .leftJoinAndSelect('issue.project', 'project')
      .where('worklog.userId = :userId', { userId })
      .orderBy('worklog.createdAt', 'DESC')
      .take(limit)
      .getMany();

    return logs.map((w) => ({
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
  }

  /**
   * Generates team timesheet matrix across dates.
   */
  async getTeamTimesheetMatrix(startDate?: string, endDate?: string): Promise<TimesheetMatrixResponseDto> {
    const { startStr, endStr, days } = this.calculateDateRange(startDate, endDate);
    const users = await this.userRepository.find({
      where: { isActivated: true, isBlocked: false },
      order: { fullName: 'ASC' },
    });
    const logs = await this.worklogRepository
      .createQueryBuilder('worklog')
      .leftJoinAndSelect('worklog.issue', 'issue')
      .leftJoinAndSelect('issue.project', 'project')
      .where('worklog.dateLogged >= :startStr AND worklog.dateLogged <= :endStr', {
        startStr,
        endStr,
      })
      .getMany();

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
   * Retrieves aggregated time tracking analytics across projects and users.
   */
  async getWorklogStats(): Promise<WorklogStatsResponseDto> {
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
    const days: string[] = [];
    const [sY, sM, sD] = startStr.split('-').map(Number);
    const [eY, eM, eD] = endStr.split('-').map(Number);
    const curr = new Date(sY, sM - 1, sD);
    const endLimit = new Date(eY, eM - 1, eD);
    while (curr <= endLimit) {
      const y = curr.getFullYear();
      const m = String(curr.getMonth() + 1).padStart(2, '0');
      const d = String(curr.getDate()).padStart(2, '0');
      days.push(`${y}-${m}-${d}`);
      curr.setDate(curr.getDate() + 1);
    }
    return { startStr, endStr, days };
  }
}
