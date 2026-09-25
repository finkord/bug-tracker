import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { ProjectItem, CreateProjectPayload } from '../api/client';
import { Button, Input, Modal, Badge } from '../components/ui';
import {
  FolderGit2,
  Plus,
  Loader2,
  AlertCircle,
  Layers,
  Clock,
  User,
  Kanban,
} from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Project Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getProjects();
      setProjects(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const trimmedKey = key.trim().toUpperCase();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setModalError('Project name is required');
      return;
    }
    if (!trimmedKey || trimmedKey.length < 2 || trimmedKey.length > 10) {
      setModalError('Project key must be between 2 and 10 uppercase characters (e.g. CORE, UI)');
      return;
    }

    try {
      setSubmitting(true);
      const payload: CreateProjectPayload = {
        name: trimmedName,
        key: trimmedKey,
        description: description.trim() || undefined,
      };

      const created = await api.createProject(payload);
      setProjects((prev) => [created, ...prev]);
      setIsModalOpen(false);
      setName('');
      setKey('');
      setDescription('');
    } catch (err: any) {
      setModalError(err.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  // Aggregated KPIs
  const totalOpenIssues = projects.reduce((acc, p) => acc + (p.openIssues || 0), 0);
  const totalIssues = projects.reduce((acc, p) => acc + (p.totalIssues || 0), 0);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--md-sys-color-on-background)]">
            Project Workspaces
          </h1>
          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mt-1">
            Manage software repositories, review sprint velocity, and navigate Kanban boards.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          variant="filled"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          New Project
        </Button>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
              Total Workspaces
            </span>
            <div className="w-8 h-8 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center">
              <FolderGit2 className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
            </div>
          </div>
          <p className="text-2xl font-black text-[var(--md-sys-color-on-surface)] mt-2">
            {projects.length}
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
              Active / Open Issues
            </span>
            <div className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[var(--md-sys-color-on-surface)] mt-2">
            {totalOpenIssues}
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
              Total Tracked Issues
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[var(--md-sys-color-on-surface)] mt-2">
            {totalIssues}
          </p>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--md-sys-color-primary)]" />
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Loading workspaces...</p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Projects Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => (
            <div
              key={project.id}
              className="flex flex-col justify-between bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 hover:border-[var(--md-sys-color-outline-variant)]/60 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-200"
            >
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/50 px-2.5 py-0.5 rounded-full">
                    {project.key}
                  </span>
                  <Badge variant="neutral" size="sm">
                    {project.openIssues} open
                  </Badge>
                </div>

                <h3 className="font-bold text-base text-[var(--md-sys-color-on-surface)]">
                  {project.name}
                </h3>

                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] line-clamp-3 leading-relaxed">
                  {project.description || 'No workspace description provided.'}
                </p>
              </div>

              <div className="p-5 pt-3 border-t border-[var(--md-sys-color-outline-variant)]/20 bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] rounded-b-3xl space-y-3">
                <div className="flex items-center justify-between text-xs text-[var(--md-sys-color-on-surface-variant)]">
                  <div className="flex items-center gap-1.5 truncate">
                    <User className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Lead: {project.lead?.fullName || 'N/A'}</span>
                  </div>
                  <span>Total: {project.totalIssues}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to={`/projects/${project.id}/board`}
                    className="py-2 px-3 rounded-full bg-[var(--md-sys-color-surface-container-lowest)] dark:bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-surface)] hover:text-[var(--md-sys-color-on-primary-container)] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-[var(--md-sys-color-outline-variant)]/30 cursor-pointer"
                  >
                    <Kanban className="w-3.5 h-3.5" />
                    <span>Board</span>
                  </Link>

                  <Link
                    to={`/projects/${project.id}/backlog`}
                    className="py-2 px-3 rounded-full bg-[var(--md-sys-color-surface-container-lowest)] dark:bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-surface)] hover:text-[var(--md-sys-color-on-primary-container)] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-[var(--md-sys-color-outline-variant)]/30 cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Backlog</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Workspace Project"
        description="Initialize a new tracking workspace with issue keys and team ownership."
        size="md"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          {modalError && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{modalError}</span>
            </div>
          )}

          <Input
            label="Project Name *"
            required
            placeholder="e.g. Mobile Application iOS/Android"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            label="Project Key (Prefix) *"
            required
            maxLength={10}
            placeholder="e.g. MOB"
            value={key}
            onChange={(e) => setKey(e.target.value.toUpperCase())}
            helperText="Short unique uppercase identifier for issue keys (e.g. MOB-1, MOB-2)."
            className="font-mono uppercase"
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider select-none">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Project purpose, architectural goals, target scope..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--md-sys-color-input-bg)] text-[var(--md-sys-color-input-text)] border border-[var(--md-sys-color-input-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]/20 focus:border-[var(--md-sys-color-primary)] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="filled"
              size="sm"
              isLoading={submitting}
            >
              Create Workspace
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
