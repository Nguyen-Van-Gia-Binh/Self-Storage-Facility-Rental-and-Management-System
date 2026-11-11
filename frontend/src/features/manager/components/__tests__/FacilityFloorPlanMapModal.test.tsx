import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { FacilityFloorPlanMapModal } from '../FacilityFloorPlanMapModal';
import type { StorageUnitResponse } from '@/types/unit';

const cleanHtml = (html: string) => html.replace(/<!-- -->/g, '');

describe('FacilityFloorPlanMapModal component — Sơ đồ Mặt bằng 2D & Cầu thang Tương tác', () => {
  const mockUnits: StorageUnitResponse[] = [
    {
      id: 101,
      facilityId: 1,
      unitTypeId: 10,
      unitTypeName: 'Kho Nhỏ (4m²)',
      code: 'CG-S101',
      floor: 1,
      position: 'Khu A',
      status: 'AVAILABLE',
      monthlyPrice: 800000,
    },
    {
      id: 102,
      facilityId: 1,
      unitTypeId: 10,
      unitTypeName: 'Kho Nhỏ (4m²)',
      code: 'CG-S102',
      floor: 1,
      position: 'Khu A',
      status: 'OCCUPIED',
      monthlyPrice: 800000,
    },
    {
      id: 201,
      facilityId: 1,
      unitTypeId: 10,
      unitTypeName: 'Kho Nhỏ (4m²)',
      code: 'CG-S201',
      floor: 2,
      position: 'Khu B',
      status: 'AVAILABLE',
      monthlyPrice: 800000,
    },
    {
      id: 202,
      facilityId: 1,
      unitTypeId: 10,
      unitTypeName: 'Kho Nhỏ (4m²)',
      code: 'CG-S202',
      floor: 2,
      position: 'Khu B',
      status: 'MAINTENANCE',
      monthlyPrice: 800000,
    },
  ];

  it('1. Render tiêu đề sơ đồ mặt bằng 2D và tên cơ sở', () => {
    const rawHtml = renderToString(
      <FacilityFloorPlanMapModal
        isOpen={true}
        onClose={() => {}}
        facilityId={1}
        facilityName="Cơ sở Cầu Giấy"
        initialUnits={mockUnits}
      />
    );
    const html = cleanHtml(rawHtml);

    expect(html).toContain('Sơ đồ Mặt bằng 2D Ô kho — Cơ sở Cầu Giấy');
    expect(html).toContain('Tầng 1');
    expect(html).toContain('Tầng 2');
    expect(html).toContain('CG-S101');
  });

  it('2. Hiển thị khối Cầu thang & Thang máy tương tác chuyển tầng', () => {
    const rawHtml = renderToString(
      <FacilityFloorPlanMapModal
        isOpen={true}
        onClose={() => {}}
        facilityId={1}
        initialUnits={mockUnits}
      />
    );
    const html = cleanHtml(rawHtml);

    expect(html).toContain('Cầu thang &amp; Thang máy');
    expect(html).toContain('Click để lên sơ đồ Tầng 2');
    expect(html).toContain('Chuyển sang Tầng 2');
  });

  it('3. Hiển thị bảng chú giải màu sắc đầy đủ 6 trạng thái', () => {
    const rawHtml = renderToString(
      <FacilityFloorPlanMapModal
        isOpen={true}
        onClose={() => {}}
        facilityId={1}
        initialUnits={mockUnits}
      />
    );
    const html = cleanHtml(rawHtml);

    expect(html).toContain('Trống khả dụng');
    expect(html).toContain('Chờ nhận kho');
    expect(html).toContain('Đang thuê');
    expect(html).toContain('Quá hạn');
    expect(html).toContain('Bảo trì');
    expect(html).toContain('Ô bàn giao');
  });

  it('4. Chế độ Locator: làm nổi bật ô kho bàn giao khi có highlightUnitId', () => {
    const rawHtml = renderToString(
      <FacilityFloorPlanMapModal
        isOpen={true}
        onClose={() => {}}
        facilityId={1}
        highlightUnitId={101}
        initialUnits={mockUnits}
      />
    );
    const html = cleanHtml(rawHtml);

    expect(html).toContain('CG-S101');
    expect(html).toContain('Ô bàn giao');
  });

  it('5. Chế độ Picker: hiển thị nhãn Chế độ Chọn ô trực quan và nút đóng', () => {
    const rawHtml = renderToString(
      <FacilityFloorPlanMapModal
        isOpen={true}
        onClose={() => {}}
        facilityId={1}
        allowedUnitTypeId={10}
        targetUnitTypeName="Kho Nhỏ (4m²)"
        onSelectUnit={() => {}}
        initialUnits={mockUnits}
      />
    );
    const html = cleanHtml(rawHtml);

    expect(html).toContain('Chế độ Chọn ô trực quan');
    expect(html).toContain('Kho Nhỏ (4m²)');
    expect(html).toContain('Đóng sơ đồ');
  });

  it('6. Kích hoạt Chế độ Đền bù Nâng hạng khi cơ sở hết ô trống cùng loại', () => {
    const rawHtml = renderToString(
      <FacilityFloorPlanMapModal
        isOpen={true}
        onClose={() => {}}
        facilityId={1}
        allowedUnitTypeId={99}
        targetUnitTypeName="Kho Tiêu Chuẩn XS (1m²)"
        onSelectUnit={() => {}}
        initialUnits={mockUnits}
      />
    );
    const html = cleanHtml(rawHtml);

    expect(html).toContain('Chế độ Đền bù Nâng hạng đã kích hoạt');
    expect(html).toContain('Hết ô cùng loại');
    expect(html).toContain('Nâng hạng đền bù');
    expect(html).toContain('Nâng hạng');
  });

  it('7. Không hiển thị banner Đền bù Nâng hạng khi dữ liệu đang tải (loading)', () => {
    const rawHtml = renderToString(
      <FacilityFloorPlanMapModal
        isOpen={true}
        onClose={() => {}}
        facilityId={1}
        allowedUnitTypeId={99}
        targetUnitTypeName="Kho Tiêu Chuẩn XS (1m²)"
        onSelectUnit={() => {}}
      />
    );
    const html = cleanHtml(rawHtml);

    expect(html).not.toContain('Chế độ Đền bù Nâng hạng đã kích hoạt');
    expect(html).not.toContain('Hết ô cùng loại');
    expect(html).toContain('Đang tải dữ liệu ô kho của cơ sở');
  });
});
