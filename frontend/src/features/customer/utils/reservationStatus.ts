/**
 * Reservation status helpers — WS1 (SC-02/03, BR-RES-02, BR-DEP-03).
 *
 * The backend `ReservationStatus` enum has exactly 6 values:
 *   PENDING_PAYMENT | CONFIRMED | FULFILLED | EXPIRED | CANCELLED | NO_SHOW
 *
 * Historically the frontend also compared against `rsv.status === 'ACTIVE'`
 * and `'PAID'`, which never exist in that enum — dead branches that made it
 * hard to tell which value actually meant "paid / ready to move in". These
 * helpers are the single source of truth for the comparisons.
 */
import type { ReservationResponse } from '@/api/reservation';

/** True once a reservation has been paid and confirmed (the backend "paid" state). */
export function isReservationPaid(status: string | undefined | null): boolean {
  return status === 'CONFIRMED' || status === 'FULFILLED';
}

/** True when a reservation is no longer actionable (cancelled, expired, or no-show). */
export function isReservationClosed(status: string | undefined | null): boolean {
  return status === 'CANCELLED' || status === 'EXPIRED' || status === 'NO_SHOW';
}

/**
 * Among a customer's reservations, find the one that still holds a live
 * 48-hour payment window: `PENDING_PAYMENT` and not yet past `holdExpiresAt`.
 * This is the BR-RES-02 "only one open hold" rule, shared by the page-load
 * guard and the create-reservation error handler.
 */
export function findActivePendingReservation(
  reservations: Pick<ReservationResponse, 'status' | 'holdExpiresAt'>[] | null | undefined,
): Pick<ReservationResponse, 'status' | 'holdExpiresAt'> | undefined {
  if (!reservations) return undefined;
  const now = Date.now();
  return reservations.find((r) => {
    if (r.status !== 'PENDING_PAYMENT') return false;
    if (!r.holdExpiresAt) return true;
    return new Date(r.holdExpiresAt).getTime() > now;
  });
}
