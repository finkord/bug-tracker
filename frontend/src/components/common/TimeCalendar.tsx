import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  Calendar as CalendarIcon,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export interface DayWorklog {
  id: number;
  timeSpentHours: number;
  dateLogged: string;
  description: string | null;
  issue?: {
    id: number;
    key: string;
    title: string;
    status: string;
    projectName?: string;
  } | null;
  user?: {
    id: number;
    fullName: string;
    avatarUrl: string | null;
  } | null;
}

interface TimeCalendarProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  dailyHours: Record<string, number>; // "YYYY-MM-DD" -> hours
  worklogs?: DayWorklog[];
  title?: string;
  subtitle?: string;
  isTeamView?: boolean;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const TimeCalendar: React.FC<TimeCalendarProps> = ({
  currentDate,
  onDateChange,
  dailyHours,
  worklogs = [],
  title = 'Worklog Calendar',
  subtitle = 'Track and review daily time logs across the month',
  isTeamView = false,
}) => {
  const [selectedDayStr, setSelectedDayStr] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Month navigation
  const prevMonth = () => {
    onDateChange(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    onDateChange(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    onDateChange(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDayStr(today.toISOString().split('T')[0]);
  };

  // Calendar math
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const totalDays = lastDayOfMonth.getDate();

  // Day of week for first day (0 = Sun, 1 = Mon ... 6 = Sat)
  let startDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startDayOfWeek === -1) startDayOfWeek = 6; // Sunday is 6th in Monday-based index

  const todayStr = new Date().toISOString().split('T')[0];

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // Logs for currently selected day
  const selectedDayLogs = worklogs.filter((w) => w.dateLogged === selectedDayStr);
  const selectedDayHours = dailyHours[selectedDayStr] || 0;

  // Monthly stats
  const monthlyTotalHours = Object.entries(dailyHours).reduce((acc, [date, hours]) => {
    if (date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)) {
      return acc + hours;
    }
    return acc;
  }, 0);

  const activeDaysCount = Object.entries(dailyHours).filter(([date, hours]) => {
    return date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`) && hours > 0;
  }).length;

  return (
    <div className="space-y-6">
      {/* Calendar Card */}
      <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl shadow-sm p-4 sm:p-6 space-y-4">
        {/* Calendar Header Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--md-sys-color-outline-variant)] pb-4">
          <div>
            <h3 className="text-base font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
              <span>{title}</span>
            </h3>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
              {subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goToToday}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)] transition-colors cursor-pointer"
            >
              Today
            </button>

            <div className="flex items-center gap-1 bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-xl p-1">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1 rounded-lg hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
                title="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-bold px-3 min-w-[130px] text-center text-[var(--md-sys-color-on-surface)]">
                {monthNames[month]} {year}
              </span>

              <button
                type="button"
                onClick={nextMonth}
                className="p-1 rounded-lg hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
                title="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Monthly Summary Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]">
            <span className="text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)]">Month Logged</span>
            <p className="text-base font-bold text-[var(--md-sys-color-primary)]">
              {monthlyTotalHours.toFixed(1)}h
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]">
            <span className="text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)]">Active Days</span>
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
              {activeDaysCount} days
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]">
            <span className="text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)]">Daily Average</span>
            <p className="text-base font-bold text-blue-600 dark:text-blue-400">
              {activeDaysCount > 0 ? (monthlyTotalHours / activeDaysCount).toFixed(1) : 0}h / day
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]">
            <span className="text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)]">Selected Day</span>
            <p className="text-base font-bold text-amber-600 dark:text-amber-400">
              {selectedDayHours.toFixed(1)}h
            </p>
          </div>
        </div>

        {/* 7-column Calendar Grid */}
        <div className="pt-2">
          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-[var(--md-sys-color-on-surface)] mb-2">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {/* Blank leading days */}
            {Array.from({ length: startDayOfWeek }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="h-16 sm:h-20 rounded-xl bg-[var(--md-sys-color-surface-container-low)]/30 border border-transparent opacity-30 pointer-events-none"
              />
            ))}

            {/* Month Day Cells */}
            {Array.from({ length: totalDays }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const hours = dailyHours[dateStr] || 0;
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDayStr;

              // High-contrast color coding for light and dark themes using M3 tokens
              let hoursBadgeClass = 'text-transparent';
              if (hours > 0 && hours < 4) {
                hoursBadgeClass = 'bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)] font-bold border border-[var(--md-sys-color-success)]/25 shadow-2xs';
              } else if (hours >= 4 && hours < 8) {
                hoursBadgeClass = 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-extrabold border border-[var(--md-sys-color-primary)]/25 shadow-2xs';
              } else if (hours >= 8) {
                hoursBadgeClass = 'bg-[var(--md-sys-color-warning-container)] text-[var(--md-sys-color-on-warning-container)] font-extrabold border border-[var(--md-sys-color-warning)]/25 shadow-2xs';
              }

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => setSelectedDayStr(dateStr)}
                  className={`h-16 sm:h-20 p-2 rounded-xl flex flex-col justify-between text-left transition-all border cursor-pointer ${
                    isSelected
                      ? 'border-[var(--md-sys-color-primary)] ring-2 ring-[var(--md-sys-color-primary)]/40 bg-[var(--md-sys-color-primary-container)]/20'
                      : isToday
                      ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/15 hover:border-[var(--md-sys-color-primary)]'
                      : 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-bold ${
                        isToday
                          ? 'w-5 h-5 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-extrabold flex items-center justify-center text-[11px]'
                          : 'text-[var(--md-sys-color-on-surface)]'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {hours >= 8 && (
                      <Sparkles className="w-3.5 h-3.5 text-[var(--md-sys-color-warning)] shrink-0" />
                    )}
                  </div>

                  {hours > 0 ? (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-md truncate text-center font-bold tracking-tight ${hoursBadgeClass}`}
                    >
                      +{hours}h
                    </span>
                  ) : (
                    <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] opacity-40 text-center">
                      -
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Day Worklog Inspector */}
      <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--md-sys-color-outline-variant)] pb-3">
          <div>
            <h4 className="text-sm font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
              <span>
                Worklogs for {new Date(selectedDayStr + 'T00:00:00').toLocaleDateString(undefined, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </h4>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
              Total effort logged on this day: <strong className="text-[var(--md-sys-color-on-surface)]">{selectedDayHours} hrs</strong>
            </p>
          </div>
        </div>

        {selectedDayLogs.length > 0 ? (
          <div className="divide-y divide-[var(--md-sys-color-outline-variant)]">
            {selectedDayLogs.map((log) => (
              <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-1">
                  {log.issue ? (
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/issues/${log.issue.id}`}
                        className="text-xs font-mono font-bold text-[var(--md-sys-color-primary)] hover:underline flex items-center gap-1"
                      >
                        <span>{log.issue.key}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                      <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface)]">
                        {log.issue.title}
                      </span>
                      {log.issue.projectName && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] font-mono">
                          {log.issue.projectName}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">
                      General Development Effort
                    </span>
                  )}

                  {log.description ? (
                    <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                      {log.description}
                    </p>
                  ) : (
                    <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] italic">
                      No description provided
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {isTeamView && log.user && (
                    <div className="flex items-center gap-1.5 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                      <span>{log.user.fullName}</span>
                    </div>
                  )}

                  <div className="px-3 py-1 rounded-lg bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)] border border-[var(--md-sys-color-success)]/20 font-bold text-xs">
                    {log.timeSpentHours} hrs
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-[var(--md-sys-color-on-surface-variant)]">
            No work logs recorded on this day.
          </div>
        )}
      </div>
    </div>
  );
};
