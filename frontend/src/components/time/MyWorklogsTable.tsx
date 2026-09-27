import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { WorklogItem } from '../../api/client';
import { Button } from '../ui';
import {
  Clock,
  Calendar,
  Search,
  ArrowUpDown,
  PlusCircle,
  FileText,
  ExternalLink,
  Sparkles,
  Inbox,
  Loader2,
} from 'lucide-react';

interface MyWorklogsTableProps {
  worklogs: WorklogItem[];
  loading?: boolean;
  onOpenLogModal: () => void;
}

export const MyWorklogsTable: React.FC<MyWorklogsTableProps> = ({
  worklogs,
  loading = false,
  onOpenLogModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Filter and sort worklogs
  const filteredWorklogs = useMemo(() => {
    let result = [...worklogs];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (log) =>
          log.issue?.key.toLowerCase().includes(q) ||
          log.issue?.title.toLowerCase().includes(q) ||
          (log.description && log.description.toLowerCase().includes(q)) ||
          log.dateLogged.includes(q)
      );
    }

    result.sort((a, b) => {
      const dateA = new Date(a.dateLogged).getTime();
      const dateB = new Date(b.dateLogged).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [worklogs, searchQuery, sortOrder]);

  const totalFilteredHours = useMemo(() => {
    return filteredWorklogs.reduce((sum, item) => sum + item.timeSpentHours, 0);
  }, [filteredWorklogs]);

  const uniqueIssuesCount = useMemo(() => {
    const set = new Set(filteredWorklogs.map((l) => l.issue?.id).filter(Boolean));
    return set.size;
  }, [filteredWorklogs]);

  return (
    <div className="space-y-4">
      {/* Top summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
              Total Hours Logged
            </div>
            <div className="text-2xl font-black text-[var(--md-sys-color-primary)] mt-0.5">
              {totalFilteredHours.toFixed(1)}h
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
              Logged Entries
            </div>
            <div className="text-2xl font-black text-[var(--md-sys-color-on-surface)] mt-0.5">
              {filteredWorklogs.length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
              Active Tickets
            </div>
            <div className="text-2xl font-black text-[var(--md-sys-color-on-surface)] mt-0.5">
              {uniqueIssuesCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Action and Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--md-sys-color-on-surface-variant)] pointer-events-none" />
          <input
            type="text"
            placeholder="Filter worklogs by ticket, note, date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)] focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="tonal"
            size="sm"
            onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
            leftIcon={<ArrowUpDown className="w-3.5 h-3.5" />}
          >
            {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
          </Button>

          <Button
            variant="filled"
            size="sm"
            onClick={onOpenLogModal}
            leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
          >
            Log Work
          </Button>
        </div>
      </div>

      {/* Main Table / Card List */}
      {loading ? (
        <div className="p-12 text-center rounded-2xl bg-[var(--md-sys-color-surface-container-lowest)] border border-[var(--md-sys-color-outline-variant)]">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--md-sys-color-primary)] mb-2" />
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Loading worklogs...</p>
        </div>
      ) : filteredWorklogs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[var(--md-sys-color-surface-container-lowest)] border border-[var(--md-sys-color-outline-variant)]">
          <Inbox className="w-12 h-12 mx-auto text-[var(--md-sys-color-on-surface-variant)] opacity-40 mb-3" />
          <h3 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
            No worklogs found
          </h3>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] max-w-sm mx-auto mt-1 mb-4">
            {searchQuery
              ? 'No worklog records match your filter criteria. Try clearing the search query.'
              : 'You have not logged any work hours yet. Start by logging time against any ticket.'}
          </p>
          <Button
            variant="filled"
            size="sm"
            onClick={onOpenLogModal}
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            Log Work Now
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] overflow-hidden shadow-xs">
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider font-bold border-b border-[var(--md-sys-color-outline-variant)]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Ticket</th>
                  <th className="py-3 px-4">Time Spent</th>
                  <th className="py-3 px-4">Work Description</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]">
                {filteredWorklogs.map((log) => {
                  const dateObj = new Date(log.dateLogged);
                  const formattedDate = dateObj.toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-[var(--md-sys-color-surface-container-highest)]/40 transition-colors group"
                    >
                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)]" />
                          <span className="font-semibold text-[var(--md-sys-color-on-surface)]">
                            {formattedDate}
                          </span>
                        </div>
                      </td>

                      {/* Issue */}
                      <td className="py-3.5 px-4">
                        {log.issue ? (
                          <Link
                            to={`/issues/${log.issue.key}`}
                            className="inline-flex items-center gap-2 group/link hover:underline"
                          >
                            <span className="px-1.5 py-0.5 rounded-md text-[11px] font-black bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] group-hover/link:bg-[var(--md-sys-color-primary)] group-hover/link:text-[var(--md-sys-color-on-primary)] transition-colors">
                              {log.issue.key}
                            </span>
                            <span className="font-medium text-[var(--md-sys-color-on-surface)] line-clamp-1 max-w-[240px]">
                              {log.issue.title}
                            </span>
                          </Link>
                        ) : (
                          <span className="text-[var(--md-sys-color-on-surface-variant)] italic">
                            Unspecified Ticket
                          </span>
                        )}
                      </td>

                      {/* Time Spent */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border border-[var(--md-sys-color-primary)]/20">
                          <Clock className="w-3 h-3" />
                          {log.timeSpentHours}h
                        </span>
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4 max-w-md">
                        {log.description ? (
                          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] line-clamp-2">
                            {log.description}
                          </p>
                        ) : (
                          <span className="text-[var(--md-sys-color-on-surface-variant)] italic opacity-60">
                            No narrative description provided
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {log.issue && (
                          <Link to={`/issues/${log.issue.key}`}>
                            <Button
                              variant="ghost"
                              size="xs"
                              rightIcon={<ExternalLink className="w-3 h-3" />}
                            >
                              View Ticket
                            </Button>
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="sm:hidden divide-y divide-[var(--md-sys-color-outline-variant)]">
            {filteredWorklogs.map((log) => {
              const dateObj = new Date(log.dateLogged);
              const formattedDate = dateObj.toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              });

              return (
                <div key={log.id} className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="font-semibold text-[var(--md-sys-color-on-surface)]">
                        {formattedDate}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]">
                      <Clock className="w-3 h-3" />
                      {log.timeSpentHours}h
                    </span>
                  </div>

                  {log.issue && (
                    <Link
                      to={`/issues/${log.issue.key}`}
                      className="block p-2 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container)] transition-colors"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]">
                          {log.issue.key}
                        </span>
                        <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface)] truncate">
                          {log.issue.title}
                        </span>
                      </div>
                    </Link>
                  )}

                  {log.description && (
                    <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] bg-[var(--md-sys-color-surface-container-lowest)] p-2 rounded-lg border border-[var(--md-sys-color-outline-variant)]/60">
                      {log.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
