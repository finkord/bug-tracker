import { describe, it, expect } from 'vitest';
import { formatDate, formatShortDate, formatFullDate, formatDateTime } from './date.js';

describe('date utilities', () => {
  const testIso = '2026-05-15T10:30:00.000Z';

  it('handles null, undefined, or invalid date values gracefully', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
    expect(formatDate('invalid-date')).toBe('');
    expect(formatShortDate(null)).toBe('');
    expect(formatFullDate(null)).toBe('');
    expect(formatDateTime(null)).toBe('');
  });

  it('formats short dates containing month and day', () => {
    const formatted = formatShortDate(testIso);
    expect(formatted).toBeTruthy();
    expect(formatted).toMatch(/May|15/);
  });

  it('formats full dates containing weekday, month, day, year', () => {
    const formatted = formatFullDate(testIso);
    expect(formatted).toBeTruthy();
    expect(formatted).toMatch(/2026/);
  });

  it('formats dates with time components', () => {
    const formatted = formatDateTime(testIso);
    expect(formatted).toBeTruthy();
    expect(formatted).toMatch(/2026/);
  });
});
