// @vitest-environment jsdom
/// <reference types="node" />
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MyUnitsTable } from '../MyUnitsTable';
import type { RentedContract } from '../../types';

vi.mock('@/hooks/useActivePolicy', () => ({
  useActivePolicy: () => ({ reservationHoldHours: 15 }),
}));

const makeContract = (overrides: Partial<RentedContract>): RentedContract =>
  ({
    id: '1',
    contractNumber: 'CTR-001',
    unitNumber: 'Q1-A101',
    unitTypeName: 'Kho Tiêu Chuẩn S',
    facilityName: 'Cơ sở Quận 1 - TP.HCM',
    startDate: '2026-08-14',
    endDate: '2026-12-25',
    status: 'ACTIVE',
    accessPin: '123456',
    depositHeld: 1500000,
    ...overrides,
  }) as RentedContract;

describe('MyUnitsTable — Chuẩn hóa 4 Nhóm Trạng thái Ngữ nghĩa & Thứ bậc Nút Thao tác', () => {
  const tablePath = path.resolve(
    process.cwd(),
    'src/features/customer/components/MyUnitsTable.tsx'
  );

  const noopProps = {
    pendingReservations: [],
    loading: false,
    searchQuery: '',
    statusFilter: 'ALL',
    onClearFilters: vi.fn(),
    onViewDetail: vi.fn(),
    onChangePin: vi.fn(),
    onScheduleReturn: vi.fn(),
    onReschedulePeriod: vi.fn(),
    onOpenOverduePayment: vi.fn(),
    onCancelReturn: vi.fn(),
    onCancelPendingCheckIn: vi.fn(),
    onCancelReservation: vi.fn(),
    pageSize: 20,
  };

  it('Mã nguồn không còn dùng nút cam/đỏ gradient, màu tím lạc tông hay nút Báo trả kho nổi ngoài cột Thao tác', () => {
    const content = fs.readFileSync(tablePath, 'utf-8');
    expect(content).not.toContain('from-amber-600 to-orange-600');
    expect(content).not.toContain('from-red-600 to-rose-600');
    expect(content).not.toContain('bg-purple-50 text-purple-800');
    expect(content).not.toContain('bg-purple-600');
  });

  it('Phân nhóm đúng 4 màu ngữ nghĩa (Emerald / Amber / Rose / Gray) và đúng thứ bậc nút hành động cho mọi trạng thái', () => {
    const today = new Date();
    const in25Days = new Date(today.getTime() + 25 * 86400000).toISOString().slice(0, 10);
    const in5Days = new Date(today.getTime() + 5 * 86400000).toISOString().slice(0, 10);
    const in90Days = new Date(today.getTime() + 90 * 86400000).toISOString().slice(0, 10);
    const todayIso = today.toISOString().slice(0, 10);

    const contracts: RentedContract[] = [
      makeContract({ id: '1', unitNumber: 'U-ACTIVE', status: 'ACTIVE', endDate: in90Days }),
      makeContract({ id: '2', unitNumber: 'U-EXP-RENEW', status: 'ACTIVE', endDate: in25Days }),
      makeContract({ id: '3', unitNumber: 'U-EXP-LOCK', status: 'ACTIVE', endDate: in5Days }),
      makeContract({ id: '4', unitNumber: 'U-OVERDUE', status: 'OVERDUE', overdueDays: 5, overdueFee: 500000, accessPin: '' }),
      makeContract({ id: '5', unitNumber: 'U-CHECKIN', status: 'PENDING_CHECKIN', startDate: todayIso, endDate: in90Days }),
      makeContract({ id: '6', unitNumber: 'U-INSPECTED', status: 'PENDING_RETURN', inspectionDone: true }),
      makeContract({ id: '7', unitNumber: 'U-CANCELLED', status: 'CANCELLED' as any }),
      makeContract({ id: '8', unitNumber: 'U-CLOSED', status: 'CLOSED' }),
      makeContract({ id: '9', unitNumber: 'U-SEALED', status: 'TERMINATED' as any, depositHeld: 0, overdueDays: 8 }),
    ];

    render(
      <MemoryRouter>
        <MyUnitsTable contracts={contracts} {...noopProps} />
      </MemoryRouter>
    );

    // 1. Emerald: Đang hoạt động & Đã nghiệm thu
    expect(screen.getByText('Đang hoạt động').className).toContain('bg-emerald-50');
    expect(screen.getByText('Đã nghiệm thu').className).toContain('bg-emerald-50');

    // 2. Amber: Sắp hết hạn (kể cả còn 5 ngày) & Chờ nhận kho
    const expiringBadges = screen.getAllByText('Sắp hết hạn');
    expiringBadges.forEach((b) => expect(b.className).toContain('bg-amber-50'));
    expect(screen.getByText('Chờ nhận kho').className).toContain('bg-amber-50');

    // 3. Rose: Quá hạn (D+5) & Bị niêm phong
    expect(screen.getByText('Quá hạn (D+5)').className).toContain('bg-rose-50');
    expect(screen.getByText('Bị niêm phong').className).toContain('bg-rose-50');

    // 4. Gray: Đã kết thúc & Đã hủy · Chờ hoàn
    expect(screen.getByText('Đã kết thúc').className).toContain('bg-gray-100');
    expect(screen.getByText('Đã hủy · Chờ hoàn').className).toContain('bg-gray-100');

    // Thứ bậc nút hành động:
    // - Gia hạn dùng màu xanh Mint (bg-brand-600)
    const renewBtn = screen.getByRole('button', { name: /Gia hạn/i });
    expect(renewBtn.className).toContain('bg-brand-600');

    // - Đóng phạt dùng màu Đỏ (bg-rose-600)
    const penaltyBtn = screen.getByRole('button', { name: /Đóng phí/i });
    expect(penaltyBtn.className).toContain('bg-rose-600');

    // - Check-in online dùng màu Xanh Mint (bg-brand-600)
    const checkInBtn = screen.getByRole('button', { name: /Check-in online/i });
    expect(checkInBtn.className).toContain('bg-brand-600');

    // - Không hiện nút "Báo trả kho" nổi trực tiếp ở cột Thao tác (đã gom vào menu 3 chấm)
    expect(screen.queryByRole('button', { name: /^Báo trả kho$/i })).not.toBeInTheDocument();

    // - Dòng Đã kết thúc bị làm mờ (opacity)
    const closedRow = screen.getByText('U-CLOSED').closest('tr');
    expect(closedRow?.className).toContain('opacity-');
    expect(closedRow?.className).toContain('bg-gray-50');
  });
});
