import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ProjectItem } from '../../api/client.js';
import {
  useProjectsQuery,
  useCreateProjectMutation,
  useDeleteProjectMutation,
} from '../../api/queries';
import { Avatar } from '../common/Avatar.js';
import {
  Card,
  Button,
  Badge,
  Input,
  Modal,
} from '../ui/index.js';
import {
  FolderGit2,
  Plus,
  Trash2,
  Layers,
  Settings,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

export const AdminProjectsTab: React.FC = () => {
  const { data: projects = [], isLoading: loading } = useProjectsQuery();
  const createProjectMutation = useCreateProjectMutation();
  const deleteProjectMutation = useDeleteProjectMutation();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newProjectKey, setNewProjectKey] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectKey.trim() || !newProjectName.trim()) return;

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const created = await createProjectMutation.mutateAsync({
        key: newProjectKey.trim().toUpperCase(),
        name: newProjectName.trim(),
        description: newProjectDesc.trim() || undefined,
      });
      setCreateModalOpen(false);
      setNewProjectKey('');
      setNewProjectName('');
      setNewProjectDesc('');
      setSuccessMsg(`Project "${created.name}" created successfully`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    setDeleting(true);
    try {
      await deleteProjectMutation.mutateAsync(projectToDelete.id);
      setDeleteModalOpen(false);
      setProjectToDelete(null);
      setSuccessMsg('Project removed successfully');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete project');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-200">
      {successMsg && (
        <div className="flex items-center gap-2 p-3.5 bg-[var(--md-sys-color-success-container)] border border-[var(--md-sys-color-success)]/30 rounded-2xl text-xs font-semibold text-[var(--md-sys-color-on-success-container)]">
          <CheckCircle className="w-4 h-4 shrink-0 text-[var(--md-sys-color-success)]" />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 p-3.5 bg-[var(--md-sys-color-error-container)] border border-[var(--md-sys-color-error)]/30 rounded-2xl text-xs font-semibold text-[var(--md-sys-color-on-error-container)]">
          <AlertTriangle className="w-4 h-4 shrink-0 text-[var(--md-sys-color-error)]" />
          {errorMsg}
        </div>
      )}

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
          variant="filled"
          size="sm"
          onClick={() => setCreateModalOpen(true)}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-[var(--md-sys-color-on-surface-variant)]">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[var(--md-sys-color-primary)] mb-2" />
            <span className="text-xs block">Loading registered projects...</span>
          </div>
        ) : projects.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs text-[var(--md-sys-color-on-surface-variant)] border border-dashed border-[var(--md-sys-color-outline-variant)]/30 rounded-3xl bg-[var(--md-sys-color-surface-container-low)]">
            No projects registered yet. Create your first workspace above.
          </div>
        ) : (
          projects.map((proj) => (
            <Card
              key={proj.id}
              variant="filled"
              padding="md"
              rounded="3xl"
              className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 space-y-3 flex flex-col justify-between shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]">
                      <FolderGit2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-[var(--md-sys-color-on-surface)] leading-tight">
                        {proj.name}
                      </h3>
                      <Badge variant="neutral" size="sm" className="font-mono text-[10px] mt-0.5">
                        {proj.key}
                      </Badge>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setProjectToDelete(proj);
                      setDeleteModalOpen(true);
                    }}
                    className="h-7 w-7 p-0 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)]"
                    title="Delete Project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {proj.description && (
                  <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-2 line-clamp-2 leading-relaxed">
                    {proj.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-[var(--md-sys-color-outline-variant)]/20 space-y-2">
                <div className="flex items-center justify-between text-xs text-[var(--md-sys-color-on-surface-variant)]">
                  <span>Issues:</span>
                  <span className="font-bold text-[var(--md-sys-color-on-surface)] font-mono">
                    {proj.openIssues ?? 0} open / {proj.totalIssues ?? 0} total
                  </span>
                </div>

                {proj.lead && (
                  <div className="flex items-center justify-between text-xs text-[var(--md-sys-color-on-surface-variant)]">
                    <span>Lead:</span>
                    <div className="flex items-center gap-1.5">
                      <Avatar
                        name={proj.lead.fullName}
                        avatarUrl={proj.lead.avatarUrl || undefined}
                        size="sm"
                        className="w-4 h-4 text-[9px]"
                      />
                      <span className="font-semibold text-[var(--md-sys-color-on-surface)]">
                        {proj.lead.fullName}
                      </span>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-[var(--md-sys-color-outline-variant)]/10">
                  <Link to={`/projects/${proj.id}/settings`}>
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                      <Settings className="w-3 h-3 text-[var(--md-sys-color-primary)]" />
                      Settings
                    </Button>
                  </Link>
                  <Link to={`/projects/${proj.id}/board`}>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                      <Layers className="w-3 h-3 text-[var(--md-sys-color-primary)]" />
                      Board
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

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
              <Input
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
                placeholder="Brief project description and objectives..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--md-sys-color-outline-variant)]/20">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCreateModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="filled"
                size="sm"
                disabled={submitting || !newProjectKey.trim() || !newProjectName.trim()}
                isLoading={submitting}
              >
                Create Project
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && projectToDelete && (
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="Delete Project Workspace"
          description="Confirm irreversible removal of project and all associated tickets"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
              Are you sure you want to permanently delete project{' '}
              <strong className="text-[var(--md-sys-color-on-surface)] font-bold">
                {projectToDelete.name} ({projectToDelete.key})
              </strong>
              ? All sprints, boards, issue records, comments, and attachments will be deleted.
            </p>
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--md-sys-color-outline-variant)]/20">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteProject}
                disabled={deleting}
                isLoading={deleting}
              >
                Delete Project
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
