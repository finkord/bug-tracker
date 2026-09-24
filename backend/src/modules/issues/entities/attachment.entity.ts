import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Issue } from './issue.entity.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('issue_attachments')
export class Attachment {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Index()
  @Column({ name: 'issue_id', type: 'int' })
  issueId: number;

  @ManyToOne(() => Issue, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'issue_id' })
  issue: Issue;

  @Column({ type: 'varchar', length: 255 })
  filename: string;

  @Column({ name: 'file_size', type: 'int' })
  fileSize: number;

  @Column({ name: 'mime_type', type: 'varchar', length: 100 })
  mimeType: string;

  @Column({ type: 'varchar', length: 100 })
  fid: string;

  @Column({ type: 'varchar', length: 500 })
  url: string;

  @Column({ name: 'uploader_id', type: 'int' })
  uploaderId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploader_id' })
  uploader: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
