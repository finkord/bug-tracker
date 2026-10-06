import React, { useState } from 'react';
import type { TeamItem, UserProfile } from '../../api/client';
import { useTeamsQuery, useDeleteTeamMutation } from '../../api/queries';
import { Button, ConfirmDialog, EntityAvatar } from '../ui/index.js';
import { UserIdentity } from '../common/UserIdentity';
import { TeamModal } from '../teams/TeamModal';
import { TeamRosterModal } from '../teams/TeamRosterModal';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  UserCheck,
} from 'lucide-react';

interface ProjectTeamsTabProps {
  projectId: number;
  allUsers: UserProfile[];
}

export const ProjectTeamsTab: React.FC<ProjectTeamsTabProps> = ({
  projectId,
  allUsers,
}) => {
  const { data: teams = [], isLoading } = useTeamsQuery(projectId);
  const deleteMutation = useDeleteTeamMutation();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamItem | null>(null);
  const [rosterTeam, setRosterTeam] = useState<TeamItem | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<TeamItem | null>(null);

  const handleDeleteTeam = (team: TeamItem) => {
    setTeamToDelete(team);
  };

  return (
    <div className="space-y-6">
      {/* Tab Header Strip */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[var(--md-sys-color-outline-variant)]/40">
        <div>
          <h2 className="text-base font-black text-[var(--md-sys-color-on-surface)]">
            Project Teams
          </h2>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
            Organize engineering resources, define Scrum rosters, track sprint capacities, and assign team leads.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setCreateModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shrink-0"
        >
          Create Team
        </Button>
      </div>

      {/* Teams Grid / List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/40 animate-pulse h-44"
            />
          ))}
        </div>
      ) : teams.length === 0 ? (
        <div className="p-10 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/50 text-center space-y-3">
          <div className="inline-flex p-3 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)]">
            <Users className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
              No teams created yet
            </h3>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
              Create your first Scrum team to group members, manage sprint capacities, and track velocity.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create First Team
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map((team) => {
            const memberCount = team.members?.length || 0;
            const totalWeeklyHours = (team.members || []).reduce(
              (acc, m) => acc + (Number(m.weeklyCapacityHours) || 0),
              0,
            );

            return (
              <div
                key={team.id}
                className="p-5 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/50 hover:border-[var(--md-sys-color-primary)]/50 transition-all flex flex-col justify-between shadow-2xs gap-4"
              >
                {/* Team Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <EntityAvatar
                      name={team.name}
                      avatarUrl={team.avatarUrl}
                      size="md"
                    />
                    <div>
                      <h3 className="text-sm font-black text-[var(--md-sys-color-on-surface)]">
                        {team.name}
                      </h3>
                      {team.description ? (
                        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] line-clamp-1 mt-0.5">
                          {team.description}
                        </p>
                      ) : (
                        <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]/60 italic">
                          No description
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions dropdown/buttons */}
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => setEditingTeam(team)}
                      className="p-1.5 text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)]"
                      title="Edit team settings"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => handleDeleteTeam(team)}
                      className="p-1.5 text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)]/30"
                      title="Delete team"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Team Info Metrics */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]/30 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] block">
                      Team Lead
                    </span>
                    {team.lead ? (
                      <div className="mt-1">
                        <UserIdentity
                          userId={team.lead.id}
                          user={team.lead}
                          name={team.lead.fullName || 'Lead'}
                          avatarUrl={team.lead.avatarUrl}
                          email={team.lead.email}
                          size="xs"
                          showName
                        />
                      </div>
                    ) : (
                      <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]/70 italic mt-1 block">
                        Unassigned
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] block">
                      Sprint Capacity
                    </span>
                    <span className="font-black text-[var(--md-sys-color-primary)] text-xs mt-1 block">
                      {team.sprintCapacityHours}h / sprint
                    </span>
                  </div>
                </div>

                {/* Card Footer: Members preview & Roster button */}
                <div className="flex items-center justify-between pt-2 border-t border-[var(--md-sys-color-outline-variant)]/30 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {(team.members || []).slice(0, 4).map((m) => (
                        <UserIdentity
                          key={m.id}
                          userId={m.userId}
                          user={m.user}
                          name={m.user?.fullName || 'User'}
                          avatarUrl={m.user?.avatarUrl}
                          email={m.user?.email}
                          size="xs"
                          className="ring-2 ring-[var(--md-sys-color-surface)]"
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)]">
                      {memberCount} {memberCount === 1 ? 'member' : 'members'}
                      {totalWeeklyHours > 0 && ` (${totalWeeklyHours.toFixed(0)}h/wk)`}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => setRosterTeam(team)}
                    leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                  >
                    Manage Roster
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Team Modal */}
      {(createModalOpen || editingTeam) && (
        <TeamModal
          isOpen={createModalOpen || Boolean(editingTeam)}
          onClose={() => {
            setCreateModalOpen(false);
            setEditingTeam(null);
          }}
          projectId={projectId}
          team={editingTeam}
          users={allUsers}
        />
      )}

      {/* Roster Modal */}
      {rosterTeam && (
        <TeamRosterModal
          isOpen={Boolean(rosterTeam)}
          onClose={() => setRosterTeam(null)}
          team={rosterTeam}
          allUsers={allUsers}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(teamToDelete)}
        onClose={() => setTeamToDelete(null)}
        onConfirm={async () => {
          if (teamToDelete) {
            await deleteMutation.mutateAsync(teamToDelete.id);
            setTeamToDelete(null);
          }
        }}
        title="Delete Team"
        description={`Are you sure you want to delete team "${teamToDelete?.name}"? Team assignments will be cleared.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
