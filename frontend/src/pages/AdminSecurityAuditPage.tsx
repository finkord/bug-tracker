import React, { useState, useEffect } from 'react';
import { api, type LoginAuditLogItem, type UserProfile } from '../api/client';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
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
} from 'lucide-react';

export const AdminSecurityAuditPage: React.FC = () => {
  const [tab, setTab] = useState<'logs' | 'users'>('logs');

  // Audit Logs State
  const [logs, setLogs] = useState<LoginAuditLogItem[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsTotal, setLogsTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Users State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const data = await api.getLoginAuditLogs(1, 100);
      setLogs(data.items);
      setLogsTotal(data.total);
    } catch {
      // Ignored
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const data = await api.getUsers({ page: 1, limit: 100 });
      setUsers(data.items);
    } catch {
      // Ignored
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'logs') {
      fetchLogs();
    } else {
      fetchUsers();
    }
  }, [tab]);

  const handleToggleBlock = async (user: UserProfile) => {
    setActionLoadingId(user.id);
    try {
      if (user.isBlocked) {
        await api.unblockUser(user.id);
      } else {
        await api.blockUser(user.id);
      }
      await fetchUsers();
    } catch {
      // Ignored
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadgeVariant = (status: LoginAuditLogItem['status']): 'success' | 'warning' | 'error' | 'primary' | 'neutral' => {
    switch (status) {
      case 'SUCCESS':
      case 'TWO_FACTOR_SUCCESS':
        return 'success';
      case 'ACCOUNT_LOCKED':
        return 'warning';
      case 'ACCOUNT_BLOCKED':
      case 'FAILED_PASSWORD':
      case 'TWO_FACTOR_FAILED':
        return 'error';
      case 'REQUIRE_2FA':
        return 'primary';
      default:
        return 'neutral';
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesFilter = statusFilter === 'ALL' || log.status === statusFilter;
    const matchesSearch =
      searchTerm === '' ||
      log.attemptedEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ipAddress.includes(searchTerm) ||
      (log.failureReason && log.failureReason.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--md-sys-color-outline-variant)] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--md-sys-color-warning-container)] text-[var(--md-sys-color-on-warning-container)] flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-[var(--md-sys-color-warning)]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[var(--md-sys-color-on-surface)] tracking-tight">
              Security Audit Center
            </h1>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
              Forensic audit trail, account access controls, and rate-limiting telemetry
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={tab === 'logs' ? 'filled' : 'ghost'}
            size="sm"
            onClick={() => setTab('logs')}
            leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
          >
            Audit Trail ({logsTotal})
          </Button>
          <Button
            type="button"
            variant={tab === 'users' ? 'filled' : 'ghost'}
            size="sm"
            onClick={() => setTab('users')}
            leftIcon={<Users className="w-3.5 h-3.5" />}
          >
            User Accounts & Locks
          </Button>
        </div>
      </div>

      {tab === 'logs' ? (
        /* ================= AUDIT LOGS VIEW ================= */
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-4 rounded-3xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5 flex-1 min-w-[260px]">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3.5 top-2.5 w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)]" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by email, IP address, or reason..."
                  className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-full bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)]/30 focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)] font-medium"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3.5 py-1.5 text-xs rounded-full bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)]/30 font-medium cursor-pointer outline-none"
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

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fetchLogs}
              isLoading={logsLoading}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh Log
            </Button>
          </div>

          {/* Table Container */}
          <div className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse table-auto">
                <thead className="bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider text-[10px] font-bold border-b border-[var(--md-sys-color-outline-variant)]/20">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Attempted Email</th>
                    <th className="px-4 py-3">Client IP</th>
                    <th className="px-4 py-3">User-Agent</th>
                    <th className="px-4 py-3">Forensic Context</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]/20 text-[var(--md-sys-color-on-surface)]">
                  {logsLoading ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-[var(--md-sys-color-on-surface-variant)]">
                        Loading security audit trail...
                      </td>
                    </tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-[var(--md-sys-color-on-surface-variant)]">
                        No audit log records match the current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[var(--md-sys-color-surface-container-high)]/40 transition-colors">
                        <td className="px-4 py-3 font-mono text-[var(--md-sys-color-on-surface-variant)] font-bold">
                          #{log.id}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-[var(--md-sys-color-on-surface-variant)]">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant={getStatusBadgeVariant(log.status)} size="sm">
                            {log.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-medium text-[var(--md-sys-color-on-surface)]">
                          {log.attemptedEmail}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-[var(--md-sys-color-on-surface-variant)]">
                          {log.ipAddress}
                        </td>
                        <td className="px-4 py-3 max-w-[180px] truncate text-[var(--md-sys-color-on-surface-variant)]" title={log.userAgent}>
                          {log.userAgent || 'Unknown'}
                        </td>
                        <td className="px-4 py-3 text-[var(--md-sys-color-on-surface-variant)]">
                          {log.failureReason ? (
                            <span className="text-[var(--md-sys-color-error)] font-medium text-xs">
                              {log.failureReason}
                            </span>
                          ) : (
                            <span className="text-[var(--md-sys-color-success)] font-medium text-xs">—</span>
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
      ) : (
        /* ================= USER ACCOUNTS & BLOCKING VIEW ================= */
        <div className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse table-auto">
              <thead className="bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider text-[10px] font-bold border-b border-[var(--md-sys-color-outline-variant)]/20">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">User Profile</th>
                  <th className="px-4 py-3">System Role</th>
                  <th className="px-4 py-3">Email Activated</th>
                  <th className="px-4 py-3">2FA TOTP</th>
                  <th className="px-4 py-3">Account State</th>
                  <th className="px-4 py-3 text-right">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]/20 text-[var(--md-sys-color-on-surface)]">
                {usersLoading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-[var(--md-sys-color-on-surface-variant)]">
                      Loading registered users...
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-[var(--md-sys-color-surface-container-high)]/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-[var(--md-sys-color-on-surface-variant)]">
                        #{u.id}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-[var(--md-sys-color-on-surface)]">{u.fullName}</div>
                        <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">{u.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={u.systemRole === 'ADMIN' ? 'primary' : 'neutral'} size="sm">
                          {u.systemRole}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {u.isActivated ? (
                          <span className="text-[var(--md-sys-color-success)] flex items-center gap-1 font-medium">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Activated</span>
                          </span>
                        ) : (
                          <span className="text-[var(--md-sys-color-warning)] flex items-center gap-1 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Pending</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={u.twoFactorEnabled ? 'success' : 'neutral'} size="sm">
                          {u.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {u.isBlocked ? (
                          <Badge variant="error" size="sm">
                            <Ban className="w-3 h-3 mr-1" />
                            Blocked
                          </Badge>
                        ) : (
                          <Badge variant="success" size="sm">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          variant={u.isBlocked ? 'tonal' : 'danger-tonal'}
                          size="xs"
                          onClick={() => handleToggleBlock(u)}
                          disabled={actionLoadingId === u.id || u.systemRole === 'ADMIN'}
                          isLoading={actionLoadingId === u.id}
                          leftIcon={u.isBlocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        >
                          {u.isBlocked ? 'Unblock' : 'Block User'}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
