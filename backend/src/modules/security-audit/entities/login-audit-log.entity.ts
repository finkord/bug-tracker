import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';

export enum LoginAttemptStatus {
  SUCCESS = 'SUCCESS',
  FAILED_PASSWORD = 'FAILED_PASSWORD',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  BLOCKED_BY_ADMIN = 'BLOCKED_BY_ADMIN',
  REQUIRE_2FA = 'REQUIRE_2FA',
  TWO_FACTOR_SUCCESS = 'TWO_FACTOR_SUCCESS',
  TWO_FACTOR_FAILED = 'TWO_FACTOR_FAILED',
}

@Entity('login_audit_logs')
export class LoginAuditLog {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'user_id', type: 'bigint', nullable: true })
  userId: number | null;

  @ManyToOne(() => User, (user) => user.loginAuditLogs, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Index()
  @Column({ name: 'attempted_email', type: 'varchar', length: 255 })
  attemptedEmail: string;

  @Column({ name: 'ip_address', type: 'varchar', length: 45 })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @Column({
    type: 'varchar',
    length: 30,
  })
  status: LoginAttemptStatus;

  @Column({ name: 'failure_reason', type: 'varchar', length: 255, nullable: true })
  failureReason: string | null;

  @Index()
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
