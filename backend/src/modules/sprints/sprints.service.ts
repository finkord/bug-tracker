import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Sprint, SprintStatus } from './entities/sprint.entity.js';
import { SprintSnapshot } from './entities/sprint-snapshot.entity.js';
import { Issue, IssueStatus } from '../issues/entities/issue.entity.js';
import { IssueHistory } from '../issues/entities/issue-history.entity.js';
import { Project } from '../projects/entities/project.entity.js';
import { CreateSprintDto } from './dto/create-sprint.dto.js';
import { UpdateSprintDto, CompleteSprintDto } from './dto/update-sprint.dto.js';
import type { SprintBurndownResponseDto, SprintBurndownPointDto } from './dto/burndown.dto.js';
import type {
  SprintFlowMetricsResponseDto,
  CfdDataPointDto,
  CycleTimeItemDto,
  SprintVelocityItemDto,
} from './dto/flow-metrics.dto.js';

/**
 * Service managing Scrum agile sprint lifecycles and issue associations.
 */
@Injectable()
export class SprintsService {
  constructor(
    @InjectRepository(Sprint)
    private readonly sprintRepository: Repository<Sprint>,
    @InjectRepository(SprintSnapshot)
    private readonly snapshotRepository: Repository<SprintSnapshot>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Issue)
    private readonly issueRepository: Repository<Issue>,
    @InjectRepository(IssueHistory)
    private readonly issueHistoryRepository?: Repository<IssueHistory>,
  ) {}

  /**
   * Retrieves all sprints for a specific project, syncing legacy issue sprints if needed.
   */
  async getProjectSprints(projectId: number, teamId?: number | null): Promise<Sprint[]> {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException(`Project #${projectId} not found`);
    }
    const whereClause: any = { projectId };
    if (teamId !== undefined && teamId !== null) {
      whereClause.teamId = teamId;
    }
    const existingSprints = await this.sprintRepository.find({
      where: whereClause,
      relations: { team: true },
      order: { createdAt: 'ASC' },
      take: 100,
    });
    if (existingSprints.length === 0 && (teamId === undefined || teamId === null)) {
      return this.initializeDefaultSprints(projectId);
    }
    return existingSprints;
  }

  /**
   * Retrieves a single sprint by its primary ID.
   */
  async getSprintById(id: number): Promise<Sprint> {
    const sprint = await this.sprintRepository.findOne({
      where: { id },
      relations: { team: true },
    });
    if (!sprint) {
      throw new NotFoundException(`Sprint #${id} not found`);
    }
    return sprint;
  }

  /**
   * Helper to ensure sprint start date is strictly before end date.
   */
  private validateSprintDates(startDate?: string | null, endDate?: string | null): void {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start >= end) {
        throw new BadRequestException('Sprint end date must be after start date');
      }
    }
  }

  /**
   * Creates a new sprint in planned status within a project.
   */
  async createSprint(projectId: number, dto: CreateSprintDto): Promise<Sprint> {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException(`Project #${projectId} not found`);
    }

    this.validateSprintDates(dto.startDate, dto.endDate);

    const sprint = this.sprintRepository.create({
      projectId,
      name: dto.name.trim(),
      goal: dto.goal?.trim() || null,
      startDate: dto.startDate || null,
      endDate: dto.endDate || null,
      status: dto.status || SprintStatus.PLANNED,
      teamId: dto.teamId || null,
      capacityHours: dto.capacityHours ?? null,
    });
    return this.sprintRepository.save(sprint);
  }

  /**
   * Updates sprint metadata (name, goal, dates).
   */
  async updateSprint(id: number, dto: UpdateSprintDto): Promise<Sprint> {
    const sprint = await this.getSprintById(id);

    const nextStartDate = dto.startDate !== undefined ? dto.startDate : sprint.startDate;
    const nextEndDate = dto.endDate !== undefined ? dto.endDate : sprint.endDate;
    this.validateSprintDates(nextStartDate, nextEndDate);

    if (dto.name !== undefined) sprint.name = dto.name.trim();
    if (dto.goal !== undefined) sprint.goal = dto.goal?.trim() || null;
    if (dto.startDate !== undefined) sprint.startDate = dto.startDate || null;
    if (dto.endDate !== undefined) sprint.endDate = dto.endDate || null;
    if (dto.status !== undefined) sprint.status = dto.status;
    if (dto.teamId !== undefined) sprint.teamId = dto.teamId || null;
    if (dto.capacityHours !== undefined) sprint.capacityHours = dto.capacityHours ?? null;
    return this.sprintRepository.save(sprint);
  }

  /**
   * Starts a sprint, setting its status to ACTIVE with single active sprint enforcement.
   */
  async startSprint(id: number): Promise<Sprint> {
    const sprint = await this.getSprintById(id);
    if (sprint.status === SprintStatus.COMPLETED) {
      throw new BadRequestException('Cannot start an already completed sprint');
    }

    // Scrum rule: only one active sprint per project (or per assigned team)
    const existingActiveWhere: any = {
      projectId: sprint.projectId,
      status: SprintStatus.ACTIVE,
    };
    if (sprint.teamId) {
      existingActiveWhere.teamId = sprint.teamId;
    }
    const existingActiveSprint = await this.sprintRepository.findOne({
      where: existingActiveWhere,
    });

    if (existingActiveSprint && existingActiveSprint.id !== sprint.id) {
      throw new BadRequestException(
        `Sprint "${existingActiveSprint.name}" is already active in this project. Complete it before starting a new sprint.`,
      );
    }

    sprint.status = SprintStatus.ACTIVE;
    if (!sprint.startDate) {
      sprint.startDate = new Date().toISOString().split('T')[0];
    }
    const saved = await this.sprintRepository.save(sprint);

    // Record initial baseline snapshot at sprint start for velocity and burndown
    await this.recordSnapshot(saved, sprint.startDate);

    return saved;
  }

  /**
   * Completes a sprint, moving unresolved issues and their subtasks to next sprint or backlog.
   */
  async completeSprint(id: number, dto: CompleteSprintDto): Promise<Sprint> {
    const sprint = await this.getSprintById(id);

    // 1. Record final completion snapshot BEFORE moving unresolved issues away
    const today = new Date().toISOString().split('T')[0];
    await this.recordSnapshot(sprint, today);

    sprint.status = SprintStatus.COMPLETED;
    if (!sprint.endDate) {
      sprint.endDate = today;
    }
    const savedSprint = await this.sprintRepository.save(sprint);
    const targetSprintId: number | null = dto.transferSprintId || null;

    // 1. Find incomplete issues in this sprint
    const sprintIssues = await this.issueRepository.find({
      where: {
        projectId: sprint.projectId,
        sprintId: id,
      },
      select: { id: true, status: true },
    });

    const incompleteParentIds = sprintIssues
      .filter((i) => i.status !== IssueStatus.RESOLVED && i.status !== IssueStatus.CLOSED)
      .map((i) => i.id);

    // 2. Transfer incomplete issues and cascade to their unresolved subtasks
    if (incompleteParentIds.length > 0) {
      await this.issueRepository
        .createQueryBuilder()
        .update(Issue)
        .set({ sprintId: targetSprintId })
        .where('projectId = :projectId', { projectId: sprint.projectId })
        .andWhere(
          '(id IN (:...incompleteParentIds) OR (parentId IN (:...incompleteParentIds) AND status NOT IN (:...completedStatuses)))',
          {
            incompleteParentIds,
            completedStatuses: [IssueStatus.RESOLVED, IssueStatus.CLOSED],
          },
        )
        .execute();
    } else {
      await this.issueRepository
        .createQueryBuilder()
        .update(Issue)
        .set({ sprintId: targetSprintId })
        .where('projectId = :projectId', { projectId: sprint.projectId })
        .andWhere('sprintId = :sprintId', { sprintId: id })
        .andWhere('status NOT IN (:...completedStatuses)', {
          completedStatuses: [IssueStatus.RESOLVED, IssueStatus.CLOSED],
        })
        .execute();
    }

    return savedSprint;
  }

  /**
   * Deletes a sprint and moves associated issues back to Backlog.
   */
  async deleteSprint(id: number): Promise<{ success: boolean; message: string }> {
    const sprint = await this.getSprintById(id);
    await this.issueRepository
      .createQueryBuilder()
      .update(Issue)
      .set({ sprintId: null })
      .where('projectId = :projectId', { projectId: sprint.projectId })
      .andWhere('sprintId = :sprintId', { sprintId: id })
      .execute();
    await this.sprintRepository.delete(id);
    return { success: true, message: `Sprint "${sprint.name}" deleted successfully` };
  }

  /**
   * Helper to initialize default Sprint 1 for new or unmigrated projects.
   */
  private async initializeDefaultSprints(projectId: number): Promise<Sprint[]> {
    const defaultSprint = this.sprintRepository.create({
      projectId,
      name: 'Sprint 1',
      goal: 'Core architecture and initial deliverables',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      status: SprintStatus.ACTIVE,
    });
    const saved = await this.sprintRepository.save(defaultSprint);
    return [saved];
  }

  /**
   * Records or updates a daily sprint snapshot.
   */
  async recordSnapshot(sprintOrId: number | Sprint, dateStr?: string): Promise<SprintSnapshot> {
    const sprint = typeof sprintOrId === 'number' ? await this.getSprintById(sprintOrId) : sprintOrId;
    const today = dateStr || new Date().toISOString().split('T')[0];

    const issues = await this.issueRepository.find({
      where: { sprintId: sprint.id },
    });

    const totalScopeHours = issues.reduce((sum, i) => sum + (Number(i.estimatedHours) || 0), 0);
    const completedIssues = issues.filter(
      (i) => i.status === IssueStatus.RESOLVED || i.status === IssueStatus.CLOSED,
    );
    const completedHours = completedIssues.reduce((sum, i) => sum + (Number(i.estimatedHours) || 0), 0);
    const remainingHours = Math.max(0, totalScopeHours - completedHours);

    let snapshot = await this.snapshotRepository.findOne({
      where: { sprintId: sprint.id, snapshotDate: today },
    });

    if (snapshot) {
      snapshot.totalScopeHours = totalScopeHours;
      snapshot.completedHours = completedHours;
      snapshot.remainingHours = remainingHours;
      snapshot.totalIssues = issues.length;
      snapshot.completedIssues = completedIssues.length;
    } else {
      snapshot = this.snapshotRepository.create({
        sprintId: sprint.id,
        snapshotDate: today,
        totalScopeHours,
        completedHours,
        remainingHours,
        totalIssues: issues.length,
        completedIssues: completedIssues.length,
      });
    }

    return this.snapshotRepository.save(snapshot);
  }

  /**
   * Retrieves full burndown timeline combining recorded snapshots with ideal trajectory.
   */
  async getBurndown(sprintId: number): Promise<SprintBurndownResponseDto> {
    const sprint = await this.getSprintById(sprintId);

    // Record today's live snapshot if active
    if (sprint.status === SprintStatus.ACTIVE) {
      await this.recordSnapshot(sprint);
    }

    const snapshots = await this.snapshotRepository.find({
      where: { sprintId },
      order: { snapshotDate: 'ASC' },
    });

    const snapshotMap = new Map<string, SprintSnapshot>();
    for (const snap of snapshots) {
      snapshotMap.set(snap.snapshotDate, snap);
    }

    const issues = await this.issueRepository.find({
      where: { sprintId: sprint.id },
    });

    const issueIds = issues.map((i) => i.id);
    let histories: IssueHistory[] = [];
    if (this.issueHistoryRepository && issueIds.length > 0) {
      histories = await this.issueHistoryRepository.find({
        where: { issueId: In(issueIds), field: 'status' },
        order: { createdAt: 'ASC' },
      });
    }

    const historyByIssue = new Map<number, IssueHistory[]>();
    for (const h of histories) {
      const list = historyByIssue.get(h.issueId) ?? [];
      list.push(h);
      historyByIssue.set(h.issueId, list);
    }

    const currentScope = issues.reduce((sum, i) => sum + (Number(i.estimatedHours) || 0), 0);
    const currentCompleted = issues
      .filter((i) => i.status === IssueStatus.RESOLVED || i.status === IssueStatus.CLOSED)
      .reduce((sum, i) => sum + (Number(i.estimatedHours) || 0), 0);
    const currentRemaining = Math.max(0, currentScope - currentCompleted);

    const startDate = sprint.startDate
      ? new Date(sprint.startDate)
      : new Date(Date.now() - 7 * 86400000);
    const endDate = sprint.endDate
      ? new Date(sprint.endDate)
      : new Date(startDate.getTime() + 14 * 86400000);

    const diffDays = Math.max(
      1,
      Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)),
    );
    const initialScope = snapshots.length > 0 ? snapshots[0].totalScopeHours : currentScope;

    const points: SprintBurndownPointDto[] = [];
    const todayStr = new Date().toISOString().split('T')[0];

    for (let d = 0; d <= diffDays; d++) {
      const currentDayDate = new Date(startDate.getTime() + d * 86400000);
      const dayEnd = new Date(currentDayDate);
      dayEnd.setHours(23, 59, 59, 999);
      const dateKey = currentDayDate.toISOString().split('T')[0];
      const idealHours = Number((Math.max(0, initialScope * (1 - d / diffDays))).toFixed(1));

      const existingSnap = snapshotMap.get(dateKey);
      const isPastOrToday = dateKey <= todayStr;

      let remainingHours: number | null = null;
      let completedHours: number | null = null;

      if (existingSnap) {
        remainingHours = existingSnap.remainingHours;
        completedHours = existingSnap.completedHours;
      } else if (isPastOrToday) {
        // Reconstruct from issue history on that day
        let dayCompleted = 0;
        let dayScope = 0;
        for (const issue of issues) {
          const est = Number(issue.estimatedHours) || 0;
          const issueCreated = issue.createdAt ? new Date(issue.createdAt) : startDate;
          if (issueCreated > dayEnd) {
            continue;
          }
          dayScope += est;
          const issueHist = historyByIssue.get(issue.id) ?? [];
          const pastTransitions = issueHist.filter((h) => new Date(h.createdAt) <= dayEnd);
          let statusOnDay: string = IssueStatus.OPEN;
          if (pastTransitions.length > 0) {
            statusOnDay = pastTransitions[pastTransitions.length - 1].newValue || IssueStatus.OPEN;
          } else {
            statusOnDay = issueHist.length > 0 && issueHist[0].oldValue ? issueHist[0].oldValue : issue.status;
          }
          if (statusOnDay === IssueStatus.RESOLVED || statusOnDay === IssueStatus.CLOSED) {
            dayCompleted += est;
          }
        }
        completedHours = dayCompleted;
        remainingHours = Math.max(0, (dayScope || initialScope) - dayCompleted);
      }

      points.push({
        date: dateKey,
        dayLabel: `Day ${d + 1}`,
        idealHours,
        remainingHours,
        completedHours,
        totalScopeHours: existingSnap ? existingSnap.totalScopeHours : initialScope,
        isRecordedSnapshot: Boolean(existingSnap),
      });
    }

    return {
      sprintId: sprint.id,
      sprintName: sprint.name,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      totalScopeHours: currentScope,
      remainingHours: currentRemaining,
      completedHours: currentCompleted,
      points,
    };
  }

  /**
   * Computes Cumulative Flow Diagram (CFD), Cycle Time distribution & percentiles, and Velocity history.
   */
  async getFlowMetrics(sprintId: number): Promise<SprintFlowMetricsResponseDto> {
    const sprint = await this.getSprintById(sprintId);

    const sprintIssues = await this.issueRepository.find({
      where: { sprintId: sprint.id },
      relations: { project: true },
      order: { createdAt: 'ASC' },
    });

    const issueIds = sprintIssues.map((i) => i.id);
    let histories: IssueHistory[] = [];
    if (this.issueHistoryRepository && issueIds.length > 0) {
      histories = await this.issueHistoryRepository.find({
        where: { issueId: In(issueIds), field: 'status' },
        order: { createdAt: 'ASC' },
      });
    }

    const historyByIssue = new Map<number, IssueHistory[]>();
    for (const h of histories) {
      const list = historyByIssue.get(h.issueId) ?? [];
      list.push(h);
      historyByIssue.set(h.issueId, list);
    }

    // 1. CFD Cumulative Flow Diagram timeline
    const startDate = sprint.startDate
      ? new Date(sprint.startDate)
      : new Date(Date.now() - 14 * 86400000);
    const endDate = sprint.endDate
      ? new Date(sprint.endDate)
      : new Date(startDate.getTime() + 14 * 86400000);

    const diffDays = Math.max(
      1,
      Math.min(45, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24))),
    );

    const cfd: CfdDataPointDto[] = [];
    for (let d = 0; d <= diffDays; d++) {
      const currentDay = new Date(startDate.getTime() + d * 86400000);
      const dayEnd = new Date(currentDay);
      dayEnd.setHours(23, 59, 59, 999);
      const dateKey = currentDay.toISOString().split('T')[0];

      let openCount = 0;
      let inProgressCount = 0;
      let reviewCount = 0;
      let resolvedCount = 0;
      let closedCount = 0;

      for (const issue of sprintIssues) {
        const issueCreated = issue.createdAt ? new Date(issue.createdAt) : startDate;
        if (issueCreated > dayEnd) {
          continue;
        }

        const issueHist = historyByIssue.get(issue.id) ?? [];
        const pastTransitions = issueHist.filter((h) => new Date(h.createdAt) <= dayEnd);

        let statusOnDay: string = IssueStatus.OPEN;
        if (pastTransitions.length > 0) {
          statusOnDay = pastTransitions[pastTransitions.length - 1].newValue || IssueStatus.OPEN;
        } else {
          statusOnDay = issueHist.length > 0 && issueHist[0].oldValue ? issueHist[0].oldValue : issue.status;
        }

        switch (statusOnDay) {
          case IssueStatus.OPEN:
            openCount++;
            break;
          case IssueStatus.IN_PROGRESS:
            inProgressCount++;
            break;
          case IssueStatus.REVIEW:
            reviewCount++;
            break;
          case IssueStatus.RESOLVED:
            resolvedCount++;
            break;
          case IssueStatus.CLOSED:
            closedCount++;
            break;
          default:
            openCount++;
            break;
        }
      }

      cfd.push({
        date: dateKey,
        dayLabel: `Day ${d + 1}`,
        open: openCount,
        inProgress: inProgressCount,
        review: reviewCount,
        resolved: resolvedCount,
        closed: closedCount,
        total: openCount + inProgressCount + reviewCount + resolvedCount + closedCount,
      });
    }

    // 2. Cycle Time & Lead Time Scatter Plot + Percentiles
    const cycleTimeItems: CycleTimeItemDto[] = [];
    const completedIssues = sprintIssues.filter(
      (i) => i.status === IssueStatus.RESOLVED || i.status === IssueStatus.CLOSED,
    );

    for (const issue of completedIssues) {
      const issueHist = historyByIssue.get(issue.id) ?? [];
      const createdTime = issue.createdAt ? new Date(issue.createdAt).getTime() : Date.now();

      const startTransition = issueHist.find(
        (h) => h.newValue && ['IN_PROGRESS', 'REVIEW', 'RESOLVED'].includes(h.newValue),
      );
      const startTime = startTransition ? new Date(startTransition.createdAt).getTime() : createdTime;

      const doneTransition = [...issueHist].reverse().find(
        (h) => h.newValue && ['RESOLVED', 'CLOSED'].includes(h.newValue),
      );
      const doneTime = doneTransition
        ? new Date(doneTransition.createdAt).getTime()
        : (issue.updatedAt ? new Date(issue.updatedAt).getTime() : Date.now());

      const cycleTimeDays = Math.max(0.1, Number(((Math.max(0, doneTime - startTime)) / (1000 * 3600 * 24)).toFixed(1)));
      const leadTimeDays = Math.max(0.1, Number(((Math.max(0, doneTime - createdTime)) / (1000 * 3600 * 24)).toFixed(1)));
      const completedAt = doneTransition
        ? new Date(doneTransition.createdAt).toISOString()
        : (issue.updatedAt ? new Date(issue.updatedAt).toISOString() : new Date().toISOString());

      const issueKey = issue.project ? `${issue.project.key}-${issue.issueNum}` : `#${issue.id}`;
      cycleTimeItems.push({
        issueId: issue.id,
        key: issueKey,
        title: issue.title,
        issueType: issue.issueType,
        priority: issue.priority,
        cycleTimeDays,
        leadTimeDays,
        completedAt,
      });
    }

    const sortedCycleTimes = [...cycleTimeItems]
      .map((i) => i.cycleTimeDays)
      .sort((a, b) => a - b);
    const count = sortedCycleTimes.length;

    let averageCycleTimeDays = 0;
    let averageLeadTimeDays = 0;
    let p50CycleTimeDays = 0;
    let p85CycleTimeDays = 0;
    let p95CycleTimeDays = 0;

    if (count > 0) {
      averageCycleTimeDays = Number(
        (sortedCycleTimes.reduce((acc, v) => acc + v, 0) / count).toFixed(1),
      );
      averageLeadTimeDays = Number(
        (cycleTimeItems.reduce((acc, v) => acc + v.leadTimeDays, 0) / count).toFixed(1),
      );
      p50CycleTimeDays = sortedCycleTimes[Math.floor(count * 0.5)];
      p85CycleTimeDays = sortedCycleTimes[Math.min(count - 1, Math.floor(count * 0.85))];
      p95CycleTimeDays = sortedCycleTimes[Math.min(count - 1, Math.floor(count * 0.95))];
    }

    // 3. Historical Sprint Velocity (Completed & Active sprints, chronologically)
    const projectSprints = await this.sprintRepository.find({
      where: {
        projectId: sprint.projectId,
        status: In([SprintStatus.COMPLETED, SprintStatus.ACTIVE]),
      },
      order: { createdAt: 'ASC' },
      take: 15,
    });

    const velocity: SprintVelocityItemDto[] = [];
    for (const s of projectSprints) {
      const sSnapshots = await this.snapshotRepository.find({
        where: { sprintId: s.id },
        order: { snapshotDate: 'ASC' },
      });

      const sIssues = await this.issueRepository.find({
        where: { sprintId: s.id },
      });

      let committedHours = sIssues.reduce((acc, i) => acc + (Number(i.estimatedHours) || 0), 0);
      let completedHours = sIssues
        .filter((i) => i.status === IssueStatus.RESOLVED || i.status === IssueStatus.CLOSED)
        .reduce((acc, i) => acc + (Number(i.estimatedHours) || 0), 0);
      let totalIssues = sIssues.length;
      let completedIssues = sIssues.filter(
        (i) => i.status === IssueStatus.RESOLVED || i.status === IssueStatus.CLOSED,
      ).length;

      if (sSnapshots.length > 0) {
        const firstSnap = sSnapshots[0];
        const lastSnap = sSnapshots[sSnapshots.length - 1];
        committedHours = Math.max(firstSnap.totalScopeHours, committedHours);
        if (s.status === SprintStatus.COMPLETED) {
          completedHours = lastSnap.completedHours;
          completedIssues = lastSnap.completedIssues;
          totalIssues = Math.max(firstSnap.totalIssues, totalIssues);
        }
      }

      velocity.push({
        sprintId: s.id,
        sprintName: s.name,
        status: s.status,
        committedHours,
        completedHours,
        completedIssues,
        totalIssues,
      });
    }

    // Average Velocity: strictly across COMPLETED sprints
    const completedSprints = velocity.filter((v) => v.status === SprintStatus.COMPLETED);
    const averageVelocity =
      completedSprints.length > 0
        ? Number(
            (
              completedSprints.reduce((acc, v) => acc + v.completedHours, 0) /
              completedSprints.length
            ).toFixed(1),
          )
        : velocity.length > 0 && velocity[0].completedHours > 0
          ? velocity[0].completedHours
          : 0;

    return {
      sprintId: sprint.id,
      sprintName: sprint.name,
      cfd,
      cycleTime: {
        averageCycleTimeDays,
        p50CycleTimeDays,
        p85CycleTimeDays,
        p95CycleTimeDays,
        averageLeadTimeDays,
        items: cycleTimeItems,
      },
      velocity,
      averageVelocity,
    };
  }
}
