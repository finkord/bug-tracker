import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, type ProjectItem } from '../../api/client.js';
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
  PlusCircle,
  Trash2,
  Layers,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

export const AdminProjectsTab: React.FC = () => {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
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

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectKey.trim() || !newProjectName.trim()) return;

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const created = await api.createProject({
        key: newProjectKey.trim().toUpperCase(),
        name: newProjectName.trim(),
        description: newProjectDesc.trim() || undefined,
      });
      setProjects((prev) => [...prev, created]);
      setCreateModalOpen(false);
      setNewProjectKey('');
      setNewProjectName('');
      setNewProjectDesc('');
      setSuccessMsg(`Project "${created.name}" created successfully`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    setDeleting(true);
    try {
      await api.deleteProject(projectToDelete.id);
      setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id));
      setDeleteModalOpen(false);
      setProjectToDelete(null);
      setSuccessMsg('Project removed successfully');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete project');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-xs font-semibold text-destructive">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Workspace Projects ({projects.length})
        </h3>
        <Button
          size="sm"
          onClick={() => setCreateModalOpen(true)}
          className="text-xs gap-1.5 font-semibold"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
            <span className="text-xs mt-2 block">Loading projects...</span>
          </div>
        ) : projects.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg bg-card/30">
            No projects found. Create your first project above.
          </div>
        ) : (
          projects.map((proj) => (
            <Card key={proj.id} className="p-4 bg-card/80 border-border/80 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded bg-primary/10 text-primary">
                      <FolderGit2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground leading-tight">
                        {proj.name}
                      </h4>
                      <Badge variant="neutral" className="font-mono text-[10px] mt-0.5">
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
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {proj.description && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {proj.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-border/60 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Issues:</span>
                  <span className="font-semibold text-foreground font-mono">
                    {proj.openIssues ?? 0} open / {proj.totalIssues ?? 0} total
                  </span>
                </div>

                {proj.lead && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Lead:</span>
                    <div className="flex items-center gap-1.5">
                      <Avatar
                        name={proj.lead.fullName}
                        avatarUrl={proj.lead.avatarUrl || undefined}
                        size="sm"
                        className="w-4 h-4 text-[9px]"
                      />
                      <span className="font-medium text-foreground">{proj.lead.fullName}</span>
                    </div>
                  </div>
                )}

                <div className="pt-1 flex items-center justify-end gap-2">
                  <Link to={`/projects/${proj.id}/board`}>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                      <Layers className="w-3 h-3 text-primary" />
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
          size="md"
        >
          <form onSubmit={handleCreateProject} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
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
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
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
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                Description
              </label>
              <Input
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
                placeholder="Brief project description and objectives..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCreateModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting || !newProjectKey.trim() || !newProjectName.trim()}>
                {submitting ? 'Creating...' : 'Create Project'}
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
          title="Delete Project"
          size="sm"
        >
          <div className="p-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete project <strong className="text-foreground">{projectToDelete.name} ({projectToDelete.key})</strong>?
              This will remove all associated issues and boards.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
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
              >
                {deleting ? 'Deleting...' : 'Delete Project'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
