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
  const bookingModals = path.resolve(
    process.cwd(),
    'src/features/customer/components/BookingModals.tsx'
  );
  const bookingPaymentHook = path.resolve(
    process.cwd(),
    'src/features/customer/hooks/useBookingPayment.ts'
  );
  const bookingPaymentStep = path.resolve(
    process.cwd(),
    'src/features/customer/components/BookingPaymentStep.tsx'
  );
  const getBookingContent = () => {
    let content = fs.readFileSync(bookingPage, 'utf-8');
    if (fs.existsSync(bookingModals)) content += '\n' + fs.readFileSync(bookingModals, 'utf-8');
    if (fs.existsSync(bookingPaymentHook)) content += '\n' + fs.readFileSync(bookingPaymentHook, 'utf-8');
    if (fs.existsSync(bookingPaymentStep)) content += '\n' + fs.readFileSync(bookingPaymentStep, 'utf-8');
    return content;
  };

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
    const content = getBookingContent();
    // Không còn nút Sửa lại thông tin
    expect(content).not.toMatch(/Sửa lại thông tin/);
    // Có nút Hủy giữ chỗ
    expect(content).toMatch(/Hủy giữ chỗ/);
    expect(content).toMatch(/setShowCancelModal\(true\)/);
  });

  it('BookingPage.tsx có Modal xác nhận hủy giữ chỗ giải phóng ô kho', () => {
    const content = getBookingContent();
    expect(content).toMatch(/handleConfirmCancelReservation/);
    expect(content).toMatch(/cancelReservationApi\(/);
    // ISS-77 cleanup: draft zombie keys (smartstorage_pending_reservation/booking)
    // không còn code nào ghi trong app → bỏ bước removeItem mồ côi.
    expect(content).not.toMatch(/localStorage\.removeItem\('smartstorage_pending_booking'\)/);
    expect(content).toMatch(/Xác nhận hủy giữ chỗ/);
    expect(content).toMatch(/Quay lại \(Giữ đơn\)/);
  });
});
