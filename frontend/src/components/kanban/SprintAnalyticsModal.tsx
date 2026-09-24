import React, { useState } from 'react';
import type { IssueItem } from '../../api/client';
import { Modal, Button, Badge } from '../ui';
import {
  TrendingDown,
  BarChart3,
  Download,
  Printer,
  FileSpreadsheet,
} from 'lucide-react';

interface SprintDefinition {
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'PLANNED' | 'COMPLETED';
}

interface SprintAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sprint: SprintDefinition;
  sprintIssues: IssueItem[];
  allSprints: Record<string, SprintDefinition>;
  allIssues: IssueItem[];
}

export const SprintAnalyticsModal: React.FC<SprintAnalyticsModalProps> = ({
  isOpen,
  onClose,
  sprint,
  sprintIssues,
  allSprints,
  allIssues,
}) => {
  const [activeTab, setActiveTab] = useState<'BURNDOWN' | 'VELOCITY' | 'REPORT'>('BURNDOWN');

  if (!isOpen) return null;

  // Metric computations
  const totalScopeHours = sprintIssues.reduce((acc, i) => acc + (i.estimatedHours || 0), 0);
  const totalLoggedHours = sprintIssues.reduce((acc, i) => acc + (i.loggedHours || 0), 0);
  const completedIssues = sprintIssues.filter((i) => i.status === 'RESOLVED' || i.status === 'CLOSED');
  const completedHours = completedIssues.reduce((acc, i) => acc + (i.estimatedHours || 0), 0);
  const remainingHours = Math.max(0, totalScopeHours - completedHours);
  const completionRate = totalScopeHours > 0 ? Math.round((completedHours / totalScopeHours) * 100) : 0;

  // Generate 10 discrete sprint interval points for Burndown SVG
  const sprintDays = 10;
  const burndownPoints = Array.from({ length: sprintDays + 1 }, (_, index) => {
    const dayRatio = index / sprintDays;
    const idealHours = Number((totalScopeHours * (1 - dayRatio)).toFixed(1));

    // Simulate real burn curve based on completed hours progression
    let actualHours: number | null = null;
    if (index === 0) {
      actualHours = totalScopeHours;
    } else if (index <= Math.min(6, sprintDays)) {
      const burnProgress = (index / 6) * (completedHours / Math.max(1, totalScopeHours));
      actualHours = Number((totalScopeHours - totalScopeHours * burnProgress).toFixed(1));
    }
    return { day: `Day ${index + 1}`, idealHours, actualHours };
  });

  // Calculate coordinates for SVG viewBox 0 0 600 240
  const maxH = Math.max(totalScopeHours, 10);
  const toY = (val: number) => 210 - (val / maxH) * 180;
  const toX = (idx: number) => 40 + (idx / sprintDays) * 520;

  // Ideal path
  const idealPath = burndownPoints
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${toX(idx)} ${toY(p.idealHours)}`)
    .join(' ');

  // Actual path
  const actualActivePoints = burndownPoints.filter((p) => p.actualHours !== null);
  const actualPath = actualActivePoints
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${toX(idx)} ${toY(p.actualHours!)}`)
    .join(' ');

  // Historical Sprint Velocity calculation
  const velocityData = Object.keys(allSprints).map((sprintKey) => {
    const sprintDef = allSprints[sprintKey];
    const sIssues = allIssues.filter((i) => i.sprint === sprintKey);
    const planned = sIssues.reduce((acc, i) => acc + (i.estimatedHours || 0), 0);
    const delivered = sIssues
      .filter((i) => i.status === 'RESOLVED' || i.status === 'CLOSED')
      .reduce((acc, i) => acc + (i.estimatedHours || 0), 0);
    return {
      name: sprintKey,
      status: sprintDef.status,
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      title={
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--md-sys-color-primary-container)] flex items-center justify-center text-[var(--md-sys-color-on-primary-container)] shrink-0">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-[var(--md-sys-color-on-surface)]">
                {sprint.name} Agile Analytics & Burndown
              </span>
              <Badge variant="success" size="sm">
                {sprint.status}
              </Badge>
            </div>
            <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
              Measure effort delivery velocity, ideal vs. actual burndown, and team throughput.
            </span>
          </div>
        </div>
      }
    >
      <div className="flex flex-col overflow-hidden -mx-6 -my-6">

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
          <button
            type="button"
            onClick={() => setActiveTab('BURNDOWN')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'BURNDOWN'
                ? 'border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container-high)]'
                : 'border-transparent text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Burndown Curve</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('VELOCITY')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'VELOCITY'
                ? 'border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container-high)]'
                : 'border-transparent text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Team Velocity</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('REPORT')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'REPORT'
                ? 'border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container-high)]'
                : 'border-transparent text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Executive Report</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
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
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {completedHours} <span className="text-xs font-normal text-[var(--md-sys-color-on-surface-variant)]">hrs</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                    {completionRate}% completed
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] space-y-1">
                  <span className="text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider block">
                    Remaining
                  </span>
                  <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
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
                  <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
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
                    {actualActivePoints.map((p, idx) => (
                      <circle
                        key={p.day}
                        cx={toX(idx)}
                        cy={toY(p.actualHours!)}
                        r="4.5"
                        fill="#10b981"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        className="hover:scale-125 transition-transform cursor-pointer"
                      />
                    ))}
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TEAM VELOCITY */}
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
                          <div className="w-full h-2 rounded-full bg-slate-500/20 overflow-hidden">
                            <div className="h-full bg-slate-400 rounded-full" style={{ width: `${plannedWidth}%` }} />
                          </div>
                        </div>

                        {/* Delivered Bar */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[10px] text-emerald-600 dark:text-emerald-400">
                            <span>Delivered Effort:</span>
                            <span className="font-bold">{v.delivered} hrs</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-emerald-500/20 overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${deliveredWidth}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EXECUTIVE REPORT */}
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
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)]">
                            {issue.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            issue.priority === 'CRITICAL'
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                              : issue.priority === 'HIGH'
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                              : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                          }`}>
                            {issue.priority}
                          </span>
                        </td>
                        <td className="p-3 text-[var(--md-sys-color-on-surface-variant)]">
                          {issue.assignee?.fullName || 'Unassigned'}
                        </td>
                        <td className="p-3 text-right font-mono font-semibold text-[var(--md-sys-color-on-surface)]">
                          {issue.estimatedHours || 0}h
                        </td>
                        <td className="p-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
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
      </div>
    </Modal>
  );
};
