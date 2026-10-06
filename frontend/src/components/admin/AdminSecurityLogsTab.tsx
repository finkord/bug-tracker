import React, { useState, useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { useLoginAuditLogsQuery } from '../../api/queries';
import type { LoginAuditLogItem } from '../../api/client';
import {
  Badge,
  Button,
  Card,
  DataTable,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../ui';
import {
  Search,
  RefreshCw,
  Clock,
  Globe,
  KeyRound,
  ShieldCheck,
  UserX,
  Copy,
  Check,
  Filter,
  Download,
} from 'lucide-react';

interface ParsedUserAgent {
  browser: string;
  os: string;
  summary: string;
}

const parseUserAgent = (ua?: string | null): ParsedUserAgent => {
  if (!ua) {
    return { browser: 'Unknown', os: 'Unknown', summary: 'Unknown client' };
  }

  let os = 'Unknown OS';
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';

  let browser = 'Unknown Browser';
  if (/curl/i.test(ua)) browser = 'curl';
  else if (/postman/i.test(ua)) browser = 'Postman';
  else if (/edg/i.test(ua)) browser = 'Edge';
  else if (/chrome|crios/i.test(ua)) browser = 'Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua)) browser = 'Safari';

  return {
    browser,
    os,
    summary: `${browser} on ${os}`,
  };
};

const formatRelativeTime = (isoDate: string): string => {
  const date = new Date(isoDate);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
};

export const AdminSecurityLogsTab: React.FC = () => {
  const [page, setPage] = useState(1);
  const limit = 25;
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedEmailId, setCopiedEmailId] = useState<string | number | null>(null);
  const [copiedIpId, setCopiedIpId] = useState<string | number | null>(null);

  const { data: logsData, isLoading, isFetching, refetch } = useLoginAuditLogsQuery(page, limit);

  const logs = useMemo(() => logsData?.items || [], [logsData?.items]);
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

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
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
  }, [logs, statusFilter, searchTerm]);

  const handleCopyEmail = (id: string | number, email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmailId(id);
    setTimeout(() => setCopiedEmailId(null), 2000);
  };

  const handleCopyIp = (id: string | number, ip: string) => {
    navigator.clipboard.writeText(ip);
    setCopiedIpId(id);
    setTimeout(() => setCopiedIpId(null), 2000);
  };

  const handleExportCsv = () => {
    if (filteredLogs.length === 0) return;

    const headers = ['ID', 'Status', 'Attempted Email', 'IP Address', 'Browser / Device', 'Failure Reason', 'Timestamp'];
    const rows = filteredLogs.map((log) => [
      log.id,
      log.status,
      log.attemptedEmail,
      log.ipAddress,
      (log.userAgent || '').replace(/"/g, '""'),
      (log.failureReason || '').replace(/"/g, '""'),
      log.createdAt,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `security-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Calculate summary counts for active window
  const successCount = logs.filter((l) => l.status === 'SUCCESS' || l.status === 'TWO_FACTOR_SUCCESS').length;
  const failedCount = logs.filter((l) => l.status === 'FAILED_PASSWORD' || l.status === 'FAILED_2FA').length;
  const lockedCount = logs.filter((l) => l.status === 'ACCOUNT_LOCKED' || l.status === 'ACCOUNT_BLOCKED').length;

  const columns = useMemo<ColumnDef<LoginAuditLogItem>[]>(() => [
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Outcome',
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <span className="font-mono font-medium whitespace-nowrap">
            <Badge variant={getStatusBadgeVariant(status)} size="sm">
              {status}
            </Badge>
          </span>
        );
      },
    },
    {
      id: 'attemptedEmail',
      accessorKey: 'attemptedEmail',
      header: 'Attempted Identity',
      cell: ({ row }) => {
        const log = row.original;
        const isCopied = copiedEmailId === log.id;
        return (
          <div className="flex items-center gap-2 group/identity">
            <span className="font-semibold text-[var(--md-sys-color-on-surface)] select-text">
              {log.attemptedEmail}
            </span>
            <button
              type="button"
              onClick={() => handleCopyEmail(log.id, log.attemptedEmail)}
              className="p-1 rounded-md text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors cursor-pointer"
              title="Copy attempted email"
              aria-label="Copy attempted email"
            >
              {isCopied ? (
                <Check className="w-3.5 h-3.5 text-[var(--md-sys-color-success)]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        );
      },
    },
    {
      id: 'ipAddress',
      accessorKey: 'ipAddress',
      header: 'IP Address',
      cell: ({ row }) => {
        const log = row.original;
        const isCopied = copiedIpId === log.id;
        return (
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-md bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] font-mono text-[11px] border border-[var(--md-sys-color-outline-variant)]/20 select-text">
              {log.ipAddress}
            </span>
            <button
              type="button"
              onClick={() => handleCopyIp(log.id, log.ipAddress)}
              className="p-1 rounded-md text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors cursor-pointer"
              title="Copy IP address"
              aria-label="Copy IP address"
            >
              {isCopied ? (
                <Check className="w-3 h-3 text-[var(--md-sys-color-success)]" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setSearchTerm(log.ipAddress)}
              className="p-1 rounded-md text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors cursor-pointer"
              title="Filter by this IP address"
              aria-label="Filter by this IP address"
            >
              <Filter className="w-3 h-3" />
            </button>
          </div>
        );
      },
    },
    {
      id: 'userAgent',
      accessorKey: 'userAgent',
      header: 'Browser / Device',
      cell: ({ row }) => {
        const ua = row.original.userAgent;
        const parsed = parseUserAgent(ua);
        return (
          <div className="flex items-center gap-1.5" title={ua || 'Unknown client'}>
            <Globe className="w-3.5 h-3.5 text-[var(--md-sys-color-outline)] shrink-0" />
            <span className="text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)] truncate max-w-[160px]">
              {parsed.summary}
            </span>
          </div>
        );
      },
    },
    {
      id: 'failureReason',
      accessorKey: 'failureReason',
      header: 'Telemetry Detail',
      cell: ({ row }) => {
        const reason = row.original.failureReason;
        return reason ? (
          <span className="text-[var(--md-sys-color-error)] font-medium text-[11px]">
            {reason}
          </span>
        ) : (
          <span className="text-[var(--md-sys-color-on-surface-variant)] text-[11px]">
            Authenticated
          </span>
        );
      },
    },
    {
      id: 'createdAt',
      accessorKey: 'createdAt',
      header: 'Timestamp',
      cell: ({ row }) => {
        const iso = row.original.createdAt;
        return (
          <span
            className="text-[var(--md-sys-color-on-surface-variant)] font-mono text-[11px] whitespace-nowrap cursor-default"
            title={new Date(iso).toLocaleString()}
          >
            {formatRelativeTime(iso)}
          </span>
        );
      },
    },
  ], [copiedEmailId, copiedIpId]);

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
              onClick={handleExportCsv}
              disabled={filteredLogs.length === 0}
              leftIcon={<Download className="w-3.5 h-3.5" />}
              title="Export filtered logs to CSV"
            >
              Export CSV
            </Button>
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

      {/* Unified Forensic DataTable */}
      <DataTable
        columns={columns}
        data={filteredLogs}
        getRowId={(l) => String(l.id)}
        page={page}
        pageSize={limit}
        total={total}
        totalPages={totalPages}
        onPageChange={setPage}
        isLoading={isLoading}
        loadingMessage="Loading forensic login logs..."
        emptyTitle="No login events match the selected criteria."
        emptyDescription="Try adjusting your outcome filter or search terms."
      />
    </div>
  );
};
