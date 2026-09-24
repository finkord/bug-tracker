import { io, Socket } from 'socket.io-client';
import type { IssueItem } from './client';

class RealtimeSocketService {
  private socket: Socket | null = null;
  private connected = false;

  isConnected(): boolean { return this.connected; }

  connect() {
    if (this.socket) return this.socket;

    this.socket = io('http://localhost:3000/events', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      this.connected = true;
      console.log('[Socket] Connected to real-time events gateway:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      console.log('[Socket] Disconnected from real-time events gateway');
    });

    return this.socket;
  }

  getSocket() {
    if (!this.socket) {
      return this.connect();
    }
    return this.socket;
  }

  joinProject(projectId: number | string) {
    this.getSocket().emit('join:project', { projectId });
  }

  leaveProject(projectId: number | string) {
    this.getSocket().emit('leave:project', { projectId });
  }

  joinIssue(issueId: number | string, user?: any) {
    this.getSocket().emit('join:issue', { issueId, user });
  }

  leaveIssue(issueId: number | string) {
    this.getSocket().emit('leave:issue', { issueId });
  }

  onIssueCreated(callback: (issue: IssueItem) => void) {
    const s = this.getSocket();
    s.on('issue:created', callback);
    return () => { s.off('issue:created', callback); };
  }

  onIssueUpdated(callback: (issue: IssueItem) => void) {
    const s = this.getSocket();
    s.on('issue:updated', callback);
    return () => { s.off('issue:updated', callback); };
  }

  onIssueDeleted(callback: (data: { issueId: number; projectId: number }) => void) {
    const s = this.getSocket();
    s.on('issue:deleted', callback);
    return () => { s.off('issue:deleted', callback); };
  }

  onWorklogCreated(callback: (data: { issueId: number; projectId?: number; worklog: any }) => void) {
    const s = this.getSocket();
    s.on('worklog:created', callback);
    return () => { s.off('worklog:created', callback); };
  }

  onCommentCreated(callback: (data: { issueId: number; comment: any }) => void) {
    const s = this.getSocket();
    s.on('comment:created', callback);
    return () => { s.off('comment:created', callback); };
  }

  onAttachmentUploaded(callback: (data: { issueId: number; attachment: any }) => void) {
    const s = this.getSocket();
    s.on('attachment:uploaded', callback);
    return () => { s.off('attachment:uploaded', callback); };
  }

  onPresenceViewing(callback: (data: { user: any; issueId: number | string }) => void) {
    const s = this.getSocket();
    s.on('presence:viewing', callback);
    return () => { s.off('presence:viewing', callback); };
  }
}

export const realtimeSocket = new RealtimeSocketService();
