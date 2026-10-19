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
