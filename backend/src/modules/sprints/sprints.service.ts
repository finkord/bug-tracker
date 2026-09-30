import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sprint, SprintStatus } from './entities/sprint.entity.js';
import { Issue, IssueStatus } from '../issues/entities/issue.entity.js';
import { Project } from '../projects/entities/project.entity.js';
import { CreateSprintDto } from './dto/create-sprint.dto.js';
import { UpdateSprintDto, CompleteSprintDto } from './dto/update-sprint.dto.js';

/**
 * Service managing Scrum agile sprint lifecycles and issue associations.
 */
@Injectable()
export class SprintsService {
  constructor(
    @InjectRepository(Sprint)
    private readonly sprintRepository: Repository<Sprint>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Issue)
    private readonly issueRepository: Repository<Issue>,
  ) {}

  /**
   * Retrieves all sprints for a specific project, syncing legacy issue sprints if needed.
   */
  async getProjectSprints(projectId: number): Promise<Sprint[]> {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException(`Project #${projectId} not found`);
    }
    const existingSprints = await this.sprintRepository.find({
      where: { projectId },
      relations: { team: true },
      order: { createdAt: 'ASC' },
      take: 100,
    });
    if (existingSprints.length === 0) {
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
   * Creates a new sprint in planned status within a project.
   */
  async createSprint(projectId: number, dto: CreateSprintDto): Promise<Sprint> {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException(`Project #${projectId} not found`);
    }
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
   * Starts a sprint, setting its status to ACTIVE.
   */
  async startSprint(id: number): Promise<Sprint> {
    const sprint = await this.getSprintById(id);
    if (sprint.status === SprintStatus.COMPLETED) {
      throw new BadRequestException('Cannot start an already completed sprint');
    }
    sprint.status = SprintStatus.ACTIVE;
    if (!sprint.startDate) {
      sprint.startDate = new Date().toISOString().split('T')[0];
    }
    return this.sprintRepository.save(sprint);
  }

  /**
   * Completes a sprint, moving unresolved issues to next sprint or backlog.
   */
  async completeSprint(id: number, dto: CompleteSprintDto): Promise<Sprint> {
    const sprint = await this.getSprintById(id);
    sprint.status = SprintStatus.COMPLETED;
    const savedSprint = await this.sprintRepository.save(sprint);
    const targetSprintId: number | null = dto.transferSprintId || null;
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
}
