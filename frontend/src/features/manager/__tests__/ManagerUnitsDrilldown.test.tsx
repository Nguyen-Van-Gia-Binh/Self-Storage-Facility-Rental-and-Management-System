import { describe, it, expect } from 'vitest';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { renderToString } from 'react-dom/server';
import { Breadcrumb } from '../components/Breadcrumb';
import { FacilityCard } from '../components/FacilityCard';
import { UnitTypeCard } from '../components/UnitTypeCard';
import { StorageUnitTable } from '../components/StorageUnitTable';
import { MiniFloorPlan } from '../components/MiniFloorPlan';
import { Pagination } from '../components/Pagination';
import { getFacilityRegion } from '../pages/FacilityListPage';
import type { FacilityListItem } from '@/types';
import type { UnitTypeResponse, StorageUnitResponse } from '@/types/unit';
import type { ManagerContractItem } from '@/types/contractManager';

const cleanHtml = (html: string) => html.replace(/<!-- -->/g, '');

describe('Quản lý ô kho — Kiến trúc Drill-down 4 Cấp độ (FM-01)', () => {
  const mockFacility: FacilityListItem = {
    id: 1,
    code: 'FAC-CG',
    name: 'Cơ sở Cầu Giấy - Hà Nội',
    address: '123 Cầu Giấy, Hà Nội',
    phone: '0901234567',
    description: 'Cơ sở hiện đại',
    openingHours: '08:00 - 20:00',
    isActive: true,
    createdAt: '2026-01-01',
  };

  const mockUnitType: UnitTypeResponse = {
    id: 10,
    facilityId: 1,
    code: 'UT-SMALL',
    name: 'Kho Nhỏ (4m²)',
    description: 'Phù hợp cá nhân và gia đình nhỏ',
    areaM2: 4,
    monthlyPrice: 800000,
    isActive: true,
    totalUnits: 8,
  };

  const mockStorageUnit: StorageUnitResponse = {
    id: 101,
    facilityId: 1,
    unitTypeId: 10,
    code: 'CG-S101',
    floor: 1,
    position: 'Khu A - Dãy 1',
    status: 'OCCUPIED',
    isActive: true,
    locationNote: 'Gần cửa thang máy',
  };

  const mockContract: ManagerContractItem = {
    id: 501,
    code: 'CTR-202610-0001',
    customerId: 99,
    customerName: 'Nguyễn Văn An',
    customerPhone: '0912345678',
    customerEmail: 'an.nguyen@test.com',
    facilityId: 1,
    facilityName: 'Cơ sở Cầu Giấy',
    storageUnitId: 101,
    storageUnitCode: 'CG-S101',
    unitTypeId: 10,
    unitTypeName: 'Kho Nhỏ',
    startDate: '2026-10-01',
    endDateExclusive: '2026-11-01',
    rentalMonths: 1,
    monthlyPrice: 800000,
    depositAmount: 800000,
    depositBalance: 800000,
    status: 'ACTIVE',
  };

  it('1. Cấp 1 (FacilityCard): Hiển thị đầy đủ thông tin cơ sở và tỷ lệ lấp đầy trực quan', () => {
    const html = cleanHtml(
      renderToString(
        <FacilityCard
          facility={mockFacility}
          stats={{
            totalUnits: 17,
            occupiedUnits: 4,
            availableUnits: 10,
            maintenanceUnits: 3,
            occupancyRate: 23.5,
          }}
          onClick={() => {}}
        />
      )
    );

    expect(html).toContain('Cơ sở Cầu Giấy - Hà Nội');
    expect(html).toContain('FAC-CG');
    expect(html).toContain('17');
    expect(html).toContain('4');
    expect(html).toContain('10');
    expect(html).toContain('23.5%');
    expect(html).toContain('Vào quản lý cơ sở');
  });

  it('2. Cấp 2 (UnitTypeCard): Hiển thị mini progress bar tỷ lệ đã thuê / tổng và 3 màu trực quan', () => {
    const html = cleanHtml(
      renderToString(
        <UnitTypeCard
          type={mockUnitType}
          stats={{
            total: 10,
            available: 2,
            occupied: 8,
            maintenance: 0,
          }}
          onClick={() => {}}
          onEdit={() => {}}
          onToggle={() => {}}
        />
      )
    );

    expect(html).toContain('Kho Nhỏ (4m²)');
    expect(html).toContain('4 m²');
    expect(html).toContain('800.000 đ/tháng');
    expect(html).toContain('Đã thuê: 8 / 10 ô');
    expect(html).toContain('80%');
    expect(html).toContain('2 ô');
    expect(html).toContain('8 ô');
    expect(html).toContain('Xem danh sách ô');
  });

  it('3. Cấp 3 (StorageUnitTable): Hiển thị bảng sortable columns, mã ô, tầng, khách và hạn hợp đồng', () => {
    const html = cleanHtml(
      renderToString(
        <StorageUnitTable
          units={[mockStorageUnit]}
          contractsMap={{ 101: mockContract }}
          sortField="code"
          sortDirection="asc"
          onSort={() => {}}
          onSelectUnit={() => {}}
        />
      )
    );

    expect(html).toContain('CG-S101');
    expect(html).toContain('Tầng 1');
    expect(html).toContain('Khu A - Dãy 1');
    expect(html).toContain('Đang thuê');
    expect(html).toContain('Nguyễn Văn An');
    expect(html).toContain('2026-11-01');
    expect(html).toContain('Chi tiết');
  });

  it('4. Cấp 4 (MiniFloorPlan): Làm nổi bật ô đang xem trên sơ đồ mặt bằng tầng', () => {
    const surrounding = [
      mockStorageUnit,
      { ...mockStorageUnit, id: 102, code: 'CG-S102', status: 'AVAILABLE' as const },
      { ...mockStorageUnit, id: 103, code: 'CG-S103', status: 'MAINTENANCE' as const },
    ];

    const html = cleanHtml(
      renderToString(
        <MiniFloorPlan currentUnit={mockStorageUnit} surroundingUnits={surrounding} />
      )
    );

    expect(html).toContain('Sơ đồ mặt bằng Tầng 1');
    expect(html).toContain('CG-S101');
    expect(html).toContain('CG-S102');
    expect(html).toContain('CG-S103');
    expect(html).toContain('Đang chọn');
  });

  it('5. Breadcrumb: Thể hiện chính xác chuỗi điều hướng xuyên suốt 4 cấp độ', () => {
    const html = cleanHtml(
      renderToString(
        <MemoryRouter>
          <Breadcrumb
            items={[
              { label: 'Cơ sở Cầu Giấy', to: '/manager/facilities/1' },
              { label: 'Kho Nhỏ (4m²)', to: '/manager/facilities/1/unit-types/10' },
              { label: 'Ô CG-S101' },
            ]}
          />
        </MemoryRouter>
      )
    );

    expect(html).toContain('Quản lý ô kho');
    expect(html).toContain('Cơ sở Cầu Giấy');
    expect(html).toContain('Kho Nhỏ (4m²)');
    expect(html).toContain('Ô CG-S101');
  });

  it('6. Pagination Component: Tự động ẩn khi data <= threshold và phân trang khi > threshold', () => {
    // Trường hợp <= threshold (12): Không hiển thị
    const hiddenHtml = renderToString(
      <Pagination
        currentPage={1}
        totalPages={1}
        totalItems={12}
        pageSize={12}
        threshold={12}
        itemName="cơ sở"
        onPageChange={() => {}}
      />
    );
    expect(hiddenHtml).toBe('');

    // Trường hợp > threshold (100 items, pageSize 12, threshold 12): Hiển thị đầy đủ
    const visibleHtml = cleanHtml(
      renderToString(
        <Pagination
          currentPage={1}
          totalPages={9}
          totalItems={100}
          pageSize={12}
          threshold={12}
          itemName="cơ sở"
          onPageChange={() => {}}
        />
      )
    );
    expect(visibleHtml).toContain('Hiển thị');
    expect(visibleHtml).toContain('12');
    expect(visibleHtml).toContain('100');
    expect(visibleHtml).toContain('cơ sở');
  });

  it('7. Phân loại khu vực RegionFilter: Phân loại chính xác Hà Nội, TP.HCM, Đà Nẵng và Khác', () => {
    expect(getFacilityRegion({ name: 'FAC-CG', address: '12 Cầu Giấy, Hà Nội' })).toBe('HN');
    expect(getFacilityRegion({ name: 'FAC-Q7', address: '88 Nguyễn Thị Thập, Quận 7, TP.HCM' })).toBe('HCM');
    expect(getFacilityRegion({ name: 'FAC-DN', address: '15 Bạch Đằng, Hải Châu, Đà Nẵng' })).toBe('DN');
    expect(getFacilityRegion({ name: 'FAC-BD', address: 'Bình Dương' })).toBe('OTHER');
  });
});
