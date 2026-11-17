// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { StorageUnitFloorPlanView } from '../StorageUnitFloorPlanView';
import type { StorageUnitResponse } from '@/types/unit';

const mockUnits: StorageUnitResponse[] = [
  {
    id: 1,
    facilityId: 9,
    unitTypeId: 5,
    unitTypeName: 'Kho Máy Lạnh L',
    code: 'HP-AC-L101',
    floor: 1,
    position: 'Khu D',
    locationNote: 'Sàn sạch sẽ, sẵn sàng cho thuê',
    status: 'AVAILABLE',
    isActive: true,
  },
  {
    id: 2,
    facilityId: 9,
    unitTypeId: 6,
    unitTypeName: 'Kho Máy Lạnh XL',
    code: 'HP-AC-XL101',
    floor: 1,
    position: 'Khu D',
    status: 'AVAILABLE',
    isActive: true,
  },
  {
    id: 3,
    facilityId: 9,
    unitTypeId: 7,
    unitTypeName: 'Kho Tiêu Chuẩn S',
    code: 'HP-S102',
    floor: 1,
    position: 'Khu A',
    status: 'MAINTENANCE',
    isActive: true,
  },
  {
    id: 4,
    facilityId: 9,
    unitTypeId: 5,
    unitTypeName: 'Kho Máy Lạnh L',
    code: 'HP-AC-L201',
    floor: 2,
    position: 'Khu B',
    status: 'AVAILABLE',
    isActive: true,
  },
];

describe('StorageUnitFloorPlanView — Enterprise SaaS Redesign (Anti Green Overload & Box Soup)', () => {
  afterEach(() => {
    cleanup();
  });

  it('bỏ lạm dụng màu xanh lá trên ô kho: ô bình thường nền trắng viền xám, ô đang chọn nền brand-50 viền brand-500', () => {
    render(
      <StorageUnitFloorPlanView
        units={mockUnits}
        currentUnitTypeId={5}
        currentUnitTypeName="Kho Máy Lạnh L"
        facilityName="Cơ sở Cảng Đình Vũ - Hải Phòng"
      />
    );

    const tile1 = screen.getByTestId('unit-tile-HP-AC-L101');
    const tile2 = screen.getByTestId('unit-tile-HP-AC-XL101');

    // Ô trống bình thường dùng nền trắng, viền xám (không ngập màu xanh lá)
    expect(tile2.className).toContain('bg-white');
    expect(tile2.className).toContain('border-gray-200');
    expect(tile2.className).not.toContain('bg-emerald-50');
    expect(tile2.className).not.toContain('border-emerald-300');

    // Chọn ô kho HP-AC-L101 -> dùng nền brand-50 + viền brand-500, tuyệt đối không dùng bg-emerald-600
    fireEvent.click(tile1);
    expect(tile1.className).toContain('bg-brand-50');
    expect(tile1.className).toContain('border-brand-500');
    expect(tile1.className).not.toContain('bg-emerald-600');
  });

  it('xóa khối Cầu thang màu tím to đùng, chuyển thành Điểm neo nhỏ gọn ở góc sơ đồ và vẫn đổi tầng khi click', () => {
    const { container } = render(
      <StorageUnitFloorPlanView
        units={mockUnits}
        currentUnitTypeId={5}
        currentUnitTypeName="Kho Máy Lạnh L"
        facilityName="Cơ sở Cảng Đình Vũ - Hải Phòng"
      />
    );

    const landmark = screen.getByTestId('interactive-staircase-hub');
    expect(landmark.className).not.toContain('from-indigo-50');
    expect(landmark.className).not.toContain('to-purple-50');
    expect(container.innerHTML).not.toContain('bg-indigo-600');

    // Click Điểm neo vẫn hỗ trợ chuyển sang Tầng 2
    fireEvent.click(landmark);
    expect(screen.getByTestId('unit-tile-HP-AC-L201')).toBeInTheDocument();
  });

  it('làm phẳng Bottom Inspector Panel (không hộp xanh lồng hộp, không badge đen) và đồng bộ 2 nút Bảo trì & Chi tiết', () => {
    const onSelectUnit = vi.fn();
    const onStatusChange = vi.fn();

    render(
      <StorageUnitFloorPlanView
        units={mockUnits}
        currentUnitTypeId={5}
        currentUnitTypeName="Kho Máy Lạnh L"
        facilityName="Cơ sở Cảng Đình Vũ - Hải Phòng"
        onSelectUnit={onSelectUnit}
        onStatusChange={onStatusChange}
      />
    );

    fireEvent.click(screen.getByTestId('unit-tile-HP-AC-L101'));
    const drawer = screen.getByTestId('selected-unit-inspector-drawer');

    // Không còn ô mã kho màu đen và không còn khung xanh lồng bên trong
    expect(drawer.innerHTML).not.toContain('bg-slate-900');
    expect(drawer.innerHTML).not.toContain('bg-emerald-50/70');
    expect(drawer.innerHTML).not.toContain('bg-purple-50/80');

    const maintBtn = screen.getByRole('button', { name: /Đưa vào bảo trì/i });
    const detailBtn = screen.getByRole('button', { name: /Chi tiết ô kho/i });

    expect(maintBtn.className).toContain('bg-white');
    expect(maintBtn.className).toContain('border-rose-300');
    expect(maintBtn.className).toContain('text-rose-600');

    expect(detailBtn.className).toContain('bg-brand-600');
    expect(detailBtn.className).toContain('text-white');

    fireEvent.click(detailBtn);
    expect(onSelectUnit).toHaveBeenCalledWith(expect.objectContaining({ code: 'HP-AC-L101' }));
  });
});
