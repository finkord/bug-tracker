import React from 'react';

interface VelocityEntry {
  name: string;
  status: string;
  planned: number;
  delivered: number;
}

interface SprintVelocityChartProps {
  velocityData: VelocityEntry[];
  avgVelocity: number;
}

export const SprintVelocityChart: React.FC<SprintVelocityChartProps> = ({
  velocityData,
  avgVelocity,
}) => {
  return (
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

                <div className="space-y-0.5">
                  <div className="flex justify-between text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                    <span>Committed Scope:</span>
                    <span className="font-semibold">{v.planned} hrs</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--md-sys-color-secondary-container)] overflow-hidden">
                    <div className="h-full bg-[var(--md-sys-color-secondary)] rounded-full" style={{ width: `${plannedWidth}%` }} />
                  </div>
                </div>

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
  );
};
