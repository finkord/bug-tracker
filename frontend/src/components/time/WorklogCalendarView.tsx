import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { TeamTimesheetMatrix, IssueItem } from '../../api/client';
import type { WorklogCellEntry } from '../../types/timeTracking';
import { Avatar } from '../common/Avatar';
import { Badge, Tooltip } from '../ui';
import { WorklogCellTooltipContent } from './WorklogCellTooltip';
import {
  Calendar as CalendarIcon,
  Clock,
  PlusCircle,
  ExternalLink,
} from 'lucide-react';

interface WorklogCalendarViewProps {
  matrix: TeamTimesheetMatrix | null;
  issues?: IssueItem[];
  selectedDateStr: string;
  onSelectDateStr: (dateStr: string) => void;
  onOpenLogWorkForDate: (dateStr: string) => void;
}

export const WorklogCalendarView: React.FC<WorklogCalendarViewProps> = ({
  matrix,
  selectedDateStr,
  onSelectDateStr,
  onOpenLogWorkForDate,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Map of date string -> WorklogCellEntry[]
  const dateWorklogsMap = useMemo(() => {
    const map: Record<string, WorklogCellEntry[]> = {};
    if (!matrix || !matrix.members) return map;

    matrix.members.forEach((member) => {
      if (!member.dailyWorklogs) return;
      Object.entries(member.dailyWorklogs).forEach(([day, logs]) => {
        if (!map[day]) map[day] = [];
        logs.forEach((l) => {
          map[day].push({
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
          });
        });
      });
    });

    return map;
  }, [matrix]);

  // Selected date worklogs
  const selectedDayLogs: WorklogCellEntry[] = useMemo(() => {
    return dateWorklogsMap[selectedDateStr] || [];
  }, [dateWorklogsMap, selectedDateStr]);

  // Calendar cells computation (leading offset + days + trailing offset)
  const calendarCells = useMemo(() => {
    if (!matrix || !matrix.days || matrix.days.length === 0) return [];

    const firstDayStr = matrix.days[0];
    const firstDate = new Date(firstDayStr + 'T00:00:00');
    // In JS: Sunday is 0, Monday is 1 ... Saturday is 6
    // We want Monday = 0, Tuesday = 1 ... Sunday = 6
    const startDayOfWeek = (firstDate.getDay() + 6) % 7;

    const cells: Array<{
      type: 'padding' | 'day';
      dateStr?: string;
      dayNum?: number;
      isWeekend?: boolean;
      isToday?: boolean;
      isSelected?: boolean;
      hours?: number;
      worklogs?: WorklogCellEntry[];
    }> = [];

    // Add leading empty cells
    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push({ type: 'padding' });
    }

    // Add actual days
    matrix.days.forEach((day) => {
      const d = new Date(day + 'T00:00:00');
      const dayNum = d.getDate();
      const hours = matrix.dailyTotals[day] || 0;
      const isToday = day === todayStr;
      const isSelected = day === selectedDateStr;
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const worklogs = dateWorklogsMap[day] || [];

      cells.push({
        type: 'day',
        dateStr: day,
        dayNum,
        isWeekend,
        isToday,
        isSelected,
        hours,
        worklogs,
      });
    });

    // Add trailing padding cells to complete final row
    const remainder = cells.length % 7;
    if (remainder > 0) {
      const trailingCount = 7 - remainder;
      for (let i = 0; i < trailingCount; i++) {
        cells.push({ type: 'padding' });
      }
    }

    return cells;
  }, [matrix, todayStr, selectedDateStr, dateWorklogsMap]);

  if (!matrix || !matrix.days || matrix.days.length === 0) {
    return (
      <div className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/40 rounded-2xl p-12 text-center w-full">
        <CalendarIcon className="w-10 h-10 text-[var(--md-sys-color-on-surface-variant)] mx-auto mb-2 opacity-50" />
        <h3 className="text-base font-semibold text-[var(--md-sys-color-on-surface)]">
          No calendar data available
        </h3>
        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">
          No worklogs were recorded in this range.
        </p>
      </div>
    );
  }

  const selectedDayTotal = matrix.dailyTotals[selectedDateStr] || 0;

  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full">
      {/* Calendar Grid Container */}
      <div className="flex-1 bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/40 rounded-2xl p-4 shadow-xs flex flex-col">
        <div className="grid grid-cols-7 gap-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayHeader) => (
            <div
              key={dayHeader}
              className="text-center text-[10px] uppercase font-bold text-[var(--md-sys-color-on-surface-variant)] pb-1"
            >
              {dayHeader}
            </div>
          ))}

          {calendarCells.map((cell, idx) => {
            if (cell.type === 'padding' || !cell.dateStr) {
              return (
                <div
                  key={`pad_${idx}`}
                  className="min-h-[80px] sm:min-h-[96px] rounded-xl border border-transparent bg-[var(--md-sys-color-surface-container-lowest)]/40 opacity-30 select-none"
                />
              );
            }

            const {
              dateStr,
              dayNum,
              isWeekend,
              isToday,
              isSelected,
              hours = 0,
              worklogs = [],
            } = cell;

            const dayCellNode = (
              <div
                onClick={() => onSelectDateStr(dateStr)}
                className={`min-h-[80px] sm:min-h-[96px] p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
                  isSelected
                    ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/30 ring-2 ring-[var(--md-sys-color-primary)]/40 shadow-xs'
                    : isToday
                      ? 'border-[var(--md-sys-color-primary)]/60 bg-[var(--md-sys-color-surface-container)] hover:border-[var(--md-sys-color-primary)]'
                      : isWeekend
                        ? 'border-[var(--md-sys-color-outline-variant)]/30 bg-[var(--md-sys-color-surface-container-high)]/20 hover:border-[var(--md-sys-color-outline)]'
                        : 'border-[var(--md-sys-color-outline-variant)]/40 bg-[var(--md-sys-color-surface)] hover:border-[var(--md-sys-color-outline)] hover:shadow-xs'
                }`}
              >
                {/* Cell Top Header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold transition-transform group-hover:scale-105 ${
                      isToday
                        ? 'w-5 h-5 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] flex items-center justify-center text-[11px]'
                        : isSelected
                          ? 'text-[var(--md-sys-color-primary)] font-black'
                          : 'text-[var(--md-sys-color-on-surface)]'
                    }`}
                  >
                    {dayNum}
                  </span>
                  {isToday && (
                    <span className="text-[9px] font-black uppercase tracking-wider text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)] px-1.5 py-0.2 rounded">
                      Today
                    </span>
                  )}
                </div>

                {/* Ticket miniature chips */}
                <div className="my-1 space-y-1 overflow-hidden">
                  {worklogs.slice(0, 2).map((wl, i) => (
                    <div
                      key={wl.id || i}
                      className="px-1.5 py-0.5 rounded bg-[var(--md-sys-color-primary-container)]/50 text-[var(--md-sys-color-on-primary-container)] text-[10px] font-bold truncate flex items-center justify-between gap-1"
                    >
                      <span className="truncate">{wl.issueKey || 'Log'}</span>
                      <span className="text-[9px] font-semibold shrink-0 opacity-80">
                        {wl.timeSpentHours}h
                      </span>
                    </div>
                  ))}
                  {worklogs.length > 2 && (
                    <div className="text-[9px] font-bold text-[var(--md-sys-color-primary)] text-right pr-0.5">
                      +{worklogs.length - 2} more
                    </div>
                  )}
                </div>

                {/* Bottom Total Hour Badge */}
                <div className="flex items-center justify-end">
                  {hours > 0 ? (
                    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] text-[10px] font-black shadow-2xs">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{hours.toFixed(1)}h</span>
                    </div>
                  ) : (
                    <span className="h-4" />
                  )}
                </div>
              </div>
            );

            // Wrap with rich tooltip when hours are logged
            if (hours > 0) {
              return (
                <Tooltip
                  key={dateStr}
                  delayDuration={100}
                  className="p-0 border-0 bg-transparent shadow-none"
                  content={
                    <WorklogCellTooltipContent
                      title={`Logged Effort on ${dateStr}`}
                      dateStr={dateStr}
                      totalHours={hours}
                      worklogs={worklogs}
                    />
                  }
                >
                  {dayCellNode}
                </Tooltip>
              );
            }

            return <React.Fragment key={dateStr}>{dayCellNode}</React.Fragment>;
          })}
        </div>
      </div>

      {/* Selected Day Worklog Details Panel */}
      <div className="w-full lg:w-[380px] bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/40 rounded-2xl p-4 shadow-xs flex flex-col space-y-4">
        {/* Header with Date and Quick Log Button */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--md-sys-color-outline-variant)]/40">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </h3>
              <Badge variant="primary" size="sm">
                {selectedDayTotal.toFixed(1)}h
              </Badge>
            </div>
            <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
              {selectedDayLogs.length} logged records
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenLogWorkForDate(selectedDateStr)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-semibold hover:opacity-90 transition cursor-pointer shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Log Work</span>
          </button>
        </div>

        {/* List of Worklog Items on Selected Day */}
        <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[520px] pr-1">
          {selectedDayLogs.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-[var(--md-sys-color-surface-container)]/40 border border-dashed border-[var(--md-sys-color-outline-variant)]">
              <Clock className="w-8 h-8 text-[var(--md-sys-color-on-surface-variant)]/40 mx-auto mb-2" />
              <p className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">
                No work hours logged on this day
              </p>
              <button
                type="button"
                onClick={() => onOpenLogWorkForDate(selectedDateStr)}
                className="mt-2 text-xs text-[var(--md-sys-color-primary)] font-bold hover:underline cursor-pointer"
              >
                + Log work effort now
              </button>
            </div>
          ) : (
            selectedDayLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]/60 hover:border-[var(--md-sys-color-outline)] transition space-y-2.5 shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Link
                      to={`/issues/${log.issueKey}`}
                      className="px-2 py-0.5 rounded-md font-mono font-bold text-[11px] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] hover:bg-[var(--md-sys-color-primary)] hover:text-[var(--md-sys-color-on-primary)] transition shrink-0"
                    >
                      {log.issueKey}
                    </Link>
                    <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface)] truncate">
                      {log.issueTitle}
                    </span>
                  </div>
                  <span className="text-xs font-black text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/40 px-2 py-0.5 rounded-full shrink-0">
                    {log.timeSpentHours}h
                  </span>
                </div>

                {log.description && (
                  <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] bg-[var(--md-sys-color-surface-container-low)] p-2.5 rounded-lg border border-[var(--md-sys-color-outline-variant)]/30 italic">
                    "{log.description}"
                  </p>
                )}

                <div className="flex items-center justify-between pt-1 text-[11px] text-[var(--md-sys-color-on-surface-variant)] border-t border-[var(--md-sys-color-outline-variant)]/30">
                  {log.user && (
                    <div className="flex items-center gap-1.5">
                      <Avatar name={log.user.fullName || 'User'} avatarUrl={log.user.avatarUrl} size="xs" />
                      <span className="font-medium text-xs text-[var(--md-sys-color-on-surface)]">
                        {log.user.fullName}
                      </span>
                    </div>
                  )}
                  {log.issueKey && (
                    <Link
                      to={`/issues/${log.issueKey}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--md-sys-color-primary)] hover:underline ml-auto"
                    >
                      <span>Open Issue</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
