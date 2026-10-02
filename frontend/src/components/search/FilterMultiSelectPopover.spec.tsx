import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterMultiSelectPopover, type FilterMultiSelectOption } from './FilterMultiSelectPopover';

const MOCK_OPTIONS: FilterMultiSelectOption[] = [
  { value: 'BUG', label: 'Bug' },
  { value: 'TASK', label: 'Task' },
  { value: 'FEATURE', label: 'Feature' },
];

describe('FilterMultiSelectPopover Component', () => {
  it('renders trigger button with label and selected count badge when items are selected', () => {
    const { rerender } = render(
      <FilterMultiSelectPopover
        label="Types"
        options={MOCK_OPTIONS}
        selectedValues={[]}
        onSelectionChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /types filter, 0 selected/i })).toBeDefined();

    rerender(
      <FilterMultiSelectPopover
        label="Types"
        options={MOCK_OPTIONS}
        selectedValues={['BUG', 'TASK']}
        onSelectionChange={vi.fn()}
      />,
    );

    expect(screen.getByText('2')).toBeDefined();
  });

  it('opens popover and allows toggling options and selecting all', () => {
    const onSelectionChange = vi.fn();

    render(
      <FilterMultiSelectPopover
        label="Types"
        options={MOCK_OPTIONS}
        selectedValues={['BUG']}
        onSelectionChange={onSelectionChange}
      />,
    );

    const trigger = screen.getByRole('button', { name: /types filter/i });
    fireEvent.click(trigger);

    // Click 'Task' option to toggle it
    const taskOption = screen.getByText('Task');
    fireEvent.click(taskOption);
    expect(onSelectionChange).toHaveBeenCalledWith(['BUG', 'TASK']);

    // Click 'Select All'
    const selectAllBtn = screen.getByRole('button', { name: /select all/i });
    fireEvent.click(selectAllBtn);
    expect(onSelectionChange).toHaveBeenCalledWith(['BUG', 'TASK', 'FEATURE']);

    // Click 'Clear'
    const clearBtn = screen.getByRole('button', { name: /clear/i });
    fireEvent.click(clearBtn);
    expect(onSelectionChange).toHaveBeenCalledWith([]);
  });

  it('filters option list when searching', () => {
    render(
      <FilterMultiSelectPopover
        label="Types"
        options={MOCK_OPTIONS}
        selectedValues={[]}
        onSelectionChange={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /types filter/i }));

    const searchInput = screen.getByPlaceholderText('Search options...');
    fireEvent.change(searchInput, { target: { value: 'feat' } });

    expect(screen.getByText('Feature')).toBeDefined();
    expect(screen.queryByText('Bug')).toBeNull();
  });
});
