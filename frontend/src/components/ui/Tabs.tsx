import React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface UseScrollableTabsOptions {
  scrollDistance?: number;
  activeSelector?: string;
  wheelMultiplier?: number;
}

export function useScrollableTabs<T extends HTMLElement = HTMLElement>(
  options: UseScrollableTabsOptions = {},
) {
  const containerRef = React.useRef<T | null>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const checkScrollState = React.useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
  }, []);

  const scroll = React.useCallback(
    (direction: 'left' | 'right') => {
      const el = containerRef.current;
      if (!el) return;
      const dist = options.scrollDistance ?? 220;
      el.scrollBy({
        left: direction === 'left' ? -dist : dist,
        behavior: 'smooth',
      });
    },
    [options.scrollDistance],
  );

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    checkScrollState();

    const multiplier = options.wheelMultiplier ?? 2.2;

    const handleWheel = (e: WheelEvent) => {
      const { scrollWidth, clientWidth } = el;
      const isScrollable = scrollWidth > clientWidth;
      if (!isScrollable) return;

      const rawDelta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (rawDelta === 0) return;

      // Prevent vertical window/page scroll when scrolling horizontally over tabs
      e.preventDefault();

      // Accelerated wheel scroll delta for responsive, snappy navigation
      el.scrollLeft += rawDelta * multiplier;
      checkScrollState();
    };

    el.addEventListener('scroll', checkScrollState, { passive: true });
    el.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('resize', checkScrollState);

    const resizeObserver = new ResizeObserver(checkScrollState);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener('scroll', checkScrollState);
      el.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', checkScrollState);
      resizeObserver.disconnect();
    };
  }, [checkScrollState, options.wheelMultiplier]);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const selector =
      options.activeSelector ||
      '[data-state="active"], [aria-selected="true"], [aria-current="page"], .active';
    const activeEl = el.querySelector<HTMLElement>(selector);
    if (activeEl) {
      activeEl.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
    checkScrollState();
  }, [options.activeSelector, checkScrollState]);

  return {
    containerRef,
    canScrollLeft,
    canScrollRight,
    scroll,
    checkScrollState,
  };
}

export interface ScrollableTabsContainerProps {
  children: React.ReactNode;
  as?: 'div' | 'nav';
  className?: string;
  railClassName?: string;
  scrollDistance?: number;
  activeSelector?: string;
  wheelMultiplier?: number;
  'aria-label'?: string;
  id?: string;
}

export const ScrollableTabsContainer = React.forwardRef<
  HTMLElement,
  ScrollableTabsContainerProps
>(
  (
    {
      children,
      as: Component = 'div',
      className,
      railClassName,
      scrollDistance = 240,
      activeSelector,
      wheelMultiplier = 2.2,
      'aria-label': ariaLabel,
      id,
      ...props
    },
    forwardedRef,
  ) => {
    const { containerRef, canScrollLeft, canScrollRight, scroll } =
      useScrollableTabs({
        scrollDistance,
        activeSelector,
        wheelMultiplier,
      });

    React.useImperativeHandle(forwardedRef, () => containerRef.current!);

    return (
      <div className={cn('relative group/tabs-rail w-full max-w-full min-w-0', className)}>
        {/* Left Scroll Button & Subtle Edge Gradient */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 z-20 w-12 sm:w-16 flex items-center justify-start pl-1 bg-gradient-to-r from-[var(--md-sys-color-surface)] via-[var(--md-sys-color-surface)]/80 to-transparent pointer-events-none">
            <button
              type="button"
              onClick={() => scroll('left')}
              aria-label="Scroll tabs left"
              className="pointer-events-auto h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] shadow-md hover:bg-[var(--md-sys-color-surface-container-highest)] hover:scale-105 active:scale-95 transition-all cursor-pointer border border-[var(--md-sys-color-outline-variant)]/30"
            >
              <ChevronLeft className="w-4 h-4 shrink-0" />
            </button>
          </div>
        )}

        {/* Tab Rail Element - Direct baseline alignment without padding interference */}
        <Component
          ref={containerRef as any}
          id={id}
          aria-label={ariaLabel}
          className={cn(
            'flex items-center overflow-x-auto no-scrollbar scroll-smooth',
            railClassName,
          )}
          {...props}
        >
          {children}
        </Component>

        {/* Right Scroll Button & Subtle Edge Gradient */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 z-20 w-12 sm:w-16 flex items-center justify-end pr-1 bg-gradient-to-l from-[var(--md-sys-color-surface)] via-[var(--md-sys-color-surface)]/80 to-transparent pointer-events-none">
            <button
              type="button"
              onClick={() => scroll('right')}
              aria-label="Scroll tabs right"
              className="pointer-events-auto h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] shadow-md hover:bg-[var(--md-sys-color-surface-container-highest)] hover:scale-105 active:scale-95 transition-all cursor-pointer border border-[var(--md-sys-color-outline-variant)]/30"
            >
              <ChevronRight className="w-4 h-4 shrink-0" />
            </button>
          </div>
        )}
      </div>
    );
  },
);
ScrollableTabsContainer.displayName = 'ScrollableTabsContainer';

export const Tabs = TabsPrimitive.Root;

export interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  variant?: 'pills' | 'underline';
  scrollable?: boolean;
  wheelMultiplier?: number;
}

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant = 'pills', scrollable = true, wheelMultiplier = 2.2, children, ...props }, ref) => {
  const internalRef = React.useRef<React.ElementRef<typeof TabsPrimitive.List> | null>(null);
  const { containerRef, canScrollLeft, canScrollRight, scroll } =
    useScrollableTabs({
      scrollDistance: 200,
      wheelMultiplier,
    });

  const mergedRef = React.useCallback(
    (node: React.ElementRef<typeof TabsPrimitive.List> | null) => {
      internalRef.current = node;
      containerRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<any>).current = node;
    },
    [ref, containerRef],
  );

  const listElement = (
    <TabsPrimitive.List
      ref={mergedRef}
      className={cn(
        'inline-flex items-center select-none overflow-x-auto max-w-full no-scrollbar shrink-0 scroll-smooth',
        variant === 'pills' &&
          'p-1 gap-1 rounded-xl bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] border border-[var(--md-sys-color-outline-variant)]/20',
        variant === 'underline' &&
          'border-b border-[var(--md-sys-color-outline-variant)]/30 gap-4 sm:gap-6 w-full min-w-0',
        className,
      )}
      {...props}
    >
      {children}
    </TabsPrimitive.List>
  );

  if (!scrollable) {
    return listElement;
  }

  return (
    <div className="relative group/tabs-rail max-w-full min-w-0 inline-flex items-center">
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 z-20 w-10 sm:w-12 flex items-center justify-start pl-1 bg-gradient-to-r from-[var(--md-sys-color-surface)] to-transparent pointer-events-none">
          <button
            type="button"
            onClick={() => scroll('left')}
            aria-label="Scroll tabs left"
            className="pointer-events-auto h-6 w-6 sm:h-7 sm:w-7 flex items-center justify-center rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] shadow-md hover:bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)]/30 cursor-pointer transition-all"
          >
            <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
          </button>
        </div>
      )}

      {listElement}

      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 z-20 w-10 sm:w-12 flex items-center justify-end pr-1 bg-gradient-to-l from-[var(--md-sys-color-surface)] to-transparent pointer-events-none">
          <button
            type="button"
            onClick={() => scroll('right')}
            aria-label="Scroll tabs right"
            className="pointer-events-auto h-6 w-6 sm:h-7 sm:w-7 flex items-center justify-center rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] shadow-md hover:bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)]/30 cursor-pointer transition-all"
          >
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          </button>
        </div>
      )}
    </div>
  );
});
TabsList.displayName = TabsPrimitive.List.displayName;

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
    variant?: 'pills' | 'underline';
    size?: 'sm' | 'md';
  }
>(({ className, variant = 'pills', size = 'md', ...props }, ref) => {
  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 rounded-lg font-medium',
    md: 'text-xs sm:text-sm px-4 py-2 rounded-lg font-semibold',
  };

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] disabled:pointer-events-none disabled:opacity-50',
        variant === 'pills' && [
          sizeStyles[size],
          'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-highest)]/50',
          'data-[state=active]:bg-[var(--md-sys-color-surface-container-lowest)] dark:data-[state=active]:bg-[var(--md-sys-color-surface-container-lowest)] data-[state=active]:text-[var(--md-sys-color-on-surface)] data-[state=active]:shadow-xs',
        ],
        variant === 'underline' && [
          'py-3 text-sm font-medium border-b-2 border-transparent -mb-px text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] transition-all',
          'data-[state=active]:border-[var(--md-sys-color-primary)] data-[state=active]:text-[var(--md-sys-color-primary)] data-[state=active]:font-bold',
        ],
        className,
      )}
      {...props}
    />
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] animate-in fade-in-50 duration-150',
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;
