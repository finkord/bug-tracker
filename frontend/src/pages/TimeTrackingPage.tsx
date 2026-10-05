import React, { useState, useMemo } from 'react';
import {
  useWorklogStatsQuery,
  useTeamTimesheetMatrixQuery,
  useMyWorklogsQuery,
  useDeleteWorklogMutation,
  useIssuesQuery,
} from '../api/queries';
import type {
  TimeTrackingTab,
  DateRangeMode,
  MatrixGroupBy,
  CellBreakdownData,
} from '../types/timeTracking';

// Subcomponents
import { TimeTrackingToolbar } from '../components/time/TimeTrackingToolbar';
import { TimesheetMatrixGrid } from '../components/time/TimesheetMatrixGrid';
import { WorklogCalendarView } from '../components/time/WorklogCalendarView';
import { IssueEstimatesView } from '../components/time/IssueEstimatesView';
import { MyWorklogsTable } from '../components/time/MyWorklogsTable';
import { WorklogBreakdownModal } from '../components/time/WorklogBreakdownModal';
import { LogWorkModal } from '../components/kanban/LogWorkModal';

const formatLocalDate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getWeekBounds = (date: Date) => {
  const d = new Date(date);
  const dayOfWeek = d.getDay();
  // Monday is start of week
  const diffToMonday = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const start = new Date(d.setDate(diffToMonday));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

export const TimeTrackingPage: React.FC = () => {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<TimeTrackingTab>('matrix');
  const [rangeMode, setRangeMode] = useState<DateRangeMode>('week');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [groupBy, setGroupBy] = useState<MatrixGroupBy>('user');

  // Selected date for calendar drill-down
  const [selectedCalendarDateStr, setSelectedCalendarDateStr] = useState<string>(() =>
    formatLocalDate(new Date())
  );

  // Modal States
  const [logModalOpen, setLogModalOpen] = useState<boolean>(false);
  const [selectedIssueIdForLog, setSelectedIssueIdForLog] = useState<number | undefined>(undefined);
  const [breakdownModalData, setBreakdownModalData] = useState<CellBreakdownData | null>(null);
  const [breakdownModalOpen, setBreakdownModalOpen] = useState<boolean>(false);

  // Compute date boundaries based on rangeMode & currentDate
  const dateRange = useMemo(() => {
    if (rangeMode === 'week') {
      const { start, end } = getWeekBounds(currentDate);
      return {
        startDate: formatLocalDate(start),
        endDate: formatLocalDate(end),
        startObj: start,
        endObj: end,
      };
    }
    // 'month' mode
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    return {
      startDate: formatLocalDate(start),
      endDate: formatLocalDate(end),
      startObj: start,
      endObj: end,
    };
  }, [rangeMode, currentDate]);

  // Compute readable date range label
  const currentDateText = useMemo(() => {
    if (rangeMode === 'week') {
      const { startObj, endObj } = dateRange;
      const startMonth = startObj.toLocaleDateString(undefined, { month: 'short' });
      const endMonth = endObj.toLocaleDateString(undefined, { month: 'short' });
      const year = endObj.getFullYear();

      if (startMonth === endMonth) {
        return `${startMonth} ${startObj.getDate()} – ${endObj.getDate()}, ${year}`;
      }
      return `${startMonth} ${startObj.getDate()} – ${endMonth} ${endObj.getDate()}, ${year}`;
    }
    return currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }, [rangeMode, currentDate, dateRange]);

  // TanStack Query Hooks for server state
  const {
    data: stats = null,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useWorklogStatsQuery();

  const {
    data: matrix = null,
    isLoading: matrixLoading,
    refetch: refetchMatrix,
  } = useTeamTimesheetMatrixQuery(dateRange.startDate, dateRange.endDate, undefined, undefined, groupBy);

  const [myLogsPage, setMyLogsPage] = useState<number>(1);
  const [myLogsLimit, setMyLogsLimit] = useState<number>(20);

  const {
    data: myLogsData,
    isLoading: myLogsLoading,
    refetch: refetchMyLogs,
  } = useMyWorklogsQuery(myLogsPage, myLogsLimit);
  const myLogs = myLogsData?.items ?? [];
  const myLogsTotal = myLogsData?.total ?? 0;
  const myLogsTotalPages = myLogsData?.totalPages ?? 1;

  const deleteWorklogMutation = useDeleteWorklogMutation();

  const handleDeleteWorklog = async (issueId: number, worklogId: number) => {
    try {
      await deleteWorklogMutation.mutateAsync({ issueId, worklogId });
      await handleRefresh();
    } catch (err) {
      console.error('Failed to delete worklog:', err);
    }
  };

  const {
    data: issuesData,
    isLoading: issuesLoading,
    refetch: refetchIssues,
  } = useIssuesQuery();
  const issues = issuesData?.items ?? [];

  const loading = statsLoading || matrixLoading || myLogsLoading || issuesLoading;

  const handleRefresh = async () => {
    await Promise.all([refetchStats(), refetchMatrix(), refetchMyLogs(), refetchIssues()]);
  };

  // Period Navigation handlers
  const handlePrevPeriod = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (rangeMode === 'week') {
        next.setDate(next.getDate() - 7);
      } else {
        next.setMonth(next.getMonth() - 1);
      }
      return next;
    });
  };

  const handleNextPeriod = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (rangeMode === 'week') {
        next.setDate(next.getDate() + 7);
      } else {
        next.setMonth(next.getMonth() + 1);
      }
      return next;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Open Log Work Modal with optional issue preselected
  const handleOpenLogWork = (issueId?: number) => {
    setSelectedIssueIdForLog(issueId);
    setLogModalOpen(true);
  };

  // Matrix cell click -> open cell breakdown drill-down modal
  const handleSelectCell = (data: CellBreakdownData) => {
    setBreakdownModalData(data);
    setBreakdownModalOpen(true);
  };

  // Quick log on matrix cell
  const handleQuickLogForCell = (issueId?: number) => {
    handleOpenLogWork(issueId);
  };

  // CSV Export
  const handleExportCsv = () => {
    if (!matrix || !matrix.days || matrix.days.length === 0) return;

    const headers = ['Member', 'Email', ...matrix.days, 'Total Hours'];
    const rows = matrix.members.map((m) => {
      const dayValues = matrix.days.map((d) => m.dailyHours[d] || 0);
      return [
        `"${m.fullName.replace(/"/g, '""')}"`,
        `"${m.email}"`,
        ...dayValues,
        m.totalPeriodHours || 0,
      ].join(',');
    });

    const csvString = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `timesheet-matrix-${matrix.startDate}-to-${matrix.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // JSON Export
  const handleExportJson = () => {
    if (!matrix) return;
    const exportObject = {
      matrix,
      stats,
      generatedAt: new Date().toISOString(),
    };
    const jsonString = JSON.stringify(exportObject, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `timesheet-export-${matrix.startDate || 'data'}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Period total hours for top badge
  const periodTotalHours = useMemo(() => {
    if (matrix?.grandTotal != null) return matrix.grandTotal;
    return 0;
  }, [matrix]);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-5 flex-1 flex flex-col min-w-0 animate-in fade-in duration-200">
      <div className="w-full space-y-4">
        {/* Top Control Bar & Segmented Tab Switcher */}
        <TimeTrackingToolbar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          rangeMode={rangeMode}
          onRangeModeChange={setRangeMode}
          currentDateText={currentDateText}
          onPrevPeriod={handlePrevPeriod}
          onNextPeriod={handleNextPeriod}
          onToday={handleToday}
          groupBy={groupBy}
          onGroupByChange={setGroupBy}
          stats={stats}
          periodTotalHours={periodTotalHours}
          onOpenLogWork={() => handleOpenLogWork(undefined)}
          onExportCsv={handleExportCsv}
          onExportJson={handleExportJson}
          onRefresh={handleRefresh}
          loading={loading}
        />

        {/* Tab 1: Timesheet Matrix Grid */}
        {activeTab === 'matrix' && (
          <div className="space-y-4">
            <TimesheetMatrixGrid
              matrix={matrix}
              issues={issues}
              groupBy={groupBy}
              onSelectCell={handleSelectCell}
              onQuickLogForCell={handleQuickLogForCell}
            />
          </div>
        )}

        {/* Tab 2: Calendar View */}
        {activeTab === 'calendar' && (
          <WorklogCalendarView
            matrix={matrix}
            issues={issues}
            selectedDateStr={selectedCalendarDateStr}
            onSelectDateStr={setSelectedCalendarDateStr}
            onOpenLogWorkForDate={(dateStr) => {
              setSelectedCalendarDateStr(dateStr);
              handleOpenLogWork(undefined);
            }}
          />
        )}

        {/* Tab 3: Issue Estimates & Progress */}
        {activeTab === 'estimates' && (
          <IssueEstimatesView
            issues={issues}
            onOpenLogWorkForIssue={(issue) => handleOpenLogWork(issue.id)}
          />
        )}

        {/* Tab 4: My Personal Worklogs */}
        {activeTab === 'worklogs' && (
          <MyWorklogsTable
            worklogs={myLogs}
            total={myLogsTotal}
            page={myLogsPage}
            limit={myLogsLimit}
            totalPages={myLogsTotalPages}
            onPageChange={setMyLogsPage}
            onLimitChange={(lim) => {
              setMyLogsLimit(lim);
              setMyLogsPage(1);
            }}
            loading={loading}
            onOpenLogModal={() => handleOpenLogWork(undefined)}
            onDeleteWorklog={handleDeleteWorklog}
          />
        )}
      </div>

      {/* Worklog Cell Breakdown Drill-down Modal */}
      <WorklogBreakdownModal
        data={breakdownModalData}
        isOpen={breakdownModalOpen}
        onClose={() => {
          setBreakdownModalOpen(false);
          setBreakdownModalData(null);
        }}
        onLogMoreWork={(issueId) => handleOpenLogWork(issueId)}
        onDeleteWorklog={handleDeleteWorklog}
      />

      {/* Global Log Work Modal */}
      <LogWorkModal
        isOpen={logModalOpen}
        onClose={() => {
          setLogModalOpen(false);
          setSelectedIssueIdForLog(undefined);
        }}
        issueId={selectedIssueIdForLog}
        onWorkLogged={() => {
          handleRefresh();
        }}
      />
    </div>
  );
};
