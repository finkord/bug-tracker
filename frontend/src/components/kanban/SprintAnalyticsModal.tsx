import React, { useState, useMemo } from 'react';
import type { IssueItem } from '../../api/client';
import { useSprintBurndownQuery, useSprintFlowMetricsQuery } from '../../api/queries';
import { Modal, Button, Badge, Tabs, TabsList, TabsTrigger } from '../ui';
import {
  TrendingDown,
  Layers,
  Clock,
  BarChart3,
  Download,
  Printer,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';
import type { SprintDefinition } from '../../types/agile';

interface SprintAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sprint: SprintDefinition;
  sprintIssues: IssueItem[];
  allSprints: Record<string, SprintDefinition>;
  allIssues: IssueItem[];
}

function getStatusBadgeVariant(status: string): NonNullable<React.ComponentProps<typeof Badge>['variant']> {
  const normalized = status.toLowerCase().replace('_', '-');
  if (['open', 'in-progress', 'review', 'resolved', 'closed'].includes(normalized)) {
    return normalized as NonNullable<React.ComponentProps<typeof Badge>['variant']>;
  }
  return 'neutral';
}

function getPriorityBadgeVariant(priority: string): NonNullable<React.ComponentProps<typeof Badge>['variant']> {
  const normalized = priority.toLowerCase();
  if (['low', 'medium', 'high', 'critical'].includes(normalized)) {
    return normalized as NonNullable<React.ComponentProps<typeof Badge>['variant']>;
  }
  return 'neutral';
}

export const SprintAnalyticsModal: React.FC<SprintAnalyticsModalProps> = ({
  isOpen,
  onClose,
  sprint,
  sprintIssues,
  allSprints,
  allIssues,
}) => {
  const [activeTab, setActiveTab] = useState<'BURNDOWN' | 'CFD' | 'CYCLE_TIME' | 'VELOCITY' | 'REPORT'>('BURNDOWN');

  const effectiveProjectId = sprint.projectId || sprintIssues[0]?.projectId;
  const { data: burndownData, isLoading: isBurndownLoading } = useSprintBurndownQuery(
    isOpen && effectiveProjectId ? effectiveProjectId : undefined,
    isOpen && sprint.id ? sprint.id : undefined,
  );

  const { data: flowMetrics, isLoading: isFlowMetricsLoading } = useSprintFlowMetricsQuery(
    isOpen && effectiveProjectId ? effectiveProjectId : undefined,
    isOpen && sprint.id ? sprint.id : undefined,
  );

  // Metric computations
  const totalScopeHours = sprintIssues.reduce((acc, i) => acc + (i.estimatedHours || 0), 0);
  const totalLoggedHours = sprintIssues.reduce((acc, i) => acc + (i.loggedHours || 0), 0);
  const completedIssues = sprintIssues.filter((i) => i.status === 'RESOLVED' || i.status === 'CLOSED');
  const inProgressIssues = sprintIssues.filter((i) => i.status === 'IN_PROGRESS' || i.status === 'REVIEW');
  const completedHours = completedIssues.reduce((acc, i) => acc + (i.estimatedHours || 0), 0);
  const remainingHours = Math.max(0, totalScopeHours - completedHours);
  const completionRate = totalScopeHours > 0 ? Math.round((completedHours / totalScopeHours) * 100) : 0;

  const hasLiveSnapshots = Boolean(burndownData?.points && burndownData.points.length > 0);

  // Generate burndown points from live daily snapshots or fallback projection
  const burndownPoints = useMemo(() => {
    if (hasLiveSnapshots && burndownData) {
      return burndownData.points.map((p, idx) => {
        let dayLabel = `Day ${idx + 1}`;
        try {
          const d = new Date(p.date);
          if (!isNaN(d.getTime())) {
            dayLabel = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          }
        } catch {}
        return {
          day: dayLabel,
          idealHours: p.idealRemainingHours,
          actualHours: p.actualRemainingHours,
        };
      });
    }

    const sprintDays = 10;
    return Array.from({ length: sprintDays + 1 }, (_, index) => {
      const dayRatio = index / sprintDays;
      const idealHours = Number((totalScopeHours * (1 - dayRatio)).toFixed(1));

      let actualHours: number | null = null;
      if (index === 0) {
        actualHours = totalScopeHours;
      } else if (index <= Math.min(6, sprintDays)) {
        const burnProgress = (index / 6) * (completedHours / Math.max(1, totalScopeHours));
        actualHours = Number((totalScopeHours - totalScopeHours * burnProgress).toFixed(1));
      }
      return { day: `Day ${index + 1}`, idealHours, actualHours };
    });
  }, [hasLiveSnapshots, burndownData, totalScopeHours, completedHours]);

  // Calculate coordinates for SVG viewBox 0 0 600 240
  const numPoints = Math.max(burndownPoints.length, 2);
  const maxH = Math.max(
    totalScopeHours,
    ...burndownPoints.map((p) => Math.max(p.idealHours, p.actualHours || 0)),
    10,
  );
  const toY = (val: number) => 210 - (val / maxH) * 180;
  const toX = (idx: number) => 40 + (idx / (numPoints - 1)) * 520;

  // Ideal path
  const idealPath = burndownPoints
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${toX(idx)} ${toY(p.idealHours)}`)
    .join(' ');

  // Actual path
  const actualActivePoints = burndownPoints
    .map((p, originalIdx) => ({ ...p, originalIdx }))
    .filter((p) => p.actualHours !== null);
  const actualPath = actualActivePoints
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${toX(p.originalIdx)} ${toY(p.actualHours!)}`)
    .join(' ');

  // CFD points preparation
  const cfdPoints = flowMetrics?.cfd ?? [];
  const maxCfdTotal = Math.max(...cfdPoints.map((p) => p.total), sprintIssues.length, 1);
  const numCfdPoints = Math.max(cfdPoints.length, 2);
  const toCfdX = (idx: number) => 45 + (idx / (numCfdPoints - 1)) * 610;
  const toCfdY = (val: number) => 230 - (val / maxCfdTotal) * 190;

  // Cycle Time data preparation
  const cycleTimeSummary = flowMetrics?.cycleTime;
  const cycleTimeItems = cycleTimeSummary?.items ?? [];
  const maxCycleDays = Math.max(
    cycleTimeSummary?.p95CycleTimeDays ?? 1,
    ...cycleTimeItems.map((i) => i.cycleTimeDays),
    5,
  );

  // Historical Sprint Velocity calculation
  const velocityData =
    flowMetrics?.velocity && flowMetrics.velocity.length > 0
      ? flowMetrics.velocity.map((v) => ({
          name: v.sprintName,
          status: v.status,
          planned: v.committedHours,
          delivered: v.completedHours,
        }))
      : Object.keys(allSprints).map((sprintKey) => {
          const sprintDef = allSprints[sprintKey];
          const sIssues = allIssues.filter(
            (i) => (sprintDef?.id && i.sprintId === sprintDef.id) || i.sprint?.name === sprintKey,
          );
          const planned = sIssues.reduce((acc, i) => acc + (i.estimatedHours || 0), 0);
          const delivered = sIssues
            .filter((i) => i.status === 'RESOLVED' || i.status === 'CLOSED')
            .reduce((acc, i) => acc + (i.estimatedHours || 0), 0);
          return {
            name: sprintKey,
            status: sprintDef?.status || 'PLANNED',
            planned,
            delivered,
          };
        });

  const avgVelocity =
    velocityData.length > 0
      ? Math.round(velocityData.reduce((acc, v) => acc + v.delivered, 0) / velocityData.length)
      : 0;

  // Export CSV handler
  const handleExportCSV = () => {
    const headers = ['Key', 'Title', 'Status', 'Priority', 'Assignee', 'Estimated Hours', 'Logged Hours'];
    const rows = sprintIssues.map((i) => [
      i.key,
      `"${i.title.replace(/"/g, '""')}"`,
      i.status,
      i.priority,
      i.assignee?.fullName || 'Unassigned',
      i.estimatedHours || 0,
      i.loggedHours || 0,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sprint.name.replace(/\s+/g, '_')}_Sprint_Report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      bodyClassName="p-0 flex flex-col overflow-hidden"
      title={
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--md-sys-color-primary-container)] flex items-center justify-center text-[var(--md-sys-color-on-primary-container)] shrink-0">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-[var(--md-sys-color-on-surface)]">
                {sprint.name} Agile Flow & Analytics
              </span>
              <Badge variant="success" size="sm">
                {sprint.status}
              </Badge>
            </div>
            <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
              Measure team throughput, cumulative flow, cycle time percentiles, and delivery velocity.
            </span>
          </div>
        </div>
      }
    >
      {/* Tab Switcher */}
      <div className="px-6 pt-3 pb-1 bg-[var(--md-sys-color-surface-container)] shrink-0 overflow-x-auto scrollbar-none">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'BURNDOWN' | 'CFD' | 'CYCLE_TIME' | 'VELOCITY' | 'REPORT')}
        >
          <TabsList variant="pills" className="bg-transparent border-0 p-0 gap-1.5 flex-nowrap">
            <TabsTrigger
              value="BURNDOWN"
              variant="pills"
              size="sm"
              className="rounded-full gap-1.5 font-bold data-[state=active]:bg-[var(--md-sys-color-primary-container)] data-[state=active]:text-[var(--md-sys-color-on-primary-container)]"
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Burndown</span>
            </TabsTrigger>
            <TabsTrigger
              value="CFD"
              variant="pills"
              size="sm"
              className="rounded-full gap-1.5 font-bold data-[state=active]:bg-[var(--md-sys-color-primary-container)] data-[state=active]:text-[var(--md-sys-color-on-primary-container)]"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Cumulative Flow (CFD)</span>
            </TabsTrigger>
            <TabsTrigger
              value="CYCLE_TIME"
              variant="pills"
              size="sm"
              className="rounded-full gap-1.5 font-bold data-[state=active]:bg-[var(--md-sys-color-primary-container)] data-[state=active]:text-[var(--md-sys-color-on-primary-container)]"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Cycle Time & SLE</span>
            </TabsTrigger>
            <TabsTrigger
              value="VELOCITY"
              variant="pills"
              size="sm"
              className="rounded-full gap-1.5 font-bold data-[state=active]:bg-[var(--md-sys-color-primary-container)] data-[state=active]:text-[var(--md-sys-color-on-primary-container)]"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Velocity</span>
            </TabsTrigger>
            <TabsTrigger
              value="REPORT"
              variant="pills"
              size="sm"
              className="rounded-full gap-1.5 font-bold data-[state=active]:bg-[var(--md-sys-color-primary-container)] data-[state=active]:text-[var(--md-sys-color-on-primary-container)]"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Executive Report</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Modal Body */}
      <div className="p-6 overflow-y-auto min-h-0 flex-1 space-y-6">
        {/* TAB 1: BURNDOWN CURVE */}
        {activeTab === 'BURNDOWN' && (
          <div className="space-y-6">
            {/* High-Level Metric Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] space-y-1">
                <span className="text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider block">
                  Total Scope
                </span>
                <div className="text-2xl font-black text-[var(--md-sys-color-on-surface)]">
                  {totalScopeHours} <span className="text-xs font-normal text-[var(--md-sys-color-on-surface-variant)]">hrs</span>
                </div>
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                  {sprintIssues.length} estimated tickets
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] space-y-1">
                <span className="text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider block">
                  Delivered
                </span>
                <div className="text-2xl font-black text-[var(--md-sys-color-success)]">
                  {completedHours} <span className="text-xs font-normal text-[var(--md-sys-color-on-surface-variant)]">hrs</span>
                </div>
                <span className="text-[10px] text-[var(--md-sys-color-success)] font-bold">
                  {completionRate}% completed
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] space-y-1">
                <span className="text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider block">
                  Remaining
                </span>
                <div className="text-2xl font-black text-[var(--md-sys-color-primary)]">
                  {remainingHours} <span className="text-xs font-normal text-[var(--md-sys-color-on-surface-variant)]">hrs</span>
                </div>
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                  {sprintIssues.length - completedIssues.length} pending tasks
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] space-y-1">
                <span className="text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider block">
                  Work Logged
                </span>
                <div className="text-2xl font-black text-[var(--md-sys-color-tertiary)]">
                  {totalLoggedHours} <span className="text-xs font-normal text-[var(--md-sys-color-on-surface-variant)]">hrs</span>
                </div>
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                  From team worklogs
                </span>
              </div>
            </div>

            {/* Interactive SVG Burndown Chart */}
            <div className="p-5 rounded-3xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                  <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                    Sprint Burndown Curve (Ideal vs. Actual Effort)
                  </h3>
                  {isBurndownLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--md-sys-color-primary)]" />
                  ) : (
                    <Badge variant={hasLiveSnapshots ? 'success' : 'neutral'} size="sm">
                      {hasLiveSnapshots ? 'Daily Snapshots' : 'Baseline Projection'}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5 text-[var(--md-sys-color-on-surface-variant)]">
                    <span className="w-3 h-0.5 border-t-2 border-dashed border-slate-400 block" />
                    <span>Ideal Guideline</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[var(--md-sys-color-primary)] font-semibold">
                    <span className="w-3 h-1 bg-[var(--md-sys-color-primary)] rounded-full block" />
                    <span>Actual Remaining</span>
                  </div>
                </div>
              </div>

              {/* SVG Visualizer */}
              <div className="w-full overflow-x-auto">
                <svg viewBox="0 0 600 240" className="w-full h-56 select-none font-mono text-[10px]">
                  {/* Background Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const y = 30 + ratio * 180;
                    const val = Math.round(maxH * (1 - ratio));
                    return (
                      <g key={ratio}>
                        <line
                          x1="40"
                          y1={y}
                          x2="560"
                          y2={y}
                          stroke="currentColor"
                          className="text-[var(--md-sys-color-outline-variant)] opacity-40"
                          strokeDasharray="2 2"
                        />
                        <text x="32" y={y + 3} textAnchor="end" fill="currentColor" className="text-[var(--md-sys-color-on-surface-variant)] text-[9px]">
                          {val}h
                        </text>
                      </g>
                    );
                  })}

                  {/* Day Vertical Ticks */}
                  {burndownPoints.map((p, idx) => {
                    const x = toX(idx);
                    return (
                      <g key={p.day}>
                        <line
                          x1={x}
                          y1="30"
                          x2={x}
                          y2="210"
                          stroke="currentColor"
                          className="text-[var(--md-sys-color-outline-variant)] opacity-20"
                        />
                        <text x={x} y="226" textAnchor="middle" fill="currentColor" className="text-[var(--md-sys-color-on-surface-variant)] text-[9px]">
                          {p.day}
                        </text>
                      </g>
                    );
                  })}

                  {/* Ideal Burndown Path (Dashed) */}
                  <path
                    d={idealPath}
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                  />

                  {/* Actual Burndown Path (Solid Glow) */}
                  <path
                    d={actualPath}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  {/* Dots for actual points */}
                  {actualActivePoints.map((p) => (
                    <circle
                      key={p.day}
                      cx={toX(p.originalIdx)}
                      cy={toY(p.actualHours!)}
                      r="4.5"
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      className="hover:scale-125 transition-transform cursor-pointer"
                    >
                      <title>{`${p.day}: ${p.actualHours}h remaining (Ideal: ${p.idealHours}h)`}</title>
                    </circle>
                  ))}
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CUMULATIVE FLOW DIAGRAM (CFD) */}
        {activeTab === 'CFD' && (
          <div className="space-y-6">
            {/* CFD Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] space-y-1">
                <span className="text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider block">
                  Total Scope
                </span>
                <div className="text-2xl font-black text-[var(--md-sys-color-on-surface)]">
                  {sprintIssues.length} <span className="text-xs font-normal text-[var(--md-sys-color-on-surface-variant)]">tickets</span>
                </div>
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                  Full backlog commitment
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] space-y-1">
                <span className="text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider block">
                  Active WIP
                </span>
                <div className="text-2xl font-black text-[var(--md-sys-color-primary)]">
                  {inProgressIssues.length} <span className="text-xs font-normal text-[var(--md-sys-color-on-surface-variant)]">tickets</span>
                </div>
                <span className="text-[10px] text-[var(--md-sys-color-primary)] font-semibold">
                  In Progress & Code Review
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] space-y-1">
                <span className="text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider block">
                  Completed Flow
                </span>
                <div className="text-2xl font-black text-[var(--md-sys-color-success)]">
                  {completedIssues.length} <span className="text-xs font-normal text-[var(--md-sys-color-on-surface-variant)]">tickets</span>
                </div>
                <span className="text-[10px] text-[var(--md-sys-color-success)] font-semibold">
                  Resolved or Closed
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] space-y-1">
                <span className="text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider block">
                  Flow Efficiency
                </span>
                <div className="text-2xl font-black text-[var(--md-sys-color-tertiary)]">
                  {sprintIssues.length > 0 ? Math.round((completedIssues.length / sprintIssues.length) * 100) : 0}%
                </div>
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                  Throughput / Scope ratio
                </span>
              </div>
            </div>

            {/* CFD Stacked Chart */}
            <div className="p-5 rounded-3xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                  <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                    Cumulative Flow Diagram (CFD)
                  </h3>
                  {isFlowMetricsLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--md-sys-color-primary)]" />
                  ) : (
                    <Badge variant="success" size="sm">
                      {cfdPoints.length} Days Timeline
                    </Badge>
                  )}
                </div>

                {/* Status Legend */}
                <div className="flex flex-wrap items-center gap-3 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Closed</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                    <span>Resolved</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    <span>Review</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span>In Progress</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    <span>To Do</span>
                  </div>
                </div>
              </div>

              {/* CFD SVG Visualization */}
              <div className="w-full overflow-x-auto">
                {cfdPoints.length === 0 ? (
                  <div className="py-16 text-center text-xs text-[var(--md-sys-color-on-surface-variant)]">
                    No cumulative flow snapshots recorded for this sprint yet.
                  </div>
                ) : (
                  <svg viewBox="0 0 700 260" className="w-full h-64 select-none font-mono text-[10px]">
                    {/* Y-axis Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                      const y = 30 + ratio * 190;
                      const val = Math.round(maxCfdTotal * (1 - ratio));
                      return (
                        <g key={ratio}>
                          <line
                            x1="45"
                            y1={y}
                            x2="665"
                            y2={y}
                            stroke="currentColor"
                            className="text-[var(--md-sys-color-outline-variant)] opacity-30"
                            strokeDasharray="2 2"
                          />
                          <text x="36" y={y + 3} textAnchor="end" fill="currentColor" className="text-[var(--md-sys-color-on-surface-variant)] text-[9px]">
                            {val}
                          </text>
                        </g>
                      );
                    })}

                    {/* Stacked Areas rendered as polygon layers */}
                    {/* Layer 1: Closed (bottom) */}
                    <polygon
                      points={`${toCfdX(0)},230 ${cfdPoints.map((p, idx) => `${toCfdX(idx)},${toCfdY(p.closed)}`).join(' ')} ${toCfdX(cfdPoints.length - 1)},230`}
                      fill="#10b981"
                      fillOpacity="0.4"
                    />
                    {/* Layer 2: Resolved */}
                    <polygon
                      points={`${toCfdX(0)},${toCfdY(cfdPoints[0]?.closed ?? 0)} ${cfdPoints.map((p, idx) => `${toCfdX(idx)},${toCfdY(p.closed + p.resolved)}`).join(' ')} ${cfdPoints.slice().reverse().map((p, revIdx) => {
                        const originalIdx = cfdPoints.length - 1 - revIdx;
                        return `${toCfdX(originalIdx)},${toCfdY(p.closed)}`;
                      }).join(' ')}`}
                      fill="#06b6d4"
                      fillOpacity="0.35"
                    />
                    {/* Layer 3: Code Review */}
                    <polygon
                      points={`${toCfdX(0)},${toCfdY((cfdPoints[0]?.closed ?? 0) + (cfdPoints[0]?.resolved ?? 0))} ${cfdPoints.map((p, idx) => `${toCfdX(idx)},${toCfdY(p.closed + p.resolved + p.review)}`).join(' ')} ${cfdPoints.slice().reverse().map((p, revIdx) => {
                        const originalIdx = cfdPoints.length - 1 - revIdx;
                        return `${toCfdX(originalIdx)},${toCfdY(p.closed + p.resolved)}`;
                      }).join(' ')}`}
                      fill="#a855f7"
                      fillOpacity="0.3"
                    />
                    {/* Layer 4: In Progress */}
                    <polygon
                      points={`${toCfdX(0)},${toCfdY((cfdPoints[0]?.closed ?? 0) + (cfdPoints[0]?.resolved ?? 0) + (cfdPoints[0]?.review ?? 0))} ${cfdPoints.map((p, idx) => `${toCfdX(idx)},${toCfdY(p.closed + p.resolved + p.review + p.inProgress)}`).join(' ')} ${cfdPoints.slice().reverse().map((p, revIdx) => {
                        const originalIdx = cfdPoints.length - 1 - revIdx;
                        return `${toCfdX(originalIdx)},${toCfdY(p.closed + p.resolved + p.review)}`;
                      }).join(' ')}`}
                      fill="#3b82f6"
                      fillOpacity="0.3"
                    />
                    {/* Layer 5: To Do / Open (top) */}
                    <polygon
                      points={`${toCfdX(0)},${toCfdY((cfdPoints[0]?.closed ?? 0) + (cfdPoints[0]?.resolved ?? 0) + (cfdPoints[0]?.review ?? 0) + (cfdPoints[0]?.inProgress ?? 0))} ${cfdPoints.map((p, idx) => `${toCfdX(idx)},${toCfdY(p.total)}`).join(' ')} ${cfdPoints.slice().reverse().map((p, revIdx) => {
                        const originalIdx = cfdPoints.length - 1 - revIdx;
                        return `${toCfdX(originalIdx)},${toCfdY(p.closed + p.resolved + p.review + p.inProgress)}`;
                      }).join(' ')}`}
                      fill="#94a3b8"
                      fillOpacity="0.25"
                    />

                    {/* Outlines of top scope curve */}
                    <path
                      d={cfdPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${toCfdX(idx)} ${toCfdY(p.total)}`).join(' ')}
                      fill="none"
                      stroke="#64748b"
                      strokeWidth="1.5"
                    />

                    {/* Bottom Day Ticks */}
                    {cfdPoints.map((p, idx) => {
                      const x = toCfdX(idx);
                      return (
                        <g key={p.date}>
                          <line
                            x1={x}
                            y1="30"
                            x2={x}
                            y2="230"
                            stroke="currentColor"
                            className="text-[var(--md-sys-color-outline-variant)] opacity-15"
                          />
                          <text x={x} y="246" textAnchor="middle" fill="currentColor" className="text-[var(--md-sys-color-on-surface-variant)] text-[9px]">
                            {p.dayLabel}
                          </text>
                          {/* Point marker showing tooltip */}
                          <circle
                            cx={x}
                            cy={toCfdY(p.total)}
                            r="3"
                            fill="#64748b"
                            className="hover:scale-150 transition-transform cursor-pointer"
                          >
                            <title>{`${p.dayLabel} (${p.date}):\nTotal: ${p.total}\nClosed: ${p.closed}\nResolved: ${p.resolved}\nReview: ${p.review}\nIn Progress: ${p.inProgress}\nTo Do: ${p.open}`}</title>
                          </circle>
                        </g>
                      );
                    })}
                  </svg>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CYCLE TIME & SLE CONTROL CHART */}
        {activeTab === 'CYCLE_TIME' && (
          <div className="space-y-6">
            {/* Percentile Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] space-y-1">
                <span className="text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider block">
                  P50 (Median Cycle)
                </span>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {cycleTimeSummary?.p50CycleTimeDays ?? 0} <span className="text-xs font-normal text-[var(--md-sys-color-on-surface-variant)]">days</span>
                </div>
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                  50% of tasks completed within
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] space-y-1">
                <span className="text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider block">
                  P85 Target (SLE)
                </span>
                <div className="text-2xl font-black text-[var(--md-sys-color-primary)]">
                  {cycleTimeSummary?.p85CycleTimeDays ?? 0} <span className="text-xs font-normal text-[var(--md-sys-color-on-surface-variant)]">days</span>
                </div>
                <span className="text-[10px] text-[var(--md-sys-color-primary)] font-semibold">
                  Service level expectation
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] space-y-1">
                <span className="text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider block">
                  P95 Outlier Limit
                </span>
                <div className="text-2xl font-black text-[var(--md-sys-color-error)]">
                  {cycleTimeSummary?.p95CycleTimeDays ?? 0} <span className="text-xs font-normal text-[var(--md-sys-color-on-surface-variant)]">days</span>
                </div>
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                  95th percentile upper bound
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] space-y-1">
                <span className="text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider block">
                  Avg. Lead Time
                </span>
                <div className="text-2xl font-black text-[var(--md-sys-color-tertiary)]">
                  {cycleTimeSummary?.averageLeadTimeDays ?? 0} <span className="text-xs font-normal text-[var(--md-sys-color-on-surface-variant)]">days</span>
                </div>
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                  Creation to final delivery
                </span>
              </div>
            </div>

            {/* Scatter Plot Visualizer */}
            <div className="p-5 rounded-3xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                  <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                    Cycle Time Scatter Plot & SLE Control Bands
                  </h3>
                  {isFlowMetricsLoading && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--md-sys-color-primary)]" />
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs font-semibold">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <span className="w-3 h-0.5 border-t-2 border-dashed border-emerald-500 block" />
                    <span>P50 ({cycleTimeSummary?.p50CycleTimeDays ?? 0}d)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[var(--md-sys-color-primary)]">
                    <span className="w-3 h-0.5 border-t-2 border-dashed border-[var(--md-sys-color-primary)] block" />
                    <span>P85 ({cycleTimeSummary?.p85CycleTimeDays ?? 0}d)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[var(--md-sys-color-error)]">
                    <span className="w-3 h-0.5 border-t-2 border-dashed border-[var(--md-sys-color-error)] block" />
                    <span>P95 ({cycleTimeSummary?.p95CycleTimeDays ?? 0}d)</span>
                  </div>
                </div>
              </div>

              {/* Scatter Plot Chart */}
              <div className="w-full overflow-x-auto">
                {cycleTimeItems.length === 0 ? (
                  <div className="py-16 text-center text-xs text-[var(--md-sys-color-on-surface-variant)]">
                    No resolved or closed issues found in this sprint to plot cycle times.
                  </div>
                ) : (
                  <svg viewBox="0 0 700 240" className="w-full h-56 select-none font-mono text-[10px]">
                    {/* Y-axis Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                      const y = 25 + ratio * 180;
                      const val = Number((maxCycleDays * (1 - ratio)).toFixed(1));
                      return (
                        <g key={ratio}>
                          <line
                            x1="45"
                            y1={y}
                            x2="665"
                            y2={y}
                            stroke="currentColor"
                            className="text-[var(--md-sys-color-outline-variant)] opacity-30"
                            strokeDasharray="2 2"
                          />
                          <text x="36" y={y + 3} textAnchor="end" fill="currentColor" className="text-[var(--md-sys-color-on-surface-variant)] text-[9px]">
                            {val}d
                          </text>
                        </g>
                      );
                    })}

                    {/* Horizontal Control Lines (P50, P85, P95) */}
                    {cycleTimeSummary && (
                      <>
                        {/* P50 line */}
                        <line
                          x1="45"
                          y1={205 - (cycleTimeSummary.p50CycleTimeDays / maxCycleDays) * 180}
                          x2="665"
                          y2={205 - (cycleTimeSummary.p50CycleTimeDays / maxCycleDays) * 180}
                          stroke="#10b981"
                          strokeWidth="1.5"
                          strokeDasharray="4 3"
                        />
                        {/* P85 line */}
                        <line
                          x1="45"
                          y1={205 - (cycleTimeSummary.p85CycleTimeDays / maxCycleDays) * 180}
                          x2="665"
                          y2={205 - (cycleTimeSummary.p85CycleTimeDays / maxCycleDays) * 180}
                          stroke="#3b82f6"
                          strokeWidth="1.5"
                          strokeDasharray="4 3"
                        />
                        {/* P95 line */}
                        <line
                          x1="45"
                          y1={205 - (cycleTimeSummary.p95CycleTimeDays / maxCycleDays) * 180}
                          x2="665"
                          y2={205 - (cycleTimeSummary.p95CycleTimeDays / maxCycleDays) * 180}
                          stroke="#ef4444"
                          strokeWidth="1.5"
                          strokeDasharray="4 3"
                        />
                      </>
                    )}

                    {/* Scatter Points */}
                    {cycleTimeItems.map((item, idx) => {
                      const count = Math.max(cycleTimeItems.length, 2);
                      const x = 55 + (idx / (count - 1)) * 590;
                      const y = 205 - (item.cycleTimeDays / maxCycleDays) * 180;
                      const isHigh = item.cycleTimeDays > (cycleTimeSummary?.p85CycleTimeDays ?? 999);

                      return (
                        <g key={item.issueId}>
                          <circle
                            cx={x}
                            cy={y}
                            r="5"
                            fill={isHigh ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-primary)'}
                            stroke="#ffffff"
                            strokeWidth="1.5"
                            className="hover:scale-150 transition-transform cursor-pointer"
                          >
                            <title>{`${item.key}: ${item.title}\nCycle Time: ${item.cycleTimeDays} days\nLead Time: ${item.leadTimeDays} days\nPriority: ${item.priority}`}</title>
                          </circle>
                          <text x={x} y="222" textAnchor="middle" fill="currentColor" className="text-[var(--md-sys-color-on-surface-variant)] text-[8px] font-mono">
                            {item.key}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                )}
              </div>
            </div>

            {/* List of completed tickets and their cycle durations */}
            <div className="rounded-2xl border border-[var(--md-sys-color-outline-variant)] overflow-hidden bg-[var(--md-sys-color-surface)]">
              <div className="px-4 py-3 bg-[var(--md-sys-color-surface-container)] border-b border-[var(--md-sys-color-outline-variant)] font-bold text-xs text-[var(--md-sys-color-on-surface)] flex items-center justify-between">
                <span>Completed Tickets Duration Breakdown</span>
                <span className="text-[11px] font-normal text-[var(--md-sys-color-on-surface-variant)]">
                  {cycleTimeItems.length} delivered tasks
                </span>
              </div>
              <div className="max-h-56 overflow-y-auto divide-y divide-[var(--md-sys-color-outline-variant)]">
                {cycleTimeItems.map((item) => (
                  <div key={item.issueId} className="flex items-center justify-between p-3 text-xs hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors">
                    <div className="flex items-center gap-2 min-w-0 pr-3">
                      <span className="font-mono font-bold text-[var(--md-sys-color-primary)]">{item.key}</span>
                      <span className="font-semibold text-[var(--md-sys-color-on-surface)] truncate">{item.title}</span>
                      <Badge variant={getPriorityBadgeVariant(item.priority)} size="sm">
                        {item.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-right">
                      <div>
                        <div className="font-mono font-bold text-[var(--md-sys-color-on-surface)]">{item.cycleTimeDays}d cycle</div>
                        <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">{item.leadTimeDays}d lead</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TEAM VELOCITY */}
        {activeTab === 'VELOCITY' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                  Historical Sprint Velocity & Throughput
                </h3>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                  Compares committed hours vs. delivered hours across consecutive sprints.
                </p>
              </div>
              <div className="px-3.5 py-1.5 rounded-xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] text-xs font-bold">
                Avg. Velocity: {avgVelocity} hrs / sprint
              </div>
            </div>

            {/* Bar Chart Representation */}
            <div className="p-5 rounded-3xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] space-y-4">
              <div className="space-y-3">
                {velocityData.map((v) => {
                  const maxBarVal = Math.max(...velocityData.map((x) => Math.max(x.planned, x.delivered)), 10);
                  const plannedWidth = Math.round((v.planned / maxBarVal) * 100);
                  const deliveredWidth = Math.round((v.delivered / maxBarVal) * 100);

                  return (
                    <div key={v.name} className="space-y-1.5 p-3 rounded-2xl bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[var(--md-sys-color-on-surface)]">{v.name}</span>
                        <span className="text-[10px] uppercase font-bold text-[var(--md-sys-color-on-surface-variant)]">
                          {v.status}
                        </span>
                      </div>

                      {/* Planned Bar */}
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                          <span>Committed Scope:</span>
                          <span className="font-semibold">{v.planned} hrs</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[var(--md-sys-color-secondary-container)] overflow-hidden">
                          <div className="h-full bg-[var(--md-sys-color-secondary)] rounded-full" style={{ width: `${plannedWidth}%` }} />
                        </div>
                      </div>

                      {/* Delivered Bar */}
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-[10px] text-[var(--md-sys-color-success)] font-bold">
                          <span>Delivered Effort:</span>
                          <span className="font-bold">{v.delivered} hrs</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[var(--md-sys-color-success-container)] overflow-hidden">
                          <div className="h-full bg-[var(--md-sys-color-success)] rounded-full" style={{ width: `${deliveredWidth}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: EXECUTIVE REPORT */}
        {activeTab === 'REPORT' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                  Stakeholder Agile Sprint Report
                </h3>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                  Summary breakdown for management and sprint retrospective.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                >
                  Export CSV
                </Button>
                <Button
                  type="button"
                  variant="filled"
                  size="sm"
                  onClick={() => window.print()}
                  leftIcon={<Printer className="w-3.5 h-3.5" />}
                >
                  Print Summary
                </Button>
              </div>
            </div>

            {/* Table of tickets in sprint */}
            <div className="rounded-2xl border border-[var(--md-sys-color-outline-variant)] overflow-hidden bg-[var(--md-sys-color-surface)]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] font-semibold">
                    <th className="p-3">Key</th>
                    <th className="p-3">Title</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Priority</th>
                    <th className="p-3">Assignee</th>
                    <th className="p-3 text-right">Est.</th>
                    <th className="p-3 text-right">Logged</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]">
                  {sprintIssues.map((issue) => (
                    <tr key={issue.id} className="hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors">
                      <td className="p-3 font-mono font-bold text-[var(--md-sys-color-primary)]">{issue.key}</td>
                      <td className="p-3 font-semibold text-[var(--md-sys-color-on-surface)] truncate max-w-[240px]">
                        {issue.title}
                      </td>
                      <td className="p-3">
                        <Badge variant={getStatusBadgeVariant(issue.status)} size="sm">
                          {issue.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant={getPriorityBadgeVariant(issue.priority)} size="sm">
                          {issue.priority}
                        </Badge>
                      </td>
                      <td className="p-3 text-[var(--md-sys-color-on-surface-variant)]">
                        {issue.assignee?.fullName || 'Unassigned'}
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-[var(--md-sys-color-on-surface)]">
                        {issue.estimatedHours || 0}h
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-[var(--md-sys-color-success)]">
                        {issue.loggedHours || 0}h
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

