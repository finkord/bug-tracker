import { describe, it, expect } from 'vitest';
import { formatBytes, isValidFileSize, isAllowedImage } from './files.js';

describe('files utilities', () => {
  it('formats zero or negative bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(-10)).toBe('0 B');
  });

  it('formats bytes, kilobytes, and megabytes accurately', () => {
    expect(formatBytes(500)).toBe('500 B');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1024 * 1024)).toBe('1 MB');
    expect(formatBytes(1.5 * 1024 * 1024)).toBe('1.5 MB');
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
  });

  it('validates file sizes with default 5MB threshold', () => {
    const smallFile = new File(['hello'], 'test.png', { type: 'image/png' });
    expect(isValidFileSize(smallFile)).toBe(true);

    const largeFile = { size: 6 * 1024 * 1024 } as File;
    expect(isValidFileSize(largeFile)).toBe(false);

    const customThresholdFile = { size: 9 * 1024 * 1024 } as File;
    expect(isValidFileSize(customThresholdFile, 10)).toBe(true);
  });

  it('validates permitted image MIME types', () => {
    const png = new File([''], 'a.png', { type: 'image/png' });
    const jpeg = new File([''], 'a.jpg', { type: 'image/jpeg' });
    const webp = new File([''], 'a.webp', { type: 'image/webp' });
    const pdf = new File([''], 'doc.pdf', { type: 'application/pdf' });

    expect(isAllowedImage(png)).toBe(true);
    expect(isAllowedImage(jpeg)).toBe(true);
    expect(isAllowedImage(webp)).toBe(true);
    expect(isAllowedImage(pdf)).toBe(false);
  });
});
