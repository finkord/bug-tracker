import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button.js';

export interface BackButtonProps {
  /**
   * Fallback URL if history is empty or direct visit.
   * Defaults to '/' or parent context.
   */
  fallbackPath?: string;
  /**
   * Explicit label. If omitted, uses `location.state?.label` or 'Back'.
   */
  label?: string;
  /**
   * Optional custom click handler.
   */
  onClick?: () => void;
  /**
   * Button size variant.
   */
  size?: 'xs' | 'sm' | 'md';
  /**
   * Button style variant.
   */
  variant?: 'ghost' | 'outline';
  /**
   * Additional CSS classes.
   */
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  fallbackPath = '/projects',
  label,
  onClick,
  size = 'sm',
  variant = 'ghost',
  className = '',
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const displayLabel =
    label ||
    (location.state as { label?: string } | null)?.label ||
    'Back';

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }

    const state = location.state as { from?: string } | null;
    if (state?.from) {
      navigate(state.from);
      return;
    }

    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallbackPath);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleClick}
      className={`gap-2 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer ${className}`}
    >
      <ArrowLeft className={size === 'xs' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      <span>{displayLabel}</span>
    </Button>
  );
};
