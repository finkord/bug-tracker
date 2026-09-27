import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import type { IssueSecurityLevel } from './issue-security-level.entity.js';

@Entity('issue_security_schemes')
export class IssueSecurityScheme {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'default_level_id', type: 'int', nullable: true })
  defaultLevelId: number | null;

  @OneToMany('IssueSecurityLevel', (lvl: any) => lvl.scheme)
  levels: IssueSecurityLevel[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
