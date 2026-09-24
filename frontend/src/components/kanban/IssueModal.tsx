import React, { useState, useEffect } from 'react';
import {
  api,
  type IssueItem,
  type ProjectItem,
  type AssigneeUser,
  type IssueType,
  type IssuePriority,
} from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  PlusCircle,
  Edit3,
  AlertCircle,
  Loader2,
  Clock,
  Layers,
  UserPlus,
} from 'lucide-react';

interface IssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIssueSaved: (savedIssue: IssueItem) => void;
  editingIssue?: IssueItem | null;
  defaultProjectId?: number;
}

export const IssueModal: React.FC<IssueModalProps> = ({
  isOpen,
  onClose,
  onIssueSaved,
  editingIssue,
  defaultProjectId,
}) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [assignees, setAssignees] = useState<AssigneeUser[]>([]);

  // Form states
  const [projectId, setProjectId] = useState<number>(defaultProjectId || 1);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [issueType, setIssueType] = useState<IssueType>('BUG');
  const [priority, setPriority] = useState<IssuePriority>('MEDIUM');
  const [estimatedHours, setEstimatedHours] = useState<string>('0');
  const [sprint, setSprint] = useState<string>('Sprint 1');
  const [assigneeId, setAssigneeId] = useState<number | ''>('');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load project list & eligible assignees
  useEffect(() => {
    if (isOpen) {
      api.getProjects()
        .then((data) => {
          setProjects(data);
          if (!editingIssue && defaultProjectId) {
            setProjectId(defaultProjectId);
          } else if (!editingIssue && data.length > 0) {
            setProjectId(data[0].id);
          }
        })
        .catch(() => {});

      api.getAssignees()
        .then((data) => setAssignees(data))
        .catch(() => {});
    }
  }, [isOpen, defaultProjectId, editingIssue]);

  // Sync state when editing existing issue
  useEffect(() => {
    if (editingIssue) {
      setProjectId(editingIssue.projectId);
      setTitle(editingIssue.title);
      setDescription(editingIssue.description || '');
      setIssueType(editingIssue.issueType);
      setPriority(editingIssue.priority);
      setEstimatedHours(String(editingIssue.estimatedHours || 0));
      setSprint(editingIssue.sprint || '');
      setAssigneeId(editingIssue.assignee?.id ?? '');
    } else {
      setTitle('');
      setDescription('');
      setIssueType('BUG');
      setPriority('MEDIUM');
      setEstimatedHours('0');
      setSprint('Sprint 1');
      setAssigneeId('');
    }
    setValidationError(null);
  }, [editingIssue, isOpen]);

  if (!isOpen) return null;

  const handleAssignToMe = () => {
    if (user) {
      setAssigneeId(user.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setValidationError('Issue title is required.');
      return;
    }
    if (title.trim().length < 3) {
      setValidationError('Title must be at least 3 characters long.');
      return;
    }

    setSubmitting(true);
    setValidationError(null);

    try {
      const parsedHours = parseFloat(estimatedHours) || 0;
      let saved: IssueItem;

      if (editingIssue) {
        saved = await api.updateIssue(editingIssue.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          issueType,
          priority,
          estimatedHours: parsedHours,
          sprint: sprint.trim() || undefined,
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
          sprint: sprint.trim() || undefined,
          assigneeId: assigneeId === '' ? undefined : Number(assigneeId),
        });
      }

      onIssueSaved(saved);
      onClose();
    } catch (err: any) {
      setValidationError(err.message || 'Failed to save issue.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-[28px] bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--md-sys-color-outline-variant)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center">
              {editingIssue ? <Edit3 className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                {editingIssue ? `Edit ${editingIssue.key}` : 'Create New Issue'}
              </h2>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                {editingIssue
                  ? 'Update issue parameters and assignment'
                  : 'File a new bug report, technical task, or feature request'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {validationError && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Project & Assignee row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                Project *
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(Number(e.target.value))}
                disabled={!!editingIssue}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] text-sm focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)] disabled:opacity-60"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.key}] {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
                  Assignee
                </label>
                {user && assigneeId !== user.id && (
                  <button
                    type="button"
                    onClick={handleAssignToMe}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--md-sys-color-primary)] hover:underline"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>Assign to me</span>
                  </button>
                )}
              </div>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] text-sm focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
              >
                <option value="">Unassigned</option>
                {assignees.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Issue Title */}
          <div>
            <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
              Issue Title *
            </label>
            <input
              type="text"
              required
              maxLength={255}
              placeholder="e.g. Memory leak during large payload ingestion"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] text-sm focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
            />
          </div>

          {/* Issue Attributes: Type, Priority, Severity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                Issue Type
              </label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value as IssueType)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] text-xs focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
              >
                <option value="BUG">🐛 Bug Report</option>
                <option value="TASK">📋 Task</option>
                <option value="FEATURE">🚀 Feature Request</option>
                <option value="IMPROVEMENT">⚡ Improvement</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as IssuePriority)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] text-xs focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>


          </div>

          {/* Time Tracking Estimate & Sprint */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                <span>Estimated Hours</span>
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                placeholder="e.g. 4.0"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] text-sm focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                <span>Sprint / Backlog</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Sprint 1, or leave empty for Backlog"
                value={sprint}
                onChange={(e) => setSprint(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] text-sm focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
              />
            </div>
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
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-full text-xs font-semibold m3-btn-filled shadow-xs flex items-center gap-2 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>{editingIssue ? 'Update Issue' : 'Create Issue'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
