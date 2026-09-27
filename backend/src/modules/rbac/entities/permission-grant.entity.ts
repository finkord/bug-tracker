import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import type { PermissionScheme } from './permission-scheme.entity.js';
import type { ProjectRole } from './project-role.entity.js';
import type { Group } from './group.entity.js';

export enum ProjectPermission {
  // Project Permissions
  BROWSE_PROJECTS = 'BROWSE_PROJECTS',
  ADMINISTER_PROJECTS = 'ADMINISTER_PROJECTS',
  VIEW_ROADMAP = 'VIEW_ROADMAP',

  // Issue Permissions
  CREATE_ISSUES = 'CREATE_ISSUES',
  EDIT_ISSUES = 'EDIT_ISSUES',
  ASSIGN_ISSUES = 'ASSIGN_ISSUES',
  ASSIGNABLE_USER = 'ASSIGNABLE_USER',
  DELETE_ISSUES = 'DELETE_ISSUES',
  MOVE_ISSUES = 'MOVE_ISSUES',
  CLOSE_ISSUES = 'CLOSE_ISSUES',
  TRANSITION_ISSUES = 'TRANSITION_ISSUES',

  // Comments & Worklogs
  ADD_COMMENTS = 'ADD_COMMENTS',
  EDIT_ALL_COMMENTS = 'EDIT_ALL_COMMENTS',
  EDIT_OWN_COMMENTS = 'EDIT_OWN_COMMENTS',
  DELETE_ALL_COMMENTS = 'DELETE_ALL_COMMENTS',
  DELETE_OWN_COMMENTS = 'DELETE_OWN_COMMENTS',
  LOG_WORK = 'LOG_WORK',
  EDIT_OWN_WORKLOGS = 'EDIT_OWN_WORKLOGS',
  EDIT_ALL_WORKLOGS = 'EDIT_ALL_WORKLOGS',
  DELETE_OWN_WORKLOGS = 'DELETE_OWN_WORKLOGS',
  DELETE_ALL_WORKLOGS = 'DELETE_ALL_WORKLOGS',

  // Attachments
  CREATE_ATTACHMENTS = 'CREATE_ATTACHMENTS',
  DELETE_ALL_ATTACHMENTS = 'DELETE_ALL_ATTACHMENTS',
  DELETE_OWN_ATTACHMENTS = 'DELETE_OWN_ATTACHMENTS',
}

export enum PermissionGrantType {
  ROLE = 'ROLE',
  GROUP = 'GROUP',
  LEAD = 'LEAD',
  REPORTER = 'REPORTER',
  ASSIGNEE = 'ASSIGNEE',
  ANY_LOGGED_IN = 'ANY_LOGGED_IN',
}

@Entity('permission_grants')
@Index(['schemeId', 'permission', 'grantType', 'roleId', 'groupId'], { unique: true })
export class PermissionGrant {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'scheme_id', type: 'int' })
  schemeId: number;

  @ManyToOne('PermissionScheme', (s: any) => s.grants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'scheme_id' })
  scheme: PermissionScheme;

  @Column({
    type: 'enum',
    enum: ProjectPermission,
  })
  permission: ProjectPermission;

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
