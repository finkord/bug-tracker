import React, { useState, useEffect } from 'react';
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
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const data = await api.getUsers(1, 100);
      setUsers(data.items);
    } catch (err) {
      console.error('Failed to load users:', err);
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
    } catch (err) {
      console.error('Failed to update user block state:', err);
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
    const matchesFilter = statusFilter === 'ALL' || log.status === statusFilter;
    const matchesSearch =
      searchTerm === '' ||
      log.attemptedEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ipAddress.includes(searchTerm) ||
      (log.failureReason && log.failureReason.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-[18px] bg-[var(--md-sys-color-warning-container)] text-[var(--md-sys-color-on-warning-container)] flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-[var(--md-sys-color-warning)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)] tracking-tight">Security Audit Center</h1>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Security forensics, rate limiting & access controls</p>
          </div>
        </div>

        {/* Tab Controls - M3 Pill Group */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]">
          <button
            onClick={() => setTab('logs')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              tab === 'logs'
                ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-sm'
                : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Audit Trail ({logsTotal})</span>
          </button>
          <button
            onClick={() => setTab('users')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              tab === 'users'
                ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-sm'
                : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>User Accounts & Blocks</span>
          </button>
        </div>
      </div>

      {tab === 'logs' ? (
        /* ================= AUDIT LOGS VIEW ================= */
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-4 rounded-[24px] m3-card flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5 flex-1 min-w-[260px]">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-[var(--md-sys-color-outline)]" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by email, IP address, or reason..."
                  className="w-full pl-10 pr-4 py-2.5 text-xs m3-input"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
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
                      <tr key={log.id} className="hover:bg-[var(--md-sys-color-surface-container-high)]/50 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-[var(--md-sys-color-outline)] font-bold">#{log.id}</td>
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
                        <td className="px-5 py-3.5 font-medium text-[var(--md-sys-color-on-surface)]">{log.attemptedEmail}</td>
                        <td className="px-5 py-3.5 font-mono text-[var(--md-sys-color-on-surface-variant)]">{log.ipAddress}</td>
                        <td className="px-5 py-3.5 max-w-[180px] truncate text-[var(--md-sys-color-on-surface-variant)]" title={log.userAgent}>
                          {log.userAgent || 'Unknown'}
                        </td>
                        <td className="px-5 py-3.5 text-[var(--md-sys-color-on-surface-variant)]">
                          {log.failureReason ? (
                            <span className="text-[var(--md-sys-color-warning)] font-medium">{log.failureReason}</span>
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
      ) : (
        /* ================= USER ACCOUNTS & BLOCKING VIEW ================= */
        <div className="rounded-[24px] m3-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] font-semibold border-b border-[var(--md-sys-color-outline-variant)]">
                <tr>
                  <th className="px-5 py-3.5">ID</th>
                  <th className="px-5 py-3.5">User Profile</th>
                  <th className="px-5 py-3.5">System Role</th>
                  <th className="px-5 py-3.5">Email Activated</th>
                  <th className="px-5 py-3.5">2FA TOTP</th>
                  <th className="px-5 py-3.5">Account State</th>
                  <th className="px-5 py-3.5 text-right">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)]">
                {usersLoading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-[var(--md-sys-color-outline)]">
                      Loading registered users...
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-[var(--md-sys-color-surface-container-high)]/50 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-[var(--md-sys-color-outline)]">#{u.id}</td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-[var(--md-sys-color-on-surface)]">{u.fullName}</div>
                        <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">{u.email}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block px-3 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            u.systemRole === 'ADMIN'
                              ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
                              : 'bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface-variant)]'
                          }`}
                        >
                          {u.systemRole}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
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
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            u.twoFactorEnabled
                              ? 'bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)]'
                              : 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-outline)]'
                          }`}
                        >
                          {u.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {u.isBlocked ? (
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] flex items-center gap-1 w-max">
                            <Ban className="w-3 h-3" />
                            <span>Blocked</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)] flex items-center gap-1 w-max">
                            <CheckCircle className="w-3 h-3" />
                            <span>Active</span>
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleToggleBlock(u)}
                          disabled={actionLoadingId === u.id || u.systemRole === 'ADMIN'}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ml-auto disabled:opacity-40 ${
                            u.isBlocked
                              ? 'bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)]'
                              : 'bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]'
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
