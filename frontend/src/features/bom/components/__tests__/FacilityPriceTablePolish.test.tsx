// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
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
    totalUnits: 12,
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

    // Badge tổng ô kho (đã lược bỏ đơn vị vì đã có trên tiêu đề cột)
    const badge = screen.getByText('12');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('rounded-full');

    // Header cột
    expect(screen.getByText('Tổng ô kho (ô)')).toBeInTheDocument();
    expect(screen.getByText('Diện tích (m²)')).toBeInTheDocument();
    expect(screen.getByText('Đơn giá (₫/m²)')).toBeInTheDocument();
    expect(screen.getByText('Giá thuê (₫/tháng)')).toBeInTheDocument();

    // Ghost button xem nhật ký kiểm toán ở footer
    const auditBtn = screen.getByRole('link', { name: /Xem nhật ký kiểm toán giá/i });
    expect(auditBtn).toBeInTheDocument();
    expect(auditBtn.className).toContain('border');
  });

  it('renders floating bulk action bar via portal when a row is selected', () => {
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

    const checkbox = screen.getAllByRole('checkbox')[1];
    fireEvent.click(checkbox);

    expect(screen.getByText(/Cập nhật giá hàng loạt/i)).toBeInTheDocument();
    expect(screen.getByText(/Đã chọn/i)).toBeInTheDocument();
  });
});
