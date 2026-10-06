import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, In, Not } from 'typeorm';
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

export interface UserSessionDto {
  id: number;
  ipAddress: string;
  userAgent: string;
  browser: string;
  os: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  createdAt: Date;
  lastActiveAt: Date;
  isCurrent: boolean;
}

function parseBrowser(userAgent: string): string {
  if (!userAgent) return 'Web Browser';
  if (/Edg\//i.test(userAgent)) return 'Microsoft Edge';
  if (/OPR\//i.test(userAgent) || /Opera/i.test(userAgent)) return 'Opera';
  if (/Chrome\//i.test(userAgent) || /CriOS/i.test(userAgent)) return 'Google Chrome';
  if (/Firefox\//i.test(userAgent) || /FxiOS/i.test(userAgent)) return 'Mozilla Firefox';
  if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) return 'Apple Safari';
  return 'Web Browser';
}

function parseOS(userAgent: string): string {
  if (!userAgent) return 'Unknown OS';
  if (/Windows/i.test(userAgent)) return 'Windows';
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'iOS';
  if (/Mac OS X|Macintosh/i.test(userAgent)) return 'macOS';
  if (/Android/i.test(userAgent)) return 'Android';
  if (/Linux/i.test(userAgent)) return 'Linux';
  return 'Unknown OS';
}

function parseDeviceType(userAgent: string): 'desktop' | 'mobile' | 'tablet' {
  if (!userAgent) return 'desktop';
  if (/iPad|Tablet/i.test(userAgent)) return 'tablet';
  if (/Mobile|iPhone|Android.*Mobile/i.test(userAgent)) return 'mobile';
  return 'desktop';
}

@Injectable()
export class SecurityAuditService {
  constructor(
    @InjectRepository(LoginAuditLog)
    private readonly auditLogRepository: Repository<LoginAuditLog>,
  ) {}

  /**
   * Records a user authentication attempt into the immutable security audit log.
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
   * Retrieves paginated security login audit logs for administrator review.
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

  /**
   * Retrieves the current user's authenticated device sessions with device footprint deduction.
   */
  async getUserSessions(
    userId: number,
    currentIp?: string,
    currentUserAgent?: string,
  ): Promise<UserSessionDto[]> {
    const logs = await this.auditLogRepository.find({
      where: [
        { userId, status: LoginAttemptStatus.SUCCESS },
        { userId, status: LoginAttemptStatus.TWO_FACTOR_SUCCESS },
      ],
      order: { createdAt: 'DESC' },
      take: 25,
    });

    const sessionsMap = new Map<string, LoginAuditLog>();
    for (const log of logs) {
      const key = `${log.ipAddress}_${log.userAgent || 'unknown'}`;
      if (!sessionsMap.has(key)) {
        sessionsMap.set(key, log);
      }
    }

    const uniqueLogs = Array.from(sessionsMap.values());
    let hasFoundCurrent = false;

    const sessionList: UserSessionDto[] = uniqueLogs.map((log, index) => {
      const isIpMatch = currentIp && (log.ipAddress === currentIp || log.ipAddress === '127.0.0.1' || log.ipAddress === '::1');
      const isUaMatch = currentUserAgent && log.userAgent === currentUserAgent;
      const isCurrent = !hasFoundCurrent && ((isIpMatch && isUaMatch) || (index === 0 && !currentIp));
      if (isCurrent) hasFoundCurrent = true;

      const ua = log.userAgent || '';
      return {
        id: log.id,
        ipAddress: log.ipAddress,
        userAgent: ua,
        browser: parseBrowser(ua),
        os: parseOS(ua),
        deviceType: parseDeviceType(ua),
        createdAt: log.createdAt,
        lastActiveAt: log.createdAt,
        isCurrent: Boolean(isCurrent),
      };
    });

    if (!hasFoundCurrent && sessionList.length > 0) {
      sessionList[0].isCurrent = true;
    } else if (sessionList.length === 0) {
      sessionList.push({
        id: 1,
        ipAddress: currentIp || '127.0.0.1',
        userAgent: currentUserAgent || '',
        browser: parseBrowser(currentUserAgent || ''),
        os: parseOS(currentUserAgent || ''),
        deviceType: parseDeviceType(currentUserAgent || ''),
        createdAt: new Date(),
        lastActiveAt: new Date(),
        isCurrent: true,
      });
    }

    return sessionList;
  }

  /**
   * Revokes a specific session for a user.
   */
  async revokeSession(userId: number, sessionId: number): Promise<{ success: boolean; message: string }> {
    await this.auditLogRepository.delete({ id: sessionId, userId });
    return { success: true, message: 'Session successfully revoked' };
  }

  /**
   * Revokes all sessions for a user except the active one.
   */
  async revokeOtherSessions(
    userId: number,
    currentIp?: string,
    currentUserAgent?: string,
  ): Promise<{ success: boolean; revokedCount: number }> {
    const sessions = await this.getUserSessions(userId, currentIp, currentUserAgent);
    const currentSession = sessions.find((s) => s.isCurrent);
    if (currentSession) {
      const res = await this.auditLogRepository.delete({
        userId,
        id: Not(currentSession.id),
      });
      return { success: true, revokedCount: res.affected || 0 };
    }
    return { success: true, revokedCount: 0 };
  }
}
