import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

export interface VirtualListProps<T> {
  readonly items: readonly T[];
  readonly estimateSize: number;
  readonly height: number | string;
  readonly renderItem: (item: T, index: number) => React.ReactNode;
  readonly overscan?: number;
  readonly className?: string;
  readonly emptyMessage?: string;
}

/**
 * High-performance virtualized list component using TanStack Virtual.
 * Renders only the visible rows to maintain 60 FPS scrolling for large datasets.
 */
export function VirtualList<T>({
  items,
  estimateSize,
  height,
  renderItem,
  overscan = 5,
  className = '',
  emptyMessage = 'No items found',
}: VirtualListProps<T>): React.JSX.Element {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
    initialRect: {
      width: 1000,
      height: typeof height === 'number' ? height : 600,
    },
  });

  if (items.length === 0) {
    return (
      <div
        className={`flex items-center justify-center p-8 text-sm text-[var(--color-surface-dim)] ${className}`}
        style={{ height }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className={`overflow-auto ${className}`}
      style={{ height }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {renderItem(items[virtualRow.index], virtualRow.index)}
          </div>
        ))}
      </div>
    </div>
  );
}
