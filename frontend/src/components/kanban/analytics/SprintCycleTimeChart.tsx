import React from 'react';
import { PriorityBadge } from '../../ui';
import { Clock, Loader2 } from 'lucide-react';

interface CycleTimeItem {
  issueId: number;
  key: string;
  title: string;
  priority: string;
  cycleTimeDays: number;
  leadTimeDays: number;
}

interface SprintCycleTimeChartProps {
  cycleTimeSummary?: {
    p50CycleTimeDays: number;
    p85CycleTimeDays: number;
    p95CycleTimeDays: number;
    averageLeadTimeDays: number;
    items?: CycleTimeItem[];
  };
  isLoading?: boolean;
}

export const SprintCycleTimeChart: React.FC<SprintCycleTimeChartProps> = ({
  cycleTimeSummary,
  isLoading,
}) => {
  const cycleTimeItems = cycleTimeSummary?.items ?? [];
  const maxCycleDays = Math.max(
    cycleTimeSummary?.p95CycleTimeDays ?? 1,
    ...cycleTimeItems.map((i) => i.cycleTimeDays),
    5,
  );

  return (
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
            {isLoading && (
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

        <div className="w-full overflow-x-auto">
          {cycleTimeItems.length === 0 ? (
            <div className="py-16 text-center text-xs text-[var(--md-sys-color-on-surface-variant)]">
              No resolved or closed issues found in this sprint to plot cycle times.
            </div>
          ) : (
            <svg viewBox="0 0 700 240" className="w-full h-56 select-none font-mono text-[10px]">
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

              {cycleTimeSummary && (
                <>
                  <line
                    x1="45"
                    y1={205 - (cycleTimeSummary.p50CycleTimeDays / maxCycleDays) * 180}
                    x2="665"
                    y2={205 - (cycleTimeSummary.p50CycleTimeDays / maxCycleDays) * 180}
                    stroke="#10b981"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                  />
                  <line
                    x1="45"
                    y1={205 - (cycleTimeSummary.p85CycleTimeDays / maxCycleDays) * 180}
                    x2="665"
                    y2={205 - (cycleTimeSummary.p85CycleTimeDays / maxCycleDays) * 180}
                    stroke="#3b82f6"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                  />
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

      {/* Completed Tickets Duration Breakdown */}
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
                <PriorityBadge priority={item.priority as any} size="xs" />
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
  );
};
