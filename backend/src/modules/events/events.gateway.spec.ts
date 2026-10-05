import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventsGateway, BroadcastIssuePayload } from './events.gateway.js';
import { ProjectPermission } from '../rbac/entities/permission-grant.entity.js';
import { SystemRole } from '../users/entities/user.entity.js';

describe('EventsGateway', () => {
  let gateway: EventsGateway;
  let mockServer: any;
  let mockJwtService: any;
  let mockConfigService: any;
  let mockUsersService: any;
  let mockRedisService: any;
  let mockPermissionEvaluator: any;
  let mockIssueRepository: any;

  const mockUser = {
    id: 42,
    email: 'engineer@bugtracker.internal',
    systemRole: SystemRole.USER,
    isBlocked: false,
    isActivated: true,
    tokenVersion: 1,
  };

  let mockRoomOperator: any;

  beforeEach(() => {
    mockRoomOperator = {
      emit: vi.fn(),
      fetchSockets: vi.fn().mockResolvedValue([]),
    };

    mockServer = {
      to: vi.fn().mockReturnValue(mockRoomOperator),
      in: vi.fn().mockReturnValue(mockRoomOperator),
      emit: vi.fn(),
      fetchSockets: vi.fn().mockResolvedValue([]),
    };

    mockJwtService = {
      verifyAsync: vi.fn(),
    };

    mockConfigService = {
      get: vi.fn().mockReturnValue('test_jwt_secret_key_1234567890123456'),
    };

    mockUsersService = {
      findById: vi.fn(),
    };

    mockRedisService = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue('OK'),
    };

    mockPermissionEvaluator = {
      hasPermission: vi.fn().mockResolvedValue(true),
      getEffectivePermissions: vi.fn().mockResolvedValue({
        [ProjectPermission.BROWSE_PROJECTS]: true,
      }),
    };

    mockIssueRepository = {
      findOne: vi.fn(),
    };

    gateway = new EventsGateway(
      mockJwtService,
      mockConfigService,
      mockUsersService,
      mockRedisService,
      mockPermissionEvaluator,
      mockIssueRepository,
    );
    gateway.server = mockServer;
  });

  describe('Connection Authentication', () => {
    it('should disconnect client if no authentication token is provided', async () => {
      const client: any = {
        id: 'sock-1',
        handshake: { auth: {}, headers: {} },
        disconnect: vi.fn(),
        data: {},
      };

      await gateway.handleConnection(client);

      expect(client.disconnect).toHaveBeenCalledWith(true);
      expect(client.data.user).toBeUndefined();
    });

    it('should disconnect client if JWT verification fails', async () => {
      const client: any = {
        id: 'sock-2',
        handshake: { auth: { token: 'invalid.token.here' }, headers: {} },
        disconnect: vi.fn(),
        data: {},
      };
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await gateway.handleConnection(client);

      expect(client.disconnect).toHaveBeenCalledWith(true);
      expect(client.data.user).toBeUndefined();
    });

    it('should disconnect client if token is a pending 2FA challenge', async () => {
      const client: any = {
        id: 'sock-3',
        handshake: { auth: { token: 'valid.token' }, headers: {} },
        disconnect: vi.fn(),
        data: {},
      };
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: 42,
        email: 'engineer@bugtracker.internal',
        is2faPending: true,
      });

      await gateway.handleConnection(client);

      expect(client.disconnect).toHaveBeenCalledWith(true);
      expect(client.data.user).toBeUndefined();
    });

    it('should disconnect client if user account is blocked or inactive', async () => {
      const client: any = {
        id: 'sock-4',
        handshake: { auth: { token: 'Bearer valid.token' }, headers: {} },
        disconnect: vi.fn(),
        data: {},
      };
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: 42,
        email: 'engineer@bugtracker.internal',
        tokenVersion: 1,
      });
      mockUsersService.findById.mockResolvedValue({
        ...mockUser,
        isBlocked: true,
      });

      await gateway.handleConnection(client);

      expect(client.disconnect).toHaveBeenCalledWith(true);
      expect(client.data.user).toBeUndefined();
    });

    it('should authenticate client and attach user when valid Bearer token provided in auth payload', async () => {
      const client: any = {
        id: 'sock-5',
        handshake: { auth: { token: 'Bearer valid.jwt.token' }, headers: {} },
        disconnect: vi.fn(),
        join: vi.fn(),
        data: {},
      };
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: 42,
        email: 'engineer@bugtracker.internal',
        tokenVersion: 1,
      });
      mockRedisService.get.mockResolvedValue(JSON.stringify(mockUser));

      await gateway.handleConnection(client);

      expect(client.disconnect).not.toHaveBeenCalled();
      expect(client.data.user).toEqual(mockUser);
      expect(client.join).toHaveBeenCalledWith('user_42');
    });

    it('should authenticate client when valid token provided via cookie header', async () => {
      const client: any = {
        id: 'sock-6',
        handshake: {
          auth: {},
          headers: { cookie: 'other=123; accessToken=cookie.jwt.token; other2=456' },
        },
        disconnect: vi.fn(),
        join: vi.fn(),
        data: {},
      };
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: 42,
        email: 'engineer@bugtracker.internal',
        tokenVersion: 1,
      });
      mockUsersService.findById.mockResolvedValue(mockUser);

      await gateway.handleConnection(client);

      expect(client.disconnect).not.toHaveBeenCalled();
      expect(client.data.user).toEqual(mockUser);
      expect(client.join).toHaveBeenCalledWith('user_42');
      expect(mockRedisService.set).toHaveBeenCalled();
    });
  });

  describe('Room Authorization', () => {
    it('should reject join:project if client is unauthenticated', async () => {
      const client: any = { id: 'sock-7', data: {}, disconnect: vi.fn(), join: vi.fn() };

      const res = await gateway.handleJoinProject({ projectId: 10 }, client);

      expect(res.event).toBe('error');
      expect(client.join).not.toHaveBeenCalled();
    });

    it('should deny join:project if user lacks BROWSE_PROJECTS permission', async () => {
      const client: any = { id: 'sock-8', data: { user: mockUser }, join: vi.fn() };
      mockPermissionEvaluator.getEffectivePermissions.mockResolvedValue({
        [ProjectPermission.BROWSE_PROJECTS]: false,
      });

      const res = await gateway.handleJoinProject({ projectId: 10 }, client);

      expect(mockPermissionEvaluator.getEffectivePermissions).toHaveBeenCalledWith(42, 10);
      expect(res.event).toBe('error');
      expect(client.join).not.toHaveBeenCalled();
    });

    it('should allow join:project if user has BROWSE_PROJECTS permission', async () => {
      const client: any = { id: 'sock-9', data: { user: mockUser }, join: vi.fn() };
      mockPermissionEvaluator.getEffectivePermissions.mockResolvedValue({
        [ProjectPermission.BROWSE_PROJECTS]: true,
      });

      const res = await gateway.handleJoinProject({ projectId: 10 }, client);

      expect(res.event).toBe('joined:project');
      expect(res.room).toBe('project_10');
      expect(client.join).toHaveBeenCalledWith('project_10');
    });

    it('should reject join:issue if issue does not exist', async () => {
      const client: any = { id: 'sock-10', data: { user: mockUser }, join: vi.fn() };
      mockIssueRepository.findOne.mockResolvedValue(null);

      const res = await gateway.handleJoinIssue({ issueId: 999 }, client);

      expect(res.event).toBe('error');
      expect(client.join).not.toHaveBeenCalled();
    });

    it('should allow join:issue if user has permission', async () => {
      const client: any = {
        id: 'sock-11',
        data: { user: mockUser },
        join: vi.fn(),
        to: vi.fn().mockReturnValue({ emit: vi.fn() }),
      };
      mockIssueRepository.findOne.mockResolvedValue({ id: 101, projectId: 5 });
      mockPermissionEvaluator.getEffectivePermissions.mockResolvedValue({
        [ProjectPermission.BROWSE_PROJECTS]: true,
      });

      const res = await gateway.handleJoinIssue({ issueId: 101 }, client);

      expect(res.event).toBe('joined:issue');
      expect(res.room).toBe('issue_101');
      expect(client.join).toHaveBeenCalledWith('issue_101');
    });
  });

  describe('Broadcast Room Isolation (No Global Leaks)', () => {
    it('should broadcast issue:created strictly to project room and NEVER globally', async () => {
      const testIssue: BroadcastIssuePayload = { id: 101, projectId: 1, title: 'Test Issue' };
      await gateway.broadcastIssueCreated(testIssue);

      expect(mockServer.to).toHaveBeenCalledWith('project_1');
      expect(mockRoomOperator.emit).toHaveBeenCalledWith('issue:created', testIssue);
      expect(mockServer.emit).not.toHaveBeenCalled();
    });

    it('should broadcast issue:updated strictly to project and issue rooms and NEVER globally', async () => {
      const testIssue: BroadcastIssuePayload = { id: 102, projectId: 2, title: 'Updated Issue' };
      await gateway.broadcastIssueUpdated(testIssue);

      expect(mockServer.to).toHaveBeenCalledWith('project_2');
      expect(mockServer.to).toHaveBeenCalledWith('issue_102');
      expect(mockRoomOperator.emit).toHaveBeenCalledWith('issue:updated', testIssue);
      expect(mockServer.emit).not.toHaveBeenCalled();
    });

    it('should broadcast issue:deleted strictly to project and issue rooms and NEVER globally', () => {
      gateway.broadcastIssueDeleted(103, 3);

      expect(mockServer.to).toHaveBeenCalledWith('project_3');
      expect(mockServer.to).toHaveBeenCalledWith('issue_103');
      expect(mockRoomOperator.emit).toHaveBeenCalledWith('issue:deleted', { issueId: 103, projectId: 3 });
      expect(mockServer.emit).not.toHaveBeenCalled();
    });

    it('should broadcast worklog:created strictly to issue and project rooms and NEVER globally', () => {
      const payload = { issueId: 104, projectId: 4, worklog: { id: 1, timeSpentHours: 2 } };
      gateway.broadcastWorklogAdded(payload);

      expect(mockServer.to).toHaveBeenCalledWith('issue_104');
      expect(mockServer.to).toHaveBeenCalledWith('project_4');
      expect(mockRoomOperator.emit).toHaveBeenCalledWith('worklog:created', payload);
      expect(mockServer.emit).not.toHaveBeenCalled();
    });

    it('should filter recipients when issue has securityLevelId set', async () => {
      const confidentialIssue: BroadcastIssuePayload = {
        id: 200,
        projectId: 7,
        title: 'Secret Security Vulnerability',
        securityLevelId: 99,
      };

      const socketAllowed: any = {
        id: 'sock-allowed',
        data: { user: { id: 1, email: 'lead@company.com' } },
        emit: vi.fn(),
      };
      const socketForbidden: any = {
        id: 'sock-forbidden',
        data: { user: { id: 2, email: 'intern@company.com' } },
        emit: vi.fn(),
      };

      mockRoomOperator.fetchSockets.mockResolvedValue([socketAllowed, socketForbidden]);
      mockPermissionEvaluator.getEffectivePermissions.mockImplementation(
        async (userId: number) => ({
          [ProjectPermission.BROWSE_PROJECTS]: userId === 1,
        }),
      );

      await gateway.broadcastIssueCreated(confidentialIssue);

      expect(mockServer.in).toHaveBeenCalledWith('project_7');
      expect(socketAllowed.emit).toHaveBeenCalledWith('issue:created', confidentialIssue);
      expect(socketForbidden.emit).not.toHaveBeenCalled();
      expect(mockServer.emit).not.toHaveBeenCalled();
    });
  });
});
