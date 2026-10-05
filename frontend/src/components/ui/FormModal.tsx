import React, { useId } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button, type ButtonProps } from './Button';
import { Modal, type ModalProps } from './Modal';

export interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  size?: ModalProps['size'];
  className?: string;
  bodyClassName?: string;
  formClassName?: string;

  // Form submission
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;

  // Error alert banner
  error?: React.ReactNode | null;

  // Submit button configuration
  submitLabel?: string;
  submittingLabel?: string;
  submitVariant?: ButtonProps['variant'];
  submitIcon?: React.ReactNode;
  submitDisabled?: boolean;

  // Submitting / loading state
  isSubmitting?: boolean;
  loading?: boolean;

  // Cancel button configuration
  showCancel?: boolean;
  cancelLabel?: string;
  cancelVariant?: ButtonProps['variant'];
  onCancel?: () => void;

  // Extra footer content (e.g. Delete button on the left)
  extraFooter?: React.ReactNode;

  // Button sizes
  buttonSize?: ButtonProps['size'];

  // Form content
  children: React.ReactNode;
}

export const FormModal: React.FC<FormModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  className,
  bodyClassName,
  formClassName,
  onSubmit,
  error,
  submitLabel = 'Save',
  submittingLabel = 'Saving...',
  submitVariant = 'filled',
  submitIcon,
  submitDisabled = false,
  isSubmitting = false,
  loading = false,
  showCancel = true,
  cancelLabel = 'Cancel',
  cancelVariant = 'ghost',
  onCancel,
  extraFooter,
  buttonSize = 'sm',
  children,
}) => {
  const formId = useId();
  const submitting = isSubmitting || loading;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting || submitDisabled) return;
    await onSubmit(e);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size={size}
      className={className}
      bodyClassName="p-0 overflow-hidden flex flex-col flex-1 min-h-0"
    >
      <form
        id={formId}
        onSubmit={handleSubmit}
        className={cn('flex flex-col flex-1 min-h-0 overflow-hidden', formClassName)}
      >
        {/* Scrollable Form Body */}
        <div className={cn('p-6 overflow-y-auto flex-1 min-h-0 space-y-4', bodyClassName)}>
          {error && (
            <div
              role="alert"
              className="p-3 rounded-2xl bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] text-xs font-medium flex items-center gap-2.5 animate-in fade-in duration-150 shrink-0"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-[var(--md-sys-color-error)]" />
              <div className="flex-1 leading-snug">{error}</div>
            </div>
          )}
          {children}
        </div>

        {/* Standardized Form Footer */}
        <div className="px-6 py-4 border-t border-[var(--md-sys-color-outline-variant)]/20 bg-[var(--md-sys-color-surface-container)] rounded-b-[28px] flex items-center justify-between gap-3 shrink-0">
          <div>{extraFooter}</div>
          <div className="flex items-center gap-2.5 ml-auto">
            {showCancel && (
              <Button
                type="button"
                variant={cancelVariant}
                size={buttonSize}
                onClick={onCancel || onClose}
                disabled={submitting}
              >
                {cancelLabel}
              </Button>
            )}
            <Button
              type="submit"
              variant={submitVariant}
              size={buttonSize}
              isLoading={submitting}
              disabled={submitDisabled || submitting}
              leftIcon={!submitting ? submitIcon : undefined}
            >
              {submitting ? submittingLabel : submitLabel}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
