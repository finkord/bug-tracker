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

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to events namespace: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from events namespace: ${client.id}`);
  }

  @SubscribeMessage('join:project')
  handleJoinProject(
    @MessageBody() data: { projectId: number | string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `project_${data.projectId}`;
    client.join(room);
    this.logger.log(`Socket ${client.id} joined room ${room}`);
    return { event: 'joined:project', room };
  }

  @SubscribeMessage('leave:project')
  handleLeaveProject(
    @MessageBody() data: { projectId: number | string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `project_${data.projectId}`;
    client.leave(room);
    this.logger.log(`Socket ${client.id} left room ${room}`);
    return { event: 'left:project', room };
  }

  @SubscribeMessage('join:issue')
  handleJoinIssue(
    @MessageBody() data: { issueId: number | string; user?: any },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `issue_${data.issueId}`;
    client.join(room);
    if (data.user) {
      client.to(room).emit('presence:viewing', {
        user: data.user,
        issueId: data.issueId,
      });
    }
    return { event: 'joined:issue', room };
  }

  @SubscribeMessage('leave:issue')
  handleLeaveIssue(
    @MessageBody() data: { issueId: number | string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `issue_${data.issueId}`;
    client.leave(room);
    return { event: 'left:issue', room };
  }

  // Broadcaster methods for real-time live collaboration
  broadcastIssueCreated(issue: any) {
    if (this.server) {
      this.server.to(`project_${issue.projectId}`).emit('issue:created', issue);
      this.server.emit('issue:created', issue);
    }
  }

  broadcastIssueUpdated(issue: any) {
    if (this.server) {
      this.server.to(`project_${issue.projectId}`).emit('issue:updated', issue);
      this.server.to(`issue_${issue.id}`).emit('issue:updated', issue);
      this.server.emit('issue:updated', issue);
    }
  }

  broadcastIssueDeleted(issueId: number, projectId: number) {
    if (this.server) {
      this.server.to(`project_${projectId}`).emit('issue:deleted', { issueId, projectId });
      this.server.to(`issue_${issueId}`).emit('issue:deleted', { issueId, projectId });
      this.server.emit('issue:deleted', { issueId, projectId });
    }
  }

  broadcastWorklogAdded(payload: { issueId: number; projectId?: number; worklog: any }) {
    if (this.server) {
      this.server.to(`issue_${payload.issueId}`).emit('worklog:created', payload);
      if (payload.projectId) {
        this.server.to(`project_${payload.projectId}`).emit('worklog:created', payload);
      }
      this.server.emit('worklog:created', payload);
    }
  }

  broadcastCommentAdded(payload: { issueId: number; comment: any }) {
    if (this.server) {
      this.server.to(`issue_${payload.issueId}`).emit('comment:created', payload);
    }
  }

  broadcastAttachmentUploaded(payload: { issueId: number; attachment: any }) {
    if (this.server) {
      this.server.to(`issue_${payload.issueId}`).emit('attachment:uploaded', payload);
    }
  }
}
