/**
 * Module tính toán tài chính gia hạn hợp đồng (Renewal Pricing & Eligibility)
 * Bám sát BUSINESS-RULES.md:
 * - BR-REN-03: Kỳ hạn gia hạn từ 1 đến 12 tháng
 * - BR-REN-06: Gộp nợ quá hạn và phí phạt vào hóa đơn gia hạn
 * - BR-REN-07: Chính sách chiết khấu (>= 6 tháng giảm 5%, >= 12 tháng giảm 10%)
 * - BR-DEP-01: Bảo lưu tiền cọc, miễn thu thêm cọc
 */

export interface RenewalPricingInput {
  monthlyRent: number;
  renewalMonths: number;
  isOverdue?: boolean;
  overdueDays?: number;
  overdueFee?: number;
}

export interface RenewalPricingOutput {
  monthlyRent: number;
  renewalMonths: number;
  rawRent: number;
  discountRate: number; // 0, 0.05, 0.10
  discountAmount: number;
  netRent: number;
  overdueFee: number;
  extraDeposit: number;
  finalTotal: number;
}

/**
 * Tính toán biểu giá chi phí gia hạn minh bạch
 */
export function calculateRenewalPricing(input: RenewalPricingInput): RenewalPricingOutput {
  const { monthlyRent, renewalMonths, isOverdue = false, overdueDays = 0, overdueFee = 0 } = input;

  const rawRent = monthlyRent * renewalMonths;

  // BR-REN-07: Chiết khấu dài hạn
  let discountRate = 0;
  if (renewalMonths >= 12) {
    discountRate = 0.10; // Giảm 10%
  } else if (renewalMonths >= 6) {
    discountRate = 0.05; // Giảm 5%
  }

  const discountAmount = Math.round((rawRent * discountRate) / 1000) * 1000;
  const netRent = rawRent - discountAmount;

  // BR-REN-06: Gộp nợ & phí phạt quá hạn nếu có
  let calculatedOverdueFee = 0;
  if (isOverdue) {
    calculatedOverdueFee = overdueFee > 0 ? overdueFee : (overdueDays > 0 ? overdueDays * 50000 : 100000);
  }

  // BR-DEP-01: Không thu thêm tiền cọc bảo đảm
  const extraDeposit = 0;

  const finalTotal = netRent + calculatedOverdueFee + extraDeposit;

  return {
    monthlyRent,
    renewalMonths,
    rawRent,
    discountRate,
    discountAmount,
    netRent,
    overdueFee: calculatedOverdueFee,
    extraDeposit,
    finalTotal,
  };
}

/**
 * Tính ngày kết thúc hợp đồng mới (ISO format YYYY-MM-DD)
 */
export function calculateExtendedEndDate(baseEndDateStr: string, extensionMonths: number): string {
  const d = new Date(baseEndDateStr);
  d.setMonth(d.getMonth() + extensionMonths);
  return d.toISOString().split('T')[0];
}

/**
 * Tính số ngày còn lại đến khi hết hạn (âm nếu đã quá hạn)
 */
export function calculateDaysRemaining(endDateStr: string): number {
  try {
    const end = new Date(endDateStr);
    const now = new Date();
    end.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}
