import React, { useState } from 'react';
import { KeyRound, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import type { PermissionSchemeItem } from '../../../api/client';
import {
  useCreatePermissionSchemeMutation,
  useAddPermissionGrantMutation,
  useRemovePermissionGrantMutation,
  useProjectRolesQuery,
  useGroupsQuery,
} from '../../../api/queries';
import { Badge, Button, Card, Modal, Input, Select, SelectGroup, SelectTrigger, SelectValue, SelectContent, SelectLabel, SelectItem } from '../../ui';

interface PermissionSchemesTabProps {
  readonly permissionSchemes: PermissionSchemeItem[];
}

const PERMISSION_GROUPS = [
  {
    category: 'Project Governance',
    permissions: [
      { key: 'BROWSE_PROJECTS', label: 'Browse Projects' },
      { key: 'ADMINISTER_PROJECTS', label: 'Administer Projects' },
      { key: 'VIEW_ROADMAP', label: 'View Roadmap' },
    ],
  },
  {
    category: 'Issue Operations',
    permissions: [
      { key: 'CREATE_ISSUES', label: 'Create Issues' },
      { key: 'EDIT_ISSUES', label: 'Edit Issues' },
      { key: 'ASSIGN_ISSUES', label: 'Assign Issues' },
      { key: 'ASSIGNABLE_USER', label: 'Assignable User' },
      { key: 'DELETE_ISSUES', label: 'Delete Issues' },
      { key: 'MOVE_ISSUES', label: 'Move Issues' },
      { key: 'CLOSE_ISSUES', label: 'Close Issues' },
      { key: 'TRANSITION_ISSUES', label: 'Transition Issues' },
    ],
  },
  {
    category: 'Comments',
    permissions: [
      { key: 'ADD_COMMENTS', label: 'Add Comments' },
      { key: 'EDIT_OWN_COMMENTS', label: 'Edit Own Comments' },
      { key: 'EDIT_ALL_COMMENTS', label: 'Edit All Comments' },
      { key: 'DELETE_OWN_COMMENTS', label: 'Delete Own Comments' },
      { key: 'DELETE_ALL_COMMENTS', label: 'Delete All Comments' },
    ],
  },
  {
    category: 'Time Tracking & Worklogs',
    permissions: [
      { key: 'LOG_WORK', label: 'Log Work Hours' },
      { key: 'EDIT_OWN_WORKLOGS', label: 'Edit Own Worklogs' },
      { key: 'EDIT_ALL_WORKLOGS', label: 'Edit All Worklogs' },
      { key: 'DELETE_OWN_WORKLOGS', label: 'Delete Own Worklogs' },
      { key: 'DELETE_ALL_WORKLOGS', label: 'Delete All Worklogs' },
    ],
  },
  {
    category: 'Attachments',
    permissions: [
      { key: 'CREATE_ATTACHMENTS', label: 'Upload Attachments' },
      { key: 'DELETE_OWN_ATTACHMENTS', label: 'Delete Own Attachments' },
      { key: 'DELETE_ALL_ATTACHMENTS', label: 'Delete All Attachments' },
    ],
  },
];

export const PermissionSchemesTab: React.FC<PermissionSchemesTabProps> = ({
  permissionSchemes,
}) => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newSchemeName, setNewSchemeName] = useState('');
  const [newSchemeDesc, setNewSchemeDesc] = useState('');

  const [addGrantModalOpen, setAddGrantModalOpen] = useState(false);
  const [selectedSchemeId, setSelectedSchemeId] = useState<number | null>(null);
  const [selectedPermission, setSelectedPermission] = useState('BROWSE_PROJECTS');
  const [selectedGrantType, setSelectedGrantType] = useState<'ROLE' | 'GROUP' | 'LEAD' | 'REPORTER' | 'ASSIGNEE' | 'ANY_LOGGED_IN'>('ROLE');
  const [selectedRoleId, setSelectedRoleId] = useState<number | ''>('');
  const [selectedGroupId, setSelectedGroupId] = useState<number | ''>('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedSchemeFilter, setSelectedSchemeFilter] = useState<number | 'ALL'>('ALL');

  const displayedSchemes =
    selectedSchemeFilter === 'ALL'
      ? permissionSchemes
      : permissionSchemes.filter((s) => s.id === selectedSchemeFilter);

  const { data: roles = [] } = useProjectRolesQuery();
  const { data: groups = [] } = useGroupsQuery();

  const createSchemeMutation = useCreatePermissionSchemeMutation();
  const addGrantMutation = useAddPermissionGrantMutation();
  const removeGrantMutation = useRemovePermissionGrantMutation();

  const handleCreateScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchemeName.trim()) return;

    setErrorMsg(null);
    try {
      await createSchemeMutation.mutateAsync({
        name: newSchemeName.trim(),
        description: newSchemeDesc.trim() || undefined,
      });
      setSuccessMsg(`Permission Scheme "${newSchemeName.trim()}" created successfully.`);
      setNewSchemeName('');
      setNewSchemeDesc('');
      setCreateModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create permission scheme');
    }
  };

  const handleOpenAddGrant = (schemeId: number) => {
    setSelectedSchemeId(schemeId);
    setSelectedPermission('BROWSE_PROJECTS');
    setSelectedGrantType('ROLE');
    setSelectedRoleId(roles[0]?.id || '');
    setSelectedGroupId(groups[0]?.id || '');
    setAddGrantModalOpen(true);
  };

  const handleAddGrantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchemeId) return;

    if (selectedGrantType === 'ROLE' && !selectedRoleId) {
      setErrorMsg('Please select a project role for this grant');
      return;
    }
    if (selectedGrantType === 'GROUP' && !selectedGroupId) {
      setErrorMsg('Please select a directory group for this grant');
      return;
    }

    setErrorMsg(null);
    try {
      await addGrantMutation.mutateAsync({
        schemeId: selectedSchemeId,
        payload: {
          permission: selectedPermission,
          grantType: selectedGrantType,
          roleId: selectedGrantType === 'ROLE' ? Number(selectedRoleId) : undefined,
          groupId: selectedGrantType === 'GROUP' ? Number(selectedGroupId) : undefined,
        },
      });
      setSuccessMsg('Permission grant successfully added to scheme.');
      setAddGrantModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to add permission grant');
    }
  };

  const handleRemoveGrant = async (schemeId: number, grantId: number) => {
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-[var(--md-sys-color-on-surface)]">
            Reusable Permission Schemes
          </h2>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
            Permission Schemes define granular access matrices that can be mapped to multiple projects.
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

      {/* Scheme Quick Switcher Bar */}
      {permissionSchemes.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedSchemeFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedSchemeFilter === 'ALL'
                ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xs'
                : 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
            }`}
          >
            All Schemes ({permissionSchemes.length})
          </button>
          {permissionSchemes.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedSchemeFilter(s.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                selectedSchemeFilter === s.id
                  ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xs'
                  : 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
              }`}
            >
              <span>{s.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                selectedSchemeFilter === s.id
                  ? 'bg-[var(--md-sys-color-on-primary)]/20 text-[var(--md-sys-color-on-primary)]'
                  : 'bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface-variant)]'
              }`}>
                {s.grants?.length || 0}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Schemes List */}
      <div className="space-y-6">
        {displayedSchemes.map((scheme) => (
          <Card
            key={scheme.id}
            variant="filled"
            padding="lg"
            rounded="3xl"
            className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 space-y-6 shadow-xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--md-sys-color-outline-variant)]/20 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-[var(--md-sys-color-on-surface)]">
                    {scheme.name}
                  </h3>
                  {scheme.isDefault && (
                    <Badge variant="primary" size="sm">DEFAULT SCHEME</Badge>
                  )}
                  <span className="text-[10px] text-[var(--md-sys-color-outline)] font-mono">
                    ID #{scheme.id}
                  </span>
                </div>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">
                  {scheme.description || 'Custom permission scheme matrix.'}
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenAddGrant(scheme.id)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Permission Grant
              </Button>
            </div>

            {/* Matrix of grants */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
                  Granted Operations Matrix ({scheme.grants?.length || 0} Grants)
                </span>
              </div>

              {(!scheme.grants || scheme.grants.length === 0) ? (
                <div className="text-center py-8 text-xs text-[var(--md-sys-color-on-surface-variant)] border border-dashed border-[var(--md-sys-color-outline-variant)]/30 rounded-2xl">
                  No permission grants defined yet. Click &quot;Add Permission Grant&quot; to authorize roles or groups.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {scheme.grants.map((grant) => (
                    <div
                      key={grant.id}
                      className="p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/20 space-y-2 flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[11px] font-mono font-bold text-[var(--md-sys-color-on-surface)] truncate" title={grant.permission}>
                            {grant.permission}
                          </span>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-primary)] shrink-0">
                            {grant.grantType}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                          <KeyRound className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] shrink-0" />
                          <span className="font-semibold truncate">
                            {grant.grantType === 'ROLE'
                              ? `Role: ${grant.role?.name || `Role #${grant.roleId}`}`
                              : grant.grantType === 'GROUP'
                              ? `Group: ${grant.group?.name || `Group #${grant.groupId}`}`
                              : grant.grantType === 'LEAD'
                              ? 'Project Lead (Dynamic)'
                              : grant.grantType === 'REPORTER'
                              ? 'Issue Reporter (Dynamic)'
                              : grant.grantType === 'ASSIGNEE'
                              ? 'Issue Assignee (Dynamic)'
                              : 'All Authenticated Users'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[var(--md-sys-color-outline-variant)]/10 flex items-center justify-between">
                        <span className="text-[10px] text-[var(--md-sys-color-outline)] font-mono">
                          Grant #{grant.id}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveGrant(scheme.id, grant.id)}
                          className="h-6 w-6 p-0 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)]"
                          title="Remove Grant"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

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

      {/* Add Permission Grant Modal */}
      {addGrantModalOpen && selectedSchemeId && (
        <Modal
          isOpen={addGrantModalOpen}
          onClose={() => setAddGrantModalOpen(false)}
          title="Add Permission Grant"
          description="Grant an action to a Project Role, Directory Group, or dynamic actor"
          size="md"
        >
          <form onSubmit={handleAddGrantSubmit} className="space-y-4">
            {/* Permission Selector */}
            <div>
              <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase mb-1">
                Permission Action
              </label>
              <Select value={selectedPermission} onValueChange={setSelectedPermission}>
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

            {/* Grant Type */}
            <div>
              <label className="block text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase mb-1">
                Grant Recipient Type
              </label>
              <Select
                value={selectedGrantType}
                onValueChange={(val) => setSelectedGrantType(val as typeof selectedGrantType)}
              >
                <SelectTrigger className="h-10 text-xs rounded-xl bg-[var(--md-sys-color-surface)]">
                  <SelectValue placeholder="Select recipient type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ROLE">Project Role</SelectItem>
                  <SelectItem value="GROUP">Directory Group</SelectItem>
                  <SelectItem value="LEAD">Project Lead (Dynamic)</SelectItem>
                  <SelectItem value="REPORTER">Issue Reporter (Dynamic)</SelectItem>
                  <SelectItem value="ASSIGNEE">Issue Assignee (Dynamic)</SelectItem>
                  <SelectItem value="ANY_LOGGED_IN">All Authenticated Users</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Conditional Role Select */}
            {selectedGrantType === 'ROLE' && (
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

            {/* Conditional Group Select */}
            {selectedGrantType === 'GROUP' && (
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
                Add Grant
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
