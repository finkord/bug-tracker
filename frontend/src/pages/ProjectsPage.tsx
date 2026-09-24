import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { ProjectItem, CreateProjectPayload } from '../api/client';
import {
  FolderGit2,
  Plus,
  ArrowRight,
  Loader2,
  AlertCircle,
  X,
  Layers,
  Clock,
  User,
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
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-[var(--md-sys-color-on-background)]">
            Project Workspaces
          </h1>
          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mt-1">
            Manage software repositories, review sprint velocity, and navigate Kanban boards.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold m3-btn-filled shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
              Total Workspaces
            </span>
            <FolderGit2 className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
          </div>
          <p className="text-2xl font-bold font-heading text-[var(--md-sys-color-on-surface)] mt-2">
            {projects.length}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
              Active / Open Issues
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold font-heading text-[var(--md-sys-color-on-surface)] mt-2">
            {totalOpenIssues}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
              Total Tracked Issues
            </span>
            <Layers className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold font-heading text-[var(--md-sys-color-on-surface)] mt-2">
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
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Projects Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => (
            <div
              key={project.id}
              className="flex flex-col justify-between p-5 rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] shadow-xs hover:shadow-md transition-all duration-200"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-mono text-xs font-bold text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)] px-2.5 py-1 rounded-md">
                    {project.key}
                  </span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface-variant)]">
                    {project.openIssues} open
                  </span>
                </div>

                <h3 className="font-heading font-bold text-lg text-[var(--md-sys-color-on-surface)] mb-2">
                  {project.name}
                </h3>

                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] line-clamp-3 mb-4">
                  {project.description || 'No workspace description provided.'}
                </p>
              </div>

              <div className="pt-4 border-t border-[var(--md-sys-color-outline-variant)]/50 space-y-3">
                <div className="flex items-center justify-between text-xs text-[var(--md-sys-color-on-surface-variant)]">
                  <div className="flex items-center gap-1.5 truncate">
                    <User className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Lead: {project.lead?.fullName || 'N/A'}</span>
                  </div>
                  <span>Total: {project.totalIssues}</span>
                </div>

                <Link
                  to={`/projects/${project.id}/board`}
                  className="w-full py-2 px-3 rounded-xl bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-surface)] hover:text-[var(--md-sys-color-on-primary-container)] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Open Kanban Board</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
              <h3 className="font-heading font-bold text-base text-[var(--md-sys-color-on-surface)]">
                Create Workspace Project
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="p-6 space-y-4">
              {modalError && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mobile Application iOS/Android"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                  Project Key (Prefix) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="e.g. MOB"
                  value={key}
                  onChange={(e) => setKey(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                />
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-1 block">
                  Short unique uppercase identifier for issue keys (e.g. MOB-1, MOB-2).
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Project purpose, architectural goals, target scope..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--md-sys-color-outline-variant)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-full text-xs font-semibold m3-btn-filled shadow-sm flex items-center gap-2 disabled:opacity-60"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Create Workspace</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
