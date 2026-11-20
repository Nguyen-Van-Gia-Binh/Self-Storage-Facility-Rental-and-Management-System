/**
 * cancellationPolicy.ts — Tính toán hoàn tiền & phạt cọc theo chính sách 3 tầng phân cấp Airbnb
 * Tuân thủ tuyệt đối các quy tắc nghiệp vụ BR-CAN-01, BR-CAN-02, BR-CAN-03, BR-CAN-04, BR-CAN-08.
 * Người thực hiện: Nguyễn Phạm Xuân Nhi (Frontend Lead — WS2)
 */

import type { ActivePolicyInfo } from '@/types';

export interface CancellationParams {
  startDateStr?: string | null;
  createdAtStr?: string | null;
  depositAmount: number;
  monthlyRent: number;
  rentalMonths: number;
  now?: Date;
  policy?: Partial<ActivePolicyInfo> | null;
}

export type CancellationTierType =
  | 'EARLY_FULL'        // Hủy sớm trước >= 7 ngày (hoàn 100% cọc + 100% tiền thuê)
  | 'MID_PARTIAL'       // Hủy trước 2 - 6 ngày (phạt 50% cọc, hoàn 100% tiền thuê)
  | 'LATE_NO_DEPOSIT';  // Hủy sát giờ < 48h (phạt 100% cọc, hoàn 100% tiền thuê)

export interface CancellationCalculation {
  tier: CancellationTierType;
  tierName: string;
  tierBadge: string;
  daysUntilStart: number;
  heldDays: number;
  isWithin48hAfterPayment: boolean;
  depositAmount: number;
  depositRefund: number;
  depositPenalty: number;
  rentalFee: number;
  rentCharged: number;
  refundableRentalFee: number;
  totalRefund: number;
  explanation: string;
}

export function calculateCancellationRefund(params: CancellationParams): CancellationCalculation {
  const {
    startDateStr,
    depositAmount = 0,
    monthlyRent = 0,
    rentalMonths = 1,
    now = new Date(),
  } = params;

  const cleanStartDate = (startDateStr || '').slice(0, 10);
  const startDateTime = cleanStartDate ? new Date(cleanStartDate + 'T00:00:00') : new Date();

  // Chuẩn hóa mốc 00:00:00 tính số ngày
  const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startZero = new Date(startDateTime.getFullYear(), startDateTime.getMonth(), startDateTime.getDate());

  const heldDays = 0;

  // Số ngày còn lại đến ngày bắt đầu nhận kho (nếu > 0 là trước ngày nhận kho)
  const daysUntilStart = Math.ceil((startZero.getTime() - todayZero.getTime()) / (1000 * 60 * 60 * 24));

  const isWithin48hAfterPayment = false;

  const totalRentalFee = monthlyRent * rentalMonths;

  let tier: CancellationTierType;
  let tierName: string;
  let tierBadge: string;
  let depositRefund: number;
  let depositPenalty: number;
  const rentCharged = 0;
  const refundableRentalFee = totalRentalFee;
  let explanation: string;

  const fullRefundDays = params.policy?.cancelFullRefundDays ?? 7;
  const midRefundRate = params.policy?.cancelMidRefundRate ?? 0.5;
  const lateHours = params.policy?.cancelFullRefundHours ?? 48;
  const lateRefundRate = params.policy?.cancelLateRefundRate ?? 0;
  const lateDays = Math.ceil(lateHours / 24);

  // 1. Hủy sớm (trước >= fullRefundDays ngày) — BR-CAN-01
  if (daysUntilStart >= fullRefundDays) {
    tier = 'EARLY_FULL';
    depositRefund = depositAmount;
    depositPenalty = 0;
    tierName = `Hủy sớm (trước ≥ ${fullRefundDays} ngày)`;
    tierBadge = 'Hoàn 100% Cọc & Tiền thuê';
    explanation = '';
  }
  // 2. Hủy trước lateDays – (fullRefundDays - 1) ngày — BR-CAN-02
  else if (daysUntilStart >= lateDays) {
    tier = 'MID_PARTIAL';
    depositRefund = Math.round(depositAmount * midRefundRate);
    depositPenalty = depositAmount - depositRefund;
    const penaltyPct = Math.round((1 - midRefundRate) * 100);
    tierName = `Hủy trước ${daysUntilStart} ngày`;
    tierBadge = `Phạt ${penaltyPct}% cọc`;
    explanation = '';
  }
  // 3. Hủy sát giờ (< lateHours giờ) — BR-CAN-03
  else {
    tier = 'LATE_NO_DEPOSIT';
    depositRefund = Math.round(depositAmount * lateRefundRate);
    depositPenalty = depositAmount - depositRefund;
    const penaltyPct = Math.round((1 - lateRefundRate) * 100);
    tierName = `Hủy sát giờ (dưới ${lateHours} giờ)`;
    tierBadge = penaltyPct === 100 ? 'Phạt 100% cọc' : `Phạt ${penaltyPct}% cọc`;
    explanation = '';
  }

  const totalRefund = refundableRentalFee + depositRefund;

  return {
    tier,
    tierName,
    tierBadge,
    daysUntilStart,
    heldDays,
    isWithin48hAfterPayment,
    depositAmount,
    depositRefund,
    depositPenalty,
    rentalFee: totalRentalFee,
    rentCharged,
    refundableRentalFee,
    totalRefund,
    explanation,
  };
}

