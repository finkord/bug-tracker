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
import { User } from '../../users/entities/user.entity.js';
import type { Project } from '../../projects/entities/project.entity.js';
import type { Comment } from './comment.entity.js';
import type { Worklog } from './worklog.entity.js';

export enum IssueType {
  BUG = 'BUG',
  TASK = 'TASK',
  FEATURE = 'FEATURE',
  IMPROVEMENT = 'IMPROVEMENT',
}

export enum IssueStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum IssuePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum IssueSeverity {
  MINOR = 'MINOR',
  MAJOR = 'MAJOR',
  BLOCKER = 'BLOCKER',
  TRIVIAL = 'TRIVIAL',
}

@Entity('issues')
@Index(['projectId', 'issueNum'], { unique: true })
export class Issue {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'project_id', type: 'int' })
  projectId: number;

  @ManyToOne('Project', 'issues', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'issue_num', type: 'int' })
  issueNum: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    name: 'issue_type',
    type: 'varchar',
    length: 20,
    default: IssueType.BUG,
  })
  issueType: IssueType;

  @Column({
    type: 'varchar',
    length: 20,
    default: IssueStatus.OPEN,
  })
  status: IssueStatus;

  @Column({
    type: 'varchar',
    length: 20,
    default: IssuePriority.MEDIUM,
  })
  priority: IssuePriority;

  @Column({
    type: 'varchar',
    length: 20,
    default: IssueSeverity.MAJOR,
  })
  severity: IssueSeverity;

  // Estimated hours for completing the task (planning)
  @Column({ name: 'estimated_hours', type: 'float', default: 0 })
  estimatedHours: number;

  // Aggregated logged hours by developers
  @Column({ name: 'logged_hours', type: 'float', default: 0 })
  loggedHours: number;

  // Sprint designation (e.g. 'Sprint 1', or null if in Backlog)
  @Column({ type: 'varchar', length: 100, nullable: true })
  sprint: string | null;

  @Column({ name: 'reporter_id', type: 'int' })
  reporterId: number;

  @ManyToOne(() => User, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'reporter_id' })
  reporter: User;

  @Column({ name: 'assignee_id', type: 'int', nullable: true })
  assigneeId: number | null;

  @ManyToOne(() => User, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assignee_id' })
  assignee: User | null;

  @OneToMany('Comment', 'issue')
  comments: Comment[];

  @OneToMany('Worklog', 'issue')
  worklogs: Worklog[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
