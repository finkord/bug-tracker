import React from 'react';
import { KeyRound } from 'lucide-react';
import type { PermissionSchemeItem } from '../../../api/client';
import { Badge } from '../../ui';

interface PermissionSchemesTabProps {
  readonly permissionSchemes: PermissionSchemeItem[];
}

export const PermissionSchemesTab: React.FC<PermissionSchemesTabProps> = ({
  permissionSchemes,
}) => {
  return (
    <div className="space-y-6">
      {permissionSchemes.map((scheme) => (
        <div
          key={scheme.id}
          className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 rounded-3xl p-6 space-y-6 shadow-xs"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--md-sys-color-outline-variant)]/20 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-[var(--md-sys-color-on-surface)]">
                  {scheme.name}
                </h2>
                {scheme.isDefault && (
                  <Badge variant="primary" size="sm">DEFAULT SCHEME</Badge>
                )}
              </div>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">
                {scheme.description}
              </p>
            </div>
          </div>

          {/* Matrix of grants */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
              Granted Operations Matrix ({scheme.grants?.length || 0} Grants)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {scheme.grants?.map((grant) => (
                <div
                  key={grant.id}
                  className="p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/20 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-[var(--md-sys-color-on-surface)]">
                      {grant.permission}
                    </span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-primary)]">
                      {grant.grantType}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                    <KeyRound className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] shrink-0" />
                    <span className="font-semibold">
                      {grant.grantType === 'ROLE'
                        ? `Project Role: ${grant.role?.name || `Role #${grant.roleId}`}`
                        : grant.grantType === 'GROUP'
                        ? `Directory Group: ${grant.group?.name || `Group #${grant.groupId}`}`
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
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
