// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { FacilityFloorPlanMapModal } from '../FacilityFloorPlanMapModal';
import type { StorageUnitResponse } from '@/types/unit';

vi.mock('@/api/unit', () => ({
  fetchUnitTypes: vi.fn(async () => ({ content: [] })),
  fetchStorageUnits: vi.fn(async () => ({ content: [] })),
}));

const unit: StorageUnitResponse = {
  id: 101,
  facilityId: 1,
  unitTypeId: 10,
  unitTypeName: 'Kho Nhỏ (4m²)',
  code: 'CG-S101',
  floor: 1,
  position: 'Khu A',
  status: 'AVAILABLE',
  monthlyPrice: 800000,
};

describe('FacilityFloorPlanMapModal hook order', () => {
  it('mở lại cùng instance khi isOpen từ false sang true không làm lệch số hook', () => {
    const props = {
      onClose: () => {},
      facilityId: 1,
      facilityName: 'Cơ sở Cầu Giấy',
      initialUnits: [unit],
    };
    const { rerender } = render(<FacilityFloorPlanMapModal isOpen={false} {...props} />);
    expect(() => {
      rerender(<FacilityFloorPlanMapModal isOpen {...props} />);
    }).not.toThrow();
  });
});
