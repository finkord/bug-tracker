import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import type { Project } from './project.entity.js';

export enum ProjectVersionStatus {
  UNRELEASED = 'UNRELEASED',
  RELEASED = 'RELEASED',
  ARCHIVED = 'ARCHIVED',
}

@Entity('project_versions')
@Index(['projectId', 'name'], { unique: true })
@Index(['projectId', 'status'])
export class ProjectVersion {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'project_id', type: 'int' })
  projectId: number;

  @ManyToOne('Project', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'varchar',
    length: 30,
    default: ProjectVersionStatus.UNRELEASED,
  })
  status: ProjectVersionStatus;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: string | null;

  @Column({ name: 'release_date', type: 'date', nullable: true })
  releaseDate: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
