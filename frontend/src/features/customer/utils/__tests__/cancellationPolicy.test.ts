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

  it('Hủy trong 48h sau thanh toán (Cooling-off BR-CAN-01) ➔ Hoàn 100% toàn bộ bất kể ngày bắt đầu', () => {
    const result = calculateCancellationRefund({
      ...baseParams,
      startDateStr: '2026-11-07', // Dù sát nút 1 ngày
      createdAtStr: '2026-11-06T05:00:00', // Mới thanh toán cách đây 4 giờ
    });

    expect(result.tier).toBe('EARLY_FULL');
    expect(result.isWithin48hAfterPayment).toBe(true);
    expect(result.depositRefund).toBe(800000);
    expect(result.totalRefund).toBe(3200000);
  });

  it('Hủy trong 10 ngày ân hạn (BR-CAN-08) ➔ Mất 100% cọc + Trừ tiền ngày đã giữ kho', () => {
    // startDate là 2026-11-03 (đã quá 3 ngày)
    const result = calculateCancellationRefund({
      ...baseParams,
      startDateStr: '2026-11-03',
    });

    expect(result.tier).toBe('IN_GRACE_PERIOD');
    expect(result.heldDays).toBe(3);
    expect(result.depositRefund).toBe(0);
    expect(result.rentCharged).toBeGreaterThan(0); // Đã trừ tiền 3 ngày
    expect(result.totalRefund).toBe(result.refundableRentalFee);
  });

  it('Quá hạn No-show 10 ngày (BR-CAN-04) ➔ Không hoàn tiền (0đ)', () => {
    // startDate là 2026-10-20 (đã quá 17 ngày > 10 ngày)
    const result = calculateCancellationRefund({
      ...baseParams,
      startDateStr: '2026-10-20',
    });

    expect(result.tier).toBe('NO_SHOW_OVERDUE');
    expect(result.heldDays).toBeGreaterThan(10);
    expect(result.totalRefund).toBe(0);
  });
});

