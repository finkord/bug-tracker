import * as argon2 from 'argon2';

/**
 * OWASP and RFC 9106 recommended parameters for Argon2id in high-concurrency Node.js web services.
 *
 * Parameters rationale:
 * - type: Argon2id (hybrid variant offering optimal resistance against side-channel and GPU cracking).
 * - memoryCost: 19456 KiB (19 MiB) per OWASP Password Storage Cheat Sheet.
 * - timeCost: 2 (2 iterations provide robust security while keeping compute time sub-100ms).
 * - parallelism: 1 (CRITICAL: 1 lane consumes exactly 1 libuv worker thread instead of all 4 threads
 *   in UV_THREADPOOL_SIZE=4, preventing Event Loop and I/O starvation under concurrent load).
 * - raw: false (returns standard encoded string format $argon2id$v=... for database storage).
 */
export const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
  raw: false,
} as const;
