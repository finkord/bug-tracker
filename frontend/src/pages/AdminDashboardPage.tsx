import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, type LoginAuditLogItem, type UserProfile } from '../api/client';
import {
  ShieldAlert,
  Users,
  Search,
  RefreshCw,
  Ban,
  CheckCircle,
  Clock,
  Lock,
  Unlock,
  ShieldCheck,
  Activity,
  Server,
  Database,
  Mail,
  HardDrive,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

export const AdminDashboardPage: React.FC<{ defaultTab?: 'users' | 'logs' | 'health' }> = ({
  defaultTab = 'users',
}) => {
  const { user: currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = (searchParams.get('tab') as 'users' | 'logs' | 'health') || defaultTab;

  const setTab = (tab: 'users' | 'logs' | 'health') => {
    setSearchParams({ tab });
  };

  // Metrics State
  const [stats, setStats] = useState<{
    totalUsers: number;
    activeUsers: number;
    blockedUsers: number;
    twoFactorAdoptionCount: number;
    twoFactorPercentage: number;
  } | null>(null);

  // Users Directory State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Feedback notifications
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audit Logs State
  const [logs, setLogs] = useState<LoginAuditLogItem[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logStatusFilter, setLogStatusFilter] = useState('ALL');
  const [logSearchTerm, setLogSearchTerm] = useState('');

  // Fetch KPI statistics
  const fetchStats = useCallback(async () => {
    try {
      const data = await api.getUserStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load system stats:', err);
    }
  }, []);

  // Fetch users with filters
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const isBlocked =
        userStatusFilter === 'BLOCKED' ? true : userStatusFilter === 'ACTIVE' ? false : undefined;
      const isActivated = userStatusFilter === 'PENDING' ? false : undefined;

      const data = await api.getUsers({
        page: usersPage,
        limit: 15,
        search: userSearch.trim() || undefined,
        role: userRoleFilter || undefined,
        isBlocked,
        isActivated,
      });

      setUsers(data.items);
      setUsersTotal(data.total);
      setUsersTotalPages(data.totalPages);
    } catch (err: any) {
      console.error('Failed to load users:', err);
      setErrorMessage(err.message || 'Failed to load user directory');
    } finally {
      setUsersLoading(false);
    }
  }, [usersPage, userSearch, userRoleFilter, userStatusFilter]);

  // Fetch audit logs
  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const data = await api.getLoginAuditLogs(1, 100);
      setLogs(data.items);
      setLogsTotal(data.total);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  // Initial and reactive data loading
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (currentTab === 'users') {
      fetchUsers();
    } else if (currentTab === 'logs') {
      fetchLogs();
    }
  }, [currentTab, fetchUsers, fetchLogs]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setErrorMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  // User Actions
  const handleRoleChange = async (targetUser: UserProfile, newRole: 'ADMIN' | 'USER') => {
    if (targetUser.systemRole === newRole) return;
    if (targetUser.id === currentUser?.id && newRole !== 'ADMIN') {
      setErrorMessage('Cannot demote your own administrator account');
      return;
    }

    setActionLoadingId(targetUser.id);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await api.updateUserRole(targetUser.id, newRole);
      setSuccessMessage(res.message);
      await fetchUsers();
      await fetchStats();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update user role');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleBlock = async (targetUser: UserProfile) => {
    if (targetUser.id === currentUser?.id) {
      setErrorMessage('Cannot block your own administrator account');
      return;
    }

    setActionLoadingId(targetUser.id);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      if (targetUser.isBlocked) {
        const res = await api.unblockUser(targetUser.id);
        setSuccessMessage(res.message);
      } else {
        const res = await api.blockUser(targetUser.id);
        setSuccessMessage(res.message);
      }
      await fetchUsers();
      await fetchStats();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update user block status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleActivateUser = async (userId: number) => {
    setActionLoadingId(userId);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await api.adminActivateUser(userId);
      setSuccessMessage(res.message);
      await fetchUsers();
      await fetchStats();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to manually activate user');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReset2Fa = async (userId: number) => {
    if (!window.confirm(`Reset Two-Factor Authentication for user #${userId}? They will need to reconfigure their authenticator app.`)) {
      return;
    }

    setActionLoadingId(userId);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await api.adminResetUser2Fa(userId);
      setSuccessMessage(res.message);
      await fetchUsers();
      await fetchStats();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reset 2FA configuration');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status: LoginAuditLogItem['status']) => {
    switch (status) {
      case 'SUCCESS':
      case 'TWO_FACTOR_SUCCESS':
        return 'bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)]';
      case 'ACCOUNT_LOCKED':
        return 'bg-[var(--md-sys-color-warning-container)] text-[var(--md-sys-color-on-warning-container)] animate-pulse';
      case 'ACCOUNT_BLOCKED':
        return 'bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]';
      case 'FAILED_PASSWORD':
      case 'TWO_FACTOR_FAILED':
        return 'bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]';
      case 'REQUIRE_2FA':
        return 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]';
      default:
        return 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]';
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesFilter = logStatusFilter === 'ALL' || log.status === logStatusFilter;
    const matchesSearch =
      logSearchTerm === '' ||
      log.attemptedEmail.toLowerCase().includes(logSearchTerm.toLowerCase()) ||
      log.ipAddress.includes(logSearchTerm) ||
      (log.failureReason && log.failureReason.toLowerCase().includes(logSearchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-[18px] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center shadow-sm">
            <ShieldAlert className="w-6 h-6 text-[var(--md-sys-color-primary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)] tracking-tight">
              Admin & Security Center
            </h1>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
              PPofSE Tier 1 RBAC controls, security forensics, and infrastructure health
            </p>
          </div>
        </div>

        {/* Tab Selection Controls */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]">
          <button
            onClick={() => setTab('users')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              currentTab === 'users'
                ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-sm'
                : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Users & RBAC ({usersTotal || stats?.totalUsers || 0})</span>
          </button>
          <button
            onClick={() => setTab('logs')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              currentTab === 'logs'
                ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-sm'
                : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Audit Trail ({logsTotal})</span>
          </button>
          <button
            onClick={() => setTab('health')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              currentTab === 'health'
                ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-sm'
                : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>System Health</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Accounts */}
        <div className="p-4 rounded-[20px] m3-card flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-[14px] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">Total Users</div>
            <div className="text-xl font-bold text-[var(--md-sys-color-on-surface)] font-mono">
              {stats?.totalUsers ?? '...'}
            </div>
          </div>
        </div>

        {/* Active Accounts */}
        <div className="p-4 rounded-[20px] m3-card flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-[14px] bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-success)] flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">Active Users</div>
            <div className="text-xl font-bold text-[var(--md-sys-color-on-surface)] font-mono">
              {stats?.activeUsers ?? '...'}
            </div>
          </div>
        </div>

        {/* Blocked Accounts */}
        <div className="p-4 rounded-[20px] m3-card flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-[14px] bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-error)] flex items-center justify-center shrink-0">
            <Ban className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">Blocked</div>
            <div className="text-xl font-bold text-[var(--md-sys-color-on-surface)] font-mono">
              {stats?.blockedUsers ?? '...'}
            </div>
          </div>
        </div>

        {/* 2FA Adoption */}
        <div className="p-4 rounded-[20px] m3-card flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-[14px] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">2FA Adoption</div>
            <div className="text-xl font-bold text-[var(--md-sys-color-on-surface)] font-mono">
              {stats ? `${stats.twoFactorPercentage}%` : '...'}
            </div>
          </div>
        </div>

        {/* Audit Events */}
        <div className="p-4 rounded-[20px] m3-card flex items-center gap-3.5 shadow-sm col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-[14px] bg-[var(--md-sys-color-warning-container)] text-[var(--md-sys-color-warning)] flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">Audit Events</div>
            <div className="text-xl font-bold text-[var(--md-sys-color-on-surface)] font-mono">
              {logsTotal || logs.length || '...'}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Alerts */}
      {successMessage && (
        <div className="p-3.5 rounded-[16px] bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)] text-xs font-semibold flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-[var(--md-sys-color-success)] shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-[16px] bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] text-xs font-semibold flex items-center gap-2 shadow-sm animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-[var(--md-sys-color-error)] shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ================= TAB 1: USERS & RBAC ================= */}
      {currentTab === 'users' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* User Filtering Bar */}
          <div className="p-4 rounded-[24px] m3-card flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-[var(--md-sys-color-outline)]" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setUsersPage(1);
                  }}
                  placeholder="Search user by name, email, or provider..."
                  className="w-full pl-10 pr-4 py-2.5 text-xs m3-input"
                />
              </div>

              {/* Role Filter */}
              <select
                value={userRoleFilter}
                onChange={(e) => {
                  setUserRoleFilter(e.target.value);
                  setUsersPage(1);
                }}
                className="px-3.5 py-2.5 text-xs m3-input"
              >
                <option value="">All Roles</option>
                <option value="ADMIN">ADMIN</option>
                <option value="USER">USER</option>
              </select>

              {/* Status Filter */}
              <select
                value={userStatusFilter}
                onChange={(e) => {
                  setUserStatusFilter(e.target.value);
                  setUsersPage(1);
                }}
                className="px-3.5 py-2.5 text-xs m3-input"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="BLOCKED">Blocked</option>
                <option value="PENDING">Pending Activation</option>
              </select>
            </div>

            <button
              onClick={() => {
                fetchUsers();
                fetchStats();
              }}
              disabled={usersLoading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full m3-btn-tonal text-xs font-semibold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${usersLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Users</span>
            </button>
          </div>

          {/* User Directory Table */}
          <div className="rounded-[24px] m3-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] font-semibold border-b border-[var(--md-sys-color-outline-variant)]">
                  <tr>
                    <th className="px-5 py-3.5">ID</th>
                    <th className="px-5 py-3.5">User Identity</th>
                    <th className="px-5 py-3.5">System Role (RBAC)</th>
                    <th className="px-5 py-3.5">Email Status</th>
                    <th className="px-5 py-3.5">2FA Security</th>
                    <th className="px-5 py-3.5">Account State</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)]">
                  {usersLoading ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-[var(--md-sys-color-outline)]">
                        Loading registered user directory...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-[var(--md-sys-color-outline)]">
                        No users match the search criteria.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      const isSelf = u.id === currentUser?.id;
                      const isLoading = actionLoadingId === u.id;

                      return (
                        <tr
                          key={u.id}
                          className="hover:bg-[var(--md-sys-color-surface-container-high)]/50 transition-colors"
                        >
                          <td className="px-5 py-3.5 font-mono font-bold text-[var(--md-sys-color-outline)]">
                            #{u.id}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)] font-bold flex items-center justify-center shrink-0">
                                {u.fullName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
                                  <span>{u.fullName}</span>
                                  {isSelf && (
                                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] font-bold">
                                      YOU
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5">
                                  <span>{u.email}</span>
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--md-sys-color-surface-container-highest)] font-mono">
                                    {u.oauthProvider || 'LOCAL'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Role Selector / Toggle */}
                          <td className="px-5 py-3.5">
                            <select
                              value={u.systemRole}
                              disabled={isLoading || isSelf}
                              onChange={(e) => handleRoleChange(u, e.target.value as 'ADMIN' | 'USER')}
                              className={`px-3 py-1 text-xs font-bold rounded-full uppercase transition-all cursor-pointer border ${
                                u.systemRole === 'ADMIN'
                                  ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] border-transparent'
                                  : 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] border-[var(--md-sys-color-outline-variant)]'
                              } disabled:opacity-60 disabled:cursor-not-allowed`}
                            >
                              <option value="USER">USER</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                          </td>

                          {/* Email Activation */}
                          <td className="px-5 py-3.5">
                            {u.isActivated ? (
                              <span className="text-[var(--md-sys-color-success)] flex items-center gap-1.5 font-medium">
                                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>Activated</span>
                              </span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-[var(--md-sys-color-warning)] flex items-center gap-1 font-medium">
                                  <Clock className="w-3.5 h-3.5 shrink-0" />
                                  <span>Pending</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleActivateUser(u.id)}
                                  disabled={isLoading}
                                  className="px-2 py-0.5 text-[10px] rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)] font-bold hover:underline"
                                  title="Manually mark user as activated"
                                >
                                  Activate
                                </button>
                              </div>
                            )}
                          </td>

                          {/* 2FA Status & Reset */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                                  u.twoFactorEnabled
                                    ? 'bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)]'
                                    : 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-outline)]'
                                }`}
                              >
                                {u.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                              </span>

                              {u.twoFactorEnabled && (
                                <button
                                  type="button"
                                  onClick={() => handleReset2Fa(u.id)}
                                  disabled={isLoading}
                                  className="p-1 rounded-full text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)]/30 transition-colors"
                                  title="Reset 2FA for this user"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Account State */}
                          <td className="px-5 py-3.5">
                            {u.isBlocked ? (
                              <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] flex items-center gap-1 w-max">
                                <Ban className="w-3 h-3" />
                                <span>Blocked</span>
                              </span>
                            ) : (
                              <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)] flex items-center gap-1 w-max">
                                <CheckCircle className="w-3 h-3" />
                                <span>Active</span>
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => handleToggleBlock(u)}
                              disabled={isLoading || isSelf}
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all inline-flex items-center gap-1.5 disabled:opacity-40 ${
                                u.isBlocked
                                  ? 'bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)] hover:bg-[var(--md-sys-color-success-container)]/80'
                                  : 'bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] hover:bg-[var(--md-sys-color-error-container)]/80'
                              }`}
                            >
                              {u.isBlocked ? (
                                <>
                                  <Unlock className="w-3 h-3" />
                                  <span>Unblock</span>
                                </>
                              ) : (
                                <>
                                  <Lock className="w-3 h-3" />
                                  <span>Block User</span>
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 bg-[var(--md-sys-color-surface-container-high)] border-t border-[var(--md-sys-color-outline-variant)] flex items-center justify-between text-xs">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">
                Showing {users.length} of {usersTotal} registered users (Page {usersPage} of {usersTotalPages})
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                  disabled={usersPage <= 1 || usersLoading}
                  className="px-3 py-1 rounded-full m3-btn-outline disabled:opacity-40 flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUsersPage((p) => Math.min(usersTotalPages, p + 1))}
                  disabled={usersPage >= usersTotalPages || usersLoading}
                  className="px-3 py-1 rounded-full m3-btn-outline disabled:opacity-40 flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: AUDIT LOGS ================= */}
      {currentTab === 'logs' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Filter Bar */}
          <div className="p-4 rounded-[24px] m3-card flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5 flex-1 min-w-[260px]">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-[var(--md-sys-color-outline)]" />
                <input
                  type="text"
                  value={logSearchTerm}
                  onChange={(e) => setLogSearchTerm(e.target.value)}
                  placeholder="Search by email, IP address, or failure reason..."
                  className="w-full pl-10 pr-4 py-2.5 text-xs m3-input"
                />
              </div>

              <select
                value={logStatusFilter}
                onChange={(e) => setLogStatusFilter(e.target.value)}
                className="px-3.5 py-2.5 text-xs m3-input"
              >
                <option value="ALL">All Outcomes</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="FAILED_PASSWORD">FAILED_PASSWORD</option>
                <option value="ACCOUNT_LOCKED">ACCOUNT_LOCKED</option>
                <option value="REQUIRE_2FA">REQUIRE_2FA</option>
                <option value="TWO_FACTOR_SUCCESS">TWO_FACTOR_SUCCESS</option>
                <option value="TWO_FACTOR_FAILED">TWO_FACTOR_FAILED</option>
              </select>
            </div>

            <button
              onClick={fetchLogs}
              disabled={logsLoading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full m3-btn-tonal text-xs font-semibold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Log</span>
            </button>
          </div>

          {/* Table Container */}
          <div className="rounded-[24px] m3-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] font-semibold border-b border-[var(--md-sys-color-outline-variant)]">
                  <tr>
                    <th className="px-5 py-3.5">ID</th>
                    <th className="px-5 py-3.5">Timestamp</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Attempted Email</th>
                    <th className="px-5 py-3.5">Client IP</th>
                    <th className="px-5 py-3.5">User-Agent</th>
                    <th className="px-5 py-3.5">Forensic Context</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)]">
                  {logsLoading ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-[var(--md-sys-color-outline)]">
                        Loading security audit trail...
                      </td>
                    </tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-[var(--md-sys-color-outline)]">
                        No audit log records match the current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-[var(--md-sys-color-surface-container-high)]/50 transition-colors"
                      >
                        <td className="px-5 py-3.5 font-mono text-[var(--md-sys-color-outline)] font-bold">
                          #{log.id}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-[var(--md-sys-color-on-surface-variant)]">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${getStatusBadge(
                              log.status,
                            )}`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-medium text-[var(--md-sys-color-on-surface)]">
                          {log.attemptedEmail}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-[var(--md-sys-color-on-surface-variant)]">
                          {log.ipAddress}
                        </td>
                        <td
                          className="px-5 py-3.5 max-w-[180px] truncate text-[var(--md-sys-color-on-surface-variant)]"
                          title={log.userAgent}
                        >
                          {log.userAgent || 'Unknown'}
                        </td>
                        <td className="px-5 py-3.5 text-[var(--md-sys-color-on-surface-variant)]">
                          {log.failureReason ? (
                            <span className="text-[var(--md-sys-color-warning)] font-medium">
                              {log.failureReason}
                            </span>
                          ) : (
                            <span className="text-[var(--md-sys-color-success)] font-medium">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: SYSTEM HEALTH ================= */}
      {currentTab === 'health' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* REST API Card */}
            <div className="p-6 rounded-[24px] m3-card space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[14px] bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-success)] flex items-center justify-center">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">REST API Gateway</h3>
                    <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">NestJS v11 & Fastify/Express</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)]">
                  Online
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                <div className="flex justify-between">
                  <span>Endpoint:</span>
                  <span className="font-mono text-[var(--md-sys-color-on-surface)]">http://localhost:3000/api/v1</span>
                </div>
                <div className="flex justify-between">
                  <span>Swagger Docs:</span>
                  <a
                    href="http://localhost:3000/api/docs"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--md-sys-color-primary)] font-semibold inline-flex items-center gap-1 hover:underline"
                  >
                    <span>/api/docs</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex justify-between">
                  <span>Latency:</span>
                  <span className="text-[var(--md-sys-color-success)] font-semibold font-mono">&lt; 10ms</span>
                </div>
              </div>
            </div>

            {/* PostgreSQL Database Card */}
            <div className="p-6 rounded-[24px] m3-card space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[14px] bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-success)] flex items-center justify-center">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">PostgreSQL 15</h3>
                    <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">Relational Storage & TypeORM</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)]">
                  Connected
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                <div className="flex justify-between">
                  <span>Host:</span>
                  <span className="font-mono text-[var(--md-sys-color-on-surface)]">localhost:5432</span>
                </div>
                <div className="flex justify-between">
                  <span>Database:</span>
                  <span className="font-mono text-[var(--md-sys-color-on-surface)]">bug_tracker</span>
                </div>
                <div className="flex justify-between">
                  <span>Schema:</span>
                  <span className="text-[var(--md-sys-color-on-surface)] font-semibold">3NF Synchronized</span>
                </div>
              </div>
            </div>

            {/* Mailpit SMTP Server Card */}
            <div className="p-6 rounded-[24px] m3-card space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[14px] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)] flex items-center justify-center">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">Mailpit Mailbox</h3>
                    <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">Virtual SMTP & Webhook</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)]">
                  Connected
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                <div className="flex justify-between">
                  <span>SMTP Port:</span>
                  <span className="font-mono text-[var(--md-sys-color-on-surface)]">localhost:1025</span>
                </div>
                <div className="flex justify-between">
                  <span>Web Console:</span>
                  <a
                    href="http://localhost:8025"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--md-sys-color-primary)] font-semibold inline-flex items-center gap-1 hover:underline"
                  >
                    <span>localhost:8025</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex justify-between">
                  <span>Purposes:</span>
                  <span className="text-[var(--md-sys-color-on-surface)] font-semibold">Activation & Reset Tokens</span>
                </div>
              </div>
            </div>

            {/* Redis Cache Card */}
            <div className="p-6 rounded-[24px] m3-card space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[14px] bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-success)] flex items-center justify-center">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">Redis 7 Cache</h3>
                    <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">Rate Limiting & Token Cache</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)]">
                  Ready
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                <div className="flex justify-between">
                  <span>Port:</span>
                  <span className="font-mono text-[var(--md-sys-color-on-surface)]">localhost:6379</span>
                </div>
                <div className="flex justify-between">
                  <span>Role:</span>
                  <span className="text-[var(--md-sys-color-on-surface)] font-semibold">Session & Lockout Store</span>
                </div>
              </div>
            </div>

            {/* Object Storage Card */}
            <div className="p-6 rounded-[24px] m3-card space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[14px] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)] flex items-center justify-center">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">SeaweedFS S3</h3>
                    <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">Attachments & Issue Media</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)]">
                  Standby
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                <div className="flex justify-between">
                  <span>S3 Gateway:</span>
                  <span className="font-mono text-[var(--md-sys-color-on-surface)]">localhost:8333</span>
                </div>
                <div className="flex justify-between">
                  <span>Web Console:</span>
                  <a
                    href="http://localhost:9333"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--md-sys-color-primary)] font-semibold inline-flex items-center gap-1 hover:underline"
                  >
                    <span>localhost:9333</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
