import React, { useState } from 'react';
import type { TeamItem, UserProfile, TeamMemberRole } from '../../api/client';
import {
  useAddTeamMemberMutation,
  useUpdateTeamMemberMutation,
  useRemoveTeamMemberMutation,
  useTeamCapacityQuery,
} from '../../api/queries';
import { Button, Input, Modal } from '../ui';
import { Avatar } from '../common/Avatar';
import { TeamAvatar } from './TeamAvatar';
import {
  UserPlus,
  Trash2,
  AlertCircle,
} from 'lucide-react';

interface TeamRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: TeamItem;
  allUsers: UserProfile[];
}

const ROLE_OPTIONS: Array<{ value: TeamMemberRole; label: string }> = [
  { value: 'DEVELOPER', label: 'Developer / Engineer' },
  { value: 'SCRUM_MASTER', label: 'Scrum Master / Lead' },
  { value: 'PRODUCT_OWNER', label: 'Product Owner' },
  { value: 'QA_ENGINEER', label: 'QA / Test Engineer' },
  { value: 'DESIGNER', label: 'Product Designer' },
];

export const TeamRosterModal: React.FC<TeamRosterModalProps> = ({
  isOpen,
  onClose,
  team,
  allUsers,
}) => {
  const addMemberMutation = useAddTeamMemberMutation();
  const updateMemberMutation = useUpdateTeamMemberMutation();
  const removeMemberMutation = useRemoveTeamMemberMutation();

  const { data: capacityReport } = useTeamCapacityQuery(team.id, 2);

  // Add member form state
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [selectedRole, setSelectedRole] = useState<TeamMemberRole>('DEVELOPER');
  const [weeklyCapacityHours, setWeeklyCapacityHours] = useState<number>(40);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Available users not currently in team
  const currentMemberUserIds = new Set(team.members?.map((m) => m.userId) || []);
  const availableUsers = allUsers.filter((u) => !currentMemberUserIds.has(u.id));

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      setError('Please select a user to add');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await addMemberMutation.mutateAsync({
        teamId: team.id,
        payload: {
          userId: Number(selectedUserId),
          role: selectedRole,
          weeklyCapacityHours,
        },
      });

      setSelectedUserId('');
      setWeeklyCapacityHours(40);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add team member');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (memberId: number, role: TeamMemberRole) => {
    try {
      await updateMemberMutation.mutateAsync({
        teamId: team.id,
        memberId,
        payload: { role },
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update member role');
    }
  };

  const handleUpdateHours = async (memberId: number, hours: number) => {
    try {
      await updateMemberMutation.mutateAsync({
        teamId: team.id,
        memberId,
        payload: { weeklyCapacityHours: hours },
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update member capacity');
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    try {
      await removeMemberMutation.mutateAsync({
        teamId: team.id,
        memberId,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

  const totalWeeklyHours = (team.members || []).reduce(
    (sum, m) => sum + (Number(m.weeklyCapacityHours) || 0),
    0,
  );
  const sprintCalculatedHours = totalWeeklyHours * 2; // Standard 2-week sprint

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Team Roster: ${team.name}`}
      description="Manage team membership, engineering roles, and weekly sprint capacities."
      size="lg"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Capacity Summary Strip */}
        <div className="p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/50 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)]">
              <TeamAvatar name={team.name} avatarUrl={team.avatarUrl} size="sm" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                Active Members
              </div>
              <div className="text-lg font-black text-[var(--md-sys-color-on-surface)]">
                {team.members?.length || 0} members
              </div>
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
              Total Weekly Capacity
            </div>
            <div className="text-lg font-black text-[var(--md-sys-color-primary)]">
              {totalWeeklyHours.toFixed(1)} h/week
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
              2-Week Sprint Capacity
            </div>
            <div className="text-lg font-black text-[var(--md-sys-color-tertiary)]">
              {capacityReport?.totalCapacityHours
                ? `${capacityReport.totalCapacityHours.toFixed(1)}h`
                : `${sprintCalculatedHours.toFixed(1)}h`}
            </div>
          </div>
        </div>

        {/* Add Member Bar */}
        <form
          onSubmit={handleAddMember}
          className="p-3 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] flex flex-wrap items-center gap-2"
        >
          <div className="flex-1 min-w-[180px]">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : '')}
              className="w-full p-2 text-xs rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]/40 cursor-pointer"
            >
              <option value="">Select user to add...</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName || u.email}
                </option>
              ))}
            </select>
          </div>

          <div className="w-44">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as TeamMemberRole)}
              className="w-full p-2 text-xs rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]/40 cursor-pointer"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="w-24">
            <Input
              type="number"
              min={0}
              max={168}
              step={1}
              value={weeklyCapacityHours}
              onChange={(e) => setWeeklyCapacityHours(Number(e.target.value) || 0)}
              placeholder="Hrs/wk"
              className="text-xs"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={loading || !selectedUserId}
            leftIcon={<UserPlus className="w-3.5 h-3.5" />}
          >
            Add
          </Button>
        </form>

        {/* Member Table */}
        <div className="overflow-x-auto rounded-2xl border border-[var(--md-sys-color-outline-variant)]/50 bg-[var(--md-sys-color-surface-container-low)]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--md-sys-color-outline-variant)]/40 bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] font-bold">
                <th className="py-2.5 px-3">Member</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3 w-28">Weekly Hours</th>
                <th className="py-2.5 px-3 w-16 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]/20">
              {!team.members || team.members.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-xs text-[var(--md-sys-color-on-surface-variant)]">
                    No members assigned to this team yet. Use the form above to add engineers.
                  </td>
                </tr>
              ) : (
                team.members.map((member) => (
                  <tr key={member.id} className="hover:bg-[var(--md-sys-color-surface-container)]/40 transition">
                    {/* User */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <Avatar
                          name={member.user?.fullName || 'User'}
                          avatarUrl={member.user?.avatarUrl}
                          size="sm"
                        />
                        <div>
                          <div className="font-bold text-[var(--md-sys-color-on-surface)]">
                            {member.user?.fullName || `User #${member.userId}`}
                          </div>
                          <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                            {member.user?.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role Dropdown */}
                    <td className="py-2.5 px-3">
                      <select
                        value={member.role}
                        onChange={(e) => handleUpdateRole(member.id, e.target.value as TeamMemberRole)}
                        className="p-1.5 text-xs rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]/60 text-[var(--md-sys-color-on-surface)] font-medium focus:outline-none focus:ring-1 focus:ring-[var(--md-sys-color-primary)] cursor-pointer"
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Weekly Hours Input */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={0}
                          max={168}
                          step={1}
                          defaultValue={member.weeklyCapacityHours || 40}
                          onBlur={(e) => {
                            const val = Number(e.target.value) || 0;
                            if (val !== member.weeklyCapacityHours) {
                              handleUpdateHours(member.id, val);
                            }
                          }}
                          className="w-16 p-1 text-xs rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]/60 text-center font-bold focus:outline-none focus:ring-1 focus:ring-[var(--md-sys-color-primary)]"
                        />
                        <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] font-semibold">
                          h/wk
                        </span>
                      </div>
                    </td>

                    {/* Remove Action */}
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-1.5 rounded-lg text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)]/30 transition cursor-pointer"
                        title="Remove member from team"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
