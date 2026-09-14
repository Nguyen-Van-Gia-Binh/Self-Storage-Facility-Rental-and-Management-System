/**
 * Utility functions for formatting currencies and dates
 * Quy ước tại docs/CONVENTIONS.md § 4.1
 */

/**
 * Định dạng số tiền sang chuẩn Việt Nam Đồng (VNĐ)
 * Ví dụ: 1500000 -> "1.500.000 ₫"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Định dạng ngày tháng sang chuẩn VN (DD/MM/YYYY)
 */
export function formatDate(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}
