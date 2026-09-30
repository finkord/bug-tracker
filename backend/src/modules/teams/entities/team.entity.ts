import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { TeamMember } from './team-member.entity.js';
import type { Sprint } from '../../sprints/entities/sprint.entity.js';

@Entity('teams')
export class Team {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Index()
  @Column({ name: 'project_id', type: 'int' })
  projectId: number;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'lead_id', type: 'int', nullable: true })
  leadId: number | null;

  @ManyToOne(() => User, { nullable: true, eager: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'lead_id' })
  lead: User | null;

  @Column({
    name: 'sprint_capacity_hours',
    type: 'numeric',
    precision: 6,
    scale: 2,
    default: 160.0,
  })
  sprintCapacityHours: number;

  @OneToMany(() => TeamMember, (tm) => tm.team, { cascade: true })
  members: TeamMember[];

  @OneToMany('Sprint', 'team')
  sprints: Sprint[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
