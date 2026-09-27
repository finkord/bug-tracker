import React from 'react';
import type { TimeTrackingTab, DateRangeMode, MatrixGroupBy } from '../../types/timeTracking';
import type { WorklogStats } from '../../api/client';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Tooltip,
} from '../ui';
import {
  FileSpreadsheet,
  Calendar,
  TrendingUp,
  Clock,
  ChevronLeft,
  ChevronRight,
  Download,
  PlusCircle,
  RefreshCw,
  Users,
} from 'lucide-react';

interface TimeTrackingToolbarProps {
  activeTab: TimeTrackingTab;
  onTabChange: (tab: TimeTrackingTab) => void;
  rangeMode: DateRangeMode;
  onRangeModeChange: (mode: DateRangeMode) => void;
  currentDateText: string;
  onPrevPeriod: () => void;
  onNextPeriod: () => void;
  onToday: () => void;
  groupBy: MatrixGroupBy;
  onGroupByChange: (groupBy: MatrixGroupBy) => void;
  stats: WorklogStats | null;
  periodTotalHours: number;
  onOpenLogWork: () => void;
  onExportCsv: () => void;
  onExportJson: () => void;
  onRefresh: () => void;
  loading: boolean;
}

export const TimeTrackingToolbar: React.FC<TimeTrackingToolbarProps> = ({
  activeTab,
  onTabChange,
  rangeMode,
  onRangeModeChange,
  currentDateText,
  onPrevPeriod,
  onNextPeriod,
  onToday,
  groupBy,
  onGroupByChange,
  stats,
  periodTotalHours,
  onOpenLogWork,
  onExportCsv,
  onExportJson,
  onRefresh,
  loading,
}) => {
  return (
    <div className="flex flex-col gap-3 pb-3 border-b border-[var(--md-sys-color-outline-variant)]">
      {/* Upper Row: Title, View Switcher Pills, Period Controls, and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Title & Hours Badge */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-[var(--md-sys-color-on-surface)] leading-tight">
              Time Tracking
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--md-sys-color-primary-container)]/50 text-[var(--md-sys-color-primary)]">
              {periodTotalHours.toFixed(1)}h logged
            </span>
          </div>

          {/* View Mode Segmented Pill Switcher */}
          <div className="inline-flex items-center p-1 rounded-full bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40 overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => onTabChange('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'matrix'
                  ? 'bg-[var(--md-sys-color-surface-container-lowest)] dark:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-primary)] shadow-xs'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
              }`}
              title="Tempo-style Timesheet Matrix Grid"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Timesheet Matrix</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'calendar'
                  ? 'bg-[var(--md-sys-color-surface-container-lowest)] dark:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-primary)] shadow-xs'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
              }`}
              title="Interactive Monthly Calendar"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('estimates')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'estimates'
                  ? 'bg-[var(--md-sys-color-surface-container-lowest)] dark:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-primary)] shadow-xs'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
              }`}
              title="Issue Estimates vs Logged Progress"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Estimates & Progress</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('worklogs')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'worklogs'
                  ? 'bg-[var(--md-sys-color-surface-container-lowest)] dark:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-primary)] shadow-xs'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
              }`}
              title="My Personal Worklog History"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>My Logs</span>
            </button>
          </div>
        </div>

        {/* Right: Date Navigation, Range Toggle, Grouping, Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Period Range Navigator */}
          <div className="inline-flex items-center gap-1 p-0.5 rounded-full bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40">
            <button
              type="button"
              onClick={onPrevPeriod}
              className="p-1 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] transition cursor-pointer"
              title="Previous period"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onToday}
              className="px-2.5 py-0.5 text-xs font-semibold text-[var(--md-sys-color-on-surface)] hover:text-[var(--md-sys-color-primary)] transition cursor-pointer"
            >
              Today
            </button>

            <button
              type="button"
              onClick={onNextPeriod}
              className="p-1 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] transition cursor-pointer"
              title="Next period"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Current Period Label */}
          <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)] px-1">
            {currentDateText}
          </span>

          {/* Week vs Month Toggle (Only relevant for matrix and calendar) */}
          {(activeTab === 'matrix' || activeTab === 'calendar') && (
            <div className="inline-flex items-center p-1 rounded-full bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40">
              <button
                type="button"
                onClick={() => onRangeModeChange('week')}
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  rangeMode === 'week'
                    ? 'bg-[var(--md-sys-color-surface-container-lowest)] dark:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-primary)] shadow-xs'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                Week
              </button>
              <button
                type="button"
                onClick={() => onRangeModeChange('month')}
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  rangeMode === 'month'
                    ? 'bg-[var(--md-sys-color-surface-container-lowest)] dark:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-primary)] shadow-xs'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                Month
              </button>
            </div>
          )}

          {/* Group By selector (for matrix view) */}
          {activeTab === 'matrix' && (
            <div className="inline-flex items-center p-1 rounded-full bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40">
              <button
                type="button"
                onClick={() => onGroupByChange('user')}
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  groupBy === 'user'
                    ? 'bg-[var(--md-sys-color-surface-container-lowest)] dark:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-primary)] shadow-xs'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                By Member
              </button>
              <button
                type="button"
                onClick={() => onGroupByChange('issue')}
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  groupBy === 'issue'
                    ? 'bg-[var(--md-sys-color-surface-container-lowest)] dark:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-primary)] shadow-xs'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                By Issue
              </button>
            </div>
          )}

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40 text-xs font-semibold text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={onExportCsv} className="text-xs cursor-pointer">
                Export to CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExportJson} className="text-xs cursor-pointer">
                Export to JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Log Work Action Button */}
          <button
            type="button"
            onClick={onOpenLogWork}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-bold hover:opacity-95 active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Log Work</span>
          </button>

          {/* Refresh Button */}
          <Tooltip content="Refresh timesheet data">
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="p-2 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors cursor-pointer disabled:opacity-50"
              aria-label="Refresh timesheets"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[var(--md-sys-color-primary)]' : ''}`} />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Lower Summary Stats Strip */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--md-sys-color-surface-container)] text-xs">
          <span className="text-[var(--md-sys-color-on-surface-variant)]">Today:</span>
          <span className="font-bold text-[var(--md-sys-color-on-surface)]">
            {stats ? `${stats.hoursLoggedToday.toFixed(1)}h` : '0.0h'}
          </span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--md-sys-color-surface-container)] text-xs">
          <span className="text-[var(--md-sys-color-on-surface-variant)]">This Week:</span>
          <span className="font-bold text-[var(--md-sys-color-on-surface)]">
            {stats ? `${stats.hoursLoggedThisWeek.toFixed(1)}h` : '0.0h'}
          </span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--md-sys-color-surface-container)] text-xs">
          <span className="text-[var(--md-sys-color-on-surface-variant)]">Period Total:</span>
          <span className="font-bold text-[var(--md-sys-color-primary)]">
            {periodTotalHours.toFixed(1)}h
          </span>
        </div>

        {stats && stats.byUser && stats.byUser.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--md-sys-color-surface-container)] text-xs ml-auto hidden sm:flex">
            <Users className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)]" />
            <span className="font-semibold text-[var(--md-sys-color-on-surface-variant)]">
              {stats.byUser.length} active {stats.byUser.length === 1 ? 'member' : 'members'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
