/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

/**
 * ISS-78: Quản lý & Hiển thị đơn đang giữ chỗ 48h trên trang Kho của tôi
 * Người thực hiện: Nhi
 */
describe('ISS-78: Pending Reservation Tracking on My Units Page', () => {
  const myUnitsPage = path.resolve(
    process.cwd(),
    'src/features/customer/pages/MyUnitsPage.tsx'
  );
  const kpiSummary = path.resolve(
    process.cwd(),
    'src/features/customer/components/CustomerRentalsKpiSummary.tsx'
  );
  const pendingCard = path.resolve(
    process.cwd(),
    'src/features/customer/components/PendingReservationCard.tsx'
  );
  const reservationApi = path.resolve(
    process.cwd(),
    'src/api/reservation.ts'
  );

  it('reservation.ts export hàm getMyReservationsApi để lấy danh sách đơn giữ chỗ', () => {
    const content = fs.readFileSync(reservationApi, 'utf-8');
    expect(content).toMatch(/export async function getMyReservationsApi/);
    expect(content).toMatch(/\/reservations\/my-rentals/);
  });

  it('PendingReservationCard.tsx tồn tại và có đồng hồ đếm ngược, nút Tiếp tục thanh toán và nút Hủy giữ chỗ', () => {
    expect(fs.existsSync(pendingCard)).toBe(true);
    const content = fs.readFileSync(pendingCard, 'utf-8');
    expect(content).toMatch(/Tiếp tục thanh toán/);
    expect(content).toMatch(/Hủy giữ chỗ/);
    expect(content).toMatch(/Đang giữ chỗ/);
  });

  it('CustomerRentalsKpiSummary.tsx hỗ trợ hiển thị thẻ KPI Đang giữ chỗ', () => {
    const content = fs.readFileSync(kpiSummary, 'utf-8');
    expect(content).toMatch(/pendingReservationsCount/);
    expect(content).toMatch(/Đang giữ chỗ/);
  });

  it('MyUnitsPage.tsx tích hợp gọi getMyReservationsApi và hiển thị danh sách PendingReservationCard', () => {
    const content = fs.readFileSync(myUnitsPage, 'utf-8');
    expect(content).toMatch(/getMyReservationsApi/);
    expect(content).toMatch(/PendingReservationCard/);
    expect(content).toMatch(/PENDING_PAYMENT/);
  });
});
