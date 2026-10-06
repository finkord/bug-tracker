import React, { useState, useMemo, useCallback } from 'react';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import { api, type UserProfile } from '../../api/client.js';
import {
  useUsersQuery,
  useAdminStatsQuery,
  useUpdateUserRoleMutation,
  useBlockUserMutation,
  useUnblockUserMutation,
  useAdminActivateUserMutation,
  useAdminResetUser2FaMutation,
  useDeleteUserMutation,
  useGroupsQuery,
  useAddUserToGroupMutation,
  useRemoveUserFromGroupMutation,
} from '../../api/queries';
import { Avatar } from '../common/Avatar.js';
import { UserProfilePopover } from '../common/UserProfilePopover.js';
import {
  Button,
  Badge,
  Card,
  Input,
  Modal,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SearchInput,
  ConfirmDialog,
  FormModal,
  DataTable,
} from '../ui/index.js';
import {
  Lock,
  Unlock,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Users,
  Shield,
  Trash2,
  UserCheck,
  Briefcase,
  Copy,
  Check,
} from 'lucide-react';

export const AdminUsersTab: React.FC = () => {
  const [userSearch, setUserSearch] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'ALL' | 'ACTIVE' | 'BLOCKED' | 'PENDING'>('ALL');
  const [userPage, setUserPage] = useState(1);
  const limit = 25;

  const [sorting, setSorting] = useState<SortingState>([]);
  const [copiedEmailId, setCopiedEmailId] = useState<number | null>(null);

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  const [jobTitleModalOpen, setJobTitleModalOpen] = useState(false);
  const [userToEditJob, setUserToEditJob] = useState<UserProfile | null>(null);
  const [newJobTitle, setNewJobTitle] = useState('');

  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [userForGroupEdit, setUserForGroupEdit] = useState<UserProfile | null>(null);

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

  const { data: groups = [] } = useGroupsQuery();
  const addUserToGroupMutation = useAddUserToGroupMutation();
  const removeUserFromGroupMutation = useRemoveUserFromGroupMutation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setUserPage(1);
    setActiveSearch(userSearch);
  };

  const handleOpenGroupAssignment = (user: UserProfile) => {
    setUserForGroupEdit(user);
    setGroupModalOpen(true);
  };


  const handleToggleBlock = useCallback(async (userId: number, currentlyBlocked: boolean) => {
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
  }, [unblockMutation, blockMutation]);

  const handleActivateUser = useCallback(async (userId: number) => {
    try {
      await activateMutation.mutateAsync(userId);
      setActionSuccess('User account manually activated');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to activate user account');
    }
  }, [activateMutation]);

  const handleReset2Fa = useCallback(async (userId: number) => {
    try {
      await reset2FaMutation.mutateAsync(userId);
      setActionSuccess('Two-factor authentication reset for user');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to reset 2FA');
    }
  }, [reset2FaMutation]);

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
      setActionSuccess('Job title updated successfully.');
      setJobTitleModalOpen(false);
      setUserToEditJob(null);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update job title');
    }
  };

  const columns = useMemo<ColumnDef<UserProfile>[]>(() => [
    {
      id: 'identity',
      accessorFn: (u) => u.fullName,
      header: 'User Identity',
      cell: ({ row }) => {
        const u = row.original;
        return (
          <div className="flex items-center gap-3">
            <UserProfilePopover user={u}>
              <button
                type="button"
                className="cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)] rounded-full transition-transform hover:scale-105"
                title="View user profile"
              >
                <Avatar
                  name={u.fullName}
                  avatarUrl={u.avatarUrl || undefined}
                  size="sm"
                />
              </button>
            </UserProfilePopover>

            <div className="flex flex-col min-w-0">
              <UserProfilePopover user={u}>
                <button
                  type="button"
                  className="font-bold text-[var(--md-sys-color-on-surface)] text-xs hover:text-[var(--md-sys-color-primary)] hover:underline text-left cursor-pointer transition-colors truncate"
                  title="View user profile"
                >
                  {u.fullName}
                </button>
              </UserProfilePopover>

              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[var(--md-sys-color-on-surface-variant)] text-[11px] font-mono truncate max-w-[200px]">
                  {u.email}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(u.email);
                    setCopiedEmailId(u.id);
                    setTimeout(() => setCopiedEmailId(null), 2000);
                  }}
                  className="p-0.5 rounded text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container-highest)] cursor-pointer transition-colors"
                  title={copiedEmailId === u.id ? 'Copied to clipboard!' : 'Copy email to clipboard'}
                >
                  {copiedEmailId === u.id ? (
                    <Check className="w-3 h-3 text-[var(--md-sys-color-success)]" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: 'jobTitle',
      accessorFn: (u) => u.jobTitle || '',
      header: 'Job Title',
      cell: ({ row }) => {
        const u = row.original;
        return (
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
        );
      },
    },
    {
      id: 'groups',
      header: 'Directory Groups & Authority',
      enableSorting: false,
      cell: ({ row }) => {
        const u = row.original;
        const isRoot = Boolean(
          u.isRoot ||
          u.email.toLowerCase() === 'admin@bugtracker.local' ||
          (import.meta.env.VITE_INITIAL_ADMIN_EMAIL &&
            u.email.toLowerCase() === import.meta.env.VITE_INITIAL_ADMIN_EMAIL.toLowerCase()),
        );

        // Sort groups so 'administrators' always appears first
        const userGroups = groups
          .filter((g) => g.userGroups?.some((ug) => ug.userId === u.id))
          .sort((a, b) => {
            const aAdmin = a.name.toLowerCase().trim() === 'administrators';
            const bAdmin = b.name.toLowerCase().trim() === 'administrators';
            if (aAdmin && !bAdmin) return -1;
            if (!aAdmin && bAdmin) return 1;
            return a.name.localeCompare(b.name);
          });

        return (
          <div className="flex items-center gap-1.5 flex-wrap max-w-sm">
            {userGroups.length === 0 ? (
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] italic">
                None
              </span>
            ) : (
              userGroups.slice(0, 3).map((g) => {
                const isAdmin = g.name.toLowerCase().trim() === 'administrators';
                return (
                  <Badge
                    key={g.id}
                    variant={isAdmin ? 'primary' : 'neutral'}
                    size="sm"
                    className={`font-mono text-[10px] ${isAdmin ? 'font-semibold shadow-2xs' : ''
                      }`}
                    title={
                      isAdmin
                        ? isRoot
                          ? 'Root Administrator (Protected from demotion/deletion)'
                          : 'Platform Administrator (Full Admin Center access)'
                        : `Directory Group: ${g.name}`
                    }
                  >
                    {isAdmin && (
                      isRoot ? (
                        <Lock className="w-3 h-3 mr-1" />
                      ) : (
                        <Shield className="w-3 h-3 mr-1" />
                      )
                    )}
                    {isAdmin && isRoot ? 'administrators (Root)' : g.name}
                  </Badge>
                );
              })
            )}
            {userGroups.length > 3 && (
              <Badge variant="neutral" size="sm" className="text-[10px]">
                +{userGroups.length - 3}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenGroupAssignment(u)}
              className="h-6 w-6 p-0 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)]"
              title="Manage directory groups and administrator access"
            >
              <Users className="w-3 h-3" />
            </Button>
          </div>
        );
      },
    },
    {
      id: 'status',
      accessorFn: (u) => (u.isBlocked ? 'Blocked' : u.isActivated ? 'Active' : 'Pending'),
      header: 'Account Status',
      cell: ({ row }) => {
        const u = row.original;
        return (
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
        );
      },
    },
    {
      id: '2fa',
      accessorKey: 'twoFactorEnabled',
      header: '2FA Security',
      cell: ({ row }) => {
        const u = row.original;
        return (
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
        );
      },
    },
    {
      id: 'actions',
      header: () => <div className="w-full pr-1">Administrative Actions</div>,
      enableSorting: false,
      cell: ({ row }) => {
        const u = row.original;
        const isRoot = Boolean(
          u.isRoot ||
          u.email.toLowerCase() === 'admin@bugtracker.local' ||
          (import.meta.env.VITE_INITIAL_ADMIN_EMAIL &&
            u.email.toLowerCase() === import.meta.env.VITE_INITIAL_ADMIN_EMAIL.toLowerCase()),
        );

        return (
          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
            <div className="w-[125px] flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSendResetPassword(u.email)}
                className="h-7 px-2 text-xs text-[var(--md-sys-color-on-surface-variant)]"
                title="Dispatch password reset email"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Reset Password
              </Button>
            </div>

            <div className="w-[88px] flex justify-center">
              {isRoot ? (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled
                  className="h-7 w-[84px] px-1 text-xs opacity-50 cursor-not-allowed text-[var(--md-sys-color-on-surface-variant)]"
                  title="Root administrator accounts cannot be blocked or deleted"
                >
                  <Lock className="w-3.5 h-3.5 mr-1" />
                  Protected
                </Button>
              ) : (
                <Button
                  variant={u.isBlocked ? 'outline' : 'ghost'}
                  size="sm"
                  onClick={() => handleToggleBlock(u.id, u.isBlocked)}
                  className={`h-7 w-[84px] px-1 text-xs ${u.isBlocked
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
              )}
            </div>

            <div className="w-7 h-7 flex items-center justify-center shrink-0">
              {isRoot ? (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled
                  className="h-7 w-7 p-0 opacity-25 cursor-not-allowed text-[var(--md-sys-color-on-surface-variant)]"
                  title="Root administrator accounts cannot be deleted"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              ) : (
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
              )}
            </div>
          </div>
        );
      },
    },
  ], [handleActivateUser, handleReset2Fa, handleToggleBlock, groups, copiedEmailId]);

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
              value={userRoleFilter || 'ALL'}
              onValueChange={(v) => {
                setUserRoleFilter(v === 'ALL' ? '' : v);
                setUserPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-xs rounded-xl bg-[var(--md-sys-color-surface)]">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="ADMIN">Administrator</SelectItem>
                <SelectItem value="USER">Standard User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-48">
            <Select
              value={userStatusFilter}
              onValueChange={(v) => {
                setUserStatusFilter(v as 'ALL' | 'ACTIVE' | 'BLOCKED' | 'PENDING');
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
      <DataTable
        columns={columns}
        data={users}
        getRowId={(u) => String(u.id)}
        sorting={sorting}
        onSortingChange={setSorting}
        page={userPage}
        pageSize={limit}
        total={totalUsers}
        totalPages={totalPages}
        onPageChange={setUserPage}
        isLoading={loading}
        loadingMessage="Loading user identities..."
        emptyTitle="No users found"
        emptyDescription="No users found matching current filters."
      />

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
        <FormModal
          isOpen={jobTitleModalOpen}
          onClose={() => setJobTitleModalOpen(false)}
          title="Update Job Title"
          description="Assign professional title decoupled from system permissions"
          size="sm"
          onSubmit={handleSaveJobTitle}
          submitLabel="Save Title"
          isSubmitting={roleMutation.isPending}
        >
          <div>
            <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase mb-1">
              Job Title
            </label>
            <Input
              value={newJobTitle}
              onChange={(e) => setNewJobTitle(e.target.value)}
              placeholder="e.g. Lead DevOps Architect, Staff QA Engineer"
              required
            />
          </div>
        </FormModal>
      )}

      {/* Group Assignment Modal */}
      {groupModalOpen && userForGroupEdit && (
        <Modal
          isOpen={groupModalOpen}
          onClose={() => {
            setGroupModalOpen(false);
            setUserForGroupEdit(null);
          }}
          title={`Directory Groups: ${userForGroupEdit.fullName}`}
          description="Assign or remove security directory group memberships for this coworker"
        >
          <div className="space-y-3 pt-2">
            {groups.length === 0 ? (
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] py-4 text-center">
                No directory groups defined in system.
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {groups.map((group) => {
                  const isMember = group.userGroups?.some((ug) => ug.userId === userForGroupEdit.id);
                  const isRoot = Boolean(
                    userForGroupEdit.isRoot ||
                    userForGroupEdit.email.toLowerCase() === 'admin@bugtracker.local'
                  );
                  const isAdminGroup = ['administrators', 'admin', 'admins'].includes(
                    group.name.toLowerCase().trim(),
                  );
                  const isProtectedRootAdmin = isRoot && isAdminGroup;

                  return (
                    <div
                      key={group.id}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${isAdminGroup
                        ? 'bg-[var(--md-sys-color-primary-container)]/15 border-[var(--md-sys-color-primary)]/30'
                        : 'bg-[var(--md-sys-color-surface-container)] border-[var(--md-sys-color-outline-variant)]/30 hover:border-[var(--md-sys-color-outline-variant)]'
                        }`}
                    >
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
                            {group.name}
                          </span>
                          {isAdminGroup ? (
                            <Badge variant="primary" size="sm" className="text-[10px] font-semibold flex items-center gap-1">
                              <Shield className="w-3 h-3 mr-0.5" />
                              Admin Authority
                            </Badge>
                          ) : group.isSystem ? (
                            <Badge variant="neutral" size="sm" className="text-[10px]">
                              System
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5 line-clamp-1">
                          {isAdminGroup
                            ? 'Confers full platform administrative authority over the Admin Center and system governance'
                            : group.description || 'Organizational directory group'}
                        </p>
                      </div>

                      <Button
                        variant={isMember ? 'outline' : 'filled'}
                        size="sm"
                        disabled={
                          isProtectedRootAdmin ||
                          addUserToGroupMutation.isPending ||
                          removeUserFromGroupMutation.isPending
                        }
                        onClick={async () => {
                          try {
                            if (isMember) {
                              await removeUserFromGroupMutation.mutateAsync({
                                groupId: group.id,
                                userId: userForGroupEdit.id,
                              });
                              setActionSuccess(`Removed ${userForGroupEdit.fullName} from ${group.name}`);
                            } else {
                              await addUserToGroupMutation.mutateAsync({
                                groupId: group.id,
                                userId: userForGroupEdit.id,
                              });
                              setActionSuccess(`Added ${userForGroupEdit.fullName} to ${group.name}`);
                            }
                            setTimeout(() => setActionSuccess(null), 3000);
                          } catch (err: unknown) {
                            setErrorMessage(err instanceof Error ? err.message : 'Failed to update group membership');
                          }
                        }}
                        className={`text-xs ${isMember
                          ? 'text-[var(--md-sys-color-error)] border-[var(--md-sys-color-error)]/40 hover:bg-[var(--md-sys-color-error-container)]'
                          : ''
                          }`}
                      >
                        {isProtectedRootAdmin ? (
                          <span title="Root admin cannot be removed from administrators">Locked (Root)</span>
                        ) : isAdminGroup ? (
                          isMember ? 'Revoke Admin' : 'Grant Admin'
                        ) : isMember ? (
                          'Leave Group'
                        ) : (
                          'Join Group'
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex justify-end pt-3 border-t border-[var(--md-sys-color-outline-variant)]/20">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setGroupModalOpen(false);
                  setUserForGroupEdit(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
