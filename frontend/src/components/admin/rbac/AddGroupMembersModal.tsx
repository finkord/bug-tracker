import React, { useState, useEffect } from 'react';
import { Search, UserPlus, X, Check, CheckCircle2, Loader2, Users } from 'lucide-react';
import type { GroupItem } from '../../../api/client';
import { useUsersQuery } from '../../../api/queries';
import { Modal, Button, Badge } from '../../ui';
import { Avatar } from '../../common/Avatar';

export interface AddGroupMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: GroupItem;
  onAddUsers: (groupId: number, userIds: number[]) => Promise<void>;
}

export const AddGroupMembersModal: React.FC<AddGroupMembersModalProps> = ({
  isOpen,
  onClose,
  group,
  onAddUsers,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Debounce search query to scale to thousands of users without hammering the API
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setDebouncedQuery('');
      setSelectedUserIds([]);
      setSubmitError(null);
    }
  }, [isOpen]);

  const { data: usersData, isLoading } = useUsersQuery({
    search: debouncedQuery.trim() || undefined,
    limit: 30,
  });

  const usersList = usersData?.items || [];
  const existingMemberIds = new Set(group.userGroups?.map((ug) => ug.userId) || []);
  const eligibleUsers = usersList.filter((u) => !existingMemberIds.has(u.id));

  const handleToggleUser = (userId: number) => {
    if (existingMemberIds.has(userId)) return;
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const handleSelectAllEligible = () => {
    const eligibleIds = eligibleUsers.map((u) => u.id);
    const allSelected = eligibleIds.length > 0 && eligibleIds.every((id) => selectedUserIds.includes(id));
    if (allSelected) {
      setSelectedUserIds((prev) => prev.filter((id) => !eligibleIds.includes(id)));
    } else {
      setSelectedUserIds((prev) => Array.from(new Set([...prev, ...eligibleIds])));
    }
  };

  const handleSubmit = async () => {
    if (selectedUserIds.length === 0) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onAddUsers(group.id, selectedUserIds);
      onClose();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to add users to group');
    } finally {
      setIsSubmitting(false);
    }
  };

  const allEligibleSelected =
    eligibleUsers.length > 0 && eligibleUsers.every((u) => selectedUserIds.includes(u.id));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)] flex items-center justify-center">
            <UserPlus className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[var(--md-sys-color-on-surface)]">
              Add Members to {group.name}
            </h2>
            <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
              Search and multi-select engineers from your organization directory.
            </p>
          </div>
        </div>
      }
      size="lg"
      footer={
        <div className="flex items-center justify-between gap-3 w-full">
          <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
            {selectedUserIds.length > 0 ? (
              <span className="font-semibold text-[var(--md-sys-color-primary)]">
                {selectedUserIds.length} engineer{selectedUserIds.length === 1 ? '' : 's'} selected
              </span>
            ) : (
              <span>Select engineers to enroll</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="filled"
              size="sm"
              onClick={handleSubmit}
              disabled={selectedUserIds.length === 0 || isSubmitting}
              isLoading={isSubmitting}
              leftIcon={<UserPlus className="w-3.5 h-3.5" />}
            >
              Add {selectedUserIds.length > 0 ? `${selectedUserIds.length} Members` : 'Members'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="p-4 sm:p-5 space-y-4">
        {/* Search bar & Quick Select */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--md-sys-color-outline)]" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email (e.g. alex@example.com)..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]/30 text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {eligibleUsers.length > 0 && (
            <button
              type="button"
              onClick={handleSelectAllEligible}
              className="text-xs font-semibold text-[var(--md-sys-color-primary)] hover:underline shrink-0 cursor-pointer text-left sm:text-right"
            >
              {allEligibleSelected ? 'Deselect All' : `Select All Visible (${eligibleUsers.length})`}
            </button>
          )}
        </div>

        {submitError && (
          <div className="p-3 rounded-xl bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] text-xs flex items-center justify-between">
            <span>{submitError}</span>
            <button
              type="button"
              onClick={() => setSubmitError(null)}
              className="font-bold underline ml-2 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Directory Results List */}
        <div className="border border-[var(--md-sys-color-outline-variant)]/20 rounded-2xl overflow-hidden bg-[var(--md-sys-color-surface)] max-h-80 overflow-y-auto divide-y divide-[var(--md-sys-color-outline-variant)]/10">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--md-sys-color-primary)]" />
              <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                Searching directory...
              </span>
            </div>
          ) : usersList.length === 0 ? (
            <div className="text-center py-10 px-4 space-y-1.5">
              <Search className="w-7 h-7 text-[var(--md-sys-color-outline)] mx-auto opacity-40" />
              <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
                No engineers found
              </p>
              <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                {debouncedQuery
                  ? `No registered users matched "${debouncedQuery}".`
                  : 'No users registered in directory.'}
              </p>
            </div>
          ) : eligibleUsers.length === 0 && !debouncedQuery ? (
            <div className="text-center py-10 px-4 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-[var(--md-sys-color-primary)] mx-auto" />
              <p className="text-xs font-black text-[var(--md-sys-color-on-surface)]">
                All Users Enrolled
              </p>
              <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] max-w-sm mx-auto">
                All registered engineers in your organization are already active members of{' '}
                <strong className="text-[var(--md-sys-color-on-surface)]">{group.name}</strong>.
              </p>
            </div>
          ) : (
            usersList.map((user) => {
              const isAlreadyMember = existingMemberIds.has(user.id);
              const isSelected = selectedUserIds.includes(user.id);

              return (
                <div
                  key={user.id}
                  onClick={() => !isAlreadyMember && handleToggleUser(user.id)}
                  className={`p-3 flex items-center justify-between gap-3 transition-colors ${
                    isAlreadyMember
                      ? 'bg-[var(--md-sys-color-surface-container)]/30 opacity-60 cursor-not-allowed'
                      : isSelected
                        ? 'bg-[var(--md-sys-color-primary-container)]/25 cursor-pointer'
                        : 'hover:bg-[var(--md-sys-color-surface-container-high)]/50 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      disabled={isAlreadyMember}
                      checked={isAlreadyMember || isSelected}
                      onChange={() => handleToggleUser(user.id)}
                      className="w-4 h-4 rounded border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-primary)] focus:ring-[var(--md-sys-color-primary)] shrink-0 cursor-pointer disabled:cursor-not-allowed"
                      aria-label={`Select ${user.fullName}`}
                    />
                    <Avatar
                      name={user.fullName}
                      avatarUrl={user.avatarUrl}
                      role={user.systemRole}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)] truncate">
                          {user.fullName}
                        </p>
                        <Badge variant="neutral" size="sm">
                          {user.systemRole}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isAlreadyMember ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--md-sys-color-surface-container-highest)] font-semibold text-[var(--md-sys-color-on-surface-variant)]">
                        Enrolled
                      </span>
                    ) : isSelected ? (
                      <span className="w-5 h-5 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
};
