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
  | 'EARLY_FULL'        // BR-CAN-01: Hủy sớm ≥ 7 ngày (hoàn 100% cọc + 100% tiền thuê)
  | 'MID_PARTIAL'       // BR-CAN-02: Hủy lửng 2 - 6 ngày (phạt 50% cọc, hoàn 50% cọc + 100% tiền thuê)
  | 'LATE_NO_DEPOSIT'   // BR-CAN-03: Hủy sát nút < 48h (phạt 100% cọc, hoàn 100% tiền thuê)
  | 'IN_GRACE_PERIOD'   // BR-CAN-08: Hủy trong 10 ngày ân hạn sau khi quá ngày bắt đầu
  | 'NO_SHOW_OVERDUE';  // BR-CAN-04: Quá 10 ngày ân hạn (No-show, không hoàn tiền)

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

  // Số ngày kể từ ngày bắt đầu (nếu >= 0 là đã đến/qua ngày nhận kho)
  const diffFromStartDays = Math.floor((todayZero.getTime() - startZero.getTime()) / (1000 * 60 * 60 * 24));
  const heldDays = Math.max(0, diffFromStartDays);

  // Số ngày còn lại đến ngày bắt đầu nhận kho (nếu > 0 là trước ngày nhận kho)
  const daysUntilStart = Math.ceil((startZero.getTime() - todayZero.getTime()) / (1000 * 60 * 60 * 24));

  // Kiểm tra thời điểm thanh toán (Cooling-off 48h sau thanh toán)
  const createdTime = createdAtStr ? new Date(createdAtStr).getTime() : NaN;
  const hoursSincePayment = Number.isFinite(createdTime)
    ? Math.max(0, (now.getTime() - createdTime) / (1000 * 60 * 60))
    : 0;
  const isWithin48hAfterPayment = hoursSincePayment <= 48;

  const totalRentalFee = monthlyRent * rentalMonths;
  const graceDays = 10;

  let tier: CancellationTierType;
  let tierName = '';
  let tierBadge = '';
  let depositRefund = 0;
  let depositPenalty = 0;
  let rentCharged = 0;
  let refundableRentalFee = totalRentalFee;
  let explanation = '';

  // 1. Nếu hủy trong 48h sau khi thanh toán (Cooling-off) hoặc trước ≥ 7 ngày
  if (isWithin48hAfterPayment || daysUntilStart >= 7) {
    tier = 'EARLY_FULL';
    depositRefund = depositAmount;
    depositPenalty = 0;
    refundableRentalFee = totalRentalFee;
    rentCharged = 0;
    tierName = isWithin48hAfterPayment
      ? 'Hủy trong 48 giờ đầu sau thanh toán'
      : 'Hủy sớm (trước ≥ 7 ngày)';
    tierBadge = 'Hoàn 100% Cọc & Tiền thuê';
    explanation = isWithin48hAfterPayment
      ? 'Hủy trong vòng 48 giờ sau khi thanh toán: Hoàn lại 100% tiền thuê và tiền cọc.'
      : 'Hủy trước ngày hẹn từ 7 ngày trở lên: Hoàn lại 100% tiền thuê và 100% tiền cọc.';
  }
  // 2. Hủy lửng: từ 2 đến 6 ngày trước ngày nhận kho
  else if (daysUntilStart >= 2) {
    tier = 'MID_PARTIAL';
    depositRefund = Math.round(depositAmount * 0.5);
    depositPenalty = depositAmount - depositRefund;
    refundableRentalFee = totalRentalFee;
    rentCharged = 0;
    tierName = `Hủy trước ${daysUntilStart} ngày`;
    tierBadge = 'Phạt 50% cọc (Hoàn 50% cọc)';
    explanation = 'Hủy trước 2 – 6 ngày: Hoàn 100% tiền thuê và 50% tiền cọc (khấu trừ 50% cọc phí giữ chỗ).';
  }
  // 3. Hủy sát nút: dưới 48 giờ trước ngày nhận kho (hoặc đúng ngày bắt đầu nhưng chưa quá hạn)
  else if (heldDays === 0) {
    tier = 'LATE_NO_DEPOSIT';
    depositRefund = 0;
    depositPenalty = depositAmount;
    refundableRentalFee = totalRentalFee;
    rentCharged = 0;
    tierName = 'Hủy sát giờ (dưới 48 giờ)';
    tierBadge = 'Phạt 100% cọc (Hoàn 0% cọc)';
    explanation = 'Hủy sát ngày nhận (< 48 giờ): Hoàn 100% tiền thuê, giữ lại tiền cọc để bù chi phí chuẩn bị kho.';
  }
  // 4. Hủy trong hạn nhận kho 10 ngày (đã quá ngày startDate)
  else if (heldDays <= graceDays) {
    tier = 'IN_GRACE_PERIOD';
    depositRefund = 0;
    depositPenalty = depositAmount;
    // Tính tiền thuê trừ theo ngày thực tế đã giữ kho
    const dailyRent = Math.round(totalRentalFee / Math.max(1, rentalMonths * 30));
    rentCharged = Math.min(totalRentalFee, dailyRent * heldDays);
    refundableRentalFee = Math.max(0, totalRentalFee - rentCharged);
    tierName = `Hủy sau ngày bắt đầu (${heldDays} ngày)`;
    tierBadge = 'Phạt 100% cọc + Trừ ngày đã giữ';
    explanation = `Đã qua ngày hẹn nhận kho (${heldDays} ngày): Giữ lại tiền cọc và trừ tiền thuê thực tế ${heldDays} ngày đã giữ.`;
  }
  // 5. Quá hạn 10 ngày No-show
  else {
    tier = 'NO_SHOW_OVERDUE';
    depositRefund = 0;
    depositPenalty = depositAmount;
    rentCharged = totalRentalFee;
    refundableRentalFee = 0;
    tierName = 'Quá hạn nhận kho (Vắng mặt)';
    tierBadge = 'Không hoàn tiền';
    explanation = `Đã quá hạn nhận kho quá ${graceDays} ngày: Toàn bộ tiền đã đóng không được hoàn lại.`;
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

