/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

/**
 * ISS-99: Giới hạn mỗi người dùng chỉ được giữ chỗ 1 ô kho PENDING_PAYMENT (BR-RES-02)
 * Hiển thị popup cảnh báo yêu cầu thanh toán ô kho cũ trước khi đặt ô kho khác.
 */
describe('ISS-99: Limit One Pending Reservation per Customer', () => {
  const unitPickerPagePath = path.resolve(
    process.cwd(),
    'src/features/customer/pages/UnitPickerPage.tsx'
  );
  const bookingPagePath = path.resolve(
    process.cwd(),
    'src/features/customer/pages/BookingPage.tsx'
  );

  it('UnitPickerPage kiểm tra getMyReservationsApi và mở modal pendingLimitModal khi có đơn giữ chỗ PENDING_PAYMENT', () => {
    const content = fs.readFileSync(unitPickerPagePath, 'utf-8');
    expect(content).toMatch(/getMyReservationsApi/);
    expect(content).toMatch(/pendingLimitModal/);
    expect(content).toMatch(/PENDING_PAYMENT/);
    expect(content).toMatch(/Quý khách đang có đơn giữ chỗ/);
    expect(content).toMatch(/Quý khách vui lòng thanh toán ô kho/);
    expect(content).toMatch(/trước khi đặt ô kho khác/);
    expect(content).toMatch(/Thanh toán ô kho đang giữ chỗ/);
  });

  it('BookingPage kiểm tra getMyReservationsApi và chặn đặt thêm ô kho khi đang có đơn PENDING_PAYMENT', () => {
    const content = fs.readFileSync(bookingPagePath, 'utf-8');
    expect(content).toMatch(/getMyReservationsApi/);
    expect(content).toMatch(/pendingLimitModal/);
    expect(content).toMatch(/Quý khách đang có đơn giữ chỗ/);
    expect(content).toMatch(/Quý khách vui lòng thanh toán ô kho/);
    expect(content).toMatch(/trước khi đặt ô kho khác/);
    expect(content).toMatch(/Thanh toán ô kho đang giữ chỗ/);
  });
});
