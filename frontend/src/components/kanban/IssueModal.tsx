import React, { useState, useEffect, useRef } from 'react';
import { api, type IssueItem, type IssueType, type IssuePriority } from '../../api/client';
import {
  useProjectsQuery,
  useAssigneesQuery,
  useProjectSprintsQuery,
  useProjectComponentsQuery,
  useProjectVersionsQuery,
  useIssuesQuery,
} from '../../api/queries';
import { useAuth } from '../../store';
import {
  AlertCircle,
  Bug,
  CheckSquare,
  Sparkles,
  Zap,
  Bookmark,
  ListTodo,
  Flame,
  ArrowUpCircle,
  ArrowRightCircle,
  Clock,
  Tag,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  Modal,
  Button,
  Input,
  SelectField,
  UserPicker,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  Textarea,
  type UserPickerUser,
} from '../ui';
import { MarkdownContent } from '../common/MarkdownContent';

interface IssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIssueSaved: (savedIssue: IssueItem) => void;
  editingIssue?: IssueItem | null;
  defaultProjectId?: number;
  defaultAssigneeId?: number | null;
  defaultSprintId?: number | null;
  defaultIssueType?: IssueType;
  defaultEpicId?: number | null;
  defaultParentId?: number | null;
}

export const IssueModal: React.FC<IssueModalProps> = ({
  isOpen,
  onClose,
  onIssueSaved,
  editingIssue,
  defaultProjectId,
  defaultAssigneeId,
  defaultSprintId,
  defaultIssueType,
  defaultEpicId,
  defaultParentId,
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
  const [issueType, setIssueType] = useState<IssueType>(defaultIssueType || 'TASK');
  const [priority, setPriority] = useState<IssuePriority>('MEDIUM');
  const [estimatedHours, setEstimatedHours] = useState<string>('0');
  const [sprintId, setSprintId] = useState<string>(defaultSprintId ? String(defaultSprintId) : '');
  const [assigneeId, setAssigneeId] = useState<number | ''>('');
  const [selectedAssignee, setSelectedAssignee] = useState<UserPickerUser | null>(null);
  const [componentId, setComponentId] = useState<string>('');
  const [fixVersionId, setFixVersionId] = useState<string>('');
  const [labelsInput, setLabelsInput] = useState<string>('');
  const [epicId, setEpicId] = useState<string>(defaultEpicId ? String(defaultEpicId) : '');
  const [parentId, setParentId] = useState<string>(defaultParentId ? String(defaultParentId) : '');
  const [epicColor, setEpicColor] = useState<string>('#6554C0');
  const [createAnother, setCreateAnother] = useState<boolean>(false);
  const [showMoreFields, setShowMoreFields] = useState<boolean>(false);

  const { data: projectSprints = [] } = useProjectSprintsQuery(projectId);
  const { data: projectComponents = [] } = useProjectComponentsQuery(projectId);
  const { data: projectVersions = [] } = useProjectVersionsQuery(projectId);
  const { data: epicsData } = useIssuesQuery({ projectId, issueType: 'EPIC', limit: 50 });
  const epics = epicsData?.items ?? [];
  const { data: potentialParentsData } = useIssuesQuery({ projectId, limit: 100 });
  const potentialParents = (potentialParentsData?.items ?? []).filter(
    (i) => i.issueType !== 'EPIC' && i.issueType !== 'SUBTASK',
  );

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
      setSelectedAssignee(editingIssue.assignee || null);
      setComponentId(editingIssue.componentId ? String(editingIssue.componentId) : '');
      setFixVersionId(editingIssue.fixVersionId ? String(editingIssue.fixVersionId) : '');
      setLabelsInput(editingIssue.labels ? editingIssue.labels.join(', ') : '');
      setEpicId(editingIssue.epicId ? String(editingIssue.epicId) : '');
      setParentId(editingIssue.parentId ? String(editingIssue.parentId) : '');
      setEpicColor(editingIssue.epicColor || '#6554C0');
      const hasExtra = Boolean(
        editingIssue.sprintId ||
        (editingIssue.estimatedHours && editingIssue.estimatedHours > 0) ||
        editingIssue.componentId ||
        editingIssue.fixVersionId ||
        (editingIssue.labels && editingIssue.labels.length > 0)
      );
      setShowMoreFields(hasExtra);
    } else {
      setTitle('');
      setDescription('');
      setIssueType(defaultIssueType || 'TASK');
      setPriority('MEDIUM');
      setEstimatedHours('0');
      setSprintId(defaultSprintId ? String(defaultSprintId) : '');
      setAssigneeId(defaultAssigneeId ?? '');
      setSelectedAssignee(null);
      setComponentId('');
      setFixVersionId('');
      setLabelsInput('');
      setEpicId(defaultEpicId ? String(defaultEpicId) : '');
      setParentId(defaultParentId ? String(defaultParentId) : '');
      setEpicColor('#6554C0');
      setShowMoreFields(Boolean(defaultSprintId));
    }
    setValidationError(null);
  }, [editingIssue, isOpen, defaultAssigneeId, defaultSprintId, defaultIssueType, defaultEpicId, defaultParentId]);

  // Focus title input when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const activeExtraCount = [
    Boolean(sprintId),
    parseFloat(estimatedHours) > 0,
    Boolean(componentId),
    Boolean(fixVersionId),
    Boolean(labelsInput.trim()),
  ].filter(Boolean).length;

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      setValidationError('Issue title is required.');
      return;
    }
    if (issueType === 'SUBTASK' && !parentId) {
      setValidationError('A parent issue is required for subtasks.');
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
      const parsedEpicId = epicId !== '' ? Number(epicId) : null;
      const parsedParentId = parentId !== '' ? Number(parentId) : null;
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
          epicId: issueType === 'EPIC' ? null : parsedEpicId,
          parentId: issueType === 'SUBTASK' ? parsedParentId : null,
          epicColor: issueType === 'EPIC' ? epicColor : undefined,
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
          epicId: issueType === 'EPIC' ? null : parsedEpicId,
          parentId: issueType === 'SUBTASK' ? parsedParentId : null,
          epicColor: issueType === 'EPIC' ? epicColor : undefined,
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
              { value: 'STORY', label: 'Story', icon: <Bookmark className="w-4 h-4 text-[var(--md-sys-color-success)]" /> },
              { value: 'TASK', label: 'Standard Task', icon: <CheckSquare className="w-4 h-4 text-[var(--md-sys-color-primary)]" /> },
              { value: 'BUG', label: 'Bug / Defect', icon: <Bug className="w-4 h-4 text-[var(--md-sys-color-error)]" /> },
              { value: 'EPIC', label: 'Epic', icon: <Zap className="w-4 h-4 text-[var(--md-sys-color-tertiary)]" /> },
              { value: 'SUBTASK', label: 'Sub-task', icon: <ListTodo className="w-4 h-4 text-[var(--md-sys-color-secondary)]" /> },
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

        {/* Hierarchy field: Epic Link for standard issues, Parent Task for subtasks, Epic Color for epics */}
        {issueType === 'EPIC' && (
          <div className="space-y-1.5 p-3 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/40">
            <label className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider block">
              Epic Color Badge
            </label>
            <div className="flex items-center gap-2">
              {['#6554C0', '#0052CC', '#00875A', '#FFAB00', '#DE350B', '#00B8D9'].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setEpicColor(color)}
                  className={`w-6 h-6 rounded-full transition-all cursor-pointer ${
                    epicColor === color
                      ? 'ring-2 ring-offset-2 ring-[var(--md-sys-color-primary)] scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
              <input
                type="color"
                value={epicColor}
                onChange={(e) => setEpicColor(e.target.value)}
                className="w-7 h-7 rounded-lg border border-[var(--md-sys-color-outline-variant)] cursor-pointer bg-transparent"
                title="Custom Color"
              />
            </div>
          </div>
        )}

        {issueType === 'SUBTASK' && (
          <SelectField
            label="Parent Issue *"
            value={parentId}
            onValueChange={(val) => setParentId(val)}
            options={[
              { value: '', label: 'Select parent issue...' },
              ...potentialParents.map((p) => ({
                value: String(p.id),
                label: `${p.key} - ${p.title}`,
              })),
            ]}
          />
        )}

        {issueType !== 'EPIC' && issueType !== 'SUBTASK' && epics.length > 0 && (
          <SelectField
            label="Epic Link"
            value={epicId}
            onValueChange={(val) => setEpicId(val)}
            options={[
              { value: '', label: 'No Epic' },
              ...epics.map((e) => ({
                value: String(e.id),
                label: `${e.key} - ${e.title}`,
              })),
            ]}
          />
        )}

        {/* Assignee */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider block">
            Assignee
          </label>
          <UserPicker
            value={assigneeId === '' ? null : Number(assigneeId)}
            onChange={(val, pickedUser) => {
              setAssigneeId(val ?? '');
              setSelectedAssignee(pickedUser);
            }}
            fallbackUser={selectedAssignee}
            users={assignees}
            currentUserId={user?.id}
            placeholder="Unassigned"
            showAssignToMe
            size="md"
            className="w-full"
          />
        </div>

        {/* Description with Write / Preview Tabs */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
              Description (Steps to reproduce, environment details)
            </label>
            <Tabs
              value={descTab}
              onValueChange={(val) => setDescTab(val as 'write' | 'preview')}
            >
              <TabsList variant="pills" className="rounded-lg h-7 p-0.5">
                <TabsTrigger
                  value="write"
                  onClick={() => setDescTab('write')}
                  size="sm"
                  className="h-6 px-2.5 text-xs font-semibold"
                >
                  Write
                </TabsTrigger>
                <TabsTrigger
                  value="preview"
                  onClick={() => setDescTab('preview')}
                  size="sm"
                  className="h-6 px-2.5 text-xs font-semibold"
                >
                  Preview
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {descTab === 'write' ? (
            <Textarea
              rows={4}
              placeholder="Describe the defect, reproduction steps, expected vs actual behavior, or checklists (- [ ] task)... (Press Ctrl+Enter to submit)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="font-mono text-sm"
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

        {/* Progressive Disclosure: Additional Fields */}
        <div className="pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowMoreFields(!showMoreFields)}
            leftIcon={
              showMoreFields ? (
                <ChevronUp className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
              )
            }
            className="text-xs font-semibold text-[var(--md-sys-color-primary)]"
          >
            <span>{showMoreFields ? 'Hide additional fields' : 'Additional fields (Sprint, Estimates, Components, Versions, Labels)'}</span>
            {activeExtraCount > 0 && !showMoreFields && (
              <Badge variant="secondary" size="sm" className="ml-2 font-mono">
                {activeExtraCount} set
              </Badge>
            )}
          </Button>

          {showMoreFields && (
            <div className="mt-2.5 p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/40 space-y-3 animate-in fade-in-50 duration-150">
              {/* Estimates & Relational Sprint */}
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

              {/* Component, Fix Version & Labels */}
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
