import { describe, it, expect } from 'vitest';

export interface DiscountRule {
  minRentalMonths: number;
  discountType: 'PERCENT' | 'AMOUNT';
  discountValue: number;
}

export function getBestDealBadge(months: number, rules: DiscountRule[]): string | null {
  const eligible = rules.filter((r) => r.minRentalMonths <= months);
  if (eligible.length === 0) return null;
  const percentRules = eligible.filter((r) => r.discountType === 'PERCENT');
  if (percentRules.length > 0) {
    const maxVal = Math.max(...percentRules.map((r) => r.discountValue));
    return `-${maxVal}%`;
  }
  return 'Ưu đãi';
}

describe('DurationSelector deal badges', () => {
  const rules: DiscountRule[] = [
    { minRentalMonths: 6, discountType: 'PERCENT', discountValue: 5 },
    { minRentalMonths: 10, discountType: 'PERCENT', discountValue: 50 },
    { minRentalMonths: 12, discountType: 'PERCENT', discountValue: 10 },
  ];

  it('không gắn badge cho các tháng dưới ngưỡng tối thiểu (1, 3 tháng)', () => {
    expect(getBestDealBadge(1, rules)).toBeNull();
    expect(getBestDealBadge(3, rules)).toBeNull();
  });

  it('gắn đúng badge tốt nhất khi đạt 6 tháng (-5%)', () => {
    expect(getBestDealBadge(6, rules)).toBe('-5%');
  });

  it('chọn deal cao nhất khi đạt 10 tháng (-50%)', () => {
    expect(getBestDealBadge(10, rules)).toBe('-50%');
  });

  it('vẫn giữ deal tốt nhất khi chọn mốc cao hơn (12 tháng vẫn áp dụng -50% nếu lớn hơn 10%)', () => {
    expect(getBestDealBadge(12, rules)).toBe('-50%');
  });
});
