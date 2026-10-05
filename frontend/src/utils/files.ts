/**
 * Standard file formatting and validation utilities for BugTracker.
 */

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const normalizedIndex = Math.min(i, sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, normalizedIndex)).toFixed(dm))} ${sizes[normalizedIndex]}`;
}

export function isValidFileSize(file: File, maxMb = 5): boolean {
  return file.size <= maxMb * 1024 * 1024;
}

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

export function isAllowedImage(file: File): boolean {
  return ALLOWED_IMAGE_TYPES.includes(file.type);
}
