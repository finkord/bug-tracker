import React, { useState } from 'react';
import {
  useTeamsQuery,
  useCreateTeamMutation,
  useUpdateTeamMutation,
  useDeleteTeamMutation,
  useAddTeamMemberMutation,
  useRemoveTeamMemberMutation,
} from '../../api/queries/useTeamsQuery.js';
import { useProjectsQuery } from '../../api/queries/index.js';
import { useUsersQuery } from '../../api/queries/useUsersQuery.js';
import type { TeamItem, TeamMemberRole } from '../../api/types/teams.types.js';
import { UserIdentity } from '../common/UserIdentity';
import {
  Card,
  Button,
  Badge,
  Modal,
  ConfirmDialog,
  SearchInput,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  UserPicker,
} from '../ui/index.js';
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  FolderGit2,
  UserCheck,
  Clock,
  CheckCircle,
  AlertTriangle,
  UserPlus,
} from 'lucide-react';

const ROLE_LABELS: Record<TeamMemberRole, string> = {
  SCRUM_MASTER: 'Scrum Master',
  PRODUCT_OWNER: 'Product Owner',
  DEVELOPER: 'Developer',
  QA_ENGINEER: 'QA Engineer',
  DESIGNER: 'Product Designer',
};

const ROLE_BADGE_VARIANTS: Record<
  TeamMemberRole,
  'primary' | 'secondary' | 'neutral' | 'success' | 'warning'
> = {
  SCRUM_MASTER: 'primary',
  PRODUCT_OWNER: 'secondary',
  DEVELOPER: 'neutral',
  QA_ENGINEER: 'success',
  DESIGNER: 'warning',
};

export const AdminTeamsTab: React.FC = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: teams = [], isLoading: loadingTeams } = useTeamsQuery(
    selectedProjectId ? Number(selectedProjectId) : undefined,
  );
  const { data: projects = [] } = useProjectsQuery();
  const { data: usersData } = useUsersQuery({ limit: 200 });
  const users = usersData?.items || [];

  const createTeamMutation = useCreateTeamMutation();
  const updateTeamMutation = useUpdateTeamMutation();
  const deleteTeamMutation = useDeleteTeamMutation();
  const addMemberMutation = useAddTeamMemberMutation();
  const removeMemberMutation = useRemoveTeamMemberMutation();

  // Create Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newProjectId, setNewProjectId] = useState<number | undefined>(undefined);
  const [newLeadId, setNewLeadId] = useState<number | undefined>(undefined);
  const [newSprintCapacity, setNewSprintCapacity] = useState<number>(80);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [teamToEdit, setTeamToEdit] = useState<TeamItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editLeadId, setEditLeadId] = useState<number | undefined>(undefined);
  const [editSprintCapacity, setEditSprintCapacity] = useState<number>(80);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<TeamItem | null>(null);

  // Add Member State
  const [activeAddMemberTeamId, setActiveAddMemberTeamId] = useState<number | null>(null);
  const [memberUserId, setMemberUserId] = useState<number | ''>('');
  const [memberRole, setMemberRole] = useState<TeamMemberRole>('DEVELOPER');
  const [memberWeeklyCapacity, setMemberWeeklyCapacity] = useState<number>(40);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleOpenCreateModal = () => {
    setNewName('');
    setNewDesc('');
    setNewProjectId(projects.length > 0 ? projects[0].id : undefined);
    setNewLeadId(undefined);
    setNewSprintCapacity(80);
    setCreateModalOpen(true);
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newProjectId) return;

    try {
      await createTeamMutation.mutateAsync({
        name: newName.trim(),
        description: newDesc.trim() || undefined,
        projectId: newProjectId,
        leadId: newLeadId || undefined,
        sprintCapacityHours: Number(newSprintCapacity) || 0,
      });
      setCreateModalOpen(false);
      showFeedback('success', `Team "${newName.trim()}" created successfully`);
    } catch (err: unknown) {
      showFeedback('error', err instanceof Error ? err.message : 'Failed to create team');
    }
  };

  const handleOpenEditModal = (team: TeamItem) => {
    setTeamToEdit(team);
    setEditName(team.name);
    setEditDesc(team.description || '');
    setEditLeadId(team.leadId || undefined);
    setEditSprintCapacity(Number(team.sprintCapacityHours) || 80);
    setEditModalOpen(true);
  };

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamToEdit || !editName.trim()) return;

    try {
      await updateTeamMutation.mutateAsync({
        id: teamToEdit.id,
        payload: {
          name: editName.trim(),
          description: editDesc.trim() || undefined,
          leadId: editLeadId || undefined,
          sprintCapacityHours: Number(editSprintCapacity) || 0,
        },
      });
      setEditModalOpen(false);
      setTeamToEdit(null);
      showFeedback('success', 'Team details updated successfully');
    } catch (err: unknown) {
      showFeedback('error', err instanceof Error ? err.message : 'Failed to update team');
    }
  };

  const handleDeleteTeam = async () => {
    if (!teamToDelete) return;

    try {
      await deleteTeamMutation.mutateAsync(teamToDelete.id);
      setDeleteModalOpen(false);
      setTeamToDelete(null);
      showFeedback('success', 'Team removed successfully');
    } catch (err: unknown) {
      showFeedback('error', err instanceof Error ? err.message : 'Failed to delete team');
    }
  };

  const handleAddMember = async (teamId: number) => {
    if (!memberUserId) return;

    try {
      await addMemberMutation.mutateAsync({
        teamId,
        payload: {
          userId: Number(memberUserId),
          role: memberRole,
          weeklyCapacityHours: Number(memberWeeklyCapacity) || 40,
        },
      });
      setActiveAddMemberTeamId(null);
      setMemberUserId('');
      setMemberRole('DEVELOPER');
      setMemberWeeklyCapacity(40);
      showFeedback('success', 'Team member added successfully');
    } catch (err: unknown) {
      showFeedback('error', err instanceof Error ? err.message : 'Failed to add team member');
    }
  };

  const handleRemoveMember = async (teamId: number, memberId: number) => {
    try {
      await removeMemberMutation.mutateAsync({ teamId, memberId });
      showFeedback('success', 'Member removed from team');
    } catch (err: unknown) {
      showFeedback('error', err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

  // Filtered teams
  const filteredTeams = teams.filter((t) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = t.name.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchProject = t.project?.name.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchProject) return false;
    }
    return true;
  });

  // Aggregate stats
  const totalTeams = teams.length;
  const totalMembers = teams.reduce((acc, t) => acc + (t.members?.length || 0), 0);
  const totalCapacity = teams.reduce((acc, t) => acc + Number(t.sprintCapacityHours || 0), 0);

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-200">
      {/* Feedback banner */}
      {feedback && (
        <div
          className={`flex items-center gap-2 p-3.5 rounded-2xl text-xs font-semibold ${
            feedback.type === 'success'
              ? 'bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)] border border-[var(--md-sys-color-success)]/30'
              : 'bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] border border-[var(--md-sys-color-error)]/30'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0 text-[var(--md-sys-color-success)]" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-[var(--md-sys-color-error)]" />
          )}
          {feedback.message}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 rounded-3xl border border-[var(--md-sys-color-outline-variant)]/20 bg-[var(--md-sys-color-surface-container-low)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
                Scrum Teams
              </p>
              <h3 className="text-xl font-black text-[var(--md-sys-color-on-surface)]">
                {totalTeams}
              </h3>
            </div>
          </div>
        </Card>

        <Card className="p-4 rounded-3xl border border-[var(--md-sys-color-outline-variant)]/20 bg-[var(--md-sys-color-surface-container-low)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-secondary)] flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
                Active Member Roster
              </p>
              <h3 className="text-xl font-black text-[var(--md-sys-color-on-surface)]">
                {totalMembers}
              </h3>
            </div>
          </div>
        </Card>

        <Card className="p-4 rounded-3xl border border-[var(--md-sys-color-outline-variant)]/20 bg-[var(--md-sys-color-surface-container-low)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-tertiary)] flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
                Aggregate Sprint Hours
              </p>
              <h3 className="text-xl font-black text-[var(--md-sys-color-on-surface)]">
                {totalCapacity} hrs
              </h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-3xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/30">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="flex-1">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search teams by name, description, or project..."
              size="md"
              className="w-full"
            />
          </div>

          {/* Project Filter */}
          <div className="w-full sm:w-56 shrink-0">
            <Select
              value={selectedProjectId || 'ALL'}
              onValueChange={(val) => setSelectedProjectId(val === 'ALL' ? '' : val)}
            >
              <SelectTrigger size="md" className="h-10 rounded-2xl bg-[var(--md-sys-color-surface-container)]">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Projects</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name} ({p.key})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          variant="filled"
          size="sm"
          onClick={handleOpenCreateModal}
          className="gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create Scrum Team
        </Button>
      </div>

      {/* Teams List */}
      {loadingTeams ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-44 rounded-3xl bg-[var(--md-sys-color-surface-container-low)] animate-pulse"
            />
          ))}
        </div>
      ) : filteredTeams.length === 0 ? (
        <Card className="p-12 text-center rounded-3xl border border-[var(--md-sys-color-outline-variant)]/20 bg-[var(--md-sys-color-surface-container-low)]">
          <div className="w-12 h-12 rounded-2xl bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] mx-auto flex items-center justify-center mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
            No Scrum Teams Configured
          </h4>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1 max-w-sm mx-auto">
            Organize engineers, product owners, and scrum masters into sprint-bound delivery units
            with dedicated capacity metrics.
          </p>
          <Button
            variant="filled"
            size="sm"
            onClick={handleOpenCreateModal}
            className="mt-4 gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Create First Team
          </Button>
        </Card>
      ) : (
        <div className="space-y-5">
          {filteredTeams.map((team) => {
            const memberCount = team.members?.length || 0;
            const isAddingMember = activeAddMemberTeamId === team.id;
            const existingMemberUserIds = new Set(team.members?.map((m) => m.userId) || []);
            const availableUsers = users.filter((u) => !existingMemberUserIds.has(u.id));

            return (
              <Card
                key={team.id}
                className="p-5 rounded-3xl border border-[var(--md-sys-color-outline-variant)]/25 bg-[var(--md-sys-color-surface-container-low)] shadow-xs space-y-4"
              >
                {/* Team Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--md-sys-color-outline-variant)]/20">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                        {team.name}
                      </h3>
                      {team.project && (
                        <Badge variant="secondary" size="sm" className="gap-1 font-mono">
                          <FolderGit2 className="w-3 h-3" />
                          {team.project.name} ({team.project.key})
                        </Badge>
                      )}
                      <Badge variant="neutral" size="sm" className="gap-1 font-medium">
                        <Users className="w-3 h-3" />
                        {memberCount} {memberCount === 1 ? 'member' : 'members'}
                      </Badge>
                      <Badge variant="primary" size="sm" className="gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {team.sprintCapacityHours} hrs/sprint
                      </Badge>
                    </div>

                    {team.description && (
                      <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                        {team.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEditModal(team)}
                      className="gap-1 text-xs"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setTeamToDelete(team);
                        setDeleteModalOpen(true);
                      }}
                      className="text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)]/30 text-xs gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Team Lead Indicator */}
                <div className="flex items-center justify-between gap-2 text-xs py-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--md-sys-color-on-surface-variant)] font-semibold">
                      Team Lead:
                    </span>
                    {team.lead ? (
                      <UserIdentity
                        userId={team.lead.id}
                        user={team.lead}
                        name={team.lead.fullName || team.lead.email}
                        avatarUrl={team.lead.avatarUrl}
                        email={team.lead.email}
                        size="xs"
                        showName
                      />
                    ) : (
                      <span className="text-[var(--md-sys-color-outline)] italic">
                        No team lead assigned
                      </span>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveAddMemberTeamId(isAddingMember ? null : team.id)}
                    className="text-xs gap-1 py-1 h-7"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    {isAddingMember ? 'Close Roster Panel' : 'Add Team Member'}
                  </Button>
                </div>

                {/* Inline Add Member Form */}
                {isAddingMember && (
                  <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/30 space-y-3 animate-in fade-in duration-200">
                    <h5 className="text-xs font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5">
                      <UserPlus className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                      Enroll Team Member
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      <div className="sm:col-span-5">
                        <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                          Select User
                        </label>
                        <UserPicker
                          value={typeof memberUserId === 'number' ? memberUserId : null}
                          onChange={(userId) => setMemberUserId(userId ?? '')}
                          users={availableUsers}
                          placeholder="Search and choose coworker..."
                          allowUnassigned={false}
                          showAssignToMe={false}
                          size="sm"
                          triggerClassName="h-9"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                          Scrum Role
                        </label>
                        <Select
                          value={memberRole}
                          onValueChange={(val) => setMemberRole(val as TeamMemberRole)}
                        >
                          <SelectTrigger size="sm" className="h-9 rounded-xl bg-[var(--md-sys-color-surface-container-high)] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(ROLE_LABELS).map(([roleKey, roleTitle]) => (
                              <SelectItem key={roleKey} value={roleKey}>
                                {roleTitle}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                          Weekly Capacity (h)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={168}
                          value={memberWeeklyCapacity}
                          onChange={(e) => setMemberWeeklyCapacity(Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)]/40 focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)] font-medium"
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <Button
                          variant="filled"
                          size="sm"
                          disabled={!memberUserId || addMemberMutation.isPending}
                          isLoading={addMemberMutation.isPending}
                          onClick={() => handleAddMember(team.id)}
                          className="w-full h-8"
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Team Members Roster */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] block">
                    Team Members & Sprint Role Allocations
                  </span>

                  {team.members && team.members.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {team.members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-2.5 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/20"
                        >
                          <div className="min-w-0">
                            <UserIdentity
                              userId={member.userId}
                              user={member.user}
                              name={member.user?.fullName || member.user?.email || 'Member'}
                              avatarUrl={member.user?.avatarUrl}
                              email={member.user?.email}
                              size="sm"
                              showName
                            />
                              <div className="flex items-center gap-1.5 mt-1 ml-9">
                                <Badge
                                  variant={ROLE_BADGE_VARIANTS[member.role] || 'neutral'}
                                  size="sm"
                                  className="text-[10px] py-0 px-1.5"
                                >
                                  {ROLE_LABELS[member.role] || member.role}
                                </Badge>
                                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-mono">
                                  {member.weeklyCapacityHours}h/w
                                </span>
                              </div>
                            </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveMember(team.id, member.id)}
                            className="p-1.5 rounded-lg text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)]/30 transition-colors"
                            title="Remove member from team"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-[var(--md-sys-color-surface-container)]/50 text-xs text-[var(--md-sys-color-on-surface-variant)] text-center">
                      No team members assigned yet. Click "Add Team Member" to enroll engineers.
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Team Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Scrum Team"
        description="Establish a dedicated cross-functional Scrum delivery team linked to a project"
      >
        <form onSubmit={handleCreateTeam} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
              Team Name *
            </label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Core Engine Team"
              className="w-full px-3.5 py-2.5 text-xs rounded-2xl bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)]/40 focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)] font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
              Description
            </label>
            <Textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Brief description of the team's focus and charter..."
              className="w-full text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                Associated Project *
              </label>
              <Select
                value={newProjectId ? String(newProjectId) : ''}
                onValueChange={(val) => setNewProjectId(Number(val))}
              >
                <SelectTrigger size="sm" className="h-10 rounded-xl bg-[var(--md-sys-color-surface-container)] text-xs">
                  <SelectValue placeholder="Select project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name} ({p.key})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                Team Lead (Optional)
              </label>
              <UserPicker
                value={newLeadId || null}
                onChange={(userId) => setNewLeadId(userId || undefined)}
                users={users}
                placeholder="Search and select team lead..."
                allowUnassigned
                showAssignToMe={false}
                size="sm"
                triggerClassName="h-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
              Default Sprint Capacity (Hours)
            </label>
            <input
              type="number"
              min={0}
              max={1000}
              value={newSprintCapacity}
              onChange={(e) => setNewSprintCapacity(Number(e.target.value))}
              placeholder="80"
              className="w-full px-3.5 py-2.5 text-xs rounded-2xl bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)]/40 focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)] font-medium"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--md-sys-color-outline-variant)]/20">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="filled"
              size="sm"
              isLoading={createTeamMutation.isPending}
              disabled={!newName.trim() || !newProjectId}
            >
              Create Team
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Team Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setTeamToEdit(null);
        }}
        title="Edit Scrum Team"
        description="Update team configuration, sprint capacity metrics, or designated lead"
      >
        <form onSubmit={handleUpdateTeam} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
              Team Name *
            </label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-2xl bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)]/40 focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)] font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
              Description
            </label>
            <Textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder="Brief description of the team's focus and charter..."
              className="w-full text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                Team Lead (Optional)
              </label>
              <UserPicker
                value={editLeadId || null}
                onChange={(userId) => setEditLeadId(userId || undefined)}
                users={users}
                placeholder="Search and select team lead..."
                allowUnassigned
                showAssignToMe={false}
                size="sm"
                triggerClassName="h-10"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                Sprint Capacity (Hours)
              </label>
              <input
                type="number"
                min={0}
                max={1000}
                value={editSprintCapacity}
                onChange={(e) => setEditSprintCapacity(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-xs rounded-2xl bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)]/40 focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)] font-medium"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--md-sys-color-outline-variant)]/20">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEditModalOpen(false);
                setTeamToEdit(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="filled"
              size="sm"
              isLoading={updateTeamMutation.isPending}
              disabled={!editName.trim()}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setTeamToDelete(null);
        }}
        onConfirm={handleDeleteTeam}
        title="Delete Scrum Team"
        description={
          teamToDelete
            ? `Are you sure you want to remove team "${teamToDelete.name}"? All member assignments will be revoked. This action cannot be undone.`
            : 'Are you sure you want to remove this team?'
        }
        confirmLabel="Delete Team"
        isLoading={deleteTeamMutation.isPending}
      />
    </div>
  );
};
