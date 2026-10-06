import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import type { ProjectItem } from '../../api/client.js';
import {
  useProjectsQuery,
  useCreateProjectMutation,
  useDeleteProjectMutation,
  useUsersQuery,
} from '../../api/queries';
import { UserIdentity } from '../common/UserIdentity';
import {
  Button,
  Badge,
  Input,
  Textarea,
  Modal,
  ConfirmDialog,
  DataTable,
  SearchInput,
  EntityAvatar,
  UserPicker,
} from '../ui/index.js';
import {
  Plus,
  Trash2,
  Layers,
  Settings,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const AdminProjectsTab: React.FC = () => {
  const { data: projects = [], isLoading: loading } = useProjectsQuery();
  const { data: usersData } = useUsersQuery(1, 100);
  const allUsers = usersData?.items || [];

  const createProjectMutation = useCreateProjectMutation();
  const deleteProjectMutation = useDeleteProjectMutation();

  const [searchTerm, setSearchTerm] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectKey, setNewProjectKey] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectLeadId, setNewProjectLeadId] = useState<number | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectItem | null>(null);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !newProjectKey.trim()) return;

    try {
      await createProjectMutation.mutateAsync({
        name: newProjectName.trim(),
        key: newProjectKey.trim().toUpperCase(),
        description: newProjectDesc.trim() || undefined,
        leadId: newProjectLeadId || undefined,
      });

      setCreateModalOpen(false);
      setNewProjectName('');
      setNewProjectKey('');
      setNewProjectDesc('');
      setNewProjectLeadId(null);
      showFeedback('success', `Project workspace "${newProjectName.trim()}" created successfully.`);
    } catch (err: unknown) {
      showFeedback('error', err instanceof Error ? err.message : 'Failed to create project workspace');
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    try {
      await deleteProjectMutation.mutateAsync(projectToDelete.id);
      setDeleteModalOpen(false);
      showFeedback('success', `Project "${projectToDelete.name}" permanently deleted.`);
      setProjectToDelete(null);
    } catch (err: unknown) {
      showFeedback('error', err instanceof Error ? err.message : 'Failed to delete project');
    }
  };

  const filteredProjects = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.key.toLowerCase().includes(term) ||
        (p.description && p.description.toLowerCase().includes(term)) ||
        (p.lead && p.lead.fullName.toLowerCase().includes(term)),
    );
  }, [projects, searchTerm]);

  const columns = useMemo<ColumnDef<ProjectItem>[]>(() => [
    {
      id: 'project',
      header: 'Workspace Project',
      cell: ({ row }) => {
        const proj = row.original;
        return (
          <div className="flex items-center gap-3">
            <EntityAvatar
              name={proj.name}
              projectKey={proj.key}
              avatarUrl={proj.avatarUrl}
              size="sm"
            />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-[var(--md-sys-color-on-surface)] truncate">
                  {proj.name}
                </span>
                <Badge variant="neutral" size="sm" className="font-mono text-[10px]">
                  {proj.key}
                </Badge>
              </div>
              {proj.description && (
                <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] truncate max-w-xs mt-0.5">
                  {proj.description}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      id: 'lead',
      header: 'Project Lead',
      cell: ({ row }) => {
        const lead = row.original.lead;
        if (!lead) {
          return (
            <span className="text-xs text-[var(--md-sys-color-outline)] italic">
              Unassigned
            </span>
          );
        }
        return (
          <UserIdentity
            userId={lead.id}
            user={lead}
            name={lead.fullName}
            avatarUrl={lead.avatarUrl || undefined}
            email={lead.email}
            size="sm"
            showName
          />
        );
      },
    },
    {
      id: 'issues',
      header: 'Issue Workload',
      cell: ({ row }) => {
        const proj = row.original;
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold text-xs text-[var(--md-sys-color-on-surface)]">
              {proj.openIssues ?? 0} open
            </span>
            <span className="text-xs text-[var(--md-sys-color-outline)]">/</span>
            <span className="font-mono text-xs text-[var(--md-sys-color-on-surface-variant)]">
              {proj.totalIssues ?? 0} total
            </span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const proj = row.original;
        return (
          <div className="flex items-center justify-start gap-1.5">
            <Link to={`/projects/${proj.key || proj.id}/board`}>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                leftIcon={<Layers className="w-3 h-3 text-[var(--md-sys-color-primary)]" />}
              >
                Board
              </Button>
            </Link>
            <Link to={`/projects/${proj.key || proj.id}/settings`}>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                leftIcon={<Settings className="w-3 h-3 text-[var(--md-sys-color-primary)]" />}
              >
                Settings
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setProjectToDelete(proj);
                setDeleteModalOpen(true);
              }}
              className="h-7 w-7 p-0 text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)]"
              title="Delete Project"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        );
      },
    },
  ], []);

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-200">
      {/* Notifications */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)]'
              : 'bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[var(--md-sys-color-success)]" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-[var(--md-sys-color-error)]" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-bold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-[var(--md-sys-color-on-surface)]">
            Workspace Projects ({projects.length})
          </h2>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
            Manage software projects, track metrics, and govern workspace permissions.
          </p>
        </div>

        <Button
          onClick={() => setCreateModalOpen(true)}
          variant="filled"
          size="sm"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          New Project
        </Button>
      </div>

      {/* Search Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="w-full sm:w-72">
          <SearchInput
            placeholder="Search projects by name, key, or lead..."
            value={searchTerm}
            onChange={setSearchTerm}
            onClear={() => setSearchTerm('')}
          />
        </div>
      </div>

      {/* Unified Projects DataTable */}
      <DataTable
        columns={columns}
        data={filteredProjects}
        getRowId={(p) => String(p.id)}
        isLoading={loading}
        loadingMessage="Loading registered projects..."
        emptyTitle="No projects found"
        emptyDescription="No projects match your current search criteria."
      />

      {/* Create Project Modal */}
      {createModalOpen && (
        <Modal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Create New Project"
          description="Initialize a new project workspace and issue tracker"
          size="md"
        >
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase mb-1">
                Project Name
              </label>
              <Input
                value={newProjectName}
                onChange={(e) => {
                  setNewProjectName(e.target.value);
                  if (!newProjectKey) {
                    setNewProjectKey(e.target.value.slice(0, 4).toUpperCase());
                  }
                }}
                placeholder="e.g. Core Banking Platform"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase mb-1">
                Project Key (Uppercase identifier)
              </label>
              <Input
                value={newProjectKey}
                onChange={(e) => setNewProjectKey(e.target.value.toUpperCase())}
                placeholder="e.g. BANK"
                maxLength={10}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase mb-1">
                Description
              </label>
              <Textarea
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
                placeholder="Brief project description and objectives..."
                rows={2}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase mb-1">
                Designate Project Lead
              </label>
              <UserPicker
                value={newProjectLeadId}
                onChange={(userId) => setNewProjectLeadId(userId)}
                users={allUsers}
                placeholder="Select project lead..."
                allowUnassigned
                showProfileOnAvatar={false}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--md-sys-color-outline-variant)]/20">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCreateModalOpen(false)}
                disabled={createProjectMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="filled"
                size="sm"
                disabled={
                  createProjectMutation.isPending ||
                  !newProjectKey.trim() ||
                  !newProjectName.trim()
                }
                isLoading={createProjectMutation.isPending}
              >
                Create Project
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && projectToDelete && (
        <ConfirmDialog
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleDeleteProject}
          title={`Delete Project "${projectToDelete.name}" (${projectToDelete.key})?`}
          description="Are you sure you want to permanently delete this project? All associated sprints, boards, issues, comments, and attachments will be deleted irreversibly."
          confirmLabel="Delete Project"
          cancelLabel="Keep Project"
          variant="danger"
          isLoading={deleteProjectMutation.isPending}
        />
      )}
    </div>
  );
};
