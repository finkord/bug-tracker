import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from './entities/team.entity.js';
import { TeamMember, TeamMemberRole } from './entities/team-member.entity.js';
import { Project } from '../projects/entities/project.entity.js';
import { User } from '../users/entities/user.entity.js';
import {
  CreateTeamDto,
  UpdateTeamDto,
  AddTeamMemberDto,
  UpdateTeamMemberDto,
} from './dto/team.dto.js';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(TeamMember)
    private readonly teamMemberRepository: Repository<TeamMember>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(projectId?: number): Promise<Team[]> {
    const qb = this.teamRepository
      .createQueryBuilder('team')
      .leftJoinAndSelect('team.project', 'project')
      .leftJoinAndSelect('team.lead', 'lead')
      .leftJoinAndSelect('team.members', 'members')
      .leftJoinAndSelect('members.user', 'memberUser');

    if (projectId) {
      qb.where('team.projectId = :projectId', { projectId });
    }

    return qb.orderBy('team.name', 'ASC').getMany();
  }

  async findById(id: number): Promise<Team> {
    const team = await this.teamRepository
      .createQueryBuilder('team')
      .leftJoinAndSelect('team.project', 'project')
      .leftJoinAndSelect('team.lead', 'lead')
      .leftJoinAndSelect('team.members', 'members')
      .leftJoinAndSelect('members.user', 'memberUser')
      .leftJoinAndSelect('team.sprints', 'sprints')
      .where('team.id = :id', { id })
      .getOne();

    if (!team) {
      throw new NotFoundException(`Scrum Team #${id} not found`);
    }

    return team;
  }

  async create(dto: CreateTeamDto): Promise<Team> {
    const project = await this.projectRepository.findOne({ where: { id: dto.projectId } });
    if (!project) {
      throw new NotFoundException(`Project #${dto.projectId} not found`);
    }

    if (dto.leadId) {
      const lead = await this.userRepository.findOne({ where: { id: dto.leadId } });
      if (!lead) {
        throw new NotFoundException(`Lead user #${dto.leadId} not found`);
      }
    }

    const team = this.teamRepository.create({
      name: dto.name.trim(),
      description: dto.description?.trim() || null,
      projectId: dto.projectId,
      leadId: dto.leadId || null,
      sprintCapacityHours: dto.sprintCapacityHours ?? 160.0,
    });

    const saved = await this.teamRepository.save(team);
    return this.findById(saved.id);
  }

  async update(id: number, dto: UpdateTeamDto): Promise<Team> {
    const team = await this.findById(id);

    if (dto.projectId && dto.projectId !== team.projectId) {
      const project = await this.projectRepository.findOne({ where: { id: dto.projectId } });
      if (!project) {
        throw new NotFoundException(`Project #${dto.projectId} not found`);
      }
      team.projectId = dto.projectId;
    }

    if (dto.leadId !== undefined) {
      if (dto.leadId !== null) {
        const lead = await this.userRepository.findOne({ where: { id: dto.leadId } });
        if (!lead) {
          throw new NotFoundException(`Lead user #${dto.leadId} not found`);
        }
      }
      team.leadId = dto.leadId;
    }

    if (dto.name !== undefined) team.name = dto.name.trim();
    if (dto.description !== undefined) team.description = dto.description?.trim() || null;
    if (dto.sprintCapacityHours !== undefined) team.sprintCapacityHours = dto.sprintCapacityHours;

    await this.teamRepository.save(team);
    return this.findById(id);
  }

  async delete(id: number): Promise<{ message: string }> {
    const team = await this.findById(id);
    await this.teamRepository.delete(team.id);
    return { message: `Team "${team.name}" has been deleted` };
  }

  async addMember(teamId: number, dto: AddTeamMemberDto): Promise<TeamMember> {
    const team = await this.findById(teamId);
    const user = await this.userRepository.findOne({ where: { id: dto.userId } });
    if (!user) {
      throw new NotFoundException(`User #${dto.userId} not found`);
    }

    const existing = await this.teamMemberRepository.findOne({
      where: { teamId: team.id, userId: user.id },
    });
    if (existing) {
      throw new ConflictException(`User #${dto.userId} is already a member of this Scrum Team`);
    }

    const member = this.teamMemberRepository.create({
      teamId: team.id,
      userId: user.id,
      role: dto.role || TeamMemberRole.DEVELOPER,
      weeklyCapacityHours: dto.weeklyCapacityHours ?? 40.0,
    });

    return this.teamMemberRepository.save(member);
  }

  async updateMember(
    teamId: number,
    memberId: number,
    dto: UpdateTeamMemberDto,
  ): Promise<TeamMember> {
    const member = await this.teamMemberRepository.findOne({
      where: { id: memberId, teamId },
      relations: { user: true },
    });
    if (!member) {
      throw new NotFoundException(`Team member #${memberId} not found in team #${teamId}`);
    }

    if (dto.role !== undefined) member.role = dto.role;
    if (dto.weeklyCapacityHours !== undefined) member.weeklyCapacityHours = dto.weeklyCapacityHours;

    return this.teamMemberRepository.save(member);
  }

  async removeMember(teamId: number, memberId: number): Promise<{ message: string }> {
    const member = await this.teamMemberRepository.findOne({
      where: { id: memberId, teamId },
    });
    if (!member) {
      throw new NotFoundException(`Team member #${memberId} not found in team #${teamId}`);
    }

    await this.teamMemberRepository.delete(member.id);
    return { message: 'Member removed from Scrum Team successfully' };
  }

  async calculateCapacity(
    teamId: number,
    sprintWeeks = 2,
  ): Promise<{
    teamId: number;
    teamName: string;
    sprintWeeks: number;
    totalCapacityHours: number;
    members: Array<{
      id: number;
      userId: number;
      fullName: string;
      role: string;
      weeklyCapacityHours: number;
      sprintCapacityHours: number;
    }>;
  }> {
    const team = await this.findById(teamId);
    const duration = Math.max(1, Math.min(sprintWeeks, 12));

    const members = (team.members || []).map((m) => {
      const weekly = Number(m.weeklyCapacityHours) || 40.0;
      const sprintCap = Math.round(weekly * duration * 100) / 100;
      return {
        id: m.id,
        userId: m.userId,
        fullName: m.user?.fullName || `User #${m.userId}`,
        role: m.role,
        weeklyCapacityHours: weekly,
        sprintCapacityHours: sprintCap,
      };
    });

    const sumMemberCapacities = members.reduce((acc, m) => acc + m.sprintCapacityHours, 0);
    const totalCapacityHours =
      members.length > 0 ? sumMemberCapacities : Number(team.sprintCapacityHours) || 160.0;

    return {
      teamId: team.id,
      teamName: team.name,
      sprintWeeks: duration,
      totalCapacityHours,
      members,
    };
  }
}
