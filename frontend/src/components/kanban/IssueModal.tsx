import React, { useState, useEffect } from 'react';
import { api, type IssueItem, type IssueType, type IssuePriority } from '../../api/client';
import { useProjectsQuery, useAssigneesQuery, useProjectSprintsQuery } from '../../api/queries';
import { useAuth } from '../../store';
import {
  AlertCircle,
  Bug,
  CheckSquare,
  Sparkles,
  Zap,
  Flame,
  ArrowUpCircle,
  ArrowRightCircle,
  Clock,
  Layers,
  UserPlus,
} from 'lucide-react';
import { Modal, Button, Input, SelectField } from '../ui';

interface IssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIssueSaved: (savedIssue: IssueItem) => void;
  editingIssue?: IssueItem | null;
  defaultProjectId?: number;
  defaultAssigneeId?: number | null;
  defaultSprintId?: number | null;
}

export const IssueModal: React.FC<IssueModalProps> = ({
  isOpen,
  onClose,
  onIssueSaved,
  editingIssue,
  defaultProjectId,
  defaultAssigneeId,
  defaultSprintId,
}) => {
  const { user } = useAuth();
  const { data: projects = [] } = useProjectsQuery();
  const { data: assigneesData } = useAssigneesQuery({ limit: 200 });
  const assignees = assigneesData?.items ?? [];

  // Form states
  const [projectId, setProjectId] = useState<number>(defaultProjectId || 1);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [issueType, setIssueType] = useState<IssueType>('BUG');
  const [priority, setPriority] = useState<IssuePriority>('MEDIUM');
  const [estimatedHours, setEstimatedHours] = useState<string>('0');
  const [sprintId, setSprintId] = useState<string>(defaultSprintId ? String(defaultSprintId) : '');
  const [assigneeId, setAssigneeId] = useState<number | ''>('');

  const { data: projectSprints = [] } = useProjectSprintsQuery(projectId);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync project ID when projects load or change
  useEffect(() => {
    if (!editingIssue) {
      if (defaultProjectId) {
        setProjectId(defaultProjectId);
      } else if (projects.length > 0) {
        setProjectId(projects[0].id);
      }
    }
  }, [projects, defaultProjectId, editingIssue]);

  // Sync state when editing existing issue
  useEffect(() => {
    if (editingIssue) {
      setProjectId(editingIssue.projectId);
      setTitle(editingIssue.title);
      setDescription(editingIssue.description || '');
      setIssueType(editingIssue.issueType);
      setPriority(editingIssue.priority);
      setEstimatedHours(String(editingIssue.estimatedHours || 0));
      setSprintId(editingIssue.sprintId ? String(editingIssue.sprintId) : '');
      setAssigneeId(editingIssue.assignee?.id ?? '');
    } else {
      setTitle('');
      setDescription('');
      setIssueType('BUG');
      setPriority('MEDIUM');
      setEstimatedHours('0');
      setSprintId(defaultSprintId ? String(defaultSprintId) : '');
      setAssigneeId(defaultAssigneeId ?? '');
    }
    setValidationError(null);
  }, [editingIssue, isOpen, defaultAssigneeId, defaultSprintId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setValidationError('Issue title is required.');
      return;
    }

    setSubmitting(true);
    setValidationError(null);

    try {
      const parsedHours = parseFloat(estimatedHours) || 0;
      let saved: IssueItem;
      const parsedSprintId = sprintId !== '' ? Number(sprintId) : null;

      if (editingIssue) {
        saved = await api.updateIssue(editingIssue.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          issueType,
          priority,
          estimatedHours: parsedHours,
          sprintId: parsedSprintId,
          assigneeId: assigneeId === '' ? undefined : Number(assigneeId),
        });
      } else {
        saved = await api.createIssue({
          projectId,
          title: title.trim(),
          description: description.trim() || undefined,
          issueType,
          priority,
          estimatedHours: parsedHours,
          sprintId: parsedSprintId,
          assigneeId: assigneeId === '' ? undefined : Number(assigneeId),
        });
      }

      onIssueSaved(saved);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save issue.';
      setValidationError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingIssue ? `Edit Issue: ${editingIssue.key}` : 'Create New Issue'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {validationError && (
          <div className="p-3 rounded-xl bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Project Selector (disabled during edit) */}
        {!editingIssue && (
          <SelectField
            label="Project"
            value={String(projectId)}
            onValueChange={(val) => setProjectId(Number(val))}
            options={projects.map((p) => ({
              value: String(p.id),
              label: `${p.name} (${p.key})`,
            }))}
          />
        )}

        {/* Title */}
        <Input
          label="Title / Summary *"
          placeholder="e.g. Critical memory leak on WebSocket connection pool"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {/* Grid row: Type & Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SelectField
            label="Issue Type"
            value={issueType}
            onValueChange={(val) => setIssueType(val as IssueType)}
            options={[
              { value: 'BUG', label: 'Bug / Defect', icon: <Bug className="w-4 h-4 text-[var(--md-sys-color-error)]" /> },
              { value: 'TASK', label: 'Standard Task', icon: <CheckSquare className="w-4 h-4 text-[var(--md-sys-color-primary)]" /> },
              { value: 'FEATURE', label: 'New Feature', icon: <Sparkles className="w-4 h-4 text-[var(--md-sys-color-success)]" /> },
              { value: 'IMPROVEMENT', label: 'Improvement', icon: <Zap className="w-4 h-4 text-[var(--md-sys-color-tertiary)]" /> },
            ]}
          />

          <SelectField
            label="Priority"
            value={priority}
            onValueChange={(val) => setPriority(val as IssuePriority)}
            options={[
              { value: 'CRITICAL', label: 'Critical / P0', icon: <Flame className="w-4 h-4 text-[var(--md-sys-color-priority-critical)]" /> },
              { value: 'HIGH', label: 'High / P1', icon: <ArrowUpCircle className="w-4 h-4 text-[var(--md-sys-color-priority-high)]" /> },
              { value: 'MEDIUM', label: 'Medium / P2', icon: <ArrowRightCircle className="w-4 h-4 text-[var(--md-sys-color-priority-medium)]" /> },
              { value: 'LOW', label: 'Low / P3', icon: <span className="w-2.5 h-2.5 rounded-full bg-[var(--md-sys-color-priority-low)]" /> },
            ]}
          />
        </div>

        {/* Assignee */}
        <SelectField
          label="Assignee"
          value={String(assigneeId)}
          onValueChange={(val) => setAssigneeId(val === '' ? '' : Number(val))}
          options={[
            { value: '', label: 'Unassigned' },
            ...(user ? [{ value: String(user.id), label: `${user.fullName} (Assign to Me)` }] : []),
            ...assignees
              .filter((a) => a.id !== user?.id)
              .map((a) => ({
                value: String(a.id),
                label: `${a.fullName} (${a.email})`,
              })),
          ]}
          leftIcon={<UserPlus className="w-4 h-4 text-[var(--md-sys-color-primary)]" />}
        />

        {/* Grid row: Estimates & Relational Sprint */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Estimated Hours"
            type="number"
            step="0.5"
            min="0"
            placeholder="e.g. 4.0"
            value={estimatedHours}
            onChange={(e) => setEstimatedHours(e.target.value)}
            leftIcon={<Clock className="w-4 h-4 text-[var(--md-sys-color-primary)]" />}
          />

          <SelectField
            label="Sprint"
            value={sprintId}
            onValueChange={(val) => setSprintId(val)}
            options={[
              { value: '', label: 'Product Backlog (No Sprint)' },
              ...projectSprints.map((s) => ({
                value: String(s.id),
                label: `${s.name} (${s.status})`,
              })),
            ]}
            leftIcon={<Layers className="w-4 h-4 text-[var(--md-sys-color-primary)]" />}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
            Description (Steps to reproduce, environment details)
          </label>
          <textarea
            rows={4}
            placeholder="Describe the defect, reproduction steps, expected vs actual behavior..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] text-sm focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)] resize-none"
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="filled"
            isLoading={submitting}
          >
            {editingIssue ? 'Save Changes' : 'Create Issue'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
