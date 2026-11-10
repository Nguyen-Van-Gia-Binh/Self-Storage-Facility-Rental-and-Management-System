/**
 * cancellationPolicy.ts — Tính toán hoàn tiền & phạt cọc theo chính sách 3 tầng phân cấp Airbnb
 * Tuân thủ tuyệt đối các quy tắc nghiệp vụ BR-CAN-01, BR-CAN-02, BR-CAN-03, BR-CAN-04, BR-CAN-08.
 * Người thực hiện: Nguyễn Phạm Xuân Nhi (Frontend Lead — WS2)
 */

export interface CancellationParams {
  startDateStr?: string | null;
  createdAtStr?: string | null;
  depositAmount: number;
  monthlyRent: number;
  rentalMonths: number;
  now?: Date;
}

export type CancellationTierType =
  | 'EARLY_FULL'        // Hủy trong 48h sau thanh toán hoặc trước >= 7 ngày (hoàn 100% cọc + 100% tiền thuê)
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
    createdAtStr,
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

  // Kiểm tra thời điểm thanh toán (Cooling-off 48h sau thanh toán)
  const createdTime = createdAtStr ? new Date(createdAtStr).getTime() : NaN;
  const hoursSincePayment = Number.isFinite(createdTime)
    ? Math.max(0, (now.getTime() - createdTime) / (1000 * 60 * 60))
    : 0;
  const isWithin48hAfterPayment = hoursSincePayment <= 48;

  const totalRentalFee = monthlyRent * rentalMonths;

  let tier: CancellationTierType;
  let tierName = '';
  let tierBadge = '';
  let depositRefund = 0;
  let depositPenalty = 0;
  const rentCharged = 0;
  const refundableRentalFee = totalRentalFee;
  let explanation = '';

  // 1. Hủy trong 48h sau thanh toán (Cooling-off) hoặc trước >= 7 ngày
  if (isWithin48hAfterPayment || daysUntilStart >= 7) {
    tier = 'EARLY_FULL';
    depositRefund = depositAmount;
    depositPenalty = 0;
    tierName = isWithin48hAfterPayment
      ? 'Hủy trong 48 giờ đầu sau thanh toán'
      : 'Hủy sớm (trước ≥ 7 ngày)';
    tierBadge = 'Hoàn 100% Cọc & Tiền thuê';
    explanation = '';
  }
  // 2. Hủy trước 2 – 6 ngày
  else if (daysUntilStart >= 2) {
    tier = 'MID_PARTIAL';
    depositRefund = Math.round(depositAmount * 0.5);
    depositPenalty = depositAmount - depositRefund;
    tierName = `Hủy trước ${daysUntilStart} ngày`;
    tierBadge = 'Phạt 50% cọc';
    explanation = '';
  }
  // 3. Hủy sát giờ (< 48 giờ)
  else {
    tier = 'LATE_NO_DEPOSIT';
    depositRefund = 0;
    depositPenalty = depositAmount;
    tierName = 'Hủy sát giờ (dưới 48 giờ)';
    tierBadge = 'Phạt 100% cọc';
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

