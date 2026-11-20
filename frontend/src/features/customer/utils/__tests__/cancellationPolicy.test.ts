import { describe, it, expect } from 'vitest';
import { calculateCancellationRefund } from '../cancellationPolicy';

describe('calculateCancellationRefund — Chính sách hủy đặt chỗ 3 tầng Airbnb (BR-CAN-01..04, BR-CAN-08)', () => {
  const baseParams = {
    depositAmount: 800000,
    monthlyRent: 800000,
    rentalMonths: 3, // Tổng tiền thuê 2.400.000 đ
    createdAtStr: '2026-10-01T08:00:00Z', // Quá 48h sau thanh toán để test các tầng ngày
    now: new Date('2026-11-06T09:00:00'),
  };

  it('Tầng 1 (BR-CAN-01): Hủy sớm ≥ 7 ngày ➔ Hoàn 100% tiền thuê + Hoàn 100% cọc', () => {
    // startDate là 2026-11-15 (cách 9 ngày)
    const result = calculateCancellationRefund({
      ...baseParams,
      startDateStr: '2026-11-15',
    });

    expect(result.tier).toBe('EARLY_FULL');
    expect(result.daysUntilStart).toBeGreaterThanOrEqual(7);
    expect(result.depositRefund).toBe(800000);
    expect(result.depositPenalty).toBe(0);
    expect(result.refundableRentalFee).toBe(2400000);
    expect(result.totalRefund).toBe(3200000); // 2.4M + 800k
    expect(result.tierBadge).toContain('Hoàn 100%');
  });

  it('Tầng 2 (BR-CAN-02): Hủy lửng từ 2 đến 6 ngày ➔ Hoàn 100% tiền thuê + Phạt 50% cọc (Hoàn 50% cọc)', () => {
    // startDate là 2026-11-10 (cách 4 ngày)
    const result = calculateCancellationRefund({
      ...baseParams,
      startDateStr: '2026-11-10',
    });

    expect(result.tier).toBe('MID_PARTIAL');
    expect(result.daysUntilStart).toBe(4);
    expect(result.depositRefund).toBe(400000); // 50% cọc
    expect(result.depositPenalty).toBe(400000); // phạt 50% cọc
    expect(result.refundableRentalFee).toBe(2400000);
    expect(result.totalRefund).toBe(2800000); // 2.4M + 400k
    expect(result.tierBadge).toContain('Phạt 50% cọc');
  });

  it('Tầng 3 (BR-CAN-03): Hủy sát nút < 48 giờ ➔ Hoàn 100% tiền thuê + Phạt 100% cọc (Hoàn 0% cọc)', () => {
    // startDate là 2026-11-07 (cách 1 ngày / < 48h)
    const result = calculateCancellationRefund({
      ...baseParams,
      startDateStr: '2026-11-07',
    });

    expect(result.tier).toBe('LATE_NO_DEPOSIT');
    expect(result.daysUntilStart).toBe(1);
    expect(result.depositRefund).toBe(0); // Mất sạch cọc
    expect(result.depositPenalty).toBe(800000);
    expect(result.refundableRentalFee).toBe(2400000);
    expect(result.totalRefund).toBe(2400000); // Chỉ còn tiền thuê
    expect(result.tierBadge).toContain('Phạt 100% cọc');
  });

  it('Áp dụng chuẩn 3 tầng theo ngày bắt đầu (không miễn phạt khi mới thanh toán trong 48h mà sát ngày nhận kho)', () => {
    const result = calculateCancellationRefund({
      ...baseParams,
      startDateStr: '2026-11-07', // Sát nút 1 ngày (< 48h trước ngày nhận kho)
      createdAtStr: '2026-11-06T05:00:00', // Mới thanh toán cách đây 4 giờ
    });

    expect(result.tier).toBe('LATE_NO_DEPOSIT');
    expect(result.isWithin48hAfterPayment).toBe(false);
    expect(result.depositRefund).toBe(0);
    expect(result.depositPenalty).toBe(800000);
    expect(result.totalRefund).toBe(2400000);
  });

  it('Chỉ còn 3 tầng chính sách (bỏ Tier 4 & 5), trường hợp < 48h hoặc sát giờ rơi vào LATE_NO_DEPOSIT (Phạt 100% cọc)', () => {
    const result = calculateCancellationRefund({
      ...baseParams,
      startDateStr: '2026-11-06',
    });

    expect(result.tier).toBe('LATE_NO_DEPOSIT');
    expect(result.depositRefund).toBe(0);
    expect(result.refundableRentalFee).toBe(2400000);
    expect(result.tierBadge).toBe('Phạt 100% cọc');
  });

  it('Áp dụng tham số BOM policy tùy chỉnh: cancelFullRefundDays = 10, cancelMidRefundRate = 0.7 (hoàn 70% cọc / phạt 30%)', () => {
    const customPolicy = {
      cancelFullRefundDays: 10,
      cancelMidRefundRate: 0.7,
      cancelFullRefundHours: 48,
      cancelLateRefundRate: 0,
    };

    // Cách 9 ngày: Với policy mặc định 7 ngày thì là EARLY_FULL, nhưng với custom 10 ngày thì rơi vào MID_PARTIAL
    const resultMid = calculateCancellationRefund({
      ...baseParams,
      startDateStr: '2026-11-15', // cách 9 ngày < 10 ngày
      policy: customPolicy as any,
    });

    expect(resultMid.tier).toBe('MID_PARTIAL');
    expect(resultMid.daysUntilStart).toBe(9);
    expect(resultMid.depositRefund).toBe(560000); // 70% của 800k
    expect(resultMid.depositPenalty).toBe(240000); // Phạt 30% cọc = 240k
    expect(resultMid.tierBadge).toContain('Phạt 30% cọc');
    expect(resultMid.totalRefund).toBe(2960000); // 2.4M + 560k

    // Cách 12 ngày >= 10 ngày: Rơi vào EARLY_FULL
    const resultFull = calculateCancellationRefund({
      ...baseParams,
      startDateStr: '2026-11-18', // cách 12 ngày >= 10 ngày
      policy: customPolicy as any,
    });

    expect(resultFull.tier).toBe('EARLY_FULL');
    expect(resultFull.depositRefund).toBe(800000);
    expect(resultFull.depositPenalty).toBe(0);
    expect(resultFull.totalRefund).toBe(3200000);
  });
});

