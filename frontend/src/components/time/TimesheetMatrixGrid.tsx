import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { TeamTimesheetMatrix, IssueItem } from '../../api/client';
import type { MatrixGroupBy, CellBreakdownData, WorklogCellEntry } from '../../types/timeTracking';
import { Avatar } from '../common/Avatar';
import { Tooltip } from '../ui';
import { WorklogCellTooltipContent } from './WorklogCellTooltip';
import {
  ChevronRight,
  ChevronDown,
  Clock,
  Search,
  Eye,
  EyeOff,
} from 'lucide-react';

interface TimesheetMatrixGridProps {
  matrix: TeamTimesheetMatrix | null;
  issues?: IssueItem[];
  groupBy: MatrixGroupBy;
  onSelectCell: (data: CellBreakdownData) => void;
  onQuickLogForCell: (issueId?: number, userId?: number, date?: string) => void;
}

export const TimesheetMatrixGrid: React.FC<TimesheetMatrixGridProps> = ({
  matrix,
  groupBy,
  onSelectCell,
  onQuickLogForCell,
}) => {
  const [expandedRowKeys, setExpandedRowKeys] = useState<Record<string, boolean>>({});
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [onlyActive, setOnlyActive] = useState<boolean>(true);

  const toggleRow = (key: string) => {
    setExpandedRowKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const getHeatmapClass = (hours: number) => {
    if (!hours || hours <= 0) return 'text-[var(--md-sys-color-on-surface-variant)]/20';
    if (hours < 4) return 'bg-[var(--md-sys-color-primary-container)]/30 text-[var(--md-sys-color-primary)] font-bold';
    if (hours <= 8) return 'bg-[var(--md-sys-color-primary-container)]/70 text-[var(--md-sys-color-on-primary-container)] font-extrabold';
    return 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-black';
  };

  const getDayDetails = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });
    const dayNum = d.getDate();
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const isToday = dateStr === todayStr;
    return { dayName, dayNum, isWeekend, isToday };
  };

  // Grouping by Issue transformation (Unconditionally called hook)
  const issueGroupingData = useMemo(() => {
    if (!matrix || !matrix.members || groupBy !== 'issue') return [];

    const issueMap: Record<
      string,
      {
        issueId: number;
        issueKey: string;
        issueTitle: string;
        totalHours: number;
        dailyHours: Record<string, number>;
        members: Record<
          number,
          {
            userId: number;
            fullName: string;
            avatarUrl: string | null;
            dailyHours: Record<string, number>;
            totalHours: number;
            worklogs: WorklogCellEntry[];
          }
        >;
      }
    > = {};

    matrix.members.forEach((member) => {
      if (!member.dailyWorklogs) return;

      Object.entries(member.dailyWorklogs).forEach(([day, logs]) => {
        logs.forEach((log) => {
          const key = log.issueKey || `ISSUE-${log.issueId || 'UNKNOWN'}`;
          if (!issueMap[key]) {
            issueMap[key] = {
              issueId: log.issueId || 0,
              issueKey: key,
              issueTitle: log.issueTitle || key,
              totalHours: 0,
              dailyHours: {},
              members: {},
            };
          }

          issueMap[key].totalHours += log.timeSpentHours;
          issueMap[key].dailyHours[day] = (issueMap[key].dailyHours[day] || 0) + log.timeSpentHours;

          if (!issueMap[key].members[member.userId]) {
            issueMap[key].members[member.userId] = {
              userId: member.userId,
              fullName: member.fullName,
              avatarUrl: member.avatarUrl,
              dailyHours: {},
              totalHours: 0,
              worklogs: [],
            };
          }

          issueMap[key].members[member.userId].totalHours += log.timeSpentHours;
          issueMap[key].members[member.userId].dailyHours[day] =
            (issueMap[key].members[member.userId].dailyHours[day] || 0) + log.timeSpentHours;
          issueMap[key].members[member.userId].worklogs.push({
            id: log.id,
            issueId: log.issueId,
            issueKey: log.issueKey,
            issueTitle: log.issueTitle,
            timeSpentHours: log.timeSpentHours,
            description: log.description,
            dateLogged: day,
            user: {
              id: member.userId,
              fullName: member.fullName,
              avatarUrl: member.avatarUrl,
            },
          });
        });
      });
    });

    return Object.values(issueMap).sort((a, b) => b.totalHours - a.totalHours);
  }, [matrix, groupBy]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    if (!matrix || !matrix.members) return [];
    let list = [...matrix.members];

    if (onlyActive) {
      list = list.filter((m) => (m.totalPeriodHours || 0) > 0);
    }

    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.fullName.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q)
      );
    }

    return list;
  }, [matrix, onlyActive, filterQuery]);

  // Filtered issues list (for groupBy === 'issue')
  const filteredIssues = useMemo(() => {
    let list = [...issueGroupingData];

    if (onlyActive) {
      list = list.filter((item) => (item.totalHours || 0) > 0);
    }

    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.issueKey.toLowerCase().includes(q) ||
          item.issueTitle.toLowerCase().includes(q)
      );
    }

    return list;
  }, [issueGroupingData, onlyActive, filterQuery]);

  // Helper for computing individual member issues (Regular function, not hook)
  const computeMemberIssues = (member: TeamTimesheetMatrix['members'][number]) => {
    if (!member.dailyWorklogs) return [];
    const issueSubMap: Record<
      string,
      {
        issueId: number;
        issueKey: string;
        issueTitle: string;
        totalHours: number;
        dailyHours: Record<string, number>;
        worklogs: WorklogCellEntry[];
      }
    > = {};

    Object.entries(member.dailyWorklogs).forEach(([day, logs]) => {
      logs.forEach((log) => {
        const key = log.issueKey || `ISSUE-${log.issueId || 'UNKNOWN'}`;
        if (!issueSubMap[key]) {
          issueSubMap[key] = {
            issueId: log.issueId || 0,
            issueKey: key,
            issueTitle: log.issueTitle || key,
            totalHours: 0,
            dailyHours: {},
            worklogs: [],
          };
        }
        issueSubMap[key].totalHours += log.timeSpentHours;
        issueSubMap[key].dailyHours[day] =
          (issueSubMap[key].dailyHours[day] || 0) + log.timeSpentHours;
        issueSubMap[key].worklogs.push({
          id: log.id,
          issueId: log.issueId,
          issueKey: log.issueKey,
          issueTitle: log.issueTitle,
          timeSpentHours: log.timeSpentHours,
          description: log.description,
          dateLogged: day,
          user: {
            id: member.userId,
            fullName: member.fullName,
            avatarUrl: member.avatarUrl,
          },
        });
      });
    });

    return Object.values(issueSubMap).sort((a, b) => b.totalHours - a.totalHours);
  };

  // Render Empty Fallback safely after all hooks
  if (!matrix || !matrix.days || matrix.days.length === 0) {
    return (
      <div className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/40 rounded-2xl p-12 text-center w-full">
        <Clock className="w-10 h-10 text-[var(--md-sys-color-on-surface-variant)] mx-auto mb-2 opacity-50" />
        <h3 className="text-base font-semibold text-[var(--md-sys-color-on-surface)]">
          No timesheet matrix data
        </h3>
        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">
          No worklogs were recorded in this date range. Click "Log Work" to record your hours.
        </p>
      </div>
    );
  }

  const activeCount = matrix.members.filter((m) => (m.totalPeriodHours || 0) > 0).length;

  return (
    <div className="space-y-3">
      {/* Matrix Controls Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-1">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)] pointer-events-none" />
            <input
              type="text"
              placeholder={groupBy === 'user' ? 'Filter members...' : 'Filter tickets...'}
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full text-xs pl-8.5 pr-3 py-1.5 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/50 text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)]/60 focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Active Members Only Toggle */}
          <button
            type="button"
            onClick={() => setOnlyActive((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
              onlyActive
                ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border-[var(--md-sys-color-primary)]/30 shadow-2xs'
                : 'bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface-variant)] border-[var(--md-sys-color-outline-variant)]/40 hover:bg-[var(--md-sys-color-surface-container)]'
            }`}
          >
            {onlyActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>
              {onlyActive
                ? `Active Only (${activeCount})`
                : `Showing All (${matrix.members.length})`}
            </span>
          </button>
        </div>
      </div>

      {/* Main Matrix Table */}
      <div className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/40 rounded-2xl shadow-xs overflow-hidden flex flex-col w-full">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--md-sys-color-outline-variant)]/40 bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] select-none">
                {/* Sticky Left Column */}
                <th className="py-3 px-4 font-bold sticky left-0 z-10 bg-[var(--md-sys-color-surface-container)] min-w-[240px] max-w-[280px] shadow-[2px_0_4px_rgba(0,0,0,0.06)]">
                  <span>{groupBy === 'user' ? 'Team Member' : 'Issue / Ticket'}</span>
                </th>

                {/* Day Columns */}
                {matrix.days.map((day) => {
                  const { dayName, dayNum, isWeekend, isToday } = getDayDetails(day);
                  return (
                    <th
                      key={day}
                      className={`py-2 px-1 text-center font-semibold min-w-[50px] max-w-[62px] border-l border-[var(--md-sys-color-outline-variant)]/20 ${
                        isWeekend ? 'bg-[var(--md-sys-color-surface-container-high)]/30' : ''
                      } ${isToday ? 'bg-[var(--md-sys-color-primary-container)]/30 text-[var(--md-sys-color-primary)] font-bold' : ''}`}
                    >
                      <div className="text-[10px] uppercase opacity-70 tracking-wider">
                        {dayName}
                      </div>
                      <div className="text-xs font-bold mt-0.5">{dayNum}</div>
                    </th>
                  );
                })}

                {/* Total Column Header */}
                <th className="py-3 px-4 text-center font-bold min-w-[70px] bg-[var(--md-sys-color-surface-container-high)]/50 text-[var(--md-sys-color-primary)] border-l border-[var(--md-sys-color-outline-variant)]/40">
                  Total
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]/20">
              {groupBy === 'user' ? (
                /* Group By Team Member */
                filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={matrix.days.length + 2} className="p-8 text-center text-xs text-[var(--md-sys-color-on-surface-variant)]">
                      No team members match the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => {
                    const isExpanded = !!expandedRowKeys[`user_${member.userId}`];
                    const memberIssues = computeMemberIssues(member);

                    return (
                      <React.Fragment key={member.userId}>
                        {/* Primary Member Row */}
                        <tr className="hover:bg-[var(--md-sys-color-surface-container-high)]/40 transition">
                          {/* Member Info Sticky Column */}
                          <td className="py-2.5 px-4 sticky left-0 z-10 bg-[var(--md-sys-color-surface-container-low)] shadow-[2px_0_4px_rgba(0,0,0,0.04)]">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => toggleRow(`user_${member.userId}`)}
                                className="p-1 rounded-md text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition cursor-pointer"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <Avatar
                                name={member.fullName || 'User'}
                                avatarUrl={member.avatarUrl}
                                size="xs"
                              />
                              <div className="flex flex-col min-w-0">
                                <span className="font-bold text-xs text-[var(--md-sys-color-on-surface)] truncate">
                                  {member.fullName}
                                </span>
                                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] truncate">
                                  {member.systemRole || member.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Day Hour Cells */}
                          {matrix.days.map((day) => {
                            const hours = member.dailyHours[day] || 0;
                            const { isWeekend, isToday } = getDayDetails(day);
                            const cellLogs: WorklogCellEntry[] = (
                              member.dailyWorklogs?.[day] || []
                            ).map((l) => ({
                              id: l.id,
                              issueId: l.issueId,
                              issueKey: l.issueKey,
                              issueTitle: l.issueTitle,
                              timeSpentHours: l.timeSpentHours,
                              description: l.description,
                              dateLogged: day,
                              user: {
                                id: member.userId,
                                fullName: member.fullName,
                                avatarUrl: member.avatarUrl,
                              },
                            }));

                            const cellNode = (
                              <div
                                className={`py-1 px-1.5 rounded-lg text-xs transition ${getHeatmapClass(hours)} hover:ring-2 hover:ring-[var(--md-sys-color-primary)]/50`}
                              >
                                {hours > 0 ? `${hours.toFixed(1)}h` : '—'}
                              </div>
                            );

                            return (
                              <td
                                key={day}
                                onClick={() => {
                                  if (hours > 0) {
                                    onSelectCell({
                                      title: `${member.fullName}'s Worklogs`,
                                      subtitle: day,
                                      date: day,
                                      totalHours: hours,
                                      worklogs: cellLogs,
                                      targetUserId: member.userId,
                                    });
                                  } else {
                                    onQuickLogForCell(undefined, member.userId, day);
                                  }
                                }}
                                className={`py-2 px-1 text-center cursor-pointer transition select-none ${
                                  isWeekend ? 'bg-[var(--md-sys-color-surface-container-high)]/20' : ''
                                } ${isToday ? 'bg-[var(--md-sys-color-primary-container)]/15' : ''}`}
                              >
                                {hours > 0 ? (
                                  <Tooltip
                                    delayDuration={100}
                                    className="p-0 border-0 bg-transparent shadow-none"
                                    content={
                                      <WorklogCellTooltipContent
                                        userName={member.fullName}
                                        userAvatar={member.avatarUrl}
                                        dateStr={day}
                                        totalHours={hours}
                                        worklogs={cellLogs}
                                      />
                                    }
                                  >
                                    {cellNode}
                                  </Tooltip>
                                ) : (
                                  cellNode
                                )}
                              </td>
                            );
                          })}

                          {/* Member Total Column */}
                          <td className="py-2.5 px-4 text-center font-bold text-xs bg-[var(--md-sys-color-surface-container-high)]/40 text-[var(--md-sys-color-primary)]">
                            {member.totalPeriodHours.toFixed(1)}h
                          </td>
                        </tr>

                        {/* Sub-rows: Individual issues logged by this member */}
                        {isExpanded &&
                          memberIssues.map((subIssue) => (
                            <tr
                              key={`${member.userId}_${subIssue.issueKey}`}
                              className="bg-[var(--md-sys-color-surface-container)]/40 hover:bg-[var(--md-sys-color-surface-container)] transition text-[11px]"
                            >
                              {/* Issue Info Sub-column */}
                              <td className="py-1.5 pl-9 pr-4 sticky left-0 z-10 bg-[var(--md-sys-color-surface-container)]/90 shadow-[2px_0_4px_rgba(0,0,0,0.04)]">
                                <div className="flex items-center gap-2">
                                  <Link
                                    to={`/issues/${subIssue.issueKey}`}
                                    className="font-mono font-bold text-[10px] text-[var(--md-sys-color-primary)] hover:underline shrink-0"
                                  >
                                    {subIssue.issueKey}
                                  </Link>
                                  <span className="truncate text-[var(--md-sys-color-on-surface)] text-[11px]">
                                    {subIssue.issueTitle}
                                  </span>
                                </div>
                              </td>

                              {/* Issue Day Cells */}
                              {matrix.days.map((day) => {
                                const subHours = subIssue.dailyHours[day] || 0;
                                const subCellLogs = subIssue.worklogs.filter(
                                  (l) => l.dateLogged === day,
                                );

                                const subCellNode = (
                                  <span
                                    className={`py-0.5 px-1 rounded text-[11px] ${
                                      subHours > 0
                                        ? 'font-bold text-[var(--md-sys-color-on-surface)] bg-[var(--md-sys-color-surface-container-highest)]'
                                        : 'text-[var(--md-sys-color-on-surface-variant)]/20'
                                    }`}
                                  >
                                    {subHours > 0 ? `${subHours.toFixed(1)}h` : '—'}
                                  </span>
                                );

                                return (
                                  <td
                                    key={day}
                                    onClick={() => {
                                      if (subHours > 0) {
                                        onSelectCell({
                                          title: `${member.fullName} on ${subIssue.issueKey}`,
                                          subtitle: day,
                                          date: day,
                                          totalHours: subHours,
                                          worklogs: subCellLogs,
                                          targetIssueId: subIssue.issueId,
                                          targetUserId: member.userId,
                                        });
                                      } else {
                                        onQuickLogForCell(subIssue.issueId, member.userId, day);
                                      }
                                    }}
                                    className="py-1 px-1 text-center cursor-pointer select-none"
                                  >
                                    {subHours > 0 ? (
                                      <Tooltip
                                        delayDuration={100}
                                        className="p-0 border-0 bg-transparent shadow-none"
                                        content={
                                          <WorklogCellTooltipContent
                                            userName={member.fullName}
                                            userAvatar={member.avatarUrl}
                                            dateStr={day}
                                            totalHours={subHours}
                                            worklogs={subCellLogs}
                                          />
                                        }
                                      >
                                        {subCellNode}
                                      </Tooltip>
                                    ) : (
                                      subCellNode
                                    )}
                                  </td>
                                );
                              })}

                              {/* Issue Total Sub-column */}
                              <td className="py-1.5 px-4 text-center font-semibold text-[11px] text-[var(--md-sys-color-on-surface)] bg-[var(--md-sys-color-surface-container-high)]/20">
                                {subIssue.totalHours.toFixed(1)}h
                              </td>
                            </tr>
                          ))}
                      </React.Fragment>
                    );
                  })
                )
              ) : (
                /* Group By Issue */
                filteredIssues.length === 0 ? (
                  <tr>
                    <td colSpan={matrix.days.length + 2} className="p-8 text-center text-xs text-[var(--md-sys-color-on-surface-variant)]">
                      No issues match the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredIssues.map((issueItem) => {
                    const isExpanded = !!expandedRowKeys[`issue_${issueItem.issueKey}`];
                    const memberList = Object.values(issueItem.members).sort(
                      (a, b) => b.totalHours - a.totalHours,
                    );

                    return (
                      <React.Fragment key={issueItem.issueKey}>
                        {/* Primary Issue Row */}
                        <tr className="hover:bg-[var(--md-sys-color-surface-container-high)]/40 transition">
                          <td className="py-2.5 px-4 sticky left-0 z-10 bg-[var(--md-sys-color-surface-container-low)] shadow-[2px_0_4px_rgba(0,0,0,0.04)]">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => toggleRow(`issue_${issueItem.issueKey}`)}
                                className="p-1 rounded-md text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition cursor-pointer"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <Link
                                to={`/issues/${issueItem.issueKey}`}
                                className="font-mono font-bold text-xs text-[var(--md-sys-color-primary)] hover:underline shrink-0"
                              >
                                {issueItem.issueKey}
                              </Link>
                              <span className="font-semibold text-xs text-[var(--md-sys-color-on-surface)] truncate">
                                {issueItem.issueTitle}
                              </span>
                            </div>
                          </td>

                          {/* Issue Day Cells */}
                          {matrix.days.map((day) => {
                            const hours = issueItem.dailyHours[day] || 0;
                            const { isWeekend, isToday } = getDayDetails(day);
                            const cellLogs = Object.values(issueItem.members).flatMap((m) =>
                              m.worklogs.filter((l) => l.dateLogged === day),
                            );

                            const cellNode = (
                              <div
                                className={`py-1 px-1.5 rounded-lg text-xs transition ${getHeatmapClass(hours)} hover:ring-2 hover:ring-[var(--md-sys-color-primary)]/50`}
                              >
                                {hours > 0 ? `${hours.toFixed(1)}h` : '—'}
                              </div>
                            );

                            return (
                              <td
                                key={day}
                                onClick={() => {
                                  if (hours > 0) {
                                    onSelectCell({
                                      title: `Worklogs on ${issueItem.issueKey}`,
                                      subtitle: day,
                                      date: day,
                                      totalHours: hours,
                                      worklogs: cellLogs,
                                      targetIssueId: issueItem.issueId,
                                    });
                                  } else {
                                    onQuickLogForCell(issueItem.issueId, undefined, day);
                                  }
                                }}
                                className={`py-2 px-1 text-center cursor-pointer transition select-none ${
                                  isWeekend ? 'bg-[var(--md-sys-color-surface-container-high)]/20' : ''
                                } ${isToday ? 'bg-[var(--md-sys-color-primary-container)]/15' : ''}`}
                              >
                                {hours > 0 ? (
                                  <Tooltip
                                    delayDuration={100}
                                    className="p-0 border-0 bg-transparent shadow-none"
                                    content={
                                      <WorklogCellTooltipContent
                                        title={issueItem.issueTitle ? `${issueItem.issueKey} — ${issueItem.issueTitle}` : issueItem.issueKey}
                                        dateStr={day}
                                        totalHours={hours}
                                        worklogs={cellLogs}
                                      />
                                    }
                                  >
                                    {cellNode}
                                  </Tooltip>
                                ) : (
                                  cellNode
                                )}
                              </td>
                            );
                          })}

                          {/* Issue Total Column */}
                          <td className="py-2.5 px-4 text-center font-bold text-xs bg-[var(--md-sys-color-surface-container-high)]/40 text-[var(--md-sys-color-primary)]">
                            {issueItem.totalHours.toFixed(1)}h
                          </td>
                        </tr>

                        {/* Sub-rows: Members who logged on this issue */}
                        {isExpanded &&
                          memberList.map((m) => (
                            <tr
                              key={`${issueItem.issueKey}_${m.userId}`}
                              className="bg-[var(--md-sys-color-surface-container)]/40 hover:bg-[var(--md-sys-color-surface-container)] transition text-[11px]"
                            >
                              <td className="py-1.5 pl-9 pr-4 sticky left-0 z-10 bg-[var(--md-sys-color-surface-container)]/90 shadow-[2px_0_4px_rgba(0,0,0,0.04)]">
                                <div className="flex items-center gap-2">
                                  <Avatar name={m.fullName || 'User'} avatarUrl={m.avatarUrl} size="xs" />
                                  <span className="font-medium text-xs text-[var(--md-sys-color-on-surface)] truncate">
                                    {m.fullName}
                                  </span>
                                </div>
                              </td>

                              {matrix.days.map((day) => {
                                const subHours = m.dailyHours[day] || 0;
                                const subCellLogs = m.worklogs.filter((l) => l.dateLogged === day);

                                const subCellNode = (
                                  <span
                                    className={`py-0.5 px-1 rounded text-[11px] ${
                                      subHours > 0
                                        ? 'font-bold text-[var(--md-sys-color-on-surface)] bg-[var(--md-sys-color-surface-container-highest)]'
                                        : 'text-[var(--md-sys-color-on-surface-variant)]/20'
                                    }`}
                                  >
                                    {subHours > 0 ? `${subHours.toFixed(1)}h` : '—'}
                                  </span>
                                );

                                return (
                                  <td
                                    key={day}
                                    onClick={() => {
                                      if (subHours > 0) {
                                        onSelectCell({
                                          title: `${m.fullName} on ${issueItem.issueKey}`,
                                          subtitle: day,
                                          date: day,
                                          totalHours: subHours,
                                          worklogs: subCellLogs,
                                          targetIssueId: issueItem.issueId,
                                          targetUserId: m.userId,
                                        });
                                      } else {
                                        onQuickLogForCell(issueItem.issueId, m.userId, day);
                                      }
                                    }}
                                    className="py-1 px-1 text-center cursor-pointer select-none"
                                  >
                                    {subHours > 0 ? (
                                      <Tooltip
                                        delayDuration={100}
                                        className="p-0 border-0 bg-transparent shadow-none"
                                        content={
                                          <WorklogCellTooltipContent
                                            userName={m.fullName}
                                            userAvatar={m.avatarUrl}
                                            dateStr={day}
                                            totalHours={subHours}
                                            worklogs={subCellLogs}
                                          />
                                        }
                                      >
                                        {subCellNode}
                                      </Tooltip>
                                    ) : (
                                      subCellNode
                                    )}
                                  </td>
                                );
                              })}

                              <td className="py-1.5 px-4 text-center font-semibold text-[11px] text-[var(--md-sys-color-on-surface)] bg-[var(--md-sys-color-surface-container-high)]/20">
                                {m.totalHours.toFixed(1)}h
                              </td>
                            </tr>
                          ))}
                      </React.Fragment>
                    );
                  })
                )
              )}
            </tbody>

            {/* Table Footer: Daily Totals & Grand Total */}
            <tfoot>
              <tr className="border-t-2 border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] font-bold text-xs select-none">
                <td className="py-3 px-4 sticky left-0 z-10 bg-[var(--md-sys-color-surface-container)] shadow-[2px_0_4px_rgba(0,0,0,0.06)] text-[var(--md-sys-color-on-surface)]">
                  Daily Totals
                </td>
                {matrix.days.map((day) => {
                  const total = matrix.dailyTotals[day] || 0;
                  return (
                    <td
                      key={day}
                      className="py-3 px-1 text-center border-l border-[var(--md-sys-color-outline-variant)]/20 text-[var(--md-sys-color-on-surface)]"
                    >
                      {total > 0 ? (
                        <span className="font-bold text-[var(--md-sys-color-primary)]">
                          {total.toFixed(1)}h
                        </span>
                      ) : (
                        <span className="text-[var(--md-sys-color-on-surface-variant)]/40 font-normal">
                          —
                        </span>
                      )}
                    </td>
                  );
                })}
                <td className="py-3 px-4 text-center font-black text-sm bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border-l border-[var(--md-sys-color-outline-variant)]/40">
                  {matrix.grandTotal.toFixed(1)}h
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
