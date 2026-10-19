import { describe, it, expect } from 'vitest';
import { normalizeDiscountPercent } from '../../utils/pricing';


export function formatDiscountLabel(name?: string | null, percent?: number): string {
  if (name && percent && percent > 0) {
    return `${name} (-${percent}%):`;
  }
  if (name) {
    return `${name}:`;
  }
  if (percent && percent > 0) {
    return `Chiết khấu (-${percent}%):`;
  }
  return 'Chiết khấu:';
}

describe('normalizeDiscountPercent', () => {
  it('chuyển đổi đúng decimal ratio 0.5 thành 50%', () => {
    expect(normalizeDiscountPercent(0.5)).toBe(50);
  });

  it('chuyển đổi đúng decimal ratio 1.0 thành 100%', () => {
    expect(normalizeDiscountPercent(1.0)).toBe(100);
  });

  it('chuyển đổi đúng decimal ratio 0.05 thành 5%', () => {
    expect(normalizeDiscountPercent(0.05)).toBe(5);
  });

  it('giữ nguyên nếu giá trị đã ở dạng phần trăm (ví dụ 50)', () => {
    expect(normalizeDiscountPercent(50)).toBe(50);
  });

  it('trả về 0 khi giá trị null/undefined/0', () => {
    expect(normalizeDiscountPercent(0)).toBe(0);
    expect(normalizeDiscountPercent(null)).toBe(0);
  });
});

describe('InvoiceDiscountDisplay formatting', () => {
  it('hiển thị đầy đủ tên chương trình và phần trăm giảm giá khi có cả hai', () => {
    expect(formatDiscountLabel('Test', 50)).toBe('Test (-50%):');
    expect(formatDiscountLabel('Ưu đãi 6 tháng', 5)).toBe('Ưu đãi 6 tháng (-5%):');
  });

  it('chỉ hiển thị tên khi không có tỷ lệ phần trăm (giảm tiền cố định)', () => {
    expect(formatDiscountLabel('Voucher 500k', 0)).toBe('Voucher 500k:');
  });

  it('hiển thị nhãn mặc định khi không có tên chương trình', () => {
    expect(formatDiscountLabel(null, 10)).toBe('Chiết khấu (-10%):');
  });
});
