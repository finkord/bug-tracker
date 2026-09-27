import React, { useState } from 'react';
import {
  Plus,
  Search,
  UserPlus,
  Trash2,
} from 'lucide-react';
import type { GroupItem, UserProfile } from '../../../api/client';
import { Avatar } from '../../common/Avatar';
import { Badge, Button } from '../../ui';

interface GroupsManagerTabProps {
  readonly groups: GroupItem[];
  readonly allUsers: UserProfile[];
  readonly selectedGroup: GroupItem | null;
  readonly onSelectGroup: (group: GroupItem) => void;
  readonly onCreateGroup: (name: string, description?: string) => Promise<void>;
  readonly onAddUserToGroup: (groupId: number, userId: number) => Promise<void>;
  readonly onRemoveUserFromGroup: (groupId: number, userId: number) => Promise<void>;
}

export const GroupsManagerTab: React.FC<GroupsManagerTabProps> = ({
  groups,
  allUsers,
  selectedGroup,
  onSelectGroup,
  onCreateGroup,
  onAddUserToGroup,
  onRemoveUserFromGroup,
}) => {
  const [groupSearch, setGroupSearch] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [selectedUserIdToAdd, setSelectedUserIdToAdd] = useState<number | ''>('');

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    await onCreateGroup(newGroupName.trim(), newGroupDesc.trim() || undefined);
    setNewGroupName('');
    setNewGroupDesc('');
    setShowCreateGroup(false);
  };

  const handleAddUser = async () => {
    if (!selectedGroup || !selectedUserIdToAdd) return;
    await onAddUserToGroup(selectedGroup.id, Number(selectedUserIdToAdd));
    setSelectedUserIdToAdd('');
  };

  const filteredGroups = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(groupSearch.toLowerCase()) ||
      (g.description && g.description.toLowerCase().includes(groupSearch.toLowerCase())),
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Group List Sidebar */}
      <div className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 rounded-3xl p-5 space-y-4 shadow-xs">
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
            <div className="flex gap-2">
              <Button type="submit" variant="filled" size="sm">
                Create
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCreateGroup(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[var(--md-sys-color-outline)]" />
          <input
            type="text"
            placeholder="Search groups..."
            value={groupSearch}
            onChange={(e) => setGroupSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]/30 text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
          />
        </div>

        {/* List */}
        <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
          {filteredGroups.map((grp) => (
            <button
              key={grp.id}
              onClick={() => onSelectGroup(grp)}
              className={`w-full text-left p-3 rounded-2xl transition-all cursor-pointer flex items-center justify-between ${
                selectedGroup?.id === grp.id
                  ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shadow-xs font-semibold'
                  : 'hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]'
              }`}
            >
              <div className="truncate pr-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold truncate">{grp.name}</span>
                  {grp.isSystem && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-outline-variant)] font-bold">
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
      <div className="lg:col-span-2 bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 rounded-3xl p-6 space-y-6 shadow-xs">
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
                </div>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">
                  {selectedGroup.description || 'No description provided.'}
                </p>
              </div>

              {/* Add user to group */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedUserIdToAdd}
                  onChange={(e) => setSelectedUserIdToAdd(e.target.value ? Number(e.target.value) : '')}
                  className="px-3 py-1.5 text-xs rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]/40 text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                >
                  <option value="">Select engineer to add...</option>
                  {allUsers
                    .filter((u) => !selectedGroup.userGroups?.some((ug) => ug.userId === u.id))
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.email})
                      </option>
                    ))}
                </select>
                <Button
                  variant="filled"
                  size="sm"
                  onClick={handleAddUser}
                  disabled={!selectedUserIdToAdd}
                  leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Member Table */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
                Group Members ({selectedGroup.userGroups?.length || 0})
              </h3>

              {selectedGroup.userGroups && selectedGroup.userGroups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedGroup.userGroups.map((ug) => (
                    <div
                      key={ug.id}
                      className="p-3 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/20 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                          name={ug.user?.fullName || 'User'}
                          avatarUrl={ug.user?.avatarUrl}
                          role={ug.user?.systemRole}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)] truncate">
                            {ug.user?.fullName || `User #${ug.userId}`}
                          </p>
                          <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] truncate">
                            {ug.user?.email}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => onRemoveUserFromGroup(selectedGroup.id, ug.userId)}
                        className="p-1.5 text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)]/30 rounded-xl transition-colors cursor-pointer"
                        title="Remove from group"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-[var(--md-sys-color-on-surface-variant)]">
                  No members in this group yet. Select an engineer above to add them.
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="py-16 text-center text-xs text-[var(--md-sys-color-on-surface-variant)]">
            Select a group to manage its members.
          </div>
        )}
      </div>
    </div>
  );
};
