import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Badge, Modal, Input } from '../ui/index.js';
import {
  ShieldCheck,
  PlusCircle,
  ExternalLink,
  Check,
} from 'lucide-react';

interface CustomRole {
  name: string;
  label: string;
  description: string;
  permissions: string[];
}

export const AdminRolesTab: React.FC = () => {
  const [customRoles, setCustomRoles] = useState<CustomRole[]>(() => {
    try {
      const raw = localStorage.getItem('bt_custom_roles');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [createRoleModalOpen, setCreateRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [newRolePermissions, setNewRolePermissions] = useState<string[]>([
    'issues:create',
    'issues:edit',
    'issues:status',
    'worklogs:log',
  ]);

  const availablePermissions = [
    { key: 'issues:create', label: 'Create Issues' },
    { key: 'issues:edit', label: 'Edit Issues' },
    { key: 'issues:delete', label: 'Delete Issues' },
    { key: 'issues:status', label: 'Transition Status' },
    { key: 'issues:assign', label: 'Assign Issues' },
    { key: 'worklogs:log', label: 'Log Work Hours' },
    { key: 'comments:add', label: 'Add Comments' },
    { key: 'attachments:upload', label: 'Upload Attachments' },
    { key: 'projects:manage', label: 'Manage Project Settings' },
  ];

  const handleTogglePermission = (permKey: string) => {
    setNewRolePermissions((prev) =>
      prev.includes(permKey) ? prev.filter((p) => p !== permKey) : [...prev, permKey],
    );
  };

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    const newRole: CustomRole = {
      name: newRoleName.trim().toUpperCase().replace(/\s+/g, '_'),
      label: newRoleName.trim(),
      description: newRoleDescription.trim(),
      permissions: newRolePermissions,
    };

    const updated = [...customRoles, newRole];
    setCustomRoles(updated);
    localStorage.setItem('bt_custom_roles', JSON.stringify(updated));

    setNewRoleName('');
    setNewRoleDescription('');
    setCreateRoleModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* RBAC Quick Link Banner */}
      <Card className="p-5 bg-primary/5 border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Advanced RBAC & Security Schemes</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure fine-grained enterprise-grade permission schemes, project roles, and issue security levels.
            </p>
          </div>
        </div>

        <Link to="/admin/rbac">
          <Button size="sm" className="gap-1.5 text-xs font-semibold shrink-0">
            Open RBAC Studio
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </Card>

      {/* Built-in System Roles */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Standard System Roles
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-4 space-y-2 border-border/80">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">Administrator</span>
              <Badge variant="critical">Full Access</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Full control over system configurations, user accounts, security policies, and projects.
            </p>
          </Card>

          <Card className="p-4 space-y-2 border-border/80">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">Project Manager</span>
              <Badge variant="primary">Lead</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Oversees sprint planning, project milestones, team velocity, timesheets, and permissions.
            </p>
          </Card>

          <Card className="p-4 space-y-2 border-border/80">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">Developer</span>
              <Badge variant="secondary">Member</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Creates and resolves tasks, logs work hours, collaborates on code reviews and issue links.
            </p>
          </Card>

          <Card className="p-4 space-y-2 border-border/80">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">QA Engineer</span>
              <Badge variant="warning">Testing</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Verifies bug fixes, submits test reports, logs regression issues, and verifies releases.
            </p>
          </Card>

          <Card className="p-4 space-y-2 border-border/80">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">DevOps Engineer</span>
              <Badge variant="neutral">Ops</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Manages broadcast announcements, service integrations, CI/CD telemetry, and system uptime.
            </p>
          </Card>

          <Card className="p-4 space-y-2 border-border/80">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">Security Engineer</span>
              <Badge variant="error">SecOps</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Audits forensic login logs, lockout thresholds, 2FA compliance, and zero-trust policies.
            </p>
          </Card>
        </div>
      </div>

      {/* Custom Roles Section */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Custom Workspace Roles ({customRoles.length})
          </h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCreateRoleModalOpen(true)}
            className="text-xs gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5 text-primary" />
            Create Custom Role
          </Button>
        </div>

        {customRoles.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground border border-dashed border-border rounded-lg bg-card/30">
            No custom roles created yet. Define custom roles for tailored permission boundaries.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customRoles.map((role) => (
              <Card key={role.name} className="p-4 space-y-3 border-border/80">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground">{role.label}</span>
                  <Badge variant="neutral" className="font-mono text-[10px]">
                    {role.name}
                  </Badge>
                </div>
                {role.description && (
                  <p className="text-xs text-muted-foreground">{role.description}</p>
                )}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {role.permissions.map((p) => (
                    <Badge key={p} variant="secondary" className="text-[10px] font-mono">
                      {p}
                    </Badge>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Custom Role Modal */}
      {createRoleModalOpen && (
        <Modal
          isOpen={createRoleModalOpen}
          onClose={() => setCreateRoleModalOpen(false)}
          title="Create Custom Role"
          size="md"
        >
          <form onSubmit={handleCreateRole} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                Role Display Name
              </label>
              <Input
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="e.g. Technical Writer"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                Description
              </label>
              <Input
                value={newRoleDescription}
                onChange={(e) => setNewRoleDescription(e.target.value)}
                placeholder="Responsibilities and purpose of this role..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">
                Included Permissions
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {availablePermissions.map((perm) => {
                  const checked = newRolePermissions.includes(perm.key);
                  return (
                    <div
                      key={perm.key}
                      onClick={() => handleTogglePermission(perm.key)}
                      className={`flex items-center gap-2 p-2 rounded border text-xs cursor-pointer select-none transition-colors ${
                        checked
                          ? 'border-primary/50 bg-primary/10 text-foreground font-medium'
                          : 'border-border/60 hover:bg-muted/30 text-muted-foreground'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          checked
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-muted-foreground/40'
                        }`}
                      >
                        {checked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span>{perm.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCreateRoleModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={!newRoleName.trim()}>
                Create Role
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
