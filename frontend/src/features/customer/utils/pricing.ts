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

export function calculateBookingTotal(monthlyRate: number, months: number): PricingCalculationResult {
  const safeRate = Math.max(0, monthlyRate);
  const safeMonths = Math.max(1, months);

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

  // BR-DEP-01: Deposit is exactly 1 month of base monthly rate
  const depositAmount = Math.round(safeRate / 1000) * 1000;

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
