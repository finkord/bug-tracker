import React, { useState } from 'react';
import {
  useLoginAuditLogsQuery,
  useUsersQuery,
  useBlockUserMutation,
  useUnblockUserMutation,
} from '../api/queries';
import type { LoginAuditLogItem, UserProfile } from '../api/client';
import {
  Button,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../components/ui';
import {
  ShieldAlert,
  Users,
  Search,
  RefreshCw,
  Ban,
  CheckCircle,
  Unlock,
  ShieldCheck,
} from 'lucide-react';

export const AdminSecurityAuditPage: React.FC = () => {
  const [tab, setTab] = useState<'logs' | 'users'>('logs');

  // TanStack Query Hooks
  const {
    data: logsData,
    isLoading: logsLoading,
    refetch: refetchLogs,
  } = useLoginAuditLogsQuery(1, 100);

  const {
    data: usersData,
    isLoading: usersLoading,
    refetch: refetchUsers,
  } = useUsersQuery({ page: 1, limit: 100 });

  const blockMutation = useBlockUserMutation();
  const unblockMutation = useUnblockUserMutation();

  const logs = logsData?.items || [];
  const logsTotal = logsData?.total || 0;
  const users = usersData?.items || [];

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const handleToggleBlock = async (user: UserProfile) => {
    setActionLoadingId(user.id);
    try {
      if (user.isBlocked) {
        await unblockMutation.mutateAsync(user.id);
      } else {
        await blockMutation.mutateAsync(user.id);
      }
    } catch {
      // Handled by UI feedback
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
        <Tabs value={tab} onValueChange={(v) => setTab(v as 'logs' | 'users')}>
          <TabsList variant="pills" className="rounded-full">
            <TabsTrigger
              value="logs"
              variant="pills"
              size="sm"
              className="rounded-full gap-1.5 font-bold"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Audit Trail ({logsTotal})</span>
            </TabsTrigger>
            <TabsTrigger
              value="users"
              variant="pills"
              size="sm"
              className="rounded-full gap-1.5 font-bold"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Identity Protection ({users.length})</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {tab === 'logs' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[var(--md-sys-color-surface-container-low)] rounded-2xl border border-[var(--md-sys-color-outline-variant)]">
            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[240px]">
              <div className="relative flex-1 min-w-[180px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
                <input
                  type="text"
                  placeholder="Filter by email, IP address, reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)] focus:outline-hidden focus:ring-1 focus:ring-[var(--md-sys-color-primary)]"
                />
              </div>

              <div className="w-44">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 text-xs rounded-xl">
                    <SelectValue placeholder="All Event Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Outcomes</SelectItem>
                    <SelectItem value="SUCCESS">Success</SelectItem>
                    <SelectItem value="FAILED_PASSWORD">Failed Password</SelectItem>
                    <SelectItem value="REQUIRE_2FA">Require 2FA</SelectItem>
                    <SelectItem value="TWO_FACTOR_SUCCESS">2FA Success</SelectItem>
                    <SelectItem value="TWO_FACTOR_FAILED">2FA Failed</SelectItem>
                    <SelectItem value="ACCOUNT_LOCKED">Account Locked</SelectItem>
                    <SelectItem value="ACCOUNT_BLOCKED">Account Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchLogs()}
              disabled={logsLoading}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? 'animate-spin' : ''}`} />}
            >
              Refresh Trail
            </Button>
          </div>

          {/* Logs Table */}
          <div className="bg-[var(--md-sys-color-surface)] rounded-2xl border border-[var(--md-sys-color-outline-variant)] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] font-bold uppercase tracking-wider text-[10px] border-b border-[var(--md-sys-color-outline-variant)]">
                  <tr>
                    <th className="py-3 px-4">Event Outcome</th>
                    <th className="py-3 px-4">Target Identity</th>
                    <th className="py-3 px-4">Client IP</th>
                    <th className="py-3 px-4">Failure Telemetry</th>
                    <th className="py-3 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]/60">
                  {logsLoading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-[var(--md-sys-color-on-surface-variant)]">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[var(--md-sys-color-primary)]" />
                        Loading forensic logs...
                      </td>
                    </tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-[var(--md-sys-color-on-surface-variant)]">
                        No security logs match active criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[var(--md-sys-color-surface-container-lowest)] transition-colors">
                        <td className="py-2.5 px-4 font-mono font-medium whitespace-nowrap">
                          <Badge variant={getStatusBadgeVariant(log.status)} size="sm">
                            {log.status}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-4 font-medium text-[var(--md-sys-color-on-surface)]">
                          {log.attemptedEmail}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                          {log.ipAddress}
                        </td>
                        <td className="py-2.5 px-4 text-[var(--md-sys-color-on-surface-variant)]">
                          {log.failureReason || '—'}
                        </td>
                        <td className="py-2.5 px-4 text-[var(--md-sys-color-on-surface-variant)] whitespace-nowrap font-mono text-[11px]">
                          {new Date(log.createdAt).toLocaleString()}
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

      {tab === 'users' && (
        <div className="space-y-4">
          <div className="p-3.5 bg-[var(--md-sys-color-surface-container-low)] rounded-2xl border border-[var(--md-sys-color-outline-variant)] flex items-center justify-between">
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-medium">
              Administrator authority to manually lock out compromised accounts or restore access.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchUsers()}
              disabled={usersLoading}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${usersLoading ? 'animate-spin' : ''}`} />}
            >
              Refresh Accounts
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {usersLoading ? (
              <div className="col-span-full py-12 text-center text-xs text-[var(--md-sys-color-on-surface-variant)]">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[var(--md-sys-color-primary)]" />
                Querying identity directory...
              </div>
            ) : (
              users.map((u) => (
                <div
                  key={u.id}
                  className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-3 ${
                    u.isBlocked
                      ? 'bg-[var(--md-sys-color-error-container)]/20 border-[var(--md-sys-color-error)]/40'
                      : 'bg-[var(--md-sys-color-surface)] border-[var(--md-sys-color-outline-variant)]'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-[var(--md-sys-color-on-surface)] truncate">
                        {u.fullName}
                      </span>
                      <Badge variant={u.isBlocked ? 'error' : 'success'} size="sm">
                        {u.isBlocked ? 'Blocked' : 'Active'}
                      </Badge>
                    </div>

                    <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] truncate">
                      {u.email}
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                      <Badge variant="neutral" size="sm">
                        {u.systemRole}
                      </Badge>
                      {u.twoFactorEnabled ? (
                        <Badge variant="primary" size="sm" className="gap-1">
                          <CheckCircle className="w-3 h-3" />
                          2FA Active
                        </Badge>
                      ) : (
                        <Badge variant="warning" size="sm">
                          No 2FA
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[var(--md-sys-color-outline-variant)]/60 flex items-center justify-between">
                    <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-mono">
                      ID #{u.id}
                    </span>
                    <Button
                      variant={u.isBlocked ? 'filled' : 'outline'}
                      size="sm"
                      onClick={() => handleToggleBlock(u)}
                      isLoading={actionLoadingId === u.id}
                      leftIcon={u.isBlocked ? <Unlock className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                    >
                      {u.isBlocked ? 'Restore Access' : 'Block Account'}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
