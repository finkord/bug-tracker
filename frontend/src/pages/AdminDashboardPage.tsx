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
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useBroadcast, type BroadcastSeverity } from '../context/BroadcastContext';
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
  Activity,
  PlusCircle,
  Lock,
  Unlock,
  Megaphone,
  Radio,
  AlertTriangle,
  Info,
  CheckCircle2,
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

  // DevOps Broadcast Banner State
  const { broadcast, updateBroadcast } = useBroadcast();
  const [broadcastEnabled, setBroadcastEnabled] = useState(broadcast.enabled);
  const [broadcastMessage, setBroadcastMessage] = useState(broadcast.message);
  const [broadcastSeverity, setBroadcastSeverity] = useState<BroadcastSeverity>(broadcast.severity);
  const [broadcastSavedMsg, setBroadcastSavedMsg] = useState(false);

  useEffect(() => {
    setBroadcastEnabled(broadcast.enabled);
    setBroadcastMessage(broadcast.message);
    setBroadcastSeverity(broadcast.severity);
  }, [broadcast]);

  const handleSaveBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    updateBroadcast({
      enabled: broadcastEnabled,
      message: broadcastMessage.trim(),
      severity: broadcastSeverity,
      author: currentUser?.fullName || 'DevOps Team',
    });
    setBroadcastSavedMsg(true);
    setTimeout(() => setBroadcastSavedMsg(false), 3000);
  };

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
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-[var(--md-sys-color-surface-container-low)] rounded-3xl p-5 sm:p-6 border border-[var(--md-sys-color-outline-variant)]/20 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center font-bold shrink-0 shadow-2xs">
              <ShieldAlert className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[var(--md-sys-color-on-surface)] tracking-tight">
                Administration & Governance Center
              </h1>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                Extended RBAC governance, audit forensics, project management, and team capacity
              </p>
            </div>
          </div>
          <Badge variant="primary" size="sm" className="rounded-full px-3 py-1 font-semibold">
            Platform Master Console
          </Badge>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-[var(--md-sys-color-success-container)] border border-[var(--md-sys-color-success)]/25 text-[var(--md-sys-color-on-success-container)] text-xs font-semibold flex items-center justify-between shadow-2xs">
          <span>✓ {actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-xs hover:underline cursor-pointer">Dismiss</button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-[var(--md-sys-color-error-container)] border border-[var(--md-sys-color-error)]/25 text-[var(--md-sys-color-on-error-container)] text-xs font-semibold flex items-center justify-between shadow-2xs">
          <span>⚠ {errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-xs hover:underline cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 overflow-x-auto w-fit max-w-full shadow-2xs">
        <Button
          type="button"
          variant={activeTab === 'users' ? 'filled' : 'ghost'}
          size="sm"
          className="rounded-full px-4 text-xs font-bold"
          onClick={() => setActiveTab('users')}
          leftIcon={<Users className="w-3.5 h-3.5" />}
        >
          User Management
        </Button>

        <Button
          type="button"
          variant={activeTab === 'roles' ? 'filled' : 'ghost'}
          size="sm"
          className="rounded-full px-4 text-xs font-bold"
          onClick={() => setActiveTab('roles')}
          leftIcon={<ShieldAlert className="w-3.5 h-3.5" />}
        >
          RBAC & Roles Matrix
        </Button>

        <Button
          type="button"
          variant={activeTab === 'system' ? 'filled' : 'ghost'}
          size="sm"
          className="rounded-full px-4 text-xs font-bold"
          onClick={() => setActiveTab('system')}
          leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
        >
          System & Security
        </Button>

        <Button
          type="button"
          variant={activeTab === 'projects' ? 'filled' : 'ghost'}
          size="sm"
          className="rounded-full px-4 text-xs font-bold"
          onClick={() => setActiveTab('projects')}
          leftIcon={<FolderGit2 className="w-3.5 h-3.5" />}
        >
          Projects Control
        </Button>

        <Button
          type="button"
          variant={activeTab === 'analytics' ? 'filled' : 'ghost'}
          size="sm"
          className="rounded-full px-4 text-xs font-bold"
          onClick={() => setActiveTab('analytics')}
          leftIcon={<TrendingUp className="w-3.5 h-3.5" />}
        >
          Team Analytics
        </Button>
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
            <div className="space-y-4">
              {/* Search & Filters Bar */}
              <div className="bg-[var(--md-sys-color-surface-container-low)] rounded-3xl p-3.5 sm:p-4 border border-[var(--md-sys-color-outline-variant)]/20 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="absolute left-3.5 top-2.5 w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)]" />
                  <input
                    type="text"
                    placeholder="Search by full name or email address..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full text-xs pl-9 pr-3.5 py-2 rounded-full bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]/30 text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)] font-medium transition-all"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="text-xs px-3.5 py-2 rounded-full bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]/30 text-[var(--md-sys-color-on-surface)] font-medium cursor-pointer transition-colors focus:ring-2 focus:ring-[var(--md-sys-color-primary)] focus:outline-hidden"
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
              <div className="bg-[var(--md-sys-color-surface-container-low)] rounded-3xl border border-[var(--md-sys-color-outline-variant)]/20 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse table-auto">
                    <thead>
                      <tr className="bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)]/60 border-b border-[var(--md-sys-color-outline-variant)]/30 text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider text-[10px] font-bold">
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Work Label (Title)</th>
                        <th className="py-3 px-4">System Role</th>
                        <th className="py-3 px-4">Security & Status</th>
                        <th className="py-3 px-4">2FA</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]/20 text-[var(--md-sys-color-on-surface)]">
                      {users.map((u) => {
                        const isSelf = currentUser?.id === u.id;
                        return (
                          <tr key={u.id} className="hover:bg-[var(--md-sys-color-surface-container)] dark:hover:bg-[var(--md-sys-color-surface-container-high)]/50 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
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

                            {/* Job Title */}
                            <td className="py-3 px-4">
                              <select
                                value={u.jobTitle || (u.systemRole === 'DEVELOPER' ? 'Software Developer' : u.systemRole === 'QA_ENGINEER' ? 'QA Engineer' : u.systemRole === 'PROJECT_MANAGER' ? 'Project Manager' : u.systemRole === 'ADMIN' ? 'System Administrator' : 'Software Engineer')}
                                onChange={(e) => handleJobTitleChange(u.id, u.systemRole, e.target.value)}
                                className="text-xs font-medium px-3 py-1.5 rounded-full bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]/30 text-[var(--md-sys-color-on-surface)] cursor-pointer transition-colors focus:ring-2 focus:ring-[var(--md-sys-color-primary)] focus:outline-hidden"
                              >
                                <option value="Software Developer">Software Developer</option>
                                <option value="Frontend Developer">Frontend Developer</option>
                                <option value="Backend Developer">Backend Developer</option>
                                <option value="Fullstack Developer">Fullstack Developer</option>
                                <option value="DevOps Engineer">DevOps Engineer</option>
                                <option value="QA Engineer">QA Engineer</option>
                                <option value="Project Manager">Project Manager</option>
                                <option value="System Administrator">System Administrator</option>
                              </select>
                            </td>

                            {/* System Role Selector */}
                            <td className="py-3 px-4">
                              <select
                                value={u.systemRole}
                                disabled={isSelf}
                                onChange={(e) => handleRoleChange(u.id, e.target.value as SystemRole, u.jobTitle || undefined)}
                                className="text-xs font-bold px-3 py-1.5 rounded-full bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]/30 text-[var(--md-sys-color-on-surface)] cursor-pointer transition-colors focus:ring-2 focus:ring-[var(--md-sys-color-primary)] focus:outline-hidden disabled:opacity-50"
                              >
                                <option value="USER">USER</option>
                                <option value="DEVELOPER">DEVELOPER</option>
                                <option value="QA_ENGINEER">QA_ENGINEER</option>
                                <option value="PROJECT_MANAGER">PROJECT_MANAGER</option>
                                <option value="ADMIN">ADMIN</option>
                              </select>
                            </td>

                            {/* Status & Activation */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {u.isActivated ? (
                                  <Badge variant="success" size="sm" dot className="rounded-full font-semibold">
                                    Activated
                                  </Badge>
                                ) : (
                                  <Badge variant="warning" size="sm" dot className="rounded-full font-semibold">
                                    Pending
                                  </Badge>
                                )}

                                {u.isBlocked ? (
                                  <Badge variant="error" size="sm" className="rounded-full font-semibold">
                                    Blocked
                                  </Badge>
                                ) : (
                                  <Badge variant="neutral" size="sm" className="rounded-full font-semibold">
                                    Active
                                  </Badge>
                                )}
                              </div>
                            </td>

                            {/* 2FA Status */}
                            <td className="py-3 px-4">
                              <Badge variant={u.twoFactorEnabled ? 'success' : 'neutral'} size="sm" className="rounded-full font-semibold">
                                {u.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                              </Badge>
                            </td>

                            {/* Action Buttons */}
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                {!u.isActivated && (
                                  <Button
                                    type="button"
                                    variant="tonal"
                                    size="xs"
                                    className="rounded-full px-3"
                                    onClick={() => handleActivateUser(u.id)}
                                  >
                                    Activate
                                  </Button>
                                )}

                                {u.twoFactorEnabled && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="xs"
                                    className="rounded-full px-3"
                                    onClick={() => handleReset2Fa(u.id)}
                                    leftIcon={<RotateCcw className="w-3 h-3" />}
                                  >
                                    Reset 2FA
                                  </Button>
                                )}

                                {!isSelf && (
                                  <Button
                                    type="button"
                                    variant={u.isBlocked ? 'tonal' : 'danger-tonal'}
                                    size="xs"
                                    className="rounded-full px-3"
                                    onClick={() => handleToggleBlock(u.id, u.isBlocked)}
                                    leftIcon={u.isBlocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                                  >
                                    {u.isBlocked ? 'Unblock' : 'Block'}
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination footer */}
                <div className="p-3.5 bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)]/40 border-t border-[var(--md-sys-color-outline-variant)]/20 flex items-center justify-between text-xs text-[var(--md-sys-color-on-surface-variant)]">
                  <span>Showing {users.length} of {totalUsers} registered users</span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      className="rounded-full px-3"
                      disabled={userPage <= 1}
                      onClick={() => setUserPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <span className="font-semibold px-2">Page {userPage}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      className="rounded-full px-3"
                      disabled={users.length < 25}
                      onClick={() => setUserPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* 2. RBAC & ROLES MATRIX TAB */}
          {/* ==================================================== */}
          {activeTab === 'roles' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                    Role-Based Access Control (RBAC) Governance Matrix
                  </h3>
                  <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                    Cross-functional system permission tiers and organizational assignments
                  </p>
                </div>
                <Button
                  type="button"
                  variant="filled"
                  size="sm"
                  className="rounded-full px-4 text-xs font-bold"
                  onClick={() => setCreateRoleModalOpen(true)}
                  leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
                >
                  Create Custom Role
                </Button>
              </div>

              <div className="bg-[var(--md-sys-color-surface-container-low)] rounded-3xl border border-[var(--md-sys-color-outline-variant)]/20 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse table-auto">
                    <thead>
                      <tr className="bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)]/60 border-b border-[var(--md-sys-color-outline-variant)]/30 text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider text-[10px] font-bold">
                        <th className="py-3 px-4">Permission / Action</th>
                        <th className="py-3 px-4 text-center">ADMIN</th>
                        <th className="py-3 px-4 text-center">PROJECT_MANAGER</th>
                        <th className="py-3 px-4 text-center">DEVELOPER</th>
                        <th className="py-3 px-4 text-center">QA_ENGINEER</th>
                        <th className="py-3 px-4 text-center">USER</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]/20 text-[var(--md-sys-color-on-surface)]">
                      {[
                        { name: 'Create & File Issues', roles: ['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER', 'QA_ENGINEER', 'USER'] },
                        { name: 'Edit Issue Details & Descriptions', roles: ['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER', 'QA_ENGINEER'] },
                        { name: 'Change Kanban Workflow Status', roles: ['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER', 'QA_ENGINEER'] },
                        { name: 'Assign Tickets to Team Members', roles: ['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER'] },
                        { name: 'Log Working Time & Hours', roles: ['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER', 'QA_ENGINEER'] },
                        { name: 'Sprint Creation & Closure', roles: ['ADMIN', 'PROJECT_MANAGER'] },
                        { name: 'Delete Issues & Attachments', roles: ['ADMIN', 'PROJECT_MANAGER'] },
                        { name: 'Create & Manage Projects', roles: ['ADMIN'] },
                        { name: 'User Management & Role Assignment', roles: ['ADMIN'] },
                        { name: 'Security Forensics & Audit Inspection', roles: ['ADMIN'] },
                      ].map((perm, idx) => (
                        <tr key={idx} className="hover:bg-[var(--md-sys-color-surface-container)] dark:hover:bg-[var(--md-sys-color-surface-container-high)]/50 transition-colors">
                          <td className="py-3 px-4 font-medium">{perm.name}</td>
                          {['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER', 'QA_ENGINEER', 'USER'].map((r) => {
                            const allowed = perm.roles.includes(r);
                            return (
                              <td key={r} className="py-3 px-4 text-center">
                                {allowed ? (
                                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)] font-bold text-xs border border-[var(--md-sys-color-success)]/20 shadow-2xs">
                                    ✓
                                  </span>
                                ) : (
                                  <span className="text-[var(--md-sys-color-outline)] opacity-30">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {customRoles.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
                    Custom Organizational Roles ({customRoles.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {customRoles.map((cr) => (
                      <div
                        key={cr.name}
                        className="bg-[var(--md-sys-color-surface-container-low)] rounded-3xl p-4 border border-[var(--md-sys-color-outline-variant)]/20 space-y-2 shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[var(--md-sys-color-on-surface)]">{cr.label}</span>
                          <Badge variant="primary" size="sm" className="rounded-full px-2.5">
                            {cr.permissions.length} perms
                          </Badge>
                        </div>
                        <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                          {cr.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* 3. SYSTEM & SECURITY TAB */}
          {/* ==================================================== */}
          {activeTab === 'system' && (
            <div className="space-y-4">
              {/* DevOps & System Broadcast Announcement Manager */}
              <div className="bg-[var(--md-sys-color-surface-container-low)] rounded-3xl p-5 sm:p-6 border border-[var(--md-sys-color-outline-variant)]/20 space-y-4 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--md-sys-color-outline-variant)]/30">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center shadow-2xs">
                      <Megaphone className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                        <span>DevOps Announcement & System Broadcast</span>
                        {broadcast.enabled && (
                          <span className="w-2 h-2 rounded-full bg-[var(--md-sys-color-success)] animate-pulse" />
                        )}
                      </h3>
                      <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                        Broadcast critical maintenance notices and live status banners to all active users in the top header
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface)]">
                      {broadcastEnabled ? 'Active' : 'Disabled'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setBroadcastEnabled((prev) => !prev)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${broadcastEnabled ? 'bg-[var(--md-sys-color-primary)]' : 'bg-[var(--md-sys-color-surface-container-highest)]'
                        }`}
                      role="switch"
                      aria-checked={broadcastEnabled}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${broadcastEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                      />
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSaveBroadcast} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1.5">
                      Announcement Banner Message *
                    </label>
                    <textarea
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      rows={2}
                      required
                      placeholder="e.g. ⚠️ Scheduled maintenance today at 02:00 UTC (expected 15m duration)"
                      className="w-full text-xs p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]/30 text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)] resize-none transition-all"
                    />
                  </div>

                  {/* Severity Level Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1.5">
                      Severity Tone & Container Role
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(
                        [
                          { id: 'info', label: 'Info / Release', token: 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]', icon: Info },
                          { id: 'warning', label: 'Maintenance / Warning', token: 'bg-[var(--md-sys-color-warning-container)] text-[var(--md-sys-color-on-warning-container)]', icon: AlertTriangle },
                          { id: 'critical', label: 'Incident / Critical', token: 'bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]', icon: ShieldAlert },
                          { id: 'success', label: 'Resolved / Normal', token: 'bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)]', icon: CheckCircle2 },
                        ] as const
                      ).map((sev) => {
                        const Icon = sev.icon;
                        const isSelected = broadcastSeverity === sev.id;
                        return (
                          <button
                            key={sev.id}
                            type="button"
                            onClick={() => setBroadcastSeverity(sev.id)}
                            className={`p-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${sev.token
                              } ${isSelected
                                ? 'ring-2 ring-offset-2 ring-[var(--md-sys-color-primary)] scale-[1.02] shadow-xs'
                                : 'opacity-60 hover:opacity-100'
                              }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{sev.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div>
                    <span className="text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] block mb-1.5">
                      DevOps Quick Presets:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: 'Scheduled Maintenance', msg: '⚠️ Scheduled database maintenance at 02:00 UTC (15m window)', sev: 'warning' as BroadcastSeverity },
                        { label: 'BugTracker v3 Live', msg: '🚀 BugTracker v3 Operational: Real-Time Sockets & SeaweedFS Active', sev: 'info' as BroadcastSeverity },
                        { label: 'System Incident', msg: '🔥 Incident: API latency degradation under active DevOps investigation', sev: 'critical' as BroadcastSeverity },
                        { label: 'Incident Resolved', msg: '✅ Incident Resolved: All systems verified and fully operational', sev: 'success' as BroadcastSeverity },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            setBroadcastMessage(preset.msg);
                            setBroadcastSeverity(preset.sev);
                            setBroadcastEnabled(true);
                          }}
                          className="px-3 py-1 rounded-full text-[11px] font-medium bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)]/20 text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Real-time Header Preview */}
                  <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)]/50 border border-[var(--md-sys-color-outline-variant)]/20 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] block">
                      Live Header Preview
                    </span>
                    <div className="flex items-center py-2 px-4 rounded-xl bg-[var(--md-sys-color-surface)] overflow-hidden">
                      {broadcastEnabled && broadcastMessage ? (
                        <div
                          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg w-full text-xs font-semibold ${broadcastSeverity === 'info'
                              ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]'
                              : broadcastSeverity === 'warning'
                                ? 'bg-[var(--md-sys-color-warning-container)] text-[var(--md-sys-color-on-warning-container)]'
                                : broadcastSeverity === 'critical'
                                  ? 'bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]'
                                  : 'bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)]'
                            }`}
                        >
                          <Radio className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{broadcastMessage}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] italic">
                          (Banner is currently disabled — header will display no broadcast)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action row: Disable (only when active) + Publish */}
                  <div className="flex items-center justify-between pt-2 gap-3">
                    {broadcastSavedMsg ? (
                      <span className="text-xs font-semibold text-[var(--md-sys-color-success)] flex items-center gap-1.5 animate-in fade-in">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Published to all active users!</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                        Last updated by: {broadcast.author} • {new Date(broadcast.updatedAt).toLocaleTimeString()}
                      </span>
                    )}

                    <div className="flex items-center gap-2 shrink-0">
                      {broadcast.enabled && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="rounded-full px-4 text-xs"
                          onClick={() => {
                            updateBroadcast({ enabled: false, message: broadcastMessage, severity: broadcastSeverity, author: currentUser?.fullName || 'DevOps Team' });
                            setBroadcastEnabled(false);
                          }}
                        >
                          Disable Banner
                        </Button>
                      )}
                      <Button
                        type="submit"
                        variant="filled"
                        size="sm"
                        className="rounded-full px-4 text-xs font-bold"
                        leftIcon={<Megaphone className="w-3.5 h-3.5" />}
                      >
                        Publish Banner
                      </Button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Security Metrics Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="bg-[var(--md-sys-color-surface-container-low)] rounded-3xl p-5 border border-[var(--md-sys-color-outline-variant)]/20 flex items-center justify-between shadow-xs">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
                      Total Accounts
                    </span>
                    <p className="text-2xl font-black text-[var(--md-sys-color-primary)]">
                      {systemStats?.totalUsers || 0}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center shadow-2xs">
                    <Users className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
                  </div>
                </div>

                <div className="bg-[var(--md-sys-color-surface-container-low)] rounded-3xl p-5 border border-[var(--md-sys-color-outline-variant)]/20 flex items-center justify-between shadow-xs">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
                      2FA Adoption
                    </span>
                    <p className="text-2xl font-black text-[var(--md-sys-color-success)]">
                      {systemStats?.twoFactorPercentage || 0}%
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)] flex items-center justify-center shadow-2xs">
                    <ShieldCheck className="w-5 h-5 text-[var(--md-sys-color-success)]" />
                  </div>
                </div>

                <div className="bg-[var(--md-sys-color-surface-container-low)] rounded-3xl p-5 border border-[var(--md-sys-color-outline-variant)]/20 flex items-center justify-between shadow-xs">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
                      Blocked Users
                    </span>
                    <p className="text-2xl font-black text-[var(--md-sys-color-error)]">
                      {systemStats?.blockedUsers || 0}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] flex items-center justify-center shadow-2xs">
                    <Lock className="w-5 h-5 text-[var(--md-sys-color-error)]" />
                  </div>
                </div>

                <div className="bg-[var(--md-sys-color-surface-container-low)] rounded-3xl p-5 border border-[var(--md-sys-color-outline-variant)]/20 flex items-center justify-between shadow-xs">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
                      Total Projects
                    </span>
                    <p className="text-2xl font-black text-[var(--md-sys-color-on-surface)]">
                      {projects.length}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] flex items-center justify-center shadow-2xs">
                    <FolderGit2 className="w-5 h-5 text-[var(--md-sys-color-secondary)]" />
                  </div>
                </div>
              </div>

              {/* Recent Audit Logs Preview */}
              <div className="bg-[var(--md-sys-color-surface-container-low)] rounded-3xl border border-[var(--md-sys-color-outline-variant)]/20 overflow-hidden shadow-xs space-y-0">
                <div className="p-4 bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)]/60 border-b border-[var(--md-sys-color-outline-variant)]/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                    <h3 className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
                      Recent Authentication Logs Preview
                    </h3>
                  </div>
                  <Badge variant="primary" size="sm" className="rounded-full px-2.5">
                    Live Telemetry
                  </Badge>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse table-auto">
                    <thead>
                      <tr className="bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)]/40 border-b border-[var(--md-sys-color-outline-variant)]/20 text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider text-[10px] font-bold">
                        <th className="py-2.5 px-4">Timestamp</th>
                        <th className="py-2.5 px-4">IP Address</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]/20 font-mono text-[11px] text-[var(--md-sys-color-on-surface)]">
                      {auditLogs.slice(0, 10).map((log) => (
                        <tr key={log.id} className="hover:bg-[var(--md-sys-color-surface-container)] dark:hover:bg-[var(--md-sys-color-surface-container-high)]/50 transition-colors">
                          <td className="py-2.5 px-4 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                          <td className="py-2.5 px-4">{log.ipAddress}</td>
                          <td className="py-2.5 px-4">
                            <Badge
                              variant={log.status === 'SUCCESS' ? 'success' : 'error'}
                              size="sm"
                              className="rounded-full font-semibold"
                            >
                              {log.status}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-4 text-[var(--md-sys-color-on-surface-variant)] truncate max-w-sm font-sans">
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
          {/* 4. PROJECTS CONTROL TAB */}
          {/* ==================================================== */}
          {activeTab === 'projects' && (
            <div className="space-y-4">
              {/* Create Project Card */}
              <div className="bg-[var(--md-sys-color-surface-container-low)] rounded-3xl p-5 sm:p-6 border border-[var(--md-sys-color-outline-variant)]/20 space-y-4 shadow-xs">
                <div className="flex items-center gap-2 pb-2 border-b border-[var(--md-sys-color-outline-variant)]/30">
                  <PlusCircle className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                  <h3 className="font-bold text-xs text-[var(--md-sys-color-on-surface)] uppercase tracking-wider">
                    Register New Workspace Project
                  </h3>
                </div>

                <form onSubmit={handleCreateProject} className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider mb-1.5">
                      Key (2-6 letters) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="e.g. AUTH"
                      value={newProjectKey}
                      onChange={(e) => setNewProjectKey(e.target.value.toUpperCase())}
                      className="w-full text-xs font-mono uppercase px-3.5 py-2 rounded-full bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]/30 text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)] font-bold transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider mb-1.5">
                      Project Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Authentication Service"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      className="w-full text-xs px-3.5 py-2 rounded-full bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]/30 text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)] font-medium transition-all"
                    />
                  </div>

                  <div className="flex items-end">
                    <Button
                      type="submit"
                      variant="filled"
                      size="sm"
                      isLoading={creatingProject}
                      disabled={!newProjectKey || !newProjectName}
                      className="w-full rounded-full text-xs font-bold"
                      leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
                    >
                      Create Project
                    </Button>
                  </div>
                </form>
              </div>

              {/* Projects Table */}
              <div className="bg-[var(--md-sys-color-surface-container-low)] rounded-3xl border border-[var(--md-sys-color-outline-variant)]/20 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse table-auto">
                    <thead>
                      <tr className="bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)]/60 border-b border-[var(--md-sys-color-outline-variant)]/30 text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider text-[10px] font-bold">
                        <th className="py-3 px-4">Key</th>
                        <th className="py-3 px-4">Project Name</th>
                        <th className="py-3 px-4">Created</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]/20 text-[var(--md-sys-color-on-surface)]">
                      {projects.map((p) => (
                        <tr key={p.id} className="hover:bg-[var(--md-sys-color-surface-container)] dark:hover:bg-[var(--md-sys-color-surface-container-high)]/50 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[var(--md-sys-color-primary)]">
                            {p.key}
                          </td>
                          <td className="py-3 px-4 font-semibold text-[var(--md-sys-color-on-surface)]">
                            {p.name}
                          </td>
                          <td className="py-3 px-4 text-[var(--md-sys-color-on-surface-variant)]">
                            {new Date(p.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              type="button"
                              variant="danger-tonal"
                              size="xs"
                              className="rounded-full px-3"
                              onClick={() => handleDeleteProject(p.id, p.key)}
                              leftIcon={<Trash2 className="w-3 h-3" />}
                            >
                              Delete
                            </Button>
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
          {/* 5. TEAM ANALYTICS TAB */}
          {/* ==================================================== */}
          {activeTab === 'analytics' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="bg-[var(--md-sys-color-surface-container-low)] rounded-3xl p-5 border border-[var(--md-sys-color-outline-variant)]/20 flex items-center justify-between shadow-xs">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
                      Total Hours Logged
                    </span>
                    <p className="text-2xl font-black text-[var(--md-sys-color-primary)]">
                      {timeStats?.totalHoursLogged || 0}h
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center shadow-2xs">
                    <Activity className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
                  </div>
                </div>

                <div className="bg-[var(--md-sys-color-surface-container-low)] rounded-3xl p-5 border border-[var(--md-sys-color-outline-variant)]/20 flex items-center justify-between shadow-xs">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
                      Logged Today
                    </span>
                    <p className="text-2xl font-black text-[var(--md-sys-color-success)]">
                      {timeStats?.hoursLoggedToday || 0}h
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)] flex items-center justify-center shadow-2xs">
                    <TrendingUp className="w-5 h-5 text-[var(--md-sys-color-success)]" />
                  </div>
                </div>

                <div className="bg-[var(--md-sys-color-surface-container-low)] rounded-3xl p-5 border border-[var(--md-sys-color-outline-variant)]/20 flex items-center justify-between shadow-xs">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
                      Logged This Week
                    </span>
                    <p className="text-2xl font-black text-[var(--md-sys-color-warning)]">
                      {timeStats?.hoursLoggedThisWeek || 0}h
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-warning-container)] text-[var(--md-sys-color-on-warning-container)] flex items-center justify-center shadow-2xs">
                    <Database className="w-5 h-5 text-[var(--md-sys-color-warning)]" />
                  </div>
                </div>
              </div>

              {systemStats?.roleBreakdown && (
                <div className="bg-[var(--md-sys-color-surface-container-low)] rounded-3xl p-5 sm:p-6 border border-[var(--md-sys-color-outline-variant)]/20 space-y-4 shadow-xs">
                  <h3 className="text-xs font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2 uppercase tracking-wider">
                    <Users className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                    <span>User Role Distribution</span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {Object.entries(systemStats.roleBreakdown).map(([role, count]) => (
                      <div
                        key={role}
                        className="p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]/30 text-center shadow-2xs"
                      >
                        <span className="text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] block uppercase mb-1">
                          {role}
                        </span>
                        <span className="text-xl font-black text-[var(--md-sys-color-on-surface)]">
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

      {/* Create Custom Role Radix Modal */}
      <Modal
        isOpen={createRoleModalOpen}
        onClose={() => setCreateRoleModalOpen(false)}
        title="Create Custom Access Role"
        description="Define custom permissions for new organizational roles (e.g. DevOps Lead, Security Auditor)."
        size="md"
      >
        <form onSubmit={handleSaveCustomRole} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1.5">
              Role Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. DevOps Engineer"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-2xl bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)]/30 font-medium focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1.5">
              Description
            </label>
            <input
              type="text"
              placeholder="Responsibilities and permission scope"
              value={newRoleDescription}
              onChange={(e) => setNewRoleDescription(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-2xl bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)]/30 font-medium focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)] transition-all"
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
                    className={`flex items-center gap-2 p-2.5 rounded-2xl border cursor-pointer transition-all ${isChecked
                        ? 'bg-[var(--md-sys-color-primary-container)]/30 border-[var(--md-sys-color-primary)] font-semibold'
                        : 'bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] border-[var(--md-sys-color-outline-variant)]/30 opacity-70 hover:opacity-100'
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

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--md-sys-color-outline-variant)]/20">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-full px-4 text-xs"
              onClick={() => setCreateRoleModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="filled"
              size="sm"
              className="rounded-full px-4 text-xs font-bold"
              leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
            >
              Register Role
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
