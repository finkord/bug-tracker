import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import type { IssueSecurityScheme } from './issue-security-scheme.entity.js';
import type { IssueSecurityGrant } from './issue-security-grant.entity.js';

@Entity('issue_security_levels')
export class IssueSecurityLevel {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'scheme_id', type: 'int' })
  schemeId: number;

  @ManyToOne('IssueSecurityScheme', (s: IssueSecurityScheme) => s.levels, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'scheme_id' })
  scheme: IssueSecurityScheme;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @OneToMany('IssueSecurityGrant', (grant: IssueSecurityGrant) => grant.securityLevel)
  grants: IssueSecurityGrant[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
