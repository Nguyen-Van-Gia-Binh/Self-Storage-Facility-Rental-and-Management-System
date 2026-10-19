import { describe, it, expect } from 'vitest';

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
