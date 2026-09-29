import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import type { Project } from '../../projects/entities/project.entity.js';
import type { ProjectRole } from './project-role.entity.js';
import type { User } from '../../users/entities/user.entity.js';
import type { Group } from './group.entity.js';

export enum ProjectActorType {
  USER = 'USER',
  GROUP = 'GROUP',
}

@Entity('project_role_actors')
@Index(['projectId', 'roleId', 'actorType', 'userId', 'groupId'], { unique: true })
export class ProjectRoleActor {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'project_id', type: 'int' })
  projectId: number;

  @ManyToOne('Project', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'role_id', type: 'int' })
  roleId: number;

  @ManyToOne('ProjectRole', (r: ProjectRole) => r.actors, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: ProjectRole;

  @Column({
    name: 'actor_type',
    type: 'enum',
    enum: ProjectActorType,
    default: ProjectActorType.USER,
  })
  actorType: ProjectActorType;

  @Column({ name: 'user_id', type: 'int', nullable: true })
  userId: number | null;

  @ManyToOne('User', { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column({ name: 'group_id', type: 'int', nullable: true })
  groupId: number | null;

  @ManyToOne('Group', { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
