/**
 * Sandbox bank & VietQR account info — single source of truth (WS1/WS3 SC-03).
 *
 * Every VietQR panel (Booking, Renewal, My-Units, Sandbox checkout) previously
 * hard-coded the same beneficiary bank / account / holder in 5+ places. Those
 * literals are consolidated here so a change happens in one spot.
 *
 * NOTE: these are demo/Sandbox values. When a real PayOS webhook returns the
 * live account (checkoutData.accountNumber / bankName / accountName), the UI
 * still prefers the server value — this module only supplies the fallback.
 * Ideally the backend should return them via config instead (see plan BE-2).
 */

/** VietQR "bin" — MB Bank (Ngân hàng Quân Đội). */
export const VIETQR_BANK_BIN = '970422';

/** Beneficiary account number (Sandbox), spaced — for on-screen display. */
export const BANK_ACCOUNT_NUMBER = '0888 567 999';

/** Unspaced variant — for clipboard copy & VietQR image URL. */
export const BANK_ACCOUNT_NUMBER_PLAIN = BANK_ACCOUNT_NUMBER.replace(/\s/g, '');

/** Display-only bank name. */
export const BANK_NAME = 'MB Bank (Ngân hàng Quân Đội)';

/** Account holder (Sandbox). */
export const ACCOUNT_HOLDER = 'CONG TY CP SMARTSTORAGE VIETNAM';

/** Build a compact VietQR image URL when the server did not provide a QR code. */
export function buildVietQrImageUrl(
  amount: number,
  addInfo: string,
  accountName: string = 'SMARTSTORAGE',
): string {
  const account = BANK_ACCOUNT_NUMBER_PLAIN;
  return `https://img.vietqr.io/image/${VIETQR_BANK_BIN}-${account}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(
    addInfo,
  )}&accountName=${encodeURIComponent(accountName)}`;
}
