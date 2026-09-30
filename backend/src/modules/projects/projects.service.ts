import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Project } from './entities/project.entity.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { User } from '../users/entities/user.entity.js';
import { PermissionEvaluatorService } from '../rbac/services/permission-evaluator.service.js';
import { ProjectPermission } from '../rbac/entities/permission-grant.entity.js';
import { PermissionScheme } from '../rbac/entities/permission-scheme.entity.js';
import { ProjectRole } from '../rbac/entities/project-role.entity.js';
import { ProjectRoleActor, ProjectActorType } from '../rbac/entities/project-role-actor.entity.js';

export interface ProjectWithMetrics {
  id: number;
  name: string;
  key: string;
  description: string | null;
  leadId: number | null;
  lead: {
    id: number;
    fullName: string | null;
    email: string | null;
  } | null;
  totalIssues: number;
  openIssues: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface RawProjectRow {
  id: string | number;
  name: string;
  key: string;
  description: string | null;
  lead_id_ref?: string | number | null;
  lead_id?: string | number | null;
  lead_fullName?: string | null;
  lead_email?: string | null;
  totalIssues?: string | number;
  openIssues?: string | number;
  created_at_val: Date | string;
  updated_at_val: Date | string;
}

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly permissionEvaluator: PermissionEvaluatorService,
    private readonly dataSource: DataSource,
    @InjectRepository(PermissionScheme)
    private readonly schemeRepository: Repository<PermissionScheme>,
    @InjectRepository(ProjectRole)
    private readonly projectRoleRepository: Repository<ProjectRole>,
    @InjectRepository(ProjectRoleActor)
    private readonly roleActorRepository: Repository<ProjectRoleActor>,
  ) {}

  /**
   * Retrieves all projects accessible to the current user with lead details and aggregated issue counts.
   * Enforces multi-tenant project isolation based on BROWSE_PROJECTS permissions.
   */
  async findAll(currentUser?: User): Promise<ProjectWithMetrics[]> {
    let accessibleProjectIds: number[] | 'ALL' = 'ALL';

    if (currentUser) {
      accessibleProjectIds = await this.permissionEvaluator.getAccessibleProjectIds(
        currentUser.id,
        ProjectPermission.BROWSE_PROJECTS,
      );
      if (accessibleProjectIds !== 'ALL' && accessibleProjectIds.length === 0) {
        return [];
      }
    }

    const qb = this.projectRepository
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
      ]);

    if (accessibleProjectIds !== 'ALL') {
      qb.andWhere('project.id IN (:...accessibleProjectIds)', { accessibleProjectIds });
    }

    const raw: RawProjectRow[] = await qb
      .groupBy('project.id')
      .addGroupBy('lead.id')
      .orderBy('project.createdAt', 'DESC')
      .getRawMany<RawProjectRow>();

    return raw.map((r: RawProjectRow) => ({
      id: Number(r.id),
      name: r.name,
      key: r.key,
      description: r.description,
      leadId: r.lead_id_ref ? Number(r.lead_id_ref) : null,
      lead: r.lead_id
        ? {
            id: Number(r.lead_id),
            fullName: r.lead_fullName ?? null,
            email: r.lead_email ?? null,
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
   * Atomically assigns the default permission scheme and binds the creator as Project Administrator.
   */
  async create(dto: CreateProjectDto, leadUser: User): Promise<Project> {
    return this.dataSource.transaction(async (manager) => {
      const existing = await manager.findOne(Project, {
        where: { key: dto.key.toUpperCase().trim() },
      });

      if (existing) {
        throw new ConflictException(`Project key "${dto.key}" is already registered`);
      }

      // 1. Resolve default permission scheme
      let defaultScheme = await manager.findOne(PermissionScheme, {
        where: { isDefault: true },
      });
      if (!defaultScheme) {
        defaultScheme = await manager.findOne(PermissionScheme, {
          order: { id: 'ASC' },
        });
      }

      // 2. Create and persist project workspace
      const project = manager.create(Project, {
        name: dto.name.trim(),
        key: dto.key.toUpperCase().trim(),
        description: dto.description?.trim() || null,
        leadId: leadUser.id,
        lead: leadUser,
        permissionSchemeId: defaultScheme ? defaultScheme.id : null,
      });

      const savedProject = await manager.save(Project, project);

      // 3. Resolve default Administrator role and bind lead as ProjectRoleActor
      const adminRole = await manager.findOne(ProjectRole, {
        where: [{ name: 'Administrator' }, { name: 'Administrators' }],
      });

      if (adminRole) {
        const actor = manager.create(ProjectRoleActor, {
          projectId: savedProject.id,
          roleId: adminRole.id,
          actorType: ProjectActorType.USER,
          userId: leadUser.id,
        });
        await manager.save(ProjectRoleActor, actor);
      }

      // 4. Invalidate permission cache
      await this.permissionEvaluator.invalidatePermissions(savedProject.id, leadUser.id);

      return savedProject;
    });
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
