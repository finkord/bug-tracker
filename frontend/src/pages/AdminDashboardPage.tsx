import React, { useState, useEffect } from 'react';
import {
  api,
  type UserProfile,
  type LoginAuditLogItem,
  type ProjectItem,
  type WorklogStats,
  type SystemRole,
} from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/common/Avatar';
import {
  ShieldAlert,
  Users,
  ShieldCheck,
  FolderGit2,
  TrendingUp,
  Search,
  CheckCircle,
  RotateCcw,
  Loader2,
  Trash2,
  Database,
  Mail,
  Activity,
  HardDrive,
  PlusCircle,
} from 'lucide-react';

interface AdminDashboardPageProps {
  defaultTab?: 'users' | 'roles' | 'system' | 'projects' | 'analytics';
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  defaultTab = 'users',
}) => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'system' | 'projects' | 'analytics'>(defaultTab);

  // User Management State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Projects State
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [newProjectKey, setNewProjectKey] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<LoginAuditLogItem[]>([]);

  // Time Analytics State
  const [timeStats, setTimeStats] = useState<WorklogStats | null>(null);

  // Custom Roles & RBAC Matrix State
  const [customRoles, setCustomRoles] = useState<Array<{ name: string; label: string; description: string; permissions: string[] }>>(() => {
    try {
      const raw = localStorage.getItem('bt_custom_roles');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [createRoleModalOpen, setCreateRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [newRolePermissions, setNewRolePermissions] = useState<string[]>([
    'issues:create',
    'issues:edit',
    'issues:status',
    'worklogs:log',
  ]);

  // System Security KPI Stats
  const [systemStats, setSystemStats] = useState<{
    totalUsers: number;
    activeUsers: number;
    blockedUsers: number;
    twoFactorAdoptionCount: number;
    twoFactorPercentage: number;
    roleBreakdown?: Record<string, number>;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const data = await api.getUsers({
        page: userPage,
        limit: 25,
        search: userSearch || undefined,
        role: userRoleFilter || undefined,
      });
      setUsers(data.items);
      setTotalUsers(data.total);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to fetch users');
    }
  };

  const fetchProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to fetch projects');
    }
  };

  const fetchLogsAndStats = async () => {
    try {
      const [statsData, logsData, timeData] = await Promise.all([
        api.getAdminStats(),
        api.getLoginAuditLogs(1, 30),
        api.getWorklogStats().catch(() => null),
      ]);
      setSystemStats(statsData);
      setAuditLogs(logsData.items);
      setTimeStats(timeData);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to fetch system logs');
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchUsers(), fetchProjects(), fetchLogsAndStats()]).finally(() => {
      setLoading(false);
    });
  }, [userPage, userRoleFilter]);

  // Handle user search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearch]);

  const handleRoleChange = async (userId: number, role: SystemRole, jobTitle?: string) => {
    try {
      await api.updateUserRole(userId, role, jobTitle);
      setActionSuccess(`User #${userId} role changed to ${role}`);
      await fetchUsers();
      await fetchLogsAndStats();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update user role');
    }
  };

  const handleJobTitleChange = async (userId: number, currentRole: SystemRole, newJobTitle: string) => {
    try {
      await api.updateUserRole(userId, currentRole, newJobTitle);
      setActionSuccess(`User #${userId} work label updated to "${newJobTitle}"`);
      await fetchUsers();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update user work label');
    }
  };

  const handleSaveCustomRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    const formattedName = newRoleName.trim().toUpperCase().replace(/\s+/g, '_');
    const newRoleObj = {
      name: formattedName,
      label: newRoleName.trim(),
      description: newRoleDescription.trim() || 'Custom organizational access role',
      permissions: newRolePermissions,
    };
    const updated = [...customRoles.filter((r) => r.name !== formattedName), newRoleObj];
    setCustomRoles(updated);
    localStorage.setItem('bt_custom_roles', JSON.stringify(updated));
    setActionSuccess(`Custom RBAC Role "${newRoleName.trim()}" successfully registered`);
    setCreateRoleModalOpen(false);
    setNewRoleName('');
    setNewRoleDescription('');
  };

  const handleToggleBlock = async (userId: number, isBlocked: boolean) => {
    try {
      if (isBlocked) {
        await api.unblockUser(userId);
        setActionSuccess(`User #${userId} unblocked`);
      } else {
        await api.blockUser(userId);
        setActionSuccess(`User #${userId} blocked`);
      }
      await fetchUsers();
      await fetchLogsAndStats();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to toggle account block status');
    }
  };

  const handleReset2Fa = async (userId: number) => {
    const confirmed = window.confirm(`Reset Two-Factor Authentication for user #${userId}?`);
    if (!confirmed) return;
    try {
      await api.adminResetUser2Fa(userId);
      setActionSuccess(`2FA reset successfully for user #${userId}`);
      await fetchUsers();
      await fetchLogsAndStats();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reset 2FA');
    }
  };

  const handleActivateUser = async (userId: number) => {
    try {
      await api.adminActivateUser(userId);
      setActionSuccess(`User #${userId} manually activated`);
      await fetchUsers();
      await fetchLogsAndStats();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to activate user');
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectKey.trim() || !newProjectName.trim()) return;

    setCreatingProject(true);
    try {
      await api.createProject({
        key: newProjectKey.trim().toUpperCase(),
        name: newProjectName.trim(),
      });
      setNewProjectKey('');
      setNewProjectName('');
      setActionSuccess('Project created successfully');
      await fetchProjects();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create project');
    } finally {
      setCreatingProject(false);
    }
  };

  const handleDeleteProject = async (projectId: number, projectKey: string) => {
    const confirmed = window.confirm(
      `Permanently delete project [${projectKey}] and all its associated issues? This cannot be undone!`,
    );
    if (!confirmed) return;

    try {
      await api.deleteProject(projectId);
      setActionSuccess(`Project [${projectKey}] deleted`);
      await fetchProjects();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete project');
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-3xl m3-card-high border border-[var(--md-sys-color-outline-variant)] shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center font-bold">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--md-sys-color-on-surface)]">
              System Administration & Control Center
            </h1>
            <p className="text-xs sm:text-sm text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
              Extended RBAC governance, audit forensics, project management, and team analytics
            </p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center justify-between">
          <span>✓ {actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-xs hover:underline">Dismiss</button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-between">
          <span>⚠ {errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-xs hover:underline">Dismiss</button>
        </div>
      )}

      {/* Navigation Tabs (4 Sections) */}
      <div className="flex items-center gap-2 border-b border-[var(--md-sys-color-outline-variant)] pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'users'
              ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shadow-xs'
              : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Management</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'roles'
              ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shadow-xs'
              : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)]'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>RBAC & Roles Matrix</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('system')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'system'
              ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shadow-xs'
              : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)]'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>System & Security</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('projects')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'projects'
              ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shadow-xs'
              : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)]'
          }`}
        >
          <FolderGit2 className="w-4 h-4" />
          <span>Projects Control</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'analytics'
              ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shadow-xs'
              : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)]'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Team Analytics</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--md-sys-color-primary)]" />
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Loading admin console...</p>
        </div>
      ) : (
        <>
          {/* ==================================================== */}
          {/* 1. USER MANAGEMENT TAB */}
          {/* ==================================================== */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Search & Filters Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl m3-card-high border border-[var(--md-sys-color-outline-variant)]">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
                  <input
                    type="text"
                    placeholder="Search by full name or email address..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full text-xs pl-10 pr-4 py-2 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="text-xs px-3 py-2 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)]"
                  >
                    <option value="">All Roles</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="PROJECT_MANAGER">PROJECT_MANAGER</option>
                    <option value="DEVELOPER">DEVELOPER</option>
                    <option value="QA_ENGINEER">QA_ENGINEER</option>
                    <option value="USER">USER</option>
                  </select>
                </div>
              </div>

              {/* Users Table */}
              <div className="p-6 rounded-3xl m3-card-high border border-[var(--md-sys-color-outline-variant)] space-y-4 shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-3">User</th>
                        <th className="py-2.5 px-3">Work Label (Title)</th>
                        <th className="py-2.5 px-3">System Role</th>
                        <th className="py-2.5 px-3">Security & Status</th>
                        <th className="py-2.5 px-3">2FA</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]/40">
                      {users.map((u) => {
                        const isSelf = currentUser?.id === u.id;
                        return (
                          <tr key={u.id} className="hover:bg-[var(--md-sys-color-surface-container)] transition-colors">
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-3">
                                <Avatar name={u.fullName} avatarUrl={u.avatarUrl} size="sm" />
                                <div>
                                  <p className="font-bold text-[var(--md-sys-color-on-surface)]">
                                    {u.fullName} {isSelf && <span className="text-[10px] text-[var(--md-sys-color-primary)] font-normal">(You)</span>}
                                  </p>
                                  <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                                    {u.email}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Coworker Work Role / Job Title */}
                            <td className="py-3 px-3">
                              <select
                                value={u.jobTitle || (u.systemRole === 'DEVELOPER' ? 'Software Developer' : u.systemRole === 'QA_ENGINEER' ? 'QA Engineer' : u.systemRole === 'PROJECT_MANAGER' ? 'Project Manager' : u.systemRole === 'ADMIN' ? 'System Administrator' : 'Software Engineer')}
                                onChange={(e) => handleJobTitleChange(u.id, u.systemRole, e.target.value)}
                                className="text-xs font-medium px-2 py-1 rounded-lg bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] cursor-pointer"
                              >
                                <option value="Software Developer">Software Developer</option>
                                <option value="Frontend Developer">Frontend Developer</option>
                                <option value="Backend Developer">Backend Developer</option>
                                <option value="Fullstack Developer">Fullstack Developer</option>
                                <option value="DevOps Engineer">DevOps Engineer</option>
                                <option value="QA Engineer">QA Engineer</option>
                                <option value="Security Engineer">Security Engineer</option>
                                <option value="Project Manager">Project Manager</option>
                                <option value="System Architect">System Architect</option>
                                <option value="UI/UX Designer">UI/UX Designer</option>
                              </select>
                            </td>

                            {/* System Access Role */}
                            <td className="py-3 px-3">
                              <select
                                value={u.systemRole}
                                disabled={isSelf}
                                onChange={(e) => handleRoleChange(u.id, e.target.value as SystemRole)}
                                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] cursor-pointer disabled:opacity-60"
                              >
                                <option value="ADMIN">ADMIN</option>
                                <option value="PROJECT_MANAGER">PROJECT_MANAGER</option>
                                <option value="DEVELOPER">DEVELOPER</option>
                                <option value="QA_ENGINEER">QA_ENGINEER</option>
                                <option value="DEVOPS_ENGINEER">DEVOPS_ENGINEER</option>
                                <option value="SECURITY_ENGINEER">SECURITY_ENGINEER</option>
                                <option value="USER">USER</option>
                              </select>
                            </td>

                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    u.isBlocked
                                      ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                  }`}
                                >
                                  {u.isBlocked ? 'BLOCKED' : 'ACTIVE'}
                                </span>

                                {!u.isActivated && (
                                  <button
                                    type="button"
                                    onClick={() => handleActivateUser(u.id)}
                                    className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                                  >
                                    Activate
                                  </button>
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              {u.twoFactorEnabled ? (
                                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>Enabled</span>
                                </span>
                              ) : (
                                <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] opacity-60">
                                  Disabled
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-3 text-right">
                              <div className="inline-flex items-center gap-2">
                                {u.twoFactorEnabled && (
                                  <button
                                    type="button"
                                    onClick={() => handleReset2Fa(u.id)}
                                    className="p-1 rounded-md text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)] hover:text-[var(--md-sys-color-primary)] transition-colors"
                                    title="Reset 2FA"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {!isSelf && (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleBlock(u.id, u.isBlocked)}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                                      u.isBlocked
                                        ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                                        : 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20'
                                    }`}
                                  >
                                    {u.isBlocked ? 'Unblock' : 'Block'}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[var(--md-sys-color-outline-variant)] text-xs text-[var(--md-sys-color-on-surface-variant)]">
                  <span>Showing {users.length} of {totalUsers} registered users</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={userPage <= 1}
                      onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1 rounded-lg border border-[var(--md-sys-color-outline-variant)] disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <span className="px-2">Page {userPage}</span>
                    <button
                      type="button"
                      disabled={users.length < 25}
                      onClick={() => setUserPage((p) => p + 1)}
                      className="px-3 py-1 rounded-lg border border-[var(--md-sys-color-outline-variant)] disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

                    {/* ==================================================== */}
          {/* ROLES & PERMISSIONS MATRIX TAB */}
          {/* ==================================================== */}
          {activeTab === 'roles' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-3xl m3-card-high border border-[var(--md-sys-color-outline-variant)]">
                <div>
                  <h3 className="text-base font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
                    <span>RBAC Permissions & Coworker Role Matrix</span>
                  </h3>
                  <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">
                    Configure granular capabilities for Software Developers, DevOps, QA, Security Engineers, and custom access profiles.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setCreateRoleModalOpen(true)}
                  className="px-4 py-2 rounded-full m3-btn-filled text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Create Custom Role</span>
                </button>
              </div>

              {/* Roles Matrix Table */}
              <div className="p-6 rounded-3xl m3-card-high border border-[var(--md-sys-color-outline-variant)] space-y-4 shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-3">System Permission</th>
                        <th className="py-3 px-3">Scope</th>
                        <th className="py-3 px-3 text-center">ADMIN</th>
                        <th className="py-3 px-3 text-center">PROJECT_MGR</th>
                        <th className="py-3 px-3 text-center">DEVELOPER</th>
                        <th className="py-3 px-3 text-center">QA_ENG</th>
                        <th className="py-3 px-3 text-center">DEVOPS</th>
                        <th className="py-3 px-3 text-center">SECURITY</th>
                        <th className="py-3 px-3 text-center">USER</th>
                        {customRoles.map((r) => (
                          <th key={r.name} className="py-3 px-3 text-center text-[var(--md-sys-color-primary)]">
                            {r.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]/40 font-mono text-[11px]">
                      {[
                        { id: 'issues:create', name: 'Create Defect / Task', scope: 'Issues', pm: true, dev: true, qa: true, devops: true, sec: true, user: true },
                        { id: 'issues:edit', name: 'Edit Issue Details & Estimates', scope: 'Issues', pm: true, dev: true, qa: true, devops: true, sec: true, user: false },
                        { id: 'issues:status', name: 'Move Cards on Kanban Board', scope: 'Issues', pm: true, dev: true, qa: true, devops: true, sec: true, user: false },
                        { id: 'issues:assign', name: 'Assign Tickets to Coworkers', scope: 'Issues', pm: true, dev: true, qa: true, devops: true, sec: true, user: false },
                        { id: 'issues:delete', name: 'Delete Issues', scope: 'Issues', pm: true, dev: false, qa: false, devops: false, sec: false, user: false },
                        { id: 'worklogs:log', name: 'Log Work Hours & Minutes', scope: 'Time', pm: true, dev: true, qa: true, devops: true, sec: true, user: true },
                        { id: 'worklogs:team', name: 'View Team Timesheet Matrix', scope: 'Time', pm: true, dev: true, qa: true, devops: true, sec: true, user: false },
                        { id: 'sprints:manage', name: 'Create & Manage Agile Sprints', scope: 'Sprints', pm: true, dev: true, qa: false, devops: true, sec: false, user: false },
                        { id: 'projects:manage', name: 'Create & Manage Workspaces', scope: 'Projects', pm: true, dev: false, qa: false, devops: true, sec: false, user: false },
                        { id: 'security:audit', name: 'Inspect Security Audit Logs', scope: 'Security', pm: false, dev: false, qa: false, devops: true, sec: true, user: false },
                        { id: 'users:manage', name: 'Activate, Block & Assign Roles', scope: 'Admin', pm: false, dev: false, qa: false, devops: false, sec: false, user: false },
                      ].map((perm) => (
                        <tr key={perm.id} className="hover:bg-[var(--md-sys-color-surface-container)]/50">
                          <td className="py-2.5 px-3 font-sans font-semibold text-[var(--md-sys-color-on-surface)]">
                            {perm.name}
                            <span className="block font-mono text-[10px] text-[var(--md-sys-color-on-surface-variant)]">{perm.id}</span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-md bg-[var(--md-sys-color-surface-container-highest)] text-[10px] uppercase font-bold text-[var(--md-sys-color-on-surface-variant)]">
                              {perm.scope}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓</td>
                          <td className="py-2.5 px-3 text-center">{perm.pm ? <span className="text-emerald-600 font-bold">✓</span> : <span className="opacity-20">-</span>}</td>
                          <td className="py-2.5 px-3 text-center">{perm.dev ? <span className="text-emerald-600 font-bold">✓</span> : <span className="opacity-20">-</span>}</td>
                          <td className="py-2.5 px-3 text-center">{perm.qa ? <span className="text-emerald-600 font-bold">✓</span> : <span className="opacity-20">-</span>}</td>
                          <td className="py-2.5 px-3 text-center">{perm.devops ? <span className="text-emerald-600 font-bold">✓</span> : <span className="opacity-20">-</span>}</td>
                          <td className="py-2.5 px-3 text-center">{perm.sec ? <span className="text-emerald-600 font-bold">✓</span> : <span className="opacity-20">-</span>}</td>
                          <td className="py-2.5 px-3 text-center">{perm.user ? <span className="text-emerald-600 font-bold">✓</span> : <span className="opacity-20">-</span>}</td>
                          {customRoles.map((r) => (
                            <td key={r.name} className="py-2.5 px-3 text-center">
                              {r.permissions.includes(perm.id) ? (
                                <span className="text-[var(--md-sys-color-primary)] font-bold">✓</span>
                              ) : (
                                <span className="opacity-20">-</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Coworker Labels Directory Guide */}
              <div className="p-6 rounded-3xl m3-card-high border border-[var(--md-sys-color-outline-variant)] space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                  Registered Coworker Role Labels
                </h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Software Developer',
                    'DevOps Engineer',
                    'QA Engineer',
                    'Security Engineer',
                    'Frontend Developer',
                    'Backend Developer',
                    'Fullstack Developer',
                    'Project Manager',
                    'System Architect',
                    'UI/UX Designer',
                  ].map((label) => (
                    <span
                      key={label}
                      className="px-3 py-1 rounded-xl text-xs font-semibold bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)]"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* 2. SYSTEM & SECURITY TAB */}
          {/* ==================================================== */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              {/* Service Health Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-3xl m3-card-high border border-[var(--md-sys-color-outline-variant)] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-emerald-500" />
                      <span className="font-bold text-xs text-[var(--md-sys-color-on-surface)]">PostgreSQL 15</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                      HEALTHY
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                    Port 5432 • 3NF Database Synchronized
                  </p>
                </div>

                <div className="p-4 rounded-3xl m3-card-high border border-[var(--md-sys-color-outline-variant)] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-500" />
                      <span className="font-bold text-xs text-[var(--md-sys-color-on-surface)]">Redis 7</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                      HEALTHY
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                    Port 6379 • Session & Lockout Store
                  </p>
                </div>

                <div className="p-4 rounded-3xl m3-card-high border border-[var(--md-sys-color-outline-variant)] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-emerald-500" />
                      <span className="font-bold text-xs text-[var(--md-sys-color-on-surface)]">Mailpit</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                      ONLINE
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                    Ports 1025 / 8025 • Mailbox Active
                  </p>
                </div>

                <div className="p-4 rounded-3xl m3-card-high border border-[var(--md-sys-color-outline-variant)] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-emerald-500" />
                      <span className="font-bold text-xs text-[var(--md-sys-color-on-surface)]">SeaweedFS S3</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                      READY
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                    Ports 8333 / 9333 • Distributed Storage
                  </p>
                </div>
              </div>

              {/* Login Audit Logs Table */}
              <div className="p-6 rounded-3xl m3-card-high border border-[var(--md-sys-color-outline-variant)] space-y-4 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--md-sys-color-outline-variant)]">
                  <h3 className="font-bold text-sm text-[var(--md-sys-color-on-surface)]">
                    Authentication Audit Trail ({auditLogs.length})
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-3">Timestamp</th>
                        <th className="py-2.5 px-3">IP Address</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]/40 font-mono text-[11px]">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-[var(--md-sys-color-surface-container)]">
                          <td className="py-2 px-3 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                          <td className="py-2 px-3">{log.ipAddress}</td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                log.status === 'SUCCESS'
                                  ? 'bg-emerald-500/10 text-emerald-600'
                                  : log.status === 'LOCKED_OUT'
                                  ? 'bg-red-600 text-white'
                                  : 'bg-rose-500/10 text-rose-500'
                              }`}
                            >
                              {log.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-[var(--md-sys-color-on-surface-variant)] truncate max-w-sm">
                            {log.failureReason || 'Normal session established'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* 3. PROJECTS CONTROL TAB */}
          {/* ==================================================== */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              {/* Create Project Card */}
              <div className="p-6 rounded-3xl m3-card-high border border-[var(--md-sys-color-outline-variant)] space-y-4 shadow-xs">
                <div className="flex items-center gap-2 pb-2 border-b border-[var(--md-sys-color-outline-variant)]">
                  <PlusCircle className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                  <h3 className="font-bold text-sm text-[var(--md-sys-color-on-surface)]">
                    Register New Workspace Project
                  </h3>
                </div>

                <form onSubmit={handleCreateProject} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                      Key (2-6 letters) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="e.g. AUTH"
                      value={newProjectKey}
                      onChange={(e) => setNewProjectKey(e.target.value.toUpperCase())}
                      className="w-full text-xs font-mono uppercase px-3 py-2 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                      Project Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Authentication Service"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={creatingProject}
                      className="w-full py-2 rounded-xl m3-btn-filled text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>{creatingProject ? 'Creating...' : 'Create Project'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Projects Table */}
              <div className="p-6 rounded-3xl m3-card-high border border-[var(--md-sys-color-outline-variant)] space-y-4 shadow-xs">
                <h3 className="font-bold text-sm text-[var(--md-sys-color-on-surface)]">
                  All Registered Workspaces ({projects.length})
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-3">Key</th>
                        <th className="py-2.5 px-3">Project Name</th>
                        <th className="py-2.5 px-3">Project Lead</th>
                        <th className="py-2.5 px-3">Issues</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]/40">
                      {projects.map((p) => (
                        <tr key={p.id} className="hover:bg-[var(--md-sys-color-surface-container)]">
                          <td className="py-3 px-3 font-mono font-bold text-[var(--md-sys-color-primary)]">
                            {p.key}
                          </td>
                          <td className="py-3 px-3 font-semibold text-[var(--md-sys-color-on-surface)]">
                            {p.name}
                          </td>
                          <td className="py-3 px-3 text-[var(--md-sys-color-on-surface-variant)]">
                            {p.lead?.fullName || 'Not assigned'}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-mono text-[11px]">
                              {p.openIssues ?? 0} open / {p.totalIssues ?? 0} total
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteProject(p.id, p.key)}
                              className="p-1 rounded-md text-[var(--md-sys-color-on-surface-variant)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                              title="Delete project"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* 4. TEAM ANALYTICS & VELOCITY TAB */}
          {/* ==================================================== */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Analytics Header Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-3xl m3-tile shadow-xs space-y-1">
                  <span className="text-xs uppercase font-semibold text-[var(--md-sys-color-on-surface-variant)]">
                    Total Time Logged
                  </span>
                  <div className="text-3xl font-extrabold text-[var(--md-sys-color-on-surface)]">
                    {timeStats?.totalHoursLogged || 0} hrs
                  </div>
                  <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                    Across {projects.length} software projects
                  </p>
                </div>

                <div className="p-5 rounded-3xl m3-tile shadow-xs space-y-1">
                  <span className="text-xs uppercase font-semibold text-[var(--md-sys-color-on-surface-variant)]">
                    2FA Security Adoption
                  </span>
                  <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    {systemStats?.twoFactorPercentage || 0}%
                  </div>
                  <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                    {systemStats?.twoFactorAdoptionCount || 0} of {systemStats?.totalUsers || 0} users protected
                  </p>
                </div>

                <div className="p-5 rounded-3xl m3-tile shadow-xs space-y-1">
                  <span className="text-xs uppercase font-semibold text-[var(--md-sys-color-on-surface-variant)]">
                    Active Accounts
                  </span>
                  <div className="text-3xl font-extrabold text-[var(--md-sys-color-primary)]">
                    {systemStats?.activeUsers || 0}
                  </div>
                  <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                    Verified and unblocked accounts
                  </p>
                </div>
              </div>

              {/* Roles Breakdown */}
              {systemStats?.roleBreakdown && (
                <div className="p-6 rounded-3xl m3-card-high border border-[var(--md-sys-color-outline-variant)] space-y-4 shadow-xs">
                  <h3 className="font-bold text-sm text-[var(--md-sys-color-on-surface)]">
                    RBAC Role Distribution (5 Roles)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {Object.entries(systemStats.roleBreakdown).map(([role, count]) => (
                      <div key={role} className="p-3 rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] text-center">
                        <span className="text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] block">
                          {role}
                        </span>
                        <span className="text-xl font-extrabold text-[var(--md-sys-color-on-surface)]">
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
      {/* Create Custom Role Modal */}
      {createRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-[28px] bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
              <span>Create Custom Access Role</span>
            </h3>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
              Define custom permissions for new organizational roles (e.g. DevOps Lead, Security Auditor).
            </p>

            <form onSubmit={handleSaveCustomRole} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Role Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DevOps Engineer"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Responsibilities and permission scope"
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-2">
                  Select Included Permissions *
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'issues:create', label: 'Create Issues' },
                    { id: 'issues:edit', label: 'Edit Issues & Estimates' },
                    { id: 'issues:status', label: 'Move Kanban Status' },
                    { id: 'issues:assign', label: 'Assign Tickets' },
                    { id: 'issues:delete', label: 'Delete Issues' },
                    { id: 'worklogs:log', label: 'Log Working Time' },
                    { id: 'worklogs:team', label: 'Team Timesheet Access' },
                    { id: 'sprints:manage', label: 'Sprint Planning' },
                    { id: 'projects:manage', label: 'Workspace Governance' },
                    { id: 'security:audit', label: 'Security Forensics' },
                  ].map((p) => {
                    const isChecked = newRolePermissions.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-[var(--md-sys-color-primary-container)]/30 border-[var(--md-sys-color-primary)] font-semibold'
                            : 'bg-[var(--md-sys-color-surface)] border-[var(--md-sys-color-outline-variant)] opacity-70'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewRolePermissions((prev) => [...prev, p.id]);
                            } else {
                              setNewRolePermissions((prev) => prev.filter((id) => id !== p.id));
                            }
                          }}
                          className="rounded text-[var(--md-sys-color-primary)]"
                        />
                        <span>{p.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
                <button
                  type="button"
                  onClick={() => setCreateRoleModalOpen(false)}
                  className="px-4 py-2 rounded-full m3-btn-outline text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full m3-btn-filled text-xs font-semibold flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Register Role</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
