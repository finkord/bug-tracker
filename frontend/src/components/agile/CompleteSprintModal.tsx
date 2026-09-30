import React, { useState } from 'react';
import type { IssueItem } from '../../api/client';
import type { SprintDefinition } from '../../types/agile';
import {
  Modal,
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../ui';
import { CheckCircle2, AlertCircle, ArrowRight, Layers } from 'lucide-react';

interface CompleteSprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  sprint: SprintDefinition | null;
  issues: IssueItem[];
  availableSprints: SprintDefinition[];
  onConfirmComplete: (sprintId: number, rolloverTargetSprintId: number | null) => Promise<void>;
}

export const CompleteSprintModal: React.FC<CompleteSprintModalProps> = ({
  isOpen,
  onClose,
  sprint,
  issues,
  availableSprints,
  onConfirmComplete,
}) => {
  const [rolloverTarget, setRolloverTarget] = useState<string>('BACKLOG');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!sprint) return null;

  const completedIssues = issues.filter(
    (i) => i.status === 'RESOLVED' || i.status === 'CLOSED',
  );
  const incompleteIssues = issues.filter(
    (i) => i.status !== 'RESOLVED' && i.status !== 'CLOSED',
  );

  const plannedSprints = availableSprints.filter(
    (s) => s.id && s.id !== sprint.id && s.status !== 'COMPLETED',
  );

  const handleComplete = async () => {
    if (!sprint.id) return;
    setIsSubmitting(true);
    try {
      const rolloverTargetSprintId = rolloverTarget === 'BACKLOG' ? null : Number(rolloverTarget);
      await onConfirmComplete(sprint.id, rolloverTargetSprintId);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Complete ${sprint.name}`}
      size="md"
    >
      <div className="space-y-4 text-[var(--md-sys-color-on-surface)]">
        {/* Completed vs Incomplete stats box */}
        <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/40 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--md-sys-color-success)]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              {completedIssues.length} completed {completedIssues.length === 1 ? 'issue' : 'issues'} will be closed and archived in reports.
            </span>
          </div>

          {incompleteIssues.length > 0 && (
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--md-sys-color-warning)]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                {incompleteIssues.length} incomplete {incompleteIssues.length === 1 ? 'issue' : 'issues'} remaining.
              </span>
            </div>
          )}
        </div>

        {/* Rollover target selector if there are incomplete issues */}
        {incompleteIssues.length > 0 && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] mb-2">
              Move Incomplete Issues To:
            </label>
            <Select value={rolloverTarget} onValueChange={setRolloverTarget}>
              <SelectTrigger size="sm" className="rounded-xl bg-[var(--md-sys-color-surface-container)] text-xs">
                <SelectValue placeholder="Select target destination" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BACKLOG">
                  <span className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                    <span>Product Backlog</span>
                  </span>
                </SelectItem>
                {plannedSprints.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    <span className="flex items-center gap-2">
                      <ArrowRight className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                      <span>{s.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--md-sys-color-outline-variant)]">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>

          <Button
            variant="filled"
            size="sm"
            onClick={handleComplete}
            isLoading={isSubmitting}
            leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
          >
            Complete Sprint
          </Button>
        </div>
      </div>
    </Modal>
  );
};
