import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { FacilityCard } from '../FacilityCard';
import type { FacilityListItem } from '@/types';

describe('FacilityCard component', () => {
  const mockFacility: FacilityListItem = {
    id: 1,
    code: 'FAC-CG',
    name: 'Cơ sở Cầu Giấy',
    address: '123 Đường Cầu Giấy, Hà Nội',
    phone: '0987654321',
    description: 'Cơ sở hiện đại',
    openingHours: '08:00 - 20:00',
    isActive: true,
    createdAt: '2026-01-01',
  };

  it('Render chính xác tên cơ sở, mã cơ sở, địa chỉ và số điện thoại', () => {
    const html = renderToString(
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
    );

    expect(html).toContain('Cơ sở Cầu Giấy');
    expect(html).toContain('FAC-CG');
    expect(html).toContain('123 Đường Cầu Giấy');
    expect(html).toContain('0987654321');
    expect(html).toContain('17');
    expect(html).toContain('4');
    expect(html).toContain('10');
    expect(html).toMatch(/23\.5(?:<!-- -->)?%/);
    expect(html).toContain('Vào quản lý cơ sở');
  });
});
