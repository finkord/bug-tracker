import { useState, useEffect, useCallback } from 'react';
import { isEditingText } from './useGlobalKeyboardShortcuts';

export interface UseListKeyboardNavigationOptions<T extends { id: number }> {
  items: T[];
  onOpenItem?: (item: T) => void;
  enabled?: boolean;
}

export interface UseListKeyboardNavigationReturn<T> {
  focusedIndex: number;
  focusedItem: T | null;
  focusedId: number | null;
  setFocusedIndex: (index: number) => void;
  setFocusedId: (id: number | null) => void;
}

/**
 * High-velocity J/K list keyboard navigation hook (Linear & Vim pattern).
 * - 'J': move focus to the next issue
 * - 'K': move focus to the previous issue
 * - 'Enter' or 'O': open the focused issue details
 * - 'Space': toggle preview / open issue
 */
export function useListKeyboardNavigation<T extends { id: number }>({
  items,
  onOpenItem,
  enabled = true,
}: UseListKeyboardNavigationOptions<T>): UseListKeyboardNavigationReturn<T> {
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  // Keep focusedIndex clamped within valid bounds if items list shrinks
  useEffect(() => {
    if (items.length === 0) {
      setFocusedIndex(-1);
    } else if (focusedIndex >= items.length) {
      setFocusedIndex(items.length - 1);
    }
  }, [items.length, focusedIndex]);

  const focusedItem = focusedIndex >= 0 && focusedIndex < items.length ? items[focusedIndex] : null;
  const focusedId = focusedItem ? focusedItem.id : null;

  const setFocusedId = useCallback(
    (id: number | null) => {
      if (id === null) {
        setFocusedIndex(-1);
        return;
      }
      const idx = items.findIndex((item) => item.id === id);
      setFocusedIndex(idx);
    },
    [items],
  );

  useEffect(() => {
    if (!enabled || items.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditingText(e)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = prev < items.length - 1 ? prev + 1 : prev;
          return next;
        });
        return;
      }

      if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = prev > 0 ? prev - 1 : 0;
          return next;
        });
        return;
      }

      if (e.key === 'Enter' || e.key === 'o' || e.key === 'O' || e.key === ' ') {
        if (focusedIndex >= 0 && focusedIndex < items.length) {
          e.preventDefault();
          onOpenItem?.(items[focusedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, items, focusedIndex, onOpenItem]);

  return {
    focusedIndex,
    focusedItem,
    focusedId,
    setFocusedIndex,
    setFocusedId,
  };
}
