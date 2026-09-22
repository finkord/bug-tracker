import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import {
  LoginAuditLog,
  LoginAttemptStatus,
} from './entities/login-audit-log.entity.js';

export interface RecordAttemptDto {
  userId?: number | null;
  attemptedEmail: string;
  ipAddress: string;
  userAgent?: string | null;
  status: LoginAttemptStatus;
  failureReason?: string | null;
}

@Injectable()
export class SecurityAuditService {
  constructor(
    @InjectRepository(LoginAuditLog)
    private readonly auditLogRepository: Repository<LoginAuditLog>,
  ) {}

  /**
   * Records a user authentication attempt into the immutable security audit log (SDSecurity Task 4).
   */
  async recordLoginAttempt(dto: RecordAttemptDto): Promise<LoginAuditLog> {
    const log = this.auditLogRepository.create({
      userId: dto.userId ?? null,
      attemptedEmail: dto.attemptedEmail.toLowerCase().trim(),
      ipAddress: dto.ipAddress,
      userAgent: dto.userAgent ?? null,
      status: dto.status,
      failureReason: dto.failureReason ?? null,
    });
    return this.auditLogRepository.save(log);
  }

  /**
   * Counts failed login attempts for an email within the given rolling time window in minutes.
   */
  async countRecentFailedAttempts(
    email: string,
    windowMinutes: number = 15,
  ): Promise<number> {
    const threshold = new Date(Date.now() - windowMinutes * 60 * 1000);
    return this.auditLogRepository.count({
      where: {
        attemptedEmail: email.toLowerCase().trim(),
        status: LoginAttemptStatus.FAILED_PASSWORD,
        createdAt: MoreThanOrEqual(threshold),
      },
    });
  }

  /**
   * Retrieves paginated security login audit logs for administrator review (SDSecurity Task 4).
   */
  async getLoginLogs(page = 1, limit = 50): Promise<{ items: LoginAuditLog[]; total: number }> {
    const [items, total] = await this.auditLogRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: { user: true },
    });
    return { items, total };
  }
}
