// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { FacilityPriceTable } from '../FacilityPriceTable';
import { PriceUpdateDrawer } from '../PriceUpdateDrawer';

const mockUnitTypes: any[] = [
  {
    id: 1,
    name: 'Kho Mini 4m²',
    description: 'Phù hợp lưu đồ cá nhân dài hạn với kích thước nhỏ gọn tiêu chuẩn',
    monthlyPrice: 1200000,
    pricePerM2: 300000,
    areaM2: 4,
    totalUnits: 12,
  },
];

describe('FacilityPriceTable & PriceUpdateDrawer Enterprise Polish', () => {
  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  it('right-aligns all numeric columns, uses compact rows, text-link Edit, and muted Trash icon for Delete', () => {
    render(
      <BrowserRouter>
        <FacilityPriceTable
          unitTypes={mockUnitTypes}
          facilityName="Cơ sở Cầu Giấy"
          selectedFacilityId={1}
          onOpenPriceModal={vi.fn()}
          onOpenBulkPriceModal={vi.fn()}
          onDelete={vi.fn()}
        />
      </BrowserRouter>
    );

    // Numeric columns strictly right-aligned with tabular-nums
    for (const label of ['Diện tích (m²)', 'Đơn giá (₫/m²)', 'Giá thuê (₫/tháng)', 'Tổng ô kho (ô)']) {
      const th = screen.getByText(label).closest('th');
      expect(th?.className).toContain('text-right');
    }

    const totalUnits = screen.getByText('12').closest('td');
    expect(totalUnits?.className).toContain('text-right');
    expect(totalUnits?.className).toContain('tabular-nums');
    expect(totalUnits?.className).toContain('py-2');

    // Text-link primary "Đổi giá" (no heavy box border)
    const editBtn = screen.getByRole('button', { name: /Đổi giá/i });
    expect(editBtn.className).toContain('text-brand-600');
    expect(editBtn.className).not.toContain('border');

    // Muted Trash icon button for "Xóa"
    const deleteBtn = screen.getByRole('button', { name: /Xóa/i });
    expect(deleteBtn.querySelector('svg')).not.toBeNull();

    // Footer audit history link
    const auditBtn = screen.getByRole('link', { name: /Xem nhật ký kiểm toán giá/i });
    expect(auditBtn).toBeInTheDocument();
    expect(auditBtn.className).toContain('border');
  });

  it('renders light full-width sticky Bulk Action Bar (not dark slate-900 pill) when rows are selected', () => {
    render(
      <BrowserRouter>
        <FacilityPriceTable
          unitTypes={mockUnitTypes}
          facilityName="Cơ sở Cầu Giấy"
          selectedFacilityId={1}
          onOpenPriceModal={vi.fn()}
          onOpenBulkPriceModal={vi.fn()}
          onDelete={vi.fn()}
        />
      </BrowserRouter>
    );

    const checkbox = screen.getAllByRole('checkbox')[1];
    fireEvent.click(checkbox);

    const bulkBtn = screen.getByRole('button', { name: /Cập nhật giá hàng loạt/i });
    expect(bulkBtn.className).toContain('bg-brand-600');

    const selectedText = screen.getByText(/Đã chọn/i);
    const bar = selectedText.closest('div')?.parentElement;
    expect(bar?.className).toContain('bg-white');
    expect(bar?.className).not.toContain('bg-slate-900');
  });

  it('PriceUpdateDrawer right-aligns price input, styles equivalent helper as muted italic, and uses 6px rounded primary save button', () => {
    render(
      <PriceUpdateDrawer
        isOpen={true}
        onClose={vi.fn()}
        facilityName="Cơ sở Cầu Giấy"
        unitType={mockUnitTypes[0]}
        onConfirmSingle={vi.fn()}
      />
    );

    const priceInput = screen.getByPlaceholderText('VD: 800,000');
    expect(priceInput.className).toContain('text-right');
    expect(priceInput.className).toContain('tabular-nums');

    const equivalent = screen.getByText(/Tương đương:/i);
    expect(equivalent.className).toContain('italic');
    expect(equivalent.className).toContain('text-gray-500');

    const saveBtn = screen.getByRole('button', { name: /Lưu đơn giá mới/i });
    expect(saveBtn.className).toContain('bg-brand-600');
    expect(saveBtn.className).toContain('rounded-md');
  });
});
