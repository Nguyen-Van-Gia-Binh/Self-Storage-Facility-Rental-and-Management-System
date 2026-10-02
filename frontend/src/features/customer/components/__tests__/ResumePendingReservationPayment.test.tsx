/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

/**
 * ISS-81: Khắc phục lỗi khách thanh toán đơn đang giữ chỗ 48h bị chặn "Hết chỗ" (SC-02, SC-03)
 * Người thực hiện: Nhi
 */
describe('ISS-81: Resume Pending Reservation Payment Flow', () => {
  const reservationApi = path.resolve(
    process.cwd(),
    'src/api/reservation.ts'
  );
  const pendingCard = path.resolve(
    process.cwd(),
    'src/features/customer/components/PendingReservationCard.tsx'
  );
  const bookingPage = path.resolve(
    process.cwd(),
    'src/features/customer/pages/BookingPage.tsx'
  );

  it('reservation.ts export hàm getReservationById để tra cứu đơn đặt chỗ theo ID', () => {
    const content = fs.readFileSync(reservationApi, 'utf-8');
    expect(content).toMatch(/export async function getReservationById/);
    expect(content).toMatch(/\/reservations\/\$\{id\}/);
  });

  it('PendingReservationCard.tsx truyền reservationId và unitNumber vào bookingUrl', () => {
    const content = fs.readFileSync(pendingCard, 'utf-8');
    expect(content).toMatch(/reservationId=\$\{reservation\.id\}/);
    expect(content).toMatch(/unitNumber=/);
    expect(content).toMatch(/Tiếp tục thanh toán VietQR/);
  });

  it('BookingPage.tsx tiếp nhận reservationIdParam và loadExistingReservation để chuyển thẳng sang Bước 3', () => {
    const content = fs.readFileSync(bookingPage, 'utf-8');
    expect(content).toMatch(/reservationIdParam/);
    expect(content).toMatch(/getReservationById/);
    expect(content).toMatch(/createPaymentCheckout/);
    expect(content).toMatch(/setCurrentStep\(3\)/);
  });

  it('BookingPage.tsx bỏ qua kiểm tra checkUnitAvailability khi có reservationIdParam để tránh tự chặn chính mình', () => {
    const content = fs.readFileSync(bookingPage, 'utf-8');
    expect(content).toMatch(/if \(reservationIdParam\)/);
  });

  it('BookingPage.tsx xử lý các trạng thái CANCELLED, EXPIRED và chuyển hướng nếu ACTIVE/PAID', () => {
    const content = fs.readFileSync(bookingPage, 'utf-8');
    expect(content).toMatch(/rsv\.status === 'CANCELLED' \|\| rsv\.status === 'EXPIRED'/);
    expect(content).toMatch(/navigate\('\/customer\/my-units'/);
  });
});
