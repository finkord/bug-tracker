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
} from 'lucide-react';

export const TimeTrackingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'calendar' | 'personal'>('matrix');
  const [stats, setStats] = useState<WorklogStats | null>(null);
  const [matrix, setMatrix] = useState<TeamTimesheetMatrix | null>(null);
  const [myLogs, setMyLogs] = useState<WorklogItem[]>([]);
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Month navigation state (supports moving into any past month!)
  const [selectedMonthDate, setSelectedMonthDate] = useState<Date>(new Date());
  const [rangeMode, setRangeMode] = useState<'month' | '7d' | '14d'>('14d');

  // Global Log Work modal state
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [selectedIssueForLog, setSelectedIssueForLog] = useState<IssueItem | null>(null);

  // Compute date boundaries
  const getDateRange = () => {
    if (rangeMode === '7d') {
      const now = new Date();
      const start = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
      return {
        startDate: start.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0],
      };
    }
    if (rangeMode === '14d') {
      const now = new Date();
      const start = new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000);
      return {
        startDate: start.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0],
      };
    }
    // 'month' mode: use selectedMonthDate
    const year = selectedMonthDate.getFullYear();
    const month = selectedMonthDate.getMonth();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
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
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [rangeMode, selectedMonthDate]);

  // Navigate months
  const prevMonth = () => {
    setSelectedMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setRangeMode('month');
  };

  const nextMonth = () => {
    setSelectedMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setRangeMode('month');
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--md-sys-color-outline-variant)] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--md-sys-color-on-surface)]">
              Team Time Tracking & Capacity
            </h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]">
              Timesheet Matrix
            </span>
          </div>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">
            Monitor daily effort per engineer, sprint velocity, and team capacity distribution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleOpenLogModal()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-semibold text-xs shadow-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Log Work</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">
              Total Logged Effort
            </span>
            <p className="text-2xl font-bold text-[var(--md-sys-color-on-surface)]">
              {stats ? `${stats.totalHoursLogged}h` : '0h'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">
              Logged Today
            </span>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats ? `${stats.hoursLoggedToday}h` : '0h'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">
              Logged This Week
            </span>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {stats ? `${stats.hoursLoggedThisWeek}h` : '0h'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">
              Active Team Members
            </span>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {matrix ? matrix.members.length : 0}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main View Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--md-sys-color-outline-variant)]">
        <div className="flex items-center gap-2 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shadow-2xs'
                : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Team Timesheet Matrix</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('calendar');
              setRangeMode('month');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'calendar'
                ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shadow-2xs'
                : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Team Monthly Calendar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('personal')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'personal'
                ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shadow-2xs'
                : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>My Recent Worklogs</span>
          </button>
        </div>

        {/* Range & Month Controls for Matrix */}
        {activeTab === 'matrix' && (
          <div className="flex flex-wrap items-center gap-2 pb-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setRangeMode('7d')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  rangeMode === '7d'
                    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-bold'
                    : 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                7 Days
              </button>
              <button
                type="button"
                onClick={() => setRangeMode('14d')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  rangeMode === '14d'
                    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-bold'
                    : 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                14 Days
              </button>
            </div>

            {/* Unlimited Month Navigator */}
            <div className="flex items-center gap-1 bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-xl p-0.5">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1 rounded-lg hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
                title="Go to previous month (unlimited past)"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-bold px-2 text-[var(--md-sys-color-on-surface)] min-w-[100px] text-center">
                {monthNames[selectedMonthDate.getMonth()]} {selectedMonthDate.getFullYear()}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1 rounded-lg hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
                title="Go to next month"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tab 1: Team Timesheet Matrix Table */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[var(--md-sys-color-outline-variant)] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                  <Users className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                  <span>Team Daily Breakdown Matrix</span>
                </h3>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                  {matrix ? `${matrix.startDate} to ${matrix.endDate}` : 'Loading...'}
                </p>
              </div>

              <div className="text-xs font-semibold px-3 py-1 rounded-lg bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]">
                Grand Total: {matrix?.grandTotal || 0}h
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--md-sys-color-primary)]" />
              </div>
            ) : matrix ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse table-auto">
                  <thead>
                    <tr className="bg-[var(--md-sys-color-surface-container-low)] border-b border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider text-[10px]">
                      {/* Compact Member Column width with no huge blank space */}
                      <th className="py-2.5 px-3 sticky left-0 z-10 bg-[var(--md-sys-color-surface-container-low)] w-48 max-w-[200px] shrink-0 border-r border-[var(--md-sys-color-outline-variant)]">
                        Team Member
                      </th>
                      {matrix.days.map((day) => {
                        const dateObj = new Date(day + 'T00:00:00');
                        const dayName = dateObj.toLocaleDateString(undefined, { weekday: 'short' });
                        const dayNum = dateObj.getDate();
                        const isToday = day === new Date().toISOString().split('T')[0];

                        return (
                          <th
                            key={day}
                            className={`py-2 px-1 text-center w-12 min-w-[44px] font-semibold border-r border-[var(--md-sys-color-outline-variant)]/50 ${
                              isToday
                                ? 'bg-amber-500/15 text-amber-800 dark:text-amber-200 font-bold'
                                : ''
                            }`}
                          >
                            <span className="block text-[9px] opacity-75">{dayName}</span>
                            <span className="block text-xs font-bold">{dayNum}</span>
                          </th>
                        );
                      })}
                      <th className="py-2.5 px-3 text-right font-bold w-16 bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]">
                        Total
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]">
                    {matrix.members.map((member) => (
                      <tr
                        key={member.userId}
                        className="hover:bg-[var(--md-sys-color-surface-container-high)]/50 transition-colors"
                      >
                        {/* Member Column - Compact with no dead space */}
                        <td className="py-2 px-3 sticky left-0 z-10 bg-[var(--md-sys-color-surface)] border-r border-[var(--md-sys-color-outline-variant)] w-48 max-w-[200px]">
                          <div className="flex items-center gap-2">
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

                        {/* Daily Cells */}
                        {matrix.days.map((day) => {
                          const hours = member.dailyHours[day] || 0;
                          const isToday = day === new Date().toISOString().split('T')[0];

                          let cellBadge = 'text-[var(--md-sys-color-on-surface-variant)] opacity-30';
                          if (hours > 0 && hours < 4) {
                            cellBadge = 'bg-emerald-600 text-white font-bold shadow-2xs dark:bg-emerald-500/25 dark:text-emerald-300';
                          } else if (hours >= 4 && hours < 8) {
                            cellBadge = 'bg-emerald-700 text-white font-extrabold shadow-xs dark:bg-emerald-500/40 dark:text-emerald-200';
                          } else if (hours >= 8) {
                            cellBadge = 'bg-amber-500 text-slate-950 font-extrabold shadow-sm dark:bg-amber-400 dark:text-slate-950';
                          }

                          return (
                            <td
                              key={day}
                              className={`py-1.5 px-0.5 text-center border-r border-[var(--md-sys-color-outline-variant)]/50 ${
                                isToday ? 'bg-amber-500/5' : ''
                              }`}
                            >
                              {hours > 0 ? (
                                <span className={`inline-block px-1 py-0.5 rounded text-[11px] font-semibold ${cellBadge}`}>
                                  {hours}h
                                </span>
                              ) : (
                                <span className="text-[11px] opacity-25">-</span>
                              )}
                            </td>
                          );
                        })}

                        {/* Member Total Column */}
                        <td className="py-2 px-3 text-right font-bold text-xs bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)]">
                          {member.totalPeriodHours > 0 ? `${member.totalPeriodHours}h` : '-'}
                        </td>
                      </tr>
                    ))}

                    {/* Team Daily Totals Footer Row */}
                    <tr className="bg-[var(--md-sys-color-surface-container-high)] font-bold text-xs border-t-2 border-[var(--md-sys-color-outline-variant)]">
                      <td className="py-2.5 px-3 sticky left-0 z-10 bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border-r border-[var(--md-sys-color-outline-variant)]">
                        Daily Team Total
                      </td>
                      {matrix.days.map((day) => {
                        const total = matrix.dailyTotals[day] || 0;
                        const isToday = day === new Date().toISOString().split('T')[0];

                        return (
                          <td
                            key={`total-${day}`}
                            className={`py-2.5 px-0.5 text-center border-r border-[var(--md-sys-color-outline-variant)]/50 ${
                              isToday ? 'bg-amber-500/20 text-amber-900 dark:text-amber-200 font-extrabold' : ''
                            }`}
                          >
                            {total > 0 ? `${total}h` : '-'}
                          </td>
                        );
                      })}
                      <td className="py-2.5 px-3 text-right text-xs text-[var(--md-sys-color-primary)] font-extrabold">
                        {matrix.grandTotal}h
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Tab 2: Team Monthly Calendar View with Unlimited Past/Future Navigation */}
      {activeTab === 'calendar' && (
        <TimeCalendar
          currentDate={selectedMonthDate}
          onDateChange={(date) => {
            setSelectedMonthDate(date);
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
        <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl shadow-sm overflow-hidden space-y-4 p-4 sm:p-6">
          <div className="flex items-center justify-between border-b border-[var(--md-sys-color-outline-variant)] pb-4">
            <div>
              <h3 className="text-base font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                <Clock className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
                <span>My Logged Worklogs Feed</span>
              </h3>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                Chronological list of all worklogs submitted by your account
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleOpenLogModal()}
              className="px-3.5 py-1.5 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-semibold text-xs shadow-xs cursor-pointer"
            >
              + Log New Work
            </button>
          </div>

          {myLogs.length > 0 ? (
            <div className="divide-y divide-[var(--md-sys-color-outline-variant)]">
              {myLogs.map((log) => (
                <div
                  key={log.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[var(--md-sys-color-surface-container-high)]/30 rounded-xl px-2 transition-colors"
                >
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
                        General Engineering Task
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

                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                      {log.dateLogged}
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                      {log.timeSpentHours} hrs
                    </span>
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
