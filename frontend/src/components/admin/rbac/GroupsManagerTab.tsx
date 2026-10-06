import React, { useState, useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  UserPlus,
  Trash2,
} from 'lucide-react';
import type { GroupItem, UserProfile } from '../../../api/client';
import { UserIdentity } from '../../common/UserIdentity';
import { Badge, Button, SearchInput, ConfirmDialog, DataTable } from '../../ui';
import { AddGroupMembersModal } from './AddGroupMembersModal';

type GroupMemberItem = NonNullable<GroupItem['userGroups']>[number];

interface GroupsManagerTabProps {
  readonly groups: GroupItem[];
  readonly allUsers: UserProfile[];
  readonly selectedGroup: GroupItem | null;
  readonly onSelectGroup: (group: GroupItem) => void;
  readonly onCreateGroup: (name: string, description?: string) => Promise<void>;
  readonly onAddUserToGroup: (groupId: number, userId: number) => Promise<void>;
  readonly onRemoveUserFromGroup: (groupId: number, userId: number) => Promise<void>;
  readonly onBatchAddUsers?: (groupId: number, userIds: number[]) => Promise<void>;
  readonly onDeleteGroup?: (groupId: number) => Promise<void>;
}

export const GroupsManagerTab: React.FC<GroupsManagerTabProps> = ({
  groups,
  selectedGroup,
  onSelectGroup,
  onCreateGroup,
  onAddUserToGroup,
  onRemoveUserFromGroup,
  onBatchAddUsers,
  onDeleteGroup,
}) => {
  const [groupSearch, setGroupSearch] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{ userId: number; name: string } | null>(null);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    await onCreateGroup(newGroupName.trim(), newGroupDesc.trim() || undefined);
    setNewGroupName('');
    setNewGroupDesc('');
    setShowCreateGroup(false);
  };

  const handleBatchAdd = async (groupId: number, userIds: number[]) => {
    if (onBatchAddUsers) {
      await onBatchAddUsers(groupId, userIds);
    } else {
      for (const uid of userIds) {
        await onAddUserToGroup(groupId, uid);
      }
    }
  };

  const filteredGroups = useMemo(() => {
    const term = groupSearch.trim().toLowerCase();
    if (!term) return groups;
    return groups.filter(
      (g) =>
        g.name.toLowerCase().includes(term) ||
        (g.description && g.description.toLowerCase().includes(term)),
    );
  }, [groups, groupSearch]);

  const members = useMemo<GroupMemberItem[]>(
    () => selectedGroup?.userGroups || [],
    [selectedGroup],
  );

  const filteredMembers = useMemo(() => {
    const term = memberSearch.trim().toLowerCase();
    if (!term) return members;
    return members.filter((ug) => {
      const name = ug.user?.fullName?.toLowerCase() || '';
      const email = ug.user?.email?.toLowerCase() || '';
      return name.includes(term) || email.includes(term);
    });
  }, [members, memberSearch]);

  const columns = useMemo<ColumnDef<GroupMemberItem>[]>(() => [
    {
      id: 'member',
      header: 'Member',
      cell: ({ row }) => {
        const ug = row.original;
        return (
          <UserIdentity
            userId={ug.userId}
            user={ug.user}
            name={ug.user?.fullName || `User #${ug.userId}`}
            email={ug.user?.email}
            avatarUrl={ug.user?.avatarUrl}
            jobTitle={ug.user?.jobTitle}
            size="sm"
            showName
          />
        );
      },
    },
    {
      id: 'email',
      header: 'Email',
      cell: ({ row }) => {
        const ug = row.original;
        return (
          <span className="font-mono text-xs text-[var(--md-sys-color-on-surface-variant)] truncate">
            {ug.user?.email || '—'}
          </span>
        );
      },
    },
    {
      id: 'role',
      header: 'System Authority',
      cell: ({ row }) => {
        const role = row.original.user?.systemRole;
        return (
          <Badge variant={role === 'ADMIN' ? 'primary' : 'neutral'} size="sm">
            {role || 'MEMBER'}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const ug = row.original;
        return (
          <div className="flex items-center justify-start gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setMemberToRemove({
                  userId: ug.userId,
                  name: ug.user?.fullName || `User #${ug.userId}`,
                });
              }}
              className="h-7 px-2 text-xs text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)]/30 gap-1"
              title="Remove from group"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove
            </Button>
          </div>
        );
      },
    },
  ], []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
      {/* Group List Sidebar */}
      <div className="lg:col-span-4 xl:col-span-3 bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 rounded-3xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
            Directory Groups
          </h2>
          <Button
            variant="filled"
            size="sm"
            onClick={() => setShowCreateGroup(!showCreateGroup)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            New Group
          </Button>
        </div>

        {/* Create Group Form */}
        {showCreateGroup && (
          <form
            onSubmit={handleCreateSubmit}
            className="p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/30 space-y-3 animate-in fade-in"
          >
            <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">Create Global Group</p>
            <input
              type="text"
              required
              placeholder="Group Name (e.g. backend-engineers)"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]/40 text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newGroupDesc}
              onChange={(e) => setNewGroupDesc(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]/40 text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateGroup(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="filled" size="sm">
                Save
              </Button>
            </div>
          </form>
        )}

        {/* Search Groups */}
        <SearchInput
          value={groupSearch}
          onChange={setGroupSearch}
          placeholder="Filter groups..."
        />

        {/* Group Items */}
        <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
          {filteredGroups.map((grp) => (
            <button
              key={grp.id}
              onClick={() => onSelectGroup(grp)}
              className={`w-full text-left p-3 rounded-2xl transition-all flex items-center justify-between cursor-pointer ${
                selectedGroup?.id === grp.id
                  ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-semibold shadow-xs'
                  : 'hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]'
              }`}
            >
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs truncate">{grp.name}</span>
                  {grp.isSystem && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)] font-mono font-normal">
                      SYSTEM
                    </span>
                  )}
                </div>
                {grp.description && (
                  <p className="text-[10px] opacity-75 truncate mt-0.5">{grp.description}</p>
                )}
              </div>

              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--md-sys-color-surface-container-highest)] font-mono font-bold shrink-0">
                {grp.userGroups?.length || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Group Details & Members List */}
      <div className="lg:col-span-8 xl:col-span-9 bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 rounded-3xl p-6 space-y-6 shadow-xs">
        {selectedGroup ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--md-sys-color-outline-variant)]/20 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-[var(--md-sys-color-on-surface)]">
                    {selectedGroup.name}
                  </h2>
                  {selectedGroup.isSystem && (
                    <Badge variant="primary" size="sm">System Group</Badge>
                  )}
                  <span className="text-[10px] text-[var(--md-sys-color-outline)] font-mono">
                    ID #{selectedGroup.id}
                  </span>
                </div>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">
                  {selectedGroup.description || 'No description provided.'}
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                {onDeleteGroup &&
                  !selectedGroup.isSystem &&
                  selectedGroup.name.toLowerCase() !== 'administrators' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteConfirmOpen(true)}
                      leftIcon={<Trash2 className="w-3.5 h-3.5 text-[var(--md-sys-color-error)]" />}
                      className="text-[var(--md-sys-color-error)] border-[var(--md-sys-color-error)]/40 hover:bg-[var(--md-sys-color-error-container)]"
                    >
                      Delete Group
                    </Button>
                  )}

                <Button
                  variant="filled"
                  size="sm"
                  onClick={() => setIsAddModalOpen(true)}
                  leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                >
                  Add Members
                </Button>
              </div>
            </div>

            {/* Member Table Section */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-[var(--md-sys-color-on-surface)] uppercase tracking-wider">
                    Group Members
                  </h3>
                  <Badge variant="neutral" size="sm" className="font-mono">
                    {members.length} {members.length === 1 ? 'member' : 'members'}
                  </Badge>
                </div>

                <div className="w-full sm:w-64">
                  <SearchInput
                    value={memberSearch}
                    onChange={setMemberSearch}
                    placeholder="Filter members by name or email..."
                  />
                </div>
              </div>

              <DataTable<GroupMemberItem>
                data={filteredMembers}
                columns={columns}
                getRowId={(row) => String(row.id)}
                pageSize={10}
                pageSizeOptions={[10, 25, 50]}
                emptyTitle="No Members"
                emptyDescription={
                  members.length === 0
                    ? 'No members enrolled in this group yet. Click "Add Members" above to enroll engineers.'
                    : 'No group members match the search query.'
                }
              />
            </div>
          </>
        ) : (
          <div className="py-16 text-center text-xs text-[var(--md-sys-color-on-surface-variant)]">
            Select a group to manage its members.
          </div>
        )}
      </div>

      {/* Add Members Enterprise Modal */}
      {selectedGroup && isAddModalOpen && (
        <AddGroupMembersModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          group={selectedGroup}
          onAddUsers={handleBatchAdd}
        />
      )}

      {/* Delete Group Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen && !!selectedGroup}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={async () => {
          if (onDeleteGroup && selectedGroup) {
            await onDeleteGroup(selectedGroup.id);
            setDeleteConfirmOpen(false);
          }
        }}
        title="Delete Directory Group"
        description={`Are you sure you want to delete directory group "${selectedGroup?.name}"? All associated group memberships and role actor assignments will be removed.`}
        confirmLabel="Delete Group"
        variant="danger"
      />

      {/* Remove Member Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(memberToRemove)}
        onClose={() => setMemberToRemove(null)}
        onConfirm={async () => {
          if (memberToRemove && selectedGroup) {
            await onRemoveUserFromGroup(selectedGroup.id, memberToRemove.userId);
            setMemberToRemove(null);
          }
        }}
        title="Remove Member from Group"
        description={`Are you sure you want to remove "${memberToRemove?.name}" from "${selectedGroup?.name}"?`}
        confirmLabel="Remove Member"
        variant="danger"
      />
    </div>
  );
};
