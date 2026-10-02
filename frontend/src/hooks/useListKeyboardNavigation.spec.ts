import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useListKeyboardNavigation } from './useListKeyboardNavigation';

describe('useListKeyboardNavigation', () => {
  const mockItems = [
    { id: 101, title: 'First Task' },
    { id: 102, title: 'Second Task' },
    { id: 103, title: 'Third Task' },
  ];

  it('navigates through items using J and K', () => {
    const { result } = renderHook(() =>
      useListKeyboardNavigation({
        items: mockItems,
        enabled: true,
      }),
    );

    expect(result.current.focusedIndex).toBe(-1);
    expect(result.current.focusedItem).toBeNull();

    // Press 'j' -> moves to index 0
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'j', bubbles: true }));
    });
    expect(result.current.focusedIndex).toBe(0);
    expect(result.current.focusedItem).toEqual(mockItems[0]);

    // Press 'j' -> moves to index 1
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'j', bubbles: true }));
    });
    expect(result.current.focusedIndex).toBe(1);
    expect(result.current.focusedItem).toEqual(mockItems[1]);

    // Press 'k' -> moves back to index 0
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', bubbles: true }));
    });
    expect(result.current.focusedIndex).toBe(0);
    expect(result.current.focusedItem).toEqual(mockItems[0]);
  });

  it('triggers onOpenItem when pressing Enter or O on focused item', () => {
    const onOpenItem = vi.fn();
    const { result } = renderHook(() =>
      useListKeyboardNavigation({
        items: mockItems,
        onOpenItem,
        enabled: true,
      }),
    );

    // Focus first item
    act(() => {
      result.current.setFocusedIndex(1);
    });

    // Press Enter
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });
    expect(onOpenItem).toHaveBeenCalledTimes(1);
    expect(onOpenItem).toHaveBeenCalledWith(mockItems[1]);

    // Press 'o'
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'o', bubbles: true }));
    });
    expect(onOpenItem).toHaveBeenCalledTimes(2);
    expect(onOpenItem).toHaveBeenCalledWith(mockItems[1]);
  });
});
