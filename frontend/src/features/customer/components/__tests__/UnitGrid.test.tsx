import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { UnitGrid } from '../UnitGrid';
import type { StorageUnit } from '../../types';

describe('UnitGrid component', () => {
  const mockSingleFloorUnits: StorageUnit[] = [
    {
      id: '1',
      unitNumber: 'U-101',
      facilityId: '1',
      unitTypeId: '1',
      floor: 1,
      zone: 'Khu A',
      sizeCategory: 'S',
      storageType: 'STANDARD',
      status: 'AVAILABLE',
      dimensions: '1m x 1m x 1.5m',
      areaM2: 1,
      volumeM3: 1.5,
      locationDescription: 'Tầng 1 - Khu A',
      monthlyPrice: 480000,
    },
    {
      id: '2',
      unitNumber: 'U-102',
      facilityId: '1',
      unitTypeId: '1',
      floor: 1,
      zone: 'Khu B',
      sizeCategory: 'S',
      storageType: 'STANDARD',
      status: 'AVAILABLE',
      dimensions: '1m x 1m x 1.5m',
      areaM2: 1,
      volumeM3: 1.5,
      locationDescription: 'Tầng 1 - Khu B',
      monthlyPrice: 480000,
    },
  ];

  const mockMultiFloorUnits: StorageUnit[] = [
    {
      id: '1',
      unitNumber: 'TX-A101',
      facilityId: '2',
      unitTypeId: '1',
      floor: 1,
      zone: 'Khu A',
      sizeCategory: 'S',
      storageType: 'STANDARD',
      status: 'AVAILABLE',
      dimensions: '1m x 1m x 1.5m',
      areaM2: 1,
      volumeM3: 1.5,
      locationDescription: 'Tầng 1 - Khu A',
      monthlyPrice: 480000,
    },
    {
      id: '2',
      unitNumber: 'TX-L201',
      facilityId: '2',
      unitTypeId: '2',
      floor: 2,
      zone: 'Khu B',
      sizeCategory: 'L',
      storageType: 'STANDARD',
      status: 'AVAILABLE',
      dimensions: '3m x 3m x 3m',
      areaM2: 9,
      volumeM3: 27,
      locationDescription: 'Tầng 2 - Khu B',
      monthlyPrice: 2400000,
    },
  ];

  const renderClean = (component: React.ReactElement) => {
    return renderToString(component).replace(/<!--.*?-->/g, '');
  };

  describe('Single-floor Facility (availableFloors.length <= 1)', () => {
    it('ẩn hoàn toàn nhãn TẦNG: và nút Tầng 1 (Trệt)', () => {
      const html = renderClean(
        <UnitGrid
          units={mockSingleFloorUnits}
          selectedUnitId={null}
          onSelectUnit={() => {}}
          facilityName="Kho Cầu Giấy"
        />
      );

      // Không hiển thị nhãn "Tầng:" và không có nút "Tầng 1 (Trệt)"
      expect(html).not.toContain('> Tầng:');
      expect(html).not.toContain('Tầng 1 (Trệt)');

      // Hiển thị bộ lọc Khu vực
      expect(html).toContain('Tất cả khu');
      expect(html).toContain('Khu A');
      expect(html).toContain('Khu B');
    });

    it('hiển thị tiêu đề chuẩn: Sơ đồ mặt bằng — [Tên cơ sở]', () => {
      const html = renderClean(
        <UnitGrid
          units={mockSingleFloorUnits}
          selectedUnitId={null}
          onSelectUnit={() => {}}
          facilityName="Kho Cầu Giấy"
        />
      );

      expect(html).toContain('Sơ đồ mặt bằng — Kho Cầu Giấy');
      expect(html).not.toContain('Mặt bằng Tầng 1 — Kho Cầu Giấy');
    });
  });

  describe('Multi-story Facility (availableFloors.length >= 2)', () => {
    it('hiển thị nút [Tất cả tầng] và danh sách tầng đầy đủ', () => {
      const html = renderClean(
        <UnitGrid
          units={mockMultiFloorUnits}
          selectedUnitId={null}
          onSelectUnit={() => {}}
          facilityName="Cơ sở Thanh Xuân"
        />
      );

      expect(html).toContain('Tầng:');
      expect(html).toContain('Tất cả tầng');
      expect(html).toContain('Tầng 1 (Trệt)');
      expect(html).toContain('Tầng 2');
    });

    it('khi chọn Tất cả tầng (mặc định), tiêu đề hiển thị: Toàn mặt bằng — [Tên cơ sở]', () => {
      const html = renderClean(
        <UnitGrid
          units={mockMultiFloorUnits}
          selectedUnitId={null}
          onSelectUnit={() => {}}
          facilityName="Cơ sở Thanh Xuân"
        />
      );

      expect(html).toContain('Toàn mặt bằng — Cơ sở Thanh Xuân');
    });

    it('hiển thị đầy đủ nhãn vị trí Tầng · Khu trên thẻ ô kho khi cơ sở có nhiều tầng', () => {
      const html = renderClean(
        <UnitGrid
          units={mockMultiFloorUnits}
          selectedUnitId={null}
          onSelectUnit={() => {}}
          facilityName="Cơ sở Thanh Xuân"
        />
      );

      // Thẻ ô kho hiển thị Tầng 1 · Khu A và Tầng 2 · Khu B
      expect(html).toContain('Tầng 1 · Khu A');
      expect(html).toContain('Tầng 2 · Khu B');
    });
  });

  describe('Selected Unit Drawer & Terminology', () => {
    it('chuẩn hóa từ ngữ: hiển thị "Ô kho [Mã]" thay vì "Ngăn kho"', () => {
      const html = renderClean(
        <UnitGrid
          units={mockMultiFloorUnits}
          selectedUnitId="1"
          onSelectUnit={() => {}}
          filterSize="S"
          filterType="STANDARD"
          facilityName="Cơ sở Thanh Xuân"
        />
      );

      expect(html).toContain('Ô kho TX-A101');
      expect(html).not.toContain('Ngăn kho TX-A101');
    });

    it('không hiển thị drawer nếu ô kho đã chọn không khớp với filterSize hoặc filterType', () => {
      // Ô kho 1 là size S, nhưng bộ lọc đang lọc size L
      const html = renderClean(
        <UnitGrid
          units={mockMultiFloorUnits}
          selectedUnitId="1"
          onSelectUnit={() => {}}
          filterSize="L"
          filterType="STANDARD"
          facilityName="Cơ sở Thanh Xuân"
        />
      );

      // Drawer không hiển thị ô TX-A101 khi đang xem cỡ L
      expect(html).not.toContain('Ô kho TX-A101');
      expect(html).not.toContain('Xác nhận ô kho này &amp; Tiếp tục');
    });

    it('đối với cơ sở 1 tầng, thẻ tóm tắt (drawer) không hiển thị tiền tố Tầng 1', () => {
      const html = renderClean(
        <UnitGrid
          units={mockSingleFloorUnits}
          selectedUnitId="1"
          onSelectUnit={() => {}}
          filterSize="S"
          filterType="STANDARD"
          facilityName="Kho Cầu Giấy"
        />
      );

      expect(html).toContain('Ô kho U-101');
      expect(html).not.toContain('Tầng 1 · Khu A');
      expect(html).toContain('Khu A');
    });

    it('nút Tầng 2 không có khoảng trắng thừa ở cuối nhãn', () => {
      const html = renderClean(
        <UnitGrid
          units={mockMultiFloorUnits}
          selectedUnitId={null}
          onSelectUnit={() => {}}
          facilityName="Cơ sở Thanh Xuân"
        />
      );

      // Nút chứa "Tầng 2</button>" chứ không phải "Tầng 2 </button>"
      expect(html).toContain('>Tầng 2</button>');
    });
  });

  describe('Empty State & Quick Actions', () => {
    it('hiển thị nút Xem tất cả khu và thông báo khi không có ô kho phù hợp', () => {
      const html = renderClean(
        <UnitGrid
          units={mockSingleFloorUnits}
          selectedUnitId={null}
          onSelectUnit={() => {}}
          filterSize="XL" // Không có ô kho cỡ XL
          facilityName="Kho Cầu Giấy"
        />
      );

      expect(html).toContain('Không tìm thấy ô kho nào phù hợp với bộ lọc hiện tại.');
      expect(html).toContain('Vui lòng thử chọn &quot;Tất cả khu&quot;');
    });
  });
});
