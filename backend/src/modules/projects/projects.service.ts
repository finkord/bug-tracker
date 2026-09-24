import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { User } from '../users/entities/user.entity.js';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  /**
   * Retrieves all projects with lead details and aggregated issue counts.
   */
  async findAll(): Promise<any[]> {
    const raw = await this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.lead', 'lead')
      .leftJoin('project.issues', 'issue')
      .select([
        'project.id AS id',
        'project.name AS name',
        'project.key AS key',
        'project.description AS description',
        'project.leadId AS lead_id_ref',
        'project.createdAt AS created_at_val',
        'project.updatedAt AS updated_at_val',
        'lead.id AS "lead_id"',
        'lead.fullName AS "lead_fullName"',
        'lead.email AS "lead_email"',
        'COUNT(issue.id) AS "totalIssues"',
        `COUNT(CASE WHEN issue.status IN ('OPEN', 'IN_PROGRESS', 'CODE_REVIEW', 'TESTING') THEN 1 END) AS "openIssues"`, 
      ])
      .groupBy('project.id')
      .addGroupBy('lead.id')
      .orderBy('project.createdAt', 'DESC')
      .getRawMany();

    return raw.map((r: any) => ({
      id: Number(r.id),
      name: r.name,
      key: r.key,
      description: r.description,
      leadId: r.lead_id_ref ? Number(r.lead_id_ref) : null,
      lead: r.lead_id
        ? {
            id: Number(r.lead_id),
            fullName: r.lead_fullName,
            email: r.lead_email,
          }
        : null,
      totalIssues: Number(r.totalIssues || 0),
      openIssues: Number(r.openIssues || 0),
      createdAt: r.created_at_val,
      updatedAt: r.updated_at_val,
    }));
  }

  /**
   * Retrieves a single project by ID with its lead user.
   */
  async findById(id: number): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: { lead: true },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID #${id} not found`);
    }

    return project;
  }

  /**
   * Creates a new project workspace.
   */
  async create(dto: CreateProjectDto, leadUser: User): Promise<Project> {
    const existing = await this.projectRepository.findOne({
      where: { key: dto.key.toUpperCase().trim() },
    });

    if (existing) {
      throw new ConflictException(`Project key "${dto.key}" is already registered`);
    }

    const project = this.projectRepository.create({
      name: dto.name.trim(),
      key: dto.key.toUpperCase().trim(),
      description: dto.description?.trim() || null,
      leadId: leadUser.id,
      lead: leadUser,
    });

    return this.projectRepository.save(project);
  }

  /**
   * Updates an existing project's metadata.
   */
  async update(id: number, dto: Partial<CreateProjectDto>): Promise<Project> {
    const project = await this.findById(id);

    if (dto.name) project.name = dto.name.trim();
    if (dto.description !== undefined) project.description = dto.description?.trim() || null;

    return this.projectRepository.save(project);
  }

  /**
   * Removes a project by ID (cascades to all associated issues).
   */
  async remove(id: number): Promise<{ success: boolean; message: string }> {
    const project = await this.findById(id);
    await this.projectRepository.remove(project);
    return {
      success: true,
      message: `Project ${project.key} has been deleted`,
    };
  }
}
