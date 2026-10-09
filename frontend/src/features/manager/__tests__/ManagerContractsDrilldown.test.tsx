import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { StatusBadge } from '../components/StatusBadge';
import { FacilityContractSummaryCard } from '../components/FacilityContractSummaryCard';
import { ContractTable } from '../components/ContractTable';
import { OverdueAlertBanner } from '../components/OverdueAlertBanner';
import { CustomerInfoPanel } from '../components/CustomerInfoPanel';
import { PaymentInfoPanel } from '../components/PaymentInfoPanel';
import { ContractTimeline } from '../components/ContractTimeline';
import type { FacilityListItem } from '@/types';
import type { ManagerContractItem } from '@/types/contractManager';

const cleanHtml = (html: string) =>
  html
    .replace(/<!-- -->/g, '')
    .replace(/&amp;/g, '&');

describe('Giám sát hợp đồng — Kiến trúc Drill-down 3 Cấp độ (FM-02)', () => {
  const mockFacility: FacilityListItem = {
    id: 1,
    code: 'FAC-CG',
    name: 'Cơ sở Cầu Giấy',
    address: '123 Cầu Giấy, Hà Nội',
    phone: '0901234567',
    description: 'Cơ sở Cầu Giấy hiện đại',
    openingHours: '08:00 - 20:00',
    isActive: true,
    createdAt: '2026-01-01',
  };

  const mockContract: ManagerContractItem = {
    id: 101,
    code: 'HD-001',
    customerId: 99,
    customerName: 'Nguyễn Văn A',
    customerPhone: '0901234567',
    customerEmail: 'a@email.com',
    facilityId: 1,
    facilityName: 'Cơ sở Cầu Giấy',
    storageUnitId: 501,
    storageUnitCode: 'S-101',
    unitTypeId: 10,
    unitTypeName: 'Kho Nhỏ (4m²)',
    startDate: '2026-10-01',
    endDateExclusive: '2026-12-31',
    rentalMonths: 3,
    monthlyPrice: 800000,
    depositAmount: 800000,
    depositBalance: 800000,
    status: 'ACTIVE',
    accessCode: '123456',
  };

  const mockOverdueContract: ManagerContractItem = {
    ...mockContract,
    id: 102,
    code: 'HD-002',
    status: 'OVERDUE',
    overdueDays: 5,
    accruedOverdueFee: 400000,
    depositBalance: 400000,
  };

  it('1. StatusBadge: Hiển thị đúng màu và nhãn cho các trạng thái hợp đồng', () => {
    const activeHtml = cleanHtml(renderToString(<StatusBadge status="ACTIVE" />));
    expect(activeHtml).toContain('✓ Active');

    const pendingReturnHtml = cleanHtml(renderToString(<StatusBadge status="PENDING_RETURN" />));
    expect(pendingReturnHtml).toContain('⏳ Pending Return');

    const overdueHtml = cleanHtml(renderToString(<StatusBadge status="OVERDUE" />));
    expect(overdueHtml).toContain('⚠️ Overdue');

    const terminatedHtml = cleanHtml(renderToString(<StatusBadge status="TERMINATED" />));
    expect(terminatedHtml).toContain('🔴 Terminated');

    const closedHtml = cleanHtml(renderToString(<StatusBadge status="CLOSED" />));
    expect(closedHtml).toContain('📋 Closed');
  });

  it('2. Cấp 1 (FacilityContractSummaryCard): Hiển thị mini-stats hợp đồng và nút xem chi tiết', () => {
    const html = cleanHtml(
      renderToString(
        <FacilityContractSummaryCard
          facility={mockFacility}
          stats={{
            total: 8,
            active: 5,
            pending: 1,
            overdue: 2,
          }}
          onClick={() => {}}
        />
      )
    );

    expect(html).toContain('Cơ sở Cầu Giấy');
    expect(html).toContain('FAC-CG');
    expect(html).toContain('8 HĐ');
    expect(html).toContain('5');
    expect(html).toContain('1');
    expect(html).toContain('2');
    expect(html).toContain('Xem danh sách hợp đồng');
  });

  it('3. Cấp 2 (ContractTable): Hiển thị bảng hợp đồng với sortable columns và nút Chi tiết', () => {
    const html = cleanHtml(
      renderToString(
        <ContractTable
          contracts={[mockContract]}
          sortField="code"
          sortDirection="asc"
          onSort={() => {}}
          onSelectContract={() => {}}
        />
      )
    );

    expect(html).toContain('HD-001');
    expect(html).toContain('Nguyễn Văn A');
    expect(html).toContain('S-101');
    expect(html).toContain('✓ Active');
    expect(html).toContain('2026-12-31');
    expect(html).toContain('Chi tiết');
  });

  it('4. Cấp 3 (OverdueAlertBanner): Hiển thị cảnh báo ngày D+5, nợ phạt và nút hành động', () => {
    const html = cleanHtml(
      renderToString(
        <OverdueAlertBanner
          contract={mockOverdueContract}
          onPayPenalty={() => {}}
          onRequestReturn={() => {}}
        />
      )
    );

    expect(html).toContain('Cảnh báo quá hạn');
    expect(html).toContain('D+5');
    expect(html).toContain('400.000 đ');
    expect(html).toContain('Đóng nợ phạt quá hạn');
    expect(html).toContain('Báo trả kho & Tất toán');
  });

  it('5. Cấp 3 (CustomerInfoPanel): Hiển thị thông tin khách hàng đầy đủ', () => {
    const html = cleanHtml(renderToString(<CustomerInfoPanel contract={mockContract} />));

    expect(html).toContain('Nguyễn Văn A');
    expect(html).toContain('0901234567');
    expect(html).toContain('a@email.com');
    expect(html).toContain('CUST-99');
  });

  it('6. Cấp 3 (PaymentInfoPanel): Hiển thị đơn giá, tiền cọc và tổng tiền đã thanh toán', () => {
    const html = cleanHtml(renderToString(<PaymentInfoPanel contract={mockContract} />));

    expect(html).toContain('800.000 đ');
    expect(html).toContain('3.200.000 đ');
    expect(html).toContain('Đã hoàn tất thanh toán');
  });

  it('7. Cấp 3 (ContractTimeline): Hiển thị dòng thời gian các mốc sự kiện', () => {
    const html = cleanHtml(renderToString(<ContractTimeline contract={mockContract} />));

    expect(html).toContain('Tạo đơn đặt chỗ thành công');
    expect(html).toContain('Thanh toán cọc & Ký hợp đồng điện tử');
    expect(html).toContain('Bàn giao kho & Cấp mã PIN truy cập');
  });
});
