import React from 'react';
import type { ProjectRoleItem } from '../../../api/client';

interface ProjectRolesTabProps {
  readonly roles: ProjectRoleItem[];
}

export const ProjectRolesTab: React.FC<ProjectRolesTabProps> = ({ roles }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
            Globally Defined Project Roles
          </h2>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
            Project Roles provide the abstraction layer between Permission Schemes and individual team members.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {roles.map((role) => (
          <div
            key={role.id}
            className="p-5 rounded-3xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 space-y-3 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-2xl bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] flex items-center justify-center font-bold text-xs">
                {role.name[0]}
              </div>
              {role.isDefault && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-primary)]">
                  DEFAULT ROLE
                </span>
              )}
            </div>

            <div>
              <h3 className="text-sm font-black text-[var(--md-sys-color-on-surface)]">{role.name}</h3>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1 leading-relaxed">
                {role.description || 'Standard project role definition.'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
