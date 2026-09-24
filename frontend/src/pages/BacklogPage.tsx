import { SprintAnalyticsModal } from '../components/kanban/SprintAnalyticsModal';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  api,
  type ProjectItem,
  type IssueItem,
} from '../api/client';
import { Avatar } from '../components/common/Avatar';
import { IssueModal } from '../components/kanban/IssueModal';
import { IssueDetailsModal } from '../components/kanban/IssueDetailsModal';
import {
  Layers,
  PlusCircle,
  Clock,
  ArrowDown,
  Loader2,
  Kanban,
  Calendar,
  Target,
  Sparkles,
  CheckCircle2,
  Send,
  Play,
  TrendingDown,
} from 'lucide-react';
import { Modal, Button, Input, Badge } from '../components/ui';

interface SprintDefinition {
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'PLANNED' | 'COMPLETED';
}

export const BacklogPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [, setProjects] = useState<ProjectItem[]>([]);
  const [currentProject, setCurrentProject] = useState<ProjectItem | null>(null);
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createSprintModalOpen, setCreateSprintModalOpen] = useState(false);
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);
  const [detailsIssueId, setDetailsIssueId] = useState<number | null>(null);

  // Sprint creation form state
  const [newSprintName, setNewSprintName] = useState('');
  const [newSprintGoal, setNewSprintGoal] = useState('');
  const [newSprintStartDate, setNewSprintStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newSprintEndDate, setNewSprintEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });

  // Complete Sprint modal state
  const [completeSprintModalOpen, setCompleteSprintModalOpen] = useState(false);
  const [rolloverTargetSprint, setRolloverTargetSprint] = useState<string>('BACKLOG');

  // Stored sprint configurations
  const [sprintDefinitions, setSprintDefinitions] = useState<Record<string, SprintDefinition>>({});
  const [selectedSprintName, setSelectedSprintName] = useState<string>('Sprint 1');

  // Load project and issues
  const loadData = async () => {
    setLoading(true);
    try {
      const projList = await api.getProjects();
      setProjects(projList);

      let targetProject = projList[0];
      if (projectId) {
        const found = projList.find((p) => p.id === Number(projectId));
        if (found) targetProject = found;
      }
      setCurrentProject(targetProject);

      if (targetProject) {
        const issuesData = await api.getIssues({ projectId: targetProject.id });
        setIssues(issuesData);

        // Load stored sprint metadata
        const storedKey = `bt_sprints_${targetProject.id}`;
        let storedDefs: Record<string, SprintDefinition> = {};
        try {
          const raw = localStorage.getItem(storedKey);
          if (raw) storedDefs = JSON.parse(raw);
        } catch {
          // Ignore parse errors
        }

        // Ensure default Sprint 1 exists
        if (!storedDefs['Sprint 1']) {
          storedDefs['Sprint 1'] = {
            name: 'Sprint 1',
            goal: 'Core architecture, RBAC auth, and initial milestone deliverables',
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
            status: 'ACTIVE',
          };
        }

        // Register any sprints found in issues
        issuesData.forEach((issue) => {
          if (issue.sprint && !storedDefs[issue.sprint]) {
            storedDefs[issue.sprint] = {
              name: issue.sprint,
              goal: 'Feature deliverables and bug triage',
              startDate: new Date().toISOString().split('T')[0],
              endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
              status: 'PLANNED',
            };
          }
        });

        setSprintDefinitions(storedDefs);
      }
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  // Create new sprint handler
  const handleCreateSprint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSprintName.trim() || !currentProject) return;

    const sprintName = newSprintName.trim();
    const updatedDefs: Record<string, SprintDefinition> = {
      ...sprintDefinitions,
      [sprintName]: {
        name: sprintName,
        goal: newSprintGoal.trim() || 'Sprint objectives and milestone delivery',
        startDate: newSprintStartDate,
        endDate: newSprintEndDate,
        status: 'PLANNED',
      },
    };

    setSprintDefinitions(updatedDefs);
    setSelectedSprintName(sprintName);
    localStorage.setItem(`bt_sprints_${currentProject.id}`, JSON.stringify(updatedDefs));

    // Reset form
    setNewSprintName('');
    setNewSprintGoal('');
    setCreateSprintModalOpen(false);
  };

  // Start Sprint handler
  const handleStartSprint = (sprintName: string) => {
    if (!currentProject) return;
    const now = new Date();
    const end = new Date(now.getTime() + 14 * 86400000);
    const updatedDefs: Record<string, SprintDefinition> = {
      ...sprintDefinitions,
      [sprintName]: {
        ...sprintDefinitions[sprintName],
        status: 'ACTIVE',
        startDate: now.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      },
    };
    setSprintDefinitions(updatedDefs);
    localStorage.setItem(`bt_sprints_${currentProject.id}`, JSON.stringify(updatedDefs));
  };

  // Complete Sprint handler
  const handleCompleteSprint = async () => {
    if (!currentProject) return;
    const sprintName = selectedSprintName;
    const incompleteIssues = sprintIssues.filter(
      (i) => i.status !== 'RESOLVED' && i.status !== 'CLOSED',
    );

    // Rollover incomplete issues
    const target = rolloverTargetSprint === 'BACKLOG' ? null : rolloverTargetSprint;
    for (const issue of incompleteIssues) {
      await api.updateIssueSprint(issue.id, target);
    }

    const updatedDefs: Record<string, SprintDefinition> = {
      ...sprintDefinitions,
      [sprintName]: {
        ...sprintDefinitions[sprintName],
        status: 'COMPLETED',
      },
    };
    setSprintDefinitions(updatedDefs);
    localStorage.setItem(`bt_sprints_${currentProject.id}`, JSON.stringify(updatedDefs));
    setCompleteSprintModalOpen(false);
    loadData();
  };

  // Move issue to sprint
  const handleMoveToSprint = async (issueId: number, sprintName: string) => {
    try {
      await api.updateIssueSprint(issueId, sprintName);
      loadData();
    } catch {
      // Handle error
    }
  };

  // Move issue to backlog
  const handleMoveToBacklog = async (issueId: number) => {
    try {
      await api.updateIssueSprint(issueId, null);
      loadData();
    } catch {
      // Handle error
    }
  };

  // Available sprint names
  const allSprintNames = Object.keys(sprintDefinitions);
  if (!allSprintNames.includes(selectedSprintName) && allSprintNames.length > 0) {
    setSelectedSprintName(allSprintNames[0]);
  }

  const currentSprintDef = sprintDefinitions[selectedSprintName] || {
    name: selectedSprintName,
    goal: 'Milestone tracking and feature delivery',
    startDate: '',
    endDate: '',
    status: 'ACTIVE',
  };

  const sprintIssues = issues.filter((i) => i.sprint === selectedSprintName);
  const backlogIssues = issues.filter((i) => !i.sprint || i.sprint.toUpperCase() === 'BACKLOG');

  const sprintTotalEstimate = sprintIssues.reduce((acc, i) => acc + (i.estimatedHours || 0), 0);
  const sprintTotalLogged = sprintIssues.reduce((acc, i) => acc + (i.loggedHours || 0), 0);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--md-sys-color-primary-container)] text-xs font-semibold text-[var(--md-sys-color-on-primary-container)] mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Agile Scrum & Sprint Planning</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--md-sys-color-on-surface)] tracking-tight">
            Backlog & Sprints
          </h1>
          <p className="text-xs sm:text-sm text-[var(--md-sys-color-on-surface-variant)] mt-1">
            Create sprints, plan iterations, prioritize product backlog, and track team effort.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {currentProject && (
            <button
              type="button"
              onClick={() => navigate(`/projects/${currentProject.id}/board`)}
              className="px-4 py-2 rounded-full m3-btn-outline text-xs font-semibold flex items-center gap-1.5"
            >
              <Kanban className="w-4 h-4" />
              <span>Kanban Board</span>
            </button>
          )}

          {/* Create Sprint Button */}
          <button
            type="button"
            onClick={() => {
              const nextSprintNum = allSprintNames.length + 1;
              setNewSprintName(`Sprint ${nextSprintNum}`);
              setCreateSprintModalOpen(true);
            }}
            className="px-4 py-2 rounded-full m3-btn-outline text-xs font-semibold flex items-center gap-1.5 border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary-container)]/30"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>+ Create Sprint</span>
          </button>

          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="px-5 py-2 rounded-full m3-btn-filled text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--md-sys-color-primary)]" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Sprint Selector Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-2 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase px-2 tracking-wider">
                Sprints:
              </span>
              {allSprintNames.map((sName) => {
                const isSelected = sName === selectedSprintName;
                const count = issues.filter((i) => i.sprint === sName).length;
                return (
                  <button
                    key={sName}
                    type="button"
                    onClick={() => setSelectedSprintName(sName)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xs'
                        : 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]'
                    }`}
                  >
                    <span>{sName}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isSelected ? 'bg-black/20 text-white' : 'bg-[var(--md-sys-color-surface-container-highest)]'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                const nextSprintNum = allSprintNames.length + 1;
                setNewSprintName(`Sprint ${nextSprintNum}`);
                setCreateSprintModalOpen(true);
              }}
              className="text-xs font-semibold text-[var(--md-sys-color-primary)] hover:underline flex items-center gap-1 px-2"
            >
              <span>+ Add another sprint</span>
            </button>
          </div>

          {/* Active Sprint Section */}
          <div className="p-6 rounded-3xl bg-[var(--md-sys-color-surface-container-lowest)] border border-[var(--md-sys-color-outline-variant)] space-y-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--md-sys-color-outline-variant)]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-[var(--md-sys-color-on-surface)]">
                    {selectedSprintName}
                  </h2>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    currentSprintDef.status === 'ACTIVE'
                      ? 'bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)] border border-[var(--md-sys-color-success)]/20'
                      : 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border border-[var(--md-sys-color-primary)]/20'
                  }`}>
                    {currentSprintDef.status}
                  </span>
                  <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                    ({sprintIssues.length} issues)
                  </span>
                </div>
                {currentSprintDef.goal && (
                  <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] shrink-0" />
                    <span>Goal: {currentSprintDef.goal}</span>
                  </p>
                )}
                {currentSprintDef.startDate && currentSprintDef.endDate && (
                  <p className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{currentSprintDef.startDate} to {currentSprintDef.endDate}</span>
                  </p>
                )}
              </div>

              {/* Sprint Metrics & Lifecycle Controls */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="px-3 py-1.5 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] text-xs">
                  <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] block">Estimated</span>
                  <span className="font-bold text-[var(--md-sys-color-on-surface)]">{sprintTotalEstimate} hrs</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] text-xs">
                  <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] block">Logged</span>
                  <span className="font-bold text-[var(--md-sys-color-success)]">{sprintTotalLogged} hrs</span>
                </div>

                <button
                  type="button"
                  onClick={() => setAnalyticsModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-full m3-btn-outline text-xs font-semibold flex items-center gap-1.5 text-[var(--md-sys-color-primary)] border-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary-container)] cursor-pointer"
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Burndown & Velocity</span>
                </button>

                {/* Lifecycle action buttons */}
                {currentSprintDef.status === 'PLANNED' && (
                  <button
                    type="button"
                    onClick={() => handleStartSprint(selectedSprintName)}
                    className="px-4 py-2 rounded-full m3-btn-filled text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Sprint</span>
                  </button>
                )}

                {currentSprintDef.status === 'ACTIVE' && (
                  <button
                    type="button"
                    onClick={() => setCompleteSprintModalOpen(true)}
                    className="px-4 py-2 rounded-full m3-btn-outline text-xs font-semibold flex items-center gap-1.5 border-[var(--md-sys-color-success)] text-[var(--md-sys-color-success)] hover:bg-[var(--md-sys-color-success-container)] cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Complete Sprint</span>
                  </button>
                )}

                {currentSprintDef.status === 'COMPLETED' && (
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)] border border-[var(--md-sys-color-tertiary)]/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Completed & Archived</span>
                  </span>
                )}
              </div>
            </div>

            {sprintIssues.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[var(--md-sys-color-surface)] border border-dashed border-[var(--md-sys-color-outline-variant)] text-center text-xs text-[var(--md-sys-color-on-surface-variant)]">
                <p className="font-semibold text-sm mb-1 text-[var(--md-sys-color-on-surface)]">
                  No issues assigned to {selectedSprintName} yet
                </p>
                <p>
                  Move issues from the backlog below into {selectedSprintName} using the buttons below.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {sprintIssues.map((issue) => (
                  <div
                    key={issue.id}
                    onClick={() => setDetailsIssueId(issue.id)}
                    className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] cursor-pointer transition-colors shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-xs font-bold text-[var(--md-sys-color-primary)] px-2 py-0.5 rounded bg-[var(--md-sys-color-primary-container)]/50 shrink-0">
                        {issue.key}
                      </span>
                      <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface)] truncate">
                        {issue.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-xs">
                      <span className="font-mono text-[11px] text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[var(--md-sys-color-primary)]" />
                        <span>{issue.loggedHours || 0}h / {issue.estimatedHours || 0}h</span>
                      </span>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--md-sys-color-surface-container-highest)]">
                        {issue.status}
                      </span>

                      {issue.assignee ? (
                        <Avatar
                          name={issue.assignee.fullName}
                          avatarUrl={issue.assignee.avatarUrl}
                          role={issue.assignee.systemRole}
                          size="xs"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-dashed border-[var(--md-sys-color-outline)] text-[9px] flex items-center justify-center">
                          ?
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveToBacklog(issue.id);
                        }}
                        className="px-2 py-1 rounded-md text-[11px] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)] transition-colors flex items-center gap-1"
                        title="Move back to Product Backlog"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                        <span>To Backlog</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Backlog Section */}
          <div className="p-6 rounded-3xl bg-[var(--md-sys-color-surface-container-lowest)] border border-[var(--md-sys-color-outline-variant)] space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--md-sys-color-outline-variant)]">
              <div>
                <h2 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                  Product Backlog ({backlogIssues.length})
                </h2>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                  Unscheduled tasks ready for sprint grooming and effort estimation
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--md-sys-color-primary)] hover:underline cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            </div>

            {backlogIssues.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[var(--md-sys-color-surface)] border border-dashed border-[var(--md-sys-color-outline-variant)] text-center text-xs text-[var(--md-sys-color-on-surface-variant)] italic">
                Backlog is currently empty. All issues are scheduled into sprints.
              </div>
            ) : (
              <div className="space-y-2">
                {backlogIssues.map((issue) => (
                  <div
                    key={issue.id}
                    onClick={() => setDetailsIssueId(issue.id)}
                    className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] cursor-pointer transition-colors shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] px-2 py-0.5 rounded bg-[var(--md-sys-color-surface-container-highest)] shrink-0">
                        {issue.key}
                      </span>
                      <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface)] truncate">
                        {issue.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-xs">
                      <span className="font-mono text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                        {issue.estimatedHours ? `${issue.estimatedHours}h est` : 'No est'}
                      </span>

                      <Badge variant={issue.priority.toLowerCase() as any} size="sm">
                        {issue.priority}
                      </Badge>

                      {issue.assignee ? (
                        <Avatar
                          name={issue.assignee.fullName}
                          avatarUrl={issue.assignee.avatarUrl}
                          role={issue.assignee.systemRole}
                          size="xs"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-dashed border-[var(--md-sys-color-outline)] text-[9px] flex items-center justify-center">
                          ?
                        </div>
                      )}

                      {/* Move to current active sprint button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveToSprint(issue.id, selectedSprintName);
                        }}
                        className="px-3 py-1 rounded-full text-xs font-semibold m3-btn-filled flex items-center gap-1 shadow-2xs cursor-pointer"
                        title={`Move to ${selectedSprintName}`}
                      >
                        <Send className="w-3 h-3" />
                        <span>To {selectedSprintName}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Sprint Modal */}
      <Modal
        isOpen={createSprintModalOpen}
        onClose={() => setCreateSprintModalOpen(false)}
        size="md"
        title={
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <span>Create New Sprint</span>
          </div>
        }
        description="Define sprint cycle, duration, and objective for your team."
      >
        <form onSubmit={handleCreateSprint} className="space-y-4">
          <Input
            label="Sprint Name *"
            required
            value={newSprintName}
            onChange={(e) => setNewSprintName(e.target.value)}
            placeholder="e.g. Sprint 2 - Core Engine"
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider select-none">
              Sprint Goal
            </label>
            <textarea
              rows={2}
              value={newSprintGoal}
              onChange={(e) => setNewSprintGoal(e.target.value)}
              placeholder="What is the key target outcome for this sprint?"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-[var(--md-sys-color-input-bg)] text-[var(--md-sys-color-input-text)] border border-[var(--md-sys-color-input-border)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]/20 focus:border-[var(--md-sys-color-primary)] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              required
              value={newSprintStartDate}
              onChange={(e) => setNewSprintStartDate(e.target.value)}
            />
            <Input
              label="End Date"
              type="date"
              required
              value={newSprintEndDate}
              onChange={(e) => setNewSprintEndDate(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setCreateSprintModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="filled"
              size="sm"
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Create Sprint
            </Button>
          </div>
        </form>
      </Modal>

      {/* Task Creation & Detail Modals */}
      <IssueModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        defaultProjectId={currentProject?.id}
        onIssueSaved={loadData}
      />

      <IssueDetailsModal
        isOpen={!!detailsIssueId}
        issueId={detailsIssueId}
        onClose={() => setDetailsIssueId(null)}
        onIssueUpdated={loadData}
        onIssueDeleted={loadData}
      />

      {/* Complete Sprint Modal */}
      <Modal
        isOpen={completeSprintModalOpen}
        onClose={() => setCompleteSprintModalOpen(false)}
        size="md"
        title={
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span>Complete {selectedSprintName}</span>
          </div>
        }
        description="Review completed work and rollover remaining tasks to next sprint or backlog."
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">Completed Issues:</span>
              <Badge variant="resolved" size="sm">
                {sprintIssues.filter((i) => i.status === 'RESOLVED' || i.status === 'CLOSED').length} issues
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">Incomplete Issues:</span>
              <Badge variant="in-progress" size="sm">
                {sprintIssues.filter((i) => i.status !== 'RESOLVED' && i.status !== 'CLOSED').length} issues
              </Badge>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider mb-1.5 select-none">
              Move Incomplete Issues To:
            </label>
            <select
              value={rolloverTargetSprint}
              onChange={(e) => setRolloverTargetSprint(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-[var(--md-sys-color-input-bg)] text-[var(--md-sys-color-input-text)] border border-[var(--md-sys-color-input-border)] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]/20 focus:border-[var(--md-sys-color-primary)]"
            >
              <option value="BACKLOG">Product Backlog</option>
              {allSprintNames
                .filter((s) => s !== selectedSprintName)
                .map((s) => (
                  <option key={s} value={s}>
                    {s} ({sprintDefinitions[s]?.status || 'PLANNED'})
                  </option>
                ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setCompleteSprintModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="filled"
              size="sm"
              onClick={handleCompleteSprint}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Complete & Archive
            </Button>
          </div>
        </div>
      </Modal>

      <SprintAnalyticsModal
        isOpen={analyticsModalOpen}
        onClose={() => setAnalyticsModalOpen(false)}
        sprint={currentSprintDef}
        sprintIssues={sprintIssues}
        allSprints={sprintDefinitions}
        allIssues={issues}
      />

    </div>
  );
};
