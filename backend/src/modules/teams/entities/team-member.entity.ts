import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';
import type { Team } from './team.entity.js';

export enum TeamMemberRole {
  SCRUM_MASTER = 'SCRUM_MASTER',
  PRODUCT_OWNER = 'PRODUCT_OWNER',
  DEVELOPER = 'DEVELOPER',
  QA_ENGINEER = 'QA_ENGINEER',
  DESIGNER = 'DESIGNER',
}

@Entity('team_members')
@Index(['teamId', 'userId'], { unique: true })
export class TeamMember {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Index()
  @Column({ name: 'team_id', type: 'int' })
  teamId: number;

  @ManyToOne('Team', (team: Team) => team.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'team_id' })
  team: Team;

  @Index()
  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'varchar',
    length: 50,
    default: TeamMemberRole.DEVELOPER,
  })
  role: TeamMemberRole;

  @Column({
    name: 'weekly_capacity_hours',
    type: 'numeric',
    precision: 5,
    scale: 2,
    default: 40.0,
  })
  weeklyCapacityHours: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
