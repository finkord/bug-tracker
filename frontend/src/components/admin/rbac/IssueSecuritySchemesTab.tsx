import React from 'react';
import { Lock } from 'lucide-react';
import type { IssueSecuritySchemeItem } from '../../../api/client';
import { Badge } from '../../ui';

interface IssueSecuritySchemesTabProps {
  readonly securitySchemes: IssueSecuritySchemeItem[];
}

export const IssueSecuritySchemesTab: React.FC<IssueSecuritySchemesTabProps> = ({
  securitySchemes,
}) => {
  return (
    <div className="space-y-6">
      {securitySchemes.map((secScheme) => (
        <div
          key={secScheme.id}
          className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 rounded-3xl p-6 space-y-6 shadow-xs"
        >
          <div>
            <h2 className="text-base font-black text-[var(--md-sys-color-on-surface)]">
              {secScheme.name}
            </h2>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">
              {secScheme.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {secScheme.levels?.map((lvl) => (
              <div
                key={lvl.id}
                className="p-5 rounded-3xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/30 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                    <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                      {lvl.name}
                    </h3>
                  </div>
                  {secScheme.defaultLevelId === lvl.id && (
                    <Badge variant="primary" size="sm">DEFAULT LEVEL</Badge>
                  )}
                </div>

                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                  {lvl.description}
                </p>

                <div className="pt-2 border-t border-[var(--md-sys-color-outline-variant)]/20 space-y-1.5">
                  <span className="text-[10px] font-bold text-[var(--md-sys-color-outline)] uppercase">
                    Authorized Actors
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {lvl.grants?.map((g, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2.5 py-1 rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] font-medium border border-[var(--md-sys-color-outline-variant)]/30"
                      >
                        {g.grantType === 'ROLE'
                          ? `Role: ${g.role?.name}`
                          : g.grantType === 'GROUP'
                          ? `Group: ${g.group?.name}`
                          : g.grantType}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
