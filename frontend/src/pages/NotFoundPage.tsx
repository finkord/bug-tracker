import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Compass, ArrowLeft, LayoutDashboard, FolderGit2 } from 'lucide-react';
import { Button, Badge } from '../components/ui/index.js';

export interface NotFoundPageProps {
  title?: string;
  description?: string;
  resourceType?: string;
  resourceId?: string;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  title = 'Page Not Found',
  description,
  resourceType,
  resourceId,
}) => {
  const navigate = useNavigate();

  const computedDescription =
    description ||
    (resourceType && resourceId
      ? `The ${resourceType.toLowerCase()} "${resourceId}" could not be found or you do not have permission to view it.`
      : 'The page you are looking for doesn\'t exist, has been deleted, or may have moved.');

  return (
    <div
      data-testid="not-found-page"
      className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 text-center min-h-[60vh] animate-in fade-in zoom-in-95 duration-200"
    >
      <div className="max-w-md w-full flex flex-col items-center space-y-5">
        {/* Optical Icon Metaphor */}
        <div className="relative flex items-center justify-center w-20 h-20 rounded-3xl bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-outline-variant)]/30 shadow-xs">
          <Compass className="w-10 h-10 animate-spin-slow stroke-[1.75]" />
          <div className="absolute -bottom-1 -right-1">
            <Badge variant="neutral" size="sm" className="font-mono text-[10px] tracking-wider uppercase font-bold shadow-2xs">
              404
            </Badge>
          </div>
        </div>

        {/* Text Messaging */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--md-sys-color-on-surface)]">
            {title}
          </h1>
          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] leading-relaxed max-w-sm mx-auto">
            {computedDescription}
          </p>
        </div>

        {/* Action Pathways */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            variant="filled"
            size="md"
            onClick={() => navigate('/dashboard')}
            leftIcon={<LayoutDashboard className="w-4 h-4" />}
          >
            Go to Dashboard
          </Button>

          <Button
            variant="tonal"
            size="md"
            onClick={() => navigate('/projects')}
            leftIcon={<FolderGit2 className="w-4 h-4" />}
          >
            Browse Projects
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

        {/* Helpful Footnote */}
        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]/70 pt-4">
          Need assistance? Check the{' '}
          <Link
            to="/search"
            className="text-[var(--md-sys-color-primary)] hover:underline font-medium"
          >
            global search
          </Link>{' '}
          or contact your system administrator.
        </p>
      </div>
    </div>
  );
};

export default NotFoundPage;
