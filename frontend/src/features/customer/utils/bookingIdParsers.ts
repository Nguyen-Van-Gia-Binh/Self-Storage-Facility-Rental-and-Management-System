/**
 * Booking id helpers — WS1 (SC-02).
 * Feature-local types keep `id` as a string (e.g. from a router query), but the
 * backend APIs expect numeric ids. This one helper is the single place that
 * converts between the two, so pages don't each repeat the regex-parse.
 */

/**
 * Parse a router query value or entity id into the positive numeric id the
 * backend expects, or fall back when it is missing / not numeric.
 *
 * Handles plain ids ("12") and prefixed codes ("UT-12") by taking the first
 * run of digits. Returns `fallback` when the input is empty or has no digits.
 */
export function toPositiveNumber(
  value: string | number | null | undefined,
  fallback?: number,
): number | undefined {
  if (value == null || value === '') return fallback;
  const raw = typeof value === 'number' ? String(value) : value;
  const match = raw.match(/\d+/);
  if (!match) return fallback;
  const parsed = parseInt(match[0], 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
