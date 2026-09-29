import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import type { IssueSecurityLevel } from './issue-security-level.entity.js';
import type { ProjectRole } from './project-role.entity.js';
import type { Group } from './group.entity.js';
import { PermissionGrantType } from './permission-grant.entity.js';

@Entity('issue_security_grants')
@Index(['securityLevelId', 'grantType', 'roleId', 'groupId'], { unique: true })
export class IssueSecurityGrant {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'security_level_id', type: 'int' })
  securityLevelId: number;

  @ManyToOne('IssueSecurityLevel', (lvl: IssueSecurityLevel) => lvl.grants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'security_level_id' })
  securityLevel: IssueSecurityLevel;

  @Column({
    name: 'grant_type',
    type: 'enum',
    enum: PermissionGrantType,
    default: PermissionGrantType.ROLE,
  })
  grantType: PermissionGrantType;

  @Column({ name: 'role_id', type: 'int', nullable: true })
  roleId: number | null;

  @ManyToOne('ProjectRole', { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: ProjectRole | null;

  @Column({ name: 'group_id', type: 'int', nullable: true })
  groupId: number | null;

  @ManyToOne('Group', { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
