import React, { useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type OnChangeFn,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowUp, ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight, Loader2, Inbox } from 'lucide-react';
import { cn } from '../../utils/cn';
import { EmptyState } from './EmptyState';

export interface DataTableProps<TData, TValue = unknown> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  getRowId?: (row: TData, index: number) => string;

  // Sorting
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;

  // Pagination (1-indexed for standard API compatibility)
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];

  // Row Interactions
  onRowClick?: (row: TData) => void;
  onRowContextMenu?: (e: React.MouseEvent, row: TData) => void;
  selectedRowId?: string | number | null;
  isRowSelected?: (row: TData) => boolean;

  // States
  isLoading?: boolean;
  loadingMessage?: string;
  emptyState?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;

  // Virtualization
  virtualize?: boolean;
  estimateRowHeight?: number;
  maxHeight?: string | number;

  // Styling
  className?: string;
  tableClassName?: string;
  headerClassName?: string;
  rowClassName?: (row: TData, index: number) => string;
}

const DEFAULT_EMPTY_SORTING: SortingState = [];

export function DataTable<TData, TValue = unknown>({
  columns,
  data,
  getRowId,
  sorting,
  onSortingChange,
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  onRowClick,
  onRowContextMenu,
  selectedRowId,
  isRowSelected,
  isLoading = false,
  loadingMessage = 'Loading data...',
  emptyState,
  emptyTitle = 'No data available',
  emptyDescription = 'There are no items to display right now.',
  virtualize = false,
  estimateRowHeight = 44,
  maxHeight = 600,
  className,
  tableClassName,
  headerClassName,
  rowClassName,
}: DataTableProps<TData, TValue>) {
  const [internalSorting, setInternalSorting] = React.useState<SortingState>(DEFAULT_EMPTY_SORTING);
  const activeSorting = sorting ?? internalSorting;
  const isServerSorting = Boolean(onSortingChange);
  const handleSortingChange = onSortingChange ?? setInternalSorting;

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: activeSorting,
    },
    onSortingChange: handleSortingChange,
    getCoreRowModel: getCoreRowModel(),
    ...(isServerSorting ? { manualSorting: true } : { getSortedRowModel: getSortedRowModel() }),
    getRowId: getRowId ? (row, index) => getRowId(row, index) : undefined,
  });

  const { rows } = table.getRowModel();
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateRowHeight,
    overscan: 10,
    enabled: virtualize,
  });

  const calculatedTotalPages =
    totalPages ??
    (total !== undefined && pageSize !== undefined && pageSize > 0
      ? Math.max(1, Math.ceil(total / pageSize))
      : 1);

  const currentPage = page ?? 1;

  const renderSortIndicator = (canSort: boolean, isSorted: false | 'asc' | 'desc') => {
    if (!canSort) return null;
    if (isSorted === 'asc') {
      return <ArrowUp className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] shrink-0" />;
    }
    if (isSorted === 'desc') {
      return <ArrowDown className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] shrink-0" />;
    }
    return (
      <ArrowUpDown className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)]/40 group-hover:text-[var(--md-sys-color-on-surface-variant)] shrink-0 transition-colors" />
    );
  };

  return (
    <div
      className={cn(
        'rounded-2xl border border-[var(--md-sys-color-outline-variant)]/40 bg-[var(--md-sys-color-surface)] overflow-hidden shadow-2xs flex flex-col',
        className,
      )}
    >
      <div
        ref={parentRef}
        className="overflow-x-auto w-full"
        style={virtualize ? { maxHeight, overflowY: 'auto' } : undefined}
      >
        <table className={cn('w-full text-left text-xs border-collapse', tableClassName)}>
          <thead
            className={cn(
              'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] font-bold border-b border-[var(--md-sys-color-outline-variant)]/40 select-none sticky top-0 z-10',
              headerClassName,
            )}
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const isSorted = header.column.getIsSorted();

                  return (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      onClick={header.column.getToggleSortingHandler()}
                      className={cn(
                        'py-3 px-4 transition-colors',
                        canSort && 'cursor-pointer hover:text-[var(--md-sys-color-on-surface)] group',
                      )}
                      style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                    >
                      <div className="flex items-center gap-1.5">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                        {renderSortIndicator(canSort, isSorted)}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]/30">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-[var(--md-sys-color-primary)] mx-auto mb-2" />
                  <p className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
                    {loadingMessage}
                  </p>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-8 text-center">
                  {emptyState ?? (
                    <EmptyState
                      icon={<Inbox className="w-8 h-8 opacity-40" />}
                      title={emptyTitle}
                      description={emptyDescription}
                    />
                  )}
                </td>
              </tr>
            ) : virtualize ? (
              <>
                {rowVirtualizer.getVirtualItems().length > 0 && (
                  <tr style={{ height: `${rowVirtualizer.getVirtualItems()[0]?.start ?? 0}px` }}>
                    <td colSpan={columns.length} style={{ padding: 0, border: 0 }} />
                  </tr>
                )}
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const row = rows[virtualRow.index];
                  const isSelected =
                    isRowSelected?.(row.original) ??
                    (selectedRowId !== undefined && selectedRowId !== null
                      ? String(row.id) === String(selectedRowId) ||
                        (row.original as { id?: string | number })?.id === selectedRowId
                      : false);

                  return (
                    <tr
                      key={row.id}
                      data-index={virtualRow.index}
                      onClick={() => onRowClick?.(row.original)}
                      onContextMenu={(e) => onRowContextMenu?.(e, row.original)}
                      className={cn(
                        'transition-colors',
                        onRowClick && 'cursor-pointer hover:bg-[var(--md-sys-color-surface-container-high)]/60',
                        isSelected && 'bg-[var(--md-sys-color-primary-container)]/30',
                        rowClassName?.(row.original, virtualRow.index),
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="py-2.5 px-4">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                {rowVirtualizer.getVirtualItems().length > 0 && (
                  <tr
                    style={{
                      height: `${
                        rowVirtualizer.getTotalSize() -
                        (rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1]?.end ?? 0)
                      }}px`,
                    }}
                  >
                    <td colSpan={columns.length} style={{ padding: 0, border: 0 }} />
                  </tr>
                )}
              </>
            ) : (
              rows.map((row, index) => {
                const isSelected =
                  isRowSelected?.(row.original) ??
                  (selectedRowId !== undefined && selectedRowId !== null
                    ? String(row.id) === String(selectedRowId) ||
                      (row.original as { id?: string | number })?.id === selectedRowId
                    : false);

                return (
                  <tr
                    key={row.id}
                    onClick={() => onRowClick?.(row.original)}
                    onContextMenu={(e) => onRowContextMenu?.(e, row.original)}
                    className={cn(
                      'transition-colors',
                      onRowClick && 'cursor-pointer hover:bg-[var(--md-sys-color-surface-container-high)]/60',
                      isSelected && 'bg-[var(--md-sys-color-primary-container)]/30',
                      rowClassName?.(row.original, index),
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="py-2.5 px-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {(onPageChange || onPageSizeChange || total !== undefined) && (
        <div className="py-2.5 px-4 bg-[var(--md-sys-color-surface-container)] border-t border-[var(--md-sys-color-outline-variant)]/40 text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] flex flex-wrap items-center justify-between gap-3 select-none">
          <span>
            {total !== undefined
              ? `Showing ${
                  total === 0 ? 0 : pageSize ? (currentPage - 1) * pageSize + 1 : 1
                } to ${pageSize ? Math.min(currentPage * pageSize, total) : total} of ${total} entries`
              : `Showing ${rows.length} ${rows.length === 1 ? 'entry' : 'entries'}`}
          </span>

          <div className="flex items-center gap-4">
            {onPageSizeChange && pageSize && (
              <div className="flex items-center gap-1.5">
                <span>Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
                  className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--md-sys-color-primary)] cursor-pointer"
                >
                  {pageSizeOptions.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {onPageChange && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="p-1 rounded-md border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--md-sys-color-surface-container-high)] transition cursor-pointer"
                  title="Previous page"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-1 text-xs">
                  Page {currentPage} of {calculatedTotalPages}
                </span>
                <button
                  type="button"
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage >= calculatedTotalPages}
                  className="p-1 rounded-md border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--md-sys-color-surface-container-high)] transition cursor-pointer"
                  title="Next page"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
