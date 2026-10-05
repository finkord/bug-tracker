import React, { useState } from 'react';
import type { IssueItem } from '../../api/client';
import { useSprintBurndownQuery, useSprintFlowMetricsQuery } from '../../api/queries';
import { Modal, Badge, Tabs, TabsList, TabsTrigger } from '../ui';
import {
  TrendingDown,
  Layers,
  Clock,
  BarChart3,
  FileSpreadsheet,
} from 'lucide-react';
import type { SprintDefinition } from '../../types/agile';
import {
  SprintBurndownChart,
  SprintCfdChart,
  SprintCycleTimeChart,
  SprintVelocityChart,
  SprintSummaryReport,
} from './analytics/index.js';

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

  // Velocity data calculation
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
        {activeTab === 'BURNDOWN' && (
          <SprintBurndownChart
            sprintIssues={sprintIssues}
            burndownData={burndownData}
            isLoading={isBurndownLoading}
          />
        )}

        {activeTab === 'CFD' && (
          <SprintCfdChart
            sprintIssues={sprintIssues}
            cfdPoints={flowMetrics?.cfd}
            isLoading={isFlowMetricsLoading}
          />
        )}

        {activeTab === 'CYCLE_TIME' && (
          <SprintCycleTimeChart
            cycleTimeSummary={flowMetrics?.cycleTime}
            isLoading={isFlowMetricsLoading}
          />
        )}

        {activeTab === 'VELOCITY' && (
          <SprintVelocityChart
            velocityData={velocityData}
            avgVelocity={avgVelocity}
          />
        )}

        {activeTab === 'REPORT' && (
          <SprintSummaryReport
            sprintName={sprint.name}
            sprintIssues={sprintIssues}
          />
        )}
      </div>
    </Modal>
  );
};
