import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  api,
  type WorklogItem,
  type WorklogStats,
  type IssueItem,
  type TeamTimesheetMatrix,
} from '../api/client';
import { Avatar } from '../components/common/Avatar';
import { LogWorkModal } from '../components/kanban/LogWorkModal';
import { TimeCalendar, type DayWorklog } from '../components/common/TimeCalendar';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Tooltip } from '../components/ui/Tooltip';
import {
  Clock,
  Calendar,
  Users,
  PlusCircle,
  Loader2,
  TrendingUp,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Layers,
  Sparkles,
  MessageSquare,
} from 'lucide-react';

const formatLocalDate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const TimeTrackingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'calendar' | 'personal'>('matrix');
  const [stats, setStats] = useState<WorklogStats | null>(null);
  const [matrix, setMatrix] = useState<TeamTimesheetMatrix | null>(null);
  const [myLogs, setMyLogs] = useState<WorklogItem[]>([]);
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Month-centric matrix with ability to view Full Month or 7 Days
  const [rangeMode, setRangeMode] = useState<'month' | '7d'>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Global Log Work modal state
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [selectedIssueForLog, setSelectedIssueForLog] = useState<IssueItem | null>(null);

  // Compute date boundaries
  const getDateRange = () => {
    if (rangeMode === '7d') {
      const end = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      return {
        startDate: formatLocalDate(start),
        endDate: formatLocalDate(end),
      };
    }
    // Default: 'month' mode (full month from 1st to last day)
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    return {
      startDate: formatLocalDate(start),
      endDate: formatLocalDate(end),
    };
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();
      const [statsData, matrixData, myLogsData, issuesData] = await Promise.all([
        api.getWorklogStats().catch(() => null),
        api.getTeamTimesheetMatrix(startDate, endDate).catch(() => null),
        api.getMyWorklogs().catch(() => []),
        api.getIssues().catch(() => []),
      ]);
      setStats(statsData);
      setMatrix(matrixData);
      setMyLogs(myLogsData);
      setIssues(issuesData);
    } catch {
      // Graceful error fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [rangeMode, selectedDate]);

  // Navigate periods
  const prevPeriod = () => {
    if (rangeMode === 'month') {
      setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    } else {
      setSelectedDate((prev) => {
        const d = new Date(prev);
        d.setDate(d.getDate() - 7);
        return d;
      });
    }
  };

  const nextPeriod = () => {
    if (rangeMode === 'month') {
      setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    } else {
      setSelectedDate((prev) => {
        const d = new Date(prev);
        d.setDate(d.getDate() + 7);
        return d;
      });
    }
  };

  const resetToToday = () => {
    setSelectedDate(new Date());
  };

  // Compute team daily hours for calendar view
  const teamDailyHours: Record<string, number> = {};
  if (matrix) {
    Object.entries(matrix.dailyTotals).forEach(([date, h]) => {
      teamDailyHours[date] = h;
    });
  }

  // Worklogs list for calendar inspector
  const calendarWorklogs: DayWorklog[] = myLogs.map((l) => ({
    id: l.id,
    timeSpentHours: l.timeSpentHours,
    dateLogged: l.dateLogged,
    description: l.description,
    issue: l.issue,
  }));

  const handleOpenLogModal = (issue?: IssueItem) => {
    setSelectedIssueForLog(issue || issues[0] || null);
    setLogModalOpen(true);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Actions */}
      <div className="bg-[var(--md-sys-color-surface-container-low)] rounded-3xl p-5 sm:p-6 border border-[var(--md-sys-color-outline-variant)]/20 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center font-bold shrink-0 shadow-2xs">
              <Clock className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--md-sys-color-on-surface)]">
                  Team Time Tracking & Capacity
                </h1>
                <Badge variant="primary" size="sm" className="rounded-full px-3 py-1 font-semibold">
                  Timesheet Matrix
                </Badge>
              </div>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                Monitor daily effort per engineer, sprint velocity, and team capacity distribution
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="filled"
              size="sm"
              className="rounded-full px-4 text-xs font-bold"
              onClick={() => handleOpenLogModal()}
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Log Work
            </Button>
          </div>
        </div>
      </div>

      {/* Main View Tabs & Range Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 overflow-x-auto w-fit max-w-full shadow-2xs">
          <Button
            type="button"
            variant={activeTab === 'matrix' ? 'filled' : 'ghost'}
            size="sm"
            className="rounded-full px-4 text-xs font-bold"
            onClick={() => setActiveTab('matrix')}
            leftIcon={<FileSpreadsheet className="w-3.5 h-3.5" />}
          >
            Team Timesheet Matrix
          </Button>

          <Button
            type="button"
            variant={activeTab === 'calendar' ? 'filled' : 'ghost'}
            size="sm"
            className="rounded-full px-4 text-xs font-bold"
            onClick={() => {
              setActiveTab('calendar');
              setRangeMode('month');
            }}
            leftIcon={<Calendar className="w-3.5 h-3.5" />}
          >
            Monthly Calendar
          </Button>

          <Button
            type="button"
            variant={activeTab === 'personal' ? 'filled' : 'ghost'}
            size="sm"
            className="rounded-full px-4 text-xs font-bold"
            onClick={() => setActiveTab('personal')}
            leftIcon={<Clock className="w-3.5 h-3.5" />}
          >
            My Recent Worklogs
          </Button>
        </div>

        {/* Range & Period Controls for Matrix */}
        {activeTab === 'matrix' && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Range Mode Switcher: Full Month (Default) or 7 Days */}
            <div className="flex items-center gap-1 bg-[var(--md-sys-color-surface-container-low)] p-1 rounded-full border border-[var(--md-sys-color-outline-variant)]/20 shadow-2xs">
              <button
                type="button"
                onClick={() => setRangeMode('month')}
                className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  rangeMode === 'month'
                    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xs'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                Full Month
              </button>
              <button
                type="button"
                onClick={() => setRangeMode('7d')}
                className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  rangeMode === '7d'
                    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xs'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                7 Days
              </button>
            </div>

            {/* Period Navigator */}
            <div className="flex items-center gap-1 bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 rounded-full p-1 shadow-2xs">
              <Tooltip content={rangeMode === 'month' ? 'Previous month' : 'Previous 7 days'}>
                <button
                  type="button"
                  onClick={prevPeriod}
                  className="p-1.5 rounded-full hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
                  aria-label="Previous period"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </Tooltip>

              <span className="text-xs font-bold px-2 text-[var(--md-sys-color-on-surface)] min-w-[110px] text-center">
                {rangeMode === 'month'
                  ? `${monthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`
                  : matrix ? `${matrix.startDate} – ${matrix.endDate}` : ''}
              </span>

              <Tooltip content={rangeMode === 'month' ? 'Next month' : 'Next 7 days'}>
                <button
                  type="button"
                  onClick={nextPeriod}
                  className="p-1.5 rounded-full hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
                  aria-label="Next period"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </Tooltip>

              <button
                type="button"
                onClick={resetToToday}
                className="text-[11px] font-bold px-2.5 py-1 rounded-full hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-primary)] transition-colors cursor-pointer"
              >
                Today
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* 1. TIMESHEET MATRIX ON TOP OF PAGE (PRIMARY SECTION) */}
      {/* ==================================================== */}
      {activeTab === 'matrix' && (
        <div className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 rounded-3xl overflow-hidden shadow-xs space-y-0">
          <div className="p-4 sm:p-5 bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)]/60 border-b border-[var(--md-sys-color-outline-variant)]/20 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center font-bold shadow-2xs">
                <FileSpreadsheet className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                  Team Daily Breakdown Matrix
                </h3>
                <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                  {matrix ? `Displaying ${matrix.days.length} days (${matrix.startDate} to ${matrix.endDate}) • Hover over any cell to inspect logged ticket details & comments` : 'Loading timesheet data...'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="primary" size="sm" className="rounded-full px-3 py-1 font-bold">
                Grand Total: {matrix?.grandTotal || 0} hrs
              </Badge>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--md-sys-color-primary)]" />
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Computing team timesheet matrix...</p>
            </div>
          ) : matrix ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse table-auto">
                <thead>
                  <tr className="bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)]/40 border-b border-[var(--md-sys-color-outline-variant)]/20 text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3.5 sticky left-0 z-20 bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] w-48 max-w-[200px] shrink-0 border-r border-[var(--md-sys-color-outline-variant)]/30 font-bold shadow-xs">
                      Team Member
                    </th>
                    {matrix.days.map((day) => {
                      const dateObj = new Date(day + 'T00:00:00');
                      const dayName = dateObj.toLocaleDateString(undefined, { weekday: 'short' });
                      const dayNum = dateObj.getDate();
                      const isToday = day === new Date().toISOString().split('T')[0];
                      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

                      return (
                        <th
                          key={day}
                          className={`py-2 px-1 text-center w-12 min-w-[44px] font-semibold border-r border-[var(--md-sys-color-outline-variant)]/20 ${
                            isToday
                              ? 'bg-amber-500/15 text-amber-800 dark:text-amber-200 font-bold'
                              : isWeekend
                              ? 'opacity-60 bg-[var(--md-sys-color-surface-container-lowest)]/40'
                              : ''
                          }`}
                        >
                          <span className="block text-[9px] opacity-75">{dayName}</span>
                          <span className="block text-xs font-bold">{dayNum}</span>
                        </th>
                      );
                    })}
                    <th className="py-3 px-3.5 text-right font-bold w-16 bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]">
                      Total
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]/20">
                  {matrix.members.map((member) => (
                    <tr
                      key={member.userId}
                      className="hover:bg-[var(--md-sys-color-surface-container)] dark:hover:bg-[var(--md-sys-color-surface-container-high)]/40 transition-colors"
                    >
                      <td className="py-2.5 px-3.5 sticky left-0 z-10 bg-[var(--md-sys-color-surface-container-low)] dark:bg-[var(--md-sys-color-surface-container-high)] border-r border-[var(--md-sys-color-outline-variant)]/30 w-48 max-w-[200px] shadow-xs">
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            name={member.fullName}
                            avatarUrl={member.avatarUrl}
                            size="sm"
                          />
                          <div className="min-w-0 max-w-[130px]">
                            <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)] truncate" title={member.fullName}>
                              {member.fullName}
                            </p>
                            <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] uppercase block truncate">
                              {member.systemRole}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Daily Cells with Rich Hover Tooltip (Ticket link, time logged, comment) */}
                      {matrix.days.map((day) => {
                        const hours = member.dailyHours[day] || 0;
                        const worklogs = member.dailyWorklogs?.[day] || [];
                        const isToday = day === new Date().toISOString().split('T')[0];

                        let cellBadge = 'text-[var(--md-sys-color-on-surface-variant)] opacity-30';
                        if (hours > 0 && hours < 4) {
                          cellBadge = 'bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)] font-bold border border-[var(--md-sys-color-success)]/25 shadow-2xs';
                        } else if (hours >= 4 && hours < 8) {
                          cellBadge = 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-extrabold border border-[var(--md-sys-color-primary)]/25 shadow-2xs';
                        } else if (hours >= 8) {
                          cellBadge = 'bg-[var(--md-sys-color-warning-container)] text-[var(--md-sys-color-on-warning-container)] font-extrabold border border-[var(--md-sys-color-warning)]/25 shadow-2xs';
                        }

                        // Prepare Rich Tooltip Content
                        const tooltipNode = hours > 0 ? (
                          <div className="p-2 space-y-2 max-w-xs text-left">
                            <div className="border-b border-[var(--md-sys-color-outline-variant)]/30 pb-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-xs text-[var(--md-sys-color-on-surface)]">
                                  {member.fullName}
                                </span>
                                <span className="font-extrabold text-xs text-[var(--md-sys-color-primary)]">
                                  {hours} hrs logged
                                </span>
                              </div>
                              <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                                {new Date(day + 'T00:00:00').toLocaleDateString(undefined, {
                                  weekday: 'long',
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>

                            <div className="space-y-1.5 max-h-48 overflow-y-auto">
                              {worklogs.length > 0 ? (
                                worklogs.map((w) => (
                                  <div
                                    key={w.id}
                                    className="p-1.5 rounded-lg bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/30 space-y-1"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      {w.issueKey ? (
                                        <Link
                                          to={`/issues/${w.issueKey}`}
                                          className="text-[11px] font-mono font-bold text-[var(--md-sys-color-primary)] hover:underline flex items-center gap-1"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <span>{w.issueKey}</span>
                                          <ExternalLink className="w-2.5 h-2.5" />
                                        </Link>
                                      ) : (
                                        <span className="text-[11px] font-semibold text-[var(--md-sys-color-on-surface)]">
                                          Task #{w.id}
                                        </span>
                                      )}
                                      <span className="text-[11px] font-bold text-[var(--md-sys-color-on-surface)]">
                                        {w.timeSpentHours}h
                                      </span>
                                    </div>

                                    {w.issueTitle && (
                                      <p className="text-[10px] font-medium text-[var(--md-sys-color-on-surface)] line-clamp-1">
                                        {w.issueTitle}
                                      </p>
                                    )}

                                    {w.description ? (
                                      <div className="flex items-start gap-1 text-[10px] text-[var(--md-sys-color-on-surface-variant)] bg-[var(--md-sys-color-surface-container-high)]/50 p-1 rounded">
                                        <MessageSquare className="w-2.5 h-2.5 mt-0.5 shrink-0 opacity-70" />
                                        <span className="line-clamp-2">{w.description}</span>
                                      </div>
                                    ) : (
                                      <span className="text-[9px] text-[var(--md-sys-color-on-surface-variant)] italic opacity-60 block">
                                        No comment provided
                                      </span>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                                  {hours} hours logged across assigned tasks.
                                </div>
                              )}
                            </div>
                          </div>
                        ) : null;

                        return (
                          <td
                            key={day}
                            className={`py-1 px-0.5 text-center border-r border-[var(--md-sys-color-outline-variant)]/20 ${
                              isToday ? 'bg-amber-500/5' : ''
                            }`}
                          >
                            {hours > 0 ? (
                              <Tooltip content={tooltipNode} delayDuration={150}>
                                <button
                                  type="button"
                                  className={`inline-block px-1.5 py-0.5 rounded-full text-[11px] font-semibold cursor-pointer transition-transform hover:scale-105 ${cellBadge}`}
                                >
                                  {hours}h
                                </button>
                              </Tooltip>
                            ) : (
                              <span className="text-[11px] opacity-25">-</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Member Total Column */}
                      <td className="py-2 px-3 text-right font-bold text-xs bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)]/40 text-[var(--md-sys-color-on-surface)]">
                        {member.totalPeriodHours > 0 ? `${member.totalPeriodHours}h` : '-'}
                      </td>
                    </tr>
                  ))}

                  {/* Team Daily Totals Footer Row */}
                  <tr className="bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] font-bold text-xs border-t-2 border-[var(--md-sys-color-outline-variant)]/30">
                    <td className="py-3 px-3.5 sticky left-0 z-20 bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border-r border-[var(--md-sys-color-outline-variant)]/30 font-bold shadow-xs">
                      Daily Team Total
                    </td>
                    {matrix.days.map((day) => {
                      const total = matrix.dailyTotals[day] || 0;
                      const isToday = day === new Date().toISOString().split('T')[0];

                      return (
                        <td
                          key={`total-${day}`}
                          className={`py-2 px-0.5 text-center border-r border-[var(--md-sys-color-outline-variant)]/20 ${
                            isToday ? 'bg-amber-500/20 text-amber-900 dark:text-amber-200 font-extrabold' : ''
                          }`}
                        >
                          {total > 0 ? `${total}h` : '-'}
                        </td>
                      );
                    })}
                    <td className="py-3 px-3.5 text-right text-xs text-[var(--md-sys-color-primary)] font-extrabold">
                      {matrix.grandTotal}h
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      )}

      {/* ==================================================== */}
      {/* 2. ANALYTICS & CAPACITY KPI CARDS (PLACED AFTER MATRIX) */}
      {/* ==================================================== */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
          <h2 className="text-sm font-bold text-[var(--md-sys-color-on-surface)] uppercase tracking-wider">
            Effort Analytics & Capacity Insights
          </h2>
        </div>

        {/* KPI Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-5 rounded-3xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 flex items-center justify-between shadow-xs">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
                Total Logged Effort
              </span>
              <p className="text-2xl font-black text-[var(--md-sys-color-on-surface)]">
                {stats ? `${stats.totalHoursLogged}h` : '0h'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center shadow-2xs">
              <Clock className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 flex items-center justify-between shadow-xs">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
                Logged Today
              </span>
              <p className="text-2xl font-black text-[var(--md-sys-color-success)]">
                {stats ? `${stats.hoursLoggedToday}h` : '0h'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)] flex items-center justify-center shadow-2xs">
              <TrendingUp className="w-5 h-5 text-[var(--md-sys-color-success)]" />
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 flex items-center justify-between shadow-xs">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
                Logged This Week
              </span>
              <p className="text-2xl font-black text-amber-500">
                {stats ? `${stats.hoursLoggedThisWeek}h` : '0h'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-warning-container)] text-[var(--md-sys-color-on-warning-container)] flex items-center justify-center shadow-2xs">
              <Calendar className="w-5 h-5 text-[var(--md-sys-color-warning)]" />
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 flex items-center justify-between shadow-xs">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
                Active Contributors
              </span>
              <p className="text-2xl font-black text-[var(--md-sys-color-primary)]">
                {matrix ? matrix.members.length : 0}
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] flex items-center justify-center shadow-2xs">
              <Users className="w-5 h-5 text-[var(--md-sys-color-secondary)]" />
            </div>
          </div>
        </div>

        {/* Project & Contributor Effort Breakdown Widgets */}
        {stats && (stats.byProject?.length > 0 || stats.byUser?.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
            {stats.byProject?.length > 0 && (
              <div className="p-5 rounded-3xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 space-y-3.5 shadow-xs">
                <div className="flex items-center justify-between border-b border-[var(--md-sys-color-outline-variant)]/20 pb-2.5">
                  <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                    <span>Effort Logged by Project</span>
                  </span>
                  <Badge variant="primary" size="sm" className="rounded-full px-2.5">
                    {stats.byProject.length} Projects
                  </Badge>
                </div>
                <div className="space-y-2.5">
                  {stats.byProject.map((p) => {
                    const percentage = stats.totalHoursLogged > 0
                      ? Math.round((p.totalHours / stats.totalHoursLogged) * 100)
                      : 0;
                    return (
                      <div key={p.projectId} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[var(--md-sys-color-on-surface)]">
                            [{p.projectKey}] {p.projectName}
                          </span>
                          <span className="font-bold text-[var(--md-sys-color-primary)]">
                            {p.totalHours}h ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[var(--md-sys-color-surface-container-highest)] overflow-hidden">
                          <div
                            className="h-full bg-[var(--md-sys-color-primary)] rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, percentage)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {stats.byUser?.length > 0 && (
              <div className="p-5 rounded-3xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 space-y-3.5 shadow-xs">
                <div className="flex items-center justify-between border-b border-[var(--md-sys-color-outline-variant)]/20 pb-2.5">
                  <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Top Contributors Capacity</span>
                  </span>
                  <Badge variant="neutral" size="sm" className="rounded-full px-2.5">
                    {stats.byUser.length} Members
                  </Badge>
                </div>
                <div className="space-y-2.5">
                  {stats.byUser.slice(0, 5).map((u) => {
                    const percentage = stats.totalHoursLogged > 0
                      ? Math.round((u.totalHours / stats.totalHoursLogged) * 100)
                      : 0;
                    return (
                      <div key={u.userId} className="flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar name={u.fullName} avatarUrl={u.avatarUrl} size="xs" />
                          <span className="font-medium text-[var(--md-sys-color-on-surface)] truncate">
                            {u.fullName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 font-bold">
                          <span className="text-[var(--md-sys-color-on-surface-variant)] text-[11px]">
                            {percentage}%
                          </span>
                          <span className="text-[var(--md-sys-color-primary)]">
                            {u.totalHours}h
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tab 2: Team Monthly Calendar View */}
      {activeTab === 'calendar' && (
        <TimeCalendar
          currentDate={selectedDate}
          onDateChange={(date) => {
            setSelectedDate(date);
            setRangeMode('month');
          }}
          dailyHours={teamDailyHours}
          worklogs={calendarWorklogs}
          title="Team Monthly Capacity Calendar"
          subtitle="Navigate across any month in past or future to inspect team worklogs"
          isTeamView={true}
        />
      )}

      {/* Tab 3: My Recent Worklogs Feed */}
      {activeTab === 'personal' && (
        <div className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 rounded-3xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-[var(--md-sys-color-surface-container-high)] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                <span>My Logged Worklogs Feed</span>
              </h3>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                Chronological list of all worklogs submitted by your account
              </p>
            </div>

            <Button
              type="button"
              variant="filled"
              size="sm"
              className="rounded-full px-4 text-xs font-bold"
              onClick={() => handleOpenLogModal()}
              leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
            >
              Log New Work
            </Button>
          </div>

          {myLogs.length > 0 ? (
            <div className="space-y-2">
              {myLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]/30 hover:border-[var(--md-sys-color-outline-variant)]/70 transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    {log.issue ? (
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/issues/${log.issue.key || log.issue.id}`}
                          className="text-xs font-mono font-bold text-[var(--md-sys-color-primary)] hover:underline flex items-center gap-1"
                        >
                          <span>{log.issue.key}</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                        <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface)]">
                          {log.issue.title}
                        </span>
                        {log.issue.projectName && (
                          <Badge variant="neutral" size="sm" className="rounded-full px-2">
                            {log.issue.projectName}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">
                        General Engineering Task
                      </span>
                    )}

                    {log.description ? (
                      <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                        {log.description}
                      </p>
                    ) : (
                      <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] italic opacity-60">
                        No description provided
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                      {log.dateLogged}
                    </span>
                    <Badge variant="success" size="sm" className="rounded-full px-3 py-0.5 font-bold">
                      {log.timeSpentHours} hrs
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-[var(--md-sys-color-on-surface-variant)]">
              You haven't logged any work yet. Use '+ Log Work' to submit effort against any assigned issue.
            </div>
          )}
        </div>
      )}

      {/* Log Work Modal */}
      <LogWorkModal
        isOpen={logModalOpen}
        onClose={() => setLogModalOpen(false)}
        issueId={selectedIssueForLog?.id}
        issueKey={selectedIssueForLog?.key}
        issueTitle={selectedIssueForLog?.title}
        onWorkLogged={loadData}
      />
    </div>
  );
};
