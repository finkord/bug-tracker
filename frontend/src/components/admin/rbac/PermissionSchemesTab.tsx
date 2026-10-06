import React, { useState, useTransition } from 'react';
import {
  KeyRound,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Check,
  Users,
  Loader2,
} from 'lucide-react';
import type { PermissionSchemeItem, PermissionGrantItem } from '../../../api/client';
import {
  useCreatePermissionSchemeMutation,
  useDeletePermissionSchemeMutation,
  useAddPermissionGrantMutation,
  useRemovePermissionGrantMutation,
  useProjectRolesQuery,
  useGroupsQuery,
} from '../../../api/queries';
import {
  Badge,
  Button,
  Card,
  Modal,
  Input,
  Select,
  SelectGroup,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectLabel,
  SelectItem,
  ConfirmDialog,
} from '../../ui';

interface PermissionSchemesTabProps {
  readonly permissionSchemes: PermissionSchemeItem[];
}

interface PermissionDef {
  key: string;
  label: string;
  description: string;
}

interface PermissionCategory {
  category: string;
  permissions: PermissionDef[];
}

const PERMISSION_GROUPS: PermissionCategory[] = [
  {
    category: 'Project Governance',
    permissions: [
      { key: 'BROWSE_PROJECTS', label: 'Browse Projects', description: 'View project metadata, board, and overview' },
      { key: 'ADMINISTER_PROJECTS', label: 'Administer Projects', description: 'Configure project settings, components, and workflows' },
      { key: 'VIEW_ROADMAP', label: 'View Roadmap', description: 'Access project Gantt timeline and epic hierarchies' },
    ],
  },
  {
    category: 'Issue Operations',
    permissions: [
      { key: 'CREATE_ISSUES', label: 'Create Issues', description: 'File new bugs, tasks, and stories' },
      { key: 'EDIT_ISSUES', label: 'Edit Issues', description: 'Modify issue summary, description, and custom fields' },
      { key: 'ASSIGN_ISSUES', label: 'Assign Issues', description: 'Assign issues to team members' },
      { key: 'ASSIGNABLE_USER', label: 'Assignable User', description: 'Allows user to appear in assignee picker' },
      { key: 'DELETE_ISSUES', label: 'Delete Issues', description: 'Permanently remove issues from project' },
      { key: 'MOVE_ISSUES', label: 'Move Issues', description: 'Transfer issues between projects or issue types' },
      { key: 'CLOSE_ISSUES', label: 'Close Issues', description: 'Mark issues as resolved, closed, or cancelled' },
      { key: 'TRANSITION_ISSUES', label: 'Transition Issues', description: 'Move issues through workflow status stages' },
    ],
  },
  {
    category: 'Comments',
    permissions: [
      { key: 'ADD_COMMENTS', label: 'Add Comments', description: 'Post discussion notes on issues' },
      { key: 'EDIT_OWN_COMMENTS', label: 'Edit Own Comments', description: 'Modify previously posted comments created by self' },
      { key: 'EDIT_ALL_COMMENTS', label: 'Edit All Comments', description: 'Modify comments posted by any project member' },
      { key: 'DELETE_OWN_COMMENTS', label: 'Delete Own Comments', description: 'Delete comments created by self' },
      { key: 'DELETE_ALL_COMMENTS', label: 'Delete All Comments', description: 'Delete comments created by any member' },
    ],
  },
  {
    category: 'Time Tracking & Worklogs',
    permissions: [
      { key: 'LOG_WORK', label: 'Log Work Hours', description: 'Record logged hours and progress against estimates' },
      { key: 'EDIT_OWN_WORKLOGS', label: 'Edit Own Worklogs', description: 'Modify own logged time entries' },
      { key: 'EDIT_ALL_WORKLOGS', label: 'Edit All Worklogs', description: 'Modify time entries logged by any user' },
      { key: 'DELETE_OWN_WORKLOGS', label: 'Delete Own Worklogs', description: 'Delete own logged time entries' },
      { key: 'DELETE_ALL_WORKLOGS', label: 'Delete All Worklogs', description: 'Delete time entries logged by any user' },
    ],
  },
  {
    category: 'Attachments',
    permissions: [
      { key: 'CREATE_ATTACHMENTS', label: 'Upload Attachments', description: 'Attach screenshots, logs, and specification files' },
      { key: 'DELETE_OWN_ATTACHMENTS', label: 'Delete Own Attachments', description: 'Delete attachments uploaded by self' },
      { key: 'DELETE_ALL_ATTACHMENTS', label: 'Delete All Attachments', description: 'Delete attachments uploaded by any member' },
    ],
  },
];

type DynamicActorType = 'LEAD' | 'REPORTER' | 'ASSIGNEE' | 'ANY_LOGGED_IN';

const DYNAMIC_ACTORS: Array<{ type: DynamicActorType; label: string }> = [
  { type: 'LEAD', label: 'Project Lead' },
  { type: 'REPORTER', label: 'Reporter' },
  { type: 'ASSIGNEE', label: 'Assignee' },
  { type: 'ANY_LOGGED_IN', label: 'Any Logged In' },
];

export const PermissionSchemesTab: React.FC<PermissionSchemesTabProps> = ({
  permissionSchemes,
}) => {
  const [, startTransition] = useTransition();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newSchemeName, setNewSchemeName] = useState('');
  const [newSchemeDesc, setNewSchemeDesc] = useState('');

  // Selected scheme tab
  const [activeSchemeId, setActiveSchemeId] = useState<number>(() => {
    return permissionSchemes[0]?.id || 1;
  });

  // Add specific directory group grant modal
  const [addGrantModalOpen, setAddGrantModalOpen] = useState(false);
  const [targetSchemeId, setTargetSchemeId] = useState<number | null>(null);
  const [targetPermission, setTargetPermission] = useState('BROWSE_PROJECTS');
  const [targetGroupId, setTargetGroupId] = useState<number | ''>('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [pendingGrantKeys, setPendingGrantKeys] = useState<Set<string>>(new Set());

  const { data: roles = [] } = useProjectRolesQuery();
  const { data: groups = [] } = useGroupsQuery();

  const createSchemeMutation = useCreatePermissionSchemeMutation();
  const deleteSchemeMutation = useDeletePermissionSchemeMutation();
  const addGrantMutation = useAddPermissionGrantMutation();
  const removeGrantMutation = useRemovePermissionGrantMutation();

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [schemeToDelete, setSchemeToDelete] = useState<PermissionSchemeItem | null>(null);

  // Sync activeSchemeId when permissionSchemes update
  const currentScheme = permissionSchemes.find((s) => s.id === activeSchemeId) || permissionSchemes[0] || null;

  const handleCreateScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchemeName.trim()) return;

    setErrorMsg(null);
    try {
      const created = await createSchemeMutation.mutateAsync({
        name: newSchemeName.trim(),
        description: newSchemeDesc.trim() || undefined,
      });
      setSuccessMsg(`Permission Scheme "${newSchemeName.trim()}" created successfully.`);
      setNewSchemeName('');
      setNewSchemeDesc('');
      setCreateModalOpen(false);
      setActiveSchemeId(created.id);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create permission scheme');
    }
  };

  const handleDeleteScheme = async () => {
    if (!schemeToDelete) return;

    setErrorMsg(null);
    try {
      await deleteSchemeMutation.mutateAsync(schemeToDelete.id);
      setSuccessMsg(`Permission Scheme "${schemeToDelete.name}" deleted successfully.`);
      setDeleteConfirmOpen(false);
      setSchemeToDelete(null);
      if (activeSchemeId === schemeToDelete.id) {
        const remaining = permissionSchemes.filter((s) => s.id !== schemeToDelete.id);
        if (remaining.length > 0) {
          setActiveSchemeId(remaining[0].id);
        }
      }
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete permission scheme');
    }
  };

  // Helper to find existing grant in current scheme
  const findGrant = (
    scheme: PermissionSchemeItem,
    permKey: string,
    grantType: string,
    roleId?: number | null,
    groupId?: number | null,
  ): PermissionGrantItem | undefined => {
    return scheme.grants?.find((g) => {
      if (g.permission !== permKey || g.grantType !== grantType) return false;
      if (grantType === 'ROLE') return g.roleId === roleId;
      if (grantType === 'GROUP') return g.groupId === groupId;
      return true;
    });
  };

  // Interactive toggle for matrix cells
  const handleToggleCell = async (
    schemeId: number,
    permKey: string,
    grantType: 'ROLE' | DynamicActorType,
    roleId?: number,
  ) => {
    if (!currentScheme) return;

    const opKey = `${schemeId}-${permKey}-${grantType}-${roleId || ''}`;
    if (pendingGrantKeys.has(opKey)) return;

    const existing = findGrant(currentScheme, permKey, grantType, roleId);

    setPendingGrantKeys((prev) => new Set(prev).add(opKey));
    setErrorMsg(null);

    try {
      if (existing) {
        await removeGrantMutation.mutateAsync({ schemeId, grantId: existing.id });
      } else {
        await addGrantMutation.mutateAsync({
          schemeId,
          payload: {
            permission: permKey,
            grantType,
            roleId: grantType === 'ROLE' ? roleId : undefined,
          },
        });
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update grant');
    } finally {
      setPendingGrantKeys((prev) => {
        const next = new Set(prev);
        next.delete(opKey);
        return next;
      });
    }
  };

  const handleOpenAddCustomGrant = (schemeId: number, permKey = 'BROWSE_PROJECTS') => {
    setTargetSchemeId(schemeId);
    setTargetPermission(permKey);
    setTargetGroupId(groups[0]?.id || '');
    setAddGrantModalOpen(true);
  };

  const handleAddCustomGrantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSchemeId) return;

    if (!targetGroupId) {
      setErrorMsg('Please select a directory group');
      return;
    }

    setErrorMsg(null);
    try {
      await addGrantMutation.mutateAsync({
        schemeId: targetSchemeId,
        payload: {
          permission: targetPermission,
          grantType: 'GROUP',
          groupId: Number(targetGroupId),
        },
      });
      setSuccessMsg('Directory group grant successfully added.');
      setAddGrantModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to add permission grant');
    }
  };

  const handleRemoveGrantById = async (schemeId: number, grantId: number) => {
    setErrorMsg(null);
    try {
      await removeGrantMutation.mutateAsync({ schemeId, grantId });
      setSuccessMsg('Permission grant removed.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to remove grant');
    }
  };

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-200">
      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[var(--md-sys-color-success)]" />
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            className="text-xs font-bold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[var(--md-sys-color-error)]" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-xs font-bold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-[var(--md-sys-color-on-surface)]">
            Reusable Permission Schemes
          </h2>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
            Configure permission grant matrices with single-click interactive toggles across project roles and dynamic actors.
          </p>
        </div>

        <Button
          variant="filled"
          size="sm"
          onClick={() => setCreateModalOpen(true)}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Create Scheme
        </Button>
      </div>

      {/* Scheme Quick Switcher Tabs */}
      {permissionSchemes.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-[var(--md-sys-color-outline-variant)]/20">
          {permissionSchemes.map((s) => {
            const isSelected = (currentScheme?.id ?? 0) === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => startTransition(() => setActiveSchemeId(s.id))}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${isSelected
                    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xs'
                    : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                  }`}
              >
                <span>{s.name}</span>
                {s.isDefault && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full uppercase tracking-wider font-bold ${isSelected
                      ? 'bg-[var(--md-sys-color-on-primary)]/25 text-[var(--md-sys-color-on-primary)]'
                      : 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)]'
                    }`}>
                    Default
                  </span>
                )}
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isSelected
                    ? 'bg-[var(--md-sys-color-on-primary)]/20 text-[var(--md-sys-color-on-primary)]'
                    : 'bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-outline)]'
                  }`}>
                  {s.grants?.length || 0}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Active Scheme Matrix View */}
      {currentScheme ? (
        <Card
          variant="filled"
          padding="lg"
          rounded="3xl"
          className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 space-y-6 shadow-xs"
        >
          {/* Scheme Meta Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--md-sys-color-outline-variant)]/20 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-[var(--md-sys-color-on-surface)]">
                  {currentScheme.name}
                </h3>
                {currentScheme.isDefault && (
                  <Badge variant="primary" size="sm">DEFAULT SCHEME</Badge>
                )}
                <span className="text-[10px] text-[var(--md-sys-color-outline)] font-mono">
                  ID #{currentScheme.id}
                </span>
              </div>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">
                {currentScheme.description || 'Custom permission scheme matrix.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {!currentScheme.isDefault && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSchemeToDelete(currentScheme);
                    setDeleteConfirmOpen(true);
                  }}
                  leftIcon={<Trash2 className="w-3.5 h-3.5 text-[var(--md-sys-color-error)]" />}
                  className="text-[var(--md-sys-color-error)] border-[var(--md-sys-color-error)]/40 hover:bg-[var(--md-sys-color-error-container)]"
                >
                  Delete Scheme
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenAddCustomGrant(currentScheme.id)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Directory Group Grant
              </Button>
            </div>
          </div>

          {/* Interactive Permission Matrix Grid */}
          <div className="overflow-x-auto rounded-2xl border border-[var(--md-sys-color-outline-variant)]/25 bg-[var(--md-sys-color-surface)]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--md-sys-color-outline-variant)]/20 bg-[var(--md-sys-color-surface-container)] text-xs font-bold text-[var(--md-sys-color-on-surface)]">
                  <th className="py-3 px-4 min-w-[240px] align-middle">
                    <div className="flex flex-col items-start justify-center gap-0.5">
                      <span className="font-bold text-[11px] leading-tight">Permission Action</span>
                      <span className="text-[9px] font-normal text-[var(--md-sys-color-outline)]">Operation Key</span>
                    </div>
                  </th>

                  {/* Project Role Columns */}
                  {roles.map((role) => (
                    <th
                      key={role.id}
                      className="py-3 px-3 text-center min-w-[110px] border-l border-[var(--md-sys-color-outline-variant)]/15 align-middle"
                    >
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <span className="font-bold text-[11px] leading-tight">{role.name}</span>
                        <span className="text-[9px] font-normal text-[var(--md-sys-color-outline)]">Project Role</span>
                      </div>
                    </th>
                  ))}

                  {/* Dynamic Actor Columns */}
                  {DYNAMIC_ACTORS.map((actor) => (
                    <th
                      key={actor.type}
                      className="py-3 px-3 text-center min-w-[105px] border-l border-[var(--md-sys-color-outline-variant)]/15 align-middle"
                    >
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <span className="font-bold text-[11px] leading-tight text-center">{actor.label}</span>
                        <span className="text-[9px] font-normal text-[var(--md-sys-color-outline)]">Dynamic</span>
                      </div>
                    </th>
                  ))}

                  {/* Directory Groups Column */}
                  <th className="py-3 px-4 min-w-[200px] border-l border-[var(--md-sys-color-outline-variant)]/15 align-middle">
                    <div className="flex flex-col items-start justify-center gap-0.5">
                      <span className="font-bold text-[11px] leading-tight">Directory Groups</span>
                      <span className="text-[9px] font-normal text-[var(--md-sys-color-outline)]">Group Membership</span>
                    </div>
                  </th>
                </tr>
              </thead>

              <tbody>
                {PERMISSION_GROUPS.map((categoryGroup) => (
                  <React.Fragment key={categoryGroup.category}>
                    {/* Category Divider Header */}
                    <tr className="bg-[var(--md-sys-color-surface-container-high)]/60 border-y border-[var(--md-sys-color-outline-variant)]/30">
                      <td
                        colSpan={1 + roles.length + DYNAMIC_ACTORS.length + 1}
                        className="py-2 px-4 text-xs font-black uppercase tracking-wider text-[var(--md-sys-color-primary)]"
                      >
                        <div className="flex items-center gap-2">
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>{categoryGroup.category}</span>
                        </div>
                      </td>
                    </tr>

                    {/* Permission Rows */}
                    {categoryGroup.permissions.map((perm) => {
                      // Directory group grants for this specific permission
                      const customGrants = (currentScheme.grants || []).filter(
                        (g) => g.permission === perm.key && g.grantType === 'GROUP',
                      );

                      return (
                        <tr
                          key={perm.key}
                          className="border-b border-[var(--md-sys-color-outline-variant)]/15 hover:bg-[var(--md-sys-color-surface-container-low)] transition-colors"
                        >
                          {/* Permission Title & Key */}
                          <td className="py-3 px-4 align-middle">
                            <div className="space-y-0.5">
                              <div className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
                                {perm.label}
                              </div>
                              <div className="text-[10px] font-mono text-[var(--md-sys-color-outline)]">
                                {perm.key}
                              </div>
                              <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] leading-tight">
                                {perm.description}
                              </div>
                            </div>
                          </td>

                          {/* Role Toggle Cells */}
                          {roles.map((role) => {
                            const isGranted = Boolean(
                              findGrant(currentScheme, perm.key, 'ROLE', role.id),
                            );
                            const opKey = `${currentScheme.id}-${perm.key}-ROLE-${role.id}`;
                            const isPending = pendingGrantKeys.has(opKey);

                            return (
                              <td
                                key={role.id}
                                className="py-2.5 px-3 text-center align-middle border-l border-[var(--md-sys-color-outline-variant)]/15"
                              >
                                <button
                                  type="button"
                                  onClick={() => handleToggleCell(currentScheme.id, perm.key, 'ROLE', role.id)}
                                  disabled={isPending}
                                  title={
                                    isGranted
                                      ? `Revoke ${perm.label} from ${role.name}`
                                      : `Grant ${perm.label} to ${role.name}`
                                  }
                                  className={`inline-flex items-center justify-center w-8 h-8 rounded-xl transition-all cursor-pointer border ${isGranted
                                      ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] border-[var(--md-sys-color-primary)] shadow-2xs hover:opacity-90'
                                      : 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-outline-variant)] border-[var(--md-sys-color-outline-variant)]/40 hover:border-[var(--md-sys-color-primary)] hover:text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                                    }`}
                                >
                                  {isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-current" />
                                  ) : isGranted ? (
                                    <Check className="w-4 h-4 stroke-[3]" />
                                  ) : (
                                    <span className="text-xs opacity-0 hover:opacity-100 font-bold">+</span>
                                  )}
                                </button>
                              </td>
                            );
                          })}

                          {/* Dynamic Actor Toggle Cells */}
                          {DYNAMIC_ACTORS.map((actor) => {
                            const isGranted = Boolean(
                              findGrant(currentScheme, perm.key, actor.type),
                            );
                            const opKey = `${currentScheme.id}-${perm.key}-${actor.type}-`;
                            const isPending = pendingGrantKeys.has(opKey);

                            return (
                              <td
                                key={actor.type}
                                className="py-2.5 px-3 text-center align-middle border-l border-[var(--md-sys-color-outline-variant)]/15"
                              >
                                <button
                                  type="button"
                                  onClick={() => handleToggleCell(currentScheme.id, perm.key, actor.type)}
                                  disabled={isPending}
                                  title={
                                    isGranted
                                      ? `Revoke ${perm.label} from ${actor.label}`
                                      : `Grant ${perm.label} to ${actor.label}`
                                  }
                                  className={`inline-flex items-center justify-center w-8 h-8 rounded-xl transition-all cursor-pointer border ${isGranted
                                      ? 'bg-[var(--md-sys-color-secondary)] text-[var(--md-sys-color-on-secondary)] border-[var(--md-sys-color-secondary)] shadow-2xs hover:opacity-90'
                                      : 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-outline-variant)] border-[var(--md-sys-color-outline-variant)]/40 hover:border-[var(--md-sys-color-secondary)] hover:text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                                    }`}
                                >
                                  {isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-current" />
                                  ) : isGranted ? (
                                    <Check className="w-4 h-4 stroke-[3]" />
                                  ) : (
                                    <span className="text-xs opacity-0 hover:opacity-100 font-bold">+</span>
                                  )}
                                </button>
                              </td>
                            );
                          })}

                          {/* Directory Groups & Other Grants Column */}
                          <td className="py-2.5 px-4 align-middle border-l border-[var(--md-sys-color-outline-variant)]/15">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {customGrants.map((cg) => (
                                <span
                                  key={cg.id}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]/30 text-[10px] font-semibold text-[var(--md-sys-color-on-surface)]"
                                >
                                  <Users className="w-2.5 h-2.5 text-[var(--md-sys-color-primary)]" />
                                  <span>{cg.group?.name || cg.grantType}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveGrantById(currentScheme.id, cg.id)}
                                    className="ml-0.5 text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-error)] cursor-pointer"
                                    title="Revoke group grant"
                                  >
                                    x
                                  </button>
                                </span>
                              ))}

                              <button
                                type="button"
                                onClick={() => handleOpenAddCustomGrant(currentScheme.id, perm.key)}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg border border-dashed border-[var(--md-sys-color-outline-variant)]/50 text-[10px] text-[var(--md-sys-color-on-surface-variant)] hover:border-[var(--md-sys-color-primary)] hover:text-[var(--md-sys-color-primary)] cursor-pointer"
                                title="Add Directory Group grant"
                              >
                                <Plus className="w-2.5 h-2.5" />
                                <span>Group</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="text-center py-12 text-xs text-[var(--md-sys-color-on-surface-variant)] border border-dashed border-[var(--md-sys-color-outline-variant)]/30 rounded-3xl">
          No permission schemes configured. Click &quot;Create Scheme&quot; above to establish an access matrix.
        </div>
      )}

      {/* Create Permission Scheme Modal */}
      {createModalOpen && (
        <Modal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Create New Permission Scheme"
          description="Define a reusable permission matrix for software project spaces"
          size="md"
        >
          <form onSubmit={handleCreateScheme} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase mb-1">
                Scheme Name
              </label>
              <Input
                value={newSchemeName}
                onChange={(e) => setNewSchemeName(e.target.value)}
                placeholder="e.g. Restricted Compliance Scheme"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase mb-1">
                Description
              </label>
              <Input
                value={newSchemeDesc}
                onChange={(e) => setNewSchemeDesc(e.target.value)}
                placeholder="Target environments, governance policies, and scope..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--md-sys-color-outline-variant)]/20">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCreateModalOpen(false)}
                disabled={createSchemeMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="filled"
                size="sm"
                disabled={createSchemeMutation.isPending || !newSchemeName.trim()}
                isLoading={createSchemeMutation.isPending}
              >
                Create Scheme
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Directory Group Grant Modal */}
      {addGrantModalOpen && targetSchemeId && (
        <Modal
          isOpen={addGrantModalOpen}
          onClose={() => setAddGrantModalOpen(false)}
          title="Grant to Directory Group"
          description="Authorize a Directory Group for a specific permission action."
          size="md"
        >
          <form onSubmit={handleAddCustomGrantSubmit} className="space-y-4">
            {/* Permission Selector */}
            <div>
              <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase mb-1">
                Permission Action
              </label>
              <Select value={targetPermission} onValueChange={setTargetPermission}>
                <SelectTrigger className="h-10 text-xs rounded-xl bg-[var(--md-sys-color-surface)] font-mono">
                  <SelectValue placeholder="Select permission action..." />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {PERMISSION_GROUPS.map((group) => (
                    <SelectGroup key={group.category}>
                      <SelectLabel>{group.category}</SelectLabel>
                      {group.permissions.map((p) => (
                        <SelectItem key={p.key} value={p.key} className="text-xs">
                          <span className="font-sans font-medium">{p.label}</span>{' '}
                          <span className="font-mono text-[10px] text-[var(--md-sys-color-outline)]">({p.key})</span>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Target Directory Group */}
            <div>
              <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase mb-1">
                Target Directory Group
              </label>
              <Select
                value={targetGroupId ? String(targetGroupId) : ''}
                onValueChange={(val) => setTargetGroupId(val ? Number(val) : '')}
              >
                <SelectTrigger className="h-10 text-xs rounded-xl bg-[var(--md-sys-color-surface)]">
                  <SelectValue placeholder="Select directory group..." />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--md-sys-color-outline-variant)]/20">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setAddGrantModalOpen(false)}
                disabled={addGrantMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="filled"
                size="sm"
                disabled={addGrantMutation.isPending || !targetGroupId}
                isLoading={addGrantMutation.isPending}
              >
                Authorize Group
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmOpen && schemeToDelete && (
        <ConfirmDialog
          isOpen={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          onConfirm={handleDeleteScheme}
          title={`Delete Permission Scheme "${schemeToDelete.name}"?`}
          description="Are you sure you want to permanently delete this scheme? Projects bound to this scheme will lose their custom permission matrices."
          confirmLabel="Delete Scheme"
          cancelLabel="Keep Scheme"
          variant="danger"
          isLoading={deleteSchemeMutation.isPending}
        />
      )}
    </div>
  );
};
