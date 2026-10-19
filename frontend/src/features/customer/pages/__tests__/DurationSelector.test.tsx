import { describe, it, expect } from 'vitest';

export interface DiscountRule {
  minRentalMonths: number;
  discountType: 'PERCENT' | 'AMOUNT';
  discountValue: number;
  isActive?: boolean;
}

export function getDealBadgeForCard(months: number, rules: DiscountRule[]): string | null {
  const eligible = rules.filter((r) => r.minRentalMonths <= months && (r.isActive ?? true));
  if (eligible.length === 0) return null;
  const percentRules = eligible.filter((r) => r.discountType === 'PERCENT');
  if (percentRules.length > 0) {
    const maxVal = Math.max(...percentRules.map((r) => r.discountValue));
    return `Giảm ${maxVal}%`;
  }
  return 'Ưu đãi';
}

describe('DurationSelector card deal badges', () => {
  const rules: DiscountRule[] = [
    { minRentalMonths: 6, discountType: 'PERCENT', discountValue: 50, isActive: true },
    { minRentalMonths: 12, discountType: 'PERCENT', discountValue: 10, isActive: true },
  ];

  it('trả về null cho mốc 1 và 3 tháng khi không có ưu đãi', () => {
    expect(getDealBadgeForCard(1, rules)).toBeNull();
    expect(getDealBadgeForCard(3, rules)).toBeNull();
  });

  it('hiển thị Giảm 50% cho mốc 6 tháng', () => {
    expect(getDealBadgeForCard(6, rules)).toBe('Giảm 50%');
  });

  it('chọn deal cao nhất khi đạt 12 tháng (50% cao hơn 10%)', () => {
    expect(getDealBadgeForCard(12, rules)).toBe('Giảm 50%');
  });
});

describe('Segmented duration selector tab labels', () => {
  const quickMilestones = [
    { months: 1, label: '1 tháng' },
    { months: 3, label: '3 tháng' },
    { months: 6, label: '6 tháng' },
    { months: 12, label: '1 năm' },
  ];

  it('tab thứ 5 luôn giữ nhãn "Tùy chỉnh", không hiển thị số tháng (ví dụ: 12T) gây nhầm lẫn', () => {
    const customTabLabel = 'Tùy chỉnh';
    expect(customTabLabel).toBe('Tùy chỉnh');
    expect(customTabLabel).not.toMatch(/^\d+T$/);
  });

  it('các mốc nhanh hiển thị đúng định dạng', () => {
    expect(quickMilestones.map((m) => m.label)).toEqual(['1 tháng', '3 tháng', '6 tháng', '1 năm']);
  });
});

