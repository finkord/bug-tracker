import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LayoutDashboard, CheckSquare } from 'lucide-react';
import { Button, Badge } from '../components/ui/index.js';

export interface ForbiddenPageProps {
  title?: string;
  message?: string;
  requiredRole?: string;
  resourceType?: string;
  resourceId?: string;
}

export const ForbiddenPage: React.FC<ForbiddenPageProps> = ({
  title = 'Access Denied',
  message,
  requiredRole,
  resourceType,
  resourceId,
}) => {
  const navigate = useNavigate();

  const computedMessage =
    message ||
    (resourceType && resourceId
      ? `You do not have sufficient permissions to view or modify ${resourceType.toLowerCase()} "${resourceId}".`
      : 'You do not have permission to access this resource or view this page. If you believe you should have access, please contact your workspace administrator or project lead.');

  return (
    <div
      data-testid="forbidden-page"
      className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 text-center min-h-[60vh] animate-in fade-in zoom-in-95 duration-200"
    >
      <div className="max-w-md w-full flex flex-col items-center space-y-5">
        {/* Optical Security Shield Metaphor */}
        <div className="relative flex items-center justify-center w-20 h-20 rounded-3xl bg-[var(--md-sys-color-error-container)]/25 text-[var(--md-sys-color-error)] border border-[var(--md-sys-color-error)]/20 shadow-xs">
          <ShieldAlert className="w-10 h-10 stroke-[1.75]" />
          <div className="absolute -bottom-1 -right-1">
            <Badge variant="error" size="sm" className="font-mono text-[10px] tracking-wider uppercase font-bold shadow-2xs">
              403
            </Badge>
          </div>
        </div>

        {/* Text Messaging */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--md-sys-color-on-surface)]">
            {title}
          </h1>
          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] leading-relaxed max-w-sm mx-auto">
            {computedMessage}
          </p>

          {requiredRole && (
            <div className="pt-1">
              <span className="inline-block text-xs font-mono px-2.5 py-1 rounded-lg bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] border border-[var(--md-sys-color-outline-variant)]/30">
                Required Role: <strong className="text-[var(--md-sys-color-primary)]">{requiredRole}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Action Pathways */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            variant="filled"
            size="md"
            onClick={() => navigate('/dashboard')}
            leftIcon={<LayoutDashboard className="w-4 h-4" />}
          >
            Back to Dashboard
          </Button>

          <Button
            variant="tonal"
            size="md"
            onClick={() => navigate('/my-issues')}
            leftIcon={<CheckSquare className="w-4 h-4" />}
          >
            My Issues
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={() => navigate(-1)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Go Back
          </Button>
        </div>

        {/* Informative Guidance */}
        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]/70 pt-4">
          Need higher access? View your current permissions on your{' '}
          <Link
            to="/profile"
            className="text-[var(--md-sys-color-primary)] hover:underline font-medium"
          >
            Profile Page
          </Link>{' '}
          or reach out to an administrator.
        </p>
      </div>
    </div>
  );
};

export default ForbiddenPage;
