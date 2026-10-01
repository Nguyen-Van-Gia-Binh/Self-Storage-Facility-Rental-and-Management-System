/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

/**
 * ISS-77: Thay thế nút "Sửa lại thông tin" bằng nút "Hủy giữ chỗ" trên màn hình thanh toán VietQR BookingPage
 * Người thực hiện: Nhi
 */
describe('ISS-77: Booking Cancel Reservation Button & Confirmation Modal', () => {
  const bookingPage = path.resolve(
    process.cwd(),
    'src/features/customer/pages/BookingPage.tsx'
  );
  const reservationApi = path.resolve(
    process.cwd(),
    'src/api/reservation.ts'
  );

  it('reservation.ts export hàm cancelReservationApi để gọi endpoint POST /reservations/:id/cancellation', () => {
    const content = fs.readFileSync(reservationApi, 'utf-8');
    expect(content).toMatch(/export async function cancelReservationApi/);
    expect(content).toMatch(/\/reservations\/\$\{id\}\/cancellation/);
  });

  it('BookingPage.tsx không còn nút Sửa lại thông tin ở bước 3, thay bằng nút Hủy giữ chỗ', () => {
    const content = fs.readFileSync(bookingPage, 'utf-8');
    // Không còn nút Sửa lại thông tin
    expect(content).not.toMatch(/Sửa lại thông tin/);
    // Có nút Hủy giữ chỗ
    expect(content).toMatch(/Hủy giữ chỗ/);
    expect(content).toMatch(/setShowCancelModal\(true\)/);
  });

  it('BookingPage.tsx có Modal xác nhận hủy giữ chỗ giải phóng ô kho và dọn sạch draft', () => {
    const content = fs.readFileSync(bookingPage, 'utf-8');
    expect(content).toMatch(/handleConfirmCancelReservation/);
    expect(content).toMatch(/cancelReservationApi\(/);
    expect(content).toMatch(/localStorage\.removeItem\('smartstorage_pending_booking'\)/);
    expect(content).toMatch(/Xác nhận hủy giữ chỗ/);
    expect(content).toMatch(/Quay lại \(Giữ đơn\)/);
  });
});
