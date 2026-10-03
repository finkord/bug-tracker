import { Injectable, NotFoundException, ConflictException, BadRequestException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Project } from './entities/project.entity.js';
import { ProjectQuickFilter } from './entities/quick-filter.entity.js';
import { ProjectComponent } from './entities/project-component.entity.js';
import { ProjectVersion, ProjectVersionStatus } from './entities/project-version.entity.js';
import { Issue, IssueStatus, IssueType } from '../issues/entities/issue.entity.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';
import { CreateQuickFilterDto, UpdateQuickFilterDto } from './dto/quick-filter.dto.js';
import { CreateComponentDto } from './dto/component.dto.js';
import {
  CreateProjectVersionDto,
  UpdateProjectVersionDto,
  ReleaseVersionDto,
} from './dto/project-version.dto.js';
import { User } from '../users/entities/user.entity.js';
import { PermissionEvaluatorService } from '../rbac/services/permission-evaluator.service.js';
import { ProjectPermission } from '../rbac/entities/permission-grant.entity.js';
import { PermissionScheme } from '../rbac/entities/permission-scheme.entity.js';
import { ProjectRole } from '../rbac/entities/project-role.entity.js';
import { ProjectRoleActor, ProjectActorType } from '../rbac/entities/project-role-actor.entity.js';
import { Group } from '../rbac/entities/group.entity.js';
import { JqlParserService } from '../issues/services/jql-parser.service.js';
import { SeaweedFsService, type UploadedFileInput } from '../storage/services/seaweedfs.service.js';

export interface ProjectWithMetrics {
  id: number;
  name: string;
  key: string;
  description: string | null;
  avatarUrl?: string | null;
  leadId: number | null;
  lead: {
    id: number;
    fullName: string | null;
    email: string | null;
  } | null;
  totalIssues: number;
  openIssues: number;
  wipLimits?: Record<string, number> | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface RawProjectRow {
  id: string | number;
  name: string;
  key: string;
  description: string | null;
  avatar_url?: string | null;
  lead_id_ref?: string | number | null;
  lead_id?: string | number | null;
  lead_fullName?: string | null;
  lead_email?: string | null;
  totalIssues?: string | number;
  openIssues?: string | number;
  wip_limits?: Record<string, number> | null;
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
    @InjectRepository(ProjectQuickFilter)
    private readonly quickFilterRepository: Repository<ProjectQuickFilter>,
    @InjectRepository(ProjectComponent)
    private readonly componentRepository: Repository<ProjectComponent>,
    @InjectRepository(ProjectVersion)
    private readonly versionRepository: Repository<ProjectVersion>,
    @InjectRepository(Issue)
    private readonly issueRepository: Repository<Issue>,
    private readonly jqlParserService: JqlParserService,
    @Optional()
    private readonly seaweedFsService?: SeaweedFsService,
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
        'project.avatarUrl AS avatar_url',
        'project.leadId AS lead_id_ref',
        'project.createdAt AS created_at_val',
        'project.updatedAt AS updated_at_val',
        'project.wipLimits AS wip_limits',
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
      avatarUrl: r.avatar_url || null,
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
      wipLimits: r.wip_limits || null,
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
   * Retrieves a single project by numeric ID or unique project key.
   */
  async findByIdOrKey(idOrKey: string | number): Promise<Project> {
    const isNum = typeof idOrKey === 'number' || /^\d+$/.test(String(idOrKey).trim());
    const project = await this.projectRepository.findOne({
      where: isNum ? { id: Number(idOrKey) } : { key: String(idOrKey).toUpperCase().trim() },
      relations: { lead: true },
    });

    if (!project) {
      throw new NotFoundException(`Project "${idOrKey}" not found`);
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
        avatarUrl: dto.avatarUrl ? dto.avatarUrl.trim() : null,
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

      // 4. Resolve default Developers role and bind all-users group as ProjectRoleActor
      const devRole = await manager.findOne(ProjectRole, {
        where: [{ name: 'Developer' }, { name: 'Developers' }],
      });
      const allUsersGroup = await manager.findOne(Group, {
        where: { name: 'all-users' },
      });

      if (devRole && allUsersGroup) {
        const devActor = manager.create(ProjectRoleActor, {
          projectId: savedProject.id,
          roleId: devRole.id,
          actorType: ProjectActorType.GROUP,
          groupId: allUsersGroup.id,
        });
        await manager.save(ProjectRoleActor, devActor);
      }

      // 5. Invalidate permission cache
      await this.permissionEvaluator.invalidatePermissions(savedProject.id, leadUser.id);

      return savedProject;
    });
  }

  /**
   * Updates an existing project's metadata.
   */
  async update(id: number, dto: UpdateProjectDto): Promise<Project> {
    const project = await this.findById(id);

    if (dto.name) project.name = dto.name.trim();
    if (dto.description !== undefined) project.description = dto.description?.trim() || null;
    if (dto.avatarUrl !== undefined) project.avatarUrl = dto.avatarUrl ? dto.avatarUrl.trim() : null;
    if (dto.wipLimits !== undefined) project.wipLimits = dto.wipLimits;
    if (dto.leadId !== undefined && dto.leadId !== null) {
      project.leadId = dto.leadId;
    }

    return this.projectRepository.save(project);
  }

  /**
   * Uploads project avatar image directly to SeaweedFS object storage.
   */
  async uploadAvatar(projectId: number, file: UploadedFileInput): Promise<Project> {
    const project = await this.findById(projectId);
    if (!this.seaweedFsService) {
      throw new BadRequestException('Object storage service unavailable');
    }
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
      throw new BadRequestException(
        `Unsupported image format "${file.mimetype}". Allowed formats: PNG, JPEG, WEBP, GIF, SVG.`,
      );
    }

    const { fid } = await this.seaweedFsService.uploadFile(file);
    const avatarUrl = `/api/v1/projects/avatar/${fid}`;
    project.avatarUrl = avatarUrl;
    await this.projectRepository.save(project);
    return this.findById(projectId);
  }

  /**
   * Streams project avatar image buffer from SeaweedFS.
   */
  async getAvatarBuffer(fid: string): Promise<{ buffer: Buffer; contentType: string }> {
    if (!this.seaweedFsService) {
      throw new BadRequestException('Object storage service unavailable');
    }
    return this.seaweedFsService.getFileBuffer(fid);
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

  /**
   * Retrieves all quick filters for a project, sorted by position.
   * Auto-seeds standard default quick filters if none exist.
   */
  async getProjectQuickFilters(projectId: number): Promise<ProjectQuickFilter[]> {
    await this.findById(projectId);

    const filters = await this.quickFilterRepository.find({
      where: { projectId },
      order: { position: 'ASC', id: 'ASC' },
    });

    if (filters.length > 0) {
      return filters;
    }

    // Auto-seed standard default quick filters
    const defaultFilters = [
      this.quickFilterRepository.create({
        projectId,
        name: 'Only My Issues',
        jqlQuery: 'assignee = currentUser()',
        position: 0,
      }),
      this.quickFilterRepository.create({
        projectId,
        name: 'Unassigned',
        jqlQuery: 'assignee = unassigned',
        position: 1,
      }),
      this.quickFilterRepository.create({
        projectId,
        name: 'High Priority',
        jqlQuery: 'priority IN ("CRITICAL", "HIGH")',
        position: 2,
      }),
    ];

    return this.quickFilterRepository.save(defaultFilters);
  }

  /**
   * Creates a new custom board quick filter for a project.
   * Validates JQL syntax against JqlParserService.
   */
  async createQuickFilter(projectId: number, dto: CreateQuickFilterDto): Promise<ProjectQuickFilter> {
    await this.findById(projectId);

    // Validate JQL syntax
    this.jqlParserService.parse(dto.jqlQuery);

    let position = dto.position;
    if (position === undefined) {
      const highestPos = await this.quickFilterRepository
        .createQueryBuilder('qf')
        .where('qf.project_id = :projectId', { projectId })
        .select('MAX(qf.position)', 'max')
        .getRawOne();
      position = (highestPos?.max ?? -1) + 1;
    }

    const filter = this.quickFilterRepository.create({
      projectId,
      name: dto.name.trim(),
      jqlQuery: dto.jqlQuery.trim(),
      description: dto.description?.trim() || null,
      position,
    });

    return this.quickFilterRepository.save(filter);
  }

  /**
   * Updates an existing board quick filter.
   */
  async updateQuickFilter(
    projectId: number,
    filterId: number,
    dto: UpdateQuickFilterDto,
  ): Promise<ProjectQuickFilter> {
    const filter = await this.quickFilterRepository.findOne({
      where: { id: filterId, projectId },
    });

    if (!filter) {
      throw new NotFoundException(`Quick filter with ID #${filterId} not found in project #${projectId}`);
    }

    if (dto.jqlQuery !== undefined) {
      this.jqlParserService.parse(dto.jqlQuery);
      filter.jqlQuery = dto.jqlQuery.trim();
    }

    if (dto.name !== undefined) {
      filter.name = dto.name.trim();
    }

    if (dto.description !== undefined) {
      filter.description = dto.description?.trim() || null;
    }

    if (dto.position !== undefined) {
      filter.position = dto.position;
    }

    return this.quickFilterRepository.save(filter);
  }

  /**
   * Deletes a board quick filter.
   */
  async deleteQuickFilter(projectId: number, filterId: number): Promise<{ success: boolean; message: string }> {
    const filter = await this.quickFilterRepository.findOne({
      where: { id: filterId, projectId },
    });

    if (!filter) {
      throw new NotFoundException(`Quick filter with ID #${filterId} not found in project #${projectId}`);
    }

    await this.quickFilterRepository.remove(filter);
    return {
      success: true,
      message: `Quick filter "${filter.name}" removed successfully`,
    };
  }

  /**
   * Retrieves all components defined for a project with optional lead details.
   */
  async getComponents(projectId: number): Promise<ProjectComponent[]> {
    return this.componentRepository.find({
      where: { projectId },
      order: { name: 'ASC' },
      relations: { lead: true },
    });
  }

  /**
   * Creates a new component within a project.
   */
  async createComponent(projectId: number, dto: CreateComponentDto): Promise<ProjectComponent> {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException(`Project with ID #${projectId} not found`);
    }

    const existing = await this.componentRepository.findOne({
      where: { projectId, name: dto.name },
    });
    if (existing) {
      throw new ConflictException(`Component "${dto.name}" already exists in project`);
    }

    const component = this.componentRepository.create({
      projectId,
      name: dto.name,
      description: dto.description || null,
      leadId: dto.leadId || null,
    });

    return this.componentRepository.save(component);
  }

  /**
   * Deletes a component from a project.
   */
  async deleteComponent(projectId: number, componentId: number): Promise<{ success: boolean; message: string }> {
    const component = await this.componentRepository.findOne({
      where: { id: componentId, projectId },
    });
    if (!component) {
      throw new NotFoundException(`Component with ID #${componentId} not found in project #${projectId}`);
    }

    await this.componentRepository.remove(component);
    return {
      success: true,
      message: `Component "${component.name}" removed successfully`,
    };
  }

  /**
   * Retrieves all software releases/versions for a project with completion progress metrics.
   */
  async getVersions(projectId: number): Promise<Array<ProjectVersion & {
    totalIssues: number;
    completedIssues: number;
    progressPercentage: number;
  }>> {
    const versions = await this.versionRepository.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });

    const results = [];
    for (const v of versions) {
      const totalIssues = await this.issueRepository.count({
        where: { fixVersionId: v.id },
      });

      const completedIssues = await this.issueRepository
        .createQueryBuilder('issue')
        .where('issue.fixVersionId = :fixVersionId', { fixVersionId: v.id })
        .andWhere('issue.status IN (:...doneStatuses)', {
          doneStatuses: [IssueStatus.RESOLVED, IssueStatus.CLOSED],
        })
        .getCount();

      const progressPercentage = totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;

      results.push({
        ...v,
        totalIssues,
        completedIssues,
        progressPercentage,
      });
    }

    return results;
  }

  /**
   * Creates a new software release version in a project.
   */
  async createVersion(projectId: number, dto: CreateProjectVersionDto): Promise<ProjectVersion> {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException(`Project with ID #${projectId} not found`);
    }

    const existing = await this.versionRepository.findOne({
      where: { projectId, name: dto.name },
    });
    if (existing) {
      throw new ConflictException(`Version "${dto.name}" already exists in project`);
    }

    const version = this.versionRepository.create({
      projectId,
      name: dto.name,
      description: dto.description || null,
      startDate: dto.startDate || null,
      releaseDate: dto.releaseDate || null,
      status: ProjectVersionStatus.UNRELEASED,
    });

    return this.versionRepository.save(version);
  }

  /**
   * Updates an existing project version.
   */
  async updateVersion(projectId: number, versionId: number, dto: UpdateProjectVersionDto): Promise<ProjectVersion> {
    const version = await this.versionRepository.findOne({
      where: { id: versionId, projectId },
    });
    if (!version) {
      throw new NotFoundException(`Version #${versionId} not found in project #${projectId}`);
    }

    if (dto.name && dto.name !== version.name) {
      const duplicate = await this.versionRepository.findOne({
        where: { projectId, name: dto.name },
      });
      if (duplicate) {
        throw new ConflictException(`Version "${dto.name}" already exists in project`);
      }
      version.name = dto.name;
    }

    if (dto.description !== undefined) version.description = dto.description;
    if (dto.status !== undefined) version.status = dto.status;
    if (dto.startDate !== undefined) version.startDate = dto.startDate;
    if (dto.releaseDate !== undefined) version.releaseDate = dto.releaseDate;

    return this.versionRepository.save(version);
  }

  /**
   * Deletes a project version.
   */
  async deleteVersion(projectId: number, versionId: number): Promise<{ success: boolean; message: string }> {
    const version = await this.versionRepository.findOne({
      where: { id: versionId, projectId },
    });
    if (!version) {
      throw new NotFoundException(`Version #${versionId} not found in project #${projectId}`);
    }

    await this.versionRepository.remove(version);
    return {
      success: true,
      message: `Version "${version.name}" deleted successfully`,
    };
  }

  /**
   * Releases a version, transitioning status to RELEASED and optionally migrating unresolved issues.
   */
  async releaseVersion(
    projectId: number,
    versionId: number,
    dto?: ReleaseVersionDto,
  ): Promise<ProjectVersion> {
    const version = await this.versionRepository.findOne({
      where: { id: versionId, projectId },
    });
    if (!version) {
      throw new NotFoundException(`Version #${versionId} not found in project #${projectId}`);
    }

    version.status = ProjectVersionStatus.RELEASED;
    version.releaseDate = new Date().toISOString().split('T')[0];
    await this.versionRepository.save(version);

    if (dto?.moveUnresolvedIssuesToVersionId) {
      await this.issueRepository
        .createQueryBuilder()
        .update(Issue)
        .set({ fixVersionId: dto.moveUnresolvedIssuesToVersionId })
        .where('fixVersionId = :fixVersionId', { fixVersionId: versionId })
        .andWhere('status NOT IN (:...doneStatuses)', {
          doneStatuses: [IssueStatus.RESOLVED, IssueStatus.CLOSED],
        })
        .execute();
    }

    return version;
  }

  /**
   * Generates formatted GitHub/GitLab markdown release notes for a version.
   */
  async generateReleaseNotes(
    projectId: number,
    versionId: number,
  ): Promise<{ version: string; releaseNotes: string }> {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    const version = await this.versionRepository.findOne({
      where: { id: versionId, projectId },
    });
    if (!project || !version) {
      throw new NotFoundException(`Version #${versionId} not found in project #${projectId}`);
    }

    const issues = await this.issueRepository.find({
      where: { fixVersionId: versionId },
      order: { issueNum: 'ASC' },
    });

    const features = issues.filter((i) => i.issueType === IssueType.FEATURE);
    const bugs = issues.filter((i) => i.issueType === IssueType.BUG);
    const others = issues.filter(
      (i) => i.issueType !== IssueType.FEATURE && i.issueType !== IssueType.BUG,
    );

    const lines: string[] = [];
    lines.push(`# Release ${version.name} - ${project.name}`);
    lines.push(`Date: ${version.releaseDate || 'Unreleased'}\n`);

    if (version.description) {
      lines.push(`${version.description}\n`);
    }

    if (features.length > 0) {
      lines.push('### Features');
      features.forEach((f) => {
        lines.push(`- **[${project.key}-${f.issueNum}]** ${f.title}`);
      });
      lines.push('');
    }

    if (bugs.length > 0) {
      lines.push('### Bug Fixes');
      bugs.forEach((b) => {
        lines.push(`- **[${project.key}-${b.issueNum}]** ${b.title}`);
      });
      lines.push('');
    }

    if (others.length > 0) {
      lines.push('### Improvements & Tasks');
      others.forEach((o) => {
        lines.push(`- **[${project.key}-${o.issueNum}]** ${o.title}`);
      });
      lines.push('');
    }

    if (issues.length === 0) {
      lines.push('No issues assigned to this release version yet.');
    }

    return {
      version: version.name,
      releaseNotes: lines.join('\n'),
    };
  }
}

