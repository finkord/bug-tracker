import React, { useState } from 'react';
import { api, type SystemRole } from '../../api/client.js';
import {
  useUsersQuery,
  useUpdateUserRoleMutation,
  useBlockUserMutation,
  useUnblockUserMutation,
  useAdminResetUser2FaMutation,
} from '../../api/queries';
import { Avatar } from '../common/Avatar.js';
import {
  Button,
  Badge,
  Card,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
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
} from 'lucide-react';

export const AdminUsersTab: React.FC = () => {
  const [userSearch, setUserSearch] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    data: usersData,
    isLoading: loading,
  } = useUsersQuery({
    page: userPage,
    limit: 25,
    search: activeSearch || undefined,
    role: userRoleFilter || undefined,
  });

  const users = usersData?.items || [];
  const totalUsers = usersData?.total || 0;

  const roleMutation = useUpdateUserRoleMutation();
  const blockMutation = useBlockUserMutation();
  const unblockMutation = useUnblockUserMutation();
  const reset2FaMutation = useAdminResetUser2FaMutation();

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
      } else {
        await blockMutation.mutateAsync(userId);
      }
      setActionSuccess(currentlyBlocked ? 'User unblocked' : 'User blocked');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update block status');
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
      setActionSuccess(`Password reset email sent to ${email}`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to send password reset');
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalUsers / 25));

  return (
    <div className="space-y-6">
      {actionSuccess && (
        <div className="flex items-center gap-2 p-3 bg-[var(--md-sys-color-success-container)] border border-[var(--md-sys-color-success)]/30 rounded-xl text-xs font-semibold text-[var(--md-sys-color-on-success-container)]">
          <CheckCircle className="w-4 h-4 shrink-0 text-[var(--md-sys-color-success)]" />
          {actionSuccess}
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-xs font-semibold text-destructive">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-card/70 border-border/70">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search users by name or email..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="w-full sm:w-56">
            <Select value={userRoleFilter} onValueChange={(v) => { setUserRoleFilter(v); setUserPage(1); }}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Roles</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="PROJECT_MANAGER">Project Manager</SelectItem>
                <SelectItem value="DEVELOPER">Developer</SelectItem>
                <SelectItem value="QA_ENGINEER">QA Engineer</SelectItem>
                <SelectItem value="DEVOPS_ENGINEER">DevOps Engineer</SelectItem>
                <SelectItem value="SECURITY_ENGINEER">Security Engineer</SelectItem>
                <SelectItem value="USER">Standard User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" size="sm" className="w-full sm:w-auto text-xs font-medium">
            Search
          </Button>
        </form>
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden border-border/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/70">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">2FA Security</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                    <span className="text-xs mt-2 block">Loading users...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto opacity-40 mb-2" />
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={u.fullName}
                          avatarUrl={u.avatarUrl || undefined}
                          size="sm"
                        />
                        <div>
                          <div className="font-semibold text-foreground text-xs">{u.fullName}</div>
                          <div className="text-muted-foreground text-[11px] font-mono">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="w-40">
                        <Select
                          value={u.systemRole}
                          onValueChange={(val) => handleRoleChange(u.id, val as SystemRole)}
                        >
                          <SelectTrigger className="h-7 text-xs font-medium">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                            <SelectItem value="PROJECT_MANAGER">Project Manager</SelectItem>
                            <SelectItem value="DEVELOPER">Developer</SelectItem>
                            <SelectItem value="QA_ENGINEER">QA Engineer</SelectItem>
                            <SelectItem value="DEVOPS_ENGINEER">DevOps</SelectItem>
                            <SelectItem value="SECURITY_ENGINEER">Security</SelectItem>
                            <SelectItem value="USER">User</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {u.isBlocked ? (
                        <Badge variant="error" className="text-[10px]">Blocked</Badge>
                      ) : u.isActivated ? (
                        <Badge variant="success" className="text-[10px]">Active</Badge>
                      ) : (
                        <Badge variant="warning" className="text-[10px]">Pending</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {u.twoFactorEnabled ? (
                          <Badge variant="primary" className="text-[10px]">2FA Active</Badge>
                        ) : (
                          <Badge variant="neutral" className="text-[10px]">Disabled</Badge>
                        )}
                        {u.twoFactorEnabled && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReset2Fa(u.id)}
                            className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-destructive"
                            title="Reset 2FA for locked out user"
                          >
                            Reset
                          </Button>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSendResetPassword(u.email)}
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                        title="Send password reset link"
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1" />
                        Reset Pwd
                      </Button>
                      <Button
                        variant={u.isBlocked ? 'outline' : 'ghost'}
                        size="sm"
                        onClick={() => handleToggleBlock(u.id, u.isBlocked)}
                        className={`h-7 px-2 text-xs ${
                          u.isBlocked
                            ? 'text-[var(--md-sys-color-success)] hover:opacity-80'
                            : 'text-destructive hover:bg-destructive/10'
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-3 border-t border-border/70 text-xs text-muted-foreground">
            <span>
              Showing {users.length} of {totalUsers} users
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                disabled={userPage === 1}
                className="h-7 text-xs"
              >
                Previous
              </Button>
              <span className="px-2 font-mono">
                {userPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUserPage((p) => Math.min(totalPages, p + 1))}
                disabled={userPage === totalPages}
                className="h-7 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
