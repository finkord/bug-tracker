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
import type { Issue } from './issue.entity.js';

@Entity('worklogs')
export class Worklog {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'issue_id', type: 'int' })
  @Index()
  issueId: number;

  @ManyToOne('Issue', 'worklogs', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'issue_id' })
  issue: Issue;

  @Column({ name: 'user_id', type: 'int' })
  @Index()
  userId: number;

  @ManyToOne(() => User, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'time_spent_hours', type: 'float' })
  timeSpentHours: number;

  @Column({ name: 'date_logged', type: 'date', default: () => 'CURRENT_DATE' })
  dateLogged: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
