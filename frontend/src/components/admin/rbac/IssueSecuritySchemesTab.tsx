import React, { useState, useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Shield,
  Users,
  Star,
  X,
} from 'lucide-react';
import type { IssueSecuritySchemeItem, IssueSecurityLevelItem } from '../../../api/client';
import {
  useCreateSecuritySchemeMutation,
  useDeleteSecuritySchemeMutation,
  useAddSecurityLevelMutation,
  useDeleteSecurityLevelMutation,
  useSetDefaultSecurityLevelMutation,
  useAddSecurityGrantMutation,
  useDeleteSecurityGrantMutation,
  useProjectRolesQuery,
  useGroupsQuery,
} from '../../../api/queries';
import {
  Card,
  DataTable,
  Badge,
  Button,
  Modal,
  Input,
  Textarea,
  ConfirmDialog,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../ui';

interface IssueSecuritySchemesTabProps {
  readonly securitySchemes: IssueSecuritySchemeItem[];
}

interface SchemeLevelsTableProps {
  scheme: IssueSecuritySchemeItem;
  onSetDefaultLevel: (schemeId: number, levelId: number) => void;
  onDeleteLevel: (schemeId: number, level: IssueSecurityLevelItem) => void;
  onOpenAddGrant: (schemeId: number, levelId: number) => void;
  onDeleteGrant: (grantId: number) => void;
}

const SchemeLevelsTable: React.FC<SchemeLevelsTableProps> = ({
  scheme,
  onSetDefaultLevel,
  onDeleteLevel,
  onOpenAddGrant,
  onDeleteGrant,
}) => {
  const columns = useMemo<ColumnDef<IssueSecurityLevelItem>[]>(() => [
    {
      id: 'name',
      header: 'Security Level',
      cell: ({ row }) => {
        const lvl = row.original;
        const isDefault = scheme.defaultLevelId === lvl.id;
        return (
          <div className="flex flex-col min-w-0 py-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-[var(--md-sys-color-on-surface)]">
                {lvl.name}
              </span>
              {isDefault && (
                <Badge variant="primary" size="sm" className="text-[9px] px-1.5 py-0">
                  DEFAULT LEVEL
                </Badge>
              )}
            </div>
            {lvl.description && (
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5 max-w-sm line-clamp-1">
                {lvl.description}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: 'grants',
      header: 'Users / Groups / Project Roles',
      cell: ({ row }) => {
        const lvl = row.original;
        return (
          <div className="flex flex-wrap items-center gap-1.5 py-1">
            {(!lvl.grants || lvl.grants.length === 0) ? (
              <span className="text-[11px] text-[var(--md-sys-color-outline)] italic mr-1">
                No actors granted
              </span>
            ) : (
              lvl.grants.map((g) => (
                <span
                  key={g.id}
                  className="text-[10px] pl-2 pr-1.5 py-0.5 rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] font-medium border border-[var(--md-sys-color-outline-variant)]/30 flex items-center gap-1"
                >
                  {g.grantType === 'ROLE' ? (
                    <>
                      <Shield className="w-2.5 h-2.5 text-[var(--md-sys-color-primary)]" />
                      <span>Role: {g.role?.name || `Role #${g.roleId}`}</span>
                    </>
                  ) : (
                    <>
                      <Users className="w-2.5 h-2.5 text-[var(--md-sys-color-secondary)]" />
                      <span>Group: {g.group?.name || `Group #${g.groupId}`}</span>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => onDeleteGrant(g.id)}
                    className="w-3.5 h-3.5 rounded-full hover:bg-[var(--md-sys-color-error-container)] hover:text-[var(--md-sys-color-error)] flex items-center justify-center cursor-pointer text-[var(--md-sys-color-outline)] ml-0.5"
                    title="Revoke actor access"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenAddGrant(scheme.id, lvl.id)}
              className="h-6 px-2 text-[10px] text-[var(--md-sys-color-primary)] font-bold gap-1"
            >
              <Plus className="w-2.5 h-2.5" />
              Grant Actor
            </Button>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const lvl = row.original;
        const isDefault = scheme.defaultLevelId === lvl.id;
        return (
          <div className="flex items-center justify-start gap-1.5">
            {!isDefault ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSetDefaultLevel(scheme.id, lvl.id)}
                className="h-6 px-2 text-[10px] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] font-bold"
                title="Set as Default Security Level for new issues"
              >
                <Star className="w-3 h-3 mr-1" />
                Make Default
              </Button>
            ) : (
              <span className="text-[10px] text-[var(--md-sys-color-outline)] font-medium px-2">
                Default
              </span>
            )}
            {!isDefault && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteLevel(scheme.id, lvl)}
                className="h-6 w-6 p-0 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-error)]"
                title="Delete Security Level"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        );
      },
    },
  ], [scheme.id, scheme.defaultLevelId, onDeleteGrant, onDeleteLevel, onOpenAddGrant, onSetDefaultLevel]);

  return (
    <DataTable<IssueSecurityLevelItem>
      data={scheme.levels || []}
      columns={columns}
      getRowId={(row) => String(row.id)}
      emptyTitle="No Security Levels"
      emptyDescription="No security levels have been configured for this scheme yet."
      pageSize={10}
    />
  );
};

export const IssueSecuritySchemesTab: React.FC<IssueSecuritySchemesTabProps> = ({
  securitySchemes,
}) => {
  // Scheme Creation State
  const [createSchemeModalOpen, setCreateSchemeModalOpen] = useState(false);
  const [schemeName, setSchemeName] = useState('');
  const [schemeDescription, setSchemeDescription] = useState('');

  // Scheme Deletion State
  const [deleteSchemeConfirmOpen, setDeleteSchemeConfirmOpen] = useState(false);
  const [schemeToDelete, setSchemeToDelete] = useState<IssueSecuritySchemeItem | null>(null);

  // Add Level State
  const [addLevelModalOpen, setAddLevelModalOpen] = useState(false);
  const [targetSchemeForLevel, setTargetSchemeForLevel] = useState<IssueSecuritySchemeItem | null>(null);
  const [levelName, setLevelName] = useState('');
  const [levelDesc, setLevelDesc] = useState('');

  // Delete Level State
  const [deleteLevelConfirmOpen, setDeleteLevelConfirmOpen] = useState(false);
  const [levelToDelete, setLevelToDelete] = useState<{ schemeId: number; level: IssueSecurityLevelItem } | null>(null);

  // Add Actor Grant State
  const [addGrantModalOpen, setAddGrantModalOpen] = useState(false);
  const [targetLevelForGrant, setTargetLevelForGrant] = useState<{ schemeId: number; levelId: number } | null>(null);
  const [grantType, setGrantType] = useState<'ROLE' | 'GROUP'>('ROLE');
  const [selectedRoleId, setSelectedRoleId] = useState<number | ''>('');
  const [selectedGroupId, setSelectedGroupId] = useState<number | ''>('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { data: roles = [] } = useProjectRolesQuery();
  const { data: groups = [] } = useGroupsQuery();

  const createSchemeMutation = useCreateSecuritySchemeMutation();
  const deleteSchemeMutation = useDeleteSecuritySchemeMutation();
  const addLevelMutation = useAddSecurityLevelMutation();
  const deleteLevelMutation = useDeleteSecurityLevelMutation();
  const setDefaultLevelMutation = useSetDefaultSecurityLevelMutation();
  const addGrantMutation = useAddSecurityGrantMutation();
  const deleteGrantMutation = useDeleteSecurityGrantMutation();

  const handleCreateSchemeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schemeName.trim()) return;

    setErrorMsg(null);
    try {
      await createSchemeMutation.mutateAsync({
        name: schemeName.trim(),
        description: schemeDescription.trim() || undefined,
      });
      setSuccessMsg(`Issue Security Scheme "${schemeName.trim()}" created successfully.`);
      setSchemeName('');
      setSchemeDescription('');
      setCreateSchemeModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create security scheme');
    }
  };

  const handleDeleteSchemeSubmit = async () => {
    if (!schemeToDelete) return;

    setErrorMsg(null);
    try {
      await deleteSchemeMutation.mutateAsync(schemeToDelete.id);
      setSuccessMsg(`Issue Security Scheme "${schemeToDelete.name}" deleted successfully.`);
      setDeleteSchemeConfirmOpen(false);
      setSchemeToDelete(null);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete security scheme');
    }
  };

  const handleOpenAddLevel = (scheme: IssueSecuritySchemeItem) => {
    setTargetSchemeForLevel(scheme);
    setLevelName('');
    setLevelDesc('');
    setAddLevelModalOpen(true);
  };

  const handleAddLevelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSchemeForLevel || !levelName.trim()) return;

    setErrorMsg(null);
    try {
      await addLevelMutation.mutateAsync({
        schemeId: targetSchemeForLevel.id,
        payload: {
          name: levelName.trim(),
          description: levelDesc.trim() || undefined,
        },
      });
      setSuccessMsg(`Security level "${levelName.trim()}" added successfully.`);
      setAddLevelModalOpen(false);
      setLevelName('');
      setLevelDesc('');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to add security level');
    }
  };

  const handleDeleteLevelSubmit = async () => {
    if (!levelToDelete) return;

    setErrorMsg(null);
    try {
      await deleteLevelMutation.mutateAsync({
        schemeId: levelToDelete.schemeId,
        levelId: levelToDelete.level.id,
      });
      setSuccessMsg(`Security level "${levelToDelete.level.name}" deleted successfully.`);
      setDeleteLevelConfirmOpen(false);
      setLevelToDelete(null);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete security level');
    }
  };

  const handleSetDefaultLevel = async (schemeId: number, levelId: number) => {
    setErrorMsg(null);
    try {
      await setDefaultLevelMutation.mutateAsync({
        schemeId,
        defaultLevelId: levelId,
      });
      setSuccessMsg('Default security level updated.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to set default security level');
    }
  };

  const handleOpenAddGrant = (schemeId: number, levelId: number) => {
    setTargetLevelForGrant({ schemeId, levelId });
    setGrantType('ROLE');
    setSelectedRoleId(roles[0]?.id || '');
    setSelectedGroupId(groups[0]?.id || '');
    setAddGrantModalOpen(true);
  };

  const handleAddGrantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetLevelForGrant) return;

    if (grantType === 'ROLE' && !selectedRoleId) {
      setErrorMsg('Please select a project role');
      return;
    }
    if (grantType === 'GROUP' && !selectedGroupId) {
      setErrorMsg('Please select a directory group');
      return;
    }

    setErrorMsg(null);
    try {
      await addGrantMutation.mutateAsync({
        schemeId: targetLevelForGrant.schemeId,
        levelId: targetLevelForGrant.levelId,
        payload: {
          grantType,
          roleId: grantType === 'ROLE' ? Number(selectedRoleId) : undefined,
          groupId: grantType === 'GROUP' ? Number(selectedGroupId) : undefined,
        },
      });
      setSuccessMsg('Actor grant added to security level.');
      setAddGrantModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to add actor grant');
    }
  };

  const handleDeleteGrant = async (grantId: number) => {
    setErrorMsg(null);
    try {
      await deleteGrantMutation.mutateAsync(grantId);
      setSuccessMsg('Actor grant removed.');
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
            Issue Security Schemes
          </h2>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
            Restrict viewing access on confidential issues to designated project roles or security directory groups with full level management.
          </p>
        </div>

        <Button
          variant="filled"
          size="sm"
          onClick={() => setCreateSchemeModalOpen(true)}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Create Security Scheme
        </Button>
      </div>

      {/* Security Schemes Cards */}
      {securitySchemes.map((secScheme) => {
        const isDefault = Boolean(
          secScheme.isDefault ||
          secScheme.id === 1 ||
          secScheme.name.toLowerCase().includes('default'),
        );

        return (
          <Card
            key={secScheme.id}
            className="p-5 rounded-3xl border border-[var(--md-sys-color-outline-variant)]/20 bg-[var(--md-sys-color-surface-container-low)] space-y-4 shadow-xs"
          >
            {/* Scheme Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--md-sys-color-outline-variant)]/20">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-[var(--md-sys-color-on-surface)]">
                    {secScheme.name}
                  </h3>
                  {isDefault && (
                    <Badge variant="primary" size="sm">DEFAULT SCHEME</Badge>
                  )}
                  <span className="text-[10px] text-[var(--md-sys-color-outline)] font-mono">
                    ID #{secScheme.id}
                  </span>
                </div>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                  {secScheme.description || 'Configured issue confidentiality levels.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {!isDefault && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSchemeToDelete(secScheme);
                      setDeleteSchemeConfirmOpen(true);
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
                  onClick={() => handleOpenAddLevel(secScheme)}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add Security Level
                </Button>
              </div>
            </div>

            {/* Scheme Levels Table */}
            <SchemeLevelsTable
              scheme={secScheme}
              onSetDefaultLevel={handleSetDefaultLevel}
              onDeleteLevel={(schemeId, level) => {
                setLevelToDelete({ schemeId, level });
                setDeleteLevelConfirmOpen(true);
              }}
              onOpenAddGrant={handleOpenAddGrant}
              onDeleteGrant={handleDeleteGrant}
            />
          </Card>
        );
      })}

      {/* Create Scheme Modal */}
      {createSchemeModalOpen && (
        <Modal
          isOpen={createSchemeModalOpen}
          onClose={() => setCreateSchemeModalOpen(false)}
          title="Create Issue Security Scheme"
          description="Establish confidentiality levels to redact sensitive issue data from unauthorized project members"
          size="md"
        >
          <form onSubmit={handleCreateSchemeSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase mb-1">
                Scheme Name *
              </label>
              <Input
                value={schemeName}
                onChange={(e) => setSchemeName(e.target.value)}
                placeholder="e.g. Confidential Security Scheme"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase mb-1">
                Description
              </label>
              <Textarea
                value={schemeDescription}
                onChange={(e) => setSchemeDescription(e.target.value)}
                placeholder="Brief description of confidentiality policy..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--md-sys-color-outline-variant)]/20">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCreateSchemeModalOpen(false)}
                disabled={createSchemeMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="filled"
                size="sm"
                disabled={createSchemeMutation.isPending || !schemeName.trim()}
                isLoading={createSchemeMutation.isPending}
              >
                Create Scheme
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Security Level Modal */}
      {addLevelModalOpen && targetSchemeForLevel && (
        <Modal
          isOpen={addLevelModalOpen}
          onClose={() => setAddLevelModalOpen(false)}
          title={`Add Security Level to "${targetSchemeForLevel.name}"`}
          description="Define a new confidentiality level to categorize sensitive issues"
          size="md"
        >
          <form onSubmit={handleAddLevelSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase mb-1">
                Level Name *
              </label>
              <Input
                value={levelName}
                onChange={(e) => setLevelName(e.target.value)}
                placeholder="e.g. Restricted / Executive / Security Team"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase mb-1">
                Description
              </label>
              <Textarea
                value={levelDesc}
                onChange={(e) => setLevelDesc(e.target.value)}
                placeholder="Who should have clearance to view issues at this level..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--md-sys-color-outline-variant)]/20">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setAddLevelModalOpen(false)}
                disabled={addLevelMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="filled"
                size="sm"
                disabled={addLevelMutation.isPending || !levelName.trim()}
                isLoading={addLevelMutation.isPending}
              >
                Add Security Level
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Actor Grant Modal */}
      {addGrantModalOpen && targetLevelForGrant && (
        <Modal
          isOpen={addGrantModalOpen}
          onClose={() => setAddGrantModalOpen(false)}
          title="Grant Actor Access"
          description="Authorize a Project Role or Directory Group to view issues tagged with this security level"
          size="md"
        >
          <form onSubmit={handleAddGrantSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase mb-1">
                Actor Type
              </label>
              <Select
                value={grantType}
                onValueChange={(val) => setGrantType(val as 'ROLE' | 'GROUP')}
              >
                <SelectTrigger className="h-10 text-xs rounded-xl bg-[var(--md-sys-color-surface)]">
                  <SelectValue placeholder="Select actor type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ROLE">Project Role</SelectItem>
                  <SelectItem value="GROUP">Directory Group</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {grantType === 'ROLE' && (
              <div>
                <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase mb-1">
                  Target Project Role
                </label>
                <Select
                  value={selectedRoleId ? String(selectedRoleId) : ''}
                  onValueChange={(val) => setSelectedRoleId(val ? Number(val) : '')}
                >
                  <SelectTrigger className="h-10 text-xs rounded-xl bg-[var(--md-sys-color-surface)]">
                    <SelectValue placeholder="Select project role..." />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {grantType === 'GROUP' && (
              <div>
                <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase mb-1">
                  Target Directory Group
                </label>
                <Select
                  value={selectedGroupId ? String(selectedGroupId) : ''}
                  onValueChange={(val) => setSelectedGroupId(val ? Number(val) : '')}
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
            )}

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
                disabled={addGrantMutation.isPending}
                isLoading={addGrantMutation.isPending}
              >
                Authorize Actor
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Scheme Confirm */}
      {deleteSchemeConfirmOpen && schemeToDelete && (
        <ConfirmDialog
          isOpen={deleteSchemeConfirmOpen}
          onClose={() => setDeleteSchemeConfirmOpen(false)}
          onConfirm={handleDeleteSchemeSubmit}
          title={`Delete Security Scheme "${schemeToDelete.name}"?`}
          description="Are you sure you want to permanently delete this issue security scheme and its security levels?"
          confirmLabel="Delete Scheme"
          cancelLabel="Keep Scheme"
          variant="danger"
          isLoading={deleteSchemeMutation.isPending}
        />
      )}

      {/* Delete Level Confirm */}
      {deleteLevelConfirmOpen && levelToDelete && (
        <ConfirmDialog
          isOpen={deleteLevelConfirmOpen}
          onClose={() => setDeleteLevelConfirmOpen(false)}
          onConfirm={handleDeleteLevelSubmit}
          title={`Delete Security Level "${levelToDelete.level.name}"?`}
          description="Are you sure you want to remove this security level and all actor grants assigned to it?"
          confirmLabel="Delete Level"
          cancelLabel="Keep Level"
          variant="danger"
          isLoading={deleteLevelMutation.isPending}
        />
      )}
    </div>
  );
};
