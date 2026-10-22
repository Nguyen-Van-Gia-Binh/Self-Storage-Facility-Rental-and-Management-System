// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { FacilityPriceTable } from '../FacilityPriceTable';

const mockUnitTypes: any[] = [
  {
    id: 1,
    name: 'Kho Mini 4m²',
    description: 'Phù hợp lưu đồ cá nhân',
    monthlyPrice: 1200000,
    pricePerM2: 300000,
    areaM2: 4,
    totalUnits: 4,
  },
];

describe('FacilityPriceTable UI Polish', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders total units as a badge and audit history as a ghost button', () => {
    render(
      <BrowserRouter>
        <FacilityPriceTable
          unitTypes={mockUnitTypes}
          facilityName="Cơ sở Cầu Giấy"
          selectedFacilityId={1}
          onOpenPriceModal={vi.fn()}
          onOpenBulkPriceModal={vi.fn()}
        />
      </BrowserRouter>
    );

    // Badge tổng ô kho
    const badge = screen.getByText('4 ô');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('rounded-full');

    // Ghost button xem nhật ký kiểm toán ở footer
    const auditBtn = screen.getByRole('link', { name: /Xem nhật ký kiểm toán giá/i });
    expect(auditBtn).toBeInTheDocument();
    expect(auditBtn.className).toContain('border');
  });
});
