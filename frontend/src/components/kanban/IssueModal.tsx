import React, { useState, useEffect, useRef } from 'react';
import { api, type IssueItem, type IssueType, type IssuePriority } from '../../api/client';
import {
  useProjectsQuery,
  useAssigneesQuery,
  useProjectSprintsQuery,
  useProjectComponentsQuery,
  useProjectVersionsQuery,
} from '../../api/queries';
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
  Tag,
} from 'lucide-react';
import { Modal, Button, Input, SelectField } from '../ui';
import { MarkdownContent } from '../common/MarkdownContent';

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

  const titleInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [projectId, setProjectId] = useState<number>(defaultProjectId || 1);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [descTab, setDescTab] = useState<'write' | 'preview'>('write');
  const [issueType, setIssueType] = useState<IssueType>('BUG');
  const [priority, setPriority] = useState<IssuePriority>('MEDIUM');
  const [estimatedHours, setEstimatedHours] = useState<string>('0');
  const [sprintId, setSprintId] = useState<string>(defaultSprintId ? String(defaultSprintId) : '');
  const [assigneeId, setAssigneeId] = useState<number | ''>('');
  const [componentId, setComponentId] = useState<string>('');
  const [fixVersionId, setFixVersionId] = useState<string>('');
  const [labelsInput, setLabelsInput] = useState<string>('');
  const [createAnother, setCreateAnother] = useState<boolean>(false);

  const { data: projectSprints = [] } = useProjectSprintsQuery(projectId);
  const { data: projectComponents = [] } = useProjectComponentsQuery(projectId);
  const { data: projectVersions = [] } = useProjectVersionsQuery(projectId);

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
      setComponentId(editingIssue.componentId ? String(editingIssue.componentId) : '');
      setFixVersionId(editingIssue.fixVersionId ? String(editingIssue.fixVersionId) : '');
      setLabelsInput(editingIssue.labels ? editingIssue.labels.join(', ') : '');
    } else {
      setTitle('');
      setDescription('');
      setIssueType('BUG');
      setPriority('MEDIUM');
      setEstimatedHours('0');
      setSprintId(defaultSprintId ? String(defaultSprintId) : '');
      setAssigneeId(defaultAssigneeId ?? '');
      setComponentId('');
      setFixVersionId('');
      setLabelsInput('');
    }
    setValidationError(null);
  }, [editingIssue, isOpen, defaultAssigneeId, defaultSprintId]);

  // Focus title input when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
      const parsedComponentId = componentId !== '' ? Number(componentId) : null;
      const parsedFixVersionId = fixVersionId !== '' ? Number(fixVersionId) : null;
      const labels = labelsInput
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean);

      if (editingIssue) {
        saved = await api.updateIssue(editingIssue.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          issueType,
          priority,
          estimatedHours: parsedHours,
          sprintId: parsedSprintId,
          assigneeId: assigneeId === '' ? undefined : Number(assigneeId),
          componentId: parsedComponentId,
          fixVersionId: parsedFixVersionId,
          labels,
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
          componentId: parsedComponentId,
          fixVersionId: parsedFixVersionId,
          labels,
        });
      }

      onIssueSaved(saved);

      if (createAnother && !editingIssue) {
        setTitle('');
        setDescription('');
        setEstimatedHours('0');
        setValidationError(null);
        setTimeout(() => titleInputRef.current?.focus(), 50);
      } else {
        onClose();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save issue.';
      setValidationError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingIssue ? `Edit Issue: ${editingIssue.key}` : 'Create New Issue'}
      size="lg"
    >
      <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="space-y-4">
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
          ref={titleInputRef}
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
          />
        </div>

        {/* Grid row: Component, Fix Version & Labels */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <SelectField
            label="Component"
            value={componentId}
            onValueChange={(val) => setComponentId(val)}
            options={[
              { value: '', label: 'No Component' },
              ...projectComponents.map((c) => ({
                value: String(c.id),
                label: c.name,
              })),
            ]}
          />

          <SelectField
            label="Fix Version"
            value={fixVersionId}
            onValueChange={(val) => setFixVersionId(val)}
            options={[
              { value: '', label: 'No Version' },
              ...projectVersions.map((v) => ({
                value: String(v.id),
                label: `${v.name} (${v.status})`,
              })),
            ]}
          />

          <Input
            label="Labels (comma separated)"
            placeholder="e.g. backend, security, api"
            value={labelsInput}
            onChange={(e) => setLabelsInput(e.target.value)}
            leftIcon={<Tag className="w-4 h-4 text-[var(--md-sys-color-primary)]" />}
          />
        </div>

        {/* Description with Write / Preview Tabs */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
              Description (Steps to reproduce, environment details)
            </label>
            <div className="inline-flex items-center p-0.5 rounded-lg bg-[var(--md-sys-color-surface-container-high)] text-xs">
              <button
                type="button"
                onClick={() => setDescTab('write')}
                className={`px-2.5 py-0.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  descTab === 'write'
                    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xs'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                Write
              </button>
              <button
                type="button"
                onClick={() => setDescTab('preview')}
                className={`px-2.5 py-0.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  descTab === 'preview'
                    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xs'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                Preview
              </button>
            </div>
          </div>

          {descTab === 'write' ? (
            <textarea
              rows={4}
              placeholder="Describe the defect, reproduction steps, expected vs actual behavior, or checklists (- [ ] task)... (Press Ctrl+Enter to submit)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] text-sm focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)] resize-y font-mono"
            />
          ) : (
            <div className="w-full min-h-[108px] p-3.5 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-sm">
              {description ? (
                <MarkdownContent content={description} />
              ) : (
                <span className="text-xs italic text-[var(--md-sys-color-on-surface-variant)]">
                  Nothing to preview. Enter markdown in the Write tab.
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
          {!editingIssue ? (
            <label className="flex items-center gap-2 text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={createAnother}
                onChange={(e) => setCreateAnother(e.target.checked)}
                className="w-4 h-4 rounded text-[var(--md-sys-color-primary)] focus:ring-[var(--md-sys-color-primary)] border-[var(--md-sys-color-outline-variant)] cursor-pointer"
              />
              <span>Create another</span>
            </label>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
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
              {editingIssue ? 'Save Changes' : 'Create Issue (Ctrl+Enter)'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
