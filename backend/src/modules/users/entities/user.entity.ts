import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { LoginAuditLog } from '../../security-audit/entities/login-audit-log.entity.js';

export enum SystemRole {
  ADMIN = 'ADMIN',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  DEVELOPER = 'DEVELOPER',
  QA_ENGINEER = 'QA_ENGINEER',
  DEVOPS_ENGINEER = 'DEVOPS_ENGINEER',
  SECURITY_ENGINEER = 'SECURITY_ENGINEER',
  USER = 'USER',
}

export enum OAuthProvider {
  LOCAL = 'LOCAL',
  GITHUB = 'GITHUB',
  GOOGLE = 'GOOGLE',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'full_name', type: 'varchar', length: 100 })
  fullName: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', unique: true, length: 255 })
  email: string;

  // Nullable to support OAuth-only accounts
  @Column({ name: 'password_hash', type: 'varchar', length: 255, nullable: true })
  passwordHash: string | null;

  @Column({
    name: 'system_role',
    type: 'varchar',
    length: 30,
    default: SystemRole.USER,
  })
  systemRole: SystemRole;

  // Coworker work label / job title (e.g. Software Developer, DevOps, QA, Security Engineer)
  @Column({ name: 'job_title', type: 'varchar', length: 100, nullable: true, default: 'Software Engineer' })
  jobTitle?: string | null;

  // User profile avatar image URL or preset identifier
  @Column({ name: 'avatar_url', type: 'varchar', length: 500, nullable: true })
  avatarUrl: string | null;

  // SDSecurity Task 3: Account activation status and token
  @Column({ name: 'is_activated', type: 'boolean', default: false })
  isActivated: boolean;

  @Column({ name: 'activation_token', type: 'varchar', length: 255, nullable: true })
  activationToken: string | null;

  @Column({ name: 'activation_token_expires_at', type: 'timestamptz', nullable: true })
  activationTokenExpiresAt: Date | null;

  // SDSecurity Task 4: Brute force lockout counters
  @Column({ name: 'failed_login_attempts', type: 'int', default: 0 })
  failedLoginAttempts: number;

  @Column({ name: 'locked_until', type: 'timestamptz', nullable: true })
  lockedUntil: Date | null;

  @Column({ name: 'is_blocked', type: 'boolean', default: false })
  isBlocked: boolean;

  // SDSecurity Task 5: Two-Factor Authentication (TOTP)
  @Column({ name: 'two_factor_enabled', type: 'boolean', default: false })
  twoFactorEnabled: boolean;

  @Column({ name: 'two_factor_secret', type: 'varchar', length: 255, nullable: true })
  twoFactorSecret: string | null;

  // Staging secret for unconfirmed 2FA enrollment (prevents overwriting working 2FA secret before confirmation)
  @Column({ name: 'two_factor_pending_secret', type: 'varchar', length: 255, nullable: true })
  twoFactorPendingSecret: string | null;

  // Token versioning for session revocation on logout and password reset
  @Column({ name: 'token_version', type: 'int', default: 0 })
  tokenVersion: number;

  // SDSecurity Task 6: External Identity Providers
  @Column({
    name: 'oauth_provider',
    type: 'varchar',
    length: 50,
    default: OAuthProvider.LOCAL,
  })
  oauthProvider: OAuthProvider;

  @Column({ name: 'oauth_id', type: 'varchar', length: 255, nullable: true })
  oauthId: string | null;

  // SDSecurity Task 7: Password Reset Token
  @Column({ name: 'reset_password_token', type: 'varchar', length: 255, nullable: true })
  resetPasswordToken: string | null;

  @Column({ name: 'reset_password_expires_at', type: 'timestamptz', nullable: true })
  resetPasswordExpiresAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => LoginAuditLog, (log) => log.user)
  loginAuditLogs: LoginAuditLog[];

  /**
   * Serializes User safely, stripping sensitive cryptographic material and tokens.
   */
  toJSON() {
    const {
      passwordHash,
      twoFactorSecret,
      activationToken,
      resetPasswordToken,
      ...safeUser
    } = this;
    return safeUser;
  }
}
