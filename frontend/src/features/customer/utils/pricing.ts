/**
 * Pricing and billing calculation utility for SmartStorage Customer Portal
 * Business Rules:
 * - BR-DEP-01: Security deposit equals exactly 1 month of base rent.
 * - BR-GEN-04: All currency amounts rounded to whole 1,000 VND.
 * - Discount policy: 3 months (0%), 6 months (5% off rent), 12 months (10% off rent).
 */

export interface PricingCalculationResult {
  monthlyRate: number;
  months: number;
  rawRentTotal: number;
  discountPercentage: number;
  discountAmount: number;
  finalRentTotal: number;
  depositAmount: number;
  totalDueToday: number;
  surcharges?: { name: string; amount: number }[];
}

export function calculateBookingTotal(
  monthlyRate: number,
  months: number,
  depositMultiplier: number = 1
): PricingCalculationResult {
  const safeRate = Math.max(0, monthlyRate);
  const safeMonths = Math.max(1, months);
  const safeMultiplier = Math.max(0, depositMultiplier);

  const rawRentTotal = safeRate * safeMonths;

  // Discount rules
  let discountPercentage = 0;
  if (safeMonths >= 12) {
    discountPercentage = 0.10; // 10% discount for 1 year
  } else if (safeMonths >= 6) {
    discountPercentage = 0.05; // 5% discount for 6 months
  }

  const discountAmount = Math.round((rawRentTotal * discountPercentage) / 1000) * 1000;
  const finalRentTotal = rawRentTotal - discountAmount;

  // BR-DEP-01: Deposit is depositMultiplier × base monthly rate (rounded to 1,000 VND per BR-GEN-04)
  const depositAmount = Math.round((safeRate * safeMultiplier) / 1000) * 1000;

  // Total due today includes first rent period + security deposit
  const totalDueToday = finalRentTotal + depositAmount;

  return {
    monthlyRate: safeRate,
    months: safeMonths,
    rawRentTotal,
    discountPercentage,
    discountAmount,
    finalRentTotal,
    depositAmount,
    totalDueToday,
  };
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function normalizeDiscountPercent(rawRate?: number | null): number {
  if (!rawRate || rawRate <= 0) return 0;
  if (rawRate <= 1) {
    return Math.round(rawRate * 100);
  }
  return Math.round(rawRate);
}

