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
import { Issue } from '../../issues/entities/issue.entity.js';

export enum VcsProvider {
  GITHUB = 'github',
  GITLAB = 'gitlab',
  BITBUCKET = 'bitbucket',
}

export enum VcsPullRequestStatus {
  OPEN = 'OPEN',
  MERGED = 'MERGED',
  CLOSED = 'CLOSED',
}

@Entity('vcs_pull_requests')
@Index(['issueId'])
@Index(['repository', 'prNumber'], { unique: true })
@Index(['provider'])
@Index(['status'])
export class VcsPullRequest {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'issue_id', type: 'int' })
  issueId: number;

  @ManyToOne(() => Issue, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'issue_id' })
  issue: Issue;

  @Column({
    type: 'varchar',
    length: 20,
    default: VcsProvider.GITHUB,
  })
  provider: VcsProvider;

  @Column({ type: 'varchar', length: 255 })
  repository: string;

  @Column({ name: 'pr_number', type: 'int' })
  prNumber: number;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ name: 'source_branch', type: 'varchar', length: 255 })
  sourceBranch: string;

  @Column({ name: 'target_branch', type: 'varchar', length: 255, default: 'main' })
  targetBranch: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: VcsPullRequestStatus.OPEN,
  })
  status: VcsPullRequestStatus;

  @Column({ type: 'varchar', length: 1000 })
  url: string;

  @Column({ name: 'author_username', type: 'varchar', length: 100, nullable: true })
  authorUsername: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
