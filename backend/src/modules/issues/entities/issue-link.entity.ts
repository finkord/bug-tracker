import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import type { Issue } from './issue.entity.js';

export enum IssueLinkType {
  BLOCKS = 'BLOCKS',
  IS_BLOCKED_BY = 'IS_BLOCKED_BY',
  DUPLICATES = 'DUPLICATES',
  RELATES_TO = 'RELATES_TO',
}

@Entity('issue_links')
@Index(['sourceIssueId', 'targetIssueId', 'linkType'], { unique: true })
export class IssueLink {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'source_issue_id', type: 'int' })
  sourceIssueId: number;

  @ManyToOne('Issue', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'source_issue_id' })
  sourceIssue: Issue;

  @Column({ name: 'target_issue_id', type: 'int' })
  targetIssueId: number;

  @ManyToOne('Issue', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_issue_id' })
  targetIssue: Issue;

  @Column({
    name: 'link_type',
    type: 'varchar',
    length: 30,
    default: IssueLinkType.RELATES_TO,
  })
  linkType: IssueLinkType;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
