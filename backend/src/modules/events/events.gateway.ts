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
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/events',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected to events namespace: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected from events namespace: ${client.id}`);
  }

  @SubscribeMessage('join:project')
  async handleJoinProject(
    @MessageBody() data: { projectId: number | string },
    @ConnectedSocket() client: Socket,
  ): Promise<{ event: string; room: string }> {
    const room = `project_${data.projectId}`;
    await client.join(room);
    this.logger.log(`Socket ${client.id} joined room ${room}`);
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
    @MessageBody() data: { issueId: number | string; user?: any },
    @ConnectedSocket() client: Socket,
  ): Promise<{ event: string; room: string }> {
    const room = `issue_${data.issueId}`;
    await client.join(room);
    if (data.user) {
      client.to(room).emit('presence:viewing', {
        user: data.user,
        issueId: data.issueId,
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

  // Broadcaster methods for real-time live collaboration
  broadcastIssueCreated(issue: any): void {
    if (this.server) {
      this.server.to(`project_${issue.projectId}`).emit('issue:created', issue);
      this.server.emit('issue:created', issue);
    }
  }

  broadcastIssueUpdated(issue: any): void {
    if (this.server) {
      this.server.to(`project_${issue.projectId}`).emit('issue:updated', issue);
      this.server.to(`issue_${issue.id}`).emit('issue:updated', issue);
      this.server.emit('issue:updated', issue);
    }
  }

  broadcastIssueDeleted(issueId: number, projectId: number): void {
    if (this.server) {
      this.server.to(`project_${projectId}`).emit('issue:deleted', { issueId, projectId });
      this.server.to(`issue_${issueId}`).emit('issue:deleted', { issueId, projectId });
      this.server.emit('issue:deleted', { issueId, projectId });
    }
  }

  broadcastWorklogAdded(payload: { issueId: number; projectId?: number; worklog: any }): void {
    if (this.server) {
      this.server.to(`issue_${payload.issueId}`).emit('worklog:created', payload);
      if (payload.projectId) {
        this.server.to(`project_${payload.projectId}`).emit('worklog:created', payload);
      }
      this.server.emit('worklog:created', payload);
    }
  }

  broadcastCommentAdded(payload: { issueId: number; comment: any }): void {
    if (this.server) {
      this.server.to(`issue_${payload.issueId}`).emit('comment:created', payload);
    }
  }

  broadcastAttachmentUploaded(payload: { issueId: number; attachment: any }): void {
    if (this.server) {
      this.server.to(`issue_${payload.issueId}`).emit('attachment:uploaded', payload);
    }
  }
}
