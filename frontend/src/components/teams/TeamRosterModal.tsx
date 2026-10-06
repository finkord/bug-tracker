import React, { useState } from 'react';
import type { TeamItem, UserProfile, TeamMemberRole } from '../../api/client';
import {
  useAddTeamMemberMutation,
  useUpdateTeamMemberMutation,
  useRemoveTeamMemberMutation,
  useTeamCapacityQuery,
} from '../../api/queries';
import {
  Button,
  Input,
  Modal,
  EntityAvatar,
  UserPicker,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../ui/index.js';
import { UserIdentity } from '../common/UserIdentity.js';
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
        <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs items-center">
          <div className="flex items-center gap-3">
            <EntityAvatar name={team.name} avatarUrl={team.avatarUrl} size="md" />
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

        {/* Add Member Form */}
        <form
          onSubmit={handleAddMember}
          className="p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/40 flex flex-wrap items-center gap-2.5"
        >
          <div className="flex-1 min-w-[200px]">
            <UserPicker
              users={availableUsers}
              value={selectedUserId ? Number(selectedUserId) : null}
              onChange={(userId) => setSelectedUserId(userId ?? '')}
              placeholder="Select user to add..."
              className="w-full"
            />
          </div>

          <div className="w-48">
            <Select
              value={selectedRole}
              onValueChange={(val) => setSelectedRole(val as TeamMemberRole)}
            >
              <SelectTrigger size="sm" className="h-9 text-xs rounded-xl bg-[var(--md-sys-color-surface)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            variant="filled"
            size="sm"
            disabled={loading || !selectedUserId}
            leftIcon={<UserPlus className="w-3.5 h-3.5" />}
          >
            Add
          </Button>
        </form>

        {/* Member Table */}
        <div className="overflow-x-auto rounded-2xl border border-[var(--md-sys-color-outline-variant)]/40 bg-[var(--md-sys-color-surface-container-low)]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--md-sys-color-outline-variant)]/30 bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] font-bold">
                <th className="py-2.5 px-3">Member</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3 w-32">Weekly Hours</th>
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
                    {/* User Identity with profile navigation */}
                    <td className="py-2.5 px-3">
                      <UserIdentity
                        userId={member.userId}
                        user={member.user}
                        name={member.user?.fullName || `User #${member.userId}`}
                        email={member.user?.email}
                        avatarUrl={member.user?.avatarUrl}
                        size="sm"
                        showName
                        showEmail
                      />
                    </td>

                    {/* Role Dropdown */}
                    <td className="py-2.5 px-3">
                      <div className="w-44">
                        <Select
                          value={member.role}
                          onValueChange={(val) => handleUpdateRole(member.id, val as TeamMemberRole)}
                        >
                          <SelectTrigger size="sm" className="h-8 text-xs rounded-lg bg-[var(--md-sys-color-surface)]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLE_OPTIONS.map((r) => (
                              <SelectItem key={r.value} value={r.value}>
                                {r.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </td>

                    {/* Weekly Hours Input */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <Input
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
                          className="w-20 h-8 text-xs text-center font-bold"
                        />
                        <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] font-semibold">
                          h/wk
                        </span>
                      </div>
                    </td>

                    {/* Remove Action */}
                    <td className="py-2.5 px-3 text-right">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)]/30 rounded-lg p-1.5"
                        title="Remove member from team"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <Button variant="outlined" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
