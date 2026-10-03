import React, { useState } from 'react';
import { api, type SystemRole, type UserProfile } from '../../api/client.js';
import {
  useUsersQuery,
  useAdminStatsQuery,
  useUpdateUserRoleMutation,
  useBlockUserMutation,
  useUnblockUserMutation,
  useAdminActivateUserMutation,
  useAdminResetUser2FaMutation,
  useDeleteUserMutation,
} from '../../api/queries';
import { Avatar } from '../common/Avatar.js';
import {
  Button,
  Badge,
  Card,
  Modal,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SearchInput,
  ConfirmDialog,
} from '../ui/index.js';
import {
  Search,
  Lock,
  Unlock,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Users,
  Shield,
  Trash2,
  UserCheck,
  Briefcase,
} from 'lucide-react';

export const AdminUsersTab: React.FC = () => {
  const [userSearch, setUserSearch] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'ALL' | 'ACTIVE' | 'BLOCKED' | 'PENDING'>('ALL');
  const [userPage, setUserPage] = useState(1);
  const limit = 25;

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  const [jobTitleModalOpen, setJobTitleModalOpen] = useState(false);
  const [userToEditJob, setUserToEditJob] = useState<UserProfile | null>(null);
  const [newJobTitle, setNewJobTitle] = useState('');

  // Queries
  const { data: statsData = null } = useAdminStatsQuery();

  const isBlockedParam =
    userStatusFilter === 'BLOCKED' ? true : userStatusFilter === 'ACTIVE' ? false : undefined;
  const isActivatedParam =
    userStatusFilter === 'ACTIVE' ? true : userStatusFilter === 'PENDING' ? false : undefined;

  const {
    data: usersData,
    isLoading: loading,
  } = useUsersQuery({
    page: userPage,
    limit,
    search: activeSearch || undefined,
    role: userRoleFilter || undefined,
    isBlocked: isBlockedParam,
    isActivated: isActivatedParam,
  });

  const users = usersData?.items || [];
  const totalUsers = usersData?.total || 0;
  const totalPages = Math.max(1, Math.ceil(totalUsers / limit));

  // Mutations
  const roleMutation = useUpdateUserRoleMutation();
  const blockMutation = useBlockUserMutation();
  const unblockMutation = useUnblockUserMutation();
  const activateMutation = useAdminActivateUserMutation();
  const reset2FaMutation = useAdminResetUser2FaMutation();
  const deleteMutation = useDeleteUserMutation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setUserPage(1);
    setActiveSearch(userSearch);
  };

  const handleRoleChange = async (userId: number, newRole: SystemRole) => {
    try {
      await roleMutation.mutateAsync({ id: userId, role: newRole });
      setActionSuccess('User role updated successfully');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update role');
    }
  };

  const handleToggleBlock = async (userId: number, currentlyBlocked: boolean) => {
    try {
      if (currentlyBlocked) {
        await unblockMutation.mutateAsync(userId);
        setActionSuccess('User account successfully unblocked');
      } else {
        await blockMutation.mutateAsync(userId);
        setActionSuccess('User account successfully blocked');
      }
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update block status');
    }
  };

  const handleActivateUser = async (userId: number) => {
    try {
      await activateMutation.mutateAsync(userId);
      setActionSuccess('User account manually activated');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to activate user account');
    }
  };

  const handleReset2Fa = async (userId: number) => {
    try {
      await reset2FaMutation.mutateAsync(userId);
      setActionSuccess('Two-factor authentication reset for user');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to reset 2FA');
    }
  };

  const handleSendResetPassword = async (email: string) => {
    try {
      await api.forgotPassword(email);
      setActionSuccess(`Password reset email dispatched to ${email}`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to send password reset');
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await deleteMutation.mutateAsync(userToDelete.id);
      setActionSuccess(`User #${userToDelete.id} (${userToDelete.email}) permanently removed.`);
      setDeleteModalOpen(false);
      setUserToDelete(null);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const handleOpenEditJob = (user: UserProfile) => {
    setUserToEditJob(user);
    setNewJobTitle(user.jobTitle || '');
    setJobTitleModalOpen(true);
  };

  const handleSaveJobTitle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEditJob) return;

    try {
      await roleMutation.mutateAsync({
        id: userToEditJob.id,
        role: userToEditJob.systemRole,
        jobTitle: newJobTitle.trim(),
      });
      setActionSuccess('Job title / work discipline updated successfully.');
      setJobTitleModalOpen(false);
      setUserToEditJob(null);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update job title');
    }
  };

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-200">
      {/* System Stats KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          variant="filled"
          padding="md"
          rounded="2xl"
          className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 space-y-1"
        >
          <div className="flex items-center justify-between text-[var(--md-sys-color-on-surface-variant)]">
            <span className="text-xs font-bold uppercase tracking-wider">Total User Accounts</span>
            <Users className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
          </div>
          <p className="text-2xl font-black font-mono text-[var(--md-sys-color-on-surface)]">
            {statsData?.totalUsers ?? '—'}
          </p>
          <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
            Registered identities
          </span>
        </Card>

        <Card
          variant="filled"
          padding="md"
          rounded="2xl"
          className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 space-y-1"
        >
          <div className="flex items-center justify-between text-[var(--md-sys-color-on-surface-variant)]">
            <span className="text-xs font-bold uppercase tracking-wider">Active Accounts</span>
            <UserCheck className="w-4 h-4 text-[var(--md-sys-color-success)]" />
          </div>
          <p className="text-2xl font-black font-mono text-[var(--md-sys-color-success)]">
            {statsData?.activeUsers ?? '—'}
          </p>
          <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
            Activated & non-blocked
          </span>
        </Card>

        <Card
          variant="filled"
          padding="md"
          rounded="2xl"
          className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 space-y-1"
        >
          <div className="flex items-center justify-between text-[var(--md-sys-color-on-surface-variant)]">
            <span className="text-xs font-bold uppercase tracking-wider">Blocked / Restricted</span>
            <Lock className="w-4 h-4 text-[var(--md-sys-color-error)]" />
          </div>
          <p className="text-2xl font-black font-mono text-[var(--md-sys-color-error)]">
            {statsData?.blockedUsers ?? 0}
          </p>
          <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
            Administrative lockouts
          </span>
        </Card>

        <Card
          variant="filled"
          padding="md"
          rounded="2xl"
          className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 space-y-1"
        >
          <div className="flex items-center justify-between text-[var(--md-sys-color-on-surface-variant)]">
            <span className="text-xs font-bold uppercase tracking-wider">2FA Adoption</span>
            <Shield className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
          </div>
          <p className="text-2xl font-black font-mono text-[var(--md-sys-color-primary)]">
            {statsData?.twoFactorPercentage ?? 0}%
          </p>
          <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
            {statsData?.twoFactorAdoptionCount ?? 0} TOTP secured accounts
          </span>
        </Card>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="flex items-center gap-2 p-3.5 bg-[var(--md-sys-color-success-container)] border border-[var(--md-sys-color-success)]/30 rounded-2xl text-xs font-semibold text-[var(--md-sys-color-on-success-container)] animate-in fade-in">
          <CheckCircle className="w-4 h-4 shrink-0 text-[var(--md-sys-color-success)]" />
          {actionSuccess}
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 p-3.5 bg-[var(--md-sys-color-error-container)] border border-[var(--md-sys-color-error)]/30 rounded-2xl text-xs font-semibold text-[var(--md-sys-color-on-error-container)] animate-in fade-in">
          <AlertTriangle className="w-4 h-4 shrink-0 text-[var(--md-sys-color-error)]" />
          {errorMessage}
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card
        variant="filled"
        padding="sm"
        rounded="2xl"
        className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20"
      >
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-3 p-2">
          <div className="relative flex-1 w-full">
            <SearchInput
              value={userSearch}
              onChange={setUserSearch}
              placeholder="Search users by name or email..."
              size="md"
              className="w-full"
            />
          </div>

          <div className="w-full sm:w-48">
            <Select
              value={userRoleFilter}
              onValueChange={(v) => {
                setUserRoleFilter(v);
                setUserPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-xs rounded-xl bg-[var(--md-sys-color-surface)]">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Roles</SelectItem>
                <SelectItem value="ADMIN">Administrator</SelectItem>
                <SelectItem value="USER">Standard User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-48">
            <Select
              value={userStatusFilter}
              onValueChange={(v) => {
                setUserStatusFilter(v as any);
                setUserPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-xs rounded-xl bg-[var(--md-sys-color-surface)]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="BLOCKED">Blocked</SelectItem>
                <SelectItem value="PENDING">Pending Activation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" size="sm" variant="filled" className="w-full sm:w-auto text-xs font-semibold">
            Search
          </Button>
        </form>
      </Card>

      {/* Users Table */}
      <Card
        variant="filled"
        padding="none"
        rounded="3xl"
        className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 overflow-hidden shadow-xs"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] font-bold uppercase tracking-wider text-[10px] border-b border-[var(--md-sys-color-outline-variant)]/20">
              <tr>
                <th className="py-3 px-4">User Identity</th>
                <th className="py-3 px-4">Discipline / Job Title</th>
                <th className="py-3 px-4">System Authority</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">2FA Security</th>
                <th className="py-3 px-4 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]/10">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-[var(--md-sys-color-on-surface-variant)]">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-[var(--md-sys-color-primary)] mb-2" />
                    Loading user identities...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-[var(--md-sys-color-on-surface-variant)]">
                    <Users className="w-8 h-8 mx-auto opacity-30 mb-2" />
                    No users found matching current filters.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isRoot = Boolean(
                    u.isRoot ||
                    u.email.toLowerCase() === 'admin@bugtracker.local' ||
                    (import.meta.env.VITE_INITIAL_ADMIN_EMAIL &&
                      u.email.toLowerCase() === import.meta.env.VITE_INITIAL_ADMIN_EMAIL.toLowerCase()),
                  );

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-[var(--md-sys-color-surface-container)]/50 transition-colors"
                    >
                      {/* Identity */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={u.fullName}
                            avatarUrl={u.avatarUrl || undefined}
                            size="sm"
                          />
                          <div>
                            <div className="font-bold text-[var(--md-sys-color-on-surface)] text-xs">
                              {u.fullName}
                            </div>
                            <div className="text-[var(--md-sys-color-on-surface-variant)] text-[11px] font-mono">
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Job Title / Discipline */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-medium text-[var(--md-sys-color-on-surface)]">
                            {u.jobTitle || 'Software Engineer'}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditJob(u)}
                            className="h-6 w-6 p-0 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)]"
                            title="Edit Job Title"
                          >
                            <Briefcase className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4">
                        {isRoot ? (
                          <div title="Root Administrator accounts cannot be demoted">
                            <Badge variant="primary" size="sm">
                              <Lock className="w-3 h-3 mr-1" />
                              Root Admin
                            </Badge>
                          </div>
                        ) : (
                          <div className="w-28">
                            <Select
                              value={u.systemRole}
                              onValueChange={(val) => handleRoleChange(u.id, val as SystemRole)}
                            >
                              <SelectTrigger className="h-7 text-xs font-medium rounded-lg">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                                <SelectItem value="USER">User</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {u.isBlocked ? (
                            <Badge variant="error" size="sm">Blocked</Badge>
                          ) : u.isActivated ? (
                            <Badge variant="success" size="sm">Active</Badge>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <Badge variant="warning" size="sm">Pending</Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleActivateUser(u.id)}
                                className="h-6 px-1.5 text-[10px] text-[var(--md-sys-color-primary)] font-bold"
                                title="Manually activate user without token"
                              >
                                Activate
                              </Button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 2FA */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {u.twoFactorEnabled ? (
                            <Badge variant="primary" size="sm">2FA Active</Badge>
                          ) : (
                            <Badge variant="neutral" size="sm">Disabled</Badge>
                          )}
                          {u.twoFactorEnabled && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReset2Fa(u.id)}
                              className="h-6 px-1.5 text-[10px] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-error)]"
                              title="Reset 2FA for locked out user"
                            >
                              Reset
                            </Button>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSendResetPassword(u.email)}
                          className="h-7 px-2 text-xs text-[var(--md-sys-color-on-surface-variant)]"
                          title="Dispatch password reset email"
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1" />
                          Reset Pwd
                        </Button>

                        {isRoot ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled
                            className="h-7 px-2 text-xs opacity-40 cursor-not-allowed text-[var(--md-sys-color-on-surface-variant)]"
                            title="Root administrator accounts cannot be blocked or deleted"
                          >
                            <Lock className="w-3.5 h-3.5 mr-1" />
                            Protected
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant={u.isBlocked ? 'outline' : 'ghost'}
                              size="sm"
                              onClick={() => handleToggleBlock(u.id, u.isBlocked)}
                              className={`h-7 px-2 text-xs ${
                                u.isBlocked
                                  ? 'text-[var(--md-sys-color-success)]'
                                  : 'text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)]'
                              }`}
                            >
                              {u.isBlocked ? (
                                <>
                                  <Unlock className="w-3.5 h-3.5 mr-1" />
                                  Unblock
                                </>
                              ) : (
                                <>
                                  <Lock className="w-3.5 h-3.5 mr-1" />
                                  Block
                                </>
                              )}
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setUserToDelete(u);
                                setDeleteModalOpen(true);
                              }}
                              className="h-7 w-7 p-0 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)]"
                              title="Permanently Delete User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-[var(--md-sys-color-outline-variant)]/20 text-xs text-[var(--md-sys-color-on-surface-variant)] bg-[var(--md-sys-color-surface-container)]/30">
            <span>
              Showing {users.length} of {totalUsers} accounts (Page {userPage} of {totalPages})
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                disabled={userPage === 1}
              >
                Previous
              </Button>
              <span className="px-2 font-mono font-bold text-[var(--md-sys-color-on-surface)]">
                {userPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUserPage((p) => Math.min(totalPages, p + 1))}
                disabled={userPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Delete User Modal */}
      <ConfirmDialog
        isOpen={deleteModalOpen && !!userToDelete}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteUser}
        title="Delete User Account"
        description={`Are you sure you want to permanently delete user ${userToDelete?.fullName} (${userToDelete?.email})? This action cannot be undone.`}
        confirmLabel="Delete User"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      {/* Edit Job Title Modal */}
      {jobTitleModalOpen && userToEditJob && (
        <Modal
          isOpen={jobTitleModalOpen}
          onClose={() => setJobTitleModalOpen(false)}
          title="Update Coworker Job Title"
          description="Assign professional discipline label decoupled from system permissions"
          size="sm"
        >
          <form onSubmit={handleSaveJobTitle} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase mb-1">
                Discipline / Job Title
              </label>
              <Input
                value={newJobTitle}
                onChange={(e) => setNewJobTitle(e.target.value)}
                placeholder="e.g. Lead DevOps Architect, Staff QA Engineer"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--md-sys-color-outline-variant)]/20">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setJobTitleModalOpen(false)}
                disabled={roleMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="filled"
                size="sm"
                disabled={roleMutation.isPending}
                isLoading={roleMutation.isPending}
              >
                Save Title
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
