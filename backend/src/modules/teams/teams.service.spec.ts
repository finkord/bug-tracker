import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { TeamsService } from './teams.service.js';
import { Team } from './entities/team.entity.js';
import { TeamMember, TeamMemberRole } from './entities/team-member.entity.js';
import { Project } from '../projects/entities/project.entity.js';
import { User } from '../users/entities/user.entity.js';
import type { Repository } from 'typeorm';

describe('TeamsService (Scrum Teams & Capacity)', () => {
  let service: TeamsService;
  let mockTeamRepo: any;
  let mockTeamMemberRepo: any;
  let mockProjectRepo: any;
  let mockUserRepo: any;

  const mockProject: Project = Object.assign(new Project(), {
    id: 1,
    name: 'Core Platform',
    key: 'CORE',
  });

  const mockUser: User = Object.assign(new User(), {
    id: 2,
    fullName: 'Scrum Lead Alex',
    email: 'alex@bugtracker.local',
  });

  const mockMemberUser: User = Object.assign(new User(), {
    id: 5,
    fullName: 'Developer Rachel',
    email: 'rachel@bugtracker.local',
  });

  const mockTeam: Team = Object.assign(new Team(), {
    id: 10,
    name: 'Alpha Scrum Team',
    description: 'Core product team',
    projectId: 1,
    leadId: 2,
    sprintCapacityHours: 160.0,
    project: mockProject,
    lead: mockUser,
    members: [],
    sprints: [],
  });

  beforeEach(() => {
    mockTeamRepo = {
      createQueryBuilder: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn((dto) => Object.assign(new Team(), dto)),
      save: vi.fn(async (t) => Object.assign(new Team(), { id: 10, ...t })),
      delete: vi.fn(),
    };

    mockTeamMemberRepo = {
      findOne: vi.fn(),
      create: vi.fn((dto) => Object.assign(new TeamMember(), dto)),
      save: vi.fn(async (m) => Object.assign(new TeamMember(), { id: 1, ...m })),
      delete: vi.fn(),
    };

    mockProjectRepo = {
      findOne: vi.fn(),
    };

    mockUserRepo = {
      findOne: vi.fn(),
    };

    service = new TeamsService(
      mockTeamRepo as Repository<Team>,
      mockTeamMemberRepo as Repository<TeamMember>,
      mockProjectRepo as Repository<Project>,
      mockUserRepo as Repository<User>,
    );
  });

  describe('create', () => {
    it('should create a Scrum team bound to a project with sprint capacity', async () => {
      mockProjectRepo.findOne.mockResolvedValue(mockProject);
      mockUserRepo.findOne.mockResolvedValue(mockUser);

      const qb = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue(mockTeam),
      };
      mockTeamRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.create({
        name: 'Alpha Scrum Team',
        projectId: 1,
        leadId: 2,
        sprintCapacityHours: 160.0,
      });

      expect(mockProjectRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { id: 2 } });
      expect(mockTeamRepo.create).toHaveBeenCalledWith({
        name: 'Alpha Scrum Team',
        description: null,
        projectId: 1,
        leadId: 2,
        sprintCapacityHours: 160.0,
      });
      expect(result).toEqual(mockTeam);
    });

    it('should throw NotFoundException if project does not exist', async () => {
      mockProjectRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create({
          name: 'Nonexistent Team',
          projectId: 999,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addMember', () => {
    it('should add a member with role and weekly capacity', async () => {
      const qb = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue(mockTeam),
      };
      mockTeamRepo.createQueryBuilder.mockReturnValue(qb);
      mockUserRepo.findOne.mockResolvedValue(mockMemberUser);
      mockTeamMemberRepo.findOne.mockResolvedValue(null);

      const member = await service.addMember(10, {
        userId: 5,
        role: TeamMemberRole.DEVELOPER,
        weeklyCapacityHours: 40.0,
      });

      expect(mockTeamMemberRepo.create).toHaveBeenCalledWith({
        teamId: 10,
        userId: 5,
        role: TeamMemberRole.DEVELOPER,
        weeklyCapacityHours: 40.0,
      });
      expect(member.teamId).toBe(10);
      expect(member.userId).toBe(5);
    });

    it('should throw ConflictException if user is already a member', async () => {
      const qb = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue(mockTeam),
      };
      mockTeamRepo.createQueryBuilder.mockReturnValue(qb);
      mockUserRepo.findOne.mockResolvedValue(mockMemberUser);
      mockTeamMemberRepo.findOne.mockResolvedValue({ id: 99, teamId: 10, userId: 5 });

      await expect(
        service.addMember(10, {
          userId: 5,
          role: TeamMemberRole.DEVELOPER,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('calculateCapacity', () => {
    it('should compute aggregated sprint capacity based on member weekly hours', async () => {
      const teamWithMembers = {
        ...mockTeam,
        members: [
          {
            id: 1,
            userId: 5,
            user: mockMemberUser,
            role: TeamMemberRole.DEVELOPER,
            weeklyCapacityHours: 40.0,
          },
          {
            id: 2,
            userId: 2,
            user: mockUser,
            role: TeamMemberRole.SCRUM_MASTER,
            weeklyCapacityHours: 30.0,
          },
        ],
      };

      const qb = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue(teamWithMembers),
      };
      mockTeamRepo.createQueryBuilder.mockReturnValue(qb);

      // 2-week sprint: Developer (40 * 2 = 80h) + Scrum Master (30 * 2 = 60h) = 140h
      const capacity = await service.calculateCapacity(10, 2);

      expect(capacity.sprintWeeks).toBe(2);
      expect(capacity.totalCapacityHours).toBe(140.0);
      expect(capacity.members).toHaveLength(2);
      expect(capacity.members[0].sprintCapacityHours).toBe(80.0);
      expect(capacity.members[1].sprintCapacityHours).toBe(60.0);
    });
  });
});
