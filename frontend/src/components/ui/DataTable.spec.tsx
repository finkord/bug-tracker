import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from './DataTable';

interface TestItem {
  id: number;
  title: string;
  category: string;
}

const testData: TestItem[] = [
  { id: 1, title: 'First Issue', category: 'Bug' },
  { id: 2, title: 'Second Feature', category: 'Feature' },
  { id: 3, title: 'Third Task', category: 'Task' },
];

const testColumns: ColumnDef<TestItem>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    enableSorting: true,
  },
  {
    accessorKey: 'title',
    header: 'Title',
    enableSorting: true,
  },
  {
    accessorKey: 'category',
    header: 'Category',
  },
];

describe('DataTable Component', () => {
  it('renders columns and data rows correctly', () => {
    render(<DataTable columns={testColumns} data={testData} />);

    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();

    expect(screen.getByText('First Issue')).toBeInTheDocument();
    expect(screen.getByText('Second Feature')).toBeInTheDocument();
    expect(screen.getByText('Third Task')).toBeInTheDocument();
  });

  it('handles row click callbacks', () => {
    const handleRowClick = vi.fn();
    render(<DataTable columns={testColumns} data={testData} onRowClick={handleRowClick} />);

    fireEvent.click(screen.getByText('First Issue'));
    expect(handleRowClick).toHaveBeenCalledWith(testData[0]);
  });

  it('renders loading state when isLoading is true', () => {
    render(
      <DataTable
        columns={testColumns}
        data={[]}
        isLoading={true}
        loadingMessage="Fetching records..."
      />,
    );

    expect(screen.getByText('Fetching records...')).toBeInTheDocument();
  });

  it('renders empty state when data array is empty and not loading', () => {
    render(
      <DataTable
        columns={testColumns}
        data={[]}
        emptyTitle="Nothing here"
        emptyDescription="Please check back later."
      />,
    );

    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.getByText('Please check back later.')).toBeInTheDocument();
  });

  it('renders pagination controls and triggers page change', () => {
    const handlePageChange = vi.fn();
    const handlePageSizeChange = vi.fn();

    render(
      <DataTable
        columns={testColumns}
        data={testData}
        page={1}
        pageSize={10}
        total={30}
        totalPages={3}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />,
    );

    expect(screen.getByText('Showing 1 to 10 of 30 entries')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();

    const nextBtn = screen.getByRole('button', { name: /next page/i });
    fireEvent.click(nextBtn);
    expect(handlePageChange).toHaveBeenCalledWith(2);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '20' } });
    expect(handlePageSizeChange).toHaveBeenCalledWith(20);
  });

  it('triggers sorting callbacks when sortable header is clicked', () => {
    const handleSortingChange = vi.fn();

    render(
      <DataTable
        columns={testColumns}
        data={testData}
        sorting={[]}
        onSortingChange={handleSortingChange}
      />,
    );

    fireEvent.click(screen.getByText('Title'));
    expect(handleSortingChange).toHaveBeenCalled();
  });
});
