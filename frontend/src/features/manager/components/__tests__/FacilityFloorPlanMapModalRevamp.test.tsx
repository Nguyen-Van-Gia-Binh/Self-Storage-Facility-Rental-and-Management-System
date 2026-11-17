// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { FacilityFloorPlanMapModal } from '../FacilityFloorPlanMapModal';
import type { StorageUnitResponse } from '@/types/unit';

vi.mock('@/api/unit', () => ({
  fetchUnitTypes: vi.fn(async () => ({ content: [] })),
  fetchStorageUnits: vi.fn(async () => ({ content: [] })),
}));

const mockUnits: StorageUnitResponse[] = [
  {
    id: 501,
    facilityId: 7,
    unitTypeId: 20,
    unitTypeName: 'Kho Máy Lạnh M',
    code: 'Q7-STD-501',
    floor: 1,
    position: 'Khu A',
    status: 'MAINTENANCE',
    monthlyPrice: 1200000,
  },
  {
    id: 301,
    facilityId: 7,
    unitTypeId: 30,
    unitTypeName: 'Kho Tiêu Chuẩn L',
    code: 'Q7-FRZ-301',
    floor: 1,
    position: 'Khu A',
    status: 'AVAILABLE',
    monthlyPrice: 1500000,
  },
  {
    id: 101,
    facilityId: 7,
    unitTypeId: 25,
    unitTypeName: 'Kho Máy Lạnh XL',
    code: 'Q7-AC-XL101',
    floor: 1,
    position: 'Khu B',
    status: 'AVAILABLE',
    monthlyPrice: 2200000,
  },
  {
    id: 201,
    facilityId: 7,
    unitTypeId: 20,
    unitTypeName: 'Kho Máy Lạnh M',
    code: 'Q7-M201',
    floor: 2,
    position: 'Khu B',
    status: 'OCCUPIED',
    monthlyPrice: 1200000,
  },
];

describe('FacilityFloorPlanMapModal — Enterprise B2B Redesign (High Data Density)', () => {
  afterEach(() => {
    cleanup();
  });

  it('xóa toàn bộ Floating Badges (-top-2/-top-2.5), xóa chữ TRỐNG lặp lại trên ô trống và dùng bo góc Enterprise (rounded-md, viền 1px)', () => {
    render(
      <FacilityFloorPlanMapModal
        isOpen={true}
        onClose={() => {}}
        facilityId={7}
        facilityName="Cơ sở Quận 7 - TP.HCM"
        highlightUnitId={501}
        allowedUnitTypeId={20}
        targetUnitTypeName="Kho Máy Lạnh M"
        onSelectUnit={() => {}}
        initialUnits={mockUnits}
      />
    );

    const maintTile = screen.getByTestId('unit-tile-Q7-STD-501');
    const emptyTile = screen.getByTestId('unit-tile-Q7-FRZ-301');
    const upgradeTile = screen.getByTestId('unit-tile-Q7-AC-XL101');

    // Không còn Floating Badges đè lên viền thẻ
    expect(maintTile.innerHTML).not.toMatch(/-top-2|-top-2\.5/);
    expect(upgradeTile.innerHTML).not.toMatch(/-top-2|-top-2\.5/);

    // Không còn ring-4 / scale-105 phô trương
    expect(maintTile.className).not.toContain('ring-4');
    expect(maintTile.className).not.toContain('scale-105');

    // Bo góc chuẩn Enterprise (rounded-md), viền 1px rõ ràng
    expect(emptyTile.className).toContain('rounded-md');
    expect(maintTile.className).toContain('rounded-md');
    expect(upgradeTile.className).toContain('rounded-md');

    // Ô trống KHÔNG lặp lại chữ "TRỐNG", ô bảo trì vẫn hiện "BẢO TRÌ"
    expect(emptyTile.textContent).not.toMatch(/TRỐNG/i);
    expect(upgradeTile.textContent).not.toMatch(/TRỐNG/i);
    expect(maintTile.textContent).toMatch(/BẢO TRÌ/i);
    expect(maintTile.textContent).toContain('Ô bàn giao');
    expect(upgradeTile.textContent).toContain('Nâng hạng');
  });

  it('làm nổi bật Tab Tầng active bằng màu Primary đậm, đặt Legend gần lưới (phía trên Grid) và tinh gọn dropdown bộ lọc', () => {
    render(
      <FacilityFloorPlanMapModal
        isOpen={true}
        onClose={() => {}}
        facilityId={7}
        facilityName="Cơ sở Quận 7 - TP.HCM"
        highlightUnitId={501}
        allowedUnitTypeId={20}
        targetUnitTypeName="Kho Máy Lạnh M"
        onSelectUnit={() => {}}
        initialUnits={mockUnits}
      />
    );

    // Tab Tầng 1 active dùng nền Primary đậm (bg-emerald-700 text-white)
    const floor1Btn = screen.getByRole('button', { name: /Tầng 1/i });
    expect(floor1Btn.className).toContain('bg-emerald-700');
    expect(floor1Btn.className).toContain('text-white');

    // Dropdown bộ lọc sạch, không nhồi "(3)" vào label chính "Tất cả trạng thái"
    const filterSelect = screen.getByLabelText(/Lọc trạng thái ô kho/i) as HTMLSelectElement;
    expect(filterSelect.options[0].textContent).toBe('Tất cả trạng thái');

    // Legend nằm ngay phía trên khu vực lưới (trước unit-tile trong thứ tự DOM)
    const legend = screen.getByTestId('floorplan-legend');
    const firstTile = screen.getByTestId('unit-tile-Q7-STD-501');
    expect(
      Boolean(legend.compareDocumentPosition(firstTile) & Node.DOCUMENT_POSITION_FOLLOWING)
    ).toBe(true);
  });
});
