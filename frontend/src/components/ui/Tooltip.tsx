import React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '../../utils/cn';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  className?: string;
  delayDuration?: number;
}

export const TooltipProvider = TooltipPrimitive.Provider;

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  side = 'top',
  align = 'center',
  sideOffset = 6,
  className,
  delayDuration = 200,
}) => {
  if (!content) return children;

  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            align={align}
            sideOffset={sideOffset}
            className={cn(
              'z-50 px-2.5 py-1 text-[11px] font-medium leading-tight',
              'bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)]',
              'border border-[var(--md-sys-color-outline-variant)] rounded-md shadow-md select-none',
              'animate-in fade-in-50 zoom-in-95 duration-100',
              className,
            )}
          >
            {content}
            <TooltipPrimitive.Arrow className="fill-[var(--md-sys-color-surface-container-highest)]" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
};
