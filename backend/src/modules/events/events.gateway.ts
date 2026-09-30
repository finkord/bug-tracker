import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service.js';
import { RedisService } from '../redis/redis.service.js';
import { PermissionEvaluatorService } from '../rbac/services/permission-evaluator.service.js';
import { ProjectPermission } from '../rbac/entities/permission-grant.entity.js';
import { User } from '../users/entities/user.entity.js';
import { Issue } from '../issues/entities/issue.entity.js';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';

export interface EventUserPresence {
  id?: number;
  fullName?: string;
  email?: string;
  avatarUrl?: string | null;
}

export interface BroadcastIssuePayload {
  id: number;
  projectId: number;
  key?: string;
  title?: string;
  status?: string;
  priority?: string;
  securityLevelId?: number | null;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/events',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);
  private static readonly SESSION_PREFIX = 'user:session:';
  private static readonly SESSION_CACHE_TTL_SECONDS = 300;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly redisService: RedisService,
    private readonly permissionEvaluator: PermissionEvaluatorService,
    @InjectRepository(Issue)
    private readonly issueRepository: Repository<Issue>,
  ) {}

  private extractToken(client: Socket): string | null {
    // 1. auth.token payload
    const authPayload = client.handshake.auth?.token;
    if (typeof authPayload === 'string' && authPayload.trim()) {
      const trimmed = authPayload.trim();
      return trimmed.startsWith('Bearer ') ? trimmed.slice(7).trim() : trimmed;
    }

    // 2. Authorization header
    const authHeader = client.handshake.headers?.authorization;
    if (typeof authHeader === 'string' && authHeader.trim()) {
      const trimmed = authHeader.trim();
      return trimmed.startsWith('Bearer ') ? trimmed.slice(7).trim() : trimmed;
    }

    // 3. Cookie header (accessToken)
    const cookieHeader = client.handshake.headers?.cookie;
    if (typeof cookieHeader === 'string' && cookieHeader.trim()) {
      const cookies = cookieHeader.split(';');
      for (const c of cookies) {
        const trimmed = c.trim();
        if (trimmed.startsWith('accessToken=')) {
          return decodeURIComponent(trimmed.slice('accessToken='.length).trim());
        }
      }
    }

    return null;
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn(`Unauthorized WebSocket connection rejected (no token): ${client.id}`);
        client.disconnect(true);
        return;
      }

      const secret =
        this.configService?.get<string>?.('JWT_SECRET') ||
        process.env.JWT_SECRET ||
        'super_secret_jwt_access_key_change_in_production_min_32_chars';

      let payload: JwtPayload;
      try {
        payload = await this.jwtService.verifyAsync<JwtPayload>(token, { secret });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Invalid or expired WebSocket JWT from ${client.id}: ${msg}`);
        client.disconnect(true);
        return;
      }

      // Reject temporary 2FA challenge tokens
      if (payload.is2faPending || payload.tokenType === '2fa_challenge') {
        this.logger.warn(`WebSocket connection rejected: 2FA pending for ${client.id}`);
        client.disconnect(true);
        return;
      }

      // Fast Redis session cache lookup
      const sessionKey = `${EventsGateway.SESSION_PREFIX}${payload.sub}`;
      let user: User | null = null;
      const cachedUserJson = await this.redisService.get(sessionKey);
      if (cachedUserJson) {
        try {
          user = JSON.parse(cachedUserJson) as User;
        } catch {
          user = null;
        }
      }

      if (!user) {
        user = await this.usersService.findById(payload.sub);
        if (user && !user.isBlocked && user.isActivated) {
          await this.redisService.set(
            sessionKey,
            JSON.stringify(user),
            EventsGateway.SESSION_CACHE_TTL_SECONDS,
          );
        }
      }

      if (!user || user.isBlocked || !user.isActivated) {
        this.logger.warn(`WebSocket connection rejected: user ${payload.sub} inactive/blocked`);
        client.disconnect(true);
        return;
      }

      if (
        typeof payload.tokenVersion === 'number' &&
        typeof user.tokenVersion === 'number' &&
        payload.tokenVersion < user.tokenVersion
      ) {
        this.logger.warn(
          `WebSocket connection rejected: revoked token version for user ${user.id}`,
        );
        client.disconnect(true);
        return;
      }

      // Attach authenticated user to socket data context
      client.data.user = user;
      this.logger.log(`Authenticated user ${user.id} (${user.email}) connected: ${client.id}`);
    } catch (error) {
      this.logger.error(`Error during WebSocket connection authentication: ${error}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected from events namespace: ${client.id}`);
  }

  @SubscribeMessage('join:project')
  async handleJoinProject(
    @MessageBody() data: { projectId: number | string },
    @ConnectedSocket() client: Socket,
  ): Promise<{ event: string; room?: string; error?: string }> {
    const user = client.data?.user as User | undefined;
    if (!user) {
      client.disconnect(true);
      return { event: 'error', error: 'Unauthorized: connection not authenticated' };
    }

    const projectId = Number(data?.projectId);
    if (!projectId || isNaN(projectId)) {
      return { event: 'error', error: 'Invalid project ID' };
    }

    const hasAccess = await this.permissionEvaluator.hasPermission({
      userId: user.id,
      projectId,
      permission: ProjectPermission.BROWSE_PROJECTS,
    });

    if (!hasAccess) {
      this.logger.warn(`User ${user.id} denied access to join project room ${projectId}`);
      return {
        event: 'error',
        error: 'Access denied: insufficient permissions to view this project',
      };
    }

    const room = `project_${projectId}`;
    await client.join(room);
    this.logger.log(`User ${user.id} (socket ${client.id}) joined room ${room}`);
    return { event: 'joined:project', room };
  }

  @SubscribeMessage('leave:project')
  async handleLeaveProject(
    @MessageBody() data: { projectId: number | string },
    @ConnectedSocket() client: Socket,
  ): Promise<{ event: string; room: string }> {
    const room = `project_${data.projectId}`;
    await client.leave(room);
    this.logger.log(`Socket ${client.id} left room ${room}`);
    return { event: 'left:project', room };
  }

  @SubscribeMessage('join:issue')
  async handleJoinIssue(
    @MessageBody() data: { issueId: number | string; user?: EventUserPresence },
    @ConnectedSocket() client: Socket,
  ): Promise<{ event: string; room?: string; error?: string }> {
    const user = client.data?.user as User | undefined;
    if (!user) {
      client.disconnect(true);
      return { event: 'error', error: 'Unauthorized: connection not authenticated' };
    }

    const issueId = Number(data?.issueId);
    if (!issueId || isNaN(issueId)) {
      return { event: 'error', error: 'Invalid issue ID' };
    }

    const issue = await this.issueRepository.findOne({
      where: { id: issueId },
    });
    if (!issue) {
      return { event: 'error', error: 'Issue not found' };
    }

    const hasAccess = await this.permissionEvaluator.hasPermission({
      userId: user.id,
      projectId: issue.projectId,
      permission: ProjectPermission.BROWSE_PROJECTS,
      issueId: issue.id,
    });

    if (!hasAccess) {
      this.logger.warn(`User ${user.id} denied access to join issue room ${issueId}`);
      return { event: 'error', error: 'Access denied: insufficient permissions to view this issue' };
    }

    const room = `issue_${issueId}`;
    await client.join(room);
    if (data?.user) {
      client.to(room).emit('presence:viewing', {
        user: data.user,
        issueId,
      });
    }
    return { event: 'joined:issue', room };
  }

  @SubscribeMessage('leave:issue')
  async handleLeaveIssue(
    @MessageBody() data: { issueId: number | string },
    @ConnectedSocket() client: Socket,
  ): Promise<{ event: string; room: string }> {
    const room = `issue_${data.issueId}`;
    await client.leave(room);
    return { event: 'left:issue', room };
  }

  // Broadcaster methods with strict room isolation (zero global leak)
  async broadcastIssueCreated(issue: BroadcastIssuePayload): Promise<void> {
    if (!this.server) return;
    const room = `project_${issue.projectId}`;

    if (issue.securityLevelId) {
      const sockets = await this.server.in(room).fetchSockets();
      for (const socket of sockets) {
        const user = (socket.data as { user?: User })?.user;
        if (user) {
          const allowed = await this.permissionEvaluator.hasPermission({
            userId: user.id,
            projectId: issue.projectId,
            permission: ProjectPermission.BROWSE_PROJECTS,
            issueId: issue.id,
          });
          if (allowed) {
            socket.emit('issue:created', issue);
          }
        }
      }
    } else {
      this.server.to(room).emit('issue:created', issue);
    }
  }

  async broadcastIssueUpdated(issue: BroadcastIssuePayload): Promise<void> {
    if (!this.server) return;
    const projectRoom = `project_${issue.projectId}`;
    const issueRoom = `issue_${issue.id}`;

    if (issue.securityLevelId) {
      const sockets = await this.server.in(projectRoom).fetchSockets();
      for (const socket of sockets) {
        const user = (socket.data as { user?: User })?.user;
        if (user) {
          const allowed = await this.permissionEvaluator.hasPermission({
            userId: user.id,
            projectId: issue.projectId,
            permission: ProjectPermission.BROWSE_PROJECTS,
            issueId: issue.id,
          });
          if (allowed) {
            socket.emit('issue:updated', issue);
          }
        }
      }
    } else {
      this.server.to(projectRoom).emit('issue:updated', issue);
    }

    // Clients inside issue room were already validated when joining
    this.server.to(issueRoom).emit('issue:updated', issue);
  }

  broadcastIssueDeleted(issueId: number, projectId: number): void {
    if (this.server) {
      this.server.to(`project_${projectId}`).emit('issue:deleted', { issueId, projectId });
      this.server.to(`issue_${issueId}`).emit('issue:deleted', { issueId, projectId });
    }
  }

  broadcastWorklogAdded(payload: { issueId: number; projectId?: number; worklog: unknown }): void {
    if (this.server) {
      this.server.to(`issue_${payload.issueId}`).emit('worklog:created', payload);
      if (payload.projectId) {
        this.server.to(`project_${payload.projectId}`).emit('worklog:created', payload);
      }
    }
  }

  broadcastCommentAdded(payload: { issueId: number; comment: unknown }): void {
    if (this.server) {
      this.server.to(`issue_${payload.issueId}`).emit('comment:created', payload);
    }
  }

  broadcastAttachmentUploaded(payload: { issueId: number; attachment: unknown }): void {
    if (this.server) {
      this.server.to(`issue_${payload.issueId}`).emit('attachment:uploaded', payload);
    }
  }
}
