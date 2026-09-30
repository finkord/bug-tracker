import React, { useState } from 'react';
import { useMyWorklogsQuery } from '../../api/queries';
import { TimeCalendar, type DayWorklog } from '../common/TimeCalendar';
import { Clock, Trophy, Flame, Award, Sparkles, Zap, Target } from 'lucide-react';

/**
 * Material 3 Personal Time & Effort tab with streak calculation, milestone badges, and monthly calendar.
 */
export const ProfileTimeTab: React.FC = () => {
  const { data: myLogs = [] } = useMyWorklogsQuery();
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());

  // Compute daily hours for personal calendar
  const myDailyHours: Record<string, number> = {};
  let totalPersonalHours = 0;
  const currentMonthPrefix = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, '0')}`;
  let thisMonthPersonalHours = 0;

  myLogs.forEach((l) => {
    const hours = l.timeSpentHours || 0;
    totalPersonalHours += hours;
    myDailyHours[l.dateLogged] = Number(((myDailyHours[l.dateLogged] || 0) + hours).toFixed(2));
    if (l.dateLogged.startsWith(currentMonthPrefix)) {
      thisMonthPersonalHours += hours;
    }
  });

  // Calculate streak (consecutive active days up to today or yesterday)
  const sortedDates = Object.keys(myDailyHours).filter((d) => myDailyHours[d] > 0).sort().reverse();
  let streak = 0;
  if (sortedDates.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const latestLoggedDate = new Date(sortedDates[0] + 'T00:00:00');
    if (latestLoggedDate.getTime() === today.getTime() || latestLoggedDate.getTime() === yesterday.getTime()) {
      streak = 1;
      let checkDate = new Date(latestLoggedDate);
      for (let i = 1; i < sortedDates.length; i++) {
        checkDate.setDate(checkDate.getDate() - 1);
        const checkStr = checkDate.toISOString().split('T')[0];
        if (sortedDates.includes(checkStr)) {
          streak++;
        } else {
          break;
        }
      }
    }
  }

  const calendarWorklogs: DayWorklog[] = myLogs.map((l) => ({
    id: l.id,
    timeSpentHours: l.timeSpentHours,
    dateLogged: l.dateLogged,
    description: l.description,
    issue: l.issue,
  }));

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Achievements Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-5 rounded-3xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
              Total Effort
            </span>
            <p className="text-xl sm:text-2xl font-black text-[var(--md-sys-color-primary)]">
              {totalPersonalHours.toFixed(1)}h
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
              This Month
            </span>
            <p className="text-xl sm:text-2xl font-black text-[var(--md-sys-color-success)]">
              {thisMonthPersonalHours.toFixed(1)}h
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)] flex items-center justify-center">
            <Trophy className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
              Day Streak
            </span>
            <p className="text-xl sm:text-2xl font-black text-[var(--md-sys-color-warning)] flex items-center gap-1">
              <span>{streak}</span>
              <span className="text-xs font-normal text-[var(--md-sys-color-on-surface-variant)]">days</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-[var(--md-sys-color-warning-container)] text-[var(--md-sys-color-on-warning-container)] flex items-center justify-center">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
              Worklogs
            </span>
            <p className="text-xl sm:text-2xl font-black text-[var(--md-sys-color-tertiary)]">
              {myLogs.length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)] flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Achievement Badges Showcase */}
      <div className="p-6 rounded-3xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 space-y-4 shadow-xs">
        <h4 className="text-xs font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--md-sys-color-warning)]" />
          <span>Personal Engineering Milestones & Badges</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div
            className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-colors ${
              streak >= 3
                ? 'border-[var(--md-sys-color-warning)]/40 bg-[var(--md-sys-color-warning-container)]/30'
                : 'border-[var(--md-sys-color-outline-variant)]/20 bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] opacity-70'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-[var(--md-sys-color-warning-container)] text-[var(--md-sys-color-on-warning-container)] flex items-center justify-center font-bold text-sm">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">Consistency Hero</p>
              <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                {streak >= 3 ? 'Unlocked! 3+ days streak' : 'Log work 3 days consecutively'}
              </p>
            </div>
          </div>

          <div
            className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-colors ${
              Object.values(myDailyHours).some((h) => h >= 8)
                ? 'border-[var(--md-sys-color-success)]/40 bg-[var(--md-sys-color-success-container)]/30'
                : 'border-[var(--md-sys-color-outline-variant)]/20 bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] opacity-70'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)] flex items-center justify-center font-bold text-sm">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">Daily 8h Sprinter</p>
              <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                {Object.values(myDailyHours).some((h) => h >= 8)
                  ? 'Unlocked! Reached 8h in 1 day'
                  : 'Log 8 hours in a single day'}
              </p>
            </div>
          </div>

          <div
            className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-colors ${
              myLogs.length >= 5
                ? 'border-[var(--md-sys-color-primary)]/40 bg-[var(--md-sys-color-primary-container)]/30'
                : 'border-[var(--md-sys-color-outline-variant)]/20 bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] opacity-70'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center font-bold text-sm">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">Active Contributor</p>
              <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                {myLogs.length >= 5 ? 'Unlocked! 5+ logged tasks' : 'Submit at least 5 worklogs'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Personal Calendar */}
      <TimeCalendar
        currentDate={calendarDate}
        onDateChange={setCalendarDate}
        dailyHours={myDailyHours}
        worklogs={calendarWorklogs}
        title="My Monthly Worklog Calendar"
        subtitle="Click on any day to see the exact issues and tasks you worked on"
        isTeamView={false}
      />
    </div>
  );
};
