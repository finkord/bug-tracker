import React, { useState } from 'react';
import { useLoginAuditLogsQuery } from '../../api/queries';
import type { LoginAuditLogItem } from '../../api/client';
import { Badge, Button, Card, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui';
import {
  ShieldAlert,
  Search,
  RefreshCw,
  Clock,
  Globe,
  Loader2,
  KeyRound,
  ShieldCheck,
  UserX,
} from 'lucide-react';

export const AdminSecurityLogsTab: React.FC = () => {
  const [page, setPage] = useState(1);
  const limit = 25;
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: logsData, isLoading, isFetching, refetch } = useLoginAuditLogsQuery(page, limit);

  const logs = logsData?.items || [];
  const total = logsData?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const getStatusBadgeVariant = (
    status: LoginAuditLogItem['status'],
  ): 'success' | 'warning' | 'error' | 'primary' | 'neutral' => {
    switch (status) {
      case 'SUCCESS':
      case 'TWO_FACTOR_SUCCESS':
        return 'success';
      case 'FAILED_2FA':
      case 'ACCOUNT_NOT_ACTIVATED':
      case 'REQUIRE_2FA':
        return 'warning';
      case 'FAILED_PASSWORD':
      case 'ACCOUNT_LOCKED':
      case 'ACCOUNT_BLOCKED':
        return 'error';
      default:
        return 'neutral';
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesFilter = statusFilter === 'ALL' || log.status === statusFilter;
    const term = searchTerm.trim().toLowerCase();
    if (!term) return matchesFilter;

    const matchesSearch =
      log.attemptedEmail.toLowerCase().includes(term) ||
      log.ipAddress.includes(term) ||
      (log.failureReason && log.failureReason.toLowerCase().includes(term)) ||
      (log.userAgent && log.userAgent.toLowerCase().includes(term));

    return matchesFilter && matchesSearch;
  });

  // Calculate summary counts for active window
  const successCount = logs.filter((l) => l.status === 'SUCCESS' || l.status === 'TWO_FACTOR_SUCCESS').length;
  const failedCount = logs.filter((l) => l.status === 'FAILED_PASSWORD' || l.status === 'FAILED_2FA').length;
  const lockedCount = logs.filter((l) => l.status === 'ACCOUNT_LOCKED' || l.status === 'ACCOUNT_BLOCKED').length;

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-200">
      {/* Forensic KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          variant="filled"
          padding="md"
          rounded="2xl"
          className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 space-y-1"
        >
          <div className="flex items-center justify-between text-[var(--md-sys-color-on-surface-variant)]">
            <span className="text-xs font-bold uppercase tracking-wider">Total Recorded Events</span>
            <Clock className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
          </div>
          <p className="text-2xl font-black font-mono text-[var(--md-sys-color-on-surface)]">{total}</p>
          <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">Permanent audit log entries</span>
        </Card>

        <Card
          variant="filled"
          padding="md"
          rounded="2xl"
          className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 space-y-1"
        >
          <div className="flex items-center justify-between text-[var(--md-sys-color-on-surface-variant)]">
            <span className="text-xs font-bold uppercase tracking-wider">Successful Logins</span>
            <ShieldCheck className="w-4 h-4 text-[var(--md-sys-color-success)]" />
          </div>
          <p className="text-2xl font-black font-mono text-[var(--md-sys-color-success)]">{successCount}</p>
          <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">On current page</span>
        </Card>

        <Card
          variant="filled"
          padding="md"
          rounded="2xl"
          className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 space-y-1"
        >
          <div className="flex items-center justify-between text-[var(--md-sys-color-on-surface-variant)]">
            <span className="text-xs font-bold uppercase tracking-wider">Auth Failures</span>
            <KeyRound className="w-4 h-4 text-[var(--md-sys-color-error)]" />
          </div>
          <p className="text-2xl font-black font-mono text-[var(--md-sys-color-error)]">{failedCount}</p>
          <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">Bad passwords & failed 2FA</span>
        </Card>

        <Card
          variant="filled"
          padding="md"
          rounded="2xl"
          className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 space-y-1"
        >
          <div className="flex items-center justify-between text-[var(--md-sys-color-on-surface-variant)]">
            <span className="text-xs font-bold uppercase tracking-wider">Lockouts / Blocks</span>
            <UserX className="w-4 h-4 text-[var(--md-sys-color-error)]" />
          </div>
          <p className="text-2xl font-black font-mono text-[var(--md-sys-color-on-surface)]">{lockedCount}</p>
          <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">Blocked account attempts</span>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card
        variant="filled"
        padding="sm"
        rounded="2xl"
        className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20"
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
              <input
                type="text"
                placeholder="Search by email, IP address, or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]/40 text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)] focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
              />
            </div>

            <div className="w-full sm:w-52">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 text-xs rounded-xl bg-[var(--md-sys-color-surface)]">
                  <SelectValue placeholder="All Outcomes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Event Outcomes</SelectItem>
                  <SelectItem value="SUCCESS">Success</SelectItem>
                  <SelectItem value="FAILED_PASSWORD">Failed Password</SelectItem>
                  <SelectItem value="FAILED_2FA">Failed 2FA</SelectItem>
                  <SelectItem value="TWO_FACTOR_SUCCESS">2FA Success</SelectItem>
                  <SelectItem value="ACCOUNT_LOCKED">Account Locked</SelectItem>
                  <SelectItem value="ACCOUNT_BLOCKED">Account Blocked</SelectItem>
                  <SelectItem value="ACCOUNT_NOT_ACTIVATED">Not Activated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading || isFetching}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Forensic Table */}
      <Card
        variant="filled"
        padding="none"
        rounded="3xl"
        className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 overflow-hidden shadow-xs"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] font-bold uppercase tracking-wider text-[10px] border-b border-[var(--md-sys-color-outline-variant)]/20">
              <tr>
                <th className="py-3 px-4">Outcome</th>
                <th className="py-3 px-4">Attempted Identity</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Browser / Device</th>
                <th className="py-3 px-4">Telemetry Detail</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]/10">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-[var(--md-sys-color-on-surface-variant)]">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-[var(--md-sys-color-primary)] mb-2" />
                    Loading forensic login logs...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-[var(--md-sys-color-on-surface-variant)]">
                    <ShieldAlert className="w-8 h-8 mx-auto opacity-30 mb-2" />
                    No login events match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-[var(--md-sys-color-surface-container)]/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-medium whitespace-nowrap">
                      <Badge variant={getStatusBadgeVariant(log.status)} size="sm">
                        {log.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-medium text-[var(--md-sys-color-on-surface)]">
                      <span className="font-semibold">{log.attemptedEmail}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] font-mono text-[11px] border border-[var(--md-sys-color-outline-variant)]/20">
                        {log.ipAddress}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[var(--md-sys-color-on-surface-variant)] max-w-xs truncate text-[11px]">
                      <div className="flex items-center gap-1.5" title={log.userAgent}>
                        <Globe className="w-3.5 h-3.5 text-[var(--md-sys-color-outline)] shrink-0" />
                        <span className="truncate">{log.userAgent || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[var(--md-sys-color-on-surface-variant)] text-[11px]">
                      {log.failureReason ? (
                        <span className="text-[var(--md-sys-color-error)] font-medium">
                          {log.failureReason}
                        </span>
                      ) : (
                        'Authenticated'
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-[var(--md-sys-color-on-surface-variant)] font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-[var(--md-sys-color-outline-variant)]/20 text-xs text-[var(--md-sys-color-on-surface-variant)] bg-[var(--md-sys-color-surface-container)]/30">
            <span>
              Showing {filteredLogs.length} events (Page {page} of {totalPages})
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="px-2 font-mono font-bold text-[var(--md-sys-color-on-surface)]">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
