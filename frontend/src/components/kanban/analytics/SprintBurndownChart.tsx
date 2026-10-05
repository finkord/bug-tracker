import React, { useMemo } from 'react';
import { api, type IssueItem } from '../../../api/client.js';
import { Badge } from '../../ui';
import { TrendingDown, Loader2 } from 'lucide-react';

export type SprintBurndownData = Awaited<ReturnType<typeof api.getSprintBurndown>>;

interface SprintBurndownChartProps {
  sprintIssues: IssueItem[];
  burndownData?: SprintBurndownData;
  isLoading?: boolean;
}

export const SprintBurndownChart: React.FC<SprintBurndownChartProps> = ({
  sprintIssues,
  burndownData,
  isLoading,
}) => {
  const totalScopeHours = burndownData?.totalScopeHours ?? sprintIssues.reduce((acc, i) => acc + (i.estimatedHours || 0), 0);
  const totalLoggedHours = sprintIssues.reduce((acc, i) => acc + (i.loggedHours || 0), 0);
  const completedIssues = sprintIssues.filter((i) => i.status === 'RESOLVED' || i.status === 'CLOSED');
  const completedHours = burndownData?.completedHours ?? completedIssues.reduce((acc, i) => acc + (i.estimatedHours || 0), 0);
  const remainingHours = burndownData?.remainingHours ?? Math.max(0, totalScopeHours - completedHours);
  const completionRate = totalScopeHours > 0 ? Math.round((completedHours / totalScopeHours) * 100) : 0;

  const hasLiveSnapshots = Boolean(burndownData?.points && burndownData.points.length > 0);

  const burndownPoints = useMemo(() => {
    if (hasLiveSnapshots && burndownData?.points) {
      return burndownData.points.map((p, idx) => {
        let dayLabel = p.dayLabel || `Day ${idx + 1}`;
        try {
          const d = new Date(p.date);
          if (!isNaN(d.getTime())) {
            dayLabel = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          }
        } catch {}
        return {
          day: dayLabel,
          idealHours: p.idealHours ?? p.idealRemainingHours ?? 0,
          actualHours: p.remainingHours ?? p.actualRemainingHours ?? null,
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

  const numPoints = Math.max(burndownPoints.length, 2);
  const maxH = Math.max(
    totalScopeHours,
    ...burndownPoints.map((p) => Math.max(p.idealHours, p.actualHours || 0)),
    10,
  );
  const toY = (val: number) => 210 - (val / maxH) * 180;
  const toX = (idx: number) => 40 + (idx / (numPoints - 1)) * 520;

  const idealPath = burndownPoints
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${toX(idx)} ${toY(p.idealHours)}`)
    .join(' ');

  const actualActivePoints = burndownPoints
    .map((p, originalIdx) => ({ ...p, originalIdx }))
    .filter((p) => p.actualHours !== null);
  const actualPath = actualActivePoints
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${toX(p.originalIdx)} ${toY(p.actualHours!)}`)
    .join(' ');

  return (
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

      {/* SVG Burndown Chart */}
      <div className="p-5 rounded-3xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
            <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
              Sprint Burndown Curve (Ideal vs. Actual Effort)
            </h3>
            {isLoading ? (
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

        <div className="w-full overflow-x-auto">
          <svg viewBox="0 0 600 240" className="w-full h-56 select-none font-mono text-[10px]">
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
                  <text x={x} y={226} textAnchor="middle" fill="currentColor" className="text-[var(--md-sys-color-on-surface-variant)] text-[9px]">
                    {p.day}
                  </text>
                </g>
              );
            })}

            <path
              d={idealPath}
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2"
              strokeDasharray="6 4"
            />

            <path
              d={actualPath}
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              strokeLinecap="round"
            />

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
  );
};
