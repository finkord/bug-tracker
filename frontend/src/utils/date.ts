/**
 * Standard date formatting utilities for BugTracker.
 */

export function formatDate(
  value: string | number | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!value) return '';
  const date = typeof value === 'object' ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, options);
}

export function formatShortDate(value: string | number | Date | null | undefined): string {
  return formatDate(value, { month: 'short', day: 'numeric' });
}

export function formatFullDate(value: string | number | Date | null | undefined): string {
  return formatDate(value, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(value: string | number | Date | null | undefined): string {
  if (!value) return '';
  const date = typeof value === 'object' ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
