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
import type { Issue } from '../../issues/entities/issue.entity.js';
import type { PermissionScheme } from '../../rbac/entities/permission-scheme.entity.js';
import type { IssueSecurityScheme } from '../../rbac/entities/issue-security-scheme.entity.js';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 10, unique: true })
  key: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'lead_id', type: 'int' })
  leadId: number;

  @ManyToOne(() => User, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'lead_id' })
  lead: User;

  @Column({ name: 'avatar_url', type: 'varchar', length: 500, nullable: true })
  avatarUrl: string | null;

  @OneToMany('Issue', 'project')
  issues: Issue[];

  @Column({ name: 'permission_scheme_id', type: 'int', nullable: true })
  permissionSchemeId: number | null;

  @ManyToOne('PermissionScheme', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'permission_scheme_id' })
  permissionScheme: PermissionScheme | null;

  @Column({ name: 'security_scheme_id', type: 'int', nullable: true })
  securitySchemeId: number | null;

  @ManyToOne('IssueSecurityScheme', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'security_scheme_id' })
  securityScheme: IssueSecurityScheme | null;

  @Column({ name: 'wip_limits', type: 'jsonb', nullable: true })
  wipLimits: Record<string, number> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
