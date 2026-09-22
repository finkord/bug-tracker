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
        return 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300';
      case 'ACCOUNT_LOCKED':
        return 'bg-amber-950/60 border-amber-500/40 text-amber-300 animate-pulse';
      case 'ACCOUNT_BLOCKED':
        return 'bg-red-950/80 border-red-500/50 text-red-300';
      case 'FAILED_PASSWORD':
      case 'TWO_FACTOR_FAILED':
        return 'bg-rose-950/60 border-rose-500/40 text-rose-300';
      case 'REQUIRE_2FA':
        return 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300';
      default:
        return 'bg-slate-800 border-slate-700 text-slate-300';
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
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Security Audit Center</h1>
            <p className="text-xs text-slate-400">SDSecurity Task 4 (Forensics, Brute-Force & Access Controls)</p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 p-1.5 rounded-full bg-slate-900 border border-slate-800">
          <button
            onClick={() => setTab('logs')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              tab === 'logs'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Audit Trail ({logsTotal})</span>
          </button>
          <button
            onClick={() => setTab('users')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              tab === 'users'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white'
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
          <div className="p-4 rounded-3xl m3-surface flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[260px]">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by email, IP address, or reason..."
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl m3-input text-white placeholder:text-slate-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl m3-input text-slate-200 bg-[#161c28]"
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
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Log</span>
            </button>
          </div>

          {/* Table Container */}
          <div className="rounded-3xl m3-surface overflow-hidden border border-slate-700/80 shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
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
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  {logsLoading ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                        Loading security audit trail...
                      </td>
                    </tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                        No audit log records match the current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3.5 font-mono text-slate-500 font-bold">#{log.id}</td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-slate-400">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${getStatusBadge(
                              log.status,
                            )}`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-medium text-white">{log.attemptedEmail}</td>
                        <td className="px-5 py-3.5 font-mono text-slate-400">{log.ipAddress}</td>
                        <td className="px-5 py-3.5 max-w-[180px] truncate text-slate-400" title={log.userAgent}>
                          {log.userAgent || 'Unknown'}
                        </td>
                        <td className="px-5 py-3.5 text-slate-400">
                          {log.failureReason ? (
                            <span className="text-amber-300/90 font-medium">{log.failureReason}</span>
                          ) : (
                            <span className="text-emerald-400/80 font-medium">—</span>
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
        <div className="rounded-3xl m3-surface overflow-hidden border border-slate-700/80 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
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
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {usersLoading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                      Loading registered users...
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-500">#{u.id}</td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-white">{u.fullName}</div>
                        <div className="text-[11px] text-slate-400">{u.email}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            u.systemRole === 'ADMIN'
                              ? 'bg-purple-950/60 border-purple-500/40 text-purple-300'
                              : 'bg-slate-800 border-slate-700 text-slate-400'
                          }`}
                        >
                          {u.systemRole}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {u.isActivated ? (
                          <span className="text-emerald-400 flex items-center gap-1 font-medium">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Activated</span>
                          </span>
                        ) : (
                          <span className="text-amber-400 flex items-center gap-1 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Pending</span>
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            u.twoFactorEnabled
                              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                              : 'bg-slate-800/80 border-slate-700 text-slate-500'
                          }`}
                        >
                          {u.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {u.isBlocked ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-rose-950/60 border border-rose-500/50 text-rose-300 flex items-center gap-1 w-max">
                            <Ban className="w-3 h-3" />
                            <span>Blocked</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-950/40 border border-emerald-700/50 text-emerald-300 flex items-center gap-1 w-max">
                            <CheckCircle className="w-3 h-3" />
                            <span>Active</span>
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleToggleBlock(u)}
                          disabled={actionLoadingId === u.id || u.systemRole === 'ADMIN'}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ml-auto disabled:opacity-40 ${
                            u.isBlocked
                              ? 'bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40'
                              : 'bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40'
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
