/**
 * Utility functions for formatting currencies and dates
 * Quy ước tại docs/CONVENTIONS.md § 4.1
 */

/**
 * Định dạng số tiền sang chuẩn Việt Nam Đồng (VNĐ)
 * Ví dụ: 1500000 -> "1.500.000 ₫"
 */
export function formatCurrency(amount: number): string {
  const value = Number(amount);
  if (!Number.isFinite(value)) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(0);
  }
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
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

/**
 * Định dạng phần trăm (ví dụ: 0.784 -> "78.4%")
 * Xử lý an toàn trường hợp chia cho 0 hoặc NaN theo US-BM-04.2 AC-4
 */
export function formatPercent(rate: number): string {
  if (rate === null || rate === undefined || isNaN(rate) || !isFinite(rate)) {
    return 'Không xác định';
  }
  return `${(rate * 100).toFixed(1)}%`;
}

/**
 * Định dạng chuỗi YYYY-MM sang dạng hiển thị tiếng Việt (ví dụ: "2026-10" -> "Tháng 10/2026")
 */
export function formatMonthYear(monthStr: string): string {
  if (!monthStr || !monthStr.includes('-')) return monthStr;
  const [year, month] = monthStr.split('-');
  return `Tháng ${parseInt(month, 10)}/${year}`;
}

/**
 * Tạo và kích hoạt tải về tệp tin Blob trên trình duyệt
 */
export function downloadBlobFile(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

/**
 * Tạo Blob file CSV có gắn UTF-8 BOM (\uFEFF) giúp Microsoft Excel hiển thị đúng tiếng Việt có dấu
 */
export function generateCsvFromData(headers: string[], rows: (string | number)[][]): Blob {
  const escapeCell = (val: string | number): string => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = headers.map(escapeCell).join(',');
  const bodyLines = rows.map((row) => row.map(escapeCell).join(',')).join('\n');
  const csvContent = `\uFEFF${headerLine}\n${bodyLines}`;

  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}
