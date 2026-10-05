import { io, Socket } from 'socket.io-client';
import type { IssueItem, IssueComment, AttachmentItem } from './types/issues.types.js';
import type { WorklogItem } from './types/worklogs.types.js';
import type { UserProfile } from './types/auth.types.js';

export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000/events';

class RealtimeSocketService {
  private socket: Socket | null = null;
  private connected = false;

  isConnected(): boolean { return this.connected; }

  connect() {
    if (this.socket && this.socket.connected) return this.socket;
    if (this.socket) {
      this.socket.disconnect();
    }

    const token = localStorage.getItem('accessToken');

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      auth: {
        token: token ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`) : undefined,
      },
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      this.connected = true;
      console.log('[Socket] Connected to real-time events gateway:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      this.connected = false;
      console.log('[Socket] Disconnected from real-time events gateway:', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
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

  joinIssue(issueId: number | string, user?: Partial<UserProfile> | null) {
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

  onWorklogCreated(callback: (data: { issueId: number; projectId?: number; worklog: WorklogItem }) => void) {
    const s = this.getSocket();
    s.on('worklog:created', callback);
    return () => { s.off('worklog:created', callback); };
  }

  onCommentCreated(callback: (data: { issueId: number; comment: IssueComment }) => void) {
    const s = this.getSocket();
    s.on('comment:created', callback);
    return () => { s.off('comment:created', callback); };
  }

  onAttachmentUploaded(callback: (data: { issueId: number; attachment: AttachmentItem }) => void) {
    const s = this.getSocket();
    s.on('attachment:uploaded', callback);
    return () => { s.off('attachment:uploaded', callback); };
  }

  onPresenceViewing(callback: (data: { user: Partial<UserProfile>; issueId: number | string }) => void) {
    const s = this.getSocket();
    s.on('presence:viewing', callback);
    return () => { s.off('presence:viewing', callback); };
  }

  onNotificationNew(callback: (notification: any) => void) {
    const s = this.getSocket();
    s.on('notification:new', callback);
    s.on('notification:received', callback);
    return () => {
      s.off('notification:new', callback);
      s.off('notification:received', callback);
    };
  }
}

export const realtimeSocket = new RealtimeSocketService();
