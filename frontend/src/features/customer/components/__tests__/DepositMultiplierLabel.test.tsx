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

  it('BookingPriceSummary sử dụng policy.depositMultiplier từ useActivePolicy ở BookingPage', () => {
    const bookingPage = path.resolve(
      process.cwd(),
      'src/features/customer/pages/BookingPage.tsx'
    );
    const content = fs.readFileSync(bookingPage, 'utf-8');
    // Phải truyền depositMultiplier vào BookingPriceSummary
    expect(content).toMatch(/<BookingPriceSummary[\s\S]*?depositMultiplier/);
  });
});