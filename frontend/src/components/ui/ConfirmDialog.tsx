import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, AlertCircle, Trash2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: React.ReactNode;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
  icon?: React.ReactNode;
  confirmTestId?: string;
  cancelTestId?: string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
  icon,
  confirmTestId = 'confirm-dialog-btn',
  cancelTestId = 'confirm-dialog-cancel-btn',
}) => {
  const defaultLabels = {
    danger: 'Delete',
    warning: 'Proceed',
    primary: 'Confirm',
  };

  const defaultIcons = {
    danger: <Trash2 className="w-5 h-5 text-[var(--md-sys-color-error)]" />,
    warning: <AlertTriangle className="w-5 h-5 text-[var(--md-sys-color-tertiary)]" />,
    primary: <AlertCircle className="w-5 h-5 text-[var(--md-sys-color-primary)]" />,
  };

  const buttonVariants = {
    danger: 'danger' as const,
    warning: 'secondary' as const,
    primary: 'primary' as const,
  };

  const iconContainers = {
    danger: 'bg-[var(--md-sys-color-error-container)]/40 border-[var(--md-sys-color-error)]/30',
    warning: 'bg-[var(--md-sys-color-tertiary-container)]/40 border-[var(--md-sys-color-tertiary)]/30',
    primary: 'bg-[var(--md-sys-color-primary-container)]/40 border-[var(--md-sys-color-primary)]/30',
  };

  const resolvedConfirmLabel = confirmLabel || defaultLabels[variant];
  const resolvedIcon = icon || defaultIcons[variant];

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isLoading) onClose();
      }}
      size="sm"
      className="border border-[var(--md-sys-color-outline-variant)]/60"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            data-testid={cancelTestId}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={buttonVariants[variant]}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
            disabled={isLoading}
            data-testid={confirmTestId}
          >
            {resolvedConfirmLabel}
          </Button>
        </div>
      }
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border',
            iconContainers[variant],
          )}
        >
          {resolvedIcon}
        </div>
        <div className="space-y-1.5 flex-1 min-w-0">
          <h3 className="text-base font-bold text-[var(--md-sys-color-on-surface)] leading-snug">
            {title}
          </h3>
          <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
            {description}
          </div>
        </div>
      </div>
    </Modal>
  );
};
