import React from 'react';
import type { IssueItem } from '../../../api/client';
import { Badge } from '../../ui';
import { Layers, Loader2 } from 'lucide-react';

interface CfdPoint {
  date: string;
  dayLabel: string;
  total: number;
  open: number;
  inProgress: number;
  review: number;
  resolved: number;
  closed: number;
}

interface SprintCfdChartProps {
  sprintIssues: IssueItem[];
  cfdPoints?: CfdPoint[];
  isLoading?: boolean;
}

export const SprintCfdChart: React.FC<SprintCfdChartProps> = ({
  sprintIssues,
  cfdPoints = [],
  isLoading,
}) => {
  const inProgressIssues = sprintIssues.filter((i) => i.status === 'IN_PROGRESS' || i.status === 'REVIEW');
  const completedIssues = sprintIssues.filter((i) => i.status === 'RESOLVED' || i.status === 'CLOSED');

  const maxCfdTotal = Math.max(...cfdPoints.map((p) => p.total), sprintIssues.length, 1);
  const numCfdPoints = Math.max(cfdPoints.length, 2);
  const toCfdX = (idx: number) => 45 + (idx / (numCfdPoints - 1)) * 610;
  const toCfdY = (val: number) => 230 - (val / maxCfdTotal) * 190;

  return (
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
            {isLoading ? (
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

        <div className="w-full overflow-x-auto">
          {cfdPoints.length === 0 ? (
            <div className="py-16 text-center text-xs text-[var(--md-sys-color-on-surface-variant)]">
              No cumulative flow snapshots recorded for this sprint yet.
            </div>
          ) : (
            <svg viewBox="0 0 700 260" className="w-full h-64 select-none font-mono text-[10px]">
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

              {/* Layer 1: Closed */}
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
              {/* Layer 5: To Do */}
              <polygon
                points={`${toCfdX(0)},${toCfdY((cfdPoints[0]?.closed ?? 0) + (cfdPoints[0]?.resolved ?? 0) + (cfdPoints[0]?.review ?? 0) + (cfdPoints[0]?.inProgress ?? 0))} ${cfdPoints.map((p, idx) => `${toCfdX(idx)},${toCfdY(p.total)}`).join(' ')} ${cfdPoints.slice().reverse().map((p, revIdx) => {
                  const originalIdx = cfdPoints.length - 1 - revIdx;
                  return `${toCfdX(originalIdx)},${toCfdY(p.closed + p.resolved + p.review + p.inProgress)}`;
                }).join(' ')}`}
                fill="#94a3b8"
                fillOpacity="0.25"
              />

              <path
                d={cfdPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${toCfdX(idx)} ${toCfdY(p.total)}`).join(' ')}
                fill="none"
                stroke="#64748b"
                strokeWidth="1.5"
              />

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
  );
};
