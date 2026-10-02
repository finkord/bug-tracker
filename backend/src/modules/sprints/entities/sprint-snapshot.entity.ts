import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Sprint } from './sprint.entity.js';

@Entity('sprint_snapshots')
@Index(['sprintId', 'snapshotDate'], { unique: true })
export class SprintSnapshot {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'sprint_id', type: 'int' })
  sprintId: number;

  @ManyToOne(() => Sprint, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sprint_id' })
  sprint: Sprint;

  @Column({ name: 'snapshot_date', type: 'varchar', length: 10 })
  snapshotDate: string; // YYYY-MM-DD format

  @Column({ name: 'total_scope_hours', type: 'float', default: 0 })
  totalScopeHours: number;

  @Column({ name: 'completed_hours', type: 'float', default: 0 })
  completedHours: number;

  @Column({ name: 'remaining_hours', type: 'float', default: 0 })
  remainingHours: number;

  @Column({ name: 'total_issues', type: 'int', default: 0 })
  totalIssues: number;

  @Column({ name: 'completed_issues', type: 'int', default: 0 })
  completedIssues: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
