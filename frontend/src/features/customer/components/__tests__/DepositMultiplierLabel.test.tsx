import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * ISS-67: BookingPriceSummary & VietQRPaymentModal phải hiển thị hệ số cọc
 * (depositMultiplier) từ BOM Policy thay vì cứng "1 tháng".
 *
 * Khi BOM cấu hình depositMultiplier = N thì label phải dùng N (không phải "1").
 * Hệ số có thể là số thập phân (vd 1.5) nhưng thường là số nguyên (1, 2, 3).
 */
describe('ISS-67: Hiển thị đúng depositMultiplier từ BOM Policy', () => {
  const bookingSummary = path.resolve(
    process.cwd(),
    'src/features/customer/components/BookingPriceSummary.tsx'
  );
  const vietQrModal = path.resolve(
    process.cwd(),
    'src/features/customer/components/VietQRPaymentModal.tsx'
  );

  it('BookingPriceSummary nhận prop depositMultiplier và dùng nó thay vì hard-code "1 tháng"', () => {
    const content = fs.readFileSync(bookingSummary, 'utf-8');
    // Phải có prop depositMultiplier
    expect(content).toMatch(/depositMultiplier/);
    // Không được còn chuỗi cứng "(1 tháng)" cho dòng tiền cọc
    expect(content).not.toMatch(/Tiền cọc \(1 tháng\)/);
  });

  it('VietQRPaymentModal không còn hiển thị "(1 tháng)" cho tiền cọc', () => {
    const content = fs.readFileSync(vietQrModal, 'utf-8');
    expect(content).not.toMatch(/Tiền cọc bảo đảm \(1 tháng\)/);
    // Phải dùng depositMultiplier từ policy hoặc prop
    expect(content).toMatch(/depositMultiplier/);
  });

  it('BookingPage sử dụng policy.depositMultiplier từ useActivePolicy thay vì hard-code "1 tháng"', () => {
    const bookingPage = path.resolve(
      process.cwd(),
      'src/features/customer/pages/BookingPage.tsx'
    );
    const content = fs.readFileSync(bookingPage, 'utf-8');
    // Phải dùng useActivePolicy và depositMultiplier
    expect(content).toMatch(/useActivePolicy/);
    expect(content).toMatch(/depositMultiplier/);
    // Không được còn hardcode "Tiền cọc giữ kho (1 tháng)"
    expect(content).not.toMatch(/Tiền cọc giữ kho \(1 tháng\)/);
  });

  it('UnitPickerPage sử dụng policy.depositMultiplier từ useActivePolicy thay vì hard-code 1 tháng', () => {
    const unitPickerPage = path.resolve(
      process.cwd(),
      'src/features/customer/pages/UnitPickerPage.tsx'
    );
    const content = fs.readFileSync(unitPickerPage, 'utf-8');
    // Phải dùng useActivePolicy và depositMultiplier
    expect(content).toMatch(/useActivePolicy/);
    expect(content).toMatch(/depositMultiplier/);
    // Không còn chú thích hoặc gán hardcode 1 tháng tiền cọc
    expect(content).not.toMatch(/1 tháng tiền cọc/);
  });

  it('calculateBookingTotal tính tiền cọc chính xác theo hệ số depositMultiplier (BR-DEP-01)', async () => {
    const { calculateBookingTotal } = await import('../../utils/pricing');
    // Mặc định hệ số cọc 1 tháng
    const calcDefault = calculateBookingTotal(2000000, 3);
    expect(calcDefault.depositAmount).toBe(2000000);

    // Hệ số cọc N = 10 tháng do BOM cấu hình
    const calcMultiplier10 = calculateBookingTotal(2000000, 3, 10);
    expect(calcMultiplier10.depositAmount).toBe(20000000);
    expect(calcMultiplier10.totalDueToday).toBe(calcMultiplier10.finalRentTotal + 20000000);
  });
});