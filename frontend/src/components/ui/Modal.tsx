import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
}) => {
  const sizeStyles: Record<NonNullable<ModalProps['size']>, string> = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-5xl',
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        {/* Backdrop Overlay with M3 blur and dimming */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in" />

        {/* Modal Window Container */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <Dialog.Content
            className={cn(
              'w-full bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]',
              'border border-[var(--md-sys-color-outline-variant)] rounded-2xl shadow-xl',
              'transition-all duration-200 animate-in fade-in zoom-in-95 focus:outline-none',
              'flex flex-col max-h-[90vh]',
              sizeStyles[size],
              className,
            )}
          >
            {/* Header */}
            {(title || description) && (
              <div className="px-6 py-4 border-b border-[var(--md-sys-color-outline-variant)] flex items-start justify-between gap-4 shrink-0">
                <div className="flex flex-col gap-1">
                  {title && (
                    <Dialog.Title className="text-lg font-semibold tracking-tight text-[var(--md-sys-color-on-surface)]">
                      {title}
                    </Dialog.Title>
                  )}
                  {description && (
                    <Dialog.Description className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                      {description}
                    </Dialog.Description>
                  )}
                </div>

                <Dialog.Close asChild>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer shrink-0"
                    aria-label="Close dialog"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </Dialog.Close>
              </div>
            )}

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto flex-1">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="px-6 py-4 border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] rounded-b-2xl flex items-center justify-end gap-3 shrink-0">
                {footer}
              </div>
            )}
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
